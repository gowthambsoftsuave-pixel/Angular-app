import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ProjectDto } from '../dtos/api.dtos';

export interface ProjectSprintDialogData {
  project: ProjectDto;
}

@Component({
  selector: 'app-project-sprint-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './project-sprint-dialog.component.html',
  styleUrls: ['./project-sprint-dialog.component.scss']
})
export class ProjectSprintDialogComponent {
  newSprint: number;
  minSprint: number;

  constructor(
    private dialogRef: MatDialogRef<ProjectSprintDialogComponent, number | null>,
    @Inject(MAT_DIALOG_DATA) public data: ProjectSprintDialogData
  ) {
    this.minSprint = Number(data.project.currentSprintCount ?? 0);
    this.newSprint = this.minSprint;
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    const sprint = Number(this.newSprint);
    if (Number.isNaN(sprint)) return;
    if (sprint < this.minSprint) return;

    this.dialogRef.close(sprint);
  }
}
