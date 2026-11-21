"""The read-only groups list the animal lists use to name an animal's potrero."""

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import GroupPreset, GroupType, Role
from smartbell.models import Group
from tests.conftest import add_member, sign_up


async def test_lists_presets_first_then_custom_by_name(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    tenant_db.add_all(
        [
            Group(ranch_id=owner.ranch_id, name="Zeta", type=GroupType.CUSTOM),
            Group(
                ranch_id=owner.ranch_id,
                name="General",
                type=GroupType.PRESET,
                preset=GroupPreset.GENERAL,
            ),
            Group(ranch_id=owner.ranch_id, name="Lote 2", type=GroupType.CUSTOM),
        ]
    )
    await tenant_db.commit()

    response = await tenant_api.get("/api/groups", headers=owner.headers())

    assert response.status_code == 200
    body = response.json()
    assert [g["name"] for g in body] == ["General", "Lote 2", "Zeta"]
    assert body[0]["preset"] == "GENERAL" and body[0]["type"] == "PRESET"
    assert body[1]["preset"] is None


async def test_needs_a_member_of_the_ranch(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    stranger = await sign_up(tenant_api, "stranger")
    vet = await sign_up(tenant_api, "vet")
    await add_member(tenant_db, vet, owner.ranch_id, Role.TECNICO_CAMPO)

    anonymous = await tenant_api.get("/api/groups", headers={"X-Ranch-Id": str(owner.ranch_id)})
    outsider = await tenant_api.get("/api/groups", headers=stranger.headers(owner.ranch_id))
    member = await tenant_api.get("/api/groups", headers=vet.headers(owner.ranch_id))

    assert anonymous.status_code == 401
    assert outsider.status_code in (403, 404)
    assert member.status_code == 200
