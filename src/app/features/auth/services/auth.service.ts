import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from '../../../shared/services/api.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RolePermission {
  module: string;
  actions: string[];
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: {
      id: string;
      name: string;
      displayName: string;
      isSuperAdmin: boolean;
    } | null;
    permissions: RolePermission[];
    isSuperAdmin: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: {
    id: string;
    name: string;
    displayName: string;
    isSuperAdmin: boolean;
  } | null;
  permissions: RolePermission[];
  isSuperAdmin: boolean;
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
  private isLoggingOut: boolean = false;

  // Public method to check if logout is in progress
  getIsLoggingOut(): boolean {
    return this.isLoggingOut;
  }

  // BehaviorSubject to track auth state changes - initialize with current user
  private authStateSubject = new BehaviorSubject<User | null>(null);
  public authStateChanged$ = this.authStateSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private apiService: ApiService,
  ) {
    // Initialize with current user from storage
    this.initializeAuthState();
  }

  private get isInBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private initializeAuthState(): void {
    try {
      const currentUser = this.getUserFromStorage();
      if (currentUser) {
        console.log('AuthService: Initializing with existing user:', currentUser);
        this.authStateSubject.next(currentUser);
      } else {
        console.log('AuthService: No existing user found');
      }
    } catch (error) {
      console.error('AuthService: Error initializing auth state:', error);
    }
  }

  private getUserFromStorage(): User | null {
    try {
      if (this.isInBrowser) {
        const userStr = localStorage.getItem(this.USER_KEY);
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('AuthService: Retrieved user from storage:', user);
          return user;
        }
      }
      return this.inMemoryUser;
    } catch (error) {
      console.error('AuthService: Error getting user from storage:', error);
      return null;
    }
  }

  login(email: string, password: string): Observable<any> {
    const loginData: LoginRequest = { email, password };
    return this.apiService.post<LoginResponse>('/auth/login', loginData).pipe(
      tap((response: LoginResponse) => {
        if (response.access_token && response.user) {
          console.log('AuthService: Login successful, setting auth data:', response.user);
          this.setAuthData(response.access_token, response.user);
        }
      })
    );
  }

  logout(): void {
    // Prevent multiple simultaneous logout calls
    if (this.isLoggingOut) {
      console.log('AuthService: Logout already in progress, skipping...');
      return;
    }

    console.log('AuthService: Logging out user');
    this.isLoggingOut = true;
    const token = this.getToken();
    
    // Clear local data immediately to prevent loops
    this.clearAuthData();
    
    // Navigate to login immediately using replaceUrl to prevent back navigation and reload issues
    this.router.navigate(['/login'], { replaceUrl: true }).then(() => {
      console.log('AuthService: Navigated to login page');
    }).catch((error) => {
      console.error('AuthService: Navigation error:', error);
    });
    
    // Call backend logout endpoint if token exists (fire and forget - don't wait for response)
    // Use setTimeout to ensure navigation happens first
    setTimeout(() => {
      if (token) {
        this.apiService.post('/auth/logout', {}).subscribe({
          next: () => {
            console.log('AuthService: Backend logout successful');
            this.isLoggingOut = false;
            this.router.navigate(['/login']);
          },
          error: (error) => {
            // Ignore errors from logout endpoint (401 is expected if token is invalid/expired)
            console.log('AuthService: Backend logout response (ignoring errors):', error.status);
            this.isLoggingOut = false;
            this.router.navigate(['/login']);
          }
        });
      } else {
        this.isLoggingOut = false;
        this.router.navigate(['/login']);
      }
    }, 100);
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

  getFullName(): string {
    const user = this.getUser();
    if (user) {
      return `${user.firstname} ${user.lastname}`.trim();
    }
    return '';
  }

  getUser(): User | null {
    try {
      if (this.isInBrowser) {
        const userStr = localStorage.getItem(this.USER_KEY);
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('AuthService: Getting current user:', user);
          return user;
        }
      }
      return this.inMemoryUser;
    } catch (error) {
      console.error('AuthService: Error getting user:', error);
      return null;
    }
  }

  setAuthData(token: string, user: User): void {
    console.log('AuthService: Setting auth data for user:', user);
    try {
      if (this.isInBrowser) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      } else {
        this.inMemoryToken = token;
        this.inMemoryUser = user;
      }
      // Emit auth state change
      this.authStateSubject.next(user);
      console.log('AuthService: Auth state updated, user isSuperAdmin:', user.isSuperAdmin);
    } catch (error) {
      console.error('AuthService: Error setting auth data:', error);
    }
  }

  clearAuthData(): void {
    console.log('AuthService: Clearing auth data');
    try {
      if (this.isInBrowser) {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
      } else {
        this.inMemoryToken = null;
        this.inMemoryUser = null;
      }
      // Emit auth state change
      this.authStateSubject.next(null);
    } catch (error) {
      console.error('AuthService: Error clearing auth data:', error);
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

  // Helper method to check if current user is super admin
  isCurrentUserSuperAdmin(): boolean {
    const user = this.getUser();
    const isSuperAdmin = user?.isSuperAdmin || false;
    console.log('AuthService: Checking super admin status:', isSuperAdmin, 'for user:', user);
    return isSuperAdmin;
  }

  // Method to manually refresh auth state (useful for debugging)
  refreshAuthState(): void {
    console.log('AuthService: Manually refreshing auth state');
    const currentUser = this.getUser();
    this.authStateSubject.next(currentUser);
  }
}
