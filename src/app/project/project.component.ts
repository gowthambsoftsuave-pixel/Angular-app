// src/app/project/project.component.ts
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { TableData } from '../table/table.component';
import { ProjectApiService } from '../shared/project-api.service';
import { ProjectCreateDto, ProjectUpdateDto } from '../shared/dtos/api.dtos';

@Component({
  selector: 'app-project',
  standalone: false,
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
  searchId = '';

  tableData: TableData<any> = {
    title: 'Projects',
    loading: false,
    error: '',
    columns: [
      { header: 'ID', field: 'projectId' },
      { header: 'Project', field: 'projectName' },
      { header: 'Total Sprints', field: 'totalSprintCount' },
      { header: 'Current', field: 'currentSprintCount' },
      { header: 'Created By', field: 'createdByAdminId' },
      {
        header: 'Status',
        valueFn: (p: { isCompleted: boolean }) => (p.isCompleted ? 'Completed' : 'In Progress')
      }
    ],
    rows: []
  };

  createDto: ProjectCreateDto = {
    projectName: '',
    totalSprintCount: 1,
    createdByAdminId: '',
    isCompleted: false
  };

  updateId = '';
  updateDto: ProjectUpdateDto = { projectName: '', isCompleted: false };

  deleteId = '';

  sprintProjectId = '';
  currentSprint = 1;

  constructor(
    private api: ProjectApiService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getAllProjects();
  }

  getAllProjects(): void {
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

  getProjectById(): void {
    const id = (this.searchId ?? '').trim();
    if (!id) {
      this.tableData = { ...this.tableData, error: 'Please enter a project ID' };
      this.cdr.detectChanges();
      return;
    }

    this.tableData = { ...this.tableData, loading: true, error: '', rows: [] };
    this.cdr.detectChanges();

    this.api.getById(id).subscribe({
      next: (project) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, rows: project ? [project] : [], loading: false };
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          const msg =
            err?.status === 404
              ? `Project "${id}" not found`
              : `Error: ${err?.status ?? ''} ${err?.message ?? err}`;

          this.tableData = { ...this.tableData, loading: false, rows: [], error: msg };
          this.cdr.detectChanges();
        });
      }
    });
  }

  createProject(): void {
    this.tableData = { ...this.tableData, loading: true, error: '' };
    this.cdr.detectChanges();

    this.api.create(this.createDto).subscribe({
      next: () => this.zone.run(() => this.getAllProjects()),
      error: (err) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, loading: false, error: err?.message ?? err };
          this.cdr.detectChanges();
        });
      }
    });
  }

  updateProject(): void {
    const id = (this.updateId ?? '').trim();
    if (!id) {
      this.tableData = { ...this.tableData, error: 'Project ID required for update' };
      this.cdr.detectChanges();
      return;
    }

    this.tableData = { ...this.tableData, loading: true, error: '' };
    this.cdr.detectChanges();

    this.api.update(id, this.updateDto).subscribe({
      next: () => this.zone.run(() => this.getAllProjects()),
      error: (err) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, loading: false, error: err?.message ?? err };
          this.cdr.detectChanges();
        });
      }
    });
  }

  updateSprint(): void {
    const id = (this.sprintProjectId ?? '').trim();
    if (!id) {
      this.tableData = { ...this.tableData, error: 'Project ID required for sprint update' };
      this.cdr.detectChanges();
      return;
    }

    this.tableData = { ...this.tableData, loading: true, error: '' };
    this.cdr.detectChanges();

    this.api.updateSprint(id, this.currentSprint).subscribe({
      next: () => this.zone.run(() => this.getAllProjects()),
      error: (err) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, loading: false, error: err?.message ?? err };
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteProject(): void {
    const id = (this.deleteId ?? '').trim();
    if (!id) {
      this.tableData = { ...this.tableData, error: 'Project ID required for delete' };
      this.cdr.detectChanges();
      return;
    }

    this.tableData = { ...this.tableData, loading: true, error: '' };
    this.cdr.detectChanges();

    this.api.delete(id).subscribe({
      next: () => this.zone.run(() => this.getAllProjects()),
      error: (err) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, loading: false, error: err?.message ?? err };
          this.cdr.detectChanges();
        });
      }
    });
  }
}
