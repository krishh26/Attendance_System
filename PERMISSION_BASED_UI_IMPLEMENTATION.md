# 🔐 Permission-Based UI Implementation Guide

## Overview
This guide explains how to implement permission-based UI controls throughout the Attendance System application. Users with only `read` and `list` permissions for a module should only see the list view without add, edit, delete, or status change buttons.

## 🎯 Permission Structure

### Module Permissions
Each module supports these actions:
- `create` - Can create new items
- `read` - Can view item details
- `update` - Can edit existing items
- `delete` - Can delete items
- `list` - Can view the list of items
- `approve` - Can approve/reject items
- `reject` - Can reject items
- `export` - Can export data

### Example User Permissions
```json
{
  "module": "tour",
  "actions": ["read", "list"]
}
```
This user can only view tours and see the list, but cannot create, edit, delete, or change status.

## 🛠️ Implementation Methods

### Method 1: Component-Level Permission Checks (Recommended)

#### Step 1: Inject PermissionService
```typescript
import { PermissionService } from '../../../shared/services/permission.service';

constructor(
  private permissionService: PermissionService,
  // ... other services
) {}
```

#### Step 2: Add Permission Checking Methods
```typescript
// Permission checking methods
canCreate(): boolean {
  return this.permissionService.hasPermission('moduleName', 'create');
}

canEdit(): boolean {
  return this.permissionService.hasPermission('moduleName', 'update');
}

canDelete(): boolean {
  return this.permissionService.hasPermission('moduleName', 'delete');
}

canUpdateStatus(): boolean {
  return this.permissionService.hasPermission('moduleName', 'approve') || 
         this.permissionService.hasPermission('moduleName', 'update');
}

canView(): boolean {
  return this.permissionService.hasPermission('moduleName', 'read');
}
```

#### Step 3: Use in Template
```html
<!-- Create Button -->
<button 
  *ngIf="canCreate()"
  class="btn btn-primary" 
  (click)="createItem()"
>
  <i class="fas fa-plus"></i> Create Item
</button>

<!-- Action Buttons -->
<button 
  *ngIf="canView()"
  class="btn btn-sm btn-outline-info" 
  (click)="viewDetails(item)"
>
  <i class="fas fa-eye"></i>
</button>

<button 
  *ngIf="canEdit()"
  class="btn btn-sm btn-outline-primary" 
  (click)="editItem(item)"
>
  <i class="fas fa-edit"></i>
</button>

<button 
  *ngIf="canDelete()"
  class="btn btn-sm btn-outline-danger" 
  (click)="deleteItem(item)"
>
  <i class="fas fa-trash"></i>
</button>
```

### Method 2: Permission Directive (Alternative)

#### Step 1: Use the Permission Directive
```html
<!-- Single permission check -->
<button 
  *appPermission="'tour:create'"
  class="btn btn-primary"
>
  Create Tour
</button>

<!-- Multiple permissions (any) -->
<button 
  *appPermissionAny="['tour:approve', 'tour:update']"
  class="btn btn-success"
>
  Update Status
</button>

<!-- Module-level check -->
<div *appPermissionModule="'tour'">
  <!-- Show if user has any permission for tour module -->
</div>
```

## 📋 Module Implementation Checklist

### ✅ Tour Management Module
- [x] **Tour List Component**
  - [x] Create button (conditional)
  - [x] View button (conditional)
  - [x] Edit button (conditional)
  - [x] Delete button (conditional)
  - [x] Status update button (conditional)

- [x] **Tour Details Component**
  - [x] Edit button (conditional)
  - [x] Status update button (conditional)

- [x] **Tour Form Component**
  - [x] Permission check on route access
  - [x] Redirect if no permission

### ✅ Leave Management Module
- [x] **Leave List Component**
  - [x] Create button (conditional)
  - [x] Edit button (conditional)
  - [x] Delete button (conditional)
  - [x] Status update button (conditional)
  - [x] Approve/Reject buttons (conditional)

### 🔄 Pending Modules
- [ ] **User Management Module**
- [ ] **Attendance Module**
- [ ] **Holiday Module**
- [ ] **Time Log Module**
- [ ] **Reports Module**

## 🎨 UI Patterns

### Header Actions
```html
<div class="header-actions">
  <!-- Always show refresh -->
  <button class="btn-refresh" (click)="refreshData()">
    <i class="fas fa-sync-alt"></i> Refresh
  </button>
  
  <!-- Conditional create button -->
  <button 
    *ngIf="canCreate()"
    class="btn-add"
    (click)="createItem()"
  >
    <i class="fas fa-plus"></i> New Item
  </button>
</div>
```

### Table Actions
```html
<td class="actions">
  <!-- View button - always show if user has read permission -->
  <button 
    *ngIf="canView()"
    class="btn btn-sm btn-outline-info" 
    (click)="viewDetails(item)"
    title="View Details"
  >
    <i class="fas fa-eye"></i>
  </button>
  
  <!-- Edit button - only show if user has update permission -->
  <button 
    *ngIf="canEdit()"
    class="btn btn-sm btn-outline-primary" 
    (click)="editItem(item)"
    title="Edit Item"
  >
    <i class="fas fa-edit"></i>
  </button>
  
  <!-- Delete button - only show if user has delete permission -->
  <button 
    *ngIf="canDelete()"
    class="btn btn-sm btn-outline-danger" 
    (click)="deleteItem(item)"
    title="Delete Item"
  >
    <i class="fas fa-trash"></i>
  </button>
  
  <!-- Status update button - only show if user has approve/update permission -->
  <button 
    *ngIf="canUpdateStatus()"
    class="btn btn-sm btn-outline-success" 
    (click)="updateStatus(item)"
    title="Update Status"
  >
    <i class="fas fa-sync-alt"></i>
  </button>
</td>
```

### Form Actions
```html
<div class="form-actions">
  <button type="button" class="btn btn-secondary" (click)="onCancel()">
    Cancel
  </button>
  
  <!-- Submit button - only show if user has create/update permission -->
  <button 
    *ngIf="canCreate() || canEdit()"
    type="submit" 
    class="btn btn-primary" 
    [disabled]="saving || form.invalid"
  >
    <span *ngIf="saving" class="spinner-small"></span>
    {{ isEditMode ? 'Update' : 'Create' }}
  </button>
</div>
```

## 🔒 Route Protection

### Component-Level Route Protection
```typescript
ngOnInit(): void {
  this.checkPermissions();
  // ... other initialization
}

private checkPermissions(): void {
  if (this.isEditMode && !this.canEdit()) {
    console.warn('User does not have permission to edit');
    this.router.navigate(['/admin/module/list']);
    return;
  }

  if (!this.isEditMode && !this.canCreate()) {
    console.warn('User does not have permission to create');
    this.router.navigate(['/admin/module/list']);
    return;
  }
}
```

### Route Guard Protection
```typescript
// In routing module
{
  path: 'create',
  component: CreateComponent,
  canActivate: [PermissionRouteGuard],
  data: { requiredPermission: 'module:create' }
}
```

## 🧪 Testing Permission Scenarios

### Test Case 1: Read + List Only
**User Permissions:**
```json
{
  "module": "tour",
  "actions": ["read", "list"]
}
```

**Expected Behavior:**
- ✅ Can view tour list
- ✅ Can view tour details
- ❌ Cannot see create button
- ❌ Cannot see edit buttons
- ❌ Cannot see delete buttons
- ❌ Cannot see status update buttons

### Test Case 2: Full Access
**User Permissions:**
```json
{
  "module": "tour",
  "actions": ["create", "read", "update", "delete", "list", "approve", "reject", "export"]
}
```

**Expected Behavior:**
- ✅ Can view tour list
- ✅ Can view tour details
- ✅ Can see create button
- ✅ Can see edit buttons
- ✅ Can see delete buttons
- ✅ Can see status update buttons

### Test Case 3: Super Admin
**User Properties:**
```json
{
  "isSuperAdmin": true
}
```

**Expected Behavior:**
- ✅ All permissions granted automatically
- ✅ All UI elements visible
- ✅ No permission checks needed

## 🚀 Best Practices

### 1. Consistent Permission Methods
Always use the same method names across components:
- `canCreate()`
- `canEdit()`
- `canDelete()`
- `canUpdateStatus()`
- `canView()`

### 2. Early Permission Checks
Check permissions in `ngOnInit` and redirect unauthorized users immediately.

### 3. Graceful Degradation
If a user doesn't have permission, show appropriate messages or hide elements completely.

### 4. Console Logging
Log permission checks for debugging:
```typescript
canCreate(): boolean {
  const hasPermission = this.permissionService.hasPermission('module', 'create');
  console.log(`Create permission for module: ${hasPermission}`);
  return hasPermission;
}
```

### 5. Permission Service Caching
The PermissionService automatically handles caching and updates when permissions change.

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: Buttons not showing
**Check:**
- Permission service is injected
- Permission methods are defined
- Template uses correct `*ngIf` syntax
- Console shows permission check logs

#### Issue 2: Permission checks not working
**Check:**
- User object has correct permissions
- Permission service is properly initialized
- Auth state is correctly set

#### Issue 3: Super admin not working
**Check:**
- User object has `isSuperAdmin: true`
- Permission service super admin logic
- Console logs for super admin detection

### Debug Commands
```typescript
// In browser console
// Check current user permissions
ng.getComponent(document.querySelector('app-navbar')).showPermissions();

// Check super admin status
ng.getComponent(document.querySelector('app-navbar')).showSuperAdminStatus();

// Refresh auth state
ng.getComponent(document.querySelector('app-navbar')).refreshAuthState();
```

## 📚 Additional Resources

- [Permission Service Documentation](./shared/services/permission.service.ts)
- [Permission Directive Documentation](./shared/directives/permission.directive.ts)
- [Auth Service Documentation](./features/auth/services/auth.service.ts)
- [Role Management Documentation](./features/roles/README.md)

---

**Remember:** Always test permission scenarios thoroughly and ensure that users with limited permissions cannot access restricted functionality through the UI.
