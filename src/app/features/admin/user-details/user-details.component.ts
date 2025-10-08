import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService, User } from '../user-list/user.service';
import { RoleService, Role } from '../user-list/role.service';

// Original interface - commented out but kept for reference
/*
interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
  profileImage: string;
  phone: string;
  address: string;
  emergencyContact: string;
  skills: string[];
  recentActivity: {
    type: string;
    date: string;
    description: string;
  }[];
}
*/

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  userId!: string;
  user: User | null = null;
  role: Role | null = null;
  loading = false;
  error: string | null = null;

  // Original mock data - commented out but kept for reference
  /*
  user: UserDetail = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    department: 'IT',
    joinDate: '2023-01-15',
    status: 'Active',
    profileImage: 'https://ui-avatars.com/api/?name=John+Doe',
    phone: '+1 234 567 890',
    address: '123 Main St, City, Country',
    emergencyContact: 'Jane Doe (+1 234 567 891)',
    skills: ['JavaScript', 'Angular', 'Node.js', 'SQL', 'Project Management'],
    recentActivity: [
      {
        type: 'login',
        date: '2024-03-15 09:00',
        description: 'Logged in to the system'
      },
      {
        type: 'update',
        date: '2024-03-14 15:30',
        description: 'Updated profile information'
      },
      {
        type: 'leave',
        date: '2024-03-13 11:20',
        description: 'Submitted leave request'
      }
    ]
  };
  */

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private roleService: RoleService
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUserDetails();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserDetails() {
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

  loadRoleDetails(roleId: string) {
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

  goBack() {
    this.router.navigate(['/admin/user-list']);
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
    console.log('isActive', isActive);
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

  getActivityIcon(type: string): string {
    switch (type) {
      case 'login':
        return 'fas fa-sign-in-alt';
      case 'update':
        return 'fas fa-edit';
      case 'leave':
        return 'fas fa-calendar-alt';
      default:
        return 'fas fa-info-circle';
    }
  }
}
