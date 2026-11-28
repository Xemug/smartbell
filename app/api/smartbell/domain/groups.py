"""Who may be in which kind of group. Animals never mix across kinds: a bull group holds bulls
on the ranch (EN_RANCHO or AMBOS) only, and a bull never goes into a cow potrero. A semen-only
bull is in no group at all."""

from smartbell.enums import AnimalKind, BullAvailability, GroupType


def on_the_ranch(kind: AnimalKind, availability: BullAvailability | None) -> bool:
    """A bull that is physically on the ranch, so he can be in a bull group."""
    return kind is AnimalKind.TORO and availability is not BullAvailability.SEMEN


def membership_refusal(
    group_type: GroupType, kind: AnimalKind, availability: BullAvailability | None
) -> str | None:
    """Why this animal can't go into a group of this type, as an error code; None if it can.
    Heifers and young males keep what they had before bull groups: only bulls are checked
    against cow potreros."""
    if group_type is GroupType.TORO:
        if kind is not AnimalKind.TORO:
            return "not_a_bull"
        if availability is BullAvailability.SEMEN:
            return "bull_semen_only"
        return None
    if kind is AnimalKind.TORO:
        return "not_a_cow"
    return None


REFUSAL_MESSAGES = {
    "not_a_bull": "En un grupo de toros solo van toros",
    "not_a_cow": "Un toro va en un grupo de toros, no en un potrero de vacas",
    "bull_semen_only": "Un toro solo semen no está en ningún grupo",
}
