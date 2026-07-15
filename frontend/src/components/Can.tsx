import { type ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';

interface CanProps {
  permission?: string;
  any?: string[];
  all?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ permission, any: anyPerms, all: allPerms, children, fallback = null }: CanProps) {
  const { has, hasAny, hasAll, isAdmin } = usePermission();

  if (isAdmin()) {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = has(permission);
  } else if (anyPerms && anyPerms.length > 0) {
    hasAccess = hasAny(...anyPerms);
  } else if (allPerms && allPerms.length > 0) {
    hasAccess = hasAll(...allPerms);
  } else {
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
