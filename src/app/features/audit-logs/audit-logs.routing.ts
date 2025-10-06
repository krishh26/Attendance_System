import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuditLogsListComponent } from './components/audit-logs-list/audit-logs-list.component';
import { AuthGuard } from '../../features/auth/guards/auth.guard';

const routes: Routes = [
  { path: '', component: AuditLogsListComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditLogsRoutingModule {}


