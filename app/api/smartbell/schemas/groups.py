"""Groups (potreros): the list, the wizard's create and edit, moving animals, heifer groups."""

import datetime as dt
import uuid
from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

from smartbell.enums import (
    Breed,
    GroupFilterField,
    GroupKpiIndicator,
    GroupPreset,
    GroupSelection,
    GroupType,
    HeiferGroup,
    ReproState,
)

GroupName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]
GroupDescription = Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)]
# Age in whole years or the lactation number; "MAS" is 7 and up ("más").
CountChip = Literal["1", "2", "3", "4", "5", "6", "MAS"]
COUNT_CHIP_MAS = 7
# A wizard pick is a few dozen cows; a bulk move is at most a few pages of a list.
MAX_ANIMALS = 500


class AutoFilter(BaseModel):
    """An AUTO group's rule: the cows whose age, breed or lactation number is one of `values`."""

    model_config = ConfigDict(extra="forbid")

    field: GroupFilterField
    values: list[str] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def _values_fit_field(self) -> Self:
        allowed = (
            {breed.value for breed in Breed}
            if self.field is GroupFilterField.BREED
            else {"1", "2", "3", "4", "5", "6", "MAS"}
        )
        bad = [value for value in self.values if value not in allowed]
        if bad:
            raise ValueError(f"values not allowed for {self.field}: {bad}")
        self.values = sorted(set(self.values))
        return self


class GroupOut(BaseModel):
    """A stored potrero with what its card shows. `animal_count` counts the active animals in it
    (General also counts those with no group); `kpi_value` is the chosen indicator's figure:
    a count, or for DIM the average days in milk of its milking cows (None with none milking)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None = None
    type: GroupType
    preset: GroupPreset | None
    selection: GroupSelection = GroupSelection.MANUAL
    auto_filter: AutoFilter | None = None
    kpi_indicator: GroupKpiIndicator | None = None
    animal_count: int = 0
    kpi_value: int | None = None


class GroupCreate(BaseModel):
    """The wizard. A preset takes its name from the preset; a custom group needs `name`. MANUAL
    moves `animal_ids` in; AUTO moves in the cows `auto_filter` matches. `type: TORO` makes a
    bull group: named, MANUAL, no indicator, and only bulls on the ranch go in."""

    model_config = ConfigDict(extra="forbid")

    type: Literal[GroupType.CUSTOM, GroupType.TORO] = GroupType.CUSTOM
    preset: GroupPreset | None = None
    name: GroupName | None = None
    description: GroupDescription | None = None
    selection: GroupSelection = GroupSelection.MANUAL
    auto_filter: AutoFilter | None = None
    animal_ids: list[uuid.UUID] = Field(default_factory=list, max_length=MAX_ANIMALS)
    kpi_indicator: GroupKpiIndicator | None = None

    @model_validator(mode="after")
    def _consistent(self) -> Self:
        if self.preset is None and not self.name:
            raise ValueError("a custom group needs a name")
        if self.type is GroupType.TORO:
            if self.preset is not None:
                raise ValueError("a bull group is never a preset")
            if self.selection is GroupSelection.AUTO:
                raise ValueError("a bull group is picked by hand")
            if self.kpi_indicator is not None:
                raise ValueError("a bull group has no indicator")
        if self.selection is GroupSelection.AUTO:
            if self.auto_filter is None:
                raise ValueError("an AUTO group needs auto_filter")
            if self.animal_ids:
                raise ValueError("an AUTO group picks its own cows")
        elif self.auto_filter is not None:
            raise ValueError("auto_filter is for AUTO groups")
        return self


class GroupUpdate(BaseModel):
    """Edit: rename (custom groups only), describe, re-pick the indicator, or change the AUTO
    rule (which re-evaluates the group). Fields left out stay as they are."""

    model_config = ConfigDict(extra="forbid")

    name: GroupName | None = None
    description: GroupDescription | None = None
    auto_filter: AutoFilter | None = None
    kpi_indicator: GroupKpiIndicator | None = None


class MoveAnimals(BaseModel):
    model_config = ConfigDict(extra="forbid")

    animal_ids: list[uuid.UUID] = Field(min_length=1, max_length=MAX_ANIMALS)


class MoveResult(BaseModel):
    """`moved`: animals now in the group. `unchanged`: already there. Animals not found or
    dados de baja refuse the whole request (404 / 409) before anything moves."""

    moved: list[uuid.UUID]
    unchanged: list[uuid.UUID]


class Reevaluated(BaseModel):
    came_in: list[uuid.UUID]
    went_out: list[uuid.UUID]  # back to General


class GroupDeleted(BaseModel):
    """Where the animals went. None for a bull group deleted with no other bull group picked:
    its bulls are left out of any group."""

    to_group_id: uuid.UUID | None
    to_group: str | None
    moved: int


class HeiferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    control_id: str
    breed: Breed
    birth_date: dt.date
    repro_state: ReproState | None
    is_sick: bool


class HeiferGroupOut(BaseModel):
    key: HeiferGroup
    animals: list[HeiferOut]
