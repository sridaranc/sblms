import { useAppSelector } from '../store/hooks';

export function usePermission() {
  const { user, permissions } = useAppSelector((state) => state.auth);
  const userPermissions = user?.permissions || permissions || [];

  const has = (permission: string): boolean => userPermissions.includes(permission);
  const hasAny = (...perms: string[]): boolean => perms.some((p) => userPermissions.includes(p));
  const hasAll = (...perms: string[]): boolean => perms.every((p) => userPermissions.includes(p));
  const isAdmin = (): boolean => {
    const role = (user?.role || '').toLowerCase();
    const roles = (user?.roles || []).map(r => r.toLowerCase());
    return role === 'admin' || roles.includes('admin') || role === 'superadmin' || roles.includes('superadmin');
  };

  return { has, hasAny, hasAll, isAdmin, permissions: userPermissions };
}
