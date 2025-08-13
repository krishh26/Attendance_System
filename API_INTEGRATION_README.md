# Attendance System - API Integration Guide

## Overview
This document describes the complete API integration implementation for the Attendance System, including authentication, route guards, interceptors, and localStorage management.

## Features Implemented

### 1. Authentication System
- **Login API**: `POST /api/auth/login`
- **Forgot Password**: `POST /api/auth/forgot-password`
- **Reset Password**: `POST /api/auth/reset-password`
- **JWT Token Management**: Automatic token storage and retrieval
- **User Data Storage**: User information stored in localStorage

### 2. Route Protection
- **AuthGuard**: Protects all admin routes
- **Automatic Redirect**: Unauthorized users redirected to login
- **URL Preservation**: Attempted URLs saved for post-login redirect

### 3. HTTP Interceptor
- **Automatic Token Injection**: Adds Authorization header to all requests
- **Error Handling**: 401/403 responses automatically logout user
- **Global Error Management**: Centralized error handling for authentication issues

### 4. API Service
- **Centralized API Management**: Single service for all HTTP operations
- **Automatic Headers**: Content-Type and Authorization headers
- **Error Handling**: Consistent error handling across all API calls
- **Type Safety**: Full TypeScript support with interfaces

### 5. LocalStorage Management
- **Token Storage**: Secure token storage with fallback for SSR
- **User Data**: Complete user profile information stored
- **Automatic Cleanup**: Logout clears all stored data

## API Endpoints

### Base URL
```
Development: http://localhost:3100/api
Production: https://your-production-api.com/api
```

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "Admin",
    "department": "IT",
    "joinDate": "2023-01-15",
    "status": "Active"
  }
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_here",
  "newPassword": "newpassword123"
}
```

## Demo Credentials (for testing)

When the API is not available, the system falls back to demo data:

- **Email**: `john.doe@example.com` | **Password**: `password123`
- **Email**: `jane.smith@example.com` | **Password**: `password123`

## File Structure

```
src/
├── app/
│   ├── features/
│   │   └── auth/
│   │       ├── services/
│   │       │   └── auth.service.ts          # Main authentication service
│   │       ├── guards/
│   │       │   └── auth.guard.ts            # Route protection
│   │       └── components/
│   │           ├── login/                    # Login form
│   │           ├── forgot-password/          # Password reset request
│   │           └── reset-password/           # Password reset form
│   └── shared/
│       ├── services/
│       │   ├── api.service.ts               # Centralized API service
│       │   └── demo-data.service.ts         # Demo data for testing
│       └── interceptors/
│           └── auth.interceptor.ts          # HTTP interceptor
├── environments/
│   ├── environment.ts                       # Development config
│   └── environment.prod.ts                  # Production config
```

## Usage Examples

### Making API Calls

```typescript
import { ApiService } from '../shared/services/api.service';

constructor(private apiService: ApiService) {}

// GET request
this.apiService.get<User[]>('/users').subscribe(users => {
  console.log(users);
});

// POST request
this.apiService.post<User>('/users', userData).subscribe(user => {
  console.log('User created:', user);
});
```

### Authentication Check

```typescript
import { AuthService } from '../features/auth/services/auth.service';

constructor(private authService: AuthService) {}

// Check if user is logged in
if (this.authService.isAuthenticated()) {
  // User is authenticated
}

// Get current user
const user = this.authService.getUser();

// Logout
this.authService.logout();
```

## Security Features

1. **JWT Token Storage**: Secure token storage in localStorage
2. **Automatic Token Injection**: All API requests include Authorization header
3. **Route Protection**: Unauthorized access automatically redirected
4. **Automatic Logout**: 401/403 responses trigger immediate logout
5. **Data Cleanup**: Logout clears all stored authentication data

## Error Handling

The system automatically handles common authentication errors:

- **401 Unauthorized**: User redirected to login
- **403 Forbidden**: User redirected to login
- **Network Errors**: Fallback to demo data for testing
- **Validation Errors**: Form-level error display

## Testing

1. **Start the application**: `ng serve`
2. **Navigate to login**: `/login`
3. **Use demo credentials**: See demo credentials section above
4. **Test protected routes**: Navigate to `/admin/dashboard`
5. **Test logout**: Click logout button in navbar

## Configuration

### Environment Variables

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3100/api'  // Your API base URL
};
```

### Production Configuration

Update `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://your-production-api.com/api'
};
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your API allows requests from your frontend domain
2. **401/403 Errors**: Check if the token is valid and not expired
3. **Network Errors**: Verify the API server is running and accessible
4. **Demo Mode**: If API calls fail, the system automatically uses demo data

### Debug Mode

Enable console logging by checking the browser console for:
- API call attempts
- Fallback to demo service warnings
- Authentication state changes
- Route guard activations

## Future Enhancements

1. **Token Refresh**: Implement automatic token refresh before expiration
2. **Remember Me**: Add persistent login option
3. **Multi-factor Authentication**: Support for 2FA
4. **Session Management**: Track active sessions across devices
5. **Audit Logging**: Log authentication events for security monitoring
