import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HolidayService, Holiday, CreateHolidayDto } from '../services/holiday.service';

@Component({
  selector: 'app-holiday-list',
  templateUrl: './holiday-list.component.html',
  styleUrls: ['./holiday-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class HolidayListComponent implements OnInit, OnDestroy {
  // Data
  holidays: Holiday[] = [];
  filteredHolidays: Holiday[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Filters
  searchTerm = '';
  yearFilter = new Date().getFullYear();
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  optionalFilter: 'all' | 'true' | 'false' = 'all';

  // Form states
  showAddForm = false;
  showEditForm = false;
  selectedHoliday: Holiday | null = null;
  formLoading = false;

  // Form data
  holidayForm: CreateHolidayDto = {
    name: '',
    date: '',
    description: '',
    isActive: true,
    isOptional: false
  };

  // Delete confirmation
  showDeleteConfirm = false;
  holidayToDelete: Holiday | null = null;
  deleteLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private holidayService: HolidayService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHolidays();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load holidays from API
  loadHolidays(): void {
    this.loading = true;
    this.error = null;

    this.holidayService.getHolidaysByYear(this.yearFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Holidays response:', response);
          if (response && response.data) {
            this.holidays = response.data;
            this.filteredHolidays = [...this.holidays];
            this.applyFilters();
          } else {
            this.holidays = [];
            this.filteredHolidays = [];
            this.error = 'Invalid response format from server';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading holidays:', error);
          this.error = 'Failed to load holidays. Please try again.';
          this.loading = false;
        }
      });
  }

  // Apply filters to holidays
  applyFilters(): void {
    let filtered = [...this.holidays];

    // Search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(holiday =>
        holiday.name.toLowerCase().includes(searchLower) ||
        holiday.description.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(holiday =>
        this.statusFilter === 'active' ? holiday.isActive : !holiday.isActive
      );
    }

    // Optional filter
    if (this.optionalFilter !== 'all') {
      filtered = filtered.filter(holiday =>
        this.optionalFilter === 'true' ? holiday.isOptional : !holiday.isOptional
      );
    }

    this.filteredHolidays = filtered;
  }

  // Search functionality
  onSearch(): void {
    this.applyFilters();
  }

  // Year filter change
  onYearChange(): void {
    this.loadHolidays();
  }

  // Filter change
  onFilterChange(): void {
    this.applyFilters();
  }

  // Show add form
  showAddHolidayForm(): void {
    this.resetForm();
    this.showAddForm = true;
    this.showEditForm = false;
    this.error = null;
    this.successMessage = null;
  }

  // Show edit form
  showEditHolidayForm(holiday: Holiday): void {
    this.selectedHoliday = holiday;
    this.holidayForm = {
      name: holiday.name,
      date: new Date(holiday.date).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      description: holiday.description,
      isActive: holiday.isActive,
      isOptional: holiday.isOptional
    };
    this.showEditForm = true;
    this.showAddForm = false;
    this.error = null;
    this.successMessage = null;
  }

  // Reset form
  resetForm(): void {
    this.holidayForm = {
      name: '',
      date: '',
      description: '',
      isActive: true,
      isOptional: false
    };
    this.selectedHoliday = null;
  }

  // Close forms
  closeForms(): void {
    this.showAddForm = false;
    this.showEditForm = false;
    this.resetForm();
    this.error = null;
    this.successMessage = null;
  }

  // Submit form (add or edit)
  onSubmit(): void {
    if (!this.holidayForm.name || !this.holidayForm.date || !this.holidayForm.description) {
      this.error = 'Please fill in all required fields.';
      return;
    }

    // Validate date format
    const date = new Date(this.holidayForm.date);
    if (isNaN(date.getTime())) {
      this.error = 'Please enter a valid date.';
      return;
    }

    // Validate date is not in the past for new holidays
    if (!this.showEditForm && date < new Date()) {
      this.error = 'Holiday date cannot be in the past.';
      return;
    }

    // Trim whitespace from text fields
    const formData = {
      ...this.holidayForm,
      name: this.holidayForm.name.trim(),
      description: this.holidayForm.description.trim()
    };

    this.formLoading = true;
    this.error = null;
    this.successMessage = null;

    if (this.showEditForm && this.selectedHoliday) {
      // Update existing holiday
      this.holidayService.updateHoliday(this.selectedHoliday._id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response) {
              this.successMessage = 'Holiday updated successfully!';
              this.loadHolidays();
              this.closeForms();
              // Clear success message after 3 seconds
              setTimeout(() => this.successMessage = null, 3000);
            } else {
              this.error = 'Failed to update holiday. Please try again.';
            }
            this.formLoading = false;
          },
          error: (error) => {
            console.error('Error updating holiday:', error);
            this.error = 'Failed to update holiday. Please try again.';
            this.formLoading = false;
          }
        });
    } else {
      // Create new holiday
      this.holidayService.createHoliday(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response) {
              this.successMessage = 'Holiday created successfully!';
              this.loadHolidays();
              this.closeForms();
              // Clear success message after 3 seconds
              setTimeout(() => this.successMessage = null, 3000);
            } else {
              this.error = 'Failed to create holiday. Please try again.';
            }
            this.formLoading = false;
          },
          error: (error) => {
            console.error('Error creating holiday:', error);
            this.error = 'Failed to create holiday. Please try again.';
            this.formLoading = false;
          }
        });
    }
  }

  // Show delete confirmation
  showDeleteConfirmation(holiday: Holiday): void {
    this.holidayToDelete = holiday;
    this.showDeleteConfirm = true;
  }

  // Cancel delete
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.holidayToDelete = null;
    this.error = null;
    this.successMessage = null;
  }

  // Confirm delete
  confirmDelete(): void {
    if (!this.holidayToDelete) return;

    this.deleteLoading = true;
    this.holidayService.deleteHoliday(this.holidayToDelete._id)
      .pipe(takeUntil(this.destroy$))
              .subscribe({
          next: (response) => {
            if (response) {
              this.successMessage = 'Holiday deleted successfully!';
              this.loadHolidays();
              this.cancelDelete();
              // Clear success message after 3 seconds
              setTimeout(() => this.successMessage = null, 3000);
            } else {
              this.error = 'Failed to delete holiday. Please try again.';
            }
            this.deleteLoading = false;
          },
        error: (error) => {
          console.error('Error deleting holiday:', error);
          this.error = 'Failed to delete holiday. Please try again.';
          this.deleteLoading = false;
        }
      });
  }

  // Toggle holiday status
  toggleHolidayStatus(holiday: Holiday): void {
    const updateData = { isActive: !holiday.isActive };
    
    this.holidayService.updateHoliday(holiday._id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response) {
            this.successMessage = `Holiday ${holiday.isActive ? 'deactivated' : 'activated'} successfully!`;
            this.loadHolidays();
            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = null, 3000);
          } else {
            this.error = 'Failed to update holiday status. Please try again.';
          }
        },
        error: (error) => {
          console.error('Error updating holiday status:', error);
          this.error = 'Failed to update holiday status. Please try again.';
        }
      });
  }

  // Format date for display
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  // Get current year options for filter
  getYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  }

  // Clear all filters
  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.optionalFilter = 'all';
    this.applyFilters();
  }

  // Check if any filters are active
  hasActiveFilters(): boolean {
    return this.searchTerm !== '' || 
           this.statusFilter !== 'all' || 
           this.optionalFilter !== 'all';
  }
}
