"""Administrar usuarios: the Pro gate, invitations, the invite link, and history (`user-admin`)."""

import datetime as dt
import uuid
from typing import Annotated, Any

import pytest
from fastapi import APIRouter, Depends, FastAPI, status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import HistoryKey, Role
from smartbell.models import HistoryEntry, Invitation, Membership, Ranch
from smartbell.security.permissions import Permission, preset
from smartbell.security.ranch import RanchContext, require
from smartbell.services.invitations import hash_token
from tests.conftest import Account, RanchPair, add_member, sign_up

MEDICO_CODES = preset(Role.MEDICO)


def invite_body(email: str = "vet@example.com", **overrides: object) -> dict[str, object]:
    body: dict[str, object] = {
        "email": email,
        "first_name": "Juan",
        "last_name": "Pérez",
        "role": "MEDICO",
        "permissions": MEDICO_CODES,
    }
    return {**body, **overrides}


async def give_pro(db: AsyncSession, ranch_id: uuid.UUID) -> None:
    ranch = await db.get(Ranch, ranch_id)
    assert ranch is not None
    ranch.plan_id = "pro"
    await db.commit()


async def invite(api: AsyncClient, inviter: Account, **overrides: object) -> dict[str, object]:
    response = await api.post(
        "/api/ranch/invitations", headers=inviter.headers(), json={**invite_body(), **overrides}
    )
    assert response.status_code == 201, response.text
    body: dict[str, object] = response.json()
    return body


def auth(account_uid: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {account_uid}"}


@pytest.fixture
def guarded_app(tenant_app: FastAPI) -> FastAPI:
    probe = APIRouter()

    @probe.post("/api/probe/animals", status_code=status.HTTP_201_CREATED)
    async def create_cow(
        ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_CREATE))],
    ) -> dict[str, str]:
        return {"ranch_id": str(ctx.ranch_id)}

    tenant_app.include_router(probe)
    return tenant_app


# --- The Pro gate -------------------------------------------------------------------------------


async def test_without_pro_inviting_returns_the_upsell_state(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")

    plan = await tenant_api.get("/api/ranch/plan", headers=owner.headers())
    response = await tenant_api.post(
        "/api/ranch/invitations", headers=owner.headers(), json=invite_body()
    )

    assert plan.json() == {"has_pro": False}
    assert response.status_code == 402
    assert response.json()["detail"] == "plan_required"
    assert (await tenant_db.scalars(select(Invitation))).all() == []


async def test_with_pro_the_plan_says_so(tenant_api: AsyncClient, tenant_db: AsyncSession) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)

    plan = await tenant_api.get("/api/ranch/plan", headers=owner.headers())

    assert plan.json() == {"has_pro": True}


# --- The acceptance path ------------------------------------------------------------------------


async def test_owner_invites_a_medico_who_signs_up_and_sees_only_permitted_actions(
    guarded_app: FastAPI, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    created = await invite(tenant_api, owner, email="vet@example.com")
    token = str(created["token"])

    preview = await tenant_api.get(f"/api/invitations/{token}")
    vet = await sign_up(tenant_api, "vet")  # Signs up as vet@example.com.
    accepted = await tenant_api.post(f"/api/invitations/{token}/accept", headers=auth("vet"))

    assert preview.status_code == 200
    assert preview.json() == {
        "ranch_name": "Mi rancho",
        "invited_by": "owner",
        "email": "vet@example.com",
        "role": "MEDICO",
        "status": "pending",
    }
    assert accepted.status_code == 200, accepted.text
    assert accepted.json() == {"ranch_id": str(owner.ranch_id)}

    me = await tenant_api.get("/api/auth/me", headers=auth("vet"))
    joined = next(r for r in me.json()["ranches"] if r["id"] == str(owner.ranch_id))
    assert joined["role"] == "MEDICO"
    assert joined["permissions"] == MEDICO_CODES

    as_vet = vet.headers(owner.ranch_id)
    assert (await tenant_api.post("/api/probe/animals", headers=as_vet)).status_code == 201
    assert (await tenant_api.get("/api/ranch/members", headers=as_vet)).status_code == 200
    refused_invite = await tenant_api.post(
        "/api/ranch/invitations", headers=as_vet, json=invite_body("x@example.com")
    )
    refused_edit = await tenant_api.patch(
        f"/api/ranch/members/{owner.user_id}", headers=as_vet, json={"role": "MEDICO"}
    )
    assert refused_invite.status_code == 403
    assert refused_edit.status_code == 403

    again = await tenant_api.get(f"/api/invitations/{token}")
    assert again.json()["status"] == "accepted"


async def test_the_invite_grants_the_chosen_codes_not_the_preset(
    guarded_app: FastAPI, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    created = await invite(tenant_api, owner, permissions=["ANIMALS_VIEW", "REPORTS_VIEW"])
    vet = await sign_up(tenant_api, "vet")

    await tenant_api.post(f"/api/invitations/{created['token']}/accept", headers=auth("vet"))
    cow = await tenant_api.post("/api/probe/animals", headers=vet.headers(owner.ranch_id))

    membership = await tenant_db.get(Membership, (vet.user_id, owner.ranch_id))
    assert membership is not None
    assert membership.permissions == ["ANIMALS_VIEW", "REPORTS_VIEW"]
    assert cow.status_code == 403


async def test_only_the_hash_of_the_token_is_stored(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    created = await invite(tenant_api, owner)

    stored = (await tenant_db.scalars(select(Invitation))).one()

    assert stored.token_hash == hash_token(str(created["token"]))
    assert str(created["token"]) not in stored.token_hash
    listed = await tenant_api.get("/api/ranch/invitations", headers=owner.headers())
    assert "token" not in listed.json()[0]


# --- Accepting: who and when --------------------------------------------------------------------


async def test_a_forwarded_link_is_useless_to_another_email(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    created = await invite(tenant_api, owner, email="vet@example.com")
    stranger = await sign_up(tenant_api, "stranger")

    response = await tenant_api.post(
        f"/api/invitations/{created['token']}/accept", headers=auth("stranger")
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "email_mismatch"
    assert await tenant_db.get(Membership, (stranger.user_id, owner.ranch_id)) is None


async def test_the_email_matches_regardless_of_case(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    created = await invite(tenant_api, owner, email="Vet@Example.com")
    await sign_up(tenant_api, "vet")

    response = await tenant_api.post(
        f"/api/invitations/{created['token']}/accept", headers=auth("vet")
    )

    assert response.status_code == 200


async def test_an_expired_or_used_link_is_refused(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    used = await invite(tenant_api, owner, email="vet@example.com")
    old = await invite(tenant_api, owner, email="tech@example.com")
    stored = await tenant_db.get(Invitation, uuid.UUID(str(old["id"])))
    assert stored is not None
    stored.expires_at = dt.datetime.now(dt.UTC) - dt.timedelta(minutes=1)
    await tenant_db.commit()
    await sign_up(tenant_api, "vet")
    await sign_up(tenant_api, "tech")
    first = await tenant_api.post(f"/api/invitations/{used['token']}/accept", headers=auth("vet"))

    second = await tenant_api.post(f"/api/invitations/{used['token']}/accept", headers=auth("vet"))
    expired = await tenant_api.post(f"/api/invitations/{old['token']}/accept", headers=auth("tech"))
    preview = await tenant_api.get(f"/api/invitations/{old['token']}")

    assert first.status_code == 200
    assert (second.status_code, second.json()["detail"]) == (409, "invitation_used")
    assert (expired.status_code, expired.json()["detail"]) == (410, "invitation_expired")
    assert preview.json()["status"] == "expired"


async def test_an_unknown_token_is_404(tenant_api: AsyncClient) -> None:
    await sign_up(tenant_api, "vet")
    token = "x" * 43

    preview = await tenant_api.get(f"/api/invitations/{token}")
    accept = await tenant_api.post(f"/api/invitations/{token}/accept", headers=auth("vet"))

    assert preview.status_code == accept.status_code == 404


async def test_accepting_needs_a_signed_in_user(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    created = await invite(tenant_api, owner)

    response = await tenant_api.post(f"/api/invitations/{created['token']}/accept")

    assert response.status_code in (401, 403)


# --- Creating and revoking ----------------------------------------------------------------------


async def test_create_is_refused_without_a_permission(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)

    response = await tenant_api.post(
        "/api/ranch/invitations", headers=owner.headers(), json=invite_body(permissions=[])
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("overrides", "detail"),
    [
        ({"role": "DUENO"}, None),  # Not a member role: 422 from validation.
        ({"role": "NUTRIOLOGO", "permissions": ["ANIMALS_CREATE"]}, "exceeds_role"),
        ({"role": "ADMINISTRADOR", "permissions": ["USERS_DELETE"]}, "exceeds_role"),
        ({"email": "not-an-email"}, None),
    ],
)
async def test_create_respects_the_role_limits(
    tenant_api: AsyncClient,
    tenant_db: AsyncSession,
    overrides: dict[str, object],
    detail: str | None,
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)

    response = await tenant_api.post(
        "/api/ranch/invitations", headers=owner.headers(), json={**invite_body(), **overrides}
    )

    if detail is None:
        assert response.status_code == 422
    else:
        assert response.status_code == 403
        assert response.json()["detail"] == detail


async def test_an_admin_invites_but_a_medico_cannot(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    await give_pro(tenant_db, ranch_pair.ranch_a)
    admin = await sign_up(tenant_api, "admin")
    await add_member(tenant_db, admin, ranch_pair.ranch_a, Role.ADMINISTRADOR)

    by_admin = await tenant_api.post(
        "/api/ranch/invitations", headers=admin.headers(ranch_pair.ranch_a), json=invite_body()
    )
    by_medico = await tenant_api.post(
        "/api/ranch/invitations",
        headers=ranch_pair.member_a.headers(ranch_pair.ranch_a),
        json=invite_body("other@example.com"),
    )

    assert by_admin.status_code == 201
    assert by_medico.status_code == 403
    assert by_medico.json()["detail"] == "permission_denied"


async def test_inviting_a_member_again_is_409(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    await give_pro(tenant_db, ranch_pair.ranch_a)

    response = await tenant_api.post(
        "/api/ranch/invitations",
        headers=ranch_pair.owner.headers(ranch_pair.ranch_a),
        json=invite_body("member-a@example.com"),
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "already_member"


async def test_a_new_invite_replaces_the_pending_one(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    first = await invite(tenant_api, owner)
    second = await invite(tenant_api, owner, role="NUTRIOLOGO", permissions=["ANIMALS_VIEW"])

    listed = await tenant_api.get("/api/ranch/invitations", headers=owner.headers())
    old_link = await tenant_api.get(f"/api/invitations/{first['token']}")

    assert [row["id"] for row in listed.json()] == [second["id"]]
    assert old_link.status_code == 404


async def test_revoking_kills_the_link(tenant_api: AsyncClient, tenant_db: AsyncSession) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    created = await invite(tenant_api, owner)

    revoked = await tenant_api.delete(
        f"/api/ranch/invitations/{created['id']}", headers=owner.headers()
    )
    link = await tenant_api.get(f"/api/invitations/{created['token']}")

    assert revoked.status_code == 204
    assert link.status_code == 404


async def test_another_ranch_cannot_revoke(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    await give_pro(tenant_db, ranch_pair.ranch_a)
    created = await tenant_api.post(
        "/api/ranch/invitations",
        headers=ranch_pair.owner.headers(ranch_pair.ranch_a),
        json=invite_body(),
    )

    response = await tenant_api.delete(
        f"/api/ranch/invitations/{created.json()['id']}",
        headers=ranch_pair.owner.headers(ranch_pair.ranch_b),
    )

    assert response.status_code == 404


# --- History ------------------------------------------------------------------------------------


async def _entries(db: AsyncSession, ranch_id: uuid.UUID) -> list[HistoryEntry]:
    rows = await db.scalars(
        select(HistoryEntry)
        .where(HistoryEntry.ranch_id == ranch_id)
        .order_by(HistoryEntry.created_at, HistoryEntry.id)
    )
    return list(rows)


async def test_add_edit_and_remove_each_write_a_history_entry(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    created = await invite(tenant_api, owner)
    vet = await sign_up(tenant_api, "vet")
    await tenant_api.post(f"/api/invitations/{created['token']}/accept", headers=auth("vet"))
    url = f"/api/ranch/members/{vet.user_id}"

    await tenant_api.patch(url, headers=owner.headers(), json={"role": "NUTRIOLOGO"})
    await tenant_api.delete(url, headers=owner.headers())

    entries = await _entries(tenant_db, owner.ranch_id)
    assert [e.event_key for e in entries] == [
        HistoryKey.USERS_ADDED,
        HistoryKey.USERS_EDITED,
        HistoryKey.USERS_REMOVED,
    ]
    assert all(e.user_id == owner.user_id for e in entries)
    assert all(e.refs == {"user_ids": [str(vet.user_id)]} for e in entries)


async def test_deleting_a_user_keeps_their_history_entries(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = ranch_pair.owner.headers(ranch_pair.ranch_a)
    admin = await sign_up(tenant_api, "admin")
    await add_member(tenant_db, admin, ranch_pair.ranch_a, Role.ADMINISTRADOR)
    # The admin does something that is recorded under their name.
    await tenant_api.patch(
        f"/api/ranch/members/{ranch_pair.member_a.user_id}",
        headers=admin.headers(ranch_pair.ranch_a),
        json={"role": "NUTRIOLOGO"},
    )

    removed = await tenant_api.delete(f"/api/ranch/members/{admin.user_id}", headers=owner)

    assert removed.status_code == 204
    assert await tenant_db.get(Membership, (admin.user_id, ranch_pair.ranch_a)) is None
    by_admin = [
        e for e in await _entries(tenant_db, ranch_pair.ranch_a) if e.user_id == admin.user_id
    ]
    assert [e.event_key for e in by_admin] == [HistoryKey.USERS_EDITED]
    access = await tenant_api.get("/api/ranch/members", headers=admin.headers(ranch_pair.ranch_a))
    assert access.status_code == 403


async def test_only_the_dueno_deletes_users(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    admin = await sign_up(tenant_api, "admin")
    await add_member(tenant_db, admin, ranch_pair.ranch_a, Role.ADMINISTRADOR)

    response = await tenant_api.delete(
        f"/api/ranch/members/{ranch_pair.member_a.user_id}",
        headers=admin.headers(ranch_pair.ranch_a),
    )

    assert response.status_code == 403


async def test_members_list_carries_last_activity(
    ranch_pair: RanchPair, tenant_api: AsyncClient
) -> None:
    response = await tenant_api.get(
        "/api/ranch/members", headers=ranch_pair.owner.headers(ranch_pair.ranch_a)
    )

    assert all("last_active_at" in row for row in response.json())
    assert all(row["last_active_at"] is not None for row in response.json())


async def test_role_presets_follow_the_matrix(tenant_api: AsyncClient) -> None:
    await sign_up(tenant_api, "owner")

    response = await tenant_api.get("/api/role-presets", headers=auth("owner"))

    assert response.status_code == 200
    assert {row["role"]: row["permissions"] for row in response.json()} == {
        role.value: preset(role) for role in Role
    }


# --- An invite is only as good as its sender now -----------------------------------------------


async def test_a_removed_inviters_invite_no_longer_works(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    await give_pro(tenant_db, ranch_pair.ranch_a)
    admin = await sign_up(tenant_api, "admin")
    await add_member(tenant_db, admin, ranch_pair.ranch_a, Role.ADMINISTRADOR)
    created = await invite(tenant_api, Account(admin.uid, admin.user_id, ranch_pair.ranch_a))
    await tenant_api.delete(
        f"/api/ranch/members/{admin.user_id}", headers=ranch_pair.owner.headers(ranch_pair.ranch_a)
    )
    await sign_up(tenant_api, "vet")

    response = await tenant_api.post(
        f"/api/invitations/{created['token']}/accept", headers=auth("vet")
    )

    assert (response.status_code, response.json()["detail"]) == (410, "invitation_revoked")


async def test_a_trimmed_inviters_invite_no_longer_works(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    await give_pro(tenant_db, ranch_pair.ranch_a)
    admin = await sign_up(tenant_api, "admin")
    await add_member(tenant_db, admin, ranch_pair.ranch_a, Role.ADMINISTRADOR)
    created = await invite(tenant_api, Account(admin.uid, admin.user_id, ranch_pair.ranch_a))
    trimmed = [c for c in preset(Role.ADMINISTRADOR) if c != Permission.ANIMALS_DELETE.value]
    await tenant_api.patch(
        f"/api/ranch/members/{admin.user_id}",
        headers=ranch_pair.owner.headers(ranch_pair.ranch_a),
        json={"permissions": trimmed},
    )
    await sign_up(tenant_api, "vet")

    response = await tenant_api.post(
        f"/api/invitations/{created['token']}/accept", headers=auth("vet")
    )

    assert (response.status_code, response.json()["detail"]) == (410, "invitation_revoked")


async def test_an_invite_needs_pro_still_when_accepted(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    created = await invite(tenant_api, owner)
    ranch = await tenant_db.get(Ranch, owner.ranch_id)
    assert ranch is not None
    ranch.plan_id = None
    await tenant_db.commit()
    await sign_up(tenant_api, "vet")

    response = await tenant_api.post(
        f"/api/invitations/{created['token']}/accept", headers=auth("vet")
    )

    assert (response.status_code, response.json()["detail"]) == (402, "plan_required")


async def test_losing_an_accept_race_is_409_not_500(
    tenant_api: AsyncClient, tenant_db: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The other tab made the membership between this one's read and its insert."""
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    created = await invite(tenant_api, owner)
    vet = await sign_up(tenant_api, "vet")
    await add_member(tenant_db, vet, owner.ranch_id, Role.MEDICO)  # The winning tab.
    original_get = AsyncSession.get

    async def stale_get(self: AsyncSession, entity: Any, ident: Any, **kw: Any) -> Any:
        if entity is Membership and ident == (vet.user_id, owner.ranch_id):
            return None  # What this tab read before the other one committed.
        return await original_get(self, entity, ident, **kw)

    monkeypatch.setattr(AsyncSession, "get", stale_get)

    response = await tenant_api.post(
        f"/api/invitations/{created['token']}/accept", headers=auth("vet")
    )

    assert (response.status_code, response.json()["detail"]) == (409, "invitation_used")


async def test_accepting_needs_a_verified_email(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    """A forwarded link plus an unconfirmed sign-up with the invitee's address isn't enough."""
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    created = await invite(tenant_api, owner, email="unverified-vet@example.com")
    squatter = await sign_up(tenant_api, "unverified-vet")

    response = await tenant_api.post(
        f"/api/invitations/{created['token']}/accept", headers=auth("unverified-vet")
    )
    preview = await tenant_api.get(f"/api/invitations/{created['token']}")

    assert (response.status_code, response.json()["detail"]) == (403, "email_unverified")
    assert await tenant_db.get(Membership, (squatter.user_id, owner.ranch_id)) is None
    assert preview.json()["status"] == "pending"  # Still usable once the email is confirmed.


async def test_two_invites_to_one_email_at_once_leave_one(
    tenant_api: AsyncClient, tenant_db: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The second request's delete ran before the first committed, so it saw nothing to replace."""
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    await invite(tenant_api, owner)
    original_execute = AsyncSession.execute

    async def stale_execute(self: AsyncSession, statement: Any, *args: Any, **kw: Any) -> Any:
        if getattr(statement, "is_delete", False) and statement.table.name == "invitations":
            return None  # What this request saw before the other one committed.
        return await original_execute(self, statement, *args, **kw)

    monkeypatch.setattr(AsyncSession, "execute", stale_execute)

    response = await tenant_api.post(
        "/api/ranch/invitations", headers=owner.headers(), json=invite_body()
    )

    assert (response.status_code, response.json()["detail"]) == (409, "invitation_pending")
    monkeypatch.undo()
    listed = await tenant_api.get("/api/ranch/invitations", headers=owner.headers())
    assert len(listed.json()) == 1


async def test_a_dead_senders_invite_reads_revoked_and_leaves_the_list(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    await give_pro(tenant_db, ranch_pair.ranch_a)
    admin = await sign_up(tenant_api, "admin")
    await add_member(tenant_db, admin, ranch_pair.ranch_a, Role.ADMINISTRADOR)
    created = await invite(tenant_api, Account(admin.uid, admin.user_id, ranch_pair.ranch_a))
    owner_headers = ranch_pair.owner.headers(ranch_pair.ranch_a)
    await tenant_api.delete(f"/api/ranch/members/{admin.user_id}", headers=owner_headers)

    preview = await tenant_api.get(f"/api/invitations/{created['token']}")
    listed = await tenant_api.get("/api/ranch/invitations", headers=owner_headers)

    assert preview.json()["status"] == "revoked"
    assert listed.json() == []


async def test_accepting_as_an_existing_member_is_refused_and_keeps_the_invite(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    """Accepting would not apply the invited role, so it must not pretend to."""
    owner = await sign_up(tenant_api, "owner")
    await give_pro(tenant_db, owner.ranch_id)
    created = await invite(tenant_api, owner)
    vet = await sign_up(tenant_api, "vet")
    await add_member(tenant_db, vet, owner.ranch_id, Role.TECNICO_CAMPO)

    response = await tenant_api.post(
        f"/api/invitations/{created['token']}/accept", headers=auth("vet")
    )

    assert (response.status_code, response.json()["detail"]) == (409, "already_member")
    membership = await tenant_db.get(Membership, (vet.user_id, owner.ranch_id))
    assert membership is not None and membership.role is Role.TECNICO_CAMPO
    invitation = await tenant_db.scalar(
        select(Invitation).where(Invitation.token_hash == hash_token(str(created["token"])))
    )
    assert invitation is not None and invitation.accepted_at is None


async def test_one_open_invite_per_email_is_enforced_by_the_database(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    for n in range(2):
        tenant_db.add(
            Invitation(
                id=uuid.uuid4(),
                ranch_id=owner.ranch_id,
                email="vet@example.com",
                first_name="Juan",
                role=Role.MEDICO,
                permissions=MEDICO_CODES,
                token_hash=f"{n:064d}",
                expires_at=dt.datetime.now(dt.UTC) + dt.timedelta(days=7),
            )
        )
    with pytest.raises(IntegrityError):
        await tenant_db.commit()
    await tenant_db.rollback()
