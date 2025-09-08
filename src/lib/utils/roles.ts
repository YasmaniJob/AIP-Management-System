// Role types and utilities

export type DatabaseRole = 'Administrador' | 'Docente';

export const normalizeRole = (role: string): DatabaseRole => {
  const lowerRole = role.toLowerCase();
  if (lowerRole === 'admin' || lowerRole === 'administrador') {
    return 'Administrador';
  }
  return 'Docente'; // Default to 'Docente' for any other role
};

export const isAdminRole = (role: string): boolean => {
  return normalizeRole(role) === 'Administrador';
};

export const ROLES = {
  ADMIN: 'Administrador',
  TEACHER: 'Docente'
} as const;
