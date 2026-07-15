export interface RolePermissionConfig {
  id: string;
  role: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  conditions?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleConfig {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: RolePermissionConfig[];
  hierarchy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
  expiresAt?: Date;
  isActive: boolean;
}

export interface PermissionConfig {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  icon?: string;
  color?: string;
  isGlobal: boolean;
  parentId?: string;
  order: number;
  requiresAuth: boolean;
  requiresRole?: string;
  conditions?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissionMatrix {
  roleId: string;
  roleName: string;
  permissions: PermissionConfig[];
}

export interface AuthConfig {
  enableFaceLogin: boolean;
  enableFaceRegistration: boolean;
  minFaceQualityScore: number;
  maxFaceDistance: number;
  faceRecognitionModel: string;
}

export interface PageConfig {
  path: string;
  name: string;
  icon?: string;
  component: string;
  layout: 'full' | 'sidebar' | 'modal';
  roles: string[];
  permissions: string[];
  isVisible: boolean;
  order: number;
  children?: PageConfig[];
  requiresAuth: boolean;
  allowedMethods?: string[];
}

export interface SystemConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  auth: AuthConfig;
  pages: PageConfig[];
  roles: RoleConfig[];
  permissions: PermissionConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissionAssignment {
  id: string;
  roleId: string;
  permissionId: string;
  isGranted: boolean;
  conditions?: string;
  createdAt: Date;
  updatedAt: Date;
}