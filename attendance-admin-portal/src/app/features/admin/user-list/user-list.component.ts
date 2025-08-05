import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
  profileImage: string;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class UserListComponent {
  users: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      department: 'IT',
      joinDate: '2023-01-15',
      status: 'Active',
      profileImage: 'https://ui-avatars.com/api/?name=John+Doe'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Manager',
      department: 'HR',
      joinDate: '2023-02-20',
      status: 'Active',
      profileImage: 'https://ui-avatars.com/api/?name=Jane+Smith'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.j@example.com',
      role: 'Employee',
      department: 'Finance',
      joinDate: '2023-03-10',
      status: 'Inactive',
      profileImage: 'https://ui-avatars.com/api/?name=Mike+Johnson'
    },
    {
      id: 4,
      name: 'Sarah Williams',
      email: 'sarah.w@example.com',
      role: 'Employee',
      department: 'Marketing',
      joinDate: '2023-04-05',
      status: 'Active',
      profileImage: 'https://ui-avatars.com/api/?name=Sarah+Williams'
    },
    {
      id: 5,
      name: 'David Brown',
      email: 'david.b@example.com',
      role: 'Manager',
      department: 'Operations',
      joinDate: '2023-05-15',
      status: 'Active',
      profileImage: 'https://ui-avatars.com/api/?name=David+Brown'
    }
  ];

  constructor(private router: Router) {}

  viewUserDetails(userId: number) {
    this.router.navigate(['/admin/users/details', userId]);
  }

  getStatusClass(status: string): string {
    return status === 'Active' ? 'status-active' : 'status-inactive';
  }
}
