import { RoleConfig, PermissionConfig, UserRoleAssignment, SystemConfig, RolePermissionAssignment, PageConfig, RolePermissionMatrix } from '../types/permission';

export class RolePermissionService {
  private baseUrl = '/api/role-permissions';
  private systemConfigCache: SystemConfig | null = null;

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async getSystemConfig(): Promise<SystemConfig> {
    if (this.systemConfigCache) {
      return this.systemConfigCache;
    }

    try {
      const response = await fetch(`${this.baseUrl}/system-config`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch system config');
      }
      const config = await response.json();
      this.systemConfigCache = config;
      return config;
    } catch (error) {
      console.error('Error fetching system config:', error);
      return this.getDefaultConfig();
    }
  }

  async updateSystemConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/system-config`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(config)
      });
      if (!response.ok) {
        throw new Error('Failed to update system config');
      }
      const updatedConfig = await response.json();
      this.systemConfigCache = updatedConfig;
      return updatedConfig;
    } catch (error) {
      console.error('Error updating system config:', error);
      throw error;
    }
  }

  async getRoles(): Promise<RoleConfig[]> {
    try {
      const response = await fetch(`${this.baseUrl}/roles`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching roles:', error);
      return this.getDefaultRoles();
    }
  }

  async createRole(role: Partial<RoleConfig>): Promise<RoleConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/roles`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(role)
      });
      if (!response.ok) {
        throw new Error('Failed to create role');
      }
      return response.json();
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  async updateRole(id: string, role: Partial<RoleConfig>): Promise<RoleConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/roles/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(role)
      });
      if (!response.ok) {
        throw new Error('Failed to update role');
      }
      return response.json();
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  async deleteRole(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/roles/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  async getPermissions(): Promise<PermissionConfig[]> {
    try {
      const response = await fetch(`${this.baseUrl}/permissions`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return this.getDefaultPermissions();
    }
  }

  async createPermission(permission: Partial<PermissionConfig>): Promise<PermissionConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/permissions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(permission)
      });
      if (!response.ok) {
        throw new Error('Failed to create permission');
      }
      return response.json();
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  }

  async updatePermission(id: string, permission: Partial<PermissionConfig>): Promise<PermissionConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/permissions/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(permission)
      });
      if (!response.ok) {
        throw new Error('Failed to update permission');
      }
      return response.json();
    } catch (error) {
      console.error('Error updating permission:', error);
      throw error;
    }
  }

  async deletePermission(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/permissions/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to delete permission');
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      throw error;
    }
  }

  async assignRoleToPermission(roleId: string, permissionId: string, isGranted: boolean): Promise<RolePermissionAssignment> {
    try {
      const response = await fetch(`${this.baseUrl}/role-permission-assignments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ roleId, permissionId, isGranted })
      });
      if (!response.ok) {
        throw new Error('Failed to assign role permission');
      }
      return response.json();
    } catch (error) {
      console.error('Error assigning role permission:', error);
      throw error;
    }
  }

  async getUserRoles(userId: string): Promise<UserRoleAssignment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/user-role-assignments?userId=${userId}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user roles');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  }

  async assignRoleToUser(assignment: Partial<UserRoleAssignment>): Promise<UserRoleAssignment> {
    try {
      const response = await fetch(`${this.baseUrl}/user-role-assignments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(assignment)
      });
      if (!response.ok) {
        throw new Error('Failed to assign role to user');
      }
      return response.json();
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw error;
    }
  }

  async getRolePermissionMatrix(): Promise<RolePermissionAssignment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/role-permission-assignments`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch role permission matrix');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching role permission matrix:', error);
      return [];
    }
  }

  async checkUserAccess(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/access-check?userId=${encodeURIComponent(userId)}&resource=${encodeURIComponent(resource)}&action=${encodeURIComponent(action)}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to check user access');
      }
      const result = await response.json();
      return result.hasAccess;
    } catch (error) {
      console.error('Error checking user access:', error);
      return false;
    }
  }

  async importConfiguration(config: Partial<SystemConfig>): Promise<SystemConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(config)
      });
      if (!response.ok) {
        throw new Error('Failed to import configuration');
      }
      const importedConfig = await response.json();
      this.systemConfigCache = importedConfig;
      return importedConfig;
    } catch (error) {
      console.error('Error importing configuration:', error);
      throw error;
    }
  }

  async exportConfiguration(): Promise<SystemConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/export`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to export configuration');
      }
      return response.json();
    } catch (error) {
      console.error('Error exporting configuration:', error);
      throw error;
    }
  }

  private getDefaultConfig(): SystemConfig {
    return {
      id: 'default',
      name: 'Default System Configuration',
      description: 'Default role-based access control and face recognition configuration',
      version: '1.0.0',
      isActive: true,
      auth: {
        enableFaceLogin: true,
        enableFaceRegistration: true,
        minFaceQualityScore: 0.7,
        maxFaceDistance: 0.5,
        faceRecognitionModel: 'face-api.js'
      },
      pages: [],
      roles: [],
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private getDefaultRoles(): RoleConfig[] {
    return [
      {
        id: 'super-admin',
        name: 'Super Admin',
        description: 'Full system access with administrative privileges',
        isSystemRole: true,
        permissions: [],
        hierarchy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin',
        name: 'Admin',
        description: 'Administrative access for managing system operations',
        isSystemRole: true,
        permissions: [],
        hierarchy: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'manager',
        name: 'Manager',
        description: 'Management access for team supervision',
        isSystemRole: true,
        permissions: [],
        hierarchy: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'employee',
        name: 'Employee',
        description: 'Standard user access for daily operations',
        isSystemRole: true,
        permissions: [],
        hierarchy: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private getDefaultPermissions(): PermissionConfig[] {
    return [
      {
        id: 'leads-create',
        name: 'Create Leads',
        description: 'Create new lead records',
        resource: 'leads',
        action: 'create',
        icon: 'Add',
        color: '#4CAF50',
        isGlobal: true,
        order: 1,
        requiresAuth: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'leads-read',
        name: 'Read Leads',
        description: 'View lead records',
        resource: 'leads',
        action: 'read',
        icon: 'Visibility',
        color: '#2196F3',
        isGlobal: true,
        order: 2,
        requiresAuth: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'leads-update',
        name: 'Update Leads',
        description: 'Update existing lead records',
        resource: 'leads',
        action: 'update',
        icon: 'Edit',
        color: '#FF9800',
        isGlobal: true,
        order: 3,
        requiresAuth: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'leads-delete',
        name: 'Delete Leads',
        description: 'Delete lead records',
        resource: 'leads',
        action: 'delete',
        icon: 'Delete',
        color: '#F44336',
        isGlobal: true,
        order: 4,
        requiresAuth: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'clients-create',
        name: 'Create Clients',
        description: 'Create new client records',
        resource: 'clients',
        action: 'create',
        icon: 'PersonAdd',
        color: '#4CAF50',
        isGlobal: true,
        order: 5,
        requiresAuth: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'clients-read',
        name: 'Read Clients',
        description: 'View client records',
        resource: 'clients',
        action: 'read',
        icon: 'People',
        color: '#2196F3',
        isGlobal: true,
        order: 6,
        requiresAuth: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'users-manage',
        name: 'Manage Users',
        description: 'Manage user accounts and roles',
        resource: 'users',
        action: 'update',
        icon: 'Group',
        color: '#9C27B0',
        isGlobal: true,
        order: 7,
        requiresAuth: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'settings-edit',
        name: 'Edit Settings',
        description: 'Modify system settings',
        resource: 'settings',
        action: 'update',
        icon: 'Settings',
        color: '#607D8B',
        isGlobal: true,
        order: 8,
        requiresAuth: true,
        requiresRole: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  checkPageAccess(pagePath: string, userRoles: string[]): boolean {
    const page = this.getPageConfig(pagePath);
    if (!page) return false;
    
    if (!page.isVisible) return false;
    
    if (!page.requiresAuth) return true;
    
    return userRoles.some(role => page.roles.includes(role)) || 
           (page.permissions.length > 0 && this.hasAnyPermission(userRoles, page.permissions));
  }

  checkButtonAccess(buttonAction: string, userRoles: string[]): boolean {
    const buttonPermission = this.getPermissionConfig(buttonAction);
    if (!buttonPermission) return false;
    
    if (!buttonPermission.isActive) return false;
    
    if (!buttonPermission.requiresAuth) return true;
    
    if (buttonPermission.requiresRole && !userRoles.includes(buttonPermission.requiresRole)) {
      return false;
    }
    
    return true;
  }

  private getPageConfig(path: string): PageConfig | null {
    if (!this.systemConfigCache) return null;
    
    const findPage = (pages: PageConfig[], targetPath: string): PageConfig | null => {
      for (const page of pages) {
        if (page.path === targetPath) return page;
        if (page.children) {
          const found = findPage(page.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findPage(this.systemConfigCache.pages, path);
  }

  private getPermissionConfig(action: string): PermissionConfig | null {
    if (!this.systemConfigCache) return null;
    
    return this.systemConfigCache.permissions.find(p => p.name === action) || null;
  }

  private hasAnyPermission(userRoles: string[], requiredPermissions: string[]): boolean {
    if (!this.systemConfigCache) return false;
    
    const userPermissions = this.getUserPermissions(userRoles);
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  private getUserPermissions(userRoles: string[]): string[] {
    if (!this.systemConfigCache) return [];
    
    const permissions: string[] = [];
    userRoles.forEach(roleId => {
      const role = this.systemConfigCache!.roles.find(r => r.id === roleId);
      if (role) {
        permissions.push(...role.permissions.map(p => `${p.resource}-${p.action}`));
      }
    });
    return permissions;
  }

  async validateConfig(config: Partial<SystemConfig>): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    if (!config.name) {
      errors.push('Configuration name is required');
    }
    
    if (!config.auth) {
      errors.push('Authentication configuration is required');
    }
    
    if (config.roles) {
      const roleIds = config.roles.map(r => r.id);
      const duplicates = roleIds.filter((id, index) => roleIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate role IDs found: ${duplicates.join(', ')}`);
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  generateRolePermissionMatrix(): RolePermissionMatrix[] {
    if (!this.systemConfigCache) return [];
    
    return this.systemConfigCache.roles.map(role => {
      const permissions = this.getRolePermissions(role.id);
      return {
        roleId: role.id,
        roleName: role.name,
        permissions
      };
    });
  }

  private getRolePermissions(roleId: string): PermissionConfig[] {
    if (!this.systemConfigCache) return [];
    
    const role = this.systemConfigCache.roles.find(r => r.id === roleId);
    if (!role) return [];
    
    const rolePermissionIds = role.permissions.map(p => `${p.resource}-${p.action}`);
    
    return this.systemConfigCache.permissions.filter(p => rolePermissionIds.includes(`${p.resource}-${p.action}`));
  }

  exportSystemConfiguration(): SystemConfig {
    return this.systemConfigCache || this.getDefaultConfig();
  }

  importSystemConfiguration(config: SystemConfig): void {
    this.systemConfigCache = config;
  }

  resetToDefault(): void {
    this.systemConfigCache = this.getDefaultConfig();
  }

  isLoaded(): boolean {
    return this.systemConfigCache !== null;
  }
}