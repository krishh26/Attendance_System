import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';

export interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  role?: {
    _id: string;
    name: string;
    displayName: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  code: number;
  status: string;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
  path: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(private apiService: ApiService) {}

  // Get all users for admin selection
  getAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Observable<UsersResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.apiService.get<UsersResponse>(endpoint);
  }

  // Get all users without pagination for dropdown
  getAllUsersForDropdown(): Observable<User[]> {
    return new Observable(observer => {
      this.getAllUsers({ limit: 1000 }).subscribe({
        next: (response) => {
          observer.next(response.data);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }
}
