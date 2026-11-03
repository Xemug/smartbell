"""Data from ranch A never comes back while the active ranch is B.

Every ranch-scoped list endpoint adds one entry to `LIST_ENDPOINTS`: its path, and a function that
seeds rows in ranch A and returns the ids they should be listed under. The test then lists with
`X-Ranch-Id: B` (as a member of both) and checks that none of those ids appear, and lists with
`X-Ranch-Id: A` to check the seed really is visible there.
"""

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import RanchPair

Seed = Callable[[RanchPair, AsyncClient, AsyncSession], Awaitable[set[str]]]


@dataclass(frozen=True)
class ListEndpoint:
    path: str
    seed: Seed
    id_key: str = "id"


async def _seed_members(pair: RanchPair, api: AsyncClient, db: AsyncSession) -> set[str]:
    return {str(pair.member_a.user_id)}


LIST_ENDPOINTS = [
    ListEndpoint("/api/ranch/members", _seed_members, id_key="user_id"),
]


def _ids(body: Any, key: str) -> set[str]:
    rows = body["items"] if isinstance(body, dict) else body
    return {str(row[key]) for row in rows}


@pytest.mark.parametrize("endpoint", LIST_ENDPOINTS, ids=lambda e: e.path)
async def test_list_endpoints_never_leak_another_ranch(
    endpoint: ListEndpoint, ranch_pair: RanchPair, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    seeded = await endpoint.seed(ranch_pair, tenant_api, tenant_db)

    in_a = await tenant_api.get(endpoint.path, headers=ranch_pair.owner.headers(ranch_pair.ranch_a))
    in_b = await tenant_api.get(endpoint.path, headers=ranch_pair.owner.headers(ranch_pair.ranch_b))

    assert in_a.status_code == in_b.status_code == 200, (in_a.text, in_b.text)
    assert seeded <= _ids(in_a.json(), endpoint.id_key)
    assert not seeded & _ids(in_b.json(), endpoint.id_key)


@pytest.mark.parametrize("endpoint", LIST_ENDPOINTS, ids=lambda e: e.path)
async def test_list_endpoints_refuse_a_ranch_the_caller_is_not_in(
    endpoint: ListEndpoint, ranch_pair: RanchPair, tenant_api: AsyncClient
) -> None:
    response = await tenant_api.get(
        endpoint.path, headers=ranch_pair.member_b.headers(ranch_pair.ranch_a)
    )

    assert response.status_code == 403
