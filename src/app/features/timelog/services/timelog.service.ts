import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TimelogService {
  constructor(private apiService: ApiService) {}

  // Get all users time logs with pagination and date filter
  getAllUsersTimeLogs(params: TimeLogParams): Observable<TimeLogResponse> {
    const { date, page, limit, search } = params;
    let endpoint = `/attendance/admin/all-users?date=${date}&page=${page}&limit=${limit}`;
    
    // Add search parameter if provided
    if (search && search.trim()) {
      endpoint += `&search=${encodeURIComponent(search.trim())}`;
    }
    
    return this.apiService.get<TimeLogResponse>(endpoint).pipe(
      catchError((error: any) => {
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

  // Format time for display as "h.mm am/pm" format (e.g., "1.03 am")
  // Note: API already returns time in IST, so extract time components directly from string
  formatTimeForDisplay(timeString: string | undefined | null): string {
    if (!timeString) return '';
    
    try {
      // Extract hours and minutes directly from ISO string (format: YYYY-MM-DDTHH:mm:ss.sssZ)
      // Since API already returns IST time, we parse the string directly
      const timeMatch = timeString.match(/T(\d{2}):(\d{2})/);
      if (!timeMatch) return '';
      
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      
      // Determine am/pm: 12-23 is pm, 0-11 is am
      const isPM = hours >= 12;
      
      // Convert to 12-hour format
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours; // 0 should be 12
      
      // Format minutes with leading zero if needed
      const minutesStr = minutes.toString().padStart(2, '0');
      
      // Format as "h.mm am/pm" (e.g., "1.03 am", "7.04 am")
      return `${hours}.${minutesStr} ${isPM ? 'pm' : 'am'}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  }

  // Get status class for styling
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
}
