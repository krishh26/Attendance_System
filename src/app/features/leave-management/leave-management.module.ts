import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LeaveListComponent } from './leave-list/leave-list.component';
import { LeaveService } from './services/leave.service';
import { DemoLeaveService } from './services/demo-leave.service';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: LeaveListComponent }
    ])
  ],
  providers: [LeaveService, DemoLeaveService]
})
export class LeaveManagementModule { }
