"""Groups (potreros) as the animal lists read them. The `groups` card adds the writes."""

import uuid

from pydantic import BaseModel, ConfigDict

from smartbell.enums import GroupPreset, GroupType


class GroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    type: GroupType
    preset: GroupPreset | None
