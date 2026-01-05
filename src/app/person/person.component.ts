import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { TableData } from '../shared/table/table.component';
import { PersonApiService } from '../shared/person-api.service';
import { PersonCreateDto, PersonDto, PersonUpdateDto } from '../shared/dtos/api.dtos';
import { GenericDialogComponent, DialogField, GenericDialogData } from '../shared/generic-dialog/generic-dialog.component';

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

  tableData: TableData = {
    title: 'Persons',
    loading: false,
    error: '',
    showActions: true,

    // IMPORTANT: this makes the + button render (if you updated TableComponent)
    showAdd: true,
    addLabel: 'Add Person',

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

  constructor(
    private api: PersonApiService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getAllPersons();
  }

  private personFields(readonlyId: boolean): DialogField[] {
    return [
      { key: 'personId', label: 'Person ID', type: 'text', readonly: readonlyId },
      { key: 'name', label: 'Name', type: 'text' },
      {
        key: 'role',
        label: 'Role',
        type: 'select',
        options: [
          { value: 1, label: 'Admin' },
          { value: 2, label: 'Manager' },
          { value: 3, label: 'User' }
        ]
      },
      { key: 'isActive', label: 'Active', type: 'checkbox' }
    ];
  }

  // NEW: + button handler (POST)
  onAddPerson(): void {
    const data: GenericDialogData = {
      title: 'Create Person',
      mode: 'create',
      model: { name: '', role: 3, isActive: true },
      fields: this.personFields(false).filter((f) => f.key !== 'personId'),
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

    this.dialog.open(GenericDialogComponent, { width: '420px', data })
      .afterClosed()
      .subscribe((result: any) => {
        if (result) this.zone.run(() => this.getAllPersons());
      });
  }

  // Existing: edit dialog
  onViewPerson(row: PersonDto): void {
    const data: GenericDialogData = {
      title: `Edit Person (${row.personId})`,
      mode: 'edit',
      model: {
        personId: row.personId,
        name: row.name,
        role: row.role,
        isActive: row.isActive
      },
      fields: this.personFields(true),
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

    this.dialog.open(GenericDialogComponent, { width: '420px', data })
      .afterClosed()
      .subscribe((result: any) => {
        if (result) this.zone.run(() => this.getAllPersons());
      });
  }

  onEditPerson(row: PersonDto): void {
    this.onViewPerson(row);
  }

  onDeletePerson(row: PersonDto): void {
    this.router.navigate(['/persons/delete', row.personId]);
  }

  getAllPersons(): void {
    this.tableData = { ...this.tableData, loading: true, error: '', rows: [] };
    this.cdr.detectChanges();

    this.api.getAll().subscribe({
      next: (data: any) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, rows: data ?? [], loading: false };
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.tableData = {
            ...this.tableData,
            loading: false,
            rows: [],
            error: 'API call failed: ' + (err?.message ?? err)
          };
          this.cdr.detectChanges();
        });
      }
    });
  }
}
