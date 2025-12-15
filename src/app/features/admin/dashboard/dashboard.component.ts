import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardStats, RecentActivity, DepartmentStat, LeaveRequest } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, DecimalPipe]
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    newRequests: 0
  };

  recentActivities: RecentActivity[] = [];
  pendingLeaveRequests: LeaveRequest[] = [];
  attendanceByDepartment: DepartmentStat[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private dashboardService: DashboardService) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    this.error = null;

    // Load all data in parallel
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.handleError('Failed to load dashboard statistics');
      }
    });

    this.dashboardService.getRecentActivity(5).subscribe({
      next: (data) => {
        this.recentActivities = data.map(activity => ({
          ...activity,
          time: this.formatTime(activity.time)
        }));
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading recent activity:', error);
        this.handleError('Failed to load recent activity');
      }
    });

    this.dashboardService.getDepartmentStats().subscribe({
      next: (data) => {
        this.attendanceByDepartment = data;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading department stats:', error);
        this.handleError('Failed to load department statistics');
      }
    });

    this.dashboardService.getPendingLeaveRequests(5).subscribe({
      next: (data) => {
        this.pendingLeaveRequests = data.map(req => ({
          ...req,
          employee: req.userId ? `${req.userId.firstname} ${req.userId.lastname}` : 'Unknown',
          type: req.leaveType,
          startDate: this.formatDate(req.startDate),
          endDate: this.formatDate(req.endDate)
        }));
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading leave requests:', error);
        this.handleError('Failed to load leave requests');
      }
    });
  }

  private checkLoadingComplete() {
    // Simple check - in a real app, you might want to track each request separately
    if (this.stats.totalEmployees > 0 || this.recentActivities.length > 0 || 
        this.attendanceByDepartment.length > 0 || this.pendingLeaveRequests.length > 0) {
      this.isLoading = false;
    }
  }

  private handleError(message: string) {
    this.error = message;
    this.isLoading = false;
  }

  formatTime(time: string | Date): string {
    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'attendance':
        return 'fas fa-clock';
      case 'leave':
        return 'fas fa-calendar-alt';
      case 'login':
        return 'fas fa-sign-in-alt';
      case 'update':
        return 'fas fa-user-edit';
      default:
        return 'fas fa-info-circle';
    }
  }

  getActivityClass(type: string): string {
    switch (type) {
      case 'attendance':
        return 'activity-attendance';
      case 'leave':
        return 'activity-leave';
      case 'login':
        return 'activity-login';
      case 'update':
        return 'activity-update';
      default:
        return '';
    }
  }

  calculateAttendancePercentage(present: number, total: number): number {
    return total > 0 ? (present / total) * 100 : 0;
  }

  refreshData() {
    this.loadDashboardData();
  }

  trackByDepartment(index: number, item: DepartmentStat): string {
    return item.department;
  }

  trackByActivity(index: number, item: RecentActivity): string {
    return `${item.user}-${item.time}`;
  }

  trackByLeaveRequest(index: number, item: LeaveRequest): string {
    return item._id || index.toString();
  }

  getProgressClass(percentage: number): string {
    if (percentage >= 80) return 'progress-high';
    if (percentage >= 60) return 'progress-medium';
    return 'progress-low';
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'https://ui-avatars.com/api/?name=User&background=random';
    }
  }
}
