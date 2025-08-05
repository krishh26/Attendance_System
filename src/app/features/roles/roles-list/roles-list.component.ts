import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Permission {
  id: number;
  name: string;
  module: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  usersCount: number;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class RolesListComponent {
  roles: Role[] = [
    {
      id: 1,
      name: 'Admin',
      description: 'Full system access',
      usersCount: 5,
      permissions: [
        { id: 1, name: 'Create', module: 'Users' },
        { id: 2, name: 'Edit', module: 'Users' },
        { id: 3, name: 'Delete', module: 'Users' },
        { id: 4, name: 'View', module: 'Reports' }
      ],
      isActive: true,
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      name: 'Manager',
      description: 'Department management access',
      usersCount: 8,
      permissions: [
        { id: 1, name: 'View', module: 'Users' },
        { id: 2, name: 'Edit', module: 'Attendance' },
        { id: 3, name: 'View', module: 'Reports' }
      ],
      isActive: true,
      createdAt: '2024-01-15'
    },
    {
      id: 3,
      name: 'Employee',
      description: 'Basic user access',
      usersCount: 25,
      permissions: [
        { id: 1, name: 'View', module: 'Profile' },
        { id: 2, name: 'Edit', module: 'Profile' }
      ],
      isActive: true,
      createdAt: '2024-01-20'
    }
  ];

  // Summary statistics
  summaryStats = {
    totalRoles: 5,
    activeRoles: 4,
    totalPermissions: 15,
    usersWithRoles: 38
  };

  getPermissionGroups(permissions: Permission[]): { [key: string]: Permission[] } {
    return permissions.reduce((groups: { [key: string]: Permission[] }, permission) => {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }
      groups[permission.module].push(permission);
      return groups;
    }, {});
  }
}
