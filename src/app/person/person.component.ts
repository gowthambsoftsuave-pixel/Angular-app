import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { TableData } from '../shared/table/table.component';
import { PersonApiService } from '../shared/person-api.service';
import { PersonCreateDto, PersonDto, PersonUpdateDto } from '../shared/dtos/api.dtos';
import { PersonEditDialogComponent } from '../shared/person-edit-dialog/person-edit-dialog.component';

@Component({
  selector: 'app-person',
  standalone: false,
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent implements OnInit {
  searchId = '';

  private readonly roleNames: Record<number, string> = {
    1: 'Admin',
    2: 'Manager',
    3: 'User'
  };

  tableData: TableData<PersonDto> = {
    title: 'Persons',
    loading: false,
    error: '',
    showActions: true,
    columns: [
      { header: 'ID', field: 'personId', clickable: true }, // click -> view details
      { header: 'Name', field: 'name' },
      { header: 'Role', field: 'role', valueFn: (p) => this.roleNames[p.role] ?? `Role ${p.role}` },
      { header: 'Status', field: 'isActive', valueFn: (p) => (p.isActive ? 'Active' : 'Inactive') }
    ],
    rows: []
  };

  // Keep this only if you still want the "Create" section in the HTML
  createDto: PersonCreateDto = { name: '', role: 3, isActive: true };

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

  onViewPerson(row: PersonDto): void {
    this.router.navigate(['/persons', row.personId]);
  }

  onDeletePerson(row: PersonDto): void {
    this.router.navigate(['/persons/delete', row.personId]);
  }

  onEditPerson(row: PersonDto): void {
    const ref = this.dialog.open(PersonEditDialogComponent, {
      width: '420px',
      data: { person: row }
    });

    ref.afterClosed().subscribe((dto: PersonUpdateDto | null) => {
      if (!dto) return;

      this.tableData = { ...this.tableData, loading: true, error: '' };
      this.cdr.detectChanges();

      this.api.update(row.personId, dto).subscribe({
        next: () => this.zone.run(() => this.getAllPersons()),
        error: (err) => {
          this.zone.run(() => {
            this.tableData = { ...this.tableData, loading: false, error: err?.message ?? err };
            this.cdr.detectChanges();
          });
        }
      });
    });
  }

  getAllPersons(): void {
    this.tableData = { ...this.tableData, loading: true, error: '', rows: [] };
    this.cdr.detectChanges();

    this.api.getAll().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, rows: data ?? [], loading: false };
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
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

  getPersonById(): void {
    const id = (this.searchId ?? '').trim();
    if (!id) {
      this.tableData = { ...this.tableData, error: 'Please enter a person ID' };
      this.cdr.detectChanges();
      return;
    }

    this.tableData = { ...this.tableData, loading: true, error: '', rows: [] };
    this.cdr.detectChanges();

    this.api.getById(id).subscribe({
      next: (person) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, rows: person ? [person] : [], loading: false };
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          const msg =
            err?.status === 404
              ? `Person "${id}" not found`
              : `Error: ${err?.status ?? ''} ${err?.message ?? err}`;
          this.tableData = { ...this.tableData, loading: false, rows: [], error: msg };
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Optional: keep only if your UI still has the "Create" section
  createPerson(): void {
    this.tableData = { ...this.tableData, loading: true, error: '' };
    this.cdr.detectChanges();

    this.api.create(this.createDto).subscribe({
      next: () => this.zone.run(() => this.getAllPersons()),
      error: (err) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, loading: false, error: err?.message ?? err };
          this.cdr.detectChanges();
        });
      }
    });
  }
}
