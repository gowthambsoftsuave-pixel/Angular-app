import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MaterialModule } from './material.module';
import { TableComponent } from './table/table.component';
import { GenericDialogComponent } from './generic-dialog/generic-dialog.component';

@NgModule({
  declarations: [
    TableComponent,
    GenericDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule
  ],
  exports: [
    TableComponent,
    GenericDialogComponent,
    MaterialModule
  ]
})
export class SharedModule {}
