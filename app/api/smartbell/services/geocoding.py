"""Address lookup for Datos Rancho: where an address is, and the street address at a pin.

Hosted runs use Google's Geocoding API with a server-side key (`GOOGLE_MAPS_API_KEY`), so the key
never reaches a browser. Without a key (dev, tests) it asks OpenStreetMap's free Nominatim, which
only allows low volume: the web app spaces its requests and never searches per keystroke.
"""

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

import httpx

GOOGLE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
NOMINATIM_URL = "https://nominatim.openstreetmap.org"
# Nominatim's usage policy asks every client to name itself.
USER_AGENT = "Smartbell/0.1 (+https://smartbell.app)"
# Mexico's bounding box (west, north, east, south), a preference for Nominatim, not a limit.
MEXICO = "-118.6,32.8,-86.5,14.4"


class GeocoderUnavailable(Exception):
    """The lookup service failed or answered with something unreadable."""


@dataclass(frozen=True)
class Point:
    latitude: float
    longitude: float


@dataclass(frozen=True)
class Geocoder:
    search: Callable[[str], Awaitable[Point | None]]
    reverse: Callable[[Point], Awaitable[str | None]]


def _join(parts: list[str | None]) -> str | None:
    seen: list[str] = []
    for part in parts:
        if part and part not in seen:
            seen.append(part)
    return ", ".join(seen) or None


def _point(lat: Any, lng: Any) -> Point | None:
    try:
        point = Point(float(lat), float(lng))
    except (TypeError, ValueError):
        return None
    if abs(point.latitude) > 90 or abs(point.longitude) > 180:
        return None
    return point


async def _get(url: str, params: dict[str, str], transport: httpx.AsyncBaseTransport | None) -> Any:
    try:
        async with httpx.AsyncClient(transport=transport, timeout=10) as client:
            response = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
    except httpx.HTTPError as err:
        raise GeocoderUnavailable(type(err).__name__) from None
    if response.status_code != 200:
        raise GeocoderUnavailable(f"geocoder returned {response.status_code}")
    try:
        return response.json()
    except ValueError:
        raise GeocoderUnavailable("geocoder sent an unreadable body") from None


def google_geocoder(api_key: str, transport: httpx.AsyncBaseTransport | None = None) -> Geocoder:
    base = {"key": api_key, "language": "es", "region": "mx"}

    async def ask(params: dict[str, str]) -> list[dict[str, Any]]:
        body = await _get(GOOGLE_URL, {**base, **params}, transport)
        state = body.get("status") if isinstance(body, dict) else None
        if state == "ZERO_RESULTS":
            return []
        if state != "OK" or not isinstance(body.get("results"), list):
            # Never echo Google's error_message: it can quote the request, key included.
            raise GeocoderUnavailable(f"Google geocoding status {state}")
        return [hit for hit in body["results"] if isinstance(hit, dict)]

    async def search(query: str) -> Point | None:
        for hit in await ask({"address": query}):
            location = hit.get("geometry", {}).get("location", {})
            return _point(location.get("lat"), location.get("lng"))
        return None

    async def reverse(point: Point) -> str | None:
        hits = await ask(
            {"latlng": f"{point.latitude},{point.longitude}", "result_type": "street_address|route"}
        )
        for hit in hits:
            parts: dict[str, str] = {}
            for component in hit.get("address_components", []):
                for kind in component.get("types", []):
                    parts.setdefault(kind, component.get("long_name", ""))
                    if kind == "country":
                        parts["country_code"] = component.get("short_name", "").lower()
            if not parts.get("route"):
                continue
            street = " ".join(p for p in (parts.get("route"), parts.get("street_number")) if p)
            foreign = parts.get("country_code") not in (None, "", "mx")
            return _join(
                [
                    street,
                    parts.get("neighborhood") or parts.get("sublocality"),
                    parts.get("locality") or parts.get("administrative_area_level_2"),
                    parts.get("administrative_area_level_1"),
                    parts.get("country") if foreign else None,
                ]
            )
        return None

    return Geocoder(search=search, reverse=reverse)


def nominatim_geocoder(transport: httpx.AsyncBaseTransport | None = None) -> Geocoder:
    async def search(query: str) -> Point | None:
        params = {
            "q": query,
            "format": "jsonv2",
            "limit": "1",
            # Mexico ranks first (most ranches are there) without hiding the rest of the world.
            "viewbox": MEXICO,
            "bounded": "0",
            "accept-language": "es",
        }
        hits = await _get(f"{NOMINATIM_URL}/search", params, transport)
        if not isinstance(hits, list) or not hits or not isinstance(hits[0], dict):
            return None
        return _point(hits[0].get("lat"), hits[0].get("lon"))

    async def reverse(point: Point) -> str | None:
        params = {
            "lat": str(point.latitude),
            "lon": str(point.longitude),
            "format": "jsonv2",
            "zoom": "17",  # Street level: a farther guess would name the wrong place.
            "addressdetails": "1",
            "accept-language": "es",
        }
        hit = await _get(f"{NOMINATIM_URL}/reverse", params, transport)
        a = hit.get("address") if isinstance(hit, dict) else None
        if not isinstance(a, dict) or not a.get("road"):
            return None
        street = " ".join(p for p in (a.get("road"), a.get("house_number")) if p)
        foreign = a.get("country_code") not in (None, "mx")
        return _join(
            [
                street,
                a.get("neighbourhood") or a.get("suburb") or a.get("quarter"),
                a.get("city") or a.get("town") or a.get("village") or a.get("municipality"),
                a.get("state"),
                a.get("country") if foreign else None,
            ]
        )

    return Geocoder(search=search, reverse=reverse)


def geocoder_for(google_maps_api_key: str) -> Geocoder:
    return google_geocoder(google_maps_api_key) if google_maps_api_key else nominatim_geocoder()
