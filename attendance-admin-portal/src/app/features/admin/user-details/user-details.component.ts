import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
  profileImage: string;
  phone: string;
  address: string;
  emergencyContact: string;
  skills: string[];
  recentActivity: {
    type: string;
    date: string;
    description: string;
  }[];
}

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class UserDetailsComponent implements OnInit {
  userId!: number;
  user: UserDetail = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    department: 'IT',
    joinDate: '2023-01-15',
    status: 'Active',
    profileImage: 'https://ui-avatars.com/api/?name=John+Doe',
    phone: '+1 234 567 890',
    address: '123 Main St, City, Country',
    emergencyContact: 'Jane Doe (+1 234 567 891)',
    skills: ['JavaScript', 'Angular', 'Node.js', 'SQL', 'Project Management'],
    recentActivity: [
      {
        type: 'login',
        date: '2024-03-15 09:00',
        description: 'Logged in to the system'
      },
      {
        type: 'update',
        date: '2024-03-14 15:30',
        description: 'Updated profile information'
      },
      {
        type: 'leave',
        date: '2024-03-13 11:20',
        description: 'Submitted leave request'
      }
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    // In a real app, you would fetch user details using the ID
  }

  goBack() {
    this.router.navigate(['/admin/user-list']);
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'login':
        return 'fas fa-sign-in-alt';
      case 'update':
        return 'fas fa-edit';
      case 'leave':
        return 'fas fa-calendar-alt';
      default:
        return 'fas fa-info-circle';
    }
  }
}
