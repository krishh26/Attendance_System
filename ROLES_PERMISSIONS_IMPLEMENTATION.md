# Roles and Permissions Implementation

## Overview
This document describes the implementation of a comprehensive roles and permissions system in the Attendance Management System.

## Backend Implementation

### 1. Models
- **Role Model**: Defines roles with permissions and super admin flag
- **Permission Model**: Defines permissions with module and action
- **User Model**: Updated to include role reference

### 2. Services
- **RolesService**: Manages role CRUD operations and permission assignments
- **PermissionsService**: Manages permission CRUD operations
- **AuthService**: Updated to include user permissions in login response

### 3. Guards
- **AuthGuard**: Basic authentication check
- **PermissionGuard**: Permission-based access control

### 4. API Endpoints
- `POST /api/roles` - Create role
- `GET /api/roles` - List all roles
- `GET /api/roles/:id` - Get role by ID
- `PATCH /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `POST /api/roles/:id/permissions` - Assign permissions to role

- `POST /api/permissions` - Create permission
- `GET /api/permissions` - List all permissions
- `GET /api/permissions/:id` - Get permission by ID
- `PATCH /api/permissions/:id` - Update permission
- `DELETE /api/permissions/:id` - Delete permission
- `GET /api/permissions/module/:module` - Get permissions by module

## Frontend Implementation

### 1. Services
- **RolesService**: Frontend service for role management
- **PermissionsService**: Frontend service for permission management
- **PermissionService**: Utility service for permission checks

### 2. Components
- **RolesListComponent**: Displays and manages roles
- **PermissionsListComponent**: Displays and manages permissions

### 3. Permission System
- **Super Admin**: Has access to all modules and can manage roles and permissions
- **Role-based Access**: Users get permissions based on their assigned role
- **Permission Checks**: Frontend components check permissions before showing actions

### 4. Permission Directive
- **appPermission**: Single permission check (e.g., `appPermission="users:create"`)
- **appPermissionAny**: Any permission check (e.g., `appPermissionAny="['users:create', 'users:update']"`)
- **appPermissionAll**: All permissions check (e.g., `appPermissionAll="['users:create', 'users:update']"`)

## Usage Examples

### 1. Backend Permission Check
```typescript
// In controller
@UseGuards(PermissionGuard)
@Permissions('users:create')
createUser() {
  // Only users with 'users:create' permission can access
}
```

### 2. Frontend Permission Check
```typescript
// In component
canCreateUser(): boolean {
  return this.permissionService.hasPermission('users', 'create');
}
```

### 3. Template Permission Check
```html
<!-- Show button only if user has permission -->
<button *appPermission="'users:create'">Create User</button>

<!-- Show section if user has any of the permissions -->
<div *appPermissionAny="['users:read', 'users:update']">
  User Management Section
</div>
```

## Default Roles and Permissions

### Default Roles
1. **Super Administrator**: Full system access
2. **Administrator**: Most modules with limited role management
3. **Manager**: User and report management
4. **User**: Basic access

### Default Permissions
- **Users Module**: create, read, update, delete, list
- **Roles Module**: create, read, update, delete, list
- **Permissions Module**: create, read, update, delete, list
- **Attendance Module**: create, read, update, delete, list
- **Leave Module**: create, read, update, delete, list, approve, reject
- **Holiday Module**: create, read, update, delete, list
- **Tour Module**: create, read, update, delete, list
- **Reports Module**: read, export

## Security Features

### 1. JWT Authentication
- Secure token-based authentication
- Token expiration handling

### 2. Permission Validation
- Backend validates all permission requests
- Frontend hides unauthorized actions

### 3. Role Hierarchy
- Super admin can manage all roles
- Regular users can only see their assigned permissions

## API Response Format

### Login Response
```json
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "role": {
      "id": "role_id",
      "name": "admin",
      "displayName": "Administrator",
      "isSuperAdmin": false
    },
    "permissions": [
      {
        "_id": "permission_id",
        "name": "users:create",
        "module": "users",
        "action": "create"
      }
    ],
    "isSuperAdmin": false
  }
}
```

## Testing the System

### 1. Create a Super Admin User
```bash
# First, create a user without a role (will have full access)
POST /api/users
{
  "email": "admin@example.com",
  "password": "admin123",
  "firstname": "Super",
  "lastname": "Admin"
}
```

### 2. Create Roles and Permissions
```bash
# Create permissions
POST /api/permissions
{
  "name": "users:create",
  "module": "users",
  "action": "create",
  "description": "Create new users"
}

# Create role
POST /api/roles
{
  "name": "manager",
  "displayName": "Manager",
  "description": "Department manager role",
  "permissions": ["permission_id_1", "permission_id_2"]
}
```

### 3. Assign Role to User
```bash
PATCH /api/users/user_id
{
  "role": "role_id"
}
```

## Future Enhancements

1. **Permission Groups**: Group related permissions for easier management
2. **Dynamic Permissions**: Runtime permission creation and assignment
3. **Audit Logging**: Track permission changes and access attempts
4. **Permission Inheritance**: Hierarchical permission system
5. **Time-based Permissions**: Temporary permission grants
6. **Multi-tenant Support**: Organization-level permission isolation

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check if user has the required role
   - Verify role has the required permissions
   - Ensure permission names match exactly

2. **Frontend Actions Not Showing**
   - Check permission service methods
   - Verify user permissions are loaded
   - Check browser console for errors

3. **Backend Permission Guard Issues**
   - Verify JWT token is valid
   - Check user role exists and is active
   - Ensure permission format is correct (module:action)

### Debug Commands

```bash
# Check user permissions
GET /api/users/user_id

# Check role permissions
GET /api/roles/role_id

# List all permissions
GET /api/permissions
```

## Conclusion

This implementation provides a robust, scalable roles and permissions system that ensures secure access control while maintaining flexibility for different user types. The system is designed to be easily extensible for future requirements.
