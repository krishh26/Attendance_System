import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, CheckInRequest, CheckOutRequest } from '../../services/attendance.service';

@Component({
  selector: 'app-attendance-modal',
  templateUrl: './attendance-modal.component.html',
  styleUrls: ['./attendance-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AttendanceModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() action: 'checkin' | 'checkout' = 'checkin';
  @Output() closeModal = new EventEmitter<void>();
  @Output() actionCompleted = new EventEmitter<any>();

  loading = false;
  error: string | null = null;
  useLocation = true;
  latitude: number | null = null;
  longitude: number | null = null;
  locationError: string | null = null;

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit(): void {
    if (this.isOpen) {
      this.getCurrentLocation();
    }
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.resetForm();
      this.getCurrentLocation();
    }
  }

  resetForm(): void {
    this.loading = false;
    this.error = null;
    this.locationError = null;
    this.latitude = null;
    this.longitude = null;
  }

  async getCurrentLocation(): Promise<void> {
    if (!this.useLocation) return;

    try {
      const location = await this.attendanceService.getCurrentLocation();
      this.latitude = location.latitude;
      this.longitude = location.longitude;
      this.locationError = null;
    } catch (error) {
      console.warn('Failed to get location:', error);
      this.locationError = 'Unable to get your current location. You can still proceed without location data.';
      this.useLocation = false;
    }
  }

  async onActionClick(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const request = this.useLocation && this.latitude && this.longitude
        ? { latitude: this.latitude, longitude: this.longitude }
        : {};

      let response;
      if (this.action === 'checkin') {
        response = await this.attendanceService.checkIn(request).toPromise();
      } else {
        response = await this.attendanceService.checkOut(request).toPromise();
      }

      this.actionCompleted.emit(response);
      this.closeModal.emit();
    } catch (error: any) {
      this.error = error.error?.message || error.message || 'An error occurred. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onLocationToggle(): void {
    if (this.useLocation) {
      this.getCurrentLocation();
    } else {
      this.locationError = null;
    }
  }

  getActionTitle(): string {
    return this.action === 'checkin' ? 'Check In' : 'Check Out';
  }

  getActionIcon(): string {
    return this.action === 'checkin' ? 'fas fa-sign-in-alt' : 'fas fa-sign-out-alt';
  }

  getActionColor(): string {
    return this.action === 'checkin' ? '#28a745' : '#dc3545';
  }
}
