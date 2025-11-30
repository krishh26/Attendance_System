import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserService, User, UserListParams, RoleRef } from './user.service';
import { UserFormModalComponent } from './user-form-modal/user-form-modal.component';
import { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';
import { AuditLogsService, AuditLog } from '../../audit-logs/services/audit-logs.service';
import { StateService } from './services/state.service';
import { CityService } from './services/city.service';
import { ApiService } from '../../../shared/services/api.service';

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
  pageSize = 5;
  totalUsers = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50, 100];

  // Search and filters
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  stateFilter = '';
  cityFilter = '';
  centerFilter = '';
  
  // State and City data
  states: any[] = [];
  allStates: any[] = []; // Store all states for client-side pagination
  cities: any[] = [];
  allCities: any[] = []; // Store all cities for client-side pagination
  statesLoading = false;
  citiesLoading = false;
  isStateDropdownOpen = false;
  isCityDropdownOpen = false;
  statesPage = 1;
  citiesPage = 1;
  statesLimit = 30;
  citiesLimit = 30;
  statesHasMore = true;
  citiesHasMore = true;

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
  selectedUser: User | null = null;
  deleteLoading = false;
  statusLoading = false;
  logoutLoading = false;
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
    private stateService: StateService,
    private cityService: CityService,
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
    this.loadStates();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isStateDropdownOpen = false;
      this.isCityDropdownOpen = false;
    }
  }

  loadStates(reset: boolean = false): void {
    if (reset) {
      this.states = [];
      this.statesPage = 1;
      this.statesHasMore = false;
    }

    if (this.states.length > 0 && !reset) {
      return;
    }

    this.statesLoading = true;
    this.stateService.getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const responseData = response?.data || response || [];
          this.allStates = Array.isArray(responseData) ? responseData : (responseData?.data || []);
          
          // For scrollable pagination, load first batch
          if (reset || this.states.length === 0) {
            this.states = this.allStates.slice(0, this.statesLimit);
            this.statesHasMore = this.allStates.length > this.statesLimit;
          } else {
            const startIndex = this.states.length;
            const endIndex = startIndex + this.statesLimit;
            this.states = [...this.states, ...this.allStates.slice(startIndex, endIndex)];
            this.statesHasMore = endIndex < this.allStates.length;
          }
          
          this.statesLoading = false;
        },
        error: (error) => {
          console.error('Error loading states:', error);
          this.statesLoading = false;
        }
      });
  }

  loadCities(reset: boolean = false, stateId?: string): void {
    if (!stateId) {
      this.cities = [];
      return;
    }

    if (reset) {
      this.cities = [];
      this.citiesPage = 1;
      this.citiesHasMore = false;
    }

    this.citiesLoading = true;
    this.cityService.getCitiesByState(stateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const responseData = response?.data || response || [];
          this.allCities = Array.isArray(responseData) ? responseData : (responseData?.data || []);
          
          // For scrollable pagination, load first batch
          if (reset || this.cities.length === 0) {
            this.cities = this.allCities.slice(0, this.citiesLimit);
            this.citiesHasMore = this.allCities.length > this.citiesLimit;
          } else {
            const startIndex = this.cities.length;
            const endIndex = startIndex + this.citiesLimit;
            this.cities = [...this.cities, ...this.allCities.slice(startIndex, endIndex)];
            this.citiesHasMore = endIndex < this.allCities.length;
          }
          
          this.citiesLoading = false;
        },
        error: (error) => {
          console.error('Error loading cities:', error);
          this.citiesLoading = false;
        }
      });
  }

  onStateScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight * 0.8 && !this.statesLoading && this.statesHasMore) {
      this.statesPage++;
      this.loadStates(false);
    }
  }

  onCityScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight * 0.8 && !this.citiesLoading && this.citiesHasMore) {
      this.citiesPage++;
      const selectedState = this.states.find(s => s.name === this.stateFilter);
      if (selectedState) {
        this.loadCities(false, selectedState._id);
      }
    }
  }

  onStateChange(stateName: string): void {
    this.stateFilter = stateName;
    this.cityFilter = '';
    this.cities = [];
    this.currentPage = 1;
    
    const selectedState = this.states.find(s => s.name === stateName);
    if (selectedState) {
      this.loadCities(true, selectedState._id);
    }
    
    this.loadUsers();
  }

  onCityChange(cityName: string): void {
    this.cityFilter = cityName;
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
    this.cities = [];
    this.currentPage = 1;
    this.loadUsers();
  }

  toggleStateDropdown(): void {
    this.isStateDropdownOpen = !this.isStateDropdownOpen;
    if (this.isStateDropdownOpen && this.states.length === 0) {
      this.loadStates(true);
    }
  }

  toggleCityDropdown(): void {
    if (!this.stateFilter) return;
    this.isCityDropdownOpen = !this.isCityDropdownOpen;
    if (this.isCityDropdownOpen && this.cities.length === 0) {
      const selectedState = this.states.find(s => s.name === this.stateFilter);
      if (selectedState) {
        this.loadCities(true, selectedState._id);
      }
    }
  }

  selectState(state: any): void {
    this.stateFilter = state.name;
    this.isStateDropdownOpen = false;
    this.onStateChange(state.name);
  }

  selectCity(city: any): void {
    this.cityFilter = city.name;
    this.isCityDropdownOpen = false;
    this.onCityChange(city.name);
  }

  getSelectedStateName(): string {
    return this.stateFilter || 'Select State';
  }

  getSelectedCityName(): string {
    return this.cityFilter || 'Select City';
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
}
