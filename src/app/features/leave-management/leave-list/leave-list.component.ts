import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LeaveService, LeaveRequest, LeaveListParams } from '../services/leave.service';
import { StatusUpdateModalComponent } from './status-update-modal/status-update-modal.component';
import { LeaveFormModalComponent } from './leave-form-modal/leave-form-modal.component';
import { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';
import { PermissionService } from '../../../shared/services/permission.service';

@Component({
  selector: 'app-leave-list',
  templateUrl: './leave-list.component.html',
  styleUrls: ['./leave-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, StatusUpdateModalComponent, LeaveFormModalComponent, ConfirmModalComponent]
})
export class LeaveListComponent implements OnInit, OnDestroy {
  // Data
  leaveRequests: LeaveRequest[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];

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
  showImportModal = false;
  showLeaveFormModal = false;
  isViewMode = false; // Track if modal is in view mode

  // Button loading states
  buttonLoadingStates: { [key: string]: boolean } = {};

  // Confirm modal state
  showConfirmModal = false;
  confirmLoading = false;
  confirmTitle = 'Confirm Action';
  confirmMessage = '';
  confirmButtonText = 'Confirm';
  private confirmAction: null | { type: 'cancel' | 'delete'; leave: LeaveRequest } = null;

  // Sorting
  sortBy = '';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Status modal defaults
  statusModalInitial: 'approved' | 'rejected' | 'cancelled' = 'approved';

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

  // Tooltip methods for better UX
  getEditButtonTooltip(leave: LeaveRequest): string {
    if (leave.status !== 'pending') {
      return 'Only pending requests can be edited';
    }
    return 'Edit Leave Request';
  }

  getCancelButtonTooltip(leave: LeaveRequest): string {
    if (leave.status !== 'pending') {
      return 'Only pending requests can be cancelled';
    }
    return 'Cancel Leave Request';
  }

  getStatusButtonTooltip(leave: LeaveRequest): string {
    if (leave.status !== 'pending') {
      return 'Only pending requests can have status changed';
    }
    return 'Change Leave Request Status';
  }

  getDeleteButtonTooltip(leave: LeaveRequest): string {
    if (leave.status !== 'pending') {
      return 'Only pending requests can be deleted';
    }
    return 'Delete Leave Request';
  }

  // Button loading state helpers
  setButtonLoading(buttonId: string, loading: boolean): void {
    this.buttonLoadingStates[buttonId] = loading;
  }

  isButtonLoading(buttonId: string): boolean {
    return this.buttonLoadingStates[buttonId] || false;
  }

  // (Removed duplicate editLeaveRequest implementation; see method below which opens the modal)

  // Delete leave request
  deleteLeaveRequest(leaveRequest: LeaveRequest): void {
    if (!this.canDelete(leaveRequest)) {
      console.warn('User does not have permission to delete leave requests');
      return;
    }

    if (leaveRequest.status !== 'pending') {
      console.warn('Only pending leave requests can be deleted');
      return;
    }

    // Open confirmation modal instead of native confirm
    this.confirmTitle = 'Delete Leave Request';
    this.confirmMessage = `Are you sure you want to delete this leave request for ${this.getEmployeeName(leaveRequest)}?\n\n` +
      `Leave Type: ${this.getLeaveTypeText(leaveRequest.leaveType)}\n` +
      `Dates: ${this.formatDate(leaveRequest.startDate)} - ${this.formatDate(leaveRequest.endDate)}\n` +
      `Reason: ${leaveRequest.reason}\n\n` +
      `This action cannot be undone.`;
    this.confirmButtonText = 'Yes, Delete';
    this.confirmAction = { type: 'delete', leave: leaveRequest };
    this.showConfirmModal = true;
  }

  // Create new leave request
  createLeaveRequest(): void {
    if (this.canCreate()) {
      this.isViewMode = false; // Ensure create mode
      this.openLeaveFormModal();
    } else {
      console.warn('User does not have permission to create leave requests');
    }
  }

  // Leave form modal handlers
  openLeaveFormModal(leaveRequest?: LeaveRequest): void {
    this.selectedLeaveRequest = leaveRequest || null;
    this.showLeaveFormModal = true;
    // isViewMode is set by the calling method (viewLeaveDetails or editLeaveRequest)
  }

  closeLeaveFormModal(): void {
    this.showLeaveFormModal = false;
    this.selectedLeaveRequest = null;
    this.isViewMode = false; // Reset view mode
  }

  onLeaveSaved(leaveRequest: LeaveRequest): void {
    this.closeLeaveFormModal();
    this.loadLeaveRequests(); // Refresh the list
  }

  // Edit leave request
  editLeaveRequest(leaveRequest: LeaveRequest): void {
    if (!this.canEdit(leaveRequest)) {
      console.warn('User does not have permission to edit leave requests');
      return;
    }

    if (leaveRequest.status !== 'pending') {
      console.warn('Only pending leave requests can be edited');
      return;
    }

    this.isViewMode = false; // Ensure edit mode
    this.openLeaveFormModal(leaveRequest);
  }

  // Load leave requests from API
  loadLeaveRequests(): void {
    this.loading = true;
    this.error = null;

    const params: LeaveListParams = {
      page: this.currentPage,
      limit: this.pageSize
    };

    // Add search
    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

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

    // Add sorting
    if (this.sortBy) {
      params.sortBy = this.sortBy;
      params.sortOrder = this.sortOrder;
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
  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.searchSubject.next(this.searchTerm);
  }

  // Filter handling
  onStatusFilterChange(status: string): void {
    this.statusFilter = status as any;
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
  getEmployeeName(leaveRequest: any): string {
    // This is a placeholder - you might need to fetch user details from another API
    // or include user information in the leave request response
    return leaveRequest.userId?.firstname + ' ' + leaveRequest.userId?.lastname || 'Unknown Employee';
  }

  // Get end item number for pagination display
  getEndItemNumber(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  // Calculate range for display
  get rangeStart(): number {
    return this.totalItems > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  // Page size change
  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadLeaveRequests();
  }

  // Sorting
  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.loadLeaveRequests();
  }

  // Import modal
  openImportModal(): void {
    this.showImportModal = true;
  }

  closeImportModal(): void {
    this.showImportModal = false;
  }

  // View leave details
  viewLeaveDetails(leaveId: string): void {
    if (!this.canView()) {
      console.warn('User does not have permission to view leave details');
      return;
    }

    console.log('Viewing leave details for:', leaveId);
    // Find the leave request
    const leaveRequest = this.leaveRequests.find(leave => leave._id === leaveId);
    if (leaveRequest) {
      // Open the leave form modal in view-only mode
      this.isViewMode = true;
      this.openLeaveFormModal(leaveRequest);
    } else {
      console.error('Leave request not found:', leaveId);
      this.error = 'Leave request not found';
    }
  }

  // Get profile image
  getProfileImage(leave: any): string {
    // This is a placeholder - you might need to fetch user details from another API
    // or include user information in the leave request response
    const name = this.getEmployeeName(leave);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=007bff&color=fff&size=32`;
  }

  // Status update handling
  openStatusModal(leaveRequest: LeaveRequest, initialStatus: 'approved' | 'rejected' | 'cancelled' = 'approved'): void {
    this.selectedLeaveRequest = leaveRequest;
    this.statusModalInitial = initialStatus;
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

  // Open status change modal (unified for approve/reject)
  openStatusChangeModal(leaveRequest: LeaveRequest): void {
    if (!this.canApproveReject(leaveRequest)) {
      console.warn('User does not have permission to change leave request status');
      return;
    }

    if (leaveRequest.status !== 'pending') {
      console.warn('Only pending leave requests can have status changed');
      return;
    }

    // Open status modal with default to approved
    this.openStatusModal(leaveRequest, 'approved');
  }

  // Cancel leave request
  cancelLeaveRequest(leaveRequest: LeaveRequest): void {
    if (leaveRequest.status !== 'pending') {
      console.warn('Only pending leave requests can be cancelled');
      return;
    }

    // Open confirmation modal instead of native confirm
    this.confirmTitle = 'Cancel Leave Request';
    this.confirmMessage = `Are you sure you want to cancel this leave request?\n\n` +
      `Employee: ${this.getEmployeeName(leaveRequest)}\n` +
      `Leave Type: ${this.getLeaveTypeText(leaveRequest.leaveType)}\n` +
      `Dates: ${this.formatDate(leaveRequest.startDate)} - ${this.formatDate(leaveRequest.endDate)}\n` +
      `Reason: ${leaveRequest.reason}`;
    this.confirmButtonText = 'Yes, Cancel';
    this.confirmAction = { type: 'cancel', leave: leaveRequest };
    this.showConfirmModal = true;
  }

  // Confirm modal handlers
  onConfirmModalCancel(): void {
    this.showConfirmModal = false;
    this.confirmLoading = false;
    this.confirmAction = null;
  }

  onConfirmModalConfirm(): void {
    if (!this.confirmAction) return;
    this.confirmLoading = true;
    const { type, leave } = this.confirmAction;

    if (type === 'cancel') {
      this.leaveService.cancelLeaveRequest(leave._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.confirmLoading = false;
            this.showConfirmModal = false;
            this.loadLeaveRequests();
          },
          error: (error) => {
            this.confirmLoading = false;
            console.error('Error cancelling leave request:', error);
            this.error = `Failed to cancel leave request: ${error.status} - ${error.statusText || error.message}`;
          }
        });
      return;
    }

    if (type === 'delete') {
      const buttonId = `delete-${leave._id}`;
      this.setButtonLoading(buttonId, true);
      this.leaveService.deleteLeaveRequest(leave._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.confirmLoading = false;
            this.setButtonLoading(buttonId, false);
            this.showConfirmModal = false;
            this.loadLeaveRequests();
          },
          error: (error) => {
            this.confirmLoading = false;
            this.setButtonLoading(buttonId, false);
            console.error('Error deleting leave request:', error);
            this.error = `Failed to delete leave request: ${error.status} - ${error.statusText || error.message}`;
          }
        });
    }
  }

}
