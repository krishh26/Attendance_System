import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';

// Tour Interfaces based on API response
export interface TourDocument {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface TourStatusHistory {
  status: string;
  changedBy: string;
  changedByName: string;
  notes?: string;
  changedAt: Date;
}

export interface Tour {
  _id: string;
  assignedTo: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  createdBy: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  purpose: string;
  location: string;
  expectedTime: Date;
  documents: TourDocument[];
  userNotes?: string;
  status: string;
  statusHistory: TourStatusHistory[];
  adminNotes?: string;
  actualVisitTime?: Date;
  completionNotes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Interfaces
export interface TourListResponse {
  code: number;
  status: string;
  data: {
    data: Tour[];  // Changed from 'tours' to 'data' to match API response
    totalPages: number;
  };
  pagination: {  // Added pagination object to match API response
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
  path: string;
}

export interface TourResponse {
  code: number;
  status: string;
  data: Tour;
  timestamp: string;
  path: string;
}

// Create Tour DTO
export interface CreateTourDto {
  assignedTo: string;
  purpose: string;
  location: string;
  expectedTime: string;
  documents?: TourDocument[];
  userNotes?: string;
  adminNotes?: string;
}

// Update Tour DTO
export interface UpdateTourDto extends Partial<CreateTourDto> {}

// Update Tour Status DTO
export interface UpdateTourStatusDto {
  status: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TourService {
  constructor(private apiService: ApiService) {}

  // Get all tours with pagination and filters
  getAllTours(
    page: number = 1,
    limit: number = 10,
    filters: {
      status?: string;
      assignedTo?: string;
      createdBy?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Observable<TourListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters.status) params.append('status', filters.status);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.createdBy) params.append('createdBy', filters.createdBy);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    return this.apiService.get<TourListResponse>(`/tour-management/tours?${params.toString()}`).pipe(
      catchError((error) => {
        console.error('Error fetching tours:', error);
        return of({
          code: 500,
          status: 'error',
          data: {
            data: [],
            totalPages: 0
          },
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          },
          timestamp: new Date().toISOString(),
          path: '/tour-management/tours'
        });
      })
    );
  }

  // Get tour by ID
  getTourById(id: string): Observable<TourResponse> {
    return this.apiService.get<TourResponse>(`/tour-management/tours/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching tour ${id}:`, error);
        return of({
          code: 500,
          status: 'error',
          data: {} as Tour,
          timestamp: new Date().toISOString(),
          path: `/tour-management/tours/${id}`
        });
      })
    );
  }

  // Create new tour
  createTour(tourData: CreateTourDto): Observable<TourResponse> {
    return this.apiService.post<TourResponse>('/tour-management/tours', tourData).pipe(
      catchError((error) => {
        console.error('Error creating tour:', error);
        return of({
          code: 500,
          status: 'error',
          data: {} as Tour,
          timestamp: new Date().toISOString(),
          path: '/tour-management/tours'
        });
      })
    );
  }

  // Update tour
  updateTour(id: string, tourData: UpdateTourDto): Observable<TourResponse> {
    return this.apiService.patch<TourResponse>(`/tour-management/tours/${id}`, tourData).pipe(
      catchError((error) => {
        console.error(`Error updating tour ${id}:`, error);
        return of({
          code: 500,
          status: 'error',
          data: {} as Tour,
          timestamp: new Date().toISOString(),
          path: `/tour-management/tours/${id}`
        });
      })
    );
  }

  // Update tour status
  updateTourStatus(id: string, statusData: UpdateTourStatusDto): Observable<TourResponse> {
    return this.apiService.patch<TourResponse>(`/tour-management/tours/${id}/status`, statusData).pipe(
      catchError((error) => {
        console.error(`Error updating tour status ${id}:`, error);
        return of({
          code: 500,
          status: 'error',
          data: {} as Tour,
          timestamp: new Date().toISOString(),
          path: `/tour-management/tours/${id}/status`
        });
      })
    );
  }

  // Delete tour
  deleteTour(id: string): Observable<any> {
    return this.apiService.delete(`/tour-management/tours/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting tour ${id}:`, error);
        return of(null);
      })
    );
  }

  // Get available statuses
  getAvailableStatuses(): string[] {
    return ['pending', 'assigned', 'in-progress', 'completed', 'cancelled', 'approved', 'rejected'];
  }

  // Get status display names
  getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'assigned': 'Assigned',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    return statusMap[status] || status;
  }

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    const statusClassMap: { [key: string]: string } = {
      'pending': 'badge-warning',
      'assigned': 'badge-info',
      'in-progress': 'badge-primary',
      'completed': 'badge-success',
      'cancelled': 'badge-danger',
      'approved': 'badge-success',
      'rejected': 'badge-danger'
    };
    return statusClassMap[status] || 'badge-secondary';
  }
}
