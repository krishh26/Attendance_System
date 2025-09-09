import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TourService, Tour, CreateTourDto } from '../services/tour.service';
import { PermissionService } from '../../../shared/services/permission.service';

@Component({
  selector: 'app-tour-list',
  templateUrl: './tour-list.component.html',
  styleUrls: ['./tour-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TourListComponent implements OnInit, OnDestroy {
  // Data
  tours: Tour[] = [];
  filteredTours: Tour[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // Filters
  searchTerm = '';
  statusFilter = 'all';
  assignedToFilter = '';
  startDateFilter = '';
  endDateFilter = '';

  // Delete confirmation
  showDeleteConfirm = false;
  tourToDelete: Tour | null = null;
  deleteLoading = false;

  // Status update
  showStatusUpdateModal = false;
  tourToUpdateStatus: Tour | null = null;
  newStatus = '';
  statusNotes = '';
  statusUpdateLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private tourService: TourService,
    private router: Router,
    private route: ActivatedRoute,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadTours();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Permission checking methods
  canCreate(): boolean {
    return this.permissionService.hasPermission('tour', 'create');
  }

  canEdit(): boolean {
    return this.permissionService.hasPermission('tour', 'update');
  }

  canDelete(): boolean {
    return this.permissionService.hasPermission('tour', 'delete');
  }

  canUpdateStatusPermission(): boolean {
    return this.permissionService.hasPermission('tour', 'approve') ||
           this.permissionService.hasPermission('tour', 'update');
  }

  canView(): boolean {
    return this.permissionService.hasPermission('tour', 'read');
  }

  // Load tours from API
  loadTours(): void {
    this.loading = true;
    this.error = null;

    const filters: any = {};
    if (this.statusFilter !== 'all') filters.status = this.statusFilter;
    if (this.assignedToFilter) filters.assignedTo = this.assignedToFilter;
    if (this.startDateFilter) filters.startDate = this.startDateFilter;
    if (this.endDateFilter) filters.endDate = this.endDateFilter;

    this.tourService.getAllTours(this.currentPage, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.data && response.pagination) {
            this.tours = response.data.data; // Changed from response.data.tours to response.data.data
            this.filteredTours = [...this.tours];
            this.totalItems = response.pagination.total; // Changed from response.data.total to response.pagination.total
            this.totalPages = response.pagination.totalPages; // Changed from response.data.totalPages to response.pagination.totalPages
            this.currentPage = response.pagination.page; // Changed from response.data.page to response.pagination.page
            this.applySearchFilter();
          } else {
            this.tours = [];
            this.filteredTours = [];
            this.totalItems = 0;
            this.totalPages = 0;
            this.error = 'Invalid response format from server';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading tours:', error);
          this.error = 'Failed to load tours. Please try again.';
          this.loading = false;
        }
      });
  }

  // Apply search filter
  applySearchFilter(): void {
    if (!this.searchTerm) {
      this.filteredTours = [...this.tours];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredTours = this.tours.filter(tour =>
      tour.purpose.toLowerCase().includes(searchLower) ||
      tour.location.toLowerCase().includes(searchLower) ||
      (tour.assignedTo && tour.assignedTo.firstname.toLowerCase().includes(searchLower)) ||
      (tour.assignedTo && tour.assignedTo.lastname.toLowerCase().includes(searchLower)) ||
      tour.status.toLowerCase().includes(searchLower)
    );
  }

  // Search functionality
  onSearch(): void {
    this.applySearchFilter();
  }

  // Filter change
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadTours();
  }

  // Clear all filters
  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.assignedToFilter = '';
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.currentPage = 1;
    this.loadTours();
  }

  // Enhanced filters helpers
  clearSearch(): void {
    this.searchTerm = '';
    this.applySearchFilter();
  }

  setTodayRange(): void {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    this.startDateFilter = iso;
    this.endDateFilter = iso;
    this.onFilterChange();
  }

  clearDateRange(): void {
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.onFilterChange();
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.assignedToFilter = '';
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.currentPage = 1;
    this.loadTours();
  }

  // Check if any filters are active
  hasActiveFilters(): boolean {
    return this.searchTerm !== '' ||
           this.statusFilter !== 'all' ||
           this.assignedToFilter !== '' ||
           this.startDateFilter !== '' ||
           this.endDateFilter !== '';
  }

  // Page change
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTours();
  }

  // Navigate to create tour
  createTour(): void {
    if (this.canCreate()) {
      this.router.navigate(['/admin/tour/create']);
    } else {
      console.warn('User does not have permission to create tours');
    }
  }

  // Navigate to edit tour
  editTour(tour: Tour): void {
    if (this.canEdit()) {
      this.router.navigate(['/admin/tour/edit', tour._id]);
    } else {
      console.warn('User does not have permission to edit tours');
    }
  }

  // Navigate to tour details
  viewTourDetails(tour: Tour): void {
    if (this.canView()) {
      this.router.navigate(['/admin/tour/details', tour._id]);
    } else {
      console.warn('User does not have permission to view tour details');
    }
  }

  // Show delete confirmation
  showDeleteConfirmation(tour: Tour): void {
    this.tourToDelete = tour;
    this.showDeleteConfirm = true;
  }

  // Cancel delete
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.tourToDelete = null;
    this.error = null;
    this.successMessage = null;
  }

  // Confirm delete
  confirmDelete(): void {
    if (!this.tourToDelete) return;

    this.deleteLoading = true;
    this.tourService.deleteTour(this.tourToDelete._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response) {
            this.successMessage = 'Tour deleted successfully!';
            this.loadTours();
            this.cancelDelete();
            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = null, 3000);
          } else {
            this.error = 'Failed to delete tour. Please try again.';
          }
          this.deleteLoading = false;
        },
        error: (error) => {
          console.error('Error deleting tour:', error);
          this.error = 'Failed to delete tour. Please try again.';
          this.deleteLoading = false;
        }
      });
  }

  // Show status update modal
  showStatusUpdate(tour: Tour): void {
    this.tourToUpdateStatus = tour;
    this.newStatus = tour.status;
    this.statusNotes = '';
    this.showStatusUpdateModal = true;
  }

  // Cancel status update
  cancelStatusUpdate(): void {
    this.showStatusUpdateModal = false;
    this.tourToUpdateStatus = null;
    this.newStatus = '';
    this.statusNotes = '';
    this.error = null;
    this.successMessage = null;
  }

  // Confirm status update
  confirmStatusUpdate(): void {
    if (!this.tourToUpdateStatus || !this.newStatus) return;

    this.statusUpdateLoading = true;
    this.error = null;
    this.successMessage = null;

    const statusData = {
      status: this.newStatus,
      notes: this.statusNotes || undefined
    };

    this.tourService.updateTourStatus(this.tourToUpdateStatus._id, statusData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            this.successMessage = 'Tour status updated successfully!';
            this.loadTours();
            this.cancelStatusUpdate();
            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = null, 3000);
          } else {
            this.error = 'Failed to update tour status. Please try again.';
          }
          this.statusUpdateLoading = false;
        },
        error: (error) => {
          console.error('Error updating tour status:', error);
          this.error = 'Failed to update tour status. Please try again.';
          this.statusUpdateLoading = false;
        }
      });
  }

  // Check if status can be updated
  canUpdateStatus(tour: Tour): boolean {
    // Only allow status updates for certain statuses
    const updatableStatuses = ['pending', 'assigned', 'in-progress'];
    return updatableStatuses.includes(tour.status);
  }

  // Format date for display
  formatDate(dateString: string | Date): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  // Get available statuses for filter
  getAvailableStatuses(): string[] {
    return ['all', ...this.tourService.getAvailableStatuses()];
  }

  // Get status display name
  getStatusDisplayName(status: string): string {
    if (status === 'all') return 'All Statuses';
    return this.tourService.getStatusDisplayName(status);
  }

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    return this.tourService.getStatusBadgeClass(status);
  }

  // Get page numbers for pagination
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}
