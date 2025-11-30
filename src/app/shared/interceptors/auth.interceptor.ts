import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from '../../features/auth/services/auth.service';
import { Router } from '@angular/router';

export function AuthInterceptor(
  request: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Add auth token to all requests
  const token = authService.getToken();
  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning' : 'testing'
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't handle 401/403 for logout endpoint or login endpoint to prevent infinite loop
      const isLogoutRequest = request.url.includes('/auth/logout');
      const isLoginRequest = request.url.includes('/auth/login');
      const currentUrl = router.url || window.location.pathname;
      const isOnLoginPage = currentUrl.includes('/login');
      
      // Only handle 401/403 for non-auth endpoints
      // Skip if already on login page to prevent loops
      if ((error.status === 401 || error.status === 403) && !isLogoutRequest && !isLoginRequest && !isOnLoginPage) {
        // Check if logout is already in progress using private property access
        const isLoggingOut = (authService as any).isLoggingOut;
        if (!isLoggingOut) {
          console.log('AuthInterceptor: Unauthorized access detected, logging out user');
          // logout() method already handles navigation, so just call it
          authService.logout();
        } else {
          console.log('AuthInterceptor: Logout already in progress, skipping interceptor logout');
        }
      }
      return throwError(() => error);
    })
  );
}
