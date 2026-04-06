import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TimelogService, TimeLogEntry } from '../../services/timelog.service';
import { STATE_MAHARASHTRA, DISTRICTS, getTalukasForDistrict } from '../../../../shared/constants/location.constants';

export type DetailModalType = 'total' | 'present' | 'late' | 'absent';

@Component({
  selector: 'app-timelog-detail-modal',
  templateUrl: './timelog-detail-modal.component.html',
  styleUrls: ['./timelog-detail-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
})
export class TimelogDetailModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() modalType: DetailModalType = 'total';
  @Input() initialDate = '';
  @Input() initialStateId = '';
  @Input() initialCityId = '';
  @Input() initialTaluka = '';
  @Output() closeModal = new EventEmitter<void>();

  entries: TimeLogEntry[] = [];
  loading = false;
  error: string | null = null;
  selectedDate = '';
  selectedStateId = '';
  selectedCityId = '';
  selectedTaluka = '';
  searchTerm = '';
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  readonly stateOptions = [{ id: 'maharashtra', name: STATE_MAHARASHTRA }];
  readonly districts = DISTRICTS;
  talukas: string[] = [];
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private filtersSubject$ = new Subject<void>();

  constructor(
    private timelogService: TimelogService,
    private datePipe: DatePipe,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue && this.isOpen) {
      this.destroy$ = new Subject<void>();
      this.selectedDate = this.initialDate || this.timelogService.getTodayDate();
      this.selectedStateId = this.initialStateId || '';
      this.selectedCityId = this.initialCityId || '';
      this.selectedTaluka = this.initialTaluka || '';
      this.talukas = this.selectedCityId ? getTalukasForDistrict(this.selectedCityId) : [];
      this.currentPage = 1;
      this.searchTerm = '';
      this.setupListeners();
      this.loadData();
    }
  }

  private setupListeners(): void {
    this.searchSubject$.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });
    this.filtersSubject$.pipe(takeUntil(this.destroy$), debounceTime(200)).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });
  }

  get modalTitle(): string {
    switch (this.modalType) {
      case 'present': return 'Present Today';
      case 'late': return 'Late Today';
      case 'absent': return 'Absent Today';
      default: return 'Total Employees';
    }
  }

  loadData(): void {
    if (!this.selectedDate) return;
    this.loading = true;
    this.error = null;
    const stateName = this.selectedStateId ? this.stateOptions.find(s => s.id === this.selectedStateId)?.name : undefined;
    this.timelogService
      .getUsersByStatusForDate({
        date: this.selectedDate,
        status: this.modalType,
        page: this.currentPage,
        limit: this.itemsPerPage,
        search: this.searchTerm.trim() || undefined,
        state: stateName,
        city: this.selectedCityId || undefined,
        center: this.selectedTaluka.trim() || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading = false;
          // API returns payload under data; interceptor wraps so array is at res.data.data or res.data
          const raw = (res as any).data;
          this.entries = Array.isArray(raw) ? raw : (raw?.data ?? []);
          this.totalItems = (res as any).pagination?.total ?? 0;
          this.totalPages = (res as any).pagination?.totalPages ?? 1;
          this.currentPage = (res as any).pagination?.page ?? 1;
        },
        error: () => {
          this.loading = false;
          this.error = 'Failed to load data.';
        },
      });
  }

  onDateChange(): void {
    this.currentPage = 1;
    this.filtersSubject$.next();
  }

  onStateChange(): void {
    this.selectedCityId = '';
    this.selectedTaluka = '';
    this.talukas = [];
    this.filtersSubject$.next();
  }

  onCityChange(): void {
    this.talukas = getTalukasForDistrict(this.selectedCityId);
    this.selectedTaluka = '';
    this.filtersSubject$.next();
  }

  onTalukaChange(): void {
    this.filtersSubject$.next();
  }

  onSearchChange(e?: Event): void {
    if (e != null) {
      this.searchTerm = (e.target as HTMLInputElement)?.value ?? '';
    }
    this.searchSubject$.next(this.searchTerm);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadData();
    }
  }

  onPageSizeChange(size: number | string): void {
    this.itemsPerPage = typeof size === 'number' ? size : parseInt(String(size), 10) || 10;
    this.currentPage = 1;
    this.loadData();
  }

  close(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeModal.emit();
  }

  get rangeStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  get pages(): number[] {
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  getEmployeeName(entry: any): string {
    const u = entry?.userId;
    if (typeof u === 'object' && u) {
      return [u.firstname, u.lastname].filter(Boolean).join(' ') || 'Unknown';
    }
    return 'Unknown';
  }

  formatDate(date: string | Date): string {
    return this.timelogService.formatDateForDisplay(typeof date === 'string' ? date : (date as Date)?.toISOString?.() ?? '');
  }

  getDerivedStatus(entry: TimeLogEntry): string {
    if ((entry?.status || '').toLowerCase() === 'absent' || !entry?.checkInTime) return 'absent';
    try {
      const formatted = this.datePipe.transform(entry.checkInTime, 'HH:mm', 'UTC');
      if (!formatted) return entry.status || 'present';
      const [h, m] = formatted.split(':').map(Number);
      const totalMinutes = (h ?? 0) * 60 + (m ?? 0);
      return totalMinutes > 610 ? 'late' : 'present';
    } catch {
      return entry.status || 'present';
    }
  }

  getStatusClassForEntry(entry: TimeLogEntry): string {
    return this.timelogService.getStatusClass(this.getDerivedStatus(entry));
  }

  getStatusTextForEntry(entry: TimeLogEntry): string {
    return this.timelogService.getStatusText(this.getDerivedStatus(entry));
  }

  getTotalHours(entry: TimeLogEntry): string {
    if (!entry?.isCheckedOut || !entry?.checkOutTime) return '--';
    const h = entry.totalHours;
    if (h != null && !isNaN(h)) {
      const hrs = Math.floor(h);
      const min = Math.round((h - hrs) * 60);
      if (hrs > 0) return `${hrs} hr ${min} min`;
      return `${min} min`;
    }
    return '--';
  }

  hasValidCoordinates(lat: number | undefined, lng: number | undefined): boolean {
    return lat != null && lng != null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  }
}
