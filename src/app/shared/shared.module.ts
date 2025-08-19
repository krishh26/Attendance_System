import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { PermissionService } from './services/permission.service';
import { PermissionDirective } from './directives/permission.directive';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    PermissionDirective
  ],
  providers: [PermissionService],
  exports: [PermissionDirective]
})
export class SharedModule { }
