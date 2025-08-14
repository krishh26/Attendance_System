# Leave List Component - Status Update Feature

## Overview
This component now includes a status update functionality that allows users to approve, reject, or cancel leave requests through a modal interface.

## New Features

### Status Update Button
- Added a new status button (gear icon) in the actions column of each leave request
- Clicking the button opens a status update modal
- The button is available for all leave requests regardless of their current status

### Status Update Modal
The modal includes:
- **Leave Request Details**: Shows comprehensive information about the selected leave request
- **Status Selection**: Dropdown to choose between Approve, Reject, or Cancel
- **Notes Field**: Optional text area for additional comments
- **Rejection Reason**: Conditional field that appears only when "Reject" is selected
- **Form Validation**: Ensures required fields are filled

### API Integration
- Uses the new `updateLeaveRequestStatus` method in the LeaveService
- Calls the endpoint: `PATCH /api/leave-management/leave-requests/{id}/status`
- Sends data in the format:
  ```json
  {
    "status": "approved|rejected|cancelled",
    "notes": "Optional notes",
    "rejectionReason": "Optional rejection reason (only for rejected status)"
  }
  ```

## Component Structure

### Files Added
- `status-update-modal/status-update-modal.component.ts` - Modal component logic
- `status-update-modal/status-update-modal.component.html` - Modal template
- `status-update-modal/status-update-modal.component.scss` - Modal styles

### Files Modified
- `leave-list.component.ts` - Added modal state management and API calls
- `leave-list.component.html` - Added status button and modal
- `leave-list.component.scss` - Added status button styling
- `leave.service.ts` - Added `updateLeaveRequestStatus` method

## Usage

1. **Open Status Modal**: Click the gear icon (⚙️) in the actions column
2. **Select New Status**: Choose from Approve, Reject, or Cancel
3. **Add Notes**: Optionally add notes or comments
4. **Add Rejection Reason**: If rejecting, optionally provide a reason
5. **Submit**: Click "Update Status" to save changes
6. **Confirmation**: The modal closes and the list refreshes automatically

## Styling

### Status Button
- Uses a gear icon (fas fa-cog)
- Hover color: #17a2b8 (info blue)
- Consistent with other action buttons

### Modal Design
- Responsive design with max-width of 700px
- Clean, modern interface matching the existing design system
- Proper spacing and typography hierarchy
- Status-specific color coding for badges

## Error Handling
- API errors are displayed in the modal
- Loading states prevent multiple submissions
- Form validation ensures data integrity
- Graceful fallback to demo mode if API is unavailable

## Responsive Design
- Modal adapts to different screen sizes
- Mobile-friendly form layout
- Touch-friendly button sizes
- Proper overflow handling for small screens
