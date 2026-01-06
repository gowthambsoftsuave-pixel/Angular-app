import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SharedModule } from '../shared/shared.module';
import { TaskComponent } from './task.component';
import { TaskRoutingModule } from './task-routing.module';

@NgModule({
  declarations: [TaskComponent],
  imports: [CommonModule, FormsModule, SharedModule, TaskRoutingModule]
})
export class TaskModule {}
