import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UserService, User, CreateUserRequest, UpdateUserRequest } from '../user.service';
import { RoleService, Role } from '../role.service';
import { StateService, State } from '../services/state.service';
import { CityService, City } from '../services/city.service';

@Component({
  selector: 'app-user-form-modal',
  templateUrl: './user-form-modal.component.html',
  styleUrls: ['./user-form-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [StateService, CityService]
})
export class UserFormModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() user: User | null = null;
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() userSaved = new EventEmitter<User>();

  userForm: FormGroup;
  roles: Role[] = [];
  states: State[] = [];
  cities: City[] = [];
  reportingStates: State[] = [];
  reportingCities: City[] = [];
  allCities: City[] = []; // Store all cities for reporting city selection
  loading = false;
  error: string | null = null;
  isEditMode = false;
  showPassword = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RoleService,
    private stateService: StateService,
    private cityService: CityService
  ) {
    this.userForm = this.fb.group({
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required],
      mobilenumber: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      addressline1: ['', Validators.required],
      addressline2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      center: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{5,6}$/)]],
      designation: [''],
      reportingState: [[]],
      reportingCity: [[]]
    });
  }

      ngOnInit(): void {
    this.loadRoles();
    this.loadStates();
    this.loadAllCities(); // Load all cities for reporting city selection
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.isEditMode = true;
      // Wait for roles to be loaded before populating
      if (this.roles.length > 0) {
        this.populateForm();
      } else {
        // Load roles first, then populate form
        this.roleService.getRoles({ limit: 100 })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.roles = response.data.filter(role => role.isActive);
              this.populateForm();
            },
            error: (error) => {
              console.error('Error loading roles:', error);
              this.error = 'Failed to load roles';
            }
          });
      }
    } else if (changes['user'] && !this.user) {
      this.isEditMode = false;
      this.userForm.reset();
      // Reset password validation for add mode
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoles(): void {
    // Load roles for both add and edit modes
    this.roleService.getRoles({ limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.roles = response.data.filter(role => role.isActive);
          // If we're in edit mode and have a user, populate the form now
          if (this.isEditMode && this.user) {
            this.populateForm();
          }
        },
        error: (error) => {
          console.error('Error loading roles:', error);
          this.error = 'Failed to load roles';
        }
      });
  }

  loadStates(): void {
    this.stateService.getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.states = response.data.sort((a: any, b: any) => a.name.localeCompare(b.name));
          this.reportingStates = [...this.states]; // Copy for reporting state selection
        },
        error: (error: any) => {
          console.error('Error loading states:', error);
          this.error = 'Failed to load states';
        }
      });
  }

  loadAllCities(): void {
    // Load cities from all states for reporting city selection
    this.stateService.getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const allStates = response.data || [];
          // Filter out states without _id
          const validStates = allStates.filter((state: any) => state && state._id);
          const cityPromises = validStates.map((state: any) => 
            this.cityService.getCitiesByState(state._id).toPromise().catch((err: any) => {
              console.warn(`Error loading cities for state ${state._id}:`, err);
              return { data: [] }; // Return empty data on error
            })
          );
          
          Promise.all(cityPromises)
            .then((cityResponses: any[]) => {
              const allCitiesList: City[] = [];
              cityResponses.forEach((cityResponse: any) => {
                if (cityResponse?.data && Array.isArray(cityResponse.data)) {
                  allCitiesList.push(...cityResponse.data);
                }
              });
              this.allCities = allCitiesList.sort((a: any, b: any) => a.name.localeCompare(b.name));
              this.reportingCities = [...this.allCities];
            })
            .catch((error: any) => {
              console.error('Error loading all cities:', error);
            });
        },
        error: (error: any) => {
          console.error('Error loading states for cities:', error);
        }
      });
  }

  loadCitiesByState(stateId: string): void {
    if (!stateId) {
      this.cities = [];
      this.userForm.patchValue({ city: '' });
      return;
    }

    this.cityService.getCitiesByState(stateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.cities = response.data.sort((a: any, b: any) => a.name.localeCompare(b.name));
          // Reset city selection when state changes
          this.userForm.patchValue({ city: '' });
        },
        error: (error: any) => {
          console.error('Error loading cities:', error);
          this.error = 'Failed to load cities';
        }
      });
  }

  onStateChange(): void {
    const selectedStateId = this.userForm.get('state')?.value;
    if (selectedStateId && typeof selectedStateId === 'string') {
      this.loadCitiesByState(selectedStateId);
    } else {
      this.cities = [];
      this.userForm.patchValue({ city: '' });
    }
  }

  populateForm(): void {
    if (this.user && this.roles.length > 0) {
      // Convert reporting state/city names to IDs for form
      const reportingStateIds: string[] = [];
      const reportingCityIds: string[] = [];
      
      if (this.user.reportingState && this.user.reportingState.length > 0 && this.states.length > 0) {
        this.user.reportingState.forEach(stateName => {
          const state = this.states.find(s => s.name === stateName);
          if (state) {
            reportingStateIds.push(state._id);
          }
        });
      }
      
      // Wait for allCities to load before populating reportingCity
      if (this.user.reportingCity && this.user.reportingCity.length > 0) {
        if (this.allCities.length > 0) {
          this.user.reportingCity.forEach(cityName => {
            const city = this.allCities.find(c => c.name === cityName);
            if (city) {
              reportingCityIds.push(city._id);
            }
          });
        } else {
          // If cities not loaded yet, wait a bit and try again
          setTimeout(() => {
            if (this.user?.reportingCity && this.allCities.length > 0) {
              const cityIds: string[] = [];
              this.user.reportingCity.forEach(cityName => {
                const city = this.allCities.find(c => c.name === cityName);
                if (city) {
                  cityIds.push(city._id);
                }
              });
              this.userForm.patchValue({ reportingCity: cityIds });
            }
          }, 500);
        }
      }

      this.userForm.patchValue({
        firstname: this.user.firstname,
        lastname: this.user.lastname,
        email: this.user.email,
        password: '', // Don't populate password for edit
        role: this.user.role,
        mobilenumber: this.user.mobilenumber,
        addressline1: this.user.addressline1,
        addressline2: this.user.addressline2,
        city: this.user.city,
        state: this.user.state,
        center: this.user.center,
        pincode: this.user.pincode,
        designation: this.user.designation || '',
        reportingState: reportingStateIds,
        reportingCity: reportingCityIds
      });

      // Make password optional for edit mode
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();

      // For edit mode, we need to find the state ID by name and load cities
      if (this.user?.state && this.states.length > 0) {
        const selectedState = this.states.find(state => state.name === this.user?.state);
        if (selectedState) {
          this.userForm.patchValue({ state: selectedState._id });
          this.loadCitiesByState(selectedState._id);
        }
      }
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      this.error = null;

      const formData = this.userForm.value;
      
      // Convert state and city IDs to names before sending to API
      const selectedState = this.states.find(state => state._id === formData.state);
      const selectedCity = this.cities.find(city => city._id === formData.city);
      
      // Convert reporting state/city IDs to names
      const reportingStateNames: string[] = [];
      if (formData.reportingState && Array.isArray(formData.reportingState)) {
        formData.reportingState.forEach((stateId: string) => {
          const state = this.states.find(s => s._id === stateId);
          if (state) {
            reportingStateNames.push(state.name);
          }
        });
      }
      
      const reportingCityNames: string[] = [];
      if (formData.reportingCity && Array.isArray(formData.reportingCity)) {
        formData.reportingCity.forEach((cityId: string) => {
          const city = this.allCities.find(c => c._id === cityId);
          if (city) {
            reportingCityNames.push(city.name);
          }
        });
      }
      
      const processedFormData = {
        ...formData,
        state: selectedState ? selectedState.name : formData.state,
        city: selectedCity ? selectedCity.name : formData.city,
        reportingState: reportingStateNames,
        reportingCity: reportingCityNames
      };

      if (this.isEditMode && this.user) {
        // Update user
        const updateData: UpdateUserRequest = { ...processedFormData };
        if (!updateData.password) {
          delete updateData.password;
        }

        this.userService.updateUser(this.user._id, updateData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.loading = false;
              this.userSaved.emit(response.data || this.user);
              this.closeModal.emit();
            },
            error: (error) => {
              this.loading = false;
              this.error = 'Failed to update user. Please try again.';
              console.error('Error updating user:', error);
            }
          });
      } else {
        // Create user
        const createData: CreateUserRequest = processedFormData;

        this.userService.createUser(createData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.loading = false;
              this.userSaved.emit(response.data);
              this.closeModal.emit();
            },
            error: (error) => {
              this.loading = false;
              this.error = 'Failed to create user. Please try again.';
              console.error('Error creating user:', error);
            }
          });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  onClose(): void {
    this.userForm.reset();
    this.error = null;
    this.closeModal.emit();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) return `Please enter a valid ${this.getFieldLabel(fieldName).toLowerCase()}`;
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstname: 'First Name',
      lastname: 'Last Name',
      email: 'Email',
      password: 'Password',
      role: 'Role',
      mobilenumber: 'Mobile Number',
      addressline1: 'Address Line 1',
      addressline2: 'Address Line 2',
      city: 'City',
      state: 'State',
      center: 'Center',
      pincode: 'Pincode',
      designation: 'Designation'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
}
