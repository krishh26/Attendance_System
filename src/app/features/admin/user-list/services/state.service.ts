import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared/services/api.service';

export interface State {
  _id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface StateResponse {
  success: boolean;
  message: string;
  data: State[];
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all states
   */
  getStates(): Observable<StateResponse> {
    return this.apiService.get<StateResponse>('/states');
  }

  /**
   * Get state by ID
   */
  getStateById(id: string): Observable<{ success: boolean; message: string; data: State }> {
    return this.apiService.get<{ success: boolean; message: string; data: State }>(`/states/${id}`);
  }
}
