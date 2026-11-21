"""Profile photos in a Cloud Storage bucket (hosted runs), with a fake bucket for Google's."""

from typing import Any

import pytest
from fastapi import FastAPI
from httpx import AsyncClient

from smartbell.services import media
from tests.conftest import sign_up

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
NAME = "0" * 32 + ".png"


class FakeBlob:
    def __init__(self, store: dict[str, tuple[bytes, str]], key: str) -> None:
        self.store, self.key = store, key

    def upload_from_string(self, data: bytes, content_type: str) -> None:
        self.store[self.key] = (data, content_type)

    def download_as_bytes(self) -> bytes:
        return self.store[self.key][0]

    def delete(self) -> None:
        del self.store[self.key]


class FakeBucket:
    def __init__(self) -> None:
        self.store: dict[str, tuple[bytes, str]] = {}

    def blob(self, key: str) -> FakeBlob:
        return FakeBlob(self.store, key)

    def get_blob(self, key: str) -> FakeBlob | None:
        return FakeBlob(self.store, key) if key in self.store else None


def test_saves_reads_and_deletes_under_the_prefix() -> None:
    bucket = FakeBucket()
    files = media.BucketStorage(bucket)

    files.save("avatars", NAME, PNG)

    assert bucket.store == {f"avatars/{NAME}": (PNG, "image/png")}
    assert files.read("avatars", NAME) == PNG
    files.delete("avatars", NAME)
    assert bucket.store == {}


@pytest.mark.parametrize("name", ["../secret.png", "abc.png", "x"])
def test_names_are_checked(name: str) -> None:
    bucket = FakeBucket()
    bucket.store[f"avatars/{name}"] = (PNG, "image/png")
    files = media.BucketStorage(bucket)

    assert files.read("avatars", name) is None
    files.delete("avatars", name)
    assert f"avatars/{name}" in bucket.store


def test_a_missing_photo_reads_as_none() -> None:
    assert media.BucketStorage(FakeBucket()).read("avatars", NAME) is None
    media.BucketStorage(FakeBucket()).delete("avatars", NAME)  # No error.


def test_no_bucket_means_the_local_folder(tmp_path: Any) -> None:
    assert isinstance(media.storage_for("", str(tmp_path)), media.LocalStorage)


async def test_upload_and_serve_through_the_bucket(
    tenant_app: FastAPI, tenant_api: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    bucket = FakeBucket()
    monkeypatch.setattr(media, "_bucket", lambda name: bucket)
    tenant_app.state.settings.media_bucket = "smartbell-media-test"
    owner = await sign_up(tenant_api, "owner")
    headers = {"Authorization": f"Bearer {owner.uid}", "Content-Type": "image/png"}

    uploaded = (await tenant_api.put("/api/users/me/photo", headers=headers, content=PNG)).json()
    served = await tenant_api.get(uploaded["photo_url"])

    assert [key.split("/")[0] for key in bucket.store] == ["avatars"]
    assert served.status_code == 200
    assert served.content == PNG
    assert served.headers["content-type"] == "image/png"
    assert served.headers["x-content-type-options"] == "nosniff"
