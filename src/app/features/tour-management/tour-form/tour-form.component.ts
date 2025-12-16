import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TourService, Tour, CreateTourDto, UpdateTourDto } from '../services/tour.service';
import { UserService, User } from '../../admin/user-list/user.service';
import { PermissionService } from '../../../shared/services/permission.service';
import { DateUtil } from '../../../shared/services/date.util';

@Component({
  selector: 'app-tour-form',
  templateUrl: './tour-form.component.html',
  styleUrls: ['./tour-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class TourFormComponent implements OnInit, OnDestroy {
  // Form
  tourForm: FormGroup;
  isEditMode = false;
  tourId: string | null = null;

  // Data
  tour: Tour | null = null;
  employees: User[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Employee dropdown state
  isEmployeeDropdownOpen = false;
  employeesLoading = false;
  employeesSearchTerm = '';
  employeesPage = 1;
  employeesLimit = 30;
  employeesHasMore = true;
  employeesTotal = 0;
  filteredEmployees: User[] = [];

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private tourService: TourService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private permissionService: PermissionService,
    private elementRef: ElementRef
  ) {
    this.tourForm = this.fb.group({
      assignedTo: ['', Validators.required],
      purpose: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      location: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      expectedTime: ['', Validators.required],
      userNotes: ['', Validators.maxLength(1000)],
      adminNotes: ['', Validators.maxLength(1000)]
    });
  }

  ngOnInit(): void {
    this.checkPermissions();

    // Setup debounced search for employees
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.employeesSearchTerm = searchTerm;
        this.employeesPage = 1;
        this.loadEmployees(true);
      });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.tourId = params['id'];
        this.loadTour();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target) && this.isEmployeeDropdownOpen) {
      this.isEmployeeDropdownOpen = false;
    }
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

  canView(): boolean {
    return this.permissionService.hasPermission('tour', 'read');
  }

  // Check permissions and redirect if not allowed
  private checkPermissions(): void {
    if (this.isEditMode && !this.canEdit()) {
      console.warn('User does not have permission to edit tours');
      this.router.navigate(['/admin/tour/list']);
      return;
    }

    if (!this.isEditMode && !this.canCreate()) {
      console.warn('User does not have permission to create tours');
      this.router.navigate(['/admin/tour/list']);
      return;
    }
  }

  // Load employees for assignment with pagination and search
  loadEmployees(reset: boolean = false): void {
    if (reset) {
      this.employees = [];
      this.employeesPage = 1;
      this.employeesHasMore = true;
    }

    if (!this.employeesHasMore && !reset) {
      return;
    }

    this.employeesLoading = true;
    this.userService.getUsers({ 
      page: this.employeesPage, 
      limit: this.employeesLimit,
      search: this.employeesSearchTerm,
      sortBy: 'firstname',
      sortOrder: 'asc'
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Handle nested response structure
          const responseData = (response as any).data;
          
          // Extract users array - can be in response.data.data or response.data
          let newEmployees: User[] = [];
          if (Array.isArray(responseData?.data)) {
            newEmployees = responseData.data.filter((user: any) => user.isActive);
          } else if (Array.isArray(responseData)) {
            newEmployees = responseData.filter((user: any) => user.isActive);
          } else if (Array.isArray((response as any).data)) {
            newEmployees = (response as any).data.filter((user: any) => user.isActive);
          }
          
          if (reset) {
            this.employees = newEmployees;
          } else {
            this.employees = [...this.employees, ...newEmployees];
          }
          
          // Check if there are more employees to load
          const pagination = responseData?.pagination || (response as any).pagination;
          if (pagination) {
            this.employeesTotal = pagination.total || 0;
            this.employeesHasMore = this.employees.length < pagination.total;
          } else {
            // Fallback: if we got less than limit, assume no more
            this.employeesHasMore = newEmployees.length === this.employeesLimit;
          }
          
          this.filterEmployees();
          this.employeesLoading = false;
        },
        error: (error) => {
          console.error('Error loading employees:', error);
          this.employeesLoading = false;
          if (reset) {
            this.employees = [];
            this.filteredEmployees = [];
          }
        }
      });
  }

  // Handle employee search input
  onEmployeeSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchTerm = target?.value || '';
    this.searchSubject$.next(searchTerm);
  }

  // Handle scroll for pagination
  onEmployeeScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Load more when scrolled to 80% of the list
    if (scrollTop + clientHeight >= scrollHeight * 0.8 && !this.employeesLoading && this.employeesHasMore) {
      this.employeesPage++;
      this.loadEmployees(false);
    }
  }

  // Filter employees (server-side search, so just use all loaded)
  filterEmployees(): void {
    this.filteredEmployees = [...this.employees];
  }

  // Toggle employee dropdown
  toggleEmployeeDropdown(): void {
    this.isEmployeeDropdownOpen = !this.isEmployeeDropdownOpen;
    if (this.isEmployeeDropdownOpen && this.employees.length === 0) {
      this.employeesSearchTerm = '';
      this.loadEmployees(true);
    }
  }

  // Select employee
  selectEmployee(employee: User): void {
    this.tourForm.patchValue({ assignedTo: employee._id });
    this.isEmployeeDropdownOpen = false;
  }

  // Get selected employee display text
  getSelectedEmployeeDisplayText(): string {
    const selectedId = this.tourForm.get('assignedTo')?.value;
    if (!selectedId) {
      return 'Select an employee';
    }
    const employee = this.employees.find(emp => emp._id === selectedId);
    return employee ? `${employee.firstname} ${employee.lastname} (${employee.email})` : 'Select an employee';
  }

  // Get employee display text for dropdown
  getEmployeeDisplayText(employee: User): string {
    return `${employee.firstname} ${employee.lastname} (${employee.email})`;
  }

  // Load tour for editing
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
            this.populateForm();
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

  // Populate form with tour data
  populateForm(): void {
    if (!this.tour) return;

    // Convert UTC date from backend to IST datetime-local format for the input field
    const expectedTimeIST = DateUtil.convertDateToDateTimeLocal(this.tour.expectedTime);

    const assignedToId = this.tour.assignedTo?._id || '';
    
    this.tourForm.patchValue({
      assignedTo: assignedToId,
      purpose: this.tour.purpose,
      location: this.tour.location,
      expectedTime: expectedTimeIST,
      userNotes: this.tour.userNotes || '',
      adminNotes: this.tour.adminNotes || ''
    });

    // If we have an assigned employee, ensure it's in the employees list for display
    if (assignedToId && this.tour.assignedTo) {
      const employeeExists = this.employees.find(emp => emp._id === assignedToId);
      if (!employeeExists) {
        // Add the assigned employee to the list so it can be displayed
        this.employees = [this.tour.assignedTo as any, ...this.employees];
        this.filterEmployees();
      }
    }
  }

  // Submit form
  onSubmit(): void {
    if (this.tourForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    this.error = null;
    this.successMessage = null;

    const formData = this.tourForm.value;

    // Convert datetime-local value to IST format for backend
    const expectedTimeIST = DateUtil.convertDateTimeLocalToIST(formData.expectedTime);

    if (this.isEditMode && this.tourId) {
      // Update existing tour
      const updateData: UpdateTourDto = {
        assignedTo: formData.assignedTo,
        purpose: formData.purpose,
        location: formData.location,
        expectedTime: expectedTimeIST,
        userNotes: formData.userNotes || undefined,
        adminNotes: formData.adminNotes || undefined
      };

      this.tourService.updateTour(this.tourId, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response && response.data) {
              this.successMessage = 'Tour updated successfully!';
              setTimeout(() => {
                this.router.navigate(['/admin/tour/list']);
              }, 1500);
            } else {
              this.error = 'Failed to update tour. Please try again.';
            }
            this.saving = false;
          },
          error: (error) => {
            console.error('Error updating tour:', error);
            this.error = 'Failed to update tour. Please try again.';
            this.saving = false;
          }
        });
    } else {
      // Create new tour
      const createData: CreateTourDto = {
        assignedTo: formData.assignedTo,
        purpose: formData.purpose,
        location: formData.location,
        expectedTime: expectedTimeIST,
        userNotes: formData.userNotes || undefined,
        adminNotes: formData.adminNotes || undefined
      };

      this.tourService.createTour(createData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response && response.data) {
              this.successMessage = 'Tour created successfully!';
              setTimeout(() => {
                this.router.navigate(['/admin/tour/list']);
              }, 1500);
            } else {
              this.error = 'Failed to create tour. Please try again.';
            }
            this.saving = false;
          },
          error: (error) => {
            console.error('Error creating tour:', error);
            this.error = 'Failed to create tour. Please try again.';
            this.saving = false;
          }
        });
    }
  }

  // Cancel and go back
  onCancel(): void {
    this.router.navigate(['/admin/tour/list']);
  }

  // Mark all form controls as touched to trigger validation display
  markFormGroupTouched(): void {
    Object.keys(this.tourForm.controls).forEach(key => {
      const control = this.tourForm.get(key);
      control?.markAsTouched();
    });
  }

  // Get employee display name (kept for backward compatibility)
  getEmployeeDisplayName(employeeId: string): string {
    const employee = this.employees.find(emp => emp._id === employeeId);
    return employee ? `${employee.firstname} ${employee.lastname}` : 'Unknown Employee';
  }

  // Check if form control has error
  hasError(controlName: string, errorType: string): boolean {
    const control = this.tourForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  // Get form control error message
  getErrorMessage(controlName: string, errorType: string): string {
    const control = this.tourForm.get(controlName);
    if (!control || !control.errors) return '';

    switch (errorType) {
      case 'required':
        return 'This field is required';
      case 'minlength':
        const minLength = control.errors['minlength']?.requiredLength;
        return `Minimum length is ${minLength} characters`;
      case 'maxlength':
        const maxLength = control.errors['maxlength']?.requiredLength;
        return `Maximum length is ${maxLength} characters`;
      default:
        return 'Invalid input';
    }
  }
}
