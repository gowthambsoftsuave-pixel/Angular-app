import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { TableData } from '../shared/table/table.component';
import { ProjectApiService } from '../shared/services/project-api.service';
import { ProjectCreateDto, ProjectDto, ProjectUpdateDto } from '../shared/dtos/api.dtos';
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

  constructor(
    private api: ProjectApiService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dialog: MatDialog,
    private toast: ToastService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Hide Add button for non-admin
    this.tableData = { ...this.tableData, showAdd: this.canCreateProject };
    this.cdr.detectChanges();

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

    this.api.getAll().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, rows: data ?? [], loading: false };
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
            error: 'API call failed: ' + msg
          };
          this.cdr.detectChanges();
        });
      }
    });
  }
}
