import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[appPermission]',
  standalone: true
})
export class PermissionDirective implements OnInit, OnDestroy {
  @Input() appPermission!: string; // Format: 'module:action'
  @Input() appPermissionAny?: string[]; // Array of permissions, user needs any of them
  @Input() appPermissionAll?: string[]; // Array of permissions, user needs all of them
  @Input() appPermissionModule?: string; // Just check if user has any permission for module
  @Input() appPermissionAction?: string; // Just check if user has any permission for action

  private hasPermission = false;
  private destroy$ = new Subject<void>();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.checkPermission();

    // Subscribe to permission changes
    this.permissionService.permissionsChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkPermission();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPermission() {
    let shouldShow = false;

    if (this.appPermission) {
      // Check specific permission (module:action)
      const [module, action] = this.appPermission.split(':');
      shouldShow = this.permissionService.hasPermission(module, action);
    } else if (this.appPermissionAny && this.appPermissionAny.length > 0) {
      // Check if user has any of the specified permissions
      shouldShow = this.permissionService.hasAnyPermission(this.appPermissionAny);
    } else if (this.appPermissionAll && this.appPermissionAll.length > 0) {
      // Check if user has all of the specified permissions
      shouldShow = this.permissionService.hasAllPermissions(this.appPermissionAll);
    } else if (this.appPermissionModule) {
      // Check if user has any permission for the module
      shouldShow = this.permissionService.hasAnyModulePermission(this.appPermissionModule);
    } else if (this.appPermissionAction) {
      // Check if user has the action permission in any module
      shouldShow = this.permissionService.hasActionInAnyModule(this.appPermissionAction);
    }

    if (shouldShow !== this.hasPermission) {
      this.hasPermission = shouldShow;
      this.updateView();
    }
  }

  private updateView() {
    if (this.hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
