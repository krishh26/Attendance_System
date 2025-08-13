import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    department: string;
    joinDate: string;
    status: string;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private inMemoryToken: string | null = null;
  private inMemoryUser: User | null = null;
  redirectUrl: string | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private apiService: ApiService,
  ) { }

  private get isInBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(email: string, password: string): Observable<any> {
    const loginData: LoginRequest = { email, password };
    return this.apiService.post<LoginResponse>('/auth/login', loginData);
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    if (this.isInBrowser) {
      return !!localStorage.getItem(this.TOKEN_KEY);
    }
    return !!this.inMemoryToken;
  }

  getToken(): string | null {
    if (this.isInBrowser) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return this.inMemoryToken;
  }

  getUser(): User | null {
    if (this.isInBrowser) {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return this.inMemoryUser;
  }

  setAuthData(token: string, user: User): void {
    if (this.isInBrowser) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      this.inMemoryToken = token;
      this.inMemoryUser = user;
    }
  }

  clearAuthData(): void {
    if (this.isInBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } else {
      this.inMemoryToken = null;
      this.inMemoryUser = null;
    }
  }

  forgotPassword(email: string): Observable<any> {
    return this.apiService.post<{ message: string }>('/auth/send-otp', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.apiService.post<{ message: string }>('/auth/reset-password', {
      token,
      newPassword
    });
  }
}
