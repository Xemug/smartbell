"""The activity history: every mutation calls `record`; the feed calls `render`."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import HistoryCard, HistoryKey
from smartbell.i18n.history_es import TEMPLATES, HistoryTemplate
from smartbell.models import HistoryEntry
from smartbell.schemas.history import HistoryRefs


async def record(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    user_id: uuid.UUID | None,
    key: HistoryKey,
    refs: HistoryRefs,
    n: int = 1,
) -> HistoryEntry:
    """Add one entry to the caller's transaction, which the caller commits or rolls back.

    A batch is one entry with its count in `n`. `user_id` is None when nobody did it.
    """
    template = TEMPLATES[key]
    _check(key, template, refs, n)
    entry = HistoryEntry(
        ranch_id=ranch_id,
        user_id=user_id,
        category=template.category,
        event_key=key,
        refs=refs.model_dump(mode="json", exclude_defaults=True),
        n=n,
    )
    session.add(entry)
    await session.flush()
    return entry


def render(entry: HistoryEntry) -> str:
    """The entry's Spanish description."""
    template = TEMPLATES[HistoryKey(entry.event_key)]
    text = template.singular if entry.n == 1 or template.plural is None else template.plural
    return text.format(n=entry.n, **{name: entry.refs[name] for name in template.names})


def _check(key: HistoryKey, template: HistoryTemplate, refs: HistoryRefs, n: int) -> None:
    """Refuse an entry that couldn't be rendered or whose card wouldn't match its count."""
    if n < 1 or (n > 1 and template.plural is None):
        raise ValueError(f"{key}: invalid count {n}")
    missing = [name for name in template.names if getattr(refs, name) is None]
    if missing:
        raise ValueError(f"{key}: refs need {sorted(missing)}")
    if template.names & {"group", "to_group"} and refs.group_id is None:
        raise ValueError(f"{key}: refs need group_id")
    listed = {HistoryCard.A: refs.animal_ids, HistoryCard.C: refs.user_ids}.get(template.card)
    if listed is not None and len(set(listed)) != n:
        raise ValueError(f"{key}: n is {n} but refs list {len(set(listed))}")
