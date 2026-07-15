import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';

interface PermissionGuardProps {
  children: ReactNode;
  requires?: string[];
  requiresAll?: boolean;
  fallbackPath?: string;
}

export function PermissionGuard({
  children,
  requires,
  requiresAll = false,
  fallbackPath = '/unauthorized',
}: PermissionGuardProps) {
  const { hasAny, hasAll, isAdmin } = usePermission();

  if (isAdmin()) {
    return <>{children}</>;
  }

  if (!requires || requires.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = requiresAll ? hasAll(...requires) : hasAny(...requires);

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
