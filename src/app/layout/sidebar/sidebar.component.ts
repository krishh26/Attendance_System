import { Component, Input, Output, EventEmitter, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../shared/services/permission.service';
import { AuthService } from '../../features/auth/services/auth.service';

interface MenuItem {
  title: string;
  icon: string;
  route: string;
  permission?: string; // Format: 'module:action' for list permission
  submenu?: SubMenuItem[];
}

interface SubMenuItem {
  title: string;
  route: string;
  permission?: string; // Format: 'module:action' for list permission
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isCollapsed = false;
  @Input() isMobileOpen = false;
  @Output() mobileClose = new EventEmitter<void>();

  allMenuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      route: '/admin/dashboard'
    },
    {
      title: 'Employees',
      icon: 'fas fa-users',
      route: '/admin/user-list',
      permission: 'users:list'
    },
    {
      title: 'Leave Management',
      icon: 'fas fa-calendar-alt',
      route: '/admin/leave/list',
      permission: 'leave:list'
    },
    {
      title: 'Time Logs',
      icon: 'fas fa-clock',
      route: '/admin/timelog/list',
      permission: 'timelog:list'
    },
    {
      title: 'Roles & Permissions',
      icon: 'fas fa-user-shield',
      route: '/admin/roles/list',
      permission: 'roles:list',
      // submenu: [
      //   {
      //     title: 'Roles',
      //     route: '/admin/roles/list',
      //     permission: 'roles:list'
      //   }
      // ]
    },
    {
      title: 'Holidays',
      icon: 'fas fa-calendar-day',
      route: '/admin/holiday/list',
      permission: 'holiday:list'
    },
    {
      title: 'Employee Tours',
      icon: 'fas fa-map-marked-alt',
      route: '/admin/tour/list',
      permission: 'tour:list'
    }
  ];

  menuItems: MenuItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private permissionService: PermissionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('SidebarComponent: ngOnInit called');
    this.filterMenuItems();

    // Listen for auth changes to refresh permissions
    if (this.authService.authStateChanged$) {
      console.log('SidebarComponent: Subscribing to auth state changes');
      this.authService.authStateChanged$
        .pipe(takeUntil(this.destroy$))
        .subscribe((user) => {
          console.log('SidebarComponent: Auth state changed, user:', user);
          this.filterMenuItems();
        });
    } else {
      console.error('SidebarComponent: authStateChanged$ is undefined!');
    }

    // Listen for permission changes
    if (this.permissionService.permissionsChanged$) {
      console.log('SidebarComponent: Subscribing to permission changes');
      this.permissionService.permissionsChanged$
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          console.log('SidebarComponent: Permission changed, refreshing menu');
          this.filterMenuItems();
        });
    } else {
      console.error('SidebarComponent: permissionsChanged$ is undefined!');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private filterMenuItems() {
    console.log('SidebarComponent: Filtering menu items based on permissions...');

    const user = this.authService.getUser();
    console.log('SidebarComponent: Current user:', user);
    console.log('SidebarComponent: User isSuperAdmin:', user?.isSuperAdmin);

    // If user is super admin, show all menu items
    if (user?.isSuperAdmin) {
      console.log('SidebarComponent: User is Super Admin - showing all menu items');
      this.menuItems = [...this.allMenuItems];
      console.log(`SidebarComponent: Super admin: ${this.menuItems.length}/${this.allMenuItems.length} menu items visible`);
      console.log('SidebarComponent: Visible menu items:', this.menuItems.map(item => item.title));
      return;
    }

    // If no user, show no menu items
    if (!user) {
      console.log('SidebarComponent: No user found - showing no menu items');
      this.menuItems = [];
      return;
    }

    this.menuItems = this.allMenuItems.filter(item => {
      // If no permission required, always show
      if (!item.permission) {
        console.log(`SidebarComponent: Menu item "${item.title}" - No permission required, showing`);
        return true;
      }

      // Check if user has permission to list this module
      const [module, action] = item.permission.split(':');
      const hasPermission = this.permissionService.hasPermission(module, action);

      console.log(`SidebarComponent: Menu item "${item.title}" - Permission ${item.permission}: ${hasPermission ? 'GRANTED' : 'DENIED'}`);

      // If item has submenu, also check submenu permissions
      if (item.submenu) {
        const visibleSubmenuItems = item.submenu.filter(subItem => {
          if (!subItem.permission) return true;
          const [subModule, subAction] = subItem.permission.split(':');
          return this.permissionService.hasPermission(subModule, subAction);
        });

        // Only show menu item if it has visible submenu items or user has permission for main item
        const shouldShow = hasPermission || visibleSubmenuItems.length > 0;
        console.log(`SidebarComponent: Menu item "${item.title}" with submenu - ${shouldShow ? 'SHOWING' : 'HIDING'} (${visibleSubmenuItems.length} visible submenu items)`);
        return shouldShow;
      }

      return hasPermission;
    });

    console.log(`SidebarComponent: Filtered menu items: ${this.menuItems.length}/${this.allMenuItems.length} visible`);
    console.log('SidebarComponent: Visible menu items:', this.menuItems.map(item => item.title));
  }

  /**
   * Manually refresh permissions and menu items
   */
  refreshPermissions(): void {
    console.log('SidebarComponent: Manually refreshing sidebar permissions...');
    this.filterMenuItems();
  }

  /**
   * Force refresh the sidebar (useful for debugging)
   */
  forceRefresh(): void {
    console.log('SidebarComponent: Force refreshing sidebar...');
    const user = this.authService.getUser();
    console.log('SidebarComponent: Current user:', user);
    console.log('SidebarComponent: Is super admin:', user?.isSuperAdmin);
    this.filterMenuItems();
  }

  /**
   * Manually refresh auth state and sidebar
   */
  refreshAuthAndSidebar(): void {
    console.log('SidebarComponent: Refreshing auth state and sidebar...');
    this.authService.refreshAuthState();
    // Give it a moment to update, then refresh sidebar
    setTimeout(() => {
      this.filterMenuItems();
    }, 100);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth > 768 && this.isMobileOpen) {
      this.mobileClose.emit();
    }
  }

  onMobileItemClick() {
    if (window.innerWidth <= 768) {
      this.mobileClose.emit();
    }
  }

  /**
   * Logout user and redirect to login page
   */
  logout(): void {
    console.log('SidebarComponent: Logging out user');
    this.authService.logout();
  }
}
