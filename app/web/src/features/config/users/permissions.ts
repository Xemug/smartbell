import type { Permission, Role } from '../../../app/useActiveRanch';

/** The tabs of "Personalizar permisos" (mobile-core E8), each with its §7.8 codes in order. */
export const permissionCategories: { key: string; codes: Permission[] }[] = [
  {
    key: 'ganado',
    codes: [
      'ANIMALS_CREATE',
      'ANIMALS_VIEW',
      'ANIMALS_EDIT',
      'ANIMALS_DELETE',
      'GROUPS_CREATE',
      'GROUPS_VIEW_EDIT',
      'GROUPS_DELETE',
    ],
  },
  { key: 'usuarios', codes: ['USERS_ADD', 'USERS_VIEW', 'USERS_EDIT', 'USERS_DELETE'] },
  { key: 'dispositivos', codes: ['DEVICES_ADD_VIEW', 'DEVICES_ASSIGN', 'DEVICES_DELETE'] },
  { key: 'salud', codes: ['EVENTS_RECORD'] },
  { key: 'reportes', codes: ['REPORTS_VIEW', 'REPORTS_EXPORT'] },
  { key: 'finanzas', codes: ['FINANCES', 'SINIIGA', 'DECLARATION_SEND', 'BILLING'] },
];

/** The roles a member can be given; Dueño is the owner's alone. */
export const memberRoles = ['ADMINISTRADOR', 'MEDICO', 'NUTRIOLOGO', 'TECNICO_CAMPO'] as const;
export type MemberRole = (typeof memberRoles)[number];

export function isMemberRole(role: Role): role is MemberRole {
  return (memberRoles as readonly string[]).includes(role);
}
