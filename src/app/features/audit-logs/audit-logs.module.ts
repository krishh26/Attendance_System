import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLogsListComponent } from './components/audit-logs-list/audit-logs-list.component';
import { AuditLogsRoutingModule } from './audit-logs.routing';

@NgModule({
  declarations: [],
  imports: [CommonModule, AuditLogsRoutingModule, AuditLogsListComponent],
})
export class AuditLogsModule {}


