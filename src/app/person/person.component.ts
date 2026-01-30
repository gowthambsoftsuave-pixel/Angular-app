import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { throwError } from 'rxjs';

import { TableData } from '../shared/table/table.component';
import { PersonApiService } from '../shared/services/person-api.service';
import { PagedRequest, PersonCreateDto, PersonDto, PersonUpdateDto } from '../shared/dtos/api.dtos';
import { GenericDialogComponent, DialogField, GenericDialogData } from '../shared/generic-dialog/generic-dialog.component';
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
    showActions: true,

    showPagination: true,
    pageSize: 5,
    pageSizeOptions: [5, 10, 20],

    showAdd: true,
    addLabel: 'Add Person',

    serverSide: true,
    totalRecords: 0,
    pageNumber: 1,

    columns: [
      { header: 'ID', field: 'personId', clickable: true, clickEvent: 'view' },
      { header: 'Name', field: 'name', clickable: true, clickEvent: 'view' },
      {
        header: 'Role',
        field: 'role',
        clickable: true,
        clickEvent: 'view',
        valueFn: (p: any) => this.roleNames[p.role] ?? `Role ${p.role}`
      },
      {
        header: 'Status',
        field: 'isActive',
        clickable: true,
        clickEvent: 'view',
        valueFn: (p: any) => (p.isActive ? 'Active' : 'Inactive')
      }
    ],
    rows: []
  };

  private currentSearch = '';
  private currentSortBy = '';
  private currentSortDir: 'asc' | 'desc' = 'asc';

  constructor(
    private api: PersonApiService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dialog: MatDialog,
    private toast: ToastService,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    // User role => view-only (no actions + no add button)
    this.tableData = {
      ...this.tableData,
      showActions: this.canEdit,
      showAdd: this.canEdit
    };
    this.cdr.detectChanges();

    this.getAllPersons();
  }

  handlePage(ev: any): void {
    this.tableData.pageNumber = ev.pageIndex + 1;
    this.tableData.pageSize = ev.pageSize;
    this.getAllPersons();
  }

  handleSort(ev: any): void {
    this.currentSortBy = ev.active;
    this.currentSortDir = ev.direction || 'asc';
    this.tableData.pageNumber = 1;
    this.getAllPersons();
  }

  handleSearch(q: string): void {
    this.currentSearch = q;
    this.tableData.pageNumber = 1;
    this.getAllPersons();
  }

  private personFields(readonlyId: boolean, forceReadonlyAll: boolean): DialogField[] {
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
      model: { name: '', role: 3, isActive: true },
      fields: this.personFields(false, false).filter((f) => f.key !== 'personId'),
      onSave: (dto: any) => {
        const createDto: PersonCreateDto = {
          name: dto.name,
          role: Number(dto.role),
          isActive: !!dto.isActive
        };

        this.tableData = { ...this.tableData, loading: true, error: '' };
        this.cdr.detectChanges();

        return this.api.create(createDto);
      }
    };

    this.dialog
      .open(GenericDialogComponent, { width: '420px', data })
      .afterClosed()
      .subscribe((result: any) => {
        if (result) this.zone.run(() => this.getAllPersons());
      });
  }

  onViewPerson(row: PersonDto): void {
    // User role => view dialog only (no edit)
    if (!this.canEdit) {
      this.dialog.open(GenericDialogComponent, {
        width: '420px',
        data: { person: row }
      });
      return;
    }

    const data: GenericDialogData = {
      title: `Edit Person (${row.personId})`,
      mode: 'edit',
      model: {
        personId: row.personId,
        name: row.name,
        role: row.role,
        isActive: row.isActive
      },
      fields: this.personFields(true, false),
      onSave: (dto: any) => {
        const updateDto: PersonUpdateDto = {
          name: dto.name,
          role: Number(dto.role),
          isActive: !!dto.isActive
        };

        this.tableData = { ...this.tableData, loading: true, error: '' };
        this.cdr.detectChanges();

        return this.api.update(row.personId, updateDto);
      }
    };

    this.dialog
      .open(GenericDialogComponent, { width: '420px', data })
      .afterClosed()
      .subscribe((result: any) => {
        if (result) this.zone.run(() => this.getAllPersons());
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

  onBulkCreate(): void {
    if (!this.canEdit) return;

    const data: GenericDialogData = {
      title: 'Bulk Create Persons',
      mode: 'create',
      model: { json: '[]' },
      fields: [
        { key: 'json', label: 'JSON Data (Array)', type: 'text' } // Use textarea if available, else text is fine for demo
      ],
      onSave: (dto: any) => {
        try {
          const persons = JSON.parse(dto.json);
          if (!Array.isArray(persons)) throw new Error('Root must be an array');

          this.tableData = { ...this.tableData, loading: true };
          this.cdr.detectChanges();

          return this.api.createBulk(persons);
        } catch (e: any) {
          this.toast.error('Invalid JSON: ' + e.message);
          return throwError(() => e);
        }
      }
    };

    this.dialog
      .open(GenericDialogComponent, { width: '600px', data })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.getAllPersons();
      });
  }

  getAllPersons(): void {
    this.tableData = { ...this.tableData, loading: true, error: '', rows: [] };
    this.cdr.detectChanges();

    const request: PagedRequest = {
      pageNumber: this.tableData.pageNumber || 1,
      pageSize: this.tableData.pageSize || 5,
      search: this.currentSearch,
      sortBy: this.currentSortBy,
      sortDirection: this.currentSortDir
    };

    this.api.getPaged(request).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.tableData = {
            ...this.tableData,
            rows: res.data ?? [],
            totalRecords: res.totalRecords,
            loading: false
          };
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          const msg = err?.message ?? err;
          this.toast.error('Persons: ' + msg);
          this.tableData = {
            ...this.tableData,
            loading: false,
            rows: [],
            totalRecords: 0,
            error: 'API call failed: ' + msg
          };
          this.cdr.detectChanges();
        });
      }
    });
  }
}
