# User CRUD Implementation

## Overview
This document describes the complete CRUD (Create, Read, Update, Delete) implementation for user management in the Attendance System.

## Features Implemented

### 1. **User Listing (Read)**
- **API Integration**: `GET /api/users` with filtering, pagination, and sorting
- **Search**: Real-time search with debouncing
- **Status Filtering**: Filter by All/Active/Inactive users
- **Sorting**: Sortable columns for User Name, Email, and Created Date
- **Pagination**: Dynamic pagination with configurable page size
- **Real-time Updates**: Refresh button and automatic data reloading

### 2. **Create User**
- **API Endpoint**: `POST /api/users`
- **Modal UI**: Comprehensive form with validation
- **Form Fields**:
  - First Name (required)
  - Last Name (required)
  - Email (required, validated)
  - Password (required, min 6 chars)
  - Role (dropdown from API)
  - Mobile Number (required, validated)
  - Address Line 1 (required)
  - Address Line 2 (optional)
  - City (required)
  - State (required)
  - Center (required)
  - Pincode (required, validated)

### 3. **Update User**
- **API Endpoint**: `PATCH /api/users/{id}`
- **Modal UI**: Pre-populated form with existing data
- **Password Handling**: Optional (leave blank to keep unchanged)
- **Form Validation**: Same validation rules as create
- **Real-time Updates**: Automatic refresh after update

### 4. **Delete User**
- **API Endpoint**: `DELETE /api/users/{id}`
- **Confirmation Modal**: User-friendly delete confirmation
- **Safety Features**: Clear warning about irreversible action
- **Loading States**: Visual feedback during deletion

### 5. **Role Management**
- **API Integration**: `GET /api/roles` for role dropdown
- **Active Roles Only**: Filters to show only active roles
- **Display Names**: Shows user-friendly role names

## API Endpoints

### Create User
```http
POST http://localhost:3100/api/users
Content-Type: application/json

{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "role": "64f8a1b2c3d4e5f6a7b8c9d0",
  "mobilenumber": "+1234567890",
  "addressline1": "123 Main Street",
  "addressline2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "center": "Manhattan",
  "pincode": "10001"
}
```

### Update User
```http
PATCH http://localhost:3100/api/users/64f8a1b2c4e5f6a7b8c9d0
Content-Type: application/json

{
  "firstname": "John",
  "lastname": "Smith",
  "email": "john.smith@example.com",
  "password": "newpassword123",
  "role": "64f8a1b2c3d4e5f6a7b8c9d0",
  "mobilenumber": "+1234567890",
  "addressline1": "456 Oak Street",
  "addressline2": "Suite 2A",
  "city": "Los Angeles",
  "state": "CA",
  "center": "Downtown",
  "pincode": "90210",
  "isActive": true
}
```

### Delete User
```http
DELETE http://localhost:3100/api/users/64f8a1b2c4e5f6a7b8c9d0
```

### Get Roles
```http
GET http://localhost:3100/api/roles?page=1&limit=10&search=admin&sortBy=createdAt&sortOrder=desc
```

## Components Created

### 1. **UserFormModalComponent**
- **Location**: `user-form-modal/`
- **Purpose**: Handles both create and edit user operations
- **Features**:
  - Reactive forms with validation
  - Dynamic password field handling
  - Role dropdown integration
  - Form validation and error display
  - Loading states and error handling

### 2. **ConfirmModalComponent**
- **Location**: `confirm-modal/`
- **Purpose**: Generic confirmation modal for delete operations
- **Features**:
  - Customizable title and message
  - Loading states
  - Responsive design

### 3. **Enhanced UserService**
- **New Methods**:
  - `createUser(userData: CreateUserRequest)`
  - `updateUser(userId: string, userData: UpdateUserRequest)`
  - `deleteUser(userId: string)`

### 4. **RoleService**
- **Purpose**: Fetches roles for user form dropdown
- **Features**:
  - Role listing with pagination
  - Active role filtering
  - Search and sorting support

## User Experience Features

### 1. **Form Validation**
- **Real-time Validation**: Immediate feedback on form errors
- **Required Field Indicators**: Clear visual indicators for required fields
- **Pattern Validation**: Email, phone, and pincode validation
- **Length Validation**: Minimum length requirements for names and password

### 2. **Loading States**
- **Button States**: Disabled buttons during operations
- **Spinner Indicators**: Visual feedback for loading operations
- **Form Locking**: Prevents multiple submissions

### 3. **Error Handling**
- **User-friendly Messages**: Clear error descriptions
- **API Error Display**: Shows server-side errors
- **Validation Errors**: Field-specific error messages

### 4. **Responsive Design**
- **Mobile-friendly**: Responsive grid layout
- **Touch-friendly**: Appropriate button sizes for mobile
- **Adaptive Modals**: Responsive modal sizing

## Security Features

### 1. **Password Handling**
- **Create Mode**: Required password with minimum length
- **Edit Mode**: Optional password (blank = unchanged)
- **Validation**: Strong password requirements

### 2. **Input Sanitization**
- **Pattern Validation**: Prevents invalid input
- **Length Limits**: Prevents excessive input
- **Type Validation**: Ensures correct data types

### 3. **API Security**
- **Authentication**: Uses existing auth interceptor
- **Authorization**: Role-based access control
- **Data Validation**: Server-side validation

## Usage Examples

### Opening Add User Modal
```typescript
openAddUserModal(): void {
  this.selectedUser = null;
  this.showUserModal = true;
}
```

### Opening Edit User Modal
```typescript
openEditUserModal(user: User): void {
  this.selectedUser = user;
  this.showUserModal = true;
}
```

### Opening Delete Confirmation
```typescript
openDeleteUserModal(user: User): void {
  this.selectedUser = user;
  this.showDeleteModal = true;
}
```

### Handling User Save
```typescript
onUserSaved(user: User): void {
  this.closeUserModal();
  this.refreshUsers();
}
```

## Dependencies

### Angular Modules
- `CommonModule`: Basic Angular functionality
- `RouterModule`: Navigation support
- `FormsModule`: Template-driven forms
- `ReactiveFormsModule`: Reactive forms

### Services
- `UserService`: User CRUD operations
- `RoleService`: Role management
- `ApiService`: HTTP communication

### RxJS
- `Subject`: Event handling
- `takeUntil`: Memory leak prevention
- `debounceTime`: Search optimization
- `distinctUntilChanged`: Performance optimization

## Future Enhancements

### 1. **Bulk Operations**
- Bulk user import/export
- Bulk status updates
- Bulk role assignments

### 2. **Advanced Filtering**
- Date range filtering
- Role-based filtering
- Center-based filtering

### 3. **User Activity Tracking**
- Last login tracking
- Activity logs
- Audit trails

### 4. **Enhanced Validation**
- Custom validators
- Cross-field validation
- Async validation (email uniqueness)

### 5. **Notification System**
- Toast notifications
- Email confirmations
- SMS notifications
