import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';

export interface CheckInRequest {
  latitude?: number;
  longitude?: number;
}

export interface CheckOutRequest {
  latitude?: number;
  longitude?: number;
}

export interface AttendanceResponse {
  code: number;
  status: string;
  data: {
    _id: string;
    userId: string;
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
  };
  timestamp: string;
  path: string;
}

export interface TodayAttendanceResponse {
  code: number;
  status: string;
  data: Array<{
    _id: string;
    userId: string;
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
  }>;
  timestamp: string;
  path: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  constructor(private apiService: ApiService) {}

  // Check-in for the day
  checkIn(request: CheckInRequest): Observable<AttendanceResponse> {
    return this.apiService.post<AttendanceResponse>('/attendance/checkin', request);
  }

  // Check-out from current session
  checkOut(request: CheckOutRequest): Observable<AttendanceResponse> {
    return this.apiService.post<AttendanceResponse>('/attendance/checkout', request);
  }

  // Start a new session for the same day
  startNewSession(request: CheckInRequest): Observable<AttendanceResponse> {
    return this.apiService.post<AttendanceResponse>('/attendance/start-new-session', request);
  }

  // Get today's attendance records
  getTodayAttendance(): Observable<TodayAttendanceResponse> {
    return this.apiService.get<TodayAttendanceResponse>('/attendance/today');
  }

  // Get current user's check-in status
  getCurrentStatus(): Observable<{ hasActiveSession: boolean; lastSession?: any }> {
    return new Observable(observer => {
      this.getTodayAttendance().subscribe({
        next: (response) => {
          const activeSession = response.data.find(session => !session.isCheckedOut);
          observer.next({
            hasActiveSession: !!activeSession,
            lastSession: activeSession
          });
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  // Get user's current location
  getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // Admin methods for creating, updating, and deleting attendance records
  createAttendanceRecord(request: AdminCreateAttendanceRequest): Observable<AttendanceResponse> {
    return this.apiService.post<AttendanceResponse>('/attendance/admin/create', request);
  }

  updateAttendanceRecord(id: string, request: AdminUpdateAttendanceRequest): Observable<AttendanceResponse> {
    return this.apiService.put<AttendanceResponse>(`/attendance/admin/update/${id}`, request);
  }

  deleteAttendanceRecord(id: string): Observable<{ code: number; status: string; message: string }> {
    return this.apiService.delete<{ code: number; status: string; message: string }>(`/attendance/admin/delete/${id}`);
  }
}

export interface AdminCreateAttendanceRequest {
  userId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  sessionNumber?: number;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
}

export interface AdminUpdateAttendanceRequest {
  userId?: string;
  date?: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  sessionNumber?: number;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
}
