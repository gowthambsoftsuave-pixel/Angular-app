import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectComponent } from './project.component';
import { ProjectDeleteComponent } from './projectdelete/projectdelete.component';
import { ProjectDetailsComponent } from './projectdetails/projectdetails.component';

import { AccessGuard } from '../auth/access.guard';

const routes: Routes = [
  { path: '', component: ProjectComponent },

  // Only Admin can delete a project
  {
    path: 'delete/:id',
    component: ProjectDeleteComponent,
    canActivate: [AccessGuard],
    data: { roles: ['Admin'] }
  },

  // Everyone logged-in can view details (adjust if needed)
  { path: ':id', component: ProjectDetailsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectRoutingModule {}
