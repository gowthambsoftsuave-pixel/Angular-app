import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { TableData } from '../shared/table/table.component';
import { PersonApiService } from '../shared/services/person-api.service';
import { PersonCreateDto, PersonDto, PersonUpdateDto } from '../shared/dtos/api.dtos';
import {
  GenericDialogComponent,
  DialogField,
  GenericDialogData
} from '../shared/generic-dialog/generic-dialog.component';
import { ToastService } from '../shared/services/toast-service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-person',
  standalone: false,
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent implements OnInit {
  private readonly roleNames: Record<number, string> = {
    1: 'Admin',
    2: 'Manager',
    3: 'User'
  };

  private readonly editRoles = ['Admin', 'Manager'];

  get canEdit(): boolean {
    return this.auth.hasAnyRole(this.editRoles);
  }

  tableData: TableData<PersonDto> = {
    title: 'Persons',
    loading: false,
    error: '',
    showActions: false,
    showAdd: false,
    addLabel: 'Add Person',
    showPagination: true,
    pageSize: 5,
    pageSizeOptions: [5, 10, 20],
    columns: [
      { header: 'ID', field: 'personId', clickable: true, clickEvent: 'view' },
      { header: 'Name', field: 'name', clickable: true, clickEvent: 'view' },
      {
        header: 'Role',
        field: 'role',
        clickable: true,
        clickEvent: 'view',
        valueFn: (p: any) => this.roleNames[Number(p?.role)] ?? `Role ${p?.role}`
      },
      {
        header: 'Status',
        field: 'isActive',
        clickable: true,
        clickEvent: 'view',
        valueFn: (p: any) => (this.toBool(p?.isActive) ? 'Active' : 'Inactive')
      }
    ]
  };

  constructor(
    private api: PersonApiService,
    private dialog: MatDialog,
    private toast: ToastService,
    private auth: AuthService,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  tableReady = false;

  ngOnInit(): void {
    this.tableData = {
      ...this.tableData,
      apiService: this.api,
      entityName: 'person',
      showActions: this.canEdit,
      showAdd: this.canEdit
    };

    this.tableReady = true;
    this.cdr.detectChanges();
  }

  private normalizePersonModel(row: Partial<PersonDto>): any {
    return {
      personId: row.personId ?? '',
      name: row.name ?? '',
      role: Number((row as any).role ?? 3),
      isActive: this.toBool((row as any).isActive)
    };
  }

  private toBool(v: any): boolean {
    if (v === true || v === 1 || v === '1') return true;
    if (v === false || v === 0 || v === '0') return false;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (s === 'true' || s === 'active' || s === 'yes') return true;
      if (s === 'false' || s === 'inactive' || s === 'no') return false;
    }
    return true;
  }

  private personFields(forceReadonlyAll: boolean): DialogField[] {
    return [
      { key: 'personId', label: 'Person ID', type: 'text', readonly: true },
      { key: 'name', label: 'Name', type: 'text', readonly: forceReadonlyAll },
      {
        key: 'role',
        label: 'Role',
        type: 'select',
        readonly: forceReadonlyAll,
        options: [
          { value: 1, label: 'Admin' },
          { value: 2, label: 'Manager' },
          { value: 3, label: 'User' }
        ]
      },
      { key: 'isActive', label: 'Active', type: 'checkbox', readonly: forceReadonlyAll }
    ];
  }

  onAddPerson(): void {
    if (!this.canEdit) {
      this.toast.error('View-only access: cannot add person');
      return;
    }

    const data: GenericDialogData = {
      title: 'Create Person',
      mode: 'create',
      model: this.normalizePersonModel({ name: '', role: 3, isActive: true }),
      fields: this.personFields(false).filter((f) => f.key !== 'personId'),
      onSave: (dto: any) => {
        const createDto: PersonCreateDto = {
          name: dto.name,
          role: Number(dto.role),
          isActive: this.toBool(dto.isActive)
        };
        return this.api.create(createDto);
      }
    };

    this.dialog
      .open(GenericDialogComponent, { width: '420px', data })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.zone.run(() => this.refreshTable());
      });
  }

  onViewPerson(row: PersonDto): void {
    const readonly = !this.canEdit;

    const data: GenericDialogData = {
      title: readonly ? `View Person (${row.personId})` : `Edit Person (${row.personId})`,
      mode: readonly ? 'view' : 'edit',
      model: this.normalizePersonModel(row),
      fields: this.personFields(readonly),
      onSave: readonly
        ? undefined
        : (dto: any) => {
            const updateDto: PersonUpdateDto = {
              name: dto.name,
              role: Number(dto.role),
              isActive: this.toBool(dto.isActive)
            };
            return this.api.update(row.personId, updateDto);
          }
    };

    this.dialog
      .open(GenericDialogComponent, { width: '420px', data })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.zone.run(() => this.refreshTable());
      });
  }

  onEditPerson(row: PersonDto): void {
    if (!this.canEdit) {
      this.toast.error('View-only access: cannot edit person');
      return;
    }
    this.onViewPerson(row);
  }

  onDeletePerson(row: PersonDto): void {
    if (!this.canEdit) {
      this.toast.error('View-only access: cannot delete person');
      return;
    }
    this.router.navigate(['/persons/delete', row.personId]);
  }

  refreshTable(): void {
    this.tableData = { ...this.tableData, loading: true };
    this.cdr.detectChanges();

    setTimeout(() => {
      this.tableData = { ...this.tableData, loading: false };
      this.cdr.detectChanges();
    }, 0);
  }
}
