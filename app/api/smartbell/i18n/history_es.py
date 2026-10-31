"""Spanish history templates (docs/design-inventory/alerts-dashboard-reports.md §3.5).

Copy is verbatim from §3.5; the singular forms and the keys marked "not in §3.5" in
`smartbell.enums.HistoryKey` are ours. `{n}` is the count; `{group}`, `{to_group}` and `{ranch}`
are the names stored in the entry's refs.
"""

from dataclasses import dataclass
from string import Formatter

from smartbell.enums import HistoryCard, HistoryCategory, HistoryKey


@dataclass(frozen=True)
class HistoryTemplate:
    category: HistoryCategory
    card: HistoryCard
    singular: str
    plural: str | None = None  # None: the event is always about one thing, so n stays 1.

    @property
    def names(self) -> frozenset[str]:
        """The refs names this template shows."""
        parsed = Formatter().parse(self.plural or self.singular)
        return frozenset(field for _, field, _, _ in parsed if field and field != "n")


def _ganado(card: HistoryCard, singular: str, plural: str | None = None) -> HistoryTemplate:
    return HistoryTemplate(HistoryCategory.GANADO, card, singular, plural)


def _usuarios(singular: str, plural: str) -> HistoryTemplate:
    return HistoryTemplate(HistoryCategory.USUARIOS, HistoryCard.C, singular, plural)


def _salud(singular: str, plural: str) -> HistoryTemplate:
    return HistoryTemplate(HistoryCategory.SALUD, HistoryCard.A, singular, plural)


def _rancho(singular: str) -> HistoryTemplate:
    return HistoryTemplate(HistoryCategory.RANCHO, HistoryCard.B, singular)


TEMPLATES: dict[HistoryKey, HistoryTemplate] = {
    HistoryKey.ANIMALS_ADDED: _ganado(
        HistoryCard.A, "Se dio de alta 1 animal", "Se dieron de alta {n} animales"
    ),
    HistoryKey.ANIMALS_REMOVED_SLAUGHTER: _ganado(
        HistoryCard.A,
        "Se dio de baja 1 animal por venta a rastro",
        "Se dieron de baja {n} animales por venta a rastro",
    ),
    HistoryKey.ANIMALS_REMOVED_SOLD: _ganado(
        HistoryCard.A,
        "Se dio de baja 1 animal por venta a otro rancho",
        "Se dieron de baja {n} animales por venta a otro rancho",
    ),
    HistoryKey.ANIMALS_REMOVED_DEATH: _ganado(
        HistoryCard.A,
        "Se dio de baja 1 animal por muerte",
        "Se dieron de baja {n} animales por muerte",
    ),
    HistoryKey.ANIMALS_REMOVED_ERROR: _ganado(
        HistoryCard.B,
        "Se dio de baja 1 animal por error en registro",
        "Se dieron de baja {n} animales por error en registro",
    ),
    HistoryKey.ANIMALS_EDITED: _ganado(
        HistoryCard.A, "Se editó 1 animal", "Se editaron {n} animales"
    ),
    HistoryKey.GROUP_ANIMALS_ADDED: _ganado(
        HistoryCard.A,
        "Se agregó 1 animal al potrero {group}",
        "Se agregaron {n} animales al potrero {group}",
    ),
    HistoryKey.GROUP_EDITED: _ganado(HistoryCard.B, "Se editó el potrero {group}"),
    HistoryKey.GROUP_DELETED: _ganado(
        HistoryCard.B, "Se eliminó {group} potrero y las vacas se enviaron a potrero {to_group}"
    ),
    HistoryKey.GROUP_ANIMALS_MOVED: _ganado(
        HistoryCard.A,
        "Se cambió 1 vaca de potrero {group} a potrero {to_group}",
        "Se cambiaron {n} vacas de potrero {group} a potrero {to_group}",
    ),
    HistoryKey.USERS_ADDED: _usuarios("Se dio de alta 1 usuario", "Se dieron de alta {n} usuarios"),
    HistoryKey.USERS_REMOVED: _usuarios(
        "Se dio de baja 1 usuario", "Se dieron de baja {n} usuarios"
    ),
    HistoryKey.USERS_EDITED: _usuarios("Se editó 1 usuario", "Se editaron {n} usuarios"),
    HistoryKey.DIET_CHANGED: _salud(
        "Se cambió la dieta a 1 animal", "Se cambió la dieta a {n} animales"
    ),
    HistoryKey.ANIMALS_ILL: _salud("Se enfermó 1 animal", "Se enfermaron {n} animales"),
    HistoryKey.ANIMALS_INJURED: _salud("Se accidentó 1 animal", "Se accidentaron {n} animales"),
    HistoryKey.TREATMENT_APPLIED: _salud(
        "Se aplicó tratamiento a 1 animal", "Se aplicó tratamiento a {n} animales"
    ),
    HistoryKey.HEAT_IDENTIFIED: _salud(
        "1 animal se identificó en celo", "{n} animales se identificaron en celo"
    ),
    HistoryKey.PREGNANCY_DIAGNOSED: _salud(
        "1 animal se diagnosticó preñada", "{n} animales se diagnosticaron preñadas"
    ),
    HistoryKey.CALVED: _salud("1 vaca tuvo parto", "{n} vacas tuvieron parto"),
    HistoryKey.TREATMENT_CHANGED: _salud(
        "1 animal que estaba enferma, se le cambió el tratamiento",
        "{n} animales que estaban enfermas, se les cambió el tratamiento",
    ),
    HistoryKey.ANIMALS_CURED: _salud(
        "1 animal que estaba enferma, se curó exitosamente",
        "{n} animales que estaban enfermas, se curaron exitosamente",
    ),
    HistoryKey.PREGNANCY_NEGATIVE: _salud(
        "1 animal se diagnosticó vacía", "{n} animales se diagnosticaron vacías"
    ),
    HistoryKey.ABORTED: _salud("1 vaca tuvo aborto", "{n} vacas tuvieron aborto"),
    HistoryKey.VACCINATED: _salud("Se vacunó 1 animal", "Se vacunaron {n} animales"),
    HistoryKey.WEIGHED: _salud(
        "Se registró el peso de 1 animal", "Se registró el peso de {n} animales"
    ),
    HistoryKey.RANCH_ADDED: _rancho("Se dio de alta el rancho {ranch}"),
    HistoryKey.RANCH_REMOVED: _rancho("Se dio de baja el rancho {ranch}"),
    HistoryKey.RANCH_EDITED: _rancho("Se editó el rancho {ranch}"),
}
