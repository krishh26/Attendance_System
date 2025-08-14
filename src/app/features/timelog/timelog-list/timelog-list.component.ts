import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TimelogService, TimeLogEntry, TimeLogResponse, TimeLogParams } from '../services/timelog.service';

@Component({
  selector: 'app-timelog-list',
  templateUrl: './timelog-list.component.html',
  styleUrls: ['./timelog-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
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

  // Summary statistics
  summaryStats = {
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    averageHours: 0
  };

  // RxJS subjects for cleanup
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(private timelogService: TimelogService) {
    // Set default date to today
    this.selectedDate = this.timelogService.getTodayDate();
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadTimeLogs();
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
      limit: this.itemsPerPage
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
  onSearchChange(): void {
    this.searchSubject$.next(this.searchTerm);
  }

  // Handle date filter change
  onDateChange(): void {
    this.currentPage = 1;
    this.loadTimeLogs();
  }

  // Handle status filter change
  onStatusChange(): void {
    this.currentPage = 1;
    this.loadTimeLogs();
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

  // Filter time entries based on search and status
  get filteredTimeEntries(): TimeLogEntry[] {
    let filtered = this.timeEntries;

    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.userId?.toLowerCase().includes(search) ||
        entry.status.toLowerCase().includes(search)
      );
    }

    // Apply status filter
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
}
