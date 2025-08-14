import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LeaveRequest, LeaveListResponse } from './leave.service';

@Injectable({
  providedIn: 'root'
})
export class DemoLeaveService {
  private demoLeaveRequests: LeaveRequest[] = [
    {
      _id: 'demo-1',
      userId: '64f8a1b2c3d4e5f6a7b8c9d0',
      leaveType: 'annual',
      startDate: '2024-03-15T00:00:00.000Z',
      endDate: '2024-03-18T00:00:00.000Z',
      reason: 'Family vacation',
      status: 'pending',
      isHalfDay: false,
      halfDayType: null,
      totalDays: 4,
      notes: 'Annual family vacation',
      createdAt: '2024-03-10T10:00:00.000Z',
      updatedAt: '2024-03-10T10:00:00.000Z'
    },
    {
      _id: 'demo-2',
      userId: '64f8a1b2c3d4e5f6a7b8c9d1',
      leaveType: 'sick',
      startDate: '2024-03-12T00:00:00.000Z',
      endDate: '2024-03-13T00:00:00.000Z',
      reason: 'Medical appointment',
      status: 'approved',
      isHalfDay: false,
      halfDayType: null,
      totalDays: 2,
      notes: 'Approved by manager',
      createdAt: '2024-03-11T09:00:00.000Z',
      updatedAt: '2024-03-11T14:00:00.000Z',
      approvedAt: '2024-03-11T14:00:00.000Z',
      approvedBy: '64f8a1b2c3d4e5f6a7b8c9d2'
    },
    {
      _id: 'demo-3',
      userId: '64f8a1b2c3d4e5f6a7b8c9d3',
      leaveType: 'casual',
      startDate: '2024-03-20T00:00:00.000Z',
      endDate: '2024-03-20T00:00:00.000Z',
      reason: 'Personal errands',
      status: 'rejected',
      isHalfDay: true,
      halfDayType: 'morning',
      totalDays: 0.5,
      notes: 'Rejected due to workload',
      createdAt: '2024-03-15T11:00:00.000Z',
      updatedAt: '2024-03-15T16:00:00.000Z',
      approvedAt: '2024-03-15T16:00:00.000Z',
      approvedBy: '64f8a1b2c3d4e5f6a7b8c9d2'
    },
    {
      _id: 'demo-4',
      userId: '64f8a1b2c3d4e5f6a7b8c9d4',
      leaveType: 'full-day',
      startDate: '2024-03-25T00:00:00.000Z',
      endDate: '2024-03-26T00:00:00.000Z',
      reason: 'Training workshop',
      status: 'approved',
      isHalfDay: false,
      halfDayType: null,
      totalDays: 2,
      notes: 'Approved for professional development',
      createdAt: '2024-03-18T13:00:00.000Z',
      updatedAt: '2024-03-18T15:00:00.000Z',
      approvedAt: '2024-03-18T15:00:00.000Z',
      approvedBy: '64f8a1b2c3d4e5f6a7b8c9d2'
    },
    {
      _id: 'demo-5',
      userId: '64f8a1b2c3d4e5f6a7b8c9d5',
      leaveType: 'other',
      startDate: '2024-03-30T00:00:00.000Z',
      endDate: '2024-03-30T00:00:00.000Z',
      reason: 'Wedding ceremony',
      status: 'pending',
      isHalfDay: true,
      halfDayType: 'afternoon',
      totalDays: 0.5,
      notes: 'Afternoon wedding ceremony',
      createdAt: '2024-03-22T10:00:00.000Z',
      updatedAt: '2024-03-22T10:00:00.000Z'
    }
  ];

  getDemoLeaveRequests(page: number = 1, limit: number = 10): LeaveListResponse {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = this.demoLeaveRequests.slice(startIndex, endIndex);
    const total = this.demoLeaveRequests.length;
    const totalPages = Math.ceil(total / limit);

    return {
      code: 200,
      status: 'OK',
      data: {
        code: 200,
        status: 'OK',
        data: paginatedData,
        timestamp: new Date().toISOString(),
        path: '/api/leave-management/leave-requests'
      },
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      timestamp: new Date().toISOString(),
      path: `/api/leave-management/leave-requests?page=${page}&limit=${limit}`
    };
  }

  // Simulate API delay
  private simulateApiDelay<T>(data: T): Observable<T> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(data);
        observer.complete();
      }, Math.random() * 1000 + 500); // Random delay between 500ms and 1500ms
    });
  }

  // Get leave requests with demo data
  getLeaveRequests(params: any = {}): Observable<LeaveListResponse> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    
    console.log('Demo Leave Service: Using demo data for leave requests');
    return this.simulateApiDelay(this.getDemoLeaveRequests(page, limit));
  }
}
