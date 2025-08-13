import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { UserService, User } from '../user.service';
import { RoleService, Role } from '../role.service';

@Component({
  selector: 'app-user-details-modal',
  templateUrl: './user-details-modal.component.html',
  styleUrls: ['./user-details-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class UserDetailsModalComponent implements OnInit, OnDestroy {
  @Input() userId: string | null = null;
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();

  user: User | null = null;
  role: Role | null = null;
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    if (this.userId && this.isOpen) {
      this.loadUserDetails();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserDetails(): void {
    if (!this.userId) return;

    this.loading = true;
    this.error = null;

    this.userService.getUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.user = response.data;
          this.loading = false;

          // Load role details if user has a role
          if (this.user?.role) {
            this.loadRoleDetails(this.user.role);
          }
        },
        error: (error) => {
          this.error = 'Failed to load user details. Please try again.';
          this.loading = false;
          console.error('Error loading user details:', error);
        }
      });
  }

  loadRoleDetails(roleId: string): void {
    this.roleService.getRoles({ limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.role = response.data.find(role => role._id === roleId) || null;
        },
        error: (error) => {
          console.error('Error loading role details:', error);
        }
      });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  getFullName(): string {
    if (!this.user) return '';
    return `${this.user.firstname} ${this.user.lastname}`.trim();
  }

  getProfileImage(): string {
    const name = this.getFullName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
