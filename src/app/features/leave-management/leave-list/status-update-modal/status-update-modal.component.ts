import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveRequest } from '../../services/leave.service';

@Component({
  selector: 'app-status-update-modal',
  templateUrl: './status-update-modal.component.html',
  styleUrls: ['./status-update-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class StatusUpdateModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() leaveRequest: LeaveRequest | null = null;
  @Input() defaultStatus: 'approved' | 'rejected' | 'cancelled' = 'approved';
  @Output() closeModal = new EventEmitter<void>();
  @Output() statusUpdated = new EventEmitter<any>();

  selectedStatus: string = 'approved';
  notes: string = '';
  rejectionReason: string = '';
  loading = false;
  error: string | null = null;

  statusOptions = [
    { value: 'approved', label: 'Approve', class: 'status-approved' },
    { value: 'rejected', label: 'Reject', class: 'status-rejected' },
    { value: 'cancelled', label: 'Cancel', class: 'status-cancelled' }
  ];

  ngOnInit(): void {
    if (this.leaveRequest) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.selectedStatus = this.defaultStatus || 'approved';
    this.notes = '';
    this.rejectionReason = '';
    this.error = null;
  }

  onStatusChange(): void {
    // Clear rejection reason if not rejecting
    if (this.selectedStatus !== 'rejected') {
      this.rejectionReason = '';
    }
  }

  onSubmit(): void {
    if (!this.leaveRequest) return;

    const statusData: any = {
      status: this.selectedStatus
    };

    if (this.notes.trim()) {
      statusData.notes = this.notes.trim();
    }

    if (this.selectedStatus === 'rejected' && this.rejectionReason.trim()) {
      statusData.rejectionReason = this.rejectionReason.trim();
    }

    this.loading = true;
    this.error = null;

    // Emit the status update data
    this.statusUpdated.emit({
      leaveId: this.leaveRequest._id,
      statusData: statusData
    });
  }

  onClose(): void {
    this.resetForm();
    this.closeModal.emit();
  }

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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
