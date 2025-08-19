import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TourService, Tour, CreateTourDto, UpdateTourDto } from '../services/tour.service';
import { UserService, User } from '../../admin/user-list/user.service';

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

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private tourService: TourService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
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
    this.loadEmployees();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.tourId = params['id'];
        this.loadTour();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load employees for assignment
  loadEmployees(): void {
    this.userService.getUsers({ limit: 100, sortBy: 'firstname', sortOrder: 'asc' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            this.employees = response.data.filter(user => user.isActive);
          }
        },
        error: (error) => {
          console.error('Error loading employees:', error);
          this.error = 'Failed to load employees. Please try again.';
        }
      });
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

    this.tourForm.patchValue({
      assignedTo: this.tour.assignedTo?._id || '', // Safely handle null assignedTo
      purpose: this.tour.purpose,
      location: this.tour.location,
      expectedTime: new Date(this.tour.expectedTime).toISOString().slice(0, 16),
      userNotes: this.tour.userNotes || '',
      adminNotes: this.tour.adminNotes || ''
    });
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

    if (this.isEditMode && this.tourId) {
      // Update existing tour
      const updateData: UpdateTourDto = {
        assignedTo: formData.assignedTo,
        purpose: formData.purpose,
        location: formData.location,
        expectedTime: formData.expectedTime,
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
        expectedTime: formData.expectedTime,
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

  // Get employee display name
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
