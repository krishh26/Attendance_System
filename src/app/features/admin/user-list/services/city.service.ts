import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared/services/api.service';

export interface City {
  _id: string;
  name: string;
  state: {
    _id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CityResponse {
  success: boolean;
  message: string;
  data: City[];
}

@Injectable({
  providedIn: 'root'
})
export class CityService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all cities
   */
  getCities(): Observable<CityResponse> {
    return this.apiService.get<CityResponse>('/cities');
  }

  /**
   * Get cities by state ID
   */
  getCitiesByState(stateId: string): Observable<CityResponse> {
    return this.apiService.get<CityResponse>(`/cities?state=${stateId}`);
  }

  /**
   * Get city by ID
   */
  getCityById(id: string): Observable<{ success: boolean; message: string; data: City }> {
    return this.apiService.get<{ success: boolean; message: string; data: City }>(`/cities/${id}`);
  }
}
