import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';

export interface RolePermission {
  module: string;
  actions: string[]; // ['create', 'read', 'update', 'delete', 'list', 'approve', 'reject', 'export']
}

export interface Role {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  isSuperAdmin: boolean;
  permissions: RolePermission[];
  isActive: boolean;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
  isSuperAdmin?: boolean;
  permissions?: RolePermission[];
}

export interface UpdateRoleRequest {
  name?: string;
  displayName?: string;
  description?: string;
  isSuperAdmin?: boolean;
  permissions?: RolePermission[];
  isActive?: boolean;
  isSystemRole?: boolean;
}

export interface AssignPermissionsRequest {
  permissions: RolePermission[];
}

export interface RolesListResponse {
  code: number;
  status: string;
  data: Role[];
  timestamp: string;
  path: string;
}

export interface RoleResponse {
  code: number;
  status: string;
  data: Role;
  timestamp: string;
  path: string;
}

export interface RolesListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  constructor(private apiService: ApiService) {}

  getRoles(params: RolesListParams = {}): Observable<RolesListResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `/roles${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.apiService.get<RolesListResponse>(endpoint);
  }

  getRoleById(roleId: string): Observable<RoleResponse> {
    return this.apiService.get<RoleResponse>(`/roles/${roleId}`);
  }

  createRole(roleData: CreateRoleRequest): Observable<RoleResponse> {
    return this.apiService.post<RoleResponse>('/roles', roleData);
  }

  updateRole(roleId: string, roleData: UpdateRoleRequest): Observable<RoleResponse> {
    return this.apiService.patch<RoleResponse>(`/roles/${roleId}`, roleData);
  }

  deleteRole(roleId: string): Observable<any> {
    return this.apiService.delete<any>(`/roles/${roleId}`);
  }

  assignPermissions(roleId: string, permissions: RolePermission[]): Observable<RoleResponse> {
    const request: AssignPermissionsRequest = { permissions };
    return this.apiService.post<RoleResponse>(`/roles/${roleId}/permissions`, request);
  }

  // Helper method to get all available modules
  getAvailableModules(): string[] {
    return [
      'users', 'roles', 'permissions', 'attendance', 'leave',
      'holiday', 'tour', 'timelog', 'reports'
    ];
  }

  // Helper method to get all available actions
  getAvailableActions(): string[] {
    return [
      'create', 'read', 'update', 'delete', 'list', 'approve', 'reject', 'export'
    ];
  }

  // Helper method to check if a role has a specific permission
  hasPermission(role: Role, module: string, action: string): boolean {
    if (role.isSuperAdmin) {
      return true;
    }

    const modulePermission = role.permissions.find(p => p.module === module);
    if (!modulePermission) {
      return false;
    }

    return modulePermission.actions.includes(action);
  }

  // Helper method to get all permissions for a specific module
  getModulePermissions(role: Role, module: string): string[] {
    if (role.isSuperAdmin) {
      return this.getAvailableActions();
    }

    const modulePermission = role.permissions.find(p => p.module === module);
    return modulePermission ? modulePermission.actions : [];
  }
}
