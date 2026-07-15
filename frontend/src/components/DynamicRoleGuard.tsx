import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { RolePermissionService } from '../services/rolePermissionService';

interface DynamicRoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export function DynamicRoleGuard({ 
  children, 
  allowedRoles, 
  requiredPermissions, 
  fallbackPath = '/unauthorized' 
}: DynamicRoleGuardProps) {
  const location = useLocation();
  const { user } = useAppSelector(state => state.auth);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const rolePermissionService = new RolePermissionService();
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        const userRoles = [user.role];
        const hasRoleAccess = allowedRoles ? userRoles.some(role => allowedRoles.includes(role)) : true;
        const hasPermissionAccess = requiredPermissions ? await checkUserPermissions(userRoles, requiredPermissions) : true;
        
        const pageHasAccess = rolePermissionService.checkPageAccess(location.pathname, userRoles);
        const hasAllRequirements = hasRoleAccess && hasPermissionAccess && pageHasAccess;
        
        setHasAccess(hasAllRequirements);
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, allowedRoles, requiredPermissions, location.pathname]);

  const checkUserPermissions = async (_userRoles: string[], requiredPermissions: string[]): Promise<boolean> => {
    try {
      for (const permission of requiredPermissions) {
        const hasPermission = await rolePermissionService.checkUserAccess(
          user?.id || '', 
          permission.split('-')[0], // Extract resource from permission
          permission.split('-')[1]   // Extract action from permission
        );
        if (!hasPermission) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}