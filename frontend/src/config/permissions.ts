export interface PagePermission {
  page: string;
  route: string;
  icon: string;
  category: string;
  permissions: {
    create?: string[];
    read?: string[];
    update?: string[];
    delete?: string[];
    execute?: string[];
  };
  description: string;
}

export interface RolePermissions {
  [role: string]: {
    pages: string[];
    permissions: {
      [page: string]: {
        create: boolean;
        read: boolean;
        update: boolean;
        delete: boolean;
        execute: boolean;
      };
    };
  };
}

export const PAGES: PagePermission[] = [
  // Dashboard
  {
    page: 'dashboard',
    route: '/dashboard',
    icon: 'Dashboard',
    category: 'main',
    permissions: { read: ['admin', 'manager', 'employee'] },
    description: 'View dashboard with statistics and quick actions',
  },

  // Leads Management
  {
    page: 'leads',
    route: '/leads',
    icon: 'Assignment',
    category: 'sales',
    permissions: {
      create: ['admin', 'manager', 'employee'],
      read: ['admin', 'manager', 'employee'],
      update: ['admin', 'manager', 'employee'],
      delete: ['admin', 'manager'],
      execute: ['admin', 'manager', 'employee'],
    },
    description: 'Manage sales leads - create, view, edit, delete, assign, export',
  },

  // AI Leads
  {
    page: 'ai-leads',
    route: '/ai-leads',
    icon: 'AutoAwesome',
    category: 'sales',
    permissions: {
      create: ['admin', 'manager'],
      read: ['admin', 'manager'],
      execute: ['admin', 'manager'],
    },
    description: 'AI-powered lead generation and management',
  },

  // Clients
  {
    page: 'clients',
    route: '/clients',
    icon: 'Business',
    category: 'sales',
    permissions: {
      create: ['admin', 'manager'],
      read: ['admin', 'manager', 'employee'],
      update: ['admin', 'manager'],
      delete: ['admin'],
    },
    description: 'Manage client accounts and projects',
  },

  // Follow-ups
  {
    page: 'follow-ups',
    route: '/follow-ups',
    icon: 'FollowTheSigns',
    category: 'operations',
    permissions: {
      create: ['admin', 'manager', 'employee'],
      read: ['admin', 'manager', 'employee'],
      update: ['admin', 'manager', 'employee'],
      delete: ['admin', 'manager'],
      execute: ['admin', 'manager', 'employee'],
    },
    description: 'Track and manage follow-up activities',
  },

  // Meetings
  {
    page: 'meetings',
    route: '/meetings',
    icon: 'Event',
    category: 'operations',
    permissions: {
      create: ['admin', 'manager', 'employee'],
      read: ['admin', 'manager', 'employee'],
      update: ['admin', 'manager', 'employee'],
      delete: ['admin', 'manager'],
      execute: ['admin', 'manager', 'employee'],
    },
    description: 'Schedule and manage meetings',
  },

  // Reports
  {
    page: 'reports',
    route: '/reports',
    icon: 'Assessment',
    category: 'analytics',
    permissions: {
      read: ['admin', 'manager'],
      execute: ['admin', 'manager'],
    },
    description: 'View reports, analytics, and export data',
  },

  // Notifications
  {
    page: 'notifications',
    route: '/notifications',
    icon: 'Notifications',
    category: 'main',
    permissions: {
      read: ['admin', 'manager', 'employee'],
      update: ['admin', 'manager', 'employee'],
      execute: ['admin', 'manager', 'employee'],
    },
    description: 'View and manage notifications',
  },

  // Users Management
  {
    page: 'users',
    route: '/users',
    icon: 'People',
    category: 'admin',
    permissions: {
      create: ['admin'],
      read: ['admin'],
      update: ['admin'],
      delete: ['admin'],
    },
    description: 'Manage user accounts and roles',
  },

  // Face Enrolment
  {
    page: 'face-enrolment',
    route: '/face-enrolment',
    icon: 'Face',
    category: 'admin',
    permissions: {
      create: ['admin'],
      read: ['admin'],
      update: ['admin'],
      delete: ['admin'],
    },
    description: 'Manage face recognition enrolment for users',
  },

  // Attendance
  {
    page: 'attendance',
    route: '/attendance',
    icon: 'AccessTime',
    category: 'hr',
    permissions: {
      create: ['admin', 'manager', 'employee'],
      read: ['admin', 'manager', 'employee'],
      execute: ['admin', 'manager', 'employee'],
    },
    description: 'Check in/out with face verification and geolocation',
  },

  // Settings
  {
    page: 'settings',
    route: '/settings',
    icon: 'Settings',
    category: 'admin',
    permissions: {
      read: ['admin', 'manager', 'employee'],
      update: ['admin'],
    },
    description: 'Application settings and configuration',
  },

  // Role Management
  {
    page: 'role-management',
    route: '/settings/roles',
    icon: 'AdminPanelSettings',
    category: 'admin',
    permissions: {
      create: ['admin'],
      read: ['admin'],
      update: ['admin'],
      delete: ['admin'],
    },
    description: 'Manage roles and permission assignments',
  },

  // System Config
  {
    page: 'system-config',
    route: '/settings/system',
    icon: 'Tune',
    category: 'admin',
    permissions: {
      read: ['admin'],
      update: ['admin'],
    },
    description: 'System configuration and settings',
  },
];

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  admin: {
    pages: PAGES.map(p => p.page),
    permissions: PAGES.reduce((acc, page) => {
      acc[page.page] = {
        create: true,
        read: true,
        update: true,
        delete: true,
        execute: true,
      };
      return acc;
    }, {} as Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean; execute: boolean }>),
  },
  manager: {
    pages: PAGES.filter(p => !['role-management', 'system-config', 'users'].includes(p.page)).map(p => p.page),
    permissions: PAGES.reduce((acc, page) => {
      const isAdminOnly = ['role-management', 'system-config', 'users'].includes(page.page);
      acc[page.page] = {
        create: !isAdminOnly && !!page.permissions.create?.includes('manager'),
        read: !!page.permissions.read?.includes('manager'),
        update: !isAdminOnly && !!page.permissions.update?.includes('manager'),
        delete: !isAdminOnly && !!page.permissions.delete?.includes('manager'),
        execute: !isAdminOnly && !!page.permissions.execute?.includes('manager'),
      };
      return acc;
    }, {} as Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean; execute: boolean }>),
  },
  employee: {
    pages: PAGES.filter(p => ['dashboard', 'leads', 'clients', 'follow-ups', 'meetings', 'notifications', 'attendance', 'settings'].includes(p.page)).map(p => p.page),
    permissions: PAGES.reduce((acc, page) => {
      const isHigherRole = !['dashboard', 'leads', 'clients', 'follow-ups', 'meetings', 'notifications', 'attendance', 'settings'].includes(page.page);
      acc[page.page] = {
        create: !isHigherRole && !!page.permissions.create?.includes('employee'),
        read: !isHigherRole && !!page.permissions.read?.includes('employee'),
        update: !isHigherRole && !!page.permissions.update?.includes('employee'),
        delete: false,
        execute: !isHigherRole && !!page.permissions.execute?.includes('employee'),
      };
      return acc;
    }, {} as Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean; execute: boolean }>),
  },
};

export function hasPermission(role: string, page: string, action: keyof typeof DEFAULT_ROLE_PERMISSIONS.admin.permissions[string]): boolean {
  const rolePerms = DEFAULT_ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;
  if (!rolePerms.pages.includes(page)) return false;
  return rolePerms.permissions[page]?.[action] ?? false;
}

export function getPagePermissions(page: string): PagePermission | undefined {
  return PAGES.find(p => p.page === page);
}

export function canAccessPage(role: string, page: string): boolean {
  const pageConfig = getPagePermissions(page);
  if (!pageConfig) return false;
  const rolePerms = DEFAULT_ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;
  return rolePerms.pages.includes(page);
}
