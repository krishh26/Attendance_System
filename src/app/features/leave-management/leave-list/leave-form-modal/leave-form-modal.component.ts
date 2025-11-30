import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LeaveService, LeaveRequest } from '../../services/leave.service';
import { UserService, User } from '../../../admin/user-list/user.service';

export interface LeaveFormData {
  userId: string;
  leaveType: 'full-day' | 'half-day' | 'sick' | 'casual' | 'annual' | 'other';
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay: boolean;
  halfDayType?: 'morning' | 'afternoon';
  notes?: string;
}

@Component({
  selector: 'app-leave-form-modal',
  templateUrl: './leave-form-modal.component.html',
  styleUrls: ['./leave-form-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LeaveFormModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Input() leaveRequest: LeaveRequest | null = null;
  @Input() viewMode = false; // New input for view-only mode
  @Output() closeModal = new EventEmitter<void>();
  @Output() leaveSaved = new EventEmitter<LeaveRequest>();

  // Form data
  formData: LeaveFormData = {
    userId: '',
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false,
    halfDayType: 'morning',
    notes: ''
  };

  // UI state
  loading = false;
  error: string | null = null;
  isEditMode = false;

  // Data
  users: User[] = [];
  usersLoading = false;
  usersSearchTerm = '';
  usersPage = 1;
  usersLimit = 30;
  usersHasMore = true;
  usersTotal = 0;
  isUsersDropdownOpen = false;
  filteredUsers: User[] = [];

  // Leave type options
  leaveTypes = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'casual', label: 'Casual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'full-day', label: 'Full Day Leave' },
    { value: 'half-day', label: 'Half Day Leave' },
    { value: 'other', label: 'Other' }
  ];

  // Half day type options
  halfDayTypes = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' }
  ];

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private leaveService: LeaveService,
    private userService: UserService,
    private elementRef: ElementRef
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target) && this.isUsersDropdownOpen) {
      this.isUsersDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    // Don't load users on init - load when dropdown opens
    
    // Setup debounced search
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.usersSearchTerm = searchTerm;
        this.usersPage = 1;
        this.loadUsers(true);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
      if (this.leaveRequest) {
        this.populateForm();
        this.isEditMode = !this.viewMode; // Edit mode only if not in view mode
      } else {
        this.isEditMode = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsers(reset: boolean = false): void {
    if (reset) {
      this.users = [];
      this.usersPage = 1;
      this.usersHasMore = true;
    }

    if (!this.usersHasMore && !reset) {
      return;
    }

    this.usersLoading = true;
    this.userService.getUsers({ 
      page: this.usersPage, 
      limit: this.usersLimit,
      search: this.usersSearchTerm,
      sortBy: 'firstname',
      sortOrder: 'asc'
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Handle nested response structure: response.data.data contains users array
          const responseData = (response as any).data;
          
          // Extract users array - can be in response.data.data or response.data
          let newUsers: User[] = [];
          if (Array.isArray(responseData?.data)) {
            newUsers = responseData.data;
          } else if (Array.isArray(responseData)) {
            newUsers = responseData;
          } else if (Array.isArray((response as any).data)) {
            newUsers = (response as any).data;
          }
          
          if (reset) {
            this.users = newUsers;
          } else {
            this.users = [...this.users, ...newUsers];
          }
          
          // Check if there are more users to load
          // Pagination can be in response.data.pagination or response.pagination
          const pagination = responseData?.pagination || (response as any).pagination;
          if (pagination) {
            this.usersTotal = pagination.total || 0;
            this.usersHasMore = this.users.length < pagination.total;
          } else {
            // Fallback: if we got less than limit, assume no more
            this.usersHasMore = newUsers.length === this.usersLimit;
          }
          
          this.filterUsers();
          this.usersLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          console.error('Error details:', error);
          this.usersLoading = false;
          this.error = 'Failed to load users. Please try again.';
          // Reset users on error to show empty state
          if (reset) {
            this.users = [];
            this.filteredUsers = [];
          }
        }
      });
  }

  onUsersSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchTerm = target?.value || '';
    this.searchSubject$.next(searchTerm);
  }

  onUsersScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Load more when scrolled to 80% of the list
    if (scrollTop + clientHeight >= scrollHeight * 0.8 && !this.usersLoading && this.usersHasMore) {
      this.usersPage++;
      this.loadUsers(false);
    }
  }

  filterUsers(): void {
    // Since we're using server-side search, just use all loaded users
    // The search is handled by the API
    this.filteredUsers = [...this.users];
  }

  toggleUsersDropdown(): void {
    this.isUsersDropdownOpen = !this.isUsersDropdownOpen;
    if (this.isUsersDropdownOpen && this.users.length === 0) {
      this.usersSearchTerm = '';
      this.loadUsers(true);
    }
  }

  selectUser(user: User): void {
    this.formData.userId = user._id;
    this.isUsersDropdownOpen = false;
    // Update search term to show selected user
    const selectedUser = this.users.find(u => u._id === user._id);
    if (selectedUser) {
      this.usersSearchTerm = this.getUserDisplayText(selectedUser);
    }
  }

  private resetForm(): void {
    this.formData = {
      userId: '',
      leaveType: 'annual',
      startDate: '',
      endDate: '',
      reason: '',
      isHalfDay: false,
      halfDayType: 'morning',
      notes: ''
    };
    this.error = null;
  }

  private populateForm(): void {
    if (this.leaveRequest) {
      this.formData = {
        userId: this.leaveRequest.userId?._id || '',
        leaveType: this.leaveRequest.leaveType,
        startDate: this.formatDateForInput(this.leaveRequest.startDate),
        endDate: this.formatDateForInput(this.leaveRequest.endDate),
        reason: this.leaveRequest.reason,
        isHalfDay: this.leaveRequest.isHalfDay,
        halfDayType: this.leaveRequest.halfDayType || 'morning',
        notes: this.leaveRequest.notes || ''
      };
      
      // If editing, load the selected user to show in dropdown
      if (this.leaveRequest.userId?._id && !this.viewMode) {
        this.userService.getUserById(this.leaveRequest.userId._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response?.data) {
                const user = response.data;
                this.users = [user];
                this.filteredUsers = [user];
                this.usersSearchTerm = this.getUserDisplayText(user);
              }
            },
            error: (error) => {
              console.error('Error loading user:', error);
            }
          });
      }
    }
  }

  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  onLeaveTypeChange(): void {
    // If half-day is selected, set isHalfDay to true
    if (this.formData.leaveType === 'half-day') {
      this.formData.isHalfDay = true;
    } else {
      this.formData.isHalfDay = false;
    }
  }

  onHalfDayToggle(): void {
    // If half day is toggled off, reset half day type
    if (!this.formData.isHalfDay) {
      this.formData.halfDayType = 'morning';
    }
  }

  onStartDateChange(): void {
    // If start date is after end date, update end date
    if (this.formData.startDate && this.formData.endDate) {
      if (new Date(this.formData.startDate) > new Date(this.formData.endDate)) {
        this.formData.endDate = this.formData.startDate;
      }
    }
  }

  validateForm(): boolean {
    this.error = null;

    if (!this.formData.userId) {
      this.error = 'Please select an employee';
      return false;
    }

    if (!this.formData.startDate) {
      this.error = 'Please select a start date';
      return false;
    }

    if (!this.formData.endDate) {
      this.error = 'Please select an end date';
      return false;
    }

    if (new Date(this.formData.startDate) > new Date(this.formData.endDate)) {
      this.error = 'End date must be after start date';
      return false;
    }

    if (!this.formData.reason.trim()) {
      this.error = 'Please provide a reason for the leave';
      return false;
    }

    if (this.formData.isHalfDay && !this.formData.halfDayType) {
      this.error = 'Please select half day type (morning or afternoon)';
      return false;
    }

    // Allow past dates for admin-created records; backend will validate business rules

    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = null;

    const requestData = {
      userId: this.formData.userId,
      leaveType: this.formData.leaveType,
      startDate: this.formData.startDate,
      endDate: this.formData.endDate,
      reason: this.formData.reason.trim(),
      isHalfDay: this.formData.isHalfDay,
      halfDayType: this.formData.isHalfDay ? this.formData.halfDayType : undefined,
      notes: this.formData.notes?.trim() || undefined
    };

    const request = this.isEditMode && this.leaveRequest
      ? this.leaveService.updateLeaveRequest(this.leaveRequest._id, requestData)
      : this.leaveService.createLeaveRequest(requestData);

    request
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response && response.data) {
            this.leaveSaved.emit(response.data);
            this.closeModal.emit();
          } else {
            this.error = 'Leave request saved successfully';
            setTimeout(() => {
              this.leaveSaved.emit(response as any);
              this.closeModal.emit();
            }, 1500);
          }
        },
        error: (error) => {
          this.loading = false;
          this.error = error.error?.message || error.message || 'Failed to save leave request. Please try again.';
          console.error('Error saving leave request:', error);
        }
      });
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  getUserName(user: User): string {
    return `${user.firstname} ${user.lastname}`.trim();
  }

  getUserDisplayText(user: User): string {
    const name = this.getUserName(user);
    return `${name} (${user.email})`;
  }

  getLeaveTypeLabel(value: string): string {
    const type = this.leaveTypes.find(t => t.value === value);
    return type ? type.label : value;
  }

  getHalfDayTypeLabel(value: string): string {
    const type = this.halfDayTypes.find(t => t.value === value);
    return type ? type.label : value;
  }

  getModalTitle(): string {
    if (this.viewMode) {
      return 'View Leave Request';
    }
    return this.isEditMode ? 'Edit Leave Request' : 'Create Leave Request';
  }

  getEmployeeName(): string {
    if (!this.leaveRequest || !this.leaveRequest.userId) {
      return 'Unknown Employee';
    }

    // Find the user in the users array
    const user = this.users.find(u => u._id === this.leaveRequest?.userId?._id);
    if (user) {
      return this.getUserDisplayText(user);
    }

    // Fallback to the userId if user not found
    return this.leaveRequest.userId?._id;
  }

  getSelectedUserName(): string {
    if (!this.formData.userId) {
      return '';
    }
    const user = this.users.find(u => u._id === this.formData.userId);
    return user ? this.getUserDisplayText(user) : '';
  }

  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
