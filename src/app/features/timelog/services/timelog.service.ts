import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';

export interface TimeLogEntry {
  _id: string;
  userId: string | null;
  date: string;
  checkInTime: string;
  isCheckedOut: boolean;
  status: string;
  sessionNumber: number;
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
    
    return this.apiService.get<TimeLogResponse>(endpoint).pipe(
      catchError((error) => {
        console.warn('API call failed for time logs:', error);
        // Return mock data for demo purposes
        return of(this.getMockTimeLogResponse(params));
      })
    );
  }

  // Generate mock response for demo purposes
  private getMockTimeLogResponse(params: TimeLogParams): TimeLogResponse {
    const mockEntries: TimeLogEntry[] = [
      {
        _id: '689b977a07da9ac89041743a',
        userId: 'user123',
        date: params.date,
        checkInTime: '2025-08-12T19:35:22.097Z',
        isCheckedOut: false,
        status: 'present',
        sessionNumber: 1,
        createdAt: '2025-08-12T19:35:22.106Z',
        updatedAt: '2025-08-12T19:35:22.106Z',
        __v: 0
      },
      {
        _id: '689b977a07da9ac89041743b',
        userId: 'user456',
        date: params.date,
        checkInTime: '2025-08-12T08:45:00.000Z',
        isCheckedOut: true,
        status: 'present',
        sessionNumber: 1,
        createdAt: '2025-08-12T08:45:00.000Z',
        updatedAt: '2025-08-12T17:30:00.000Z',
        __v: 0
      },
      {
        _id: '689b977a07da9ac89041743c',
        userId: 'user789',
        date: params.date,
        checkInTime: '2025-08-12T09:15:00.000Z',
        isCheckedOut: false,
        status: 'late',
        sessionNumber: 1,
        createdAt: '2025-08-12T09:15:00.000Z',
        updatedAt: '2025-08-12T09:15:00.000Z',
        __v: 0
      }
    ];

    return {
      code: 200,
      status: 'OK',
      data: {
        code: 200,
        status: 'OK',
        data: mockEntries,
        timestamp: new Date().toISOString(),
        path: `/api/attendance/admin/all-users?date=${params.date}&page=${params.page}&limit=${params.limit}`
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total: 3,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      path: `/api/attendance/admin/all-users?date=${params.date}&page=${params.page}&limit=${params.limit}`
    };
  }

  // Get today's date in YYYY-MM-DD format
  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Format date for display
  formatDateForDisplay(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Format time for display
  formatTimeForDisplay(timeString: string): string {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Get status class for styling
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'present':
        return 'status-present';
      case 'late':
        return 'status-late';
      case 'absent':
        return 'status-absent';
      case 'early':
        return 'status-early';
      default:
        return 'status-unknown';
    }
  }

  // Get status display text
  getStatusText(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
