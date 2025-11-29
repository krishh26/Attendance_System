import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { DemoLeaveService } from './demo-leave.service';

// Leave Request Interface based on API response
export interface LeaveRequest {
  _id: string;
  userId: string | any;
  leaveType: 'full-day' | 'half-day' | 'sick' | 'casual' | 'annual' | 'other';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  isHalfDay: boolean;
  halfDayType: 'morning' | 'afternoon' | null;
  totalDays: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string | null;
}

// API Response Interface
export interface LeaveListResponse {
  code: number;
  status: string;
  data: {
    code: number;
    status: string;
    data: LeaveRequest[];
    timestamp: string;
    path: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
  path: string;
}

// Query Parameters Interface
export interface LeaveListParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  leaveType?: 'full-day' | 'half-day' | 'sick' | 'casual' | 'annual' | 'other';
  userId?: string;
  startDate?: string;
  endDate?: string;
  isHalfDay?: boolean;
  approvedBy?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  constructor(
    private apiService: ApiService,
    private demoLeaveService: DemoLeaveService
  ) {}

  // Get leave requests with filters
  getLeaveRequests(params: LeaveListParams = {}): Observable<LeaveListResponse> {
    let endpoint = '/leave-management/leave-requests';

    // Build query string
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.leaveType) queryParams.append('leaveType', params.leaveType);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.isHalfDay !== undefined) queryParams.append('isHalfDay', params.isHalfDay.toString());
    if (params.approvedBy) queryParams.append('approvedBy', params.approvedBy);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return this.apiService.get<LeaveListResponse>(endpoint).pipe(
      catchError((error) => {
        console.warn('API call failed, falling back to demo data:', error);
        return this.demoLeaveService.getLeaveRequests(params);
      })
    );
  }

  // Get leave request by ID
  getLeaveRequestById(id: string): Observable<any> {
    return this.apiService.get(`/leave-management/leave-requests/${id}`).pipe(
      catchError((error) => {
        console.warn('API call failed for leave request by ID:', error);
        return of(null);
      })
    );
  }

  // Create new leave request
  createLeaveRequest(data: Partial<LeaveRequest>): Observable<any> {
    return this.apiService.post('/leave-management/leave-requests', data).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  // Update leave request
  updateLeaveRequest(id: string, data: Partial<LeaveRequest>): Observable<any> {
    return this.apiService.put(`/leave-management/leave-requests/${id}`, data).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  // Delete leave request
  deleteLeaveRequest(id: string): Observable<any> {
    return this.apiService.delete(`/leave-management/leave-requests/${id}`).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  // Approve leave request
  approveLeaveRequest(id: string, notes?: string): Observable<any> {
    return this.apiService.put(`/leave-management/leave-requests/${id}/status`, {
      status: 'approved',
      notes
    }).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  // Reject leave request
  rejectLeaveRequest(id: string, rejectionReason?: string): Observable<any> {
    return this.apiService.put(`/leave-management/leave-requests/${id}/status`, {
      status: 'rejected',
      rejectionReason
    }).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  // Update leave request status (approve, reject, cancel)
  updateLeaveRequestStatus(id: string, statusData: { status: string; notes?: string; rejectionReason?: string }): Observable<any> {
    return this.apiService.put(`/leave-management/leave-requests/${id}/status`, statusData).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  // Cancel leave request
  cancelLeaveRequest(id: string): Observable<any> {
    return this.apiService.put(`/leave-management/leave-requests/${id}/cancel`, {}).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }
}
