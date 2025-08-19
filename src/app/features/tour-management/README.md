# Tour Management Module

This module provides comprehensive tour management functionality for the Attendance System, allowing administrators to create, manage, and track employee site visits and tours.

## Features

- **List Tours**: View all tours with advanced filtering, search, and pagination
- **Create Tour**: Assign new site visits to employees with detailed information
- **Edit Tour**: Modify existing tour details and assignments
- **Delete Tour**: Remove tours from the system
- **Tour Details**: Comprehensive view of tour information with status timeline
- **Status Management**: Update tour status with notes and tracking
- **Employee Assignment**: Assign tours to specific employees
- **Document Management**: Attach and manage tour-related documents
- **Timeline View**: Visual status history with complete audit trail

## Components

### TourListComponent
Main component for displaying and managing the tour list.

**Key Features:**
- Responsive table with employee information
- Advanced filtering by status, date range, and assigned employee
- Real-time search functionality
- Pagination with configurable page sizes
- Action buttons for view, edit, and delete operations

### TourFormComponent
Form component for creating and editing tours.

**Key Features:**
- Employee selection dropdown
- Form validation with error messages
- Date and time picker for expected visit time
- Notes fields for employee and admin use
- Responsive design for mobile devices

### TourDetailsComponent
Detailed view component with tour information and timeline.

**Key Features:**
- Complete tour information display
- Employee details with avatar
- Document management interface
- Status timeline with visual indicators
- Status update functionality
- Responsive grid layout

## Services

### TourService
Handles all API communication for tour operations.

**API Endpoints:**
- `GET /tour-management/tours` - Get all tours with pagination and filters
- `GET /tour-management/tours/{id}` - Get tour by ID
- `POST /tour-management/tours` - Create new tour
- `PATCH /tour-management/tours/{id}` - Update tour
- `PATCH /tour-management/tours/{id}/status` - Update tour status
- `DELETE /tour-management/tours/{id}` - Delete tour

**Helper Methods:**
- `getAvailableStatuses()` - Get all possible tour statuses
- `getStatusDisplayName(status)` - Get human-readable status names
- `getStatusBadgeClass(status)` - Get CSS classes for status badges

## Data Models

### Tour Interface
```typescript
interface Tour {
  _id: string;
  assignedTo: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  createdBy: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  purpose: string;
  location: string;
  expectedTime: Date;
  documents: TourDocument[];
  userNotes?: string;
  status: string;
  statusHistory: TourStatusHistory[];
  adminNotes?: string;
  actualVisitTime?: Date;
  completionNotes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Tour Status History
```typescript
interface TourStatusHistory {
  status: string;
  changedBy: string;
  changedByName: string;
  notes?: string;
  changedAt: Date;
}
```

### Tour Document
```typescript
interface TourDocument {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}
```

## Tour Statuses

The system supports the following tour statuses:
- **Pending**: Tour is created but not yet assigned
- **Assigned**: Tour is assigned to an employee
- **In Progress**: Employee is currently on the tour
- **Completed**: Tour has been successfully completed
- **Cancelled**: Tour was cancelled
- **Approved**: Tour completion has been approved
- **Rejected**: Tour completion was rejected

## Usage

### Navigation
1. Navigate to `/admin/tour/list` to view all tours
2. Click "Create Tour" to assign a new site visit
3. Use action buttons to view details, edit, or delete tours
4. Click on tour details to see comprehensive information and timeline

### Creating a Tour
1. Select an employee from the dropdown
2. Enter the purpose of the site visit
3. Specify the location address
4. Set the expected visit time
5. Add optional notes for employee and admin use
6. Submit the form

### Managing Tour Status
1. View tour details to see current status
2. Click "Update Status" to change tour status
3. Select new status from available options
4. Add optional notes about the status change
5. Submit to update the tour

### Filtering and Search
- Use the search bar to find tours by purpose, location, or employee
- Filter by status to see tours in specific states
- Use date range filters to narrow down by time period
- Clear all filters to reset the view

## Styling

The module uses SCSS with:
- Responsive grid layouts for different screen sizes
- Modern card-based design with shadows and borders
- Consistent color scheme matching the application theme
- Interactive elements with hover effects and transitions
- Mobile-first responsive design approach
- Timeline visualization for status history

## Dependencies

- Angular Common Module
- Angular Forms Module (Template-driven and Reactive)
- Angular Router for navigation
- RxJS for reactive programming and HTTP requests
- Font Awesome for icons
- Custom API service for backend communication

## Responsive Design

All components are fully responsive and work on:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile devices (up to 767px)

The layout automatically adjusts based on screen size, with mobile-optimized forms and navigation.

## Error Handling

The module includes comprehensive error handling:
- API error responses with user-friendly messages
- Form validation with real-time feedback
- Loading states for all async operations
- Success messages for completed actions
- Graceful fallbacks for failed operations

## Security

- All endpoints require valid JWT authentication
- Admin-only access to tour management features
- Input validation and sanitization
- Secure file handling for document uploads
