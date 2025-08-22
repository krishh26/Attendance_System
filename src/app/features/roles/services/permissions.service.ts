import { Injectable } from '@angular/core';
import { RolePermission } from './roles.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  // Get all available modules
  getAvailableModules(): string[] {
    return [
      'users',
      'roles',
      'permissions',
      'attendance',
      'leave',
      'holiday',
      'tour',
      'timelog',
      'reports'
    ];
  }

  // Get all available actions
  getAvailableActions(): string[] {
    return [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'approve',
      'reject',
      'export'
    ];
  }

  // Helper method to generate all possible permissions for a module
  generateModulePermissions(module: string): RolePermission[] {
    const actions = this.getAvailableActions();
    return actions.map(action => ({
      module,
      actions: [action]
    }));
  }

  // Helper method to generate all possible permissions for all modules
  generateAllPermissions(): RolePermission[] {
    const modules = this.getAvailableModules();
    const actions = this.getAvailableActions();

    const permissions: RolePermission[] = [];
    modules.forEach(module => {
      permissions.push({
        module,
        actions: [...actions]
      });
    });

    return permissions;
  }

  // Helper method to get permission description
  getPermissionDescription(module: string, action: string): string {
    const actionMap: { [key: string]: string } = {
      'create': 'Create new',
      'read': 'View',
      'update': 'Modify',
      'delete': 'Remove',
      'list': 'View list of',
      'approve': 'Approve',
      'reject': 'Reject',
      'export': 'Export'
    };

    const moduleMap: { [key: string]: string } = {
      'users': 'users',
      'roles': 'roles',
      'permissions': 'permissions',
      'attendance': 'attendance records',
      'leave': 'leave requests',
      'holiday': 'holidays',
      'tour': 'tour requests',
      'timelog': 'time logs',
      'reports': 'reports'
    };

    const actionText = actionMap[action] || action;
    const moduleText = moduleMap[module] || module;

    return `${actionText} ${moduleText}`;
  }

  // Helper method to get permission display name
  getPermissionDisplayName(module: string, action: string): string {
    const actionDisplay = action.charAt(0).toUpperCase() + action.slice(1);
    const moduleDisplay = module.charAt(0).toUpperCase() + module.slice(1);
    return `${actionDisplay} ${moduleDisplay}`;
  }
}
