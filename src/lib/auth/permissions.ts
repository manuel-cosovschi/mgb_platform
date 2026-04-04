import { UserRole } from "@prisma/client";

export type Permission =
  | "projects:read"
  | "projects:write"
  | "projects:delete"
  | "tasks:read"
  | "tasks:write"
  | "tasks:delete"
  | "clients:read"
  | "clients:write"
  | "clients:delete"
  | "invoices:read"
  | "invoices:write"
  | "invoices:delete"
  | "employees:read"
  | "employees:write"
  | "employees:delete"
  | "finance:read"
  | "finance:write"
  | "documents:read"
  | "documents:write"
  | "documents:delete"
  | "settings:read"
  | "settings:write"
  | "partners:read"
  | "partners:write"
  | "analytics:read"
  | "time:read"
  | "time:write"
  | "okrs:read"
  | "okrs:write";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SOCIO: [
    "projects:read", "projects:write", "projects:delete",
    "tasks:read", "tasks:write", "tasks:delete",
    "clients:read", "clients:write", "clients:delete",
    "invoices:read", "invoices:write", "invoices:delete",
    "employees:read", "employees:write", "employees:delete",
    "finance:read", "finance:write",
    "documents:read", "documents:write", "documents:delete",
    "settings:read", "settings:write",
    "partners:read", "partners:write",
    "analytics:read",
    "time:read", "time:write",
    "okrs:read", "okrs:write",
  ],
  EMPLEADO: [
    "projects:read",
    "tasks:read", "tasks:write",
    "clients:read",
    "documents:read", "documents:write",
    "time:read", "time:write",
    "okrs:read",
  ],
  CLIENTE: [
    "projects:read",
    "tasks:read",
    "documents:read",
    "invoices:read",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function requireRole(userRole: UserRole, ...roles: UserRole[]): boolean {
  return roles.includes(userRole);
}
