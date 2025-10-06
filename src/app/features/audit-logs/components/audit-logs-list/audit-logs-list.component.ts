import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogsService, AuditLog } from '../../services/audit-logs.service';
import { PermissionService } from '../../../../shared/services/permission.service';

@Component({
  selector: 'app-audit-logs-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs-list.component.html',
  styleUrls: ['./audit-logs-list.component.scss']
})
export class AuditLogsListComponent implements OnInit {
  logs: AuditLog[] = [];
  page = 1;
  limit = 10;
  total = 0;
  module = '';
  action = '';
  selectedModule: string | null = null;
  modules: { key: string; label: string; icon?: string }[] = [
    { key: 'users', label: 'Users', icon: 'fas fa-users' },
    { key: 'attendance', label: 'Attendance', icon: 'fas fa-user-check' },
    { key: 'leave', label: 'Leave', icon: 'fas fa-calendar-alt' },
    { key: 'holiday', label: 'Holidays', icon: 'fas fa-calendar-day' },
    { key: 'tour', label: 'Tours', icon: 'fas fa-map-marked-alt' },
    { key: 'timelog', label: 'Time Logs', icon: 'fas fa-clock' },
    { key: 'reports', label: 'Reports', icon: 'fas fa-chart-line' },
    { key: 'roles', label: 'Roles', icon: 'fas fa-user-shield' },
    { key: 'permissions', label: 'Permissions', icon: 'fas fa-key' },
  ];

  constructor(private auditLogsService: AuditLogsService, private permissionService: PermissionService) {}

  ngOnInit(): void {
    if (this.permissionService.hasPermission('audit', 'list')) {
      // Initially show module picker; do not fetch until a module is selected
    }
  }

  get totalPages(): number {
    const pages = Math.ceil((this.total || 0) / (this.limit || 1));
    return pages > 0 ? pages : 1;
  }

  fetch(): void {
    this.auditLogsService
      .list({ module: this.module || undefined, action: this.action || undefined, page: this.page, limit: this.limit })
      .subscribe((res : any) => {
        this.logs = res?.data?.data;
        this.total = res.pagination?.total;
      });
  }

  onFiltersChange(): void {
    this.page = 1;
    this.fetch();
  }

  visibleModules(): { key: string; label: string; icon?: string }[] {
    // Show modules the user likely cares about. If you want to filter based on permission per module, check for list/read.
    return this.modules.filter(m => this.permissionService.hasPermission('audit', 'list'));
  }

  selectModule(moduleKey: string): void {
    this.selectedModule = moduleKey;
    this.module = moduleKey;
    this.page = 1;
    this.fetch();
  }

  clearModule(): void {
    this.selectedModule = null;
    this.module = '';
    this.logs = [];
    this.total = 0;
    this.page = 1;
  }
}


