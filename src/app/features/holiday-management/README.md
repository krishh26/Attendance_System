# Holiday Management Module

This module provides comprehensive holiday management functionality for the Attendance System.

## Features

- **List Holidays**: View all holidays with filtering and search capabilities
- **Add Holiday**: Create new company holidays with name, date, description, and options
- **Edit Holiday**: Modify existing holiday details
- **Delete Holiday**: Remove holidays from the system
- **Toggle Status**: Activate/deactivate holidays
- **Filter Options**: Filter by year, status, and holiday type
- **Search**: Search holidays by name or description

## Components

### HolidayListComponent
Main component that handles the holiday list display and management.

**Key Features:**
- Responsive design with mobile support
- Real-time filtering and search
- Form validation
- Error handling
- Loading states

## Services

### HolidayService
Handles all API communication for holiday operations.

**API Endpoints:**
- `GET /leave-management/holidays` - Get all holidays
- `GET /leave-management/holidays/year/{year}` - Get holidays by year
- `GET /leave-management/holidays/{id}` - Get holiday by ID
- `POST /leave-management/holidays` - Create new holiday
- `PUT /leave-management/holidays/{id}` - Update holiday
- `DELETE /leave-management/holidays/{id}` - Delete holiday

## Data Models

### Holiday Interface
```typescript
interface Holiday {
  _id: string;
  name: string;
  date: string;
  description: string;
  isActive: boolean;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### CreateHolidayDto
```typescript
interface CreateHolidayDto {
  name: string;
  date: string;
  description: string;
  isActive: boolean;
  isOptional: boolean;
}
```

## Usage

1. Navigate to `/admin/holiday/list`
2. Use the filters to narrow down holidays by year, status, or type
3. Search for specific holidays using the search bar
4. Click "Add Holiday" to create new holidays
5. Use action buttons to edit, toggle status, or delete holidays

## Styling

The component uses SCSS with:
- Responsive grid layouts
- Modern card-based design
- Consistent color scheme
- Hover effects and transitions
- Mobile-first approach

## Dependencies

- Angular Common Module
- Angular Forms Module
- Angular Router
- RxJS for reactive programming
- Font Awesome for icons
