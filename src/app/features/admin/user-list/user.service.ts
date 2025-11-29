import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';

export interface RoleRef {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive?: boolean;
}

export interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: any;
  mobilenumber: string;
  addressline1: string;
  addressline2: string;
  city: string;
  state: string;
  center: string;
  pincode: string;
  isActive: boolean;
  isLoggedIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
  mobilenumber: string;
  addressline1: string;
  addressline2: string;
  city: string;
  state: string;
  center: string;
  pincode: string;
}

export interface UpdateUserRequest {
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
  role?: string;
  mobilenumber?: string;
  addressline1?: string;
  addressline2?: string;
  city?: string;
  state?: string;
  center?: string;
  pincode?: string;
  isActive?: boolean;
}

export interface UserListResponse {
  code: number;
  status: string;
  data: User[];
  timestamp: string;
  path: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) {}

    getUsers(params: UserListParams = {}): Observable<UserListResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.apiService.get<UserListResponse>(endpoint);
  }

  createUser(userData: CreateUserRequest): Observable<any> {
    return this.apiService.post<any>('/users', userData);
  }

  updateUser(userId: string, userData: UpdateUserRequest): Observable<any> {
    return this.apiService.patch<any>(`/users/${userId}`, userData);
  }

  deleteUser(userId: string): Observable<any> {
    return this.apiService.delete<any>(`/users/${userId}`);
  }

  getUserById(userId: string): Observable<any> {
    return this.apiService.get<any>(`/users/${userId}`);
  }

  importUsers(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.postForm<any>('/users/import', formData);
  }

  downloadImportTemplate(): Observable<Blob> {
    // Using native HttpClient for blob; add a pass-through here for convenience if needed later
    return (this.apiService as any).http.get(`${(this.apiService as any).baseUrl}/users/import/template`, { responseType: 'blob' });
  }

  logoutFromAllDevices(userId: string): Observable<any> {
    return this.apiService.post<any>(`/users/${userId}/logout-all-devices`, {});
  }
}
