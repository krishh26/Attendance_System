import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private inMemoryToken: string | null = null;
  redirectUrl: string | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  private get isInBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(username: string, password: string): Observable<boolean> {
    // TODO: Replace this with actual API call
    // This is a mock implementation
    return of(true).pipe(
      tap(() => {
        const token = 'mock_token';
        this.inMemoryToken = token;
        if (this.isInBrowser) {
          localStorage.setItem(this.TOKEN_KEY, token);
        }
      })
    );
  }

  logout(): void {
    this.inMemoryToken = null;
    if (this.isInBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
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

  forgotPassword(email: string): Observable<boolean> {
    // TODO: Replace with actual API call
    return of(true).pipe(
      tap(() => {
        console.log('Password reset email sent to:', email);
      })
    );
  }

  resetPassword(token: string, newPassword: string): Observable<boolean> {
    // TODO: Replace with actual API call
    return of(true).pipe(
      tap(() => {
        console.log('Password reset successful');
      })
    );
  }
}
