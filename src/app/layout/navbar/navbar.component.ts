import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, User } from '../../features/auth/services/auth.service';
import { PermissionService } from '../../shared/services/permission.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleMobileSidebar = new EventEmitter<void>();

  user: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}

  ngOnInit() {
    console.log('NavbarComponent: ngOnInit called');
    this.user = this.authService.getUser();
    console.log('NavbarComponent: Initial user:', this.user);
    console.log('NavbarComponent: User isSuperAdmin:', this.user?.isSuperAdmin);

    // Listen for auth state changes
    if (this.authService.authStateChanged$) {
      console.log('NavbarComponent: Subscribing to auth state changes');
      this.authService.authStateChanged$
        .pipe(takeUntil(this.destroy$))
        .subscribe((user) => {
          console.log('NavbarComponent: Auth state changed, user:', user);
          this.user = user;
        });
    } else {
      console.error('NavbarComponent: authStateChanged$ is undefined!');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleSidebar() {
    if (window.innerWidth <= 768) {
      this.toggleMobileSidebar.emit();
    } else {
      this.toggleSidebar.emit();
    }
  }

  logout() {
    this.authService.logout();
  }

  getFullName(): string {
    if (this.user) {
      return `${this.user.firstname} ${this.user.lastname}`.trim();
    }
    return 'User';
  }

  getRoleName(): string {
    if (this.user?.role) {
      return this.user.role.displayName;
    }
    return 'No Role';
  }

  showPermissions(): void {
    console.log('NavbarComponent: Showing permissions for user:', this.user);
    this.permissionService.logUserPermissions();
    const user = this.authService.getUser();
    const isSuperAdmin = user?.isSuperAdmin || false;
    const message = `User: ${this.getFullName()}\nRole: ${this.getRoleName()}\nSuper Admin: ${isSuperAdmin ? 'YES' : 'NO'}\n\nPermissions:\n${this.permissionService.getPermissionSummary()}`;
    alert(message);
  }

  /**
   * Show current user's super admin status
   */
  showSuperAdminStatus(): void {
    const user = this.authService.getUser();
    const isSuperAdmin = user?.isSuperAdmin || false;
    const message = `Super Admin Status: ${isSuperAdmin ? 'YES' : 'NO'}\n\nUser: ${this.getFullName()}\nRole: ${this.getRoleName()}\n\nThis user ${isSuperAdmin ? 'has' : 'does not have'} full access to all modules.`;
    alert(message);
  }

  /**
   * Manually refresh auth state (useful for debugging)
   */
  refreshAuthState(): void {
    console.log('NavbarComponent: Manually refreshing auth state');
    this.authService.refreshAuthState();
  }
}
