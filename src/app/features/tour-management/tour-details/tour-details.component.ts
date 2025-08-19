import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TourService, Tour, UpdateTourStatusDto } from '../services/tour.service';
import { PermissionService } from '../../../shared/services/permission.service';

@Component({
  selector: 'app-tour-details',
  templateUrl: './tour-details.component.html',
  styleUrls: ['./tour-details.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TourDetailsComponent implements OnInit, OnDestroy {
  // Data
  tour: Tour | null = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Status update
  showStatusUpdateModal = false;
  newStatus = '';
  statusNotes = '';
  updatingStatus = false;

  // Route params
  tourId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private tourService: TourService,
    private router: Router,
    private route: ActivatedRoute,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.tourId = params['id'];
        this.loadTour();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load tour details
  loadTour(): void {
    if (!this.tourId) return;

    this.loading = true;
    this.error = null;

    this.tourService.getTourById(this.tourId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            this.tour = response.data;
            this.newStatus = this.tour.status;
          } else {
            this.error = 'Failed to load tour details';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading tour:', error);
          this.error = 'Failed to load tour details. Please try again.';
          this.loading = false;
        }
      });
  }

  // Show status update modal
  showStatusUpdate(): void {
    this.showStatusUpdateModal = true;
    this.newStatus = this.tour?.status || '';
    this.statusNotes = '';
    // Clear any previous errors or messages
    this.error = null;
    this.successMessage = null;
  }

  // Close status update modal
  closeStatusUpdate(): void {
    this.showStatusUpdateModal = false;
    // Reset to current tour status instead of keeping the new status
    this.newStatus = this.tour?.status || '';
    this.statusNotes = '';
    this.error = null;
    this.successMessage = null;
  }

  // Update tour status
  updateStatus(): void {
    if (!this.tourId || !this.newStatus) return;

    // Check if status is actually changing
    if (this.newStatus === this.tour?.status) {
      this.error = 'Please select a different status to update.';
      return;
    }

    // Validate status transition
    if (!this.isValidStatusTransition(this.tour?.status || '', this.newStatus)) {
      this.error = `Invalid status transition from '${this.getStatusDisplayName(this.tour?.status || '')}' to '${this.getStatusDisplayName(this.newStatus)}'.`;
      return;
    }

    this.updatingStatus = true;
    this.error = null;
    this.successMessage = null;

    const statusData: UpdateTourStatusDto = {
      status: this.newStatus,
      notes: this.statusNotes || undefined
    };

    this.tourService.updateTourStatus(this.tourId, statusData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            this.successMessage = 'Tour status updated successfully!';
            // Close the modal first
            this.closeStatusUpdate();
            // Reload the tour data to get the updated information
            this.loadTour();
            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = null, 3000);
          } else {
            this.error = 'Failed to update tour status. Please try again.';
          }
          this.updatingStatus = false;
        },
        error: (error) => {
          console.error('Error updating tour status:', error);
          this.error = 'Failed to update tour status. Please try again.';
          this.updatingStatus = false;
        }
      });
  }

  // Navigate to edit tour
  editTour(): void {
    if (this.tourId) {
      this.router.navigate(['/admin/tour/edit', this.tourId]);
    }
  }

  // Navigate back to list
  goBack(): void {
    this.router.navigate(['/admin/tour/list']);
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
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  // Get status display name
  getStatusDisplayName(status: string): string {
    return this.tourService.getStatusDisplayName(status);
  }

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    return this.tourService.getStatusBadgeClass(status);
  }

  // Get available statuses for update
  getAvailableStatuses(): string[] {
    if (!this.tour) return this.tourService.getAvailableStatuses();

    // Only show valid status transitions for the current status
    const validTransitions: { [key: string]: string[] } = {
      'pending': ['assigned', 'cancelled'],
      'assigned': ['in-progress', 'cancelled', 'approved', 'rejected'],
      'in-progress': ['completed', 'cancelled'],
      'completed': ['approved', 'rejected'],
      'approved': ['in-progress'], // Can restart if needed
      'rejected': ['assigned'], // Can reassign
      'cancelled': ['assigned'] // Can reassign
    };

    const currentStatus = this.tour.status;
    const allowedTransitions = validTransitions[currentStatus] || [];

    // Include current status for reference and allow keeping it (though it will be validated)
    return [currentStatus, ...allowedTransitions.filter(s => s !== currentStatus)];
  }

  // Permission checking methods
  canUpdateStatus(): boolean {
    return this.permissionService.hasPermission('tour', 'approve') ||
           this.permissionService.hasPermission('tour', 'update');
  }

  canEdit(): boolean {
    return this.permissionService.hasPermission('tour', 'update');
  }

  canView(): boolean {
    return this.permissionService.hasPermission('tour', 'read');
  }

  // Check if status update button should be disabled
  isStatusUpdateDisabled(): boolean {
    return !this.newStatus || this.newStatus === this.tour?.status || this.updatingStatus;
  }

  // Validate status transition
  isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: { [key: string]: string[] } = {
      'pending': ['assigned', 'cancelled'],
      'assigned': ['in-progress', 'cancelled', 'approved', 'rejected'],
      'in-progress': ['completed', 'cancelled'],
      'completed': ['approved', 'rejected'],
      'approved': ['in-progress'], // Can restart if needed
      'rejected': ['assigned'], // Can reassign
      'cancelled': ['assigned'] // Can reassign
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  // Get timeline items for status history
  getTimelineItems(): any[] {
    if (!this.tour || !this.tour.statusHistory) return [];

    return this.tour.statusHistory
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
      .map((history, index) => ({
        ...history,
        isLatest: index === 0,
        changedAt: new Date(history.changedAt)
      }));
  }

  // Get file size in readable format
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file icon based on file type
  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'fas fa-file-pdf';
    if (fileType.includes('image')) return 'fas fa-file-image';
    if (fileType.includes('word') || fileType.includes('document')) return 'fas fa-file-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fas fa-file-excel';
    return 'fas fa-file';
  }
}
