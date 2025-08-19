import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Input() isMobileOpen = false;
  @Output() mobileClose = new EventEmitter<void>();

  menuItems = [
    {
      title: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      route: '/admin/dashboard'
    },
    {
      title: 'Employees',
      icon: 'fas fa-users',
      route: '/admin/user-list'
    },
    {
      title: 'Leave Management',
      icon: 'fas fa-calendar-alt',
      route: '/admin/leave/list'
    },
    {
      title: 'Time Logs',
      icon: 'fas fa-clock',
      route: '/admin/timelog/list'
    },
    {
      title: 'Roles & Permissions',
      icon: 'fas fa-user-shield',
      route: '/admin/roles/list'
    },
    {
      title: 'Holidays',
      icon: 'fas fa-calendar-day',
      route: '/admin/holiday/list'
    },
    {
      title: 'Employee Tours',
      icon: 'fas fa-map-marked-alt',
      route: '/admin/tour/list'
    }
  ];

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
}
