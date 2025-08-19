import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { AuthGuard } from './features/auth/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: 'admin',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
      },
      {
        path: 'leave',
        loadChildren: () => import('./features/leave-management/leave-management.module').then(m => m.LeaveManagementModule)
      },
      {
        path: 'holiday',
        loadChildren: () => import('./features/holiday-management/holiday-management.module').then(m => m.HolidayManagementModule)
      },
      {
        path: 'timelog',
        loadChildren: () => import('./features/timelog/timelog.module').then(m => m.TimelogModule)
      },
      {
        path: 'roles',
        loadChildren: () => import('./features/roles/roles.module').then(m => m.RolesModule)
      },
      {
        path: 'tour',
        loadChildren: () => import('./features/tour-management/tour-management.module').then(m => m.TourManagementModule)
      }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
