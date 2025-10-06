import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface AuditLog {
  _id: string;
  module: string;
  action: 'create' | 'update' | 'delete';
  entityId?: string;
  entityType?: string;
  performedBy: string;
  performedByEmail?: string;
  changes: { field: string; oldValue?: unknown; newValue?: unknown }[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private baseUrl = environment.apiBaseUrl + '/audit-logs';

  constructor(private http: HttpClient) {}

  list(params: { module?: string; action?: string; entityId?: string; performedBy?: string; page?: number; limit?: number }): Observable<AuditLogsResponse> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<AuditLogsResponse>(this.baseUrl, { params: httpParams });
  }
}


