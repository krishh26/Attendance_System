import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    console.log('AuthGuard: Checking authentication...');
    
    if (this.authService.isAuthenticated()) {
      console.log('AuthGuard: User is authenticated, allowing access');
      return true;
    }

    console.log('AuthGuard: User is not authenticated, redirecting to login');
    
    // Store the attempted URL for redirecting
    const currentUrl = window.location.pathname;
    console.log('AuthGuard: Storing redirect URL:', currentUrl);
    
    // Store in localStorage as backup
    localStorage.setItem('redirectUrl', currentUrl);
    this.authService.redirectUrl = currentUrl;

    return this.router.createUrlTree(['/login']);
  }
}
