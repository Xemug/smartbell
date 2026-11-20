export const USERS_PATH = '/config/usuarios';

export function fullName(person: { first_name: string; last_name?: string | null }) {
  return [person.first_name, person.last_name].filter(Boolean).join(' ');
}
