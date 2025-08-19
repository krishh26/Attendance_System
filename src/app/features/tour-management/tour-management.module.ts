import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./tour-list/tour-list.component').then(m => m.TourListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./tour-form/tour-form.component').then(m => m.TourFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./tour-form/tour-form.component').then(m => m.TourFormComponent)
  },
  {
    path: 'details/:id',
    loadComponent: () => import('./tour-details/tour-details.component').then(m => m.TourDetailsComponent)
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class TourManagementModule { }
