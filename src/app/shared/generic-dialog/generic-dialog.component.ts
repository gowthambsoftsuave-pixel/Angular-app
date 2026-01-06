import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

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
  onSave?: (dto: any) => any; // Observable | Promise | sync
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
    @Inject(MAT_DIALOG_DATA) public data: GenericDialogData,
    private toastr: ToastrService
  ) {
    this.dto = { ...(data?.model ?? {}) };
  }

  isReadOnly(f: DialogField): boolean {
    return this.data.mode === 'view' || !!f.readonly;
  }

  showField(f: DialogField): boolean {
    const action = (this.dto?.action ?? '').toString();

    if (f.key === 'Status') return !action || action === 'status';
    if (f.key === 'newPersonId') return action === 'reassign';

    return true;
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

    // 1) Validation error => toast immediately + keep dialog open
    const validationMsg = this.data.validate?.(payload) ?? null;
    if (validationMsg) {
      this.errorMsg = validationMsg;
      this.toastr.error(validationMsg, 'Validation', { timeOut: 4000 });
      return;
    }

    try {
      const r = this.data.onSave?.(payload);

      // 2) Observable (HttpClient)
      if (r && typeof r.subscribe === 'function') {
        r.subscribe({
          next: () => this.dialogRef.close(payload),
          error: (err: any) => {
            const raw = err?.error;
            const msg =
              raw?.message ??
              (typeof raw === 'string' ? raw : null) ??
              err?.message ??
              'Save failed';

            this.errorMsg = msg;

            // API error => toast immediately + keep dialog open
            this.toastr.error(msg, 'Save failed', { timeOut: 4000 });
          }
        });
        return;
      }

      // 3) Promise
      if (r && typeof r.then === 'function') {
        r.then(() => this.dialogRef.close(payload)).catch((err: any) => {
          const raw = err?.error;
          const msg =
            raw?.message ??
            (typeof raw === 'string' ? raw : null) ??
            err?.message ??
            'Save failed';

          this.errorMsg = msg;
          this.toastr.error(msg, 'Save failed', { timeOut: 4000 });
        });
        return;
      }

      // 4) Sync
      this.dialogRef.close(payload);
    } catch (e: any) {
      const msg = e?.message ?? 'Save failed';
      this.errorMsg = msg;
      this.toastr.error(msg, 'Save failed', { timeOut: 4000 });
    }
  }
}
