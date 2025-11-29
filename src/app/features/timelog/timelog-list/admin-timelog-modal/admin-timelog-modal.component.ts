import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, User } from '../../services/users.service';
import { AttendanceService, AdminCreateAttendanceRequest, AdminUpdateAttendanceRequest } from '../../services/attendance.service';

export interface TimeLogFormData {
  userId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  sessionNumber: number;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
}

@Component({
  selector: 'app-admin-timelog-modal',
  templateUrl: './admin-timelog-modal.component.html',
  styleUrls: ['./admin-timelog-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AdminTimeLogModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() editData?: any; // Existing time log data for editing
  @Output() closeModal = new EventEmitter<void>();
  @Output() actionCompleted = new EventEmitter<any>();

  loading = false;
  error: string | null = null;
  users: User[] = [];
  usersLoading = false;

  formData: TimeLogFormData = {
    userId: '',
    date: '',
    checkInTime: '',
    checkOutTime: '',
    status: 'present',
    notes: '',
    sessionNumber: 1,
    checkInLatitude: undefined,
    checkInLongitude: undefined,
    checkOutLatitude: undefined,
    checkOutLongitude: undefined
  };

  constructor(
    private usersService: UsersService,
    private attendanceService: AttendanceService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    if (this.isOpen) {
      this.initializeForm();
    }
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.initializeForm();
    }
  }

  initializeForm(): void {
    this.resetForm();
    if (this.mode === 'edit' && this.editData) {
      this.populateFormForEdit();
    } else {
      this.setDefaultValues();
    }
  }

  resetForm(): void {
    this.loading = false;
    this.error = null;
    this.formData = {
      userId: '',
      date: '',
      checkInTime: '',
      checkOutTime: '',
      status: 'present',
      notes: '',
      sessionNumber: 1,
      checkInLatitude: undefined,
      checkInLongitude: undefined,
      checkOutLatitude: undefined,
      checkOutLongitude: undefined
    };
  }

  setDefaultValues(): void {
    const today = new Date();
    this.formData.date = today.toISOString().split('T')[0];
    this.formData.checkInTime = '09:00';
    this.formData.checkOutTime = '17:00';
  }

  populateFormForEdit(): void {
    if (this.editData) {
      // Fix date handling to avoid timezone issues
      let dateStr = '';
      if (this.editData.date) {
        // Handle both string and Date objects
        const date = typeof this.editData.date === 'string' ? new Date(this.editData.date) : this.editData.date;
        // Use local date to avoid timezone conversion issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }

      this.formData = {
        userId: this.editData.userId?._id || this.editData.userId || '',
        date: dateStr,
        checkInTime: this.editData.checkInTime ? new Date(this.editData.checkInTime).toTimeString().slice(0, 5) : '',
        checkOutTime: this.editData.checkOutTime ? new Date(this.editData.checkOutTime).toTimeString().slice(0, 5) : '',
        status: this.editData.status || 'present',
        notes: this.editData.notes || '',
        sessionNumber: this.editData.sessionNumber || 1,
        checkInLatitude: this.editData.checkInLatitude || undefined,
        checkInLongitude: this.editData.checkInLongitude || undefined,
        checkOutLatitude: this.editData.checkOutLatitude || undefined,
        checkOutLongitude: this.editData.checkOutLongitude || undefined
      };
    }
  }

  async loadUsers(): Promise<void> {
    this.usersLoading = true;
    try {
      this.users = await this.usersService.getAllUsersForDropdown().toPromise() || [];
    } catch (error) {
      console.error('Failed to load users:', error);
      this.error = 'Failed to load employees. Please try again.';
    } finally {
      this.usersLoading = false;
    }
  }

  async onSave(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      // Validate form
      if (!this.validateForm()) {
        return;
      }

      // Make real API call instead of simulation
      let result;
      if (this.mode === 'add') {
        const request: AdminCreateAttendanceRequest = {
          userId: this.formData.userId,
          date: this.formData.date,
          checkInTime: this.formData.checkInTime,
          checkOutTime: this.formData.checkOutTime || undefined,
          status: this.formData.status,
          notes: this.formData.notes || undefined,
          sessionNumber: this.formData.sessionNumber,
          checkInLatitude: this.formData.checkInLatitude || undefined,
          checkInLongitude: this.formData.checkInLongitude || undefined,
          checkOutLatitude: this.formData.checkOutLatitude || undefined,
          checkOutLongitude: this.formData.checkOutLongitude || undefined
        };
        result = await this.attendanceService.createAttendanceRecord(request).toPromise();
      } else {
        const request: AdminUpdateAttendanceRequest = {
          userId: this.formData.userId,
          date: this.formData.date,
          checkInTime: this.formData.checkInTime,
          checkOutTime: this.formData.checkOutTime || undefined,
          status: this.formData.status,
          notes: this.formData.notes || undefined,
          sessionNumber: this.formData.sessionNumber,
          checkInLatitude: this.formData.checkInLatitude || undefined,
          checkInLongitude: this.formData.checkInLongitude || undefined,
          checkOutLatitude: this.formData.checkOutLatitude || undefined,
          checkOutLongitude: this.formData.checkOutLongitude || undefined
        };
        result = await this.attendanceService.updateAttendanceRecord(this.editData._id, request).toPromise();
      }

      this.actionCompleted.emit(result);
      this.closeModal.emit();
    } catch (error: any) {
      this.error = error.error?.message || error.message || 'An error occurred. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  validateForm(): boolean {
    if (!this.formData.userId) {
      this.error = 'Please select an employee';
      return false;
    }
    if (!this.formData.date) {
      this.error = 'Please select a date';
      return false;
    }
    if (!this.formData.checkInTime) {
      this.error = 'Please enter check-in time';
      return false;
    }
    if (!this.formData.status) {
      this.error = 'Please select a status';
      return false;
    }
    return true;
  }

  calculateTotalHours(): number {
    if (!this.formData.checkInTime || !this.formData.checkOutTime) {
      return 0;
    }

    const checkIn = new Date(`${this.formData.date}T${this.formData.checkInTime}`);
    const checkOut = new Date(`${this.formData.date}T${this.formData.checkOutTime}`);
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return Math.round(diffHours * 100) / 100;
  }

  onClose(): void {
    this.closeModal.emit();
  }

  getModalTitle(): string {
    return this.mode === 'add' ? 'Add Time Log' : 'Edit Time Log';
  }

  getSaveButtonText(): string {
    return this.mode === 'add' ? 'Add Time Log' : 'Update Time Log';
  }

  getSelectedUserName(): string {
    const user = this.users.find(u => u._id === this.formData.userId);
    return user ? `${user.firstname} ${user.lastname}` : '';
  }

  onCheckOutTimeChange(): void {
    // Auto-calculate total hours when checkout time changes
    if (this.formData.checkInTime && this.formData.checkOutTime) {
      const hours = this.calculateTotalHours();
      if (hours > 0) {
        // You could show this in the UI if needed
        console.log(`Total hours: ${hours}`);
      }
    }
  }
}
