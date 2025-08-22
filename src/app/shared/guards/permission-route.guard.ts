import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionRouteGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const url = state.url;

    // Check if user has permission to access this route
    if (this.permissionService.canAccessRoute(url)) {
      return true;
    }

    // If no permission, redirect to dashboard or show access denied
    console.warn(`Access denied to route: ${url}`);
    this.router.navigate(['/admin/dashboard']);
    return false;
  }
}
