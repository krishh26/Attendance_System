import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UserService, User, CreateUserRequest, UpdateUserRequest } from '../user.service';
import { RoleService, Role } from '../role.service';

@Component({
  selector: 'app-user-form-modal',
  templateUrl: './user-form-modal.component.html',
  styleUrls: ['./user-form-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class UserFormModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() user: User | null = null;
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() userSaved = new EventEmitter<User>();

  userForm: FormGroup;
  roles: Role[] = [];
  loading = false;
  error: string | null = null;
  isEditMode = false;
  showPassword = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RoleService
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
      pincode: ['', [Validators.required, Validators.pattern(/^\d{5,6}$/)]]
    });
  }

      ngOnInit(): void {
    this.loadRoles();
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

  populateForm(): void {
    if (this.user && this.roles.length > 0) {
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
        pincode: this.user.pincode
      });

      // Make password optional for edit mode
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      this.error = null;

      const formData = this.userForm.value;

      if (this.isEditMode && this.user) {
        // Update user
        const updateData: UpdateUserRequest = { ...formData };
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
        const createData: CreateUserRequest = formData;

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
      pincode: 'Pincode'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
}
