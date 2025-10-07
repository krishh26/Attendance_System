import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public baseUrl = environment.apiBaseUrl;

  constructor(
    public http: HttpClient
  ) {}

  private getHeaders(): HttpHeaders {
    // Basic headers - AuthInterceptor will add Authorization header
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Generic GET request
  get<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Making GET request to: ${url}`);
    return this.http.get<T>(url, { headers: this.getHeaders() });
  }

  // Generic POST request
  post<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Making POST request to: ${url}`, data);
    return this.http.post<T>(url, data, { headers: this.getHeaders() });
  }

  // Generic PUT request
  put<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Making PUT request to: ${url}`, data);
    return this.http.put<T>(url, data, { headers: this.getHeaders() });
  }

  // Generic DELETE request
  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Making DELETE request to: ${url}`);
    return this.http.delete<T>(url, { headers: this.getHeaders() });
  }

  // Generic PATCH request
  patch<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Making PATCH request to: ${url}`, data);
    return this.http.patch<T>(url, data, { headers: this.getHeaders() });
  }

  // Multipart POST (for file uploads)
  postForm<T>(endpoint: string, formData: FormData): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    // Let the browser set the multipart boundary automatically
    const headers = new HttpHeaders();
    return this.http.post<T>(url, formData, { headers });
  }
}
