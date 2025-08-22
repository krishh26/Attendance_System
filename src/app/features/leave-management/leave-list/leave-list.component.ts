import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LeaveService, LeaveRequest, LeaveListParams } from '../services/leave.service';
import { StatusUpdateModalComponent } from './status-update-modal/status-update-modal.component';
import { PermissionService } from '../../../shared/services/permission.service';

@Component({
  selector: 'app-leave-list',
  templateUrl: './leave-list.component.html',
  styleUrls: ['./leave-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, StatusUpdateModalComponent]
})
export class LeaveListComponent implements OnInit, OnDestroy {
  // Data
  leaveRequests: LeaveRequest[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // Filters
  searchTerm = '';
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled' = 'all';
  leaveTypeFilter: 'all' | 'full-day' | 'half-day' | 'sick' | 'casual' | 'annual' | 'other' = 'all';
  startDateFilter = '';
  endDateFilter = '';
  halfDayFilter: 'all' | 'true' | 'false' = 'all';

  // Modal states
  showStatusModal = false;
  selectedLeaveRequest: LeaveRequest | null = null;
  statusUpdateLoading = false;

  // Search debouncing
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private leaveService: LeaveService,
    private permissionService: PermissionService
  ) {
    // Setup search debouncing
    this.searchSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadLeaveRequests();
      });
  }

  ngOnInit(): void {
    this.loadLeaveRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Permission checking methods
  canCreate(): boolean {
    return this.permissionService.hasPermission('leave', 'create');
  }

  canEdit(leave: LeaveRequest): boolean {
    return this.permissionService.hasPermission('leave', 'update');
  }

  canDelete(leave: LeaveRequest): boolean {
    return this.permissionService.hasPermission('leave', 'delete');
  }

  canApproveReject(leave: LeaveRequest): boolean {
    return this.permissionService.hasPermission('leave', 'approve') ||
           this.permissionService.hasPermission('leave', 'reject');
  }

  canUpdateStatus(): boolean {
    return this.permissionService.hasPermission('leave', 'approve') ||
           this.permissionService.hasPermission('leave', 'update');
  }

  canView(): boolean {
    return this.permissionService.hasPermission('leave', 'read');
  }

  // Create new leave request
  createLeaveRequest(): void {
    if (this.canCreate()) {
      // Navigate to create leave request page
      console.log('Navigating to create leave request');
      // this.router.navigate(['/admin/leave/create']);
    } else {
      console.warn('User does not have permission to create leave requests');
    }
  }

  // Load leave requests from API
  loadLeaveRequests(): void {
    this.loading = true;
    this.error = null;

    const params: LeaveListParams = {
      page: this.currentPage,
      limit: this.pageSize
    };

    // Add filters
    if (this.statusFilter !== 'all') {
      params.status = this.statusFilter;
    }
    if (this.leaveTypeFilter !== 'all') {
      params.leaveType = this.leaveTypeFilter;
    }
    if (this.startDateFilter) {
      params.startDate = this.startDateFilter;
    }
    if (this.endDateFilter) {
      params.endDate = this.endDateFilter;
    }
    if (this.halfDayFilter !== 'all') {
      params.isHalfDay = this.halfDayFilter === 'true';
    }

    this.leaveService.getLeaveRequests(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.leaveRequests = response.data.data;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.totalPages;
          this.currentPage = response.pagination.page;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load leave requests. Please try again.';
          this.loading = false;
          console.error('Error loading leave requests:', error);
        }
      });
  }

  // Search handling
  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  // Filter handling
  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadLeaveRequests();
  }

  onLeaveTypeFilterChange(): void {
    this.currentPage = 1;
    this.loadLeaveRequests();
  }

  onDateFilterChange(): void {
    this.currentPage = 1;
    this.loadLeaveRequests();
  }

  onHalfDayFilterChange(): void {
    this.currentPage = 1;
    this.loadLeaveRequests();
  }

  // Pagination
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadLeaveRequests();
    }
  }

  // Get pages array for pagination display
  get pages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  // Refresh data
  refreshData(): void {
    this.loadLeaveRequests();
  }

  // Clear filters
  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.leaveTypeFilter = 'all';
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.halfDayFilter = 'all';
    this.currentPage = 1;
    this.loadLeaveRequests();
  }

  // Utility methods
  getStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  }

  getStatusText(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getLeaveTypeText(leaveType: string): string {
    const typeMap: { [key: string]: string } = {
      'full-day': 'Full Day',
      'half-day': 'Half Day',
      'sick': 'Sick Leave',
      'casual': 'Casual Leave',
      'annual': 'Annual Leave',
      'other': 'Other'
    };
    return typeMap[leaveType] || leaveType;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get employee name (placeholder - you might need to fetch user details)
  getEmployeeName(leaveRequest: LeaveRequest): string {
    // This is a placeholder - you might need to fetch user details from another API
    // or include user information in the leave request response
    return leaveRequest.userId || 'Unknown Employee';
  }

  // Get end item number for pagination display
  getEndItemNumber(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  // Status update handling
  openStatusModal(leaveRequest: LeaveRequest): void {
    this.selectedLeaveRequest = leaveRequest;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedLeaveRequest = null;
  }

  onStatusUpdated(data: { leaveId: string; statusData: any }): void {
    this.statusUpdateLoading = true;

    this.leaveService.updateLeaveRequestStatus(data.leaveId, data.statusData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.statusUpdateLoading = false;
          this.closeStatusModal();
          this.loadLeaveRequests(); // Refresh the list

          // Show success message (you can implement a toast/notification system)
          console.log('Status updated successfully:', response);
        },
        error: (error) => {
          this.statusUpdateLoading = false;
          console.error('Error updating status:', error);

          // Show error message
          this.error = 'Failed to update leave request status. Please try again.';
        }
      });
  }
}
