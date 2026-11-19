"""Mi cuenta (profile, photo) and Datos Rancho (edit, delete, the Pro gate on new ranches)."""

import uuid
from pathlib import Path

import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import Role
from smartbell.models import Animal, Membership, Ranch, User
from smartbell.services import media, plans, ranches
from tests.conftest import Account, add_member, give_pro, sign_up

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPG = b"\xff\xd8\xff\xe0" + b"\x00" * 64


@pytest.fixture
def media_dir(tenant_app: FastAPI, tmp_path: Path) -> Path:
    tenant_app.state.settings.media_dir = str(tmp_path)
    return tmp_path


@pytest.fixture
async def owner(tenant_api: AsyncClient) -> Account:
    return await sign_up(tenant_api, "owner")


def stored_pngs(folder: Path) -> list[str]:
    return [p.name for p in folder.rglob("*.png")]


def auth(account: Account) -> dict[str, str]:
    return {"Authorization": f"Bearer {account.uid}"}


# --- Mi cuenta ----------------------------------------------------------------------------------


async def test_profile_edits_persist(tenant_api: AsyncClient, owner: Account) -> None:
    response = await tenant_api.patch(
        "/api/users/me",
        headers=auth(owner),
        json={"first_name": " Ana ", "last_name": "López", "phone": "+523312345678"},
    )

    assert response.status_code == 200, response.text
    me = (await tenant_api.get("/api/auth/me", headers=auth(owner))).json()["user"]
    assert (me["first_name"], me["last_name"], me["phone"]) == ("Ana", "López", "+523312345678")


async def test_a_blank_last_name_clears_it(tenant_api: AsyncClient, owner: Account) -> None:
    await tenant_api.patch("/api/users/me", headers=auth(owner), json={"last_name": "López"})

    response = await tenant_api.patch("/api/users/me", headers=auth(owner), json={"last_name": ""})

    assert response.json()["last_name"] is None


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"first_name": ""},
        {"first_name": None},
        {"phone": None},
        {"phone": "33-1234-5678"},
        {"email": "other@example.com"},  # The sign-in identity: not editable here.
    ],
)
async def test_profile_validation(
    tenant_api: AsyncClient, owner: Account, body: dict[str, str | None]
) -> None:
    response = await tenant_api.patch("/api/users/me", headers=auth(owner), json=body)

    assert response.status_code == 422


async def test_profile_needs_a_signed_in_user(tenant_api: AsyncClient) -> None:
    response = await tenant_api.patch("/api/users/me", json={"first_name": "Ana"})

    assert response.status_code in (401, 403)


# --- Photo --------------------------------------------------------------------------------------


@pytest.mark.parametrize(("data", "content_type"), [(PNG, "image/png"), (JPG, "image/jpeg")])
async def test_photo_upload_is_stored_and_served(
    tenant_api: AsyncClient, owner: Account, media_dir: Path, data: bytes, content_type: str
) -> None:
    response = await tenant_api.put(
        "/api/users/me/photo",
        headers=auth(owner) | {"Content-Type": content_type},
        content=data,
    )

    assert response.status_code == 200, response.text
    url = response.json()["photo_url"]
    assert url.startswith("/api/media/avatars/")
    served = await tenant_api.get(url)
    assert served.status_code == 200
    assert served.content == data
    assert served.headers["content-type"] == content_type
    me = (await tenant_api.get("/api/auth/me", headers=auth(owner))).json()["user"]
    assert me["photo_url"] == url


async def test_a_photo_over_2mb_is_refused(
    tenant_api: AsyncClient, owner: Account, media_dir: Path
) -> None:
    big = PNG + b"\x00" * media.MAX_PHOTO_BYTES

    response = await tenant_api.put(
        "/api/users/me/photo", headers=auth(owner) | {"Content-Type": "image/png"}, content=big
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "photo_too_large"
    assert stored_pngs(media_dir) == []


async def test_a_photo_of_exactly_2mb_is_accepted(
    tenant_api: AsyncClient, owner: Account, media_dir: Path
) -> None:
    data = PNG + b"\x00" * (media.MAX_PHOTO_BYTES - len(PNG))

    response = await tenant_api.put(
        "/api/users/me/photo", headers=auth(owner) | {"Content-Type": "image/png"}, content=data
    )

    assert response.status_code == 200


@pytest.mark.parametrize(
    ("data", "content_type"),
    [
        (b"GIF89a" + b"\x00" * 32, "image/gif"),
        (b"GIF89a" + b"\x00" * 32, "image/png"),  # Renamed: the bytes decide.
        (PNG, "image/jpeg"),  # The declared type must match too.
        (b"<svg xmlns='http://www.w3.org/2000/svg'/>", "image/svg+xml"),
        (b"", "image/png"),
    ],
)
async def test_a_photo_that_isnt_jpg_or_png_is_refused(
    tenant_api: AsyncClient, owner: Account, media_dir: Path, data: bytes, content_type: str
) -> None:
    response = await tenant_api.put(
        "/api/users/me/photo", headers=auth(owner) | {"Content-Type": content_type}, content=data
    )

    assert response.status_code == 415
    assert response.json()["detail"] == "photo_type"


async def test_a_new_photo_replaces_the_old_file(
    tenant_api: AsyncClient, owner: Account, media_dir: Path
) -> None:
    headers = auth(owner) | {"Content-Type": "image/png"}
    first = (await tenant_api.put("/api/users/me/photo", headers=headers, content=PNG)).json()

    second = (await tenant_api.put("/api/users/me/photo", headers=headers, content=PNG)).json()

    assert first["photo_url"] != second["photo_url"]
    assert (await tenant_api.get(first["photo_url"])).status_code == 404
    assert stored_pngs(media_dir) == [second["photo_url"].rsplit("/", 1)[1]]


@pytest.mark.parametrize("name", ["..%2Fsecret.png", "abc.png", "0" * 32 + ".gif", "x"])
async def test_media_names_are_checked(tenant_api: AsyncClient, media_dir: Path, name: str) -> None:
    (media_dir / "secret.png").write_bytes(PNG)

    response = await tenant_api.get(f"/api/media/avatars/{name}")

    assert response.status_code == 404


# --- Datos Rancho -------------------------------------------------------------------------------


async def test_the_active_ranch_reads_with_its_counts(
    tenant_api: AsyncClient, owner: Account
) -> None:
    response = await tenant_api.get("/api/ranch", headers=owner.headers())

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Mi rancho"
    assert body["is_owner"] is True
    assert body["can_edit"] is True
    assert body["animal_count"] == 0
    assert (body["latitude"], body["longitude"], body["address"]) == (None, None, None)


async def test_ranch_name_address_and_pin_save_and_reload(
    tenant_api: AsyncClient, owner: Account
) -> None:
    response = await tenant_api.patch(
        "/api/ranch",
        headers=owner.headers(),
        json={
            "name": "El Bigotes",
            "address": "Carretera a Tepatitlán km 12, Jalisco",
            "latitude": 20.8123,
            "longitude": -102.7651,
        },
    )

    assert response.status_code == 200, response.text
    reloaded = (await tenant_api.get("/api/ranch", headers=owner.headers())).json()
    assert reloaded["name"] == "El Bigotes"
    assert reloaded["address"] == "Carretera a Tepatitlán km 12, Jalisco"
    assert (reloaded["latitude"], reloaded["longitude"]) == (20.8123, -102.7651)
    listed = (await tenant_api.get("/api/auth/me", headers=auth(owner))).json()["ranches"]
    assert listed[0]["name"] == "El Bigotes"
    assert listed[0]["latitude"] == 20.8123


async def test_only_sent_fields_change(tenant_api: AsyncClient, owner: Account) -> None:
    await tenant_api.patch(
        "/api/ranch", headers=owner.headers(), json={"latitude": 20.5, "longitude": -103.3}
    )

    response = await tenant_api.patch("/api/ranch", headers=owner.headers(), json={"name": "B"})

    assert (response.json()["latitude"], response.json()["longitude"]) == (20.5, -103.3)


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"name": ""},
        {"name": None},
        {"latitude": 20.5},
        {"latitude": 20.5, "longitude": None},
        {"latitude": 91, "longitude": 0},
        {"latitude": 0, "longitude": -181},
        {"address": "x" * 301},
        {"owner_user_id": str(uuid.uuid4())},
    ],
)
async def test_ranch_validation(
    tenant_api: AsyncClient, owner: Account, body: dict[str, object]
) -> None:
    response = await tenant_api.patch("/api/ranch", headers=owner.headers(), json=body)

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("role", "status"),
    [
        (Role.ADMINISTRADOR, 200),
        (Role.MEDICO, 403),
        (Role.NUTRIOLOGO, 403),
        (Role.TECNICO_CAMPO, 403),
    ],
)
async def test_only_dueno_and_admin_edit_the_ranch(
    tenant_api: AsyncClient,
    tenant_db: AsyncSession,
    owner: Account,
    role: Role,
    status: int,
) -> None:
    member = await sign_up(tenant_api, "member")
    await add_member(tenant_db, member, owner.ranch_id, role)

    response = await tenant_api.patch(
        "/api/ranch", headers=member.headers(owner.ranch_id), json={"name": "Otro"}
    )
    read = await tenant_api.get("/api/ranch", headers=member.headers(owner.ranch_id))

    assert response.status_code == status
    assert read.status_code == 200
    assert read.json()["can_edit"] is (status == 200)
    assert read.json()["is_owner"] is False


async def test_a_stranger_cant_touch_the_ranch(tenant_api: AsyncClient, owner: Account) -> None:
    stranger = await sign_up(tenant_api, "stranger")
    headers = stranger.headers(owner.ranch_id)

    edit = await tenant_api.patch("/api/ranch", headers=headers, json={"name": "Mío"})
    delete = await tenant_api.request(
        "DELETE", "/api/ranch", headers=headers, json={"confirm_name": "Mi rancho"}
    )

    assert edit.status_code == 403
    assert delete.status_code == 403


# --- Delete -------------------------------------------------------------------------------------


async def _second_ranch(api: AsyncClient, db: AsyncSession, owner: Account) -> uuid.UUID:
    await give_pro(db, owner)
    created = await api.post("/api/ranches", headers=owner.headers(), json={"name": "El Bigotes"})
    assert created.status_code == 201, created.text
    return uuid.UUID(created.json()["id"])


async def test_the_owner_deletes_a_ranch_by_typing_its_name(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    ranch_id = await _second_ranch(tenant_api, tenant_db, owner)

    response = await tenant_api.request(
        "DELETE", "/api/ranch", headers=owner.headers(ranch_id), json={"confirm_name": "el bigotes"}
    )

    assert response.status_code == 204, response.text
    listed = (await tenant_api.get("/api/ranches", headers=auth(owner))).json()
    assert [r["name"] for r in listed] == ["Mi rancho"]


async def test_a_wrong_name_doesnt_delete(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    ranch_id = await _second_ranch(tenant_api, tenant_db, owner)

    response = await tenant_api.request(
        "DELETE", "/api/ranch", headers=owner.headers(ranch_id), json={"confirm_name": "Bigotes"}
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "name_mismatch"
    assert await tenant_db.get(Ranch, ranch_id) is not None


async def test_an_admin_cant_delete_the_ranch(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    admin = await sign_up(tenant_api, "admin")
    await add_member(tenant_db, admin, owner.ranch_id, Role.ADMINISTRADOR)

    response = await tenant_api.request(
        "DELETE",
        "/api/ranch",
        headers=admin.headers(owner.ranch_id),
        json={"confirm_name": "Mi rancho"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "owner_only"


async def test_the_last_ranch_cant_be_deleted(tenant_api: AsyncClient, owner: Account) -> None:
    response = await tenant_api.request(
        "DELETE", "/api/ranch", headers=owner.headers(), json={"confirm_name": "Mi rancho"}
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "last_ranch"


async def test_deleting_a_ranch_takes_its_cows(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account, enforced_fks: None
) -> None:
    ranch_id = await _second_ranch(tenant_api, tenant_db, owner)
    cow = await tenant_api.post(
        "/api/animals",
        headers=owner.headers(ranch_id),
        json={"control_id": "101", "birth_date": "2022-01-15"},
    )
    assert cow.status_code == 201, cow.text
    detail = (await tenant_api.get("/api/ranch", headers=owner.headers(ranch_id))).json()
    assert detail["animal_count"] == 1

    await tenant_api.request(
        "DELETE", "/api/ranch", headers=owner.headers(ranch_id), json={"confirm_name": "El Bigotes"}
    )

    tenant_db.expire_all()
    left = await tenant_db.scalars(select(Animal.id).where(Animal.ranch_id == ranch_id))
    assert left.all() == []


# --- The Pro gate on new ranches (plans-billing) -------------------------------------------------


async def test_a_free_user_with_one_ranch_gets_the_upsell(
    tenant_api: AsyncClient, owner: Account
) -> None:
    me = (await tenant_api.get("/api/auth/me", headers=auth(owner))).json()

    response = await tenant_api.post("/api/ranches", headers=auth(owner), json={"name": "B"})

    assert me["ranch_creation"] == "upsell"
    assert response.status_code == 402
    assert response.json()["detail"] == "pro_required"


async def test_pro_creates_more_ranches(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    await give_pro(tenant_db, owner)

    me = (await tenant_api.get("/api/auth/me", headers=auth(owner))).json()
    response = await tenant_api.post("/api/ranches", headers=auth(owner), json={"name": "B"})

    assert me["ranch_creation"] == "allowed"
    assert response.status_code == 201


async def test_member_only_ranches_dont_count(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    member = await sign_up(tenant_api, "member")
    await add_member(tenant_db, member, owner.ranch_id, Role.MEDICO)
    # Hand the member's own "Mi rancho" to someone else: they now own nothing.
    own = await tenant_db.get(Ranch, member.ranch_id)
    assert own is not None
    own.owner_user_id = owner.user_id
    await tenant_db.commit()
    user = await tenant_db.get(User, member.user_id)
    assert user is not None

    assert await plans.ranch_creation(tenant_db, user) is plans.RanchCreation.ALLOWED
    response = await tenant_api.post("/api/ranches", headers=auth(member), json={"name": "Mío"})
    assert response.status_code == 201


async def test_a_free_legacy_owner_keeps_every_ranch(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    # Imported from the legacy app with three ranches and no Pro.
    for name in ("Norte", "Sur"):
        tenant_db.add(Ranch(id=uuid.uuid4(), name=name, owner_user_id=owner.user_id))
    await tenant_db.commit()
    user = await tenant_db.get(User, owner.user_id)
    assert user is not None

    creation = await plans.ranch_creation(tenant_db, user)
    response = await tenant_api.post("/api/ranches", headers=auth(owner), json={"name": "Otro"})

    assert creation is plans.RanchCreation.UPSELL
    assert response.status_code == 402
    owned = await tenant_db.scalars(select(Ranch.name).where(Ranch.owner_user_id == user.id))
    assert sorted(owned.all()) == ["Mi rancho", "Norte", "Sur"]


async def test_members_left_with_no_ranch_get_a_new_one(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    ranch_id = await _second_ranch(tenant_api, tenant_db, owner)
    only_here = await sign_up(tenant_api, "vaquero")
    # Invited to the second ranch only: their own "Mi rancho" went elsewhere.
    own = await tenant_db.get(Ranch, only_here.ranch_id)
    own_membership = await tenant_db.get(Membership, (only_here.user_id, only_here.ranch_id))
    assert own is not None and own_membership is not None
    await tenant_db.delete(own_membership)  # SQLite doesn't cascade.
    await tenant_db.delete(own)
    await tenant_db.commit()
    await add_member(tenant_db, only_here, ranch_id, Role.TECNICO_CAMPO)
    also_elsewhere = await sign_up(tenant_api, "medico")
    await add_member(tenant_db, also_elsewhere, ranch_id, Role.MEDICO)

    await tenant_api.request(
        "DELETE", "/api/ranch", headers=owner.headers(ranch_id), json={"confirm_name": "El Bigotes"}
    )

    stranded = (await tenant_api.get("/api/ranches", headers=auth(only_here))).json()
    kept = (await tenant_api.get("/api/ranches", headers=auth(also_elsewhere))).json()
    assert [(r["name"], r["role"]) for r in stranded] == [("Mi rancho", "DUENO")]
    assert [r["id"] for r in kept] == [str(also_elsewhere.ranch_id)]


def test_the_typed_name_ignores_case_spacing_and_accent_encoding() -> None:
    assert ranches.same_name("  JOSÉ ", "José")
    assert not ranches.same_name("Jose", "José")


async def test_photos_are_served_as_inert_images(
    tenant_api: AsyncClient, owner: Account, media_dir: Path
) -> None:
    headers = auth(owner) | {"Content-Type": "image/png"}
    url = (await tenant_api.put("/api/users/me/photo", headers=headers, content=PNG)).json()

    served = await tenant_api.get(url["photo_url"])

    assert served.headers["x-content-type-options"] == "nosniff"
    assert "sandbox" in served.headers["content-security-policy"]
