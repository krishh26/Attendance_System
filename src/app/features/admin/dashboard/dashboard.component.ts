import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
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

    forkJoin({
      stats: this.dashboardService.getStats(),
      recentActivities: this.dashboardService.getRecentActivity(5),
      departmentStats: this.dashboardService.getDepartmentStats(),
      leaveRequests: this.dashboardService.getPendingLeaveRequests(5)
    }).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (data) => {
        // Stats
        this.stats = data.stats;

        // Recent Activity
        this.recentActivities = data.recentActivities.map(activity => ({
          ...activity,
          time: this.formatTime(activity.time)
        }));

        // Department Stats
        this.attendanceByDepartment = data.departmentStats;

        // Leave Requests
        this.pendingLeaveRequests = data.leaveRequests.map(req => ({
          ...req,
          employee: req.userId ? `${req.userId.firstname} ${req.userId.lastname}` : 'Unknown',
          type: req.leaveType,
          startDate: this.formatDate(req.startDate),
          endDate: this.formatDate(req.endDate)
        }));
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.handleError('Failed to load dashboard data. Please try again.');
        this.isLoading = false;
      }
    });
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

  approveLeave(id: string) {
    if (confirm('Are you sure you want to approve this leave request?')) {
      this.dashboardService.updateLeaveStatus(id, 'approved').subscribe({
        next: () => {
          // Remove from list
          this.pendingLeaveRequests = this.pendingLeaveRequests.filter(req => req._id !== id);
          // Update stats locally
          this.stats.newRequests--;
        },
        error: (error) => {
          console.error('Error approving leave:', error);
          alert('Failed to approve leave request. Please try again.');
        }
      });
    }
  }

  rejectLeave(id: string) {
    if (confirm('Are you sure you want to reject this leave request?')) {
      this.dashboardService.updateLeaveStatus(id, 'rejected').subscribe({
        next: () => {
          // Remove from list
          this.pendingLeaveRequests = this.pendingLeaveRequests.filter(req => req._id !== id);
          // Update stats locally
          this.stats.newRequests--;
        },
        error: (error) => {
          console.error('Error rejecting leave:', error);
          alert('Failed to reject leave request. Please try again.');
        }
      });
    }
  }
}
