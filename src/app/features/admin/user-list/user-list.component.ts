import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserService, User, UserListParams, RoleRef } from './user.service';
import { UserFormModalComponent } from './user-form-modal/user-form-modal.component';
import { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';
import { AuditLogsService, AuditLog } from '../../audit-logs/services/audit-logs.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UserFormModalComponent, ConfirmModalComponent]
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  pageSizeOptions: number[] = [10, 25, 50, 100];

  // Search and filters
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

    // Sorting
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Modal states
  showUserModal = false;
  showDeleteModal = false;
  showLogsModal = false;
  showStatusModal = false;
  showImportModal = false;
  selectedUser: User | null = null;
  deleteLoading = false;
  statusLoading = false;
  nextActiveState: boolean | null = null;
  userLogs: AuditLog[] = [];
  selectedFile: File | null = null;
  importing = false;
  importSummary: any = null;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private router: Router,
    private userService: UserService,
    private auditLogsService: AuditLogsService
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
        this.loadUsers();
      });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  openLogsModal(userId: string): void {
    this.showLogsModal = true;
    this.userLogs = [];
    this.auditLogsService.list({ module: 'users', entityId: userId, page: 1, limit: 20 }).subscribe((res : any) => {
      this.userLogs = res.data?.data;
    });
  }

  closeLogsModal(): void {
    this.showLogsModal = false;
  }

  // Import modal handlers
  openImportModal(): void {
    this.showImportModal = true;
    this.selectedFile = null;
    this.importSummary = null;
  }

  closeImportModal(): void {
    this.showImportModal = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = (input.files && input.files[0]) ? input.files[0] : null;
  }

  startImport(): void {
    if (!this.selectedFile) return;
    this.importing = true;
    this.importSummary = null;
    this.userService.importUsers(this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.importing = false;
          this.importSummary = res.data?.data || res;
          this.closeImportModal();
          this.refreshUsers();
        },
        error: (err) => {
          this.importing = false;
          this.importSummary = null;
          this.selectedFile = null;
          this.closeImportModal();
          console.error('Import failed', err);
        }
      });
  }

  downloadTemplate(): void {
    this.userService.downloadImportTemplate().subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  // Helpers for import summary rendering
  get importErrors(): any[] {
    const errors = this.importSummary && this.importSummary.errors;
    return Array.isArray(errors) ? errors : [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    const params: UserListParams = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    this.userService.getUsers(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let workingList: User[] = Array.isArray(response?.data) ? response.data : [];

          // Client-side filter by status
          if (this.statusFilter !== 'all') {
            const isActive = this.statusFilter === 'active';
            workingList = workingList.filter(user => user.isActive === isActive);
          }

          // Client-side sort fallback
          const compare = (a: User, b: User): number => {
            let aVal: any;
            let bVal: any;
            if (this.sortBy === 'firstname') {
              aVal = (a.firstname || '').toLowerCase();
              bVal = (b.firstname || '').toLowerCase();
            } else if (this.sortBy === 'email') {
              aVal = (a.email || '').toLowerCase();
              bVal = (b.email || '').toLowerCase();
            } else if (this.sortBy === 'createdAt') {
              aVal = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
              bVal = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
            } else {
              aVal = (a as any)[this.sortBy];
              bVal = (b as any)[this.sortBy];
            }
            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
          };
          workingList = [...workingList].sort((a, b) => this.sortOrder === 'asc' ? compare(a, b) : compare(b, a));

          // Pagination slice
          this.totalUsers = workingList.length;
          const startIndex = (this.currentPage - 1) * this.pageSize;
          const endIndex = startIndex + this.pageSize;
          this.users = workingList.slice(startIndex, endIndex);
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load users. Please try again.';
          this.loading = false;
          console.error('Error loading users:', error);
        }
      });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onStatusFilterChange(status: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadUsers();
  }

  refreshUsers(): void {
    this.loadUsers();
  }

  // Modal methods
  openAddUserModal(): void {
    this.selectedUser = null;
    this.showUserModal = true;
  }

  openEditUserModal(user: User): void {
    this.selectedUser = user;
    this.showUserModal = true;
  }

  openDeleteUserModal(user: User): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = null;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  openStatusModal(user: User): void {
    this.selectedUser = user;
    this.nextActiveState = !user.isActive;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedUser = null;
    this.nextActiveState = null;
  }

  onUserSaved(user: User): void {
    this.closeUserModal();
    this.refreshUsers();
  }

  onDeleteConfirm(): void {
    if (this.selectedUser) {
      this.deleteLoading = true;
      this.userService.deleteUser(this.selectedUser._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.deleteLoading = false;
            this.closeDeleteModal();
            this.refreshUsers();
          },
          error: (error) => {
            this.deleteLoading = false;
            console.error('Error deleting user:', error);
            // You could show a toast notification here
          }
        });
    }
  }

  onStatusConfirm(): void {
    if (!this.selectedUser || this.nextActiveState === null) return;
    this.statusLoading = true;
    this.userService.updateUser(this.selectedUser._id, { isActive: this.nextActiveState })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.statusLoading = false;
          this.closeStatusModal();
          this.refreshUsers();
        },
        error: (error) => {
          this.statusLoading = false;
          console.error('Error updating status:', error);
        }
      });
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.loadUsers();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
    this.loadUsers();
  }

  get totalPages(): number {
    return Math.ceil(this.totalUsers / this.pageSize);
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

  get rangeStart(): number {
    if (this.totalUsers === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    if (this.totalUsers === 0) return 0;
    return Math.min(this.currentPage * this.pageSize, this.totalUsers);
  }

  viewUserDetails(userId: string): void {
    this.router.navigate(['/admin/users/details', userId]);
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  getFullName(user: User): string {
    return `${user.firstname} ${user.lastname}`.trim();
  }

  getProfileImage(user: User): string {
    const name = this.getFullName(user);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
  }

  getRoleClass(user: User): string {
    if (!user.role) return 'role-none';
    const roleName = typeof user.role === 'string' ? user.role : (user.role as RoleRef)?.name;
    const safe = String(roleName || 'none').toLowerCase();
    return `role-${safe}`;
  }
}
