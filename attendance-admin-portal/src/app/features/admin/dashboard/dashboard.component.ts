import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  newRequests: number;
}

interface RecentActivity {
  id: number;
  user: string;
  action: string;
  time: string;
  type: 'attendance' | 'leave' | 'login' | 'update';
  userAvatar: string;
}

interface LeaveRequest {
  id: number;
  employee: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class DashboardComponent {
  // Initialize stats directly
  stats: DashboardStats = {
    totalEmployees: 150,
    presentToday: 135,
    onLeave: 8,
    newRequests: 5
  };

  recentActivities: RecentActivity[] = [
    {
      id: 1,
      user: 'John Doe',
      action: 'marked attendance',
      time: '5 minutes ago',
      type: 'attendance',
      userAvatar: 'https://ui-avatars.com/api/?name=John+Doe'
    },
    {
      id: 2,
      user: 'Jane Smith',
      action: 'requested leave',
      time: '10 minutes ago',
      type: 'leave',
      userAvatar: 'https://ui-avatars.com/api/?name=Jane+Smith'
    },
    {
      id: 3,
      user: 'Mike Johnson',
      action: 'logged in',
      time: '15 minutes ago',
      type: 'login',
      userAvatar: 'https://ui-avatars.com/api/?name=Mike+Johnson'
    },
    {
      id: 4,
      user: 'Sarah Williams',
      action: 'updated profile',
      time: '20 minutes ago',
      type: 'update',
      userAvatar: 'https://ui-avatars.com/api/?name=Sarah+Williams'
    }
  ];

  pendingLeaveRequests: LeaveRequest[] = [
    {
      id: 1,
      employee: 'John Doe',
      type: 'Sick Leave',
      startDate: '2024-03-20',
      endDate: '2024-03-21',
      status: 'Pending'
    },
    {
      id: 2,
      employee: 'Jane Smith',
      type: 'Vacation',
      startDate: '2024-03-25',
      endDate: '2024-03-28',
      status: 'Pending'
    },
    {
      id: 3,
      employee: 'Mike Johnson',
      type: 'Personal Leave',
      startDate: '2024-03-22',
      endDate: '2024-03-22',
      status: 'Pending'
    }
  ];

  attendanceByDepartment = [
    { department: 'IT', present: 45, total: 50 },
    { department: 'HR', present: 15, total: 18 },
    { department: 'Finance', present: 25, total: 30 },
    { department: 'Marketing', present: 30, total: 35 },
    { department: 'Operations', present: 20, total: 25 }
  ];

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
    return (present / total) * 100;
  }
}
