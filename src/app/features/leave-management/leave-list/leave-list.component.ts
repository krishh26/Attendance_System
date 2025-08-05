import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface LeaveRequest {
  id: number;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
}

@Component({
  selector: 'app-leave-list',
  templateUrl: './leave-list.component.html',
  styleUrls: ['./leave-list.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class LeaveListComponent {
  leaveRequests: LeaveRequest[] = [
    {
      id: 1,
      employeeName: 'John Doe',
      leaveType: 'Annual Leave',
      startDate: '2024-03-15',
      endDate: '2024-03-18',
      status: 'Pending',
      reason: 'Family vacation'
    },
    {
      id: 2,
      employeeName: 'Jane Smith',
      leaveType: 'Sick Leave',
      startDate: '2024-03-10',
      endDate: '2024-03-11',
      status: 'Approved',
      reason: 'Medical appointment'
    },
    {
      id: 3,
      employeeName: 'Mike Johnson',
      leaveType: 'Personal Leave',
      startDate: '2024-03-20',
      endDate: '2024-03-20',
      status: 'Rejected',
      reason: 'Personal errands'
    }
  ];

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }
}
