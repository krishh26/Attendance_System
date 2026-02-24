import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TimelogService, TimeLogEntry, TimeLogResponse, TimeLogParams } from '../services/timelog.service';
import { AttendanceService } from '../services/attendance.service';
import { AttendanceModalComponent } from './attendance-modal/attendance-modal.component';
import { AdminTimeLogModalComponent } from './admin-timelog-modal/admin-timelog-modal.component';
import { TimelogDetailModalComponent, DetailModalType } from './timelog-detail-modal/timelog-detail-modal.component';
import { STATE_MAHARASHTRA, DISTRICTS, getTalukasForDistrict } from '../../../shared/constants/location.constants';
import * as XLSX from 'xlsx';
import { AuthService } from '../../auth/services/auth.service';
import { PermissionService } from '../../../shared/services/permission.service';

@Component({
  selector: 'app-timelog-list',
  templateUrl: './timelog-list.component.html',
  styleUrls: ['./timelog-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, AttendanceModalComponent, AdminTimeLogModalComponent, TimelogDetailModalComponent],
  providers: [DatePipe]
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
  selectedStateId = '';
  selectedCityId = '';
  selectedTaluka = '';

  // Static location data (Maharashtra)
  readonly stateOptions = [{ id: 'maharashtra', name: STATE_MAHARASHTRA }];
  readonly districts = DISTRICTS;
  talukas: string[] = [];

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
  isAdmin = false;

  // Detail modal (card click → user listing by type)
  showDetailModal = false;
  detailModalType: DetailModalType = 'total';

  // RxJS subjects for cleanup
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private filtersSubject$ = new Subject<void>();

  constructor(
    private timelogService: TimelogService,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router,
    private datePipe: DatePipe
  ) {
    // Set default date to today
    this.selectedDate = this.timelogService.getTodayDate();
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.isCurrentUserSuperAdmin();
    this.setupSearch();
    this.setupFilters();
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

  // Debounce other filters (state, city, taluka) to avoid rapid calls
  private setupFilters(): void {
    this.filtersSubject$
      .pipe(takeUntil(this.destroy$), debounceTime(200))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTimeLogs();
      });
  }

  // Load time logs from API
  loadTimeLogs(): void {
    this.loading = true;
    this.error = null;

    const stateName = this.getSelectedStateName();
    const cityName = this.selectedCityId || undefined;
    const center = this.selectedTaluka.trim() || undefined;

    const params: TimeLogParams = {
      date: this.selectedDate,
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm.trim() || undefined,
      state: stateName,
      city: cityName,
      center
    };

    this.timelogService.getAllUsersTimeLogs(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: TimeLogResponse) => {
          this.loading = false;
          // Support both response shapes: data as array or data.data (API may wrap in data)
          const dataPayload = response.data as any;
          this.timeEntries = Array.isArray(dataPayload) ? dataPayload : (dataPayload?.data ?? []);
          // Table total = pagination total (records for selected date); cards use summary
          this.totalItems = response.pagination?.total ?? (dataPayload?.pagination?.total) ?? 0;
          this.totalPages = response.pagination?.totalPages ?? dataPayload?.pagination?.totalPages ?? 1;
          this.currentPage = response.pagination?.page ?? dataPayload?.pagination?.page ?? 1;
          // Summary may be at top level or nested in response.data (same filters as backend)
          const summary = response.summary ?? dataPayload?.summary;
          if (summary) {
            this.summaryStats = {
              totalEmployees: summary.totalEmployees,
              presentToday: summary.presentToday,
              lateToday: summary.lateToday,
              absentToday: summary.absentToday,
              averageHours: this.summaryStats.averageHours
            };
          } else {
            this.updateSummaryStatsFallback();
          }
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to load time logs. Please try again.';
          console.error('Error loading time logs:', error);
        }
      });
  }

  // Fallback when backend does not return summary (e.g. old API)
  private updateSummaryStatsFallback(): void {
    const total = this.timeEntries.length;
    let present = 0;
    let late = 0;
    for (const entry of this.timeEntries) {
      const derivedStatus = this.getDerivedStatus(entry).toLowerCase();
      if (derivedStatus === 'present') present++;
      else if (derivedStatus === 'late') late++;
    }
    let absent = Math.max(0, total - present - late);
    this.summaryStats = {
      totalEmployees: total,
      presentToday: present,
      lateToday: late,
      absentToday: absent,
      averageHours: this.summaryStats.averageHours
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

  onStateChange(): void {
    this.selectedCityId = '';
    this.selectedTaluka = '';
    this.talukas = [];
    this.triggerFiltersChange();
  }

  onCityChange(): void {
    this.talukas = getTalukasForDistrict(this.selectedCityId);
    this.selectedTaluka = '';
    this.triggerFiltersChange();
  }

  onTalukaChange(): void {
    this.triggerFiltersChange();
  }

  private triggerFiltersChange(): void {
    this.filtersSubject$.next();
  }

  private getSelectedStateName(): string | undefined {
    if (!this.selectedStateId) return undefined;
    const state = this.stateOptions.find(s => s.id === this.selectedStateId);
    return state ? state.name : undefined;
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

  // Present/late are filtered by backend. Absent is client-side until backend support is added.
  get filteredTimeEntries(): TimeLogEntry[] | any[] {
    return this.timeEntries;
  }

  // Compute derived status based on the SAME time that is shown in the list.
  // We use DatePipe with 'UTC' timezone, exactly like the template:
  // {{ entry.checkInTime | date:'h:mm a':'UTC' }}
  //
  // Rule:
  // - Late  => check-in AFTER 10:30 AM (displayed time)
  // - Present => check-in at or BEFORE 10:30 AM
  // - Absent => no check-in or explicit absent from backend
  getDerivedStatus(entry: TimeLogEntry): string {
    const baseStatus = (entry.status || '').toLowerCase();

    // Explicit absent from backend always wins
    if (baseStatus === 'absent') {
      return 'absent';
    }

    // If there is no check-in time, treat as absent for counting/filtering
    if (!entry.checkInTime) {
      return 'absent';
    }

    try {
      // Format exactly as listing does, but get 24h HH:mm for easier parsing
      const formatted = this.datePipe.transform(entry.checkInTime, 'HH:mm', 'UTC');
      if (!formatted) {
        return entry.status;
      }

      const [hStr, mStr] = formatted.split(':');
      const hours = parseInt(hStr, 10);
      const minutes = parseInt(mStr, 10);
      if (isNaN(hours) || isNaN(minutes)) {
        return entry.status;
      }

      const totalMinutes = hours * 60 + minutes;

      // 10:30 AM cutoff in minutes (same "display" timezone as listing)
      const cutoffMinutes = 10 * 60 + 30;

      if (totalMinutes > cutoffMinutes) {
        return 'late';
      }

      return 'present';
    } catch {
      return entry.status;
    }
  }

  // Utility methods for display
  getStatusClass(status: string): string {
    return this.timelogService.getStatusClass(status);
  }

  getStatusText(status: string): string {
    return this.timelogService.getStatusText(status);
  }

  // Status helpers that use the derived status (used in template/export)
  getStatusClassForEntry(entry: TimeLogEntry): string {
    return this.timelogService.getStatusClass(this.getDerivedStatus(entry));
  }

  getStatusTextForEntry(entry: TimeLogEntry): string {
    return this.timelogService.getStatusText(this.getDerivedStatus(entry));
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

  // Format hours and minutes as "X hour(s) Y min"
  formatHoursAndMinutes(totalHours: number): string {
    if (totalHours <= 0) {
      return '0 min';
    }

    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    }

    if (minutes > 0) {
      parts.push(`${minutes} min`);
    }

    // If less than 1 hour, show only minutes
    if (hours === 0 && minutes === 0) {
      return '0 min';
    }

    return parts.join(' ');
  }

  // Get total hours - use backend calculated value or calculate from check-in/out times
  getTotalHours(entry: TimeLogEntry): string {
    if (!entry.isCheckedOut || !entry.checkOutTime) {
      return '--';
    }

    let totalHours: number;

    // Use backend calculated totalHours if available
    if (entry.totalHours !== undefined && entry.totalHours !== null) {
      totalHours = entry.totalHours;
    } else {
      // Otherwise calculate from check-in and check-out times
      try {
        const checkIn = new Date(entry.checkInTime);
        const checkOut = new Date(entry.checkOutTime);

        // Validate dates
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
          return '--';
        }

        // Calculate difference in milliseconds
        const diffMs = checkOut.getTime() - checkIn.getTime();

        // Ensure positive value
        if (diffMs < 0) {
          return '--';
        }

        // Convert to hours
        totalHours = diffMs / (1000 * 60 * 60);
      } catch (error) {
        console.error('Error calculating total hours:', error);
        return '--';
      }
    }

    // Format as "X hour(s) Y min"
    return this.formatHoursAndMinutes(totalHours);
  }

  // Open map with coordinates
  openMapWithCoordinates(latitude: number | undefined, longitude: number | undefined, type: 'checkin' | 'checkout'): void {
    if (latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude)) {
      // Use Google Maps with coordinates
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15&t=m`;
      window.open(mapUrl, '_blank');
    }
  }

  // Check if coordinates are valid
  hasValidCoordinates(latitude: number | undefined, longitude: number | undefined): boolean {
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
    this.selectedStateId = '';
    this.selectedCityId = '';
    this.selectedTaluka = '';
    this.talukas = [];
    this.currentPage = 1;
    this.loadTimeLogs();
  }

  // Check if any filters are active
  hasActiveFilters(): boolean {
    return this.searchTerm.trim() !== '' ||
      this.selectedDate !== this.timelogService.getTodayDate() ||
      !!this.selectedStateId ||
      !!this.selectedCityId ||
      this.selectedTaluka.trim() !== '';
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

  openDetailModal(type: DetailModalType): void {
    this.detailModalType = type;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
  }

  onAdminActionCompleted(response: any): void {
    console.log('Admin action completed:', response);
    // Refresh the data to show updated time logs
    this.loadTimeLogs();
  }

  // Permission checking methods
  canCreate(): boolean {
    return this.permissionService.hasPermission('attendance', 'create') || 
           this.permissionService.hasPermission('timelog', 'create');
  }

  canEdit(): boolean {
    return this.permissionService.hasPermission('attendance', 'update') || 
           this.permissionService.hasPermission('timelog', 'update');
  }

  // Navigate to tour listing page
  navigateToTourList(): void {
    this.router.navigate(['/admin/tour/list']);
  }

  canDelete(): boolean {
    return this.permissionService.hasPermission('attendance', 'delete') || 
           this.permissionService.hasPermission('timelog', 'delete');
  }

  canView(): boolean {
    return this.permissionService.hasPermission('attendance', 'read') || 
           this.permissionService.hasPermission('timelog', 'read');
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
        'Total Hours': entry.totalHours ? this.formatHoursAndMinutes(entry.totalHours) : '0 min',
        'Status': this.getStatusTextForEntry(entry),
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
