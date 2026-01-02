import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { TableData } from '../shared/table/table.component';
import { ProjectApiService } from '../shared/project-api.service';
import { ProjectDto, ProjectUpdateDto } from '../shared/dtos/api.dtos';

import { ProjectEditDialogComponent } from '../shared/project-edit-dialog/project-edit-dialog.component';
import { ProjectSprintDialogComponent } from '../shared/project-sprint-dialog/project-sprint-dialog.component';

@Component({
  selector: 'app-project',
  standalone: false,
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
  tableData: TableData<ProjectDto> = {
    title: 'Projects',
    loading: false,
    error: '',
    showActions: true,
    columns: [
      { header: 'ID', field: 'projectId', clickable: true, clickEvent: 'view' },
      { header: 'Project', field: 'projectName' },
      { header: 'Total Sprints', field: 'totalSprintCount' },

      // CLICK THIS CELL to open sprint dialog
      { header: 'Current', field: 'currentSprintCount', clickable: true, clickEvent: 'sprint' },

      { header: 'Created By', field: 'createdByAdminId' },
      { header: 'Status', field: 'isCompleted', valueFn: (p) => (p.isCompleted ? 'Completed' : 'In Progress') }
    ],
    rows: []
  };

  constructor(
    private api: ProjectApiService,
    private router: Router,
    private dialog: MatDialog,
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

  onViewProject(row: ProjectDto): void {
    this.router.navigate(['/projects', row.projectId]);
  }

  onDeleteProject(row: ProjectDto): void {
    this.router.navigate(['/projects/delete', row.projectId]);
  }

  onEditProject(row: ProjectDto): void {
    const ref = this.dialog.open(ProjectEditDialogComponent, {
      width: '420px',
      data: { project: row }
    });

    ref.afterClosed().subscribe((dto: ProjectUpdateDto | null) => {
      if (!dto) return;

      this.tableData = { ...this.tableData, loading: true, error: '' };
      this.cdr.detectChanges();

      this.api.update(row.projectId, dto).subscribe({
        next: () => this.zone.run(() => this.getAllProjects()),
        error: (err) => {
          this.zone.run(() => {
            this.tableData = { ...this.tableData, loading: false, error: err?.message ?? err };
            this.cdr.detectChanges();
          });
        }
      });
    });
  }

  onUpdateSprint(row: ProjectDto): void {
    const ref = this.dialog.open(ProjectSprintDialogComponent, {
      width: '420px',
      data: { project: row }
    });

    ref.afterClosed().subscribe((newSprint: number | null) => {
      if (newSprint === null || newSprint === undefined) return;

      const sprint = Number(newSprint);
      if (Number.isNaN(sprint)) return;

      if (sprint < row.currentSprintCount) {
        this.tableData = { ...this.tableData, error: 'Sprint cannot go backwards.' };
        this.cdr.detectChanges();
        return;
      }

      this.tableData = { ...this.tableData, loading: true, error: '' };
      this.cdr.detectChanges();

      this.api.updateSprint(row.projectId, sprint).subscribe({
        next: () => this.zone.run(() => this.getAllProjects()),
        error: (err) => {
          this.zone.run(() => {
            this.tableData = { ...this.tableData, loading: false, error: err?.message ?? err };
            this.cdr.detectChanges();
          });
        }
      });
    });
  }
}
