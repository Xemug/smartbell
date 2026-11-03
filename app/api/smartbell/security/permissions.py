"""Permission codes and the role presets of docs/domain-model.md §7.8, the confirmed matrix.

A membership stores its own list of codes. It starts as its role's preset, and `user-admin` may
edit it later. Endpoints declare a code with `require(...)` instead of checking roles.
"""

from enum import StrEnum, auto

from smartbell.enums import Role


class Permission(StrEnum):
    """One code per row of the §7.8 table, in its order. The value is the name."""

    @staticmethod
    def _generate_next_value_(name: str, start: int, count: int, last_values: list[str]) -> str:
        return name

    ANIMALS_CREATE = auto()  # Altas vacas
    ANIMALS_VIEW = auto()  # Consulta inventario vacas
    ANIMALS_EDIT = auto()  # Editar información de vaca
    ANIMALS_DELETE = auto()  # Eliminar vacas
    GROUPS_CREATE = auto()  # Agregar grupos
    GROUPS_VIEW_EDIT = auto()  # Consulta / Editar grupos
    GROUPS_DELETE = auto()  # Eliminar grupos
    USERS_ADD = auto()  # Agregar usuarios
    USERS_VIEW = auto()  # Consulta listado / actividad usuarios
    USERS_EDIT = auto()  # Editar usuarios
    USERS_DELETE = auto()  # Eliminar usuarios
    DEVICES_ADD_VIEW = auto()  # Agregar / consultar dispositivos
    DEVICES_ASSIGN = auto()  # Asignar dispositivo a vaca
    DEVICES_DELETE = auto()  # Eliminar dispositivo
    EVENTS_RECORD = auto()  # Confirmación alertas reproducción, registro / seguimiento salud
    REPORTS_VIEW = auto()  # Ver reportes
    REPORTS_EXPORT = auto()  # Reportes personalizados imprimir / descargar
    SINIIGA = auto()  # REEMO / SINIIGA
    FINANCES = auto()  # Ingresos y egresos
    DECLARATION_SEND = auto()  # Envío de declaración
    BILLING = auto()  # Facturación planes smartbell


P = Permission
_ALL = frozenset(Permission)

ROLE_PRESETS: dict[Role, frozenset[Permission]] = {
    Role.DUENO: _ALL,
    Role.ADMINISTRADOR: _ALL - {P.USERS_DELETE, P.SINIIGA, P.DECLARATION_SEND, P.BILLING},
    Role.MEDICO: frozenset(
        {
            P.ANIMALS_CREATE,
            P.ANIMALS_VIEW,
            P.ANIMALS_EDIT,
            P.ANIMALS_DELETE,
            P.GROUPS_CREATE,
            P.GROUPS_VIEW_EDIT,
            P.GROUPS_DELETE,
            P.USERS_VIEW,
            P.DEVICES_ADD_VIEW,
            P.DEVICES_ASSIGN,
            P.EVENTS_RECORD,
            P.REPORTS_VIEW,
            P.REPORTS_EXPORT,
        }
    ),
    Role.NUTRIOLOGO: frozenset(
        {
            P.ANIMALS_VIEW,
            P.ANIMALS_EDIT,
            P.GROUPS_VIEW_EDIT,
            P.USERS_VIEW,
            P.EVENTS_RECORD,
            P.REPORTS_VIEW,
            P.REPORTS_EXPORT,
        }
    ),
    Role.TECNICO_CAMPO: frozenset(
        {
            P.ANIMALS_VIEW,
            P.ANIMALS_EDIT,
            P.GROUPS_CREATE,
            P.GROUPS_VIEW_EDIT,
            P.USERS_VIEW,
            P.EVENTS_RECORD,
            P.REPORTS_VIEW,
        }
    ),
}


def preset(role: Role) -> list[str]:
    """The codes a new membership with this role starts with, in table order, as stored."""
    return [code.value for code in Permission if code in ROLE_PRESETS[role]]


def effective(role: Role, stored: list[str]) -> frozenset[Permission]:
    """What a member may do. The Dueño always has everything; unknown stored codes are ignored."""
    if role is Role.DUENO:
        return _ALL
    known = {code.value for code in Permission}
    return frozenset(Permission(code) for code in stored if code in known)
