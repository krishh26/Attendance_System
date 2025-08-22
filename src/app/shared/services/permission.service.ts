import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService, User } from '../../features/auth/services/auth.service';

export interface UserPermissions {
  [module: string]: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private permissionsChangedSubject = new BehaviorSubject<void>(undefined);
  public permissionsChanged$ = this.permissionsChangedSubject.asObservable();

  constructor(private authService: AuthService) {}

  /**
   * Refresh permissions and notify subscribers
   */
  refreshPermissions(): void {
    console.log('Refreshing permissions...');
    this.logUserPermissions();
    this.permissionsChangedSubject.next(undefined);
  }

  /**
   * Check if the current user has a specific permission
   */
  hasPermission(module: string, action: string): boolean {
    const user = this.authService.getUser();
    if (!user) {
      console.log('Permission check failed: No user found');
      return false;
    }

    // Super admin has all permissions - no need to check further
    if (user.isSuperAdmin) {
      console.log(`Permission check: Super admin access granted for ${module}:${action}`);
      return true;
    }

    // If user has no role, they have full access (legacy behavior)
    if (!user.role) {
      console.log(`Permission check: No role assigned, granting full access for ${module}:${action}`);
      return true;
    }

    // Check if user has the specific permission
    const permissions = user.permissions || [];
    const modulePermission = permissions.find(p => p.module === module);

    if (!modulePermission) {
      console.log(`Permission check failed: No permissions found for module '${module}'`);
      return false;
    }

    const hasAction = modulePermission.actions.includes(action);
    console.log(`Permission check: ${module}:${action} - ${hasAction ? 'GRANTED' : 'DENIED'}`);
    console.log(`Available actions for ${module}:`, modulePermission.actions);

    return hasAction;
  }

  /**
   * Check if the current user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => {
      const [module, action] = permission.split(':');
      return this.hasPermission(module, action);
    });
  }

  /**
   * Check if the current user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => {
      const [module, action] = permission.split(':');
      return this.hasPermission(module, action);
    });
  }

  /**
   * Check if the current user is a super admin
   */
  isSuperAdmin(): boolean {
    const user = this.authService.getUser();
    return user?.isSuperAdmin || false;
  }

  /**
   * Check if the current user has super admin privileges
   * This method provides a quick way to check super admin status
   */
  isCurrentUserSuperAdmin(): boolean {
    return this.isSuperAdmin();
  }

  /**
   * Check if the current user has a specific role
   */
  hasRole(roleName: string): boolean {
    const user = this.authService.getUser();
    if (!user || !user.role) {
      return false;
    }
    return user.role.name === roleName;
  }

  /**
   * Get all permissions for a specific module
   */
  getModulePermissions(module: string): string[] {
    const user = this.authService.getUser();
    if (!user) {
      return [];
    }

    // Super admin has all permissions for all modules
    if (user.isSuperAdmin) {
      return ['create', 'read', 'update', 'delete', 'list', 'approve', 'reject', 'export'];
    }

    // If user has no role, they have full access
    if (!user.role) {
      return ['create', 'read', 'update', 'delete', 'list', 'approve', 'reject', 'export'];
    }

    // Get permissions for the specific module
    const permissions = user.permissions || [];
    const modulePermission = permissions.find(p => p.module === module);
    return modulePermission ? modulePermission.actions : [];
  }

  /**
   * Get user permissions organized by module
   */
  getUserPermissions(): UserPermissions {
    const user = this.authService.getUser();
    if (!user) {
      return {};
    }

    // Super admin has all permissions for all modules
    if (user.isSuperAdmin) {
      const allActions = ['create', 'read', 'update', 'delete', 'list', 'approve', 'reject', 'export'];
      const modules = ['users', 'roles', 'permissions', 'attendance', 'leave', 'holiday', 'tour', 'timelog', 'reports'];

      const permissions: UserPermissions = {};
      modules.forEach(module => {
        permissions[module] = allActions;
      });
      return permissions;
    }

    // If user has no role, they have full access
    if (!user.role) {
      const allActions = ['create', 'read', 'update', 'delete', 'list', 'approve', 'reject', 'export'];
      const modules = ['users', 'roles', 'permissions', 'attendance', 'leave', 'holiday', 'tour', 'timelog', 'reports'];

      const permissions: UserPermissions = {};
      modules.forEach(module => {
        permissions[module] = allActions;
      });
      return permissions;
    }

    // Organize permissions by module
    const permissions: UserPermissions = {};
    const userPermissions = user.permissions || [];

    userPermissions.forEach(permission => {
      permissions[permission.module] = permission.actions;
    });

    return permissions;
  }

  /**
   * Check if user can access a specific route based on permissions
   */
  canAccessRoute(route: string): boolean {
    const user = this.authService.getUser();

    // Super admin can access all routes
    if (user?.isSuperAdmin) {
      console.log(`Route access: Super admin granted access to ${route}`);
      return true;
    }

    // Map routes to required permissions
    const routePermissions: { [key: string]: string } = {
      '/admin/user-list': 'users:list',
      '/admin/leave/list': 'leave:list',
      '/admin/timelog/list': 'timelog:list',
      '/admin/roles/list': 'roles:list',
      '/admin/holiday/list': 'holiday:list',
      '/admin/tour/list': 'tour:list'
    };

    const requiredPermission = routePermissions[route];
    if (!requiredPermission) {
      return true; // No permission required for this route
    }

    const [module, action] = requiredPermission.split(':');
    return this.hasPermission(module, action);
  }

  /**
   * Get all accessible routes for the current user
   */
  getAccessibleRoutes(): string[] {
    const user = this.authService.getUser();

    // Super admin can access all routes
    if (user?.isSuperAdmin) {
      return [
        '/admin/dashboard',
        '/admin/user-list',
        '/admin/leave/list',
        '/admin/timelog/list',
        '/admin/roles/list',
        '/admin/holiday/list',
        '/admin/tour/list'
      ];
    }

    const allRoutes = [
      '/admin/dashboard',
      '/admin/user-list',
      '/admin/leave/list',
      '/admin/timelog/list',
      '/admin/roles/list',
      '/admin/holiday/list',
      '/admin/tour/list'
    ];

    return allRoutes.filter(route => this.canAccessRoute(route));
  }

  /**
   * Check if user can access a specific module
   */
  canAccessModule(module: string): boolean {
    const user = this.authService.getUser();

    // Super admin can access all modules
    if (user?.isSuperAdmin) {
      return true;
    }

    const modulePermissions = this.getModulePermissions(module);
    return modulePermissions.length > 0;
  }

  /**
   * Check if user can create items in a module
   */
  canCreate(module: string): boolean {
    return this.hasPermission(module, 'create');
  }

  /**
   * Check if user can read items in a module
   */
  canRead(module: string): boolean {
    return this.hasPermission(module, 'read');
  }

  /**
   * Check if user can update items in a module
   */
  canUpdate(module: string): boolean {
    return this.hasPermission(module, 'update');
  }

  /**
   * Check if user can delete items in a module
   */
  canDelete(module: string): boolean {
    return this.hasPermission(module, 'delete');
  }

  /**
   * Check if user can list items in a module
   */
  canList(module: string): boolean {
    return this.hasPermission(module, 'list');
  }

  /**
   * Check if user can approve items in a module
   */
  canApprove(module: string): boolean {
    return this.hasPermission(module, 'approve');
  }

  /**
   * Check if user can reject items in a module
   */
  canReject(module: string): boolean {
    return this.hasPermission(module, 'reject');
  }

  /**
   * Check if user can export items in a module
   */
  canExport(module: string): boolean {
    return this.hasPermission(module, 'export');
  }

  /**
   * Get a summary of the current user's permissions for debugging
   */
  getPermissionSummary(): string {
    const user = this.authService.getUser();
    if (!user) {
      return 'No user logged in';
    }

    if (user.isSuperAdmin) {
      return 'Super Admin - Full Access to All Modules and Actions';
    }

    if (!user.role) {
      return 'No Role Assigned - Full Access (Legacy)';
    }

    const permissions = user.permissions || [];
    if (permissions.length === 0) {
      return `Role: ${user.role.displayName} - No Permissions`;
    }

    const summary = permissions.map(p => `${p.module}: [${p.actions.join(', ')}]`).join(' | ');
    return `Role: ${user.role.displayName} - ${summary}`;
  }

  /**
   * Log the current user's permissions for debugging
   */
  logUserPermissions(): void {
    console.log('=== User Permission Summary ===');
    console.log(this.getPermissionSummary());

    const user = this.authService.getUser();
    if (user) {
      console.log('User Details:', {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        isSuperAdmin: user.isSuperAdmin
      });
    }
    console.log('===============================');
  }

  /**
   * Check if user has any permissions for a specific module
   */
  hasAnyModulePermission(module: string): boolean {
    const user = this.authService.getUser();
    if (!user) {
      return false;
    }

    // Super admin has all permissions
    if (user.isSuperAdmin) {
      return true;
    }

    // If user has no role, they have full access
    if (!user.role) {
      return true;
    }

    // Check if user has any permissions for the module
    const permissions = user.permissions || [];
    const modulePermission = permissions.find(p => p.module === module);

    return !!(modulePermission && modulePermission.actions.length > 0);
  }

  /**
   * Get all modules the user has access to
   */
  getAccessibleModules(): string[] {
    const allModules = ['users', 'roles', 'permissions', 'attendance', 'leave', 'holiday', 'tour', 'timelog', 'reports'];

    return allModules.filter(module => this.hasAnyModulePermission(module));
  }

  /**
   * Check if user has a specific action permission in any module
   */
  hasActionInAnyModule(action: string): boolean {
    const user = this.authService.getUser();
    if (!user) { return false; }

    // Super admin has all actions
    if (user.isSuperAdmin) {
      return true;
    }

    // If user has no role, they have all actions
    if (!user.role) {
      return true;
    }

    // Check if user has the action in any module
    const permissions = user.permissions || [];
    return permissions.some(permission => permission.actions.includes(action));
  }
}
