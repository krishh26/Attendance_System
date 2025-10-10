import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';

export interface TimeLogEntry {
  _id: string;
  userId: string | any; // Can be string ID or populated user object
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  isCheckedOut: boolean;
  totalHours?: number;
  status: string;
  sessionNumber: number;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface TimeLogResponse {
  code: number;
  status: string;
  data: {
    code: number;
    status: string;
    data: TimeLogEntry[];
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

export interface TimeLogParams {
  date: string;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class TimelogService {
  constructor(private apiService: ApiService) {}

  // Get all users time logs with pagination and date filter
  getAllUsersTimeLogs(params: TimeLogParams): Observable<TimeLogResponse> {
    const { date, page, limit } = params;
    const endpoint = `/attendance/admin/all-users?date=${date}&page=${page}&limit=${limit}`;

    return this.apiService.get<TimeLogResponse>(endpoint);
  }

  // Utility methods for display
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'present':
        return 'status-present';
      case 'late':
        return 'status-late';
      case 'early':
        return 'status-early';
      case 'absent':
        return 'status-absent';
      default:
        return 'status-unknown';
    }
  }

  getStatusText(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTimeForDisplay(timeString: string): string {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
