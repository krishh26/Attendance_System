import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';

// Holiday Interface based on API response
export interface Holiday {
  _id: string;
  name: string;
  date: string;
  description: string;
  isActive: boolean;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response Interface
export interface HolidayListResponse {
  code: number;
  status: string;
  data: Holiday[];
  timestamp: string;
  path: string;
}

// Create Holiday DTO
export interface CreateHolidayDto {
  name: string;
  date: string;
  description: string;
  isActive: boolean;
  isOptional: boolean;
}

// Update Holiday DTO
export interface UpdateHolidayDto extends Partial<CreateHolidayDto> {}

@Injectable({
  providedIn: 'root'
})
export class HolidayService {
  constructor(private apiService: ApiService) {}

  // Get all holidays
  getAllHolidays(): Observable<HolidayListResponse> {
    return this.apiService.get<HolidayListResponse>('/leave-management/holidays').pipe(
      catchError((error) => {
        console.error('Error fetching holidays:', error);
        return of({
          code: 500,
          status: 'error',
          data: [],
          timestamp: new Date().toISOString(),
          path: '/leave-management/holidays'
        });
      })
    );
  }

  // Get holidays by year
  getHolidaysByYear(year: number): Observable<HolidayListResponse> {
    return this.apiService.get<HolidayListResponse>(`/leave-management/holidays/year/${year}`).pipe(
      catchError((error) => {
        console.error(`Error fetching holidays for year ${year}:`, error);
        return of({
          code: 500,
          status: 'error',
          data: [],
          timestamp: new Date().toISOString(),
          path: `/leave-management/holidays/year/${year}`
        });
      })
    );
  }

  // Get holiday by ID
  getHolidayById(id: string): Observable<any> {
    return this.apiService.get(`/leave-management/holidays/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching holiday ${id}:`, error);
        return of(null);
      })
    );
  }

  // Create new holiday
  createHoliday(holidayData: CreateHolidayDto): Observable<any> {
    return this.apiService.post('/leave-management/holidays', holidayData).pipe(
      catchError((error) => {
        console.error('Error creating holiday:', error);
        return of(null);
      })
    );
  }

  // Update holiday
  updateHoliday(id: string, holidayData: UpdateHolidayDto): Observable<any> {
    return this.apiService.put(`/leave-management/holidays/${id}`, holidayData).pipe(
      catchError((error) => {
        console.error(`Error updating holiday ${id}:`, error);
        return of(null);
      })
    );
  }

  // Delete holiday
  deleteHoliday(id: string): Observable<any> {
    return this.apiService.delete(`/leave-management/holidays/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting holiday ${id}:`, error);
        return of(null);
      })
    );
  }
}
