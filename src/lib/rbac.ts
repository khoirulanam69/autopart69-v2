// Role-based access control configuration
export type AppRole = 'admin' | 'staff';

// Routes each role can access
export const ROLE_ROUTE_ACCESS: Record<AppRole, string[]> = {
  admin: ['/dashboard', '/products', '/transactions', '/finance', '/settings'],
  staff: ['/dashboard', '/products', '/transactions'],
};

// Allowed roles per route (used by AuthGuard)
export const ROUTE_ALLOWED_ROLES: Record<string, AppRole[]> = {
  '/dashboard': ['admin', 'staff'],
  '/products': ['admin', 'staff'],
  '/transactions': ['admin', 'staff'],
  '/finance': ['admin'],
  '/settings': ['admin'],
};

export function canAccessRoute(role: string | undefined, route: string): boolean {
  if (!role) return false;
  const allowed = ROUTE_ALLOWED_ROLES[route];
  return allowed ? allowed.includes(role as AppRole) : true;
}
