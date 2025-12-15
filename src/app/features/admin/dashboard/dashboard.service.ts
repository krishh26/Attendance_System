import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface DashboardStats {
    totalEmployees: number;
    presentToday: number;
    onLeave: number;
    newRequests: number;
}

export interface RecentActivity {
    user: string;
    action: string;
    time: string | Date;
    type: string;
    userAvatar?: string;
}

export interface DepartmentStat {
    department: string;
    present: number;
    total: number;
}

export interface LeaveRequest {
    _id: string;
    userId?: {
        firstname: string;
        lastname: string;
    };
    leaveType: string;
    startDate: string | Date;
    endDate: string | Date;
    reason?: string;
    status: string;
    employee?: string;
    type?: string;
}

interface ApiResponse<T> {
    code: number;
    status: string;
    data: T;
    timestamp: string;
    path: string;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = `${environment.apiBaseUrl}/dashboard`;

    constructor(private http: HttpClient) { }

    getStats(): Observable<DashboardStats> {
        return this.http.get<ApiResponse<DashboardStats>>(`${this.apiUrl}/stats`)
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error fetching dashboard stats:', error);
                    return throwError(() => error);
                })
            );
    }

    getRecentActivity(limit: number = 5): Observable<RecentActivity[]> {
        const params = new HttpParams().set('limit', limit.toString());
        return this.http.get<ApiResponse<RecentActivity[]>>(`${this.apiUrl}/activity`, { params })
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error fetching recent activity:', error);
                    return throwError(() => error);
                })
            );
    }

    getDepartmentStats(): Observable<DepartmentStat[]> {
        return this.http.get<ApiResponse<DepartmentStat[]>>(`${this.apiUrl}/department-stats`)
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error fetching department stats:', error);
                    return throwError(() => error);
                })
            );
    }

    getPendingLeaveRequests(limit: number = 5): Observable<LeaveRequest[]> {
        const params = new HttpParams().set('limit', limit.toString());
        return this.http.get<ApiResponse<LeaveRequest[]>>(`${this.apiUrl}/leave-requests`, { params })
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error fetching pending leave requests:', error);
                    return throwError(() => error);
                })
            );
    }
}

