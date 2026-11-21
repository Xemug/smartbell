"""Address lookup (`/api/geocode/*`) and the Google and Nominatim clients behind it."""

import json
from collections.abc import Callable
from typing import Any

import httpx
import pytest
from fastapi import FastAPI
from httpx import AsyncClient

from smartbell.routes.geocode import Limiter, get_geocoder, get_limiter
from smartbell.services import geocoding
from smartbell.services.geocoding import Geocoder, Point
from tests.conftest import sign_up


def replies(body: Any, seen: list[httpx.Request], status: int = 200) -> httpx.MockTransport:
    def handle(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(status, content=json.dumps(body).encode())

    return httpx.MockTransport(handle)


GOOGLE_HIT = {
    "status": "OK",
    "results": [
        {
            "geometry": {"location": {"lat": 20.6767, "lng": -103.3475}},
            "address_components": [
                {"long_name": "4942", "short_name": "4942", "types": ["street_number"]},
                {
                    "long_name": "Calle Joseph Haydn",
                    "short_name": "C. Joseph Haydn",
                    "types": ["route"],
                },
                {
                    "long_name": "Prados Guadalupe",
                    "short_name": "Prados",
                    "types": ["neighborhood", "political"],
                },
                {
                    "long_name": "Zapopan",
                    "short_name": "Zapopan",
                    "types": ["locality", "political"],
                },
                {
                    "long_name": "Jalisco",
                    "short_name": "Jal.",
                    "types": ["administrative_area_level_1"],
                },
                {"long_name": "México", "short_name": "MX", "types": ["country", "political"]},
            ],
        }
    ],
}


# --- Google ---------------------------------------------------------------------------------------


async def test_google_search_returns_the_first_location_and_sends_the_key() -> None:
    seen: list[httpx.Request] = []
    geocoder = geocoding.google_geocoder("k-123", replies(GOOGLE_HIT, seen))

    point = await geocoder.search("Calle Joseph Haydn 4942, Zapopan")

    assert point == Point(20.6767, -103.3475)
    params = seen[0].url.params
    assert seen[0].url.host == "maps.googleapis.com"
    assert (params["address"], params["key"], params["region"]) == (
        "Calle Joseph Haydn 4942, Zapopan",
        "k-123",
        "mx",
    )


async def test_google_reverse_writes_a_mexican_street_address() -> None:
    geocoder = geocoding.google_geocoder("k", replies(GOOGLE_HIT, []))

    address = await geocoder.reverse(Point(20.6767, -103.3475))

    assert address == "Calle Joseph Haydn 4942, Prados Guadalupe, Zapopan, Jalisco"


async def test_google_zero_results_is_not_an_error() -> None:
    geocoder = geocoding.google_geocoder(
        "k", replies({"status": "ZERO_RESULTS", "results": []}, [])
    )

    assert await geocoder.search("nowhere") is None
    assert await geocoder.reverse(Point(0, 0)) is None


@pytest.mark.parametrize(
    "body",
    [{"status": "REQUEST_DENIED", "error_message": "key k-123 is invalid"}, ["not", "a", "dict"]],
)
async def test_google_refusals_are_unavailable_without_echoing_the_message(body: Any) -> None:
    geocoder = geocoding.google_geocoder("k-123", replies(body, []))

    with pytest.raises(geocoding.GeocoderUnavailable) as raised:
        await geocoder.search("x")

    assert "k-123" not in str(raised.value)


async def test_http_failures_are_unavailable() -> None:
    geocoder = geocoding.google_geocoder("k", replies({}, [], status=500))

    with pytest.raises(geocoding.GeocoderUnavailable):
        await geocoder.search("x")


# --- Nominatim (dev) ------------------------------------------------------------------------------


async def test_nominatim_search_names_the_app_and_prefers_mexico() -> None:
    seen: list[httpx.Request] = []
    geocoder = geocoding.nominatim_geocoder(replies([{"lat": "20.95", "lon": "-102.6"}], seen))

    assert await geocoder.search("Tepatitlán, Jalisco") == Point(20.95, -102.6)
    assert seen[0].headers["User-Agent"].startswith("Smartbell/")
    assert seen[0].url.params["viewbox"] == geocoding.MEXICO


async def test_nominatim_reverse_needs_a_road() -> None:
    road = {
        "address": {
            "road": "Av. Juárez",
            "house_number": "12",
            "city": "Arandas",
            "state": "Jalisco",
            "country_code": "mx",
        }
    }
    fields = {"address": {"state": "Jalisco", "country_code": "mx"}}

    assert await geocoding.nominatim_geocoder(replies(road, [])).reverse(Point(1, 2)) == (
        "Av. Juárez 12, Arandas, Jalisco"
    )
    assert await geocoding.nominatim_geocoder(replies(fields, [])).reverse(Point(1, 2)) is None


def test_the_key_picks_google() -> None:
    assert geocoding.geocoder_for("k") is not None
    assert geocoding.geocoder_for("") is not None


# --- Route ----------------------------------------------------------------------------------------


def fixed(point: Point | None, address: str | None) -> Callable[[], Geocoder]:
    async def search(query: str) -> Point | None:
        return point

    async def reverse(at: Point) -> str | None:
        return address

    return lambda: Geocoder(search=search, reverse=reverse)


async def test_lookups_need_a_signed_in_user(tenant_api: AsyncClient) -> None:
    response = await tenant_api.get("/api/geocode/search", params={"q": "Zapopan"})

    assert response.status_code == 401


async def test_search_and_reverse(tenant_app: FastAPI, tenant_api: AsyncClient) -> None:
    account = await sign_up(tenant_api, "owner")
    tenant_app.dependency_overrides[get_geocoder] = fixed(Point(20.6, -103.3), "Av. Juárez 12")
    headers = {"Authorization": f"Bearer {account.uid}"}

    found = await tenant_api.get("/api/geocode/search", params={"q": " Zapopan "}, headers=headers)
    at = await tenant_api.get(
        "/api/geocode/reverse", params={"latitude": 20.6, "longitude": -103.3}, headers=headers
    )

    assert found.json() == {"pin": {"latitude": 20.6, "longitude": -103.3}}
    assert at.json() == {"address": "Av. Juárez 12"}


async def test_nothing_found_is_a_null_pin(tenant_app: FastAPI, tenant_api: AsyncClient) -> None:
    account = await sign_up(tenant_api, "owner")
    tenant_app.dependency_overrides[get_geocoder] = fixed(None, None)
    headers = {"Authorization": f"Bearer {account.uid}"}

    response = await tenant_api.get("/api/geocode/search", params={"q": "x"}, headers=headers)

    assert response.json() == {"pin": None}


@pytest.mark.parametrize(
    "params",
    [{"q": ""}, {"q": "x" * 301}],
)
async def test_search_text_is_bounded(tenant_api: AsyncClient, params: dict[str, str]) -> None:
    account = await sign_up(tenant_api, "owner")
    headers = {"Authorization": f"Bearer {account.uid}"}

    response = await tenant_api.get("/api/geocode/search", params=params, headers=headers)

    assert response.status_code == 422


async def test_reverse_refuses_impossible_coordinates(tenant_api: AsyncClient) -> None:
    account = await sign_up(tenant_api, "owner")
    headers = {"Authorization": f"Bearer {account.uid}"}

    response = await tenant_api.get(
        "/api/geocode/reverse", params={"latitude": 91, "longitude": 0}, headers=headers
    )

    assert response.status_code == 422


async def test_an_outage_is_a_502(tenant_app: FastAPI, tenant_api: AsyncClient) -> None:
    account = await sign_up(tenant_api, "owner")

    async def down(query: str) -> Point | None:
        raise geocoding.GeocoderUnavailable("down")

    async def unused(at: Point) -> str | None:
        return None

    tenant_app.dependency_overrides[get_geocoder] = lambda: Geocoder(search=down, reverse=unused)
    headers = {"Authorization": f"Bearer {account.uid}"}

    response = await tenant_api.get("/api/geocode/search", params={"q": "x"}, headers=headers)

    assert (response.status_code, response.json()["detail"]) == (502, "geocoder_unavailable")


async def test_each_user_is_rate_limited(tenant_app: FastAPI, tenant_api: AsyncClient) -> None:
    first = await sign_up(tenant_api, "first")
    second = await sign_up(tenant_api, "second")
    limiter = Limiter(per_minute=2)
    tenant_app.dependency_overrides[get_limiter] = lambda: limiter
    tenant_app.dependency_overrides[get_geocoder] = fixed(None, None)

    def ask(uid: str) -> Any:
        return tenant_api.get(
            "/api/geocode/search", params={"q": "x"}, headers={"Authorization": f"Bearer {uid}"}
        )

    codes = [(await ask(first.uid)).status_code for _ in range(3)]
    other = (await ask(second.uid)).status_code

    assert codes == [200, 200, 429]
    assert other == 200


async def test_a_blank_search_finds_nothing(tenant_app: FastAPI, tenant_api: AsyncClient) -> None:
    account = await sign_up(tenant_api, "owner")
    tenant_app.dependency_overrides[get_geocoder] = fixed(Point(1, 2), None)
    headers = {"Authorization": f"Bearer {account.uid}"}

    response = await tenant_api.get("/api/geocode/search", params={"q": "   "}, headers=headers)

    assert response.json() == {"pin": None}


def test_the_limiter_forgets_idle_users(monkeypatch: pytest.MonkeyPatch) -> None:
    import time
    import uuid

    now = [0.0]
    monkeypatch.setattr(time, "monotonic", lambda: now[0])
    limiter = Limiter(per_minute=1)
    user = uuid.uuid4()

    assert limiter.allow(user)
    assert not limiter.allow(user)
    now[0] = 61.0
    assert limiter.allow(user)
    assert len(limiter._calls) == 1
