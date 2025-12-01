import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TimelogService, TimeLogEntry, TimeLogResponse, TimeLogParams } from '../services/timelog.service';
import { AttendanceService } from '../services/attendance.service';
import { AttendanceModalComponent } from './attendance-modal/attendance-modal.component';
import { AdminTimeLogModalComponent } from './admin-timelog-modal/admin-timelog-modal.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-timelog-list',
  templateUrl: './timelog-list.component.html',
  styleUrls: ['./timelog-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, AttendanceModalComponent, AdminTimeLogModalComponent]
})
export class TimelogListComponent implements OnInit, OnDestroy {
  // Make Math available in template
  Math = Math;

  // Data properties
  timeEntries: TimeLogEntry[] = [];
  loading = false;
  error: string | null = null;

  // Search and filter properties
  searchTerm = '';
  selectedDate: string;
  selectedStatus = 'all';

  // Pagination properties
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  pageSizeOptions = [10, 25, 50, 100];

  // Sorting properties
  sortBy = '';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Summary statistics
  summaryStats = {
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    averageHours: 0
  };

  // Attendance modal properties
  showAttendanceModal = false;
  attendanceAction: 'checkin' | 'checkout' = 'checkin';
  hasActiveSession = false;

  // Admin modal properties
  showAdminModal = false;
  adminModalMode: 'add' | 'edit' = 'add';
  selectedTimeLog: any = null;
  isAdmin = true; // This should be determined by user role in real implementation

  // RxJS subjects for cleanup
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private timelogService: TimelogService,
    private attendanceService: AttendanceService
  ) {
    // Set default date to today
    this.selectedDate = this.timelogService.getTodayDate();
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadTimeLogs();
    this.checkCurrentStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Setup search with debounce
  private setupSearch(): void {
    this.searchSubject$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTimeLogs();
      });
  }

  // Load time logs from API
  loadTimeLogs(): void {
    this.loading = true;
    this.error = null;

    const params: TimeLogParams = {
      date: this.selectedDate,
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm.trim() || undefined
    };

    this.timelogService.getAllUsersTimeLogs(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: TimeLogResponse) => {
          this.loading = false;
          this.timeEntries = response.data.data;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.totalPages;
          this.currentPage = response.pagination.page;
          this.updateSummaryStats();
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to load time logs. Please try again.';
          console.error('Error loading time logs:', error);
        }
      });
  }

  // Update summary statistics based on current data
  private updateSummaryStats(): void {
    const total = this.timeEntries.length;
    const present = this.timeEntries.filter(entry => entry.status.toLowerCase() === 'present').length;
    const late = this.timeEntries.filter(entry => entry.status.toLowerCase() === 'late').length;
    const absent = this.timeEntries.filter(entry => entry.status.toLowerCase() === 'absent').length;

    this.summaryStats = {
      totalEmployees: total,
      presentToday: present,
      lateToday: late,
      absentToday: absent,
      averageHours: 0 // Calculate if needed
    };
  }

  // Handle search input
  onSearchChange(event?: Event): void {
    const target = event?.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchSubject$.next(this.searchTerm);
  }

  // Clear search input
  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadTimeLogs();
  }

  // Handle date filter change
  onDateChange(): void {
    this.currentPage = 1;
    this.loadTimeLogs();
  }

  // Handle status filter change
  onStatusChange(): void {
    // Status filter is applied client-side, no need to reload
    // But we can reload if you want server-side status filtering
    // this.currentPage = 1;
    // this.loadTimeLogs();
  }

  // Handle page change
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTimeLogs();
    }
  }

  // Get pages array for pagination
  get pages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Filter time entries based on status (search is now handled server-side)
  get filteredTimeEntries(): TimeLogEntry[] | any[] {
    let filtered = this.timeEntries;

    // Apply status filter (client-side since it's already loaded)
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(entry =>
        entry.status.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    return filtered;
  }

  // Utility methods for display
  getStatusClass(status: string): string {
    return this.timelogService.getStatusClass(status);
  }

  getStatusText(status: string): string {
    return this.timelogService.getStatusText(status);
  }

  formatDate(dateString: string): string {
    return this.timelogService.formatDateForDisplay(dateString);
  }

  formatTime(timeString: string): string {
    return this.timelogService.formatTimeForDisplay(timeString);
  }

  // Check if entry is checked out
  isCheckedOut(entry: TimeLogEntry): boolean {
    return entry.isCheckedOut;
  }

  // Get employee display name
  getEmployeeName(entry: any): string {
    return entry.userId?.firstname + ' ' + entry.userId?.lastname || 'Unknown Employee';
  }

  // Get total hours (placeholder - calculate based on check-in/out times)
  getTotalHours(entry: TimeLogEntry): string {
    if (entry.isCheckedOut) {
      // Calculate hours between check-in and check-out
      const checkIn = new Date(entry.checkInTime);
      const checkOut = new Date(entry.updatedAt);
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours.toFixed(1);
    }
    return '--';
  }

  // Open map with coordinates
  openMapWithCoordinates(latitude: number, longitude: number, type: 'checkin' | 'checkout'): void {
    if (latitude && longitude) {
      // Use Google Maps with coordinates
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15&t=m`;
      window.open(mapUrl, '_blank');
    }
  }

  // Check if coordinates are valid
  hasValidCoordinates(latitude: number, longitude: number): boolean {
    return latitude != null && longitude != null &&
           !isNaN(latitude) && !isNaN(longitude) &&
           latitude !== 0 && longitude !== 0;
  }

  // Set date to today
  setToday(): void {
    this.selectedDate = this.timelogService.getTodayDate();
    this.onDateChange();
  }

  // Clear all filters
  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedDate = this.timelogService.getTodayDate();
    this.selectedStatus = 'all';
    this.currentPage = 1;
    this.loadTimeLogs();
  }

  // Check if any filters are active
  hasActiveFilters(): boolean {
    return this.searchTerm.trim() !== '' ||
           this.selectedStatus !== 'all' ||
           this.selectedDate !== this.timelogService.getTodayDate();
  }

  // Handle page size change
  onPageSizeChange(newSize: number): void {
    this.itemsPerPage = newSize;
    this.currentPage = 1;
    this.loadTimeLogs();
  }

  // Handle sorting
  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.currentPage = 1;
    this.loadTimeLogs();
  }

  // Get range start for pagination info
  get rangeStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  // Get range end for pagination info
  get rangeEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  // Refresh data method
  refreshData(): void {
    this.loadTimeLogs();
  }

  // Export data method (placeholder)
  exportData(): void {
    // Implement export functionality
    console.log('Export data clicked');
    // Could export to CSV, Excel, etc.
  }

  // Get profile image method
  getProfileImage(entry: any): string {
    // Return default avatar or user's profile image
    return entry.userId?.profileImage || 'assets/images/default-avatar.png';
  }

  // Check current attendance status
  checkCurrentStatus(): void {
    this.attendanceService.getCurrentStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          this.hasActiveSession = status.hasActiveSession;
        },
        error: (error) => {
          console.warn('Failed to get current status:', error);
        }
      });
  }

  // Open check-in modal
  openCheckInModal(): void {
    this.attendanceAction = 'checkin';
    this.showAttendanceModal = true;
  }

  // Open check-out modal
  openCheckOutModal(): void {
    this.attendanceAction = 'checkout';
    this.showAttendanceModal = true;
  }

  // Close attendance modal
  closeAttendanceModal(): void {
    this.showAttendanceModal = false;
  }

  // Handle attendance action completion
  onAttendanceCompleted(response: any): void {
    console.log('Attendance action completed:', response);
    // Refresh the data to show updated attendance
    this.loadTimeLogs();
    this.checkCurrentStatus();
  }

  // Get appropriate button text and action
  getAttendanceButtonText(): string {
    return this.hasActiveSession ? 'Check Out' : 'Check In';
  }

  getAttendanceButtonIcon(): string {
    return this.hasActiveSession ? 'fas fa-sign-out-alt' : 'fas fa-sign-in-alt';
  }

  getAttendanceButtonColor(): string {
    return this.hasActiveSession ? '#dc3545' : '#28a745';
  }

  onAttendanceButtonClick(): void {
    if (this.hasActiveSession) {
      this.openCheckOutModal();
    } else {
      this.openCheckInModal();
    }
  }

  // Admin modal methods
  openAddTimeLogModal(): void {
    this.adminModalMode = 'add';
    this.selectedTimeLog = null;
    this.showAdminModal = true;
  }

  openEditTimeLogModal(timeLog: any): void {
    this.adminModalMode = 'edit';
    this.selectedTimeLog = timeLog;
    this.showAdminModal = true;
  }

  closeAdminModal(): void {
    this.showAdminModal = false;
    this.selectedTimeLog = null;
  }

  onAdminActionCompleted(response: any): void {
    console.log('Admin action completed:', response);
    // Refresh the data to show updated time logs
    this.loadTimeLogs();
  }

  // Get appropriate button text and action for admin
  getAdminButtonText(): string {
    return 'Add Time Log';
  }

  getAdminButtonIcon(): string {
    return 'fas fa-plus';
  }

  onAdminButtonClick(): void {
    this.openAddTimeLogModal();
  }

  // Excel Export functionality
  exportToExcel(): void {
    try {
      // Prepare data for export
      const exportData = this.timeEntries.map(entry => ({
        'Employee Name': entry.userId && typeof entry.userId === 'object' ? `${entry.userId.firstname} ${entry.userId.lastname}` : 'N/A',
        'Employee ID': entry.userId && typeof entry.userId === 'object' ? entry.userId.employeeId : 'N/A',
        'Email': entry.userId && typeof entry.userId === 'object' ? entry.userId.email : 'N/A',
        'Date': this.formatDateForExport(entry.date),
        'Check In Time': entry.checkInTime ? this.formatTimeForExport(entry.checkInTime) : 'Not Checked In',
        'Check Out Time': entry.checkOutTime ? this.formatTimeForExport(entry.checkOutTime) : 'Not Checked Out',
        'Total Hours': entry.totalHours ? entry.totalHours.toFixed(2) : '0.00',
        'Status': this.getStatusText(entry.status),
        'Session Number': entry.sessionNumber || 1,
        'Check In Location': this.formatLocation(entry.checkInLatitude, entry.checkInLongitude),
        'Check Out Location': this.formatLocation(entry.checkOutLatitude, entry.checkOutLongitude),
        'Notes': '', // No notes field in the interface
        'Created At': entry.createdAt ? this.formatDateTimeForExport(entry.createdAt) : 'N/A',
        'Updated At': entry.updatedAt ? this.formatDateTimeForExport(entry.updatedAt) : 'N/A'
      }));

      // Create workbook and worksheet
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Employee Name
        { wch: 15 }, // Employee ID
        { wch: 25 }, // Email
        { wch: 12 }, // Date
        { wch: 15 }, // Check In Time
        { wch: 15 }, // Check Out Time
        { wch: 12 }, // Total Hours
        { wch: 12 }, // Status
        { wch: 15 }, // Session Number
        { wch: 20 }, // Check In Location
        { wch: 20 }, // Check Out Location
        { wch: 30 }, // Notes
        { wch: 20 }, // Created At
        { wch: 20 }  // Updated At
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Time Logs');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Time_Logs_Export_${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      console.log('Excel export completed successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting data to Excel. Please try again.');
    }
  }

  // Helper methods for formatting export data
  private formatDateForExport(date: string | Date): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  private formatTimeForExport(time: string | Date): string {
    if (!time) return 'N/A';
    const timeObj = typeof time === 'string' ? new Date(time) : time;
    return timeObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  private formatDateTimeForExport(dateTime: string | Date): string {
    if (!dateTime) return 'N/A';
    const dateTimeObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return dateTimeObj.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  private formatLocation(latitude?: number, longitude?: number): string {
    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      return 'No Location Data';
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}
