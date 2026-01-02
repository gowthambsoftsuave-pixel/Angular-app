import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProjectDto, ProjectUpdateDto } from '../dtos/api.dtos';

export interface ProjectEditDialogData {
  project: ProjectDto;
}

@Component({
  selector: 'app-project-edit-dialog',
  standalone:false,
  templateUrl: './project-edit-dialog.component.html',
  styleUrls: ['./project-edit-dialog.component.scss']
})
export class ProjectEditDialogComponent {
  model: ProjectUpdateDto;

  constructor(
    private dialogRef: MatDialogRef<ProjectEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProjectEditDialogData
  ) {
    this.model = {
      projectName: data.project.projectName,
      isCompleted: data.project.isCompleted
    };
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    this.dialogRef.close(this.model);
  }
}
