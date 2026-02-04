import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserService, User, UserListParams, RoleRef } from './user.service';
import { UserFormModalComponent } from './user-form-modal/user-form-modal.component';
import { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';
import { DateRangeModalComponent } from './date-range-modal/date-range-modal.component';
import { AuditLogsService, AuditLog } from '../../audit-logs/services/audit-logs.service';
import { ApiService } from '../../../shared/services/api.service';
import { STATE_MAHARASHTRA, DISTRICTS, getTalukasForDistrict } from '../../../shared/constants/location.constants';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UserFormModalComponent, ConfirmModalComponent, DateRangeModalComponent]
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalUsers = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50, 100];

  // Search and filters
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  stateFilter = '';
  cityFilter = '';
  centerFilter = '';

  // Static location data (Maharashtra districts and talukas)
  readonly stateOptions = [STATE_MAHARASHTRA];
  readonly districts = DISTRICTS;
  talukas: string[] = [];

  // Action menu state
  openActionMenuId: string | null = null;

    // Sorting
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Modal states
  showUserModal = false;
  showDeleteModal = false;
  showLogsModal = false;
  showStatusModal = false;
  showImportModal = false;
  showLogoutModal = false;
  showReportModal = false;
  selectedUser: User | null = null;
  deleteLoading = false;
  statusLoading = false;
  logoutLoading = false;
  reportLoading = false;
  
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
    private auditLogsService: AuditLogsService,
    private apiService: ApiService,
    private elementRef: ElementRef
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Check if click is outside action menu containers
    if (!target.closest('.action-menu-container')) {
      this.closeActionMenu();
    }
    if (!this.elementRef.nativeElement.contains(event.target)) {
      // dropdowns closed via template select elements now
    }
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(_event?: Event): void {
    this.closeActionMenu();
  }

  onStateChange(): void {
    this.stateFilter = this.stateFilter || '';
    this.cityFilter = '';
    this.centerFilter = '';
    this.talukas = [];
    this.currentPage = 1;
    this.loadUsers();
  }

  onCityChange(): void {
    this.talukas = getTalukasForDistrict(this.cityFilter);
    this.centerFilter = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  onCenterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  clearFilters(): void {
    this.stateFilter = '';
    this.cityFilter = '';
    this.centerFilter = '';
    this.talukas = [];
    this.currentPage = 1;
    this.loadUsers();
  }

  getSelectedStateName(): string {
    return this.stateFilter || 'Select State';
  }

  getSelectedCityName(): string {
    return this.cityFilter || 'Select City / District';
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

    if (this.stateFilter) {
      params.state = this.stateFilter;
    }

    if (this.cityFilter) {
      params.city = this.cityFilter;
    }

    if (this.centerFilter.trim()) {
      params.center = this.centerFilter.trim();
    }

    this.userService.getUsers(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Extract users from nested data structure: response.data.data
          let workingList: User[] = Array.isArray(response?.data?.data) ? response.data.data : [];

          // Client-side filter by status (if needed, can be moved to backend later)
          if (this.statusFilter !== 'all') {
            const isActive = this.statusFilter === 'active';
            workingList = workingList.filter(user => user.isActive === isActive);
          }

          this.users = workingList;

          // Update pagination from backend response
          if (response?.pagination) {
            this.totalUsers = response.pagination.total || 0;
            // Sync current page and page size with backend if they differ
            if (response.pagination.page !== undefined) {
              this.currentPage = response.pagination.page;
            }
            if (response.pagination.limit !== undefined) {
              this.pageSize = response.pagination.limit;
            }
          } else {
            // Fallback if pagination is not in response
            this.totalUsers = workingList.length;
          }

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

  openLogoutModal(user: User): void {
    this.selectedUser = user;
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
    this.selectedUser = null;
  }

  onLogoutConfirm(): void {
    if (!this.selectedUser) return;
    this.logoutLoading = true;
    this.userService.logoutFromAllDevices(this.selectedUser._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.logoutLoading = false;
          this.closeLogoutModal();
          this.refreshUsers();
        },
        error: (error) => {
          this.logoutLoading = false;
          console.error('Error logging out user from all devices:', error);
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

  toggleActionMenu(userId: string, event: Event): void {
    event.stopPropagation();
    const wasOpen = this.openActionMenuId === userId;
    this.openActionMenuId = wasOpen ? null : userId;
    
    // If opening, calculate and set dropdown position
    if (!wasOpen && event.target) {
      setTimeout(() => {
        this.updateDropdownPosition(event.target as HTMLElement);
      }, 0);
    }
  }
  
  private updateDropdownPosition(buttonElement: HTMLElement): void {
    // Find the closest action-menu-container to get the correct dropdown
    const container = buttonElement.closest('.action-menu-container');
    if (!container) return;
    
    const dropdown = container.querySelector('.action-menu-dropdown') as HTMLElement;
    if (!dropdown || !buttonElement) return;
    
    // Get button position relative to viewport (getBoundingClientRect gives viewport coordinates)
    const rect = buttonElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get actual dropdown dimensions after it's rendered
    const dropdownRect = dropdown.getBoundingClientRect();
    const dropdownHeight = dropdownRect.height || 400; // Fallback to estimate if not measured
    const dropdownWidth = dropdownRect.width || 220; // Fallback to min-width if not measured
    
    // Calculate position using viewport coordinates (for fixed positioning)
    // Show below button by default, aligned to right edge
    let top = rect.bottom + 8;
    let left = rect.right - dropdownWidth; // Align right edge of dropdown with right edge of button
    
    // Adjust if dropdown would go off screen bottom
    if (top + dropdownHeight > viewportHeight - 8) {
      // Show above button instead
      top = rect.top - dropdownHeight - 8;
      // Ensure it doesn't go above viewport
      if (top < 8) {
        top = 8;
        // If still too tall, allow scrolling within viewport
        dropdown.style.maxHeight = `${viewportHeight - top - 16}px`;
        dropdown.style.overflowY = 'auto';
      } else {
        dropdown.style.maxHeight = '';
        dropdown.style.overflowY = '';
      }
    } else {
      dropdown.style.maxHeight = '';
      dropdown.style.overflowY = '';
    }
    
    // Adjust if dropdown would go off screen right
    if (rect.right - dropdownWidth < 8) {
      // Align to left side of button
      left = rect.left;
      dropdown.setAttribute('data-align-left', 'true');
    } else {
      dropdown.removeAttribute('data-align-left');
    }
    
    // Ensure dropdown doesn't go off screen left
    if (left < 8) {
      left = 8;
    }
    
    // Set position using fixed positioning (viewport coordinates)
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
    dropdown.style.right = 'auto';
    dropdown.style.zIndex = '10000';
  }

  closeActionMenu(): void {
    this.openActionMenuId = null;
    // Clean up any dropdown positioning styles
    const dropdowns = document.querySelectorAll('.action-menu-dropdown');
    dropdowns.forEach((dropdown: Element) => {
      const el = dropdown as HTMLElement;
      el.style.top = '';
      el.style.left = '';
      el.style.right = '';
      el.style.position = '';
      el.style.zIndex = '';
      el.style.maxHeight = '';
      el.style.overflowY = '';
      el.removeAttribute('data-align-left');
    });
  }

  isActionMenuOpen(userId: string): boolean {
    return this.openActionMenuId === userId;
  }

  handleAction(action: string, user: User, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.closeActionMenu();

    switch (action) {
      case 'view':
        this.viewUserDetails(user._id);
        break;
      case 'edit':
        this.openEditUserModal(user);
        break;
      case 'delete':
        this.openDeleteUserModal(user);
        break;
      case 'logs':
        this.openLogsModal(user._id);
        break;
      case 'logout':
        if (user.isLoggedIn) {
          this.openLogoutModal(user);
        }
        break;
      case 'activate':
      case 'deactivate':
        this.openStatusModal(user);
        break;
      case 'download-report':
        this.openReportModal(user);
        break;
    }
  }

  openReportModal(user: User): void {
    this.selectedUser = user;
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.selectedUser = null;
    this.reportLoading = false;
  }

  onReportDateRangeConfirm(dateRange: { startDate: string; endDate: string }): void {
    if (!this.selectedUser) return;
    
    this.reportLoading = true;
    this.userService.downloadComprehensiveReport(
      this.selectedUser._id,
      dateRange.startDate,
      dateRange.endDate
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const fileName = `User_Report_${this.selectedUser?.firstname}_${this.selectedUser?.lastname}_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`;
          a.download = fileName;
          a.click();
          window.URL.revokeObjectURL(url);
          this.reportLoading = false;
          this.closeReportModal();
        },
        error: (error) => {
          console.error('Error downloading report:', error);
          this.reportLoading = false;
          alert('Failed to download report. Please try again.');
        }
      });
  }
}
