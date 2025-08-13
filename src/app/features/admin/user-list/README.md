# User List Component - API Integration

## Overview
This component integrates with the user listing API to provide a comprehensive user management interface with filtering, pagination, and sorting capabilities.

## API Endpoint
```
GET http://localhost:3100/api/users?page=1&limit=10&search=john&sortBy=createdAt&sortOrder=desc
```

## Features

### 1. Search Functionality
- Real-time search with 500ms debouncing
- Searches across user names and emails
- Updates results automatically as you type

### 2. Status Filtering
- Filter by All, Active, or Inactive users
- Applied on the client-side for immediate results
- Resets to page 1 when filter changes

### 3. Sorting
- Sortable columns: User Name, Email, Created Date
- Toggle between ascending and descending order
- Visual indicators for sort direction

### 4. Pagination
- Configurable page size (default: 10 users per page)
- Smart page navigation with ellipsis
- Previous/Next navigation buttons

### 5. Real-time Updates
- Refresh button to reload data
- Loading states with spinner
- Error handling with user-friendly messages

## API Response Structure
```typescript
interface UserListResponse {
  code: number;
  status: string;
  data: User[];
  timestamp: string;
  path: string;
}

interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string | null;
  mobilenumber: string;
  addressline1: string;
  addressline2: string;
  city: string;
  state: string;
  center: string;
  pincode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Query Parameters
- `page`: Page number (default: 1)
- `limit`: Number of users per page (default: 10)
- `search`: Search term for filtering users
- `sortBy`: Field to sort by (firstname, email, createdAt)
- `sortOrder`: Sort direction (asc, desc)

## Usage
The component automatically loads users on initialization and provides methods for:
- `loadUsers()`: Load users with current filters
- `refreshUsers()`: Refresh the current data
- `onSearchChange()`: Handle search input changes
- `onStatusFilterChange()`: Handle status filter changes
- `onSort()`: Handle column sorting
- `onPageChange()`: Handle pagination

## Dependencies
- Angular Common Module
- Angular Router Module
- Angular Forms Module
- RxJS for reactive programming
- UserService for API communication
- ApiService for HTTP requests

## Styling
The component includes responsive design with:
- Loading spinners
- Error message styling
- Sortable column indicators
- Responsive table layout
- Mobile-friendly filters
