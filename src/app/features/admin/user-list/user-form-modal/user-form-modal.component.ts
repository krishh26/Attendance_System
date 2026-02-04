import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { NgSelectModule } from '@ng-select/ng-select';
import { UserService, User, CreateUserRequest, UpdateUserRequest } from '../user.service';
import { RoleService, Role } from '../role.service';
import { StateService, State } from '../services/state.service';
import { CityService, City } from '../services/city.service';
import { STATE_MAHARASHTRA, DISTRICTS, getTalukasForDistrict } from '../../../../shared/constants/location.constants';

@Component({
  selector: 'app-user-form-modal',
  templateUrl: './user-form-modal.component.html',
  styleUrls: ['./user-form-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
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
  allCities: City[] = [];
  // Static location for main state/city/center (Maharashtra)
  readonly stateOptions = [STATE_MAHARASHTRA];
  readonly districts = DISTRICTS;
  talukas: string[] = [];
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
      // Wait for all necessary data to be loaded before populating
      this.ensureDataLoaded();
    } else if (changes['user'] && !this.user) {
      this.isEditMode = false;
      this.userForm.reset();
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.userForm.get('password')?.updateValueAndValidity();
      this.talukas = [];
      this.userForm.patchValue({
        state: STATE_MAHARASHTRA,
        reportingState: [],
        reportingCity: []
      });
    }
  }

  private ensureDataLoaded(): void {
    const observables: any[] = [];

    // Ensure roles are loaded
    if (this.roles.length === 0) {
      observables.push(
        this.roleService.getRoles({ limit: 100 })
          .pipe(
            takeUntil(this.destroy$),
            map((response: any) => {
              this.roles = response.data.filter((role: Role) => role.isActive);
              return true;
            }),
            catchError((error: any) => {
              console.error('Error loading roles:', error);
              this.error = 'Failed to load roles';
              return of(false);
            })
          )
      );
    } else {
      observables.push(of(true));
    }

    // Ensure states are loaded
    if (this.states.length === 0) {
      observables.push(
        this.stateService.getStates()
          .pipe(
            takeUntil(this.destroy$),
            map((response: any) => {
              this.states = response.data.sort((a: any, b: any) => a.name.localeCompare(b.name));
              this.reportingStates = [...this.states];
              return this.states;
            }),
            catchError((error: any) => {
              console.error('Error loading states:', error);
              this.error = 'Failed to load states';
              return of([]);
            })
          )
      );
    } else {
      observables.push(of(this.states));
    }

    // Ensure all cities are loaded for reporting city selection
    if (this.allCities.length === 0) {
      observables.push(
        this.stateService.getStates()
          .pipe(
            takeUntil(this.destroy$),
            map((response: any) => {
              const allStates = response.data || [];
              return allStates.filter((state: any) => state && state._id);
            }),
            catchError((error: any) => {
              console.error('Error loading states for cities:', error);
              return of([]);
            })
          )
      );
    } else {
      observables.push(of([]));
    }

    // Execute all observables
    forkJoin(observables)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([rolesLoaded, statesData, allStatesForCities]: any[]) => {
          // Load all cities if needed
          if (this.allCities.length === 0 && Array.isArray(allStatesForCities) && allStatesForCities.length > 0) {
            const cityObservables = allStatesForCities.map((state: any) =>
              this.cityService.getCitiesByState(state._id)
                .pipe(
                  takeUntil(this.destroy$),
                  map((response: any) => response.data || []),
                  catchError((err: any) => {
                    console.warn(`Error loading cities for state ${state._id}:`, err);
                    return of([]);
                  })
                )
            );

            forkJoin(cityObservables)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (cityResponses: any[]) => {
                  const allCitiesList: City[] = [];
                  cityResponses.forEach((cities: City[]) => {
                    if (Array.isArray(cities)) {
                      allCitiesList.push(...cities);
                    }
                  });
                  this.allCities = allCitiesList.sort((a: any, b: any) => a.name.localeCompare(b.name));
                  this.reportingCities = [...this.allCities];
                  // Now populate the form
                  this.populateForm();
                },
                error: (error: any) => {
                  console.error('Error loading all cities:', error);
                  // Still try to populate form even if cities fail
                  this.populateForm();
                }
              });
          } else {
            // Data already loaded, populate form
            this.populateForm();
          }
        },
        error: (error: any) => {
          console.error('Error loading data:', error);
          // Still try to populate form
          this.populateForm();
        }
      });
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
          this.reportingStates = [...this.states];
        },
        error: (error: any) => {
          console.error('Error loading states:', error);
          this.error = 'Failed to load states';
        }
      });
  }

  onCityChange(): void {
    const district = this.userForm.get('city')?.value;
    this.talukas = district ? getTalukasForDistrict(district) : [];
    if (!this.isEditMode) {
      this.userForm.patchValue({ center: '' });
    }
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

  onStateChange(): void {
    if (!this.userForm.get('state')?.value) {
      this.userForm.patchValue({ city: '', center: '' });
      this.talukas = [];
    }
  }

  populateForm(): void {
    if (this.user && this.roles.length > 0) {
      // Extract role ID (role can be object or string)
      const roleId = typeof this.user.role === 'object' && this.user.role?._id 
        ? this.user.role._id 
        : this.user.role;

      // Convert reporting state names to IDs for form
      const reportingStateIds: string[] = [];
      if (this.user.reportingState && this.user.reportingState.length > 0 && this.states.length > 0) {
        this.user.reportingState.forEach(stateName => {
          const state = this.states.find(s => s.name === stateName);
          if (state) {
            reportingStateIds.push(state._id);
          }
        });
      }

      // Convert reporting city names to IDs for form
      const populateReportingCities = () => {
        const reportingCityIds: string[] = [];
        if (this.user?.reportingCity && this.user.reportingCity.length > 0 && this.allCities.length > 0) {
          this.user.reportingCity.forEach(cityName => {
            const city = this.allCities.find(c => c.name === cityName);
            if (city) {
              reportingCityIds.push(city._id);
            }
          });
        }
        return reportingCityIds;
      };

      // Main state/city/center use static Maharashtra data (names)
      const stateName = this.user?.state || STATE_MAHARASHTRA;
      const cityName = this.user?.city || '';
      const centerName = this.user?.center || '';
      this.talukas = cityName ? getTalukasForDistrict(cityName) : [];

      this.userForm.patchValue({
        firstname: this.user.firstname || '',
        lastname: this.user.lastname || '',
        email: this.user.email || '',
        password: '',
        role: roleId || '',
        mobilenumber: this.user.mobilenumber || '',
        addressline1: this.user.addressline1 || '',
        addressline2: this.user.addressline2 || '',
        state: stateName,
        city: cityName,
        center: centerName,
        pincode: this.user.pincode || '',
        designation: this.user.designation || '',
        reportingState: reportingStateIds
      });

      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();

      const reportingCityIds = populateReportingCities();
      if (reportingCityIds.length > 0) {
        this.userForm.patchValue({ reportingCity: reportingCityIds });
      }
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      this.error = null;

      const formData = this.userForm.value;

      // Main state/city/center are already names (Maharashtra, district, taluka)
      const reportingStateNames: string[] = [];
      if (formData.reportingState && Array.isArray(formData.reportingState) && formData.reportingState.length > 0) {
        formData.reportingState.forEach((stateId: string) => {
          if (stateId) {
            const state = this.states.find(s => s._id === stateId);
            if (state) {
              reportingStateNames.push(state.name);
            }
          }
        });
      }

      const reportingCityNames: string[] = [];
      if (formData.reportingCity && Array.isArray(formData.reportingCity) && formData.reportingCity.length > 0) {
        formData.reportingCity.forEach((cityId: string) => {
          if (cityId) {
            const city = this.allCities.find(c => c._id === cityId);
            if (city) {
              reportingCityNames.push(city.name);
            }
          }
        });
      }

      const processedFormData = {
        ...formData,
        state: formData.state,
        city: formData.city,
        center: formData.center,
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

  getSelectedCount(fieldName: string): number {
    const field = this.userForm.get(fieldName);
    const value = field?.value;
    if (Array.isArray(value) && value.length > 0) {
      return value.length;
    }
    return 0;
  }

  getSelectedItems(fieldName: string, items: any[]): string {
    const field = this.userForm.get(fieldName);
    const value = field?.value;
    if (Array.isArray(value) && value.length > 0 && items.length > 0) {
      const selected = items.filter(item => value.includes(item._id));
      if (selected.length <= 3) {
        return selected.map(item => item.name).join(', ');
      }
      return `${selected.slice(0, 3).map(item => item.name).join(', ')} and ${selected.length - 3} more`;
    }
    return 'None selected';
  }
}
