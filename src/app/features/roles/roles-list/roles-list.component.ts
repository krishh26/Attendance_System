import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { RolesService, Role, RolesListParams, RolePermission } from '../services/roles.service';
import { PermissionService } from '../../../shared/services/permission.service';
import { RoleFormComponent, RoleFormData } from '../components/role-form/role-form.component';

@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RoleFormComponent]
})
export class RolesListComponent implements OnInit, OnDestroy {
  roles: Role[] = [];
  loading = false;
  error: string | null = null;

  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedRole: Role | undefined = undefined;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalRoles = 0;

  // Search and filters
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  // Sorting
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Summary statistics
  summaryStats = {
    totalRoles: 0,
    activeRoles: 0,
    totalPermissions: 0,
    usersWithRoles: 0
  };

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private rolesService: RolesService,
    private permissionService: PermissionService
  ) {
    // Debounce search input
    this.searchSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.searchTerm = searchTerm;
        this.currentPage = 1;
        this.loadRoles();
      });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoles(): void {
    this.loading = true;
    this.error = null;

    const params: RolesListParams = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    this.rolesService.getRoles(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let filteredRoles = response.data;

          // Apply status filter on client side since API doesn't support it
          if (this.statusFilter !== 'all') {
            const isActive = this.statusFilter === 'active';
            filteredRoles = response.data.filter(role => role.isActive === isActive);
          }

          this.roles = filteredRoles;
          this.totalRoles = filteredRoles.length;
          this.updateSummaryStats();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load roles. Please try again.';
          this.loading = false;
          console.error('Error loading roles:', error);
        }
      });
  }

  updateSummaryStats(): void {
    this.summaryStats.totalRoles = this.roles.length;
    this.summaryStats.activeRoles = this.roles.filter(role => role.isActive).length;

    // Calculate total permissions across all roles
    let totalActions = 0;
    this.roles.forEach(role => {
      role.permissions.forEach(permission => {
        totalActions += permission.actions.length;
      });
    });
    this.summaryStats.totalPermissions = totalActions;

    // For now, we'll set a default value for users with roles
    // In a real app, you'd get this from a separate API call
    this.summaryStats.usersWithRoles = this.roles.length * 2; // Placeholder
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onStatusFilterChange(status: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadRoles();
  }

  refreshRoles(): void {
    this.loadRoles();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.loadRoles();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRoles();
  }

  get totalPages(): number {
    return Math.ceil(this.totalRoles / this.pageSize);
  }

  get pages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  getPermissionGroups(permissions: RolePermission[]): { [key: string]: RolePermission[] } {
    return permissions.reduce((groups: { [key: string]: RolePermission[] }, permission) => {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }
      groups[permission.module].push(permission);
      return groups;
    }, {});
  }

  getTotalActions(permissions: RolePermission[]): number {
    return permissions.reduce((total, permission) => total + permission.actions.length, 0);
  }

  // Permission checks
  canCreateRole(): boolean {
    return this.permissionService.hasPermission('roles', 'create');
  }

  canUpdateRole(): boolean {
    return this.permissionService.hasPermission('roles', 'update');
  }

  canDeleteRole(): boolean {
    return this.permissionService.hasPermission('roles', 'delete');
  }

  canViewRoleDetails(): boolean {
    return this.permissionService.hasPermission('roles', 'read');
  }

  // Modal methods
  openCreateRoleModal(): void {
    this.showCreateModal = true;
  }

  openEditRoleModal(role: Role): void {
    this.selectedRole = role;
    this.showEditModal = true;
  }

  openDeleteRoleModal(role: Role): void {
    this.selectedRole = role;
    this.showDeleteModal = true;
  }

  viewRoleDetails(roleId: string): void {
    // TODO: Navigate to role details page
    console.log('View role details:', roleId);
  }

  // Form handling
  onRoleSave(formData: RoleFormData): void {
    if (this.showEditModal && this.selectedRole) {
      this.updateRole(this.selectedRole._id, formData);
    } else {
      this.createRole(formData);
    }
  }

  onRoleCancel(): void {
    this.closeModals();
  }

  private createRole(formData: RoleFormData): void {
    this.loading = true;
    this.error = null;

    this.rolesService.createRole(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.closeModals();
          this.loadRoles();
          // TODO: Show success message
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to create role. Please try again.';
          console.error('Error creating role:', error);
        }
      });
  }

  private updateRole(roleId: string, formData: RoleFormData): void {
    this.loading = true;
    this.error = null;

    this.rolesService.updateRole(roleId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.closeModals();
          this.loadRoles();
          // TODO: Show success message
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to update role. Please try again.';
          console.error('Error updating role:', error);
        }
      });
  }

  confirmDeleteRole(): void {
    if (!this.selectedRole) return;

    this.loading = true;
    this.error = null;

    this.rolesService.deleteRole(this.selectedRole._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.closeModals();
          this.loadRoles();
          // TODO: Show success message
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to delete role. Please try again.';
          console.error('Error deleting role:', error);
        }
      });
  }

  private closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedRole = undefined;
  }
}
