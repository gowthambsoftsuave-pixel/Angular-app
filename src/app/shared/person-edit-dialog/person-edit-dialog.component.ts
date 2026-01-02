import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PersonDto, PersonUpdateDto } from '../dtos/api.dtos';

export interface PersonEditDialogData {
  person: PersonDto;
}

@Component({
  selector: 'app-person-edit-dialog',
  standalone:false,
  templateUrl: './person-edit-dialog.component.html',
  styleUrls: ['./person-edit-dialog.component.scss']
})
export class PersonEditDialogComponent {
  model: PersonUpdateDto;

  constructor(
    private dialogRef: MatDialogRef<PersonEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PersonEditDialogData
  ) {
    this.model = {
      name: data.person.name,
      role: data.person.role,
      isActive: data.person.isActive
    };
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    this.dialogRef.close(this.model);
  }
}
