# Leave Management System

## Overview
This module provides a comprehensive leave management system for the Attendance System, including leave request listing, filtering, and management capabilities.

## Features

### 1. Leave Request Listing
- **API Integration**: Connects to `GET /api/leave-management/leave-requests`
- **Real-time Data**: Fetches live data from the backend API
- **Fallback Support**: Automatically falls back to demo data if API is unavailable
- **Pagination**: Supports server-side pagination with configurable page sizes

### 2. Advanced Filtering
- **Status Filter**: Filter by pending, approved, rejected, or cancelled requests
- **Leave Type Filter**: Filter by annual, casual, sick, full-day, half-day, or other types
- **Date Range Filter**: Filter by start and end dates
- **Half Day Filter**: Filter by full-day or half-day requests
- **Search**: Text-based search across leave requests

### 3. User Experience
- **Loading States**: Visual feedback during API calls
- **Error Handling**: Graceful error handling with retry options
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Automatic data refresh capabilities

## API Integration

### Endpoint
```
GET /api/leave-management/leave-requests
```

### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status
- `leaveType` (optional): Filter by leave type
- `userId` (optional): Filter by specific user ID
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)
- `isHalfDay` (optional): Filter by half day (true/false)
- `approvedBy` (optional): Filter by approver ID

### Response Format
```json
{
  "code": 200,
  "status": "OK",
  "data": {
    "code": 200,
    "status": "OK",
    "data": [
      {
        "_id": "689b938d99c3f9c566499f04",
        "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "leaveType": "annual",
        "startDate": "2024-01-15T00:00:00.000Z",
        "endDate": "2024-01-17T00:00:00.000Z",
        "reason": "Family vacation",
        "status": "approved",
        "isHalfDay": false,
        "halfDayType": "morning",
        "totalDays": 3,
        "notes": "Approved with notes",
        "createdAt": "2025-08-12T19:18:37.600Z",
        "updatedAt": "2025-08-12T19:20:18.939Z",
        "approvedAt": "2025-08-12T19:20:18.938Z",
        "approvedBy": "64f8a1b2c3d4e5f6a7b8c9d0"
      }
    ],
    "timestamp": "2025-08-14T10:00:21.475Z",
    "path": "/api/leave-management/leave-requests"
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "timestamp": "2025-08-14T10:00:21.475Z",
  "path": "/api/leave-management/leave-requests?page=1&limit=10"
}
```

## Leave Types

| Type | Description |
|------|-------------|
| `full-day` | Full day leave |
| `half-day` | Half day leave |
| `sick` | Sick leave |
| `casual` | Casual leave |
| `annual` | Annual leave |
| `other` | Other types |

## Status Types

| Status | Description |
|--------|-------------|
| `pending` | Awaiting approval |
| `approved` | Leave approved |
| `rejected` | Leave rejected |
| `cancelled` | Leave cancelled |

## Components

### LeaveListComponent
Main component for displaying and managing leave requests.

**Features:**
- API integration with fallback to demo data
- Advanced filtering and search
- Pagination support
- Loading and error states
- Responsive design

**Key Methods:**
- `loadLeaveRequests()`: Fetches data from API
- `onSearchChange()`: Handles search input with debouncing
- `onStatusFilterChange()`: Handles status filter changes
- `onPageChange()`: Handles pagination
- `clearFilters()`: Resets all filters

## Services

### LeaveService
Primary service for API communication.

**Methods:**
- `getLeaveRequests(params)`: Fetch leave requests with filters
- `getLeaveRequestById(id)`: Get specific leave request
- `createLeaveRequest(data)`: Create new leave request
- `updateLeaveRequest(id, data)`: Update existing request
- `deleteLeaveRequest(id)`: Delete leave request
- `approveLeaveRequest(id, notes)`: Approve leave request
- `rejectLeaveRequest(id, notes)`: Reject leave request

### DemoLeaveService
Fallback service providing demo data when API is unavailable.

**Features:**
- Realistic sample data
- Simulated API delays
- Pagination support
- Console logging for debugging

## Usage

### 1. Navigate to Leave Management
```
/admin/leave/list
```

### 2. Use Filters
- Select status from dropdown
- Choose leave type
- Set date range
- Filter by half-day status
- Use search for text-based filtering

### 3. Pagination
- Navigate through pages
- Change page size
- View total results count

### 4. Actions
- View leave request details
- Edit pending requests
- Delete pending requests
- Approve/reject pending requests

## Configuration

### Environment Setup
The API base URL is configured in `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://3.111.188.121:3100/api'
};
```

### Authentication
The system automatically includes authentication headers via the `AuthInterceptor`.

## Demo Mode

When the API is unavailable, the system automatically switches to demo mode:
- Console warnings indicate fallback usage
- Sample data is displayed
- All functionality remains available
- Simulated API delays for realistic experience

## Responsive Design

The interface is fully responsive with:
- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly controls
- Optimized table display for small screens

## Future Enhancements

1. **Leave Request Creation**: Add form for creating new leave requests
2. **Bulk Operations**: Support for bulk approve/reject
3. **Export Functionality**: Export leave data to CSV/PDF
4. **Calendar View**: Calendar-based leave visualization
5. **Notifications**: Real-time notifications for leave status changes
6. **Approval Workflow**: Multi-level approval processes
7. **Leave Balance**: Track and display leave balances
8. **Reports**: Generate leave analytics and reports

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check network connectivity
   - Verify API server status
   - Review console for error details
   - System automatically falls back to demo data

2. **Filters Not Working**
   - Ensure all required parameters are set
   - Check browser console for errors
   - Verify API endpoint availability

3. **Pagination Issues**
   - Check total count from API response
   - Verify page size configuration
   - Review pagination logic in component

### Debug Mode

Enable console logging to see:
- API call attempts and responses
- Fallback to demo service warnings
- Filter parameter changes
- Pagination calculations

## Dependencies

- Angular 19+
- RxJS for reactive programming
- Angular Forms for filter controls
- Angular Common for directives
- Shared services (ApiService, AuthInterceptor)
