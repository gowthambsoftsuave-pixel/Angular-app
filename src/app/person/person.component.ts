// src/app/person/person.component.ts
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { TableData } from '../table/table.component';
import { PersonApiService } from '../shared/person-api.service';
import { PersonCreateDto, PersonUpdateDto } from '../shared/dtos/api.dtos';

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

  tableData: TableData<any> = {
    title: 'Persons',
    loading: false,
    error: '',
    columns: [
      { header: 'ID', field: 'personId' },
      { header: 'Name', field: 'name' },
      {
        header: 'Role',
        valueFn: (p: { role: number }) => this.roleNames[p.role] ?? `Role ${p.role}`
      },
      {
        header: 'Status',
        valueFn: (p: { isActive: boolean }) => (p.isActive ? 'Active' : 'Inactive')
      }
    ],
    rows: []
  };

  // bind these to form inputs
  createDto: PersonCreateDto = { name: '', role: 3, isActive: true };

  updateId = '';
  updateDto: PersonUpdateDto = { name: '', role: 3, isActive: true };

  deleteId = '';

  constructor(
    private api: PersonApiService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getAllPersons();
  }

  getAllPersons(): void {
    this.tableData = { ...this.tableData, loading: true, error: '', rows: [] };
    this.cdr.detectChanges();

    this.api.getAll().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, rows: data, loading: false };
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

  updatePerson(): void {
    const id = (this.updateId ?? '').trim();
    if (!id) {
      this.tableData = { ...this.tableData, error: 'Person ID required for update' };
      this.cdr.detectChanges();
      return;
    }

    this.tableData = { ...this.tableData, loading: true, error: '' };
    this.cdr.detectChanges();

    this.api.update(id, this.updateDto).subscribe({
      next: () => this.zone.run(() => this.getAllPersons()),
      error: (err) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, loading: false, error: err?.message ?? err };
          this.cdr.detectChanges();
        });
      }
    });
  }

  deletePerson(): void {
    const id = (this.deleteId ?? '').trim();
    if (!id) {
      this.tableData = { ...this.tableData, error: 'Person ID required for delete' };
      this.cdr.detectChanges();
      return;
    }

    this.tableData = { ...this.tableData, loading: true, error: '' };
    this.cdr.detectChanges();

    this.api.delete(id).subscribe({
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
