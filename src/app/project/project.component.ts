import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { throwError } from 'rxjs';

import { TableData } from '../shared/table/table.component';
import { ProjectApiService } from '../shared/services/project-api.service';
import { PagedRequest, ProjectCreateDto, ProjectDto, ProjectUpdateDto } from '../shared/dtos/api.dtos';
import {
  GenericDialogComponent,
  DialogField,
  GenericDialogData
} from '../shared/generic-dialog/generic-dialog.component';
import { ToastService } from '../shared/services/toast-service';

import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-project',
  standalone: false,
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {

  private readonly adminRoles = ['Admin']; // change if your role name is "Administrator"

  get canCreateProject(): boolean {
    return this.auth.hasAnyRole(this.adminRoles);
  }

  get canDeleteProject(): boolean {
    return this.auth.hasAnyRole(this.adminRoles);
  }

  // Optional: if managers should NOT edit/update sprint, keep Admin only.
  // If managers ARE allowed, change these to include 'Manager'.
  get canEditProject(): boolean {
    return this.auth.hasAnyRole(this.adminRoles);
  }

  get canUpdateSprint(): boolean {
    return this.auth.hasAnyRole(this.adminRoles);
  }

  tableData: TableData<ProjectDto> = {
    title: 'Projects',
    loading: false,
    error: '',
    showActions: true,
    showAdd: true, // will be overwritten in ngOnInit
    addLabel: 'Add Project',

    showPagination: true,
    pageSize: 5,
    pageSizeOptions: [5, 10, 20],

    serverSide: true,
    totalRecords: 0,
    pageNumber: 1,

    columns: [
      { header: 'ID', field: 'projectId', clickable: true, clickEvent: 'view' },
      { header: 'Project', field: 'projectName', clickable: true, clickEvent: 'view' },
      { header: 'Total Sprints', field: 'totalSprintCount', clickable: true, clickEvent: 'view' },
      { header: 'Current', field: 'currentSprintCount', clickable: true, clickEvent: 'sprint' },
      { header: 'Created By', field: 'createdByAdminId', clickable: true, clickEvent: 'view' },
      {
        header: 'Status',
        field: 'isCompleted',
        clickable: true,
        clickEvent: 'view',
        valueFn: (p) => (p.isCompleted ? 'Completed' : 'In Progress')
      }
    ],
    rows: []
  };

  private currentSearch = '';
  private currentSortBy = '';
  private currentSortDir: 'asc' | 'desc' = 'asc';

  constructor(
    private api: ProjectApiService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dialog: MatDialog,
    private toast: ToastService,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    // Hide Add button for non-admin
    this.tableData = { ...this.tableData, showAdd: this.canCreateProject };
    this.cdr.detectChanges();

    this.getAllProjects();
  }

  handlePage(ev: any): void {
    this.tableData.pageNumber = ev.pageIndex + 1;
    this.tableData.pageSize = ev.pageSize;
    this.getAllProjects();
  }

  handleSort(ev: any): void {
    this.currentSortBy = ev.active;
    this.currentSortDir = ev.direction || 'asc';
    this.tableData.pageNumber = 1;
    this.getAllProjects();
  }

  handleSearch(q: string): void {
    this.currentSearch = q;
    this.tableData.pageNumber = 1;
    this.getAllProjects();
  }

  private projectFields(readonlyId: boolean): DialogField[] {
    return [
      { key: 'projectId', label: 'Project ID', type: 'text', readonly: readonlyId },
      { key: 'projectName', label: 'Project Name', type: 'text' },
      { key: 'totalSprintCount', label: 'Total Sprints', type: 'number', readonly: true },
      { key: 'currentSprintCount', label: 'Current Sprint', type: 'number', readonly: true },
      { key: 'createdByAdminId', label: 'Created By Admin ID', type: 'text', readonly: true },
      { key: 'isCompleted', label: 'Completed', type: 'checkbox' }
    ];
  }

  private handleDialogClose(result: any, successMsg: string): void {
    if (!result) {
      this.tableData = { ...this.tableData, loading: false };
      this.cdr.detectChanges();
      return;
    }

    if (result.__error) {
      this.toast.error(result.message ?? 'Save failed');
      this.tableData = { ...this.tableData, loading: false };
      this.cdr.detectChanges();

      this.router.navigate(['/projects']).then(() => this.getAllProjects());
      return;
    }

    this.toast.success(successMsg);
    this.getAllProjects();
  }

  onAddProject(): void {
    // Hard-block create even if user somehow triggers it
    if (!this.canCreateProject) {
      this.toast.error('Only Admin can create projects');
      return;
    }

    const data: GenericDialogData = {
      title: 'Create Project',
      mode: 'create',
      model: {
        projectName: '',
        totalSprintCount: 1,
        createdByAdminId: '',
      },
      fields: [
        { key: 'projectName', label: 'Project Name', type: 'text' },
        { key: 'totalSprintCount', label: 'Total Sprints', type: 'number' },
        { key: 'createdByAdminId', label: 'Created By Admin ID', type: 'text' },
      ],
      onSave: (dto) => {
        const createDto: ProjectCreateDto = {
          projectName: dto.projectName,
          totalSprintCount: Number(dto.totalSprintCount),
          createdByAdminId: dto.createdByAdminId,
        };

        this.tableData = { ...this.tableData, loading: true, error: '' };
        this.cdr.detectChanges();

        return this.api.create(createDto);
      }
    };

    this.dialog
      .open(GenericDialogComponent, { width: '500px', data })
      .afterClosed()
      .subscribe((result) =>
        this.zone.run(() => this.handleDialogClose(result, 'Project created'))
      );
  }

  onViewProject(row: ProjectDto): void {
    if (!this.canEditProject) {
      this.toast.error('Only Admin can edit projects');
      return;
    }

    const data: GenericDialogData = {
      title: `Edit Project (${row.projectId})`,
      mode: 'edit',
      model: {
        projectId: row.projectId,
        projectName: row.projectName,
        totalSprintCount: row.totalSprintCount,
        currentSprintCount: row.currentSprintCount,
        createdByAdminId: row.createdByAdminId,
        isCompleted: row.isCompleted
      },
      fields: this.projectFields(true),
      onSave: (dto) => {
        const updateDto: ProjectUpdateDto = {
          projectName: dto.projectName,
          isCompleted: !!dto.isCompleted
        };

        this.tableData = { ...this.tableData, loading: true, error: '' };
        this.cdr.detectChanges();

        return this.api.update(row.projectId, updateDto);
      }
    };

    this.dialog
      .open(GenericDialogComponent, { width: '500px', data })
      .afterClosed()
      .subscribe((result) =>
        this.zone.run(() => this.handleDialogClose(result, 'Project updated'))
      );
  }

  onEditProject(row: ProjectDto): void {
    this.onViewProject(row);
  }

  onDeleteProject(row: ProjectDto): void {
    if (!this.canDeleteProject) {
      this.toast.error('Only Admin can delete projects');
      return;
    }

    this.router.navigate(['/projects/delete', row.projectId]);
  }

  onBulkCreate(): void {
    if (!this.canCreateProject) return;

    const data: GenericDialogData = {
      title: 'Bulk Create Projects',
      mode: 'create',
      model: { json: '[]' },
      fields: [
        { key: 'json', label: 'JSON Data (Array)', type: 'text' }
      ],
      onSave: (dto: any) => {
        try {
          const projects = JSON.parse(dto.json);
          if (!Array.isArray(projects)) throw new Error('Root must be an array');

          this.tableData = { ...this.tableData, loading: true };
          this.cdr.detectChanges();

          return this.api.createBulk(projects);
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
        if (result) this.getAllProjects();
      });
  }

  onUpdateSprint(row: ProjectDto): void {
    if (!this.canUpdateSprint) {
      this.toast.error('Only Admin can update sprint');
      return;
    }

    const data: GenericDialogData = {
      title: `Update Sprint (${row.projectId})`,
      mode: 'edit',
      model: { currentSprint: row.currentSprintCount },
      fields: [
        {
          key: 'currentSprint',
          label: 'Current Sprint',
          type: 'number',
          min: 0,
          max: row.totalSprintCount,
          step: 1
        }
      ],
      validate: (dto) => {
        const s = Number(dto.currentSprint);

        if (Number.isNaN(s)) return 'Enter a valid number';
        if (s < 0) return 'Sprint cannot be negative';
        if (s < row.currentSprintCount) return 'Sprint cannot go backwards';
        if (s > row.totalSprintCount) return `Max sprint is ${row.totalSprintCount}`;
        return null;
      },
      onSave: (dto) => {
        const sprint = Number(dto.currentSprint);
        this.tableData = { ...this.tableData, loading: true, error: '' };
        this.cdr.detectChanges();
        return this.api.updateSprint(row.projectId, sprint);
      }
    };

    this.dialog
      .open(GenericDialogComponent, { width: '420px', data })
      .afterClosed()
      .subscribe((result) =>
        this.zone.run(() => this.handleDialogClose(result, 'Sprint updated'))
      );
  }

  getAllProjects(): void {
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
          this.toast.error('Projects: ' + msg);
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
