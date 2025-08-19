import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Role, RolePermission } from '../../services/roles.service';
import { PermissionsService } from '../../services/permissions.service';
import { PermissionService } from '../../../../shared/services/permission.service';

export interface RoleFormData {
  name: string;
  displayName: string;
  description?: string;
  isSuperAdmin: boolean;
  permissions: RolePermission[];
}

@Component({
  selector: 'app-role-form',
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class RoleFormComponent implements OnInit, OnDestroy {
  @Input() role?: Role;
  @Input() isEditMode = false;
  @Output() save = new EventEmitter<RoleFormData>();
  @Output() cancel = new EventEmitter<void>();

  roleForm: FormGroup;
  availableModules: string[] = [];
  availableActions: string[] = [];
  selectedPermissions: Map<string, Set<string>> = new Map(); // module -> Set<actions>

  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private permissionsService: PermissionsService,
    private permissionService: PermissionService
  ) {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      displayName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      isSuperAdmin: [false]
    });
  }

  ngOnInit(): void {
    this.loadAvailableModulesAndActions();
    this.initializeSelectedPermissions();

    if (this.isEditMode && this.role) {
      this.populateForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAvailableModulesAndActions(): void {
    this.availableModules = this.permissionsService.getAvailableModules();
    this.availableActions = this.permissionsService.getAvailableActions();
  }

  private initializeSelectedPermissions(): void {
    this.selectedPermissions.clear();
    this.availableModules.forEach(module => {
      this.selectedPermissions.set(module, new Set());
    });
  }

  private populateForm(): void {
    if (!this.role) return;

    this.roleForm.patchValue({
      name: this.role.name,
      displayName: this.role.displayName,
      description: this.role.description || '',
      isSuperAdmin: this.role.isSuperAdmin
    });

    // Set selected permissions from existing role
    this.selectedPermissions.clear();
    this.availableModules.forEach(module => {
      this.selectedPermissions.set(module, new Set());
    });

    this.role.permissions.forEach(permission => {
      if (this.selectedPermissions.has(permission.module)) {
        const actionsSet = this.selectedPermissions.get(permission.module)!;
        permission.actions.forEach(action => actionsSet.add(action));
      }
    });
  }

  onActionToggle(module: string, action: string): void {
    const actionsSet = this.selectedPermissions.get(module);
    if (actionsSet) {
      if (actionsSet.has(action)) {
        actionsSet.delete(action);
      } else {
        actionsSet.add(action);
      }
    }
  }

  onSelectAllModule(module: string): void {
    const actionsSet = this.selectedPermissions.get(module);
    if (actionsSet) {
      this.availableActions.forEach(action => actionsSet.add(action));
    }
  }

  onDeselectAllModule(module: string): void {
    const actionsSet = this.selectedPermissions.get(module);
    if (actionsSet) {
      actionsSet.clear();
    }
  }

  isModuleSelected(module: string): boolean {
    const actionsSet = this.selectedPermissions.get(module);
    if (!actionsSet) return false;
    return actionsSet.size === this.availableActions.length;
  }

  isModulePartiallySelected(module: string): boolean {
    const actionsSet = this.selectedPermissions.get(module);
    if (!actionsSet) return false;
    return actionsSet.size > 0 && actionsSet.size < this.availableActions.length;
  }

  isActionSelected(module: string, action: string): boolean {
    const actionsSet = this.selectedPermissions.get(module);
    return actionsSet ? actionsSet.has(action) : false;
  }

  onSubmit(): void {
    if (this.roleForm.valid) {
      // Convert selected permissions to RolePermission format
      const permissions: RolePermission[] = [];
      this.selectedPermissions.forEach((actionsSet, module) => {
        if (actionsSet.size > 0) {
          permissions.push({
            module,
            actions: Array.from(actionsSet)
          });
        }
      });

      const formData: RoleFormData = {
        ...this.roleForm.value,
        permissions
      };
      this.save.emit(formData);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getSelectedPermissionCount(module: string): number {
    const actionsSet = this.selectedPermissions.get(module);
    return actionsSet ? actionsSet.size : 0;
  }

  getTotalSelectedPermissionsCount(): number {
    let total = 0;
    this.selectedPermissions.forEach(actionsSet => {
      total += actionsSet.size;
    });
    return total;
  }

  getTotalAvailablePermissionsCount(): number {
    return this.availableModules.length * this.availableActions.length;
  }

  // Permission checks
  canManagePermissions(): boolean {
    return this.permissionService.hasPermission('roles', 'update');
  }

  // Helper method to get action display name
  getActionDisplayName(action: string): string {
    return action.charAt(0).toUpperCase() + action.slice(1);
  }

  // Helper method to get module display name
  getModuleDisplayName(module: string): string {
    return module.charAt(0).toUpperCase() + module.slice(1);
  }

  // Helper method to get action description
  getActionDescription(module: string, action: string): string {
    return this.permissionsService.getPermissionDescription(module, action);
  }
}
