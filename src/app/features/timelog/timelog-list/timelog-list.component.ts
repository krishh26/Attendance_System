import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TimeEntry {
  id: number;
  employeeName: string;
  date: string;
  timeIn: string;
  timeOut: string;
  totalHours: number;
  status: 'Present' | 'Late' | 'Early Leave' | 'Absent';
  notes?: string;
}

@Component({
  selector: 'app-timelog-list',
  templateUrl: './timelog-list.component.html',
  styleUrls: ['./timelog-list.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class TimelogListComponent {
  timeEntries: TimeEntry[] = [
    {
      id: 1,
      employeeName: 'John Doe',
      date: '2024-03-15',
      timeIn: '09:00',
      timeOut: '18:00',
      totalHours: 9,
      status: 'Present',
      notes: 'Regular day'
    },
    {
      id: 2,
      employeeName: 'Jane Smith',
      date: '2024-03-15',
      timeIn: '09:30',
      timeOut: '18:00',
      totalHours: 8.5,
      status: 'Late',
      notes: 'Traffic delay'
    },
    {
      id: 3,
      employeeName: 'Mike Johnson',
      date: '2024-03-15',
      timeIn: '09:00',
      timeOut: '16:30',
      totalHours: 7.5,
      status: 'Early Leave',
      notes: 'Doctor appointment'
    }
  ];

  // Summary statistics
  summaryStats = {
    totalEmployees: 25,
    presentToday: 22,
    lateToday: 3,
    absentToday: 2,
    averageHours: 8.5
  };

  getStatusClass(status: string): string {
    switch (status) {
      case 'Present':
        return 'status-present';
      case 'Late':
        return 'status-late';
      case 'Early Leave':
        return 'status-early';
      case 'Absent':
        return 'status-absent';
      default:
        return '';
    }
  }
}
