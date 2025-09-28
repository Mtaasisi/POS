// Role-Based Access Control (RBAC) utility for LATS module
export type UserRole = 'admin' | 'customer-care' | 'technician' | 'viewer';

export interface Permission {
  resource: string;
  action: string;
  roles: UserRole[];
}

export interface RoutePermission {
  path: string;
  roles: UserRole[];
  exact?: boolean;
}

// Define permissions for LATS module
const LATS_PERMISSIONS: Permission[] = [
  // Inventory Management
  { resource: 'inventory', action: 'view', roles: ['admin', 'customer-care', 'technician'] },
  { resource: 'inventory', action: 'create', roles: ['admin'] },
  { resource: 'inventory', action: 'edit', roles: ['admin'] },
  { resource: 'inventory', action: 'delete', roles: ['admin'] },
  { resource: 'inventory', action: 'manage', roles: ['admin'] },

  // Categories
  { resource: 'categories', action: 'view', roles: ['admin', 'customer-care', 'technician'] },
  { resource: 'categories', action: 'create', roles: ['admin'] },
  { resource: 'categories', action: 'edit', roles: ['admin'] },
  { resource: 'categories', action: 'delete', roles: ['admin'] },

  // Brands
  { resource: 'brands', action: 'view', roles: ['admin', 'customer-care', 'technician'] },
  { resource: 'brands', action: 'create', roles: ['admin'] },
  { resource: 'brands', action: 'edit', roles: ['admin'] },
  { resource: 'brands', action: 'delete', roles: ['admin'] },

  // Suppliers
  { resource: 'suppliers', action: 'view', roles: ['admin'] },
  { resource: 'suppliers', action: 'create', roles: ['admin'] },
  { resource: 'suppliers', action: 'edit', roles: ['admin'] },
  { resource: 'suppliers', action: 'delete', roles: ['admin'] },

  // Products
  { resource: 'products', action: 'view', roles: ['admin', 'technician'] },
  { resource: 'products', action: 'create', roles: ['admin'] },
  { resource: 'products', action: 'edit', roles: ['admin'] },
  { resource: 'products', action: 'delete', roles: ['admin'] },

  // Stock Management
  { resource: 'stock', action: 'view', roles: ['admin', 'technician'] },
  { resource: 'stock', action: 'adjust', roles: ['admin', 'technician'] },
  { resource: 'stock', action: 'history', roles: ['admin'] },

  // Purchase Orders
  { resource: 'purchase-orders', action: 'view', roles: ['admin'] },
  { resource: 'purchase-orders', action: 'create', roles: ['admin'] },
  { resource: 'purchase-orders', action: 'edit', roles: ['admin'] },
  { resource: 'purchase-orders', action: 'delete', roles: ['admin'] },
  { resource: 'purchase-orders', action: 'receive', roles: ['admin'] },

  // Spare Parts
  { resource: 'spare-parts', action: 'view', roles: ['admin', 'technician'] },
  { resource: 'spare-parts', action: 'create', roles: ['admin'] },
  { resource: 'spare-parts', action: 'edit', roles: ['admin'] },
  { resource: 'spare-parts', action: 'delete', roles: ['admin'] },
  { resource: 'spare-parts', action: 'use', roles: ['admin', 'technician'] },

  // POS
  { resource: 'pos', action: 'view', roles: ['admin', 'customer-care'] },
  { resource: 'pos', action: 'sell', roles: ['admin', 'customer-care'] },
  { resource: 'pos', action: 'refund', roles: ['admin'] },
  { resource: 'pos', action: 'void', roles: ['admin'] },

  // POS Inventory
  { resource: 'pos-inventory', action: 'view', roles: ['admin', 'customer-care'] },
  { resource: 'pos-inventory', action: 'search', roles: ['admin', 'customer-care'] },
  { resource: 'pos-inventory', action: 'add-to-cart', roles: ['admin', 'customer-care'] },

  // Sales
  { resource: 'sales', action: 'view', roles: ['admin', 'customer-care'] },
  { resource: 'sales', action: 'create', roles: ['admin', 'customer-care'] },
  { resource: 'sales', action: 'edit', roles: ['admin'] },
  { resource: 'sales', action: 'delete', roles: ['admin'] },
  { resource: 'sales', action: 'refund', roles: ['admin'] },

  // Reports
  { resource: 'reports', action: 'view', roles: ['admin', 'customer-care'] },
  { resource: 'reports', action: 'export', roles: ['admin', 'customer-care'] },
  { resource: 'reports', action: 'daily-close', roles: ['admin', 'customer-care'] },

  // Analytics
  { resource: 'analytics', action: 'view', roles: ['admin'] },
  { resource: 'analytics', action: 'export', roles: ['admin'] },

  // Settings
  { resource: 'settings', action: 'view', roles: ['admin'] },
  { resource: 'settings', action: 'edit', roles: ['admin'] },

  // System
  { resource: 'system', action: 'admin', roles: ['admin'] },
  { resource: 'system', action: 'debug', roles: ['admin'] }
];

// Define route permissions
const LATS_ROUTE_PERMISSIONS: RoutePermission[] = [
  // Inventory routes
  { path: '/lats/inventory/management', roles: ['admin'] },
  { path: '/lats/inventory/new', roles: ['admin'] },
  { path: '/lats/inventory/products', roles: ['admin', 'technician'] },
  { path: '/lats/inventory/products/:id/edit', roles: ['admin'] },
  { path: '/lats/inventory/purchase-orders', roles: ['admin'] },
  { path: '/lats/inventory/purchase-orders/new', roles: ['admin'] },

  // Product routes
  { path: '/lats/add-product', roles: ['admin'] },

  // Spare parts routes
  { path: '/lats/spare-parts', roles: ['admin', 'technician'] },

  // POS routes
  { path: '/lats/pos-inventory', roles: ['admin', 'customer-care'] },
  { path: '/lats/pos', roles: ['admin', 'customer-care'] }
];

class RBACManager {
  private permissions: Permission[] = LATS_PERMISSIONS;
  private routePermissions: RoutePermission[] = LATS_ROUTE_PERMISSIONS;

  /**
   * Check if a user has permission for a specific resource and action
   */
  can(userRole: UserRole, resource: string, action: string): boolean {
    const permission = this.permissions.find(
      p => p.resource === resource && p.action === action
    );

    if (!permission) {
      return false;
    }

    return permission.roles.includes(userRole);
  }

  /**
   * Check if a user can access a specific route
   */
  canAccessRoute(userRole: UserRole, path: string): boolean {
    // Find matching route permission
    const routePermission = this.routePermissions.find(route => {
      if (route.exact) {
        return route.path === path;
      }
      
      // For non-exact matches, check if the path starts with the route path
      return path.startsWith(route.path);
    });

    if (!routePermission) {
      // If no specific permission is defined, allow access
      return true;
    }

    return routePermission.roles.includes(userRole);
  }

  /**
   * Check if a user role has a specific permission
   */
  hasPermission(role: UserRole, resource: string, action: string): boolean {
    const hierarchy = this.getRoleHierarchy();
    const accessibleRoles = hierarchy[role] || [];
    
    return this.permissions.some(permission => 
      permission.resource === resource &&
      permission.action === action &&
      permission.roles.some(r => accessibleRoles.includes(r))
    );
  }

  /**
   * Get all permissions for a specific role
   */
  getRolePermissions(role: UserRole): Permission[] {
    return this.permissions.filter(permission => 
      permission.roles.includes(role)
    );
  }

  /**
   * Get all accessible routes for a specific role
   */
  getAccessibleRoutes(role: UserRole): string[] {
    return this.routePermissions
      .filter(route => route.roles.includes(role))
      .map(route => route.path);
  }

  /**
   * Add a new permission
   */
  addPermission(permission: Permission): void {
    this.permissions.push(permission);
  }

  /**
   * Remove a permission
   */
  removePermission(resource: string, action: string): void {
    this.permissions = this.permissions.filter(
      p => !(p.resource === resource && p.action === action)
    );
  }

  /**
   * Add a new route permission
   */
  addRoutePermission(routePermission: RoutePermission): void {
    this.routePermissions.push(routePermission);
  }

  /**
   * Remove a route permission
   */
  removeRoutePermission(path: string): void {
    this.routePermissions = this.routePermissions.filter(
      r => r.path !== path
    );
  }

  /**
   * Get all available roles
   */
  getAvailableRoles(): UserRole[] {
    return ['admin', 'customer-care', 'technician', 'viewer'];
  }

  /**
   * Get role hierarchy (higher roles inherit permissions from lower roles)
   */
  getRoleHierarchy(): Record<UserRole, UserRole[]> {
    return {
      'admin': ['admin', 'customer-care', 'technician', 'viewer'],
      'customer-care': ['customer-care', 'viewer'],
      'technician': ['technician', 'viewer'],
      'viewer': ['viewer']
    };
  }

  /**
   * Check if a role has access to another role's permissions
   */
  hasRoleAccess(userRole: UserRole, targetRole: UserRole): boolean {
    const hierarchy = this.getRoleHierarchy();
    return hierarchy[userRole]?.includes(targetRole) || false;
  }

  /**
   * Get all permissions that a role can access (including inherited)
   */
  getAllRolePermissions(role: UserRole): Permission[] {
    const hierarchy = this.getRoleHierarchy();
    const accessibleRoles = hierarchy[role] || [];
    
    return this.permissions.filter(permission => 
      permission.roles.some(r => accessibleRoles.includes(r))
    );
  }

  /**
   * Validate a permission structure
   */
  validatePermission(permission: Permission): boolean {
    return !!(
      permission.resource &&
      permission.action &&
      permission.roles &&
      permission.roles.length > 0 &&
      permission.roles.every(role => this.getAvailableRoles().includes(role))
    );
  }

  /**
   * Validate a route permission structure
   */
  validateRoutePermission(routePermission: RoutePermission): boolean {
    return !!(
      routePermission.path &&
      routePermission.roles &&
      routePermission.roles.length > 0 &&
      routePermission.roles.every(role => this.getAvailableRoles().includes(role))
    );
  }

  /**
   * Get permission summary for a role
   */
  getPermissionSummary(role: UserRole): Record<string, string[]> {
    const permissions = this.getAllRolePermissions(role);
    const summary: Record<string, string[]> = {};

    permissions.forEach(permission => {
      if (!summary[permission.resource]) {
        summary[permission.resource] = [];
      }
      summary[permission.resource].push(permission.action);
    });

    return summary;
  }

  /**
   * Check if a user can perform multiple actions on a resource
   */
  canMultiple(userRole: UserRole, resource: string, actions: string[]): boolean {
    return actions.every(action => this.can(userRole, resource, action));
  }

  /**
   * Get all resources a role can access
   */
  getAccessibleResources(role: UserRole): string[] {
    const permissions = this.getAllRolePermissions(role);
    return [...new Set(permissions.map(p => p.resource))];
  }

  /**
   * Get all actions a role can perform on a specific resource
   */
  getAccessibleActions(role: UserRole, resource: string): string[] {
    const permissions = this.getAllRolePermissions(role);
    return permissions
      .filter(p => p.resource === resource)
      .map(p => p.action);
  }
}

// Export singleton instance
export const rbacManager = new RBACManager();

// Convenience functions
export const allow = (userRole: UserRole, resource: string, action: string): boolean => 
  rbacManager.can(userRole, resource, action);

export const allowRoute = (userRole: UserRole, path: string): boolean => 
  rbacManager.canAccessRoute(userRole, path);

export const getRolePermissions = (role: UserRole): Permission[] => 
  rbacManager.getRolePermissions(role);

export const getAccessibleRoutes = (role: UserRole): string[] => 
  rbacManager.getAccessibleRoutes(role);

export const getAvailableRoles = (): UserRole[] => 
  rbacManager.getAvailableRoles();

export const hasRoleAccess = (userRole: UserRole, targetRole: UserRole): boolean => 
  rbacManager.hasRoleAccess(userRole, targetRole);

export const getAllRolePermissions = (role: UserRole): Permission[] => 
  rbacManager.getAllRolePermissions(role);

export const getPermissionSummary = (role: UserRole): Record<string, string[]> => 
  rbacManager.getPermissionSummary(role);

export const canMultiple = (userRole: UserRole, resource: string, actions: string[]): boolean => 
  rbacManager.canMultiple(userRole, resource, actions);

export const getAccessibleResources = (role: UserRole): string[] => 
  rbacManager.getAccessibleResources(role);

export const getAccessibleActions = (role: UserRole, resource: string): string[] => 
  rbacManager.getAccessibleActions(role, resource);
