/**
 * Utility functions for safely handling user roles and permissions
 */

/**
 * Safely checks if a user role is included in an array of allowed roles
 * Handles cases where role might be an object or undefined
 */
export function hasRole(userRole: any, allowedRoles: string[]): boolean {
  if (!userRole || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return false;
  }
  
  // Convert role to string if it's not already a string
  const normalizedRole = typeof userRole === 'string' ? userRole : String(userRole);
  
  // Debug logging for invalid role types
  if (typeof userRole !== 'string') {
    console.warn('hasRole: Invalid role type detected:', {
      userRole,
      roleType: typeof userRole,
      normalizedRole,
      allowedRoles
    });
  }
  
  return allowedRoles.includes(normalizedRole);
}

/**
 * Safely extracts a user role as a string
 */
export function getUserRole(currentUser: any): string | null {
  if (!currentUser || !currentUser.role) {
    return null;
  }
  
  const role = currentUser.role;
  return typeof role === 'string' ? role : String(role);
}

/**
 * Checks if a user has any of the specified roles
 */
export function hasAnyRole(currentUser: any, allowedRoles: string[]): boolean {
  const userRole = getUserRole(currentUser);
  return userRole ? hasRole(userRole, allowedRoles) : false;
}

/**
 * Checks if a user has admin role
 */
export function isAdmin(currentUser: any): boolean {
  return hasAnyRole(currentUser, ['admin']);
}

/**
 * Checks if a user has customer care role
 */
export function isCustomerCare(currentUser: any): boolean {
  return hasAnyRole(currentUser, ['customer-care']);
}

/**
 * Checks if a user has technician role
 */
export function isTechnician(currentUser: any): boolean {
  return hasAnyRole(currentUser, ['technician']);
}

/**
 * Checks if a user has manager role
 */
export function isManager(currentUser: any): boolean {
  return hasAnyRole(currentUser, ['manager']);
}
