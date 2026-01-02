import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MaterialModule } from './material.module';
import { TableComponent } from './table/table.component';
import { ProjectEditDialogComponent } from '../shared/project-edit-dialog/project-edit-dialog.component';
import { PersonEditDialogComponent } from './person-edit-dialog/person-edit-dialog.component';

@NgModule({
  declarations: [
    TableComponent,
    ProjectEditDialogComponent,
    PersonEditDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule
  ],
  exports: [
    TableComponent,
    ProjectEditDialogComponent,
    MaterialModule,
    PersonEditDialogComponent
  ]
})
export class SharedModule {}
