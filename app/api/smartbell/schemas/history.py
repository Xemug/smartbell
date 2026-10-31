"""What a history entry points at (docs/domain-model.md §1, HistoryEntry)."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict

from smartbell.schemas.events import NonBlank


class HistoryRefs(BaseModel):
    """Stored as `HistoryEntry.refs`.

    Names are copied in, not looked up, so an entry reads the same after its group or ranch is
    renamed or deleted. `group_id` is the group the card links to: the destination when animals
    move or a group is deleted.
    """

    model_config = ConfigDict(extra="forbid")

    animal_ids: list[UUID] = []
    user_ids: list[UUID] = []
    group_id: UUID | None = None
    group: NonBlank | None = None
    to_group: NonBlank | None = None
    ranch: NonBlank | None = None
