"""Ranches, memberships and the permission guard (`require`)."""

import uuid
from typing import Annotated

import pytest
from fastapi import APIRouter, Depends, FastAPI, status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import Role
from smartbell.models import Membership, Ranch, RanchSettings
from smartbell.security.permissions import ROLE_PRESETS, Permission, preset
from smartbell.security.ranch import RanchContext, require
from smartbell.services import ranches
from tests.conftest import Account, RanchPair, add_member, sign_up


@pytest.fixture
def guarded_app(tenant_app: FastAPI) -> FastAPI:
    """A stand-in for the cow endpoint of `animal-api`, guarded the way it will be."""
    probe = APIRouter()

    @probe.post("/api/probe/animals", status_code=status.HTTP_201_CREATED)
    async def create_cow(
        ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_CREATE))],
    ) -> dict[str, str]:
        return {"ranch_id": str(ctx.ranch_id)}

    tenant_app.include_router(probe)
    return tenant_app


async def _member_with_role(
    api: AsyncClient, db: AsyncSession, owner: Account, role: Role
) -> Account:
    member = await sign_up(api, f"member-{role.value.lower()}")
    if role is not Role.DUENO:
        await add_member(db, member, owner.ranch_id, role)
    return member


# --- The guard --------------------------------------------------------------------------------


@pytest.mark.parametrize("role", list(Role))
async def test_cow_creation_follows_the_matrix(
    guarded_app: FastAPI, tenant_api: AsyncClient, tenant_db: AsyncSession, role: Role
) -> None:
    owner = await sign_up(tenant_api, "owner")
    caller = (
        owner if role is Role.DUENO else await _member_with_role(tenant_api, tenant_db, owner, role)
    )

    response = await tenant_api.post("/api/probe/animals", headers=caller.headers(owner.ranch_id))

    expected = 201 if Permission.ANIMALS_CREATE in ROLE_PRESETS[role] else 403
    assert response.status_code == expected, response.text
    if expected == 201:
        assert response.json() == {"ranch_id": str(owner.ranch_id)}
    else:
        assert response.json()["detail"] == "permission_denied"


async def test_tecnico_gets_403_and_medico_gets_201(
    guarded_app: FastAPI, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    tecnico = await _member_with_role(tenant_api, tenant_db, owner, Role.TECNICO_CAMPO)
    medico = await _member_with_role(tenant_api, tenant_db, owner, Role.MEDICO)

    denied = await tenant_api.post("/api/probe/animals", headers=tecnico.headers(owner.ranch_id))
    allowed = await tenant_api.post("/api/probe/animals", headers=medico.headers(owner.ranch_id))

    assert denied.status_code == 403
    assert allowed.status_code == 201


async def test_the_guard_needs_the_ranch_header(
    guarded_app: FastAPI, tenant_api: AsyncClient
) -> None:
    owner = await sign_up(tenant_api, "owner")

    response = await tenant_api.post(
        "/api/probe/animals", headers={"Authorization": f"Bearer {owner.uid}"}
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "ranch_required"


async def test_a_malformed_ranch_header_is_422(
    guarded_app: FastAPI, tenant_api: AsyncClient
) -> None:
    owner = await sign_up(tenant_api, "owner")
    headers = {**owner.headers(), "X-Ranch-Id": "not-a-uuid"}

    response = await tenant_api.post("/api/probe/animals", headers=headers)

    assert response.status_code == 422


async def test_another_ranch_and_a_missing_ranch_get_the_same_403(
    guarded_app: FastAPI, tenant_api: AsyncClient
) -> None:
    owner = await sign_up(tenant_api, "owner")
    stranger = await sign_up(tenant_api, "stranger")

    theirs = await tenant_api.post("/api/probe/animals", headers=stranger.headers(owner.ranch_id))
    missing = await tenant_api.post("/api/probe/animals", headers=stranger.headers(uuid.uuid4()))

    assert theirs.status_code == missing.status_code == 403
    assert theirs.json() == missing.json() == {"detail": "not_a_member"}


async def test_the_guard_needs_a_signed_in_user(
    guarded_app: FastAPI, tenant_api: AsyncClient
) -> None:
    response = await tenant_api.post(
        "/api/probe/animals", headers={"X-Ranch-Id": str(uuid.uuid4())}
    )

    assert response.status_code in (401, 403)  # HTTPBearer's own refusal, before any ranch check.


async def test_edited_permissions_apply_on_the_next_request(
    guarded_app: FastAPI, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    tecnico = await _member_with_role(tenant_api, tenant_db, owner, Role.TECNICO_CAMPO)
    url = f"/api/ranch/members/{tecnico.user_id}"
    granted = [*preset(Role.TECNICO_CAMPO), Permission.ANIMALS_CREATE.value]

    edit = await tenant_api.patch(url, headers=owner.headers(), json={"permissions": granted})
    after = await tenant_api.post("/api/probe/animals", headers=tecnico.headers(owner.ranch_id))

    assert edit.status_code == 200, edit.text
    assert after.status_code == 201


# --- Ranches ----------------------------------------------------------------------------------


async def test_sign_up_makes_the_owner_a_dueno_with_every_permission(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")

    me = await tenant_api.get("/api/auth/me", headers=owner.headers())
    membership = await tenant_db.get(Membership, (owner.user_id, owner.ranch_id))

    [ranch] = me.json()["ranches"]
    assert ranch["role"] == "DUENO"
    assert ranch["permissions"] == [code.value for code in Permission]
    assert membership is not None
    assert membership.permissions == preset(Role.DUENO)


async def test_create_ranch_makes_the_caller_its_dueno(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")

    response = await tenant_api.post(
        "/api/ranches", headers=owner.headers(), json={"name": "  El Bigotes  "}
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["name"] == "El Bigotes"
    assert body["role"] == "DUENO"
    ranch_id = uuid.UUID(body["id"])
    ranch = await tenant_db.get(Ranch, ranch_id)
    assert ranch is not None
    assert ranch.owner_user_id == owner.user_id
    assert await tenant_db.get(RanchSettings, ranch_id) is not None
    listed = await tenant_api.get("/api/ranches", headers=owner.headers())
    assert {r["name"] for r in listed.json()} == {"Mi rancho", "El Bigotes"}


@pytest.mark.parametrize("body", [{"name": ""}, {"name": "   "}, {"name": "x" * 121}, {}])
async def test_create_ranch_validates_the_name(
    tenant_api: AsyncClient, body: dict[str, str]
) -> None:
    owner = await sign_up(tenant_api, "owner")

    response = await tenant_api.post("/api/ranches", headers=owner.headers(), json=body)

    assert response.status_code == 422


async def test_ranch_creation_is_capped(
    tenant_api: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(ranches, "MAX_OWNED_RANCHES", 2)
    owner = await sign_up(tenant_api, "owner")  # Mi rancho is the first.

    second = await tenant_api.post("/api/ranches", headers=owner.headers(), json={"name": "B"})
    third = await tenant_api.post("/api/ranches", headers=owner.headers(), json={"name": "C"})

    assert second.status_code == 201
    assert third.status_code == 409
    assert third.json()["detail"] == "ranch_limit"


async def test_ranches_lists_only_the_callers_with_their_role(
    ranch_pair: RanchPair, tenant_api: AsyncClient
) -> None:
    response = await tenant_api.get("/api/ranches", headers=ranch_pair.member_a.headers())

    ids = {(r["id"], r["role"]) for r in response.json()}
    assert ids == {
        (str(ranch_pair.member_a.ranch_id), "DUENO"),
        (str(ranch_pair.ranch_a), "MEDICO"),
    }


# --- Members ----------------------------------------------------------------------------------


async def test_members_lists_the_active_ranch(
    ranch_pair: RanchPair, tenant_api: AsyncClient
) -> None:
    response = await tenant_api.get(
        "/api/ranch/members", headers=ranch_pair.member_a.headers(ranch_pair.ranch_a)
    )

    assert response.status_code == 200
    rows = {row["user_id"]: row for row in response.json()}
    assert set(rows) == {str(ranch_pair.owner.user_id), str(ranch_pair.member_a.user_id)}
    assert rows[str(ranch_pair.owner.user_id)]["is_owner"] is True
    assert rows[str(ranch_pair.member_a.user_id)]["role"] == "MEDICO"


async def test_role_change_resets_the_preset(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    url = f"/api/ranch/members/{ranch_pair.member_a.user_id}"

    response = await tenant_api.patch(
        url, headers=ranch_pair.owner.headers(ranch_pair.ranch_a), json={"role": "NUTRIOLOGO"}
    )

    assert response.status_code == 200, response.text
    assert response.json()["role"] == "NUTRIOLOGO"
    assert response.json()["permissions"] == preset(Role.NUTRIOLOGO)


async def test_nobody_can_be_made_dueno(ranch_pair: RanchPair, tenant_api: AsyncClient) -> None:
    url = f"/api/ranch/members/{ranch_pair.member_a.user_id}"

    response = await tenant_api.patch(
        url, headers=ranch_pair.owner.headers(ranch_pair.ranch_a), json={"role": "DUENO"}
    )

    assert response.status_code == 422


async def test_an_admin_cannot_grant_what_they_lack(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    admin = await sign_up(tenant_api, "admin")
    await add_member(tenant_db, admin, ranch_pair.ranch_a, Role.ADMINISTRADOR)
    url = f"/api/ranch/members/{ranch_pair.member_a.user_id}"

    billing = await tenant_api.patch(
        url, headers=admin.headers(ranch_pair.ranch_a), json={"permissions": ["BILLING"]}
    )
    to_admin = await tenant_api.patch(
        url, headers=admin.headers(ranch_pair.ranch_a), json={"role": "ADMINISTRADOR"}
    )

    assert billing.status_code == 403
    assert billing.json()["detail"] == "cannot_grant"
    assert to_admin.status_code == 200


async def test_members_cannot_edit_themselves(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    admin = await sign_up(tenant_api, "admin")
    await add_member(tenant_db, admin, ranch_pair.ranch_a, Role.ADMINISTRADOR)

    response = await tenant_api.patch(
        f"/api/ranch/members/{admin.user_id}",
        headers=admin.headers(ranch_pair.ranch_a),
        json={"permissions": [code.value for code in ROLE_PRESETS[Role.ADMINISTRADOR]]},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "cannot_edit_self"


async def test_a_medico_cannot_edit_members(ranch_pair: RanchPair, tenant_api: AsyncClient) -> None:
    response = await tenant_api.patch(
        f"/api/ranch/members/{ranch_pair.owner.user_id}",
        headers=ranch_pair.member_a.headers(ranch_pair.ranch_a),
        json={"role": "MEDICO"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "permission_denied"


async def test_the_owner_cannot_be_edited_or_removed(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    admin = await sign_up(tenant_api, "admin")
    await add_member(tenant_db, admin, ranch_pair.ranch_a, Role.ADMINISTRADOR)
    url = f"/api/ranch/members/{ranch_pair.owner.user_id}"

    edit = await tenant_api.patch(
        url, headers=admin.headers(ranch_pair.ranch_a), json={"role": "MEDICO"}
    )
    remove = await tenant_api.delete(url, headers=ranch_pair.owner.headers(ranch_pair.ranch_a))

    assert edit.status_code == remove.status_code == 403
    assert edit.json()["detail"] == remove.json()["detail"] == "owner_protected"
    assert await tenant_db.get(Membership, (ranch_pair.owner.user_id, ranch_pair.ranch_a))


async def test_only_the_dueno_removes_members(
    ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    admin = await sign_up(tenant_api, "admin")
    await add_member(tenant_db, admin, ranch_pair.ranch_a, Role.ADMINISTRADOR)
    url = f"/api/ranch/members/{ranch_pair.member_a.user_id}"

    by_admin = await tenant_api.delete(url, headers=admin.headers(ranch_pair.ranch_a))
    by_owner = await tenant_api.delete(url, headers=ranch_pair.owner.headers(ranch_pair.ranch_a))

    assert by_admin.status_code == 403
    assert by_owner.status_code == 204
    left = await tenant_db.scalar(
        select(Membership).where(
            Membership.user_id == ranch_pair.member_a.user_id,
            Membership.ranch_id == ranch_pair.ranch_a,
        )
    )
    assert left is None


async def test_a_member_of_another_ranch_is_not_found(
    ranch_pair: RanchPair, tenant_api: AsyncClient
) -> None:
    """member_b belongs to ranch B, so ranch A's endpoints can't reach them."""
    url = f"/api/ranch/members/{ranch_pair.member_b.user_id}"
    headers = ranch_pair.owner.headers(ranch_pair.ranch_a)

    edit = await tenant_api.patch(url, headers=headers, json={"role": "NUTRIOLOGO"})
    remove = await tenant_api.delete(url, headers=headers)

    assert edit.status_code == remove.status_code == 404
