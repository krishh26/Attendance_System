import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';

export interface Role {
  _id: string;
  name: string;
  displayName: string;
  isSuperAdmin: boolean;
  permissions: string[];
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleListResponse {
  code: number;
  status: string;
  data: Role[];
  timestamp: string;
  path: string;
}

export interface RoleListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  constructor(private apiService: ApiService) {}

  getRoles(params: RoleListParams = {}): Observable<RoleListResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `/roles${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.apiService.get<RoleListResponse>(endpoint);
  }
}
