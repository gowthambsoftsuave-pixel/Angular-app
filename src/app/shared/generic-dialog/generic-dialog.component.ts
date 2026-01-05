import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export type DialogMode = 'create' | 'edit' | 'view';

export interface DialogOption {
  value: any;
  label: string;
}

export interface DialogField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  options?: DialogOption[];
  readonly?: boolean;

  min?: number;
  max?: number;
  step?: number;
}

export interface GenericDialogData {
  title: string;
  mode: DialogMode;
  fields: DialogField[];
  model: any;

  onSave?: (dto: any) => any;

  validate?: (dto: any) => string | null;
}

@Component({
  selector: 'app-generic-dialog',
  standalone: false,
  templateUrl: './generic-dialog.component.html',
  styleUrls: ['./generic-dialog.component.scss']
})
export class GenericDialogComponent {
  dto: any = {};
  errorMsg = '';

  constructor(
    private dialogRef: MatDialogRef<GenericDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GenericDialogData
  ) {
    this.dto = { ...(data?.model ?? {}) };
  }

  isReadOnly(f: DialogField): boolean {
    return this.data.mode === 'view' || !!f.readonly;
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

    save(): void {
  this.errorMsg = '';

  if (this.data.mode === 'view') {
    this.dialogRef.close(null);
    return;
  }

  const payload = { ...this.dto };

  try {
    const r = this.data.onSave?.(payload);

    if (r && typeof r.subscribe === 'function') {
      r.subscribe({
        next: () => this.dialogRef.close(payload),
        error: (err: any) => {
          const msg =
            err?.error?.message ??
            err?.error ??
            err?.message ??
            'Save failed';

          this.errorMsg = msg;

          // IMPORTANT: tell parent it was an API error
          this.dialogRef.close({ __error: true, message: msg });
        }
      });
      return;
    }

    if (r && typeof r.then === 'function') {
      r.then(() => this.dialogRef.close(payload)).catch((err: any) => {
        const msg = err?.message ?? 'Save failed';
        this.errorMsg = msg;
        this.dialogRef.close({ __error: true, message: msg });
      });
      return;
    }

    this.dialogRef.close(payload);
  } catch (e: any) {
    const msg = e?.message ?? 'Save failed';
    this.errorMsg = msg;
    this.dialogRef.close({ __error: true, message: msg });
  }
}


}
