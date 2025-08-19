import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RolesListComponent } from './roles-list/roles-list.component';
import { RoleFormComponent } from './components/role-form/role-form.component';
import { RolesService } from './services/roles.service';
import { PermissionsService } from './services/permissions.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: RolesListComponent }
    ])
  ],
  providers: [RolesService, PermissionsService]
})
export class RolesModule { }
