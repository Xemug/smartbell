"""The role presets match docs/domain-model.md §7.8 cell by cell, read from the doc itself."""

import re
from pathlib import Path

import pytest

from smartbell.enums import Role
from smartbell.security.permissions import ROLE_PRESETS, Permission, effective, preset

DOMAIN_MODEL = Path(__file__).resolve().parents[3] / "docs" / "domain-model.md"

ROW_CODES = {
    "Altas vacas": Permission.ANIMALS_CREATE,
    "Consulta inventario vacas": Permission.ANIMALS_VIEW,
    "Editar información de vaca": Permission.ANIMALS_EDIT,
    "Eliminar vacas": Permission.ANIMALS_DELETE,
    "Agregar grupos": Permission.GROUPS_CREATE,
    "Consulta / Editar grupos": Permission.GROUPS_VIEW_EDIT,
    "Eliminar grupos": Permission.GROUPS_DELETE,
    "Agregar usuarios": Permission.USERS_ADD,
    "Consulta listado / actividad usuarios": Permission.USERS_VIEW,
    "Editar usuarios": Permission.USERS_EDIT,
    "Eliminar usuarios": Permission.USERS_DELETE,
    "Agregar / consultar dispositivos": Permission.DEVICES_ADD_VIEW,
    "Asignar dispositivo a vaca": Permission.DEVICES_ASSIGN,
    "Eliminar dispositivo": Permission.DEVICES_DELETE,
    "Confirmación alertas reproducción, registro / seguimiento salud": Permission.EVENTS_RECORD,
    "Ver reportes": Permission.REPORTS_VIEW,
    "Reportes personalizados imprimir / descargar": Permission.REPORTS_EXPORT,
    "REEMO / SINIIGA": Permission.SINIIGA,
    "Ingresos y egresos": Permission.FINANCES,
    "Envío de declaración": Permission.DECLARATION_SEND,
    "Facturación planes smartbell": Permission.BILLING,
}
COLUMN_ROLES = {
    "Dueño": Role.DUENO,
    "Admin": Role.ADMINISTRADOR,
    "Médico": Role.MEDICO,
    "Nutriólogo": Role.NUTRIOLOGO,
    "Técnico": Role.TECNICO_CAMPO,
}


def _matrix() -> dict[tuple[Permission, Role], bool]:
    """The §7.8 table as {(code, role): allowed}."""
    text = DOMAIN_MODEL.read_text(encoding="utf-8")
    section = text.split("### 7.8 Role permissions", 1)[1].split("\n### ", 1)[0]
    rows = [line for line in section.splitlines() if line.startswith("|")]
    cells = [[cell.strip() for cell in row.strip("|").split("|")] for row in rows]
    header, body = cells[0], [row for row in cells[2:]]  # cells[1] is the |---| rule.
    roles = [COLUMN_ROLES[name] for name in header[1:]]
    matrix: dict[tuple[Permission, Role], bool] = {}
    for label, *marks in body:
        for role, mark in zip(roles, marks, strict=True):
            assert re.fullmatch("[✓✗]", mark), f"{label!r}/{role}: {mark!r}"
            matrix[(ROW_CODES[label], role)] = mark == "✓"
    return matrix


MATRIX = _matrix()


def test_the_doc_table_covers_every_code_and_role() -> None:
    assert {code for code, _ in MATRIX} == set(Permission)
    assert {role for _, role in MATRIX} == set(Role)


@pytest.mark.parametrize(("code", "role"), [pytest.param(c, r, id=f"{r}-{c}") for (c, r) in MATRIX])
def test_preset_matches_the_matrix(code: Permission, role: Role) -> None:
    assert (code in ROLE_PRESETS[role]) is MATRIX[(code, role)]
    assert (code.value in preset(role)) is MATRIX[(code, role)]


def test_the_matrix_spot_checks_from_the_spec() -> None:
    assert Permission.ANIMALS_CREATE not in ROLE_PRESETS[Role.TECNICO_CAMPO]
    assert Permission.ANIMALS_CREATE not in ROLE_PRESETS[Role.NUTRIOLOGO]
    assert Permission.ANIMALS_CREATE in ROLE_PRESETS[Role.MEDICO]
    assert Permission.USERS_DELETE in ROLE_PRESETS[Role.DUENO]
    assert Permission.USERS_DELETE not in ROLE_PRESETS[Role.ADMINISTRADOR]


def test_presets_are_stored_in_table_order() -> None:
    order = list(Permission)
    for role in Role:
        codes = [Permission(code) for code in preset(role)]
        assert codes == sorted(codes, key=order.index)


def test_the_dueno_has_everything_whatever_is_stored() -> None:
    assert effective(Role.DUENO, []) == frozenset(Permission)


def test_effective_reads_the_stored_codes_and_skips_unknown_ones() -> None:
    stored = [Permission.ANIMALS_VIEW.value, "RETIRED_CODE"]

    assert effective(Role.ADMINISTRADOR, stored) == {Permission.ANIMALS_VIEW}
