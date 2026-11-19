"""Profile photos: checked by their bytes, stored under a random name, served without auth.

`<img>` can't send a bearer token, so the files are public; the 128-bit random names are what
keep them from being listed or guessed.
"""

import re
import secrets
from pathlib import Path
from typing import Protocol

MAX_PHOTO_BYTES = 2 * 1024 * 1024  # Web 1.4: "Tamaño máximo de archivo 2MB".
AVATAR_PREFIX = "avatars"
_NAME = re.compile(r"^[0-9a-f]{32}\.(jpg|png)$")

# Magic bytes, so a renamed file of another kind is refused whatever its Content-Type says.
_SIGNATURES = {"jpg": b"\xff\xd8\xff", "png": b"\x89PNG\r\n\x1a\n"}
CONTENT_TYPES = {"jpg": "image/jpeg", "png": "image/png"}


class PhotoRefused(Exception):
    def __init__(self, code: str, status: int) -> None:
        super().__init__(code)
        self.code = code
        self.status = status


def photo_kind(data: bytes, content_type: str | None) -> str:
    """`jpg` or `png`, or PhotoRefused("photo_type") when the bytes or the declared type aren't."""
    declared = (content_type or "").split(";")[0].strip().lower()
    for kind, signature in _SIGNATURES.items():
        if data.startswith(signature) and declared == CONTENT_TYPES[kind]:
            return kind
    raise PhotoRefused("photo_type", 415)


def is_media_name(name: str) -> bool:
    return bool(_NAME.fullmatch(name))


class Storage(Protocol):
    def save(self, prefix: str, name: str, data: bytes) -> None: ...
    def path(self, prefix: str, name: str) -> Path | None: ...
    def delete(self, prefix: str, name: str) -> None: ...


class LocalStorage:
    def __init__(self, root: str) -> None:
        self._root = Path(root)

    def save(self, prefix: str, name: str, data: bytes) -> None:
        folder = self._root / prefix
        folder.mkdir(parents=True, exist_ok=True)
        (folder / name).write_bytes(data)

    def path(self, prefix: str, name: str) -> Path | None:
        if not is_media_name(name):
            return None
        file = self._root / prefix / name
        return file if file.is_file() else None

    def delete(self, prefix: str, name: str) -> None:
        if is_media_name(name):
            (self._root / prefix / name).unlink(missing_ok=True)


def new_name(kind: str) -> str:
    return f"{secrets.token_hex(16)}.{kind}"


def avatar_url(name: str) -> str:
    return f"/api/media/{AVATAR_PREFIX}/{name}"


def own_avatar_name(url: str | None) -> str | None:
    """The stored file behind a photo URL we issued; None for Google/Apple pictures."""
    prefix = f"/api/media/{AVATAR_PREFIX}/"
    if url and url.startswith(prefix) and is_media_name(url[len(prefix) :]):
        return url[len(prefix) :]
    return None
