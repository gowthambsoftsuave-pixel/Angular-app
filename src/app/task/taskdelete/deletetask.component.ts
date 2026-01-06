import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  okText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title ?? 'Confirm' }}</h2>

    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close(false)">
        {{ data.cancelText ?? 'Cancel' }}
      </button>

      <button mat-raised-button color="warn" type="button" (click)="close(true)">
        {{ data.okText ?? 'Delete' }}
      </button>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  close(v: boolean) {
    this.dialogRef.close(v);
  }
}
