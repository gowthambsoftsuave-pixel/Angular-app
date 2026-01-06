import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TaskComponent } from './task.component';
import { AccessGuard } from '../auth/access.guard';

const routes: Routes = [
  { path: '', component: TaskComponent, canActivate: [AccessGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaskRoutingModule {}
