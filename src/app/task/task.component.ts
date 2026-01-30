import { Component, OnInit, NgZone, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { TableData } from '../shared/table/table.component';
import { TaskApiService } from '../shared/services/task-api.service';
import { TaskDto, TaskCreateDto, PagedRequest } from '../shared/dtos/api.dtos';
import { GenericDialogComponent, GenericDialogData } from '../shared/generic-dialog/generic-dialog.component';
import { AuthService } from '../auth/auth.service';
import { ConfirmDialogComponent } from './taskdelete/deletetask.component';

@Component({
  selector: 'app-task',
  standalone: false,
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {
  private readonly adminRoles = ['Admin'];
  public readonly managerRoles = ['Manager'];
  private readonly userRoles = ['User'];

  tableData: TableData<any> = {
    title: 'Tasks',
    loading: false,
    error: '',
    showActions: true,
    showAdd: true,
    addLabel: 'Add Task',
    showPagination: true,
    pageSize: 5,
    pageSizeOptions: [5, 10, 20],

    serverSide: true,
    totalRecords: 0,
    pageNumber: 1,

    columns: [
      { header: 'Task ID', field: 'taskId', clickable: true, clickEvent: 'view', valueFn: (r: any) => r.TaskId ?? r.taskId ?? '' },
      { header: 'Task Name', field: 'taskName', clickable: true, clickEvent: 'view', valueFn: (r: any) => r.TaskName ?? r.taskName ?? '' },
      { header: 'Project', field: 'projectId', clickable: true, clickEvent: 'view', valueFn: (r: any) => r.ProjectId ?? r.projectId ?? '' },
      { header: 'Assigned To', field: 'assignedToPerson', clickable: true, clickEvent: 'view', valueFn: (r: any) => r.AssignedToPersonId ?? r.assignedToPersonId ?? r.AssignedToPerson ?? r.assignedToPerson ?? '' },
      { header: 'Sprint', field: 'sprintNumber', clickable: true, clickEvent: 'view', valueFn: (r: any) => r.SprintNumber ?? r.sprintNumber ?? '' },
      { header: 'Status', field: 'status', clickable: true, clickEvent: 'view', valueFn: (r: any) => this.getStatusLabel(r.Status ?? r.status) }
    ],
    rows: []
  };

  private currentSearch = '';
  private currentSortBy = '';
  private currentSortDir: 'asc' | 'desc' = 'asc';

  constructor(
    private api: TaskApiService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    public auth: AuthService,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: object
  ) { }

  ngOnInit(): void {
    this.tableData = {
      ...this.tableData,
      showAdd: this.auth.hasAnyRole(this.managerRoles)
    };
    this.getAllTasks();
  }

  handlePage(ev: any): void {
    this.tableData.pageNumber = ev.pageIndex + 1;
    this.tableData.pageSize = ev.pageSize;
    this.getAllTasks();
  }

  handleSort(ev: any): void {
    this.currentSortBy = ev.active;
    this.currentSortDir = ev.direction || 'asc';
    this.tableData.pageNumber = 1;
    this.getAllTasks();
  }

  handleSearch(q: string): void {
    this.currentSearch = q;
    this.tableData.pageNumber = 1;
    this.getAllTasks();
  }

  private getUserId(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('pm_userId');
  }

  private getTaskId(row: any): string {
    return ((row?.TaskId ?? row?.taskId ?? '') as string).toString().trim();
  }

  private getAssignedTo(row: any): string {
    return ((row?.AssignedToPersonId ?? row?.assignedToPersonId ?? '') as string).toString().trim();
  }

  private toDialogModel(row: any): any {
    return {
      TaskId: this.getTaskId(row),
      TaskName: (row?.TaskName ?? row?.taskName ?? '').toString(),
      ProjectId: (row?.ProjectId ?? row?.projectId ?? '').toString(),
      AssignedToPerson: (row?.AssignedToPersonId ?? row?.assignedToPersonId ?? '').toString(),
      SprintNumber: row?.SprintNumber ?? row?.sprintNumber ?? null,
      Status: row?.Status ?? row?.status ?? 0
    };
  }

  private canEditTask(row: any): boolean {
    const userId = this.getUserId();
    const assignedTo = this.getAssignedTo(row);

    if (this.auth.hasAnyRole(this.adminRoles)) return false;
    if (this.auth.hasAnyRole(this.managerRoles)) return true;

    if (this.auth.hasAnyRole(this.userRoles)) {
      if (!userId) return false;
      return assignedTo === userId;
    }

    return false;
  }

  private handleDialogClose(result: any, reload: boolean): void {
    this.tableData = { ...this.tableData, loading: false };
    this.cdr.detectChanges();

    if (!result) return;

    if (result.__error) {
      const msg = result.message ?? 'Save failed';
      this.toastr.error(msg);
      this.tableData = { ...this.tableData, error: msg };
      this.cdr.detectChanges();
      return;
    }

    this.toastr.success('Saved successfully');
    if (reload) this.getAllTasks();
  }


  getStatusLabel(status?: number): string {
    if (status === 0) return 'Todo';
    if (status === 1) return 'In Progress';
    if (status === 2) return 'Done';
    return status === undefined || status === null ? '' : String(status);
  }

  getAllTasks(): void {
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
          const msg = err?.error?.message ?? err?.message ?? err ?? 'API error';
          this.tableData = { ...this.tableData, rows: [], totalRecords: 0, loading: false, error: 'API call failed: ' + msg };
          this.cdr.detectChanges();
        });
      }
    });
  }

  onRowClick(row: any): void {
    const editable = this.canEditTask(row);
    const model = this.toDialogModel(row);

    const data: GenericDialogData = {
      title: editable ? `Edit Task (${model.TaskId})` : `View Task (${model.TaskId})`,
      mode: editable ? 'edit' : 'view',
      model: editable
        ? {
          action: 'status',
          ...model,
          newPersonId: ''
        }
        : model,
      fields: editable
        ? [
          { key: 'TaskId', label: 'Task ID', type: 'text', readonly: true },
          { key: 'TaskName', label: 'Task Name', type: 'text', readonly: true },
          { key: 'ProjectId', label: 'Project ID', type: 'text', readonly: true },
          { key: 'AssignedToPersonId', label: 'Assigned To', type: 'text', readonly: true },
          { key: 'SprintNumber', label: 'Sprint', type: 'number', readonly: true },
          {
            key: 'action',
            label: 'Action',
            type: 'select',
            readonly: !this.auth.hasAnyRole(this.managerRoles),
            options: [
              { value: 'status', label: 'Update status' },
              { value: 'reassign', label: 'Reassign person' }
            ]
          },
          {
            key: 'Status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 0, label: 'Todo' },
              { value: 1, label: 'In Progress' },
              { value: 2, label: 'Done' }
            ]
          },
          { key: 'newPersonId', label: 'New Person ID', type: 'text' }
        ]
        : [
          { key: 'TaskId', label: 'Task ID', type: 'text', readonly: true },
          { key: 'TaskName', label: 'Task Name', type: 'text', readonly: true },
          { key: 'ProjectId', label: 'Project ID', type: 'text', readonly: true },
          { key: 'AssignedToPersonId', label: 'Assigned To', type: 'text', readonly: true },
          { key: 'SprintNumber', label: 'Sprint', type: 'number', readonly: true },
          {
            key: 'Status',
            label: 'Status',
            type: 'select',
            readonly: true,
            options: [
              { value: 0, label: 'Todo' },
              { value: 1, label: 'In Progress' },
              { value: 2, label: 'Done' }
            ]
          }
        ],
      validate: editable
        ? (dto: any) => {
          const action = (dto?.action ?? 'status').toString();

          if (action === 'status') {
            if (dto?.Status === undefined || dto?.Status === null) return 'Select status';
            return null;
          }

          if (action === 'reassign') {
            if (!this.auth.hasAnyRole(this.managerRoles)) return 'Not allowed';
            if (!(dto?.newPersonId ?? '').toString().trim()) return 'Enter new person id';
            return null;
          }

          return 'Select an action';
        }
        : undefined,
      onSave: editable ? (dto: any) => {
        const userId = this.getUserId();
        if (!userId) throw new Error('UserId missing');

        this.tableData = { ...this.tableData, loading: true, error: '' };
        this.cdr.detectChanges();

        const action = (dto?.action ?? 'status').toString();
        const taskId = (dto?.TaskId ?? '').toString().trim();

        let req$;

        if (action === 'status') {
          // NOTE: this assumes your service method is updateStatus(taskId, userId, statusNumber)
          req$ = this.api.updateStatus(taskId, userId, Number(dto.Status));
        } else {
          // NOTE: managerId vs userId depends on your backend; change param name in service accordingly
          req$ = this.api.reassignTask(taskId, userId, (dto?.newPersonId ?? '').toString().trim());
        }

        return req$.pipe(
          finalize(() => {
            // ALWAYS reset loading even when API fails
            this.tableData = { ...this.tableData, loading: false };
            this.cdr.detectChanges();
          })
        );
      }
        : undefined
    };

    this.dialog
      .open(GenericDialogComponent, { width: '500px', data })
      .afterClosed()
      .subscribe((result) => this.zone.run(() => this.handleDialogClose(result, true)));
  }

  onAddTask(): void {
    const data: GenericDialogData = {
      title: 'Create Task',
      mode: 'create',
      model: {
        TaskName: '',
        ProjectId: '',
        AssignedToPersonId: '',
        SprintNumber: 1,
        Status: 0
      },
      fields: [
        { key: 'TaskName', label: 'Task Name', type: 'text' },
        { key: 'ProjectId', label: 'Project ID', type: 'text' },
        { key: 'AssignedToPersonId', label: 'Assigned To', type: 'text' },
        { key: 'SprintNumber', label: 'Sprint', type: 'number', min: 1, step: 1 },
        {
          key: 'Status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 0, label: 'Todo' },
            { value: 1, label: 'In Progress' },
            { value: 2, label: 'Done' }
          ]
        }
      ],
      validate: (dto: any) => {
        if (!(dto?.TaskName ?? '').toString().trim()) return 'Task Name is required';
        if (!(dto?.ProjectId ?? '').toString().trim()) return 'Project ID is required';
        return null;
      },
      onSave: (dto: any) => {
        const userId = this.getUserId();
        if (!userId) throw new Error('UserId missing');

        this.tableData = { ...this.tableData, loading: true, error: '' };
        this.cdr.detectChanges();

        const payload: TaskCreateDto = {
          TaskName: (dto?.TaskName ?? '').toString().trim(),
          ProjectId: (dto?.ProjectId ?? '').toString().trim(),
          AssignedToPersonId: (dto?.AssignedToPersonId ?? '').toString().trim(),
          SprintNumber: dto?.SprintNumber !== undefined ? Number(dto.SprintNumber) : undefined,
          Status: dto?.Status !== undefined ? Number(dto.Status) : undefined
        };

        return this.api.create(payload, userId);
      }
    };

    this.dialog
      .open(GenericDialogComponent, { width: '500px', data })
      .afterClosed()
      .subscribe((result) => this.zone.run(() => this.handleDialogClose(result, true)));
  }

  onBulkCreate(): void {
    if (!this.auth.hasAnyRole(this.managerRoles)) return;

    const data: GenericDialogData = {
      title: 'Bulk Create Tasks',
      mode: 'create',
      model: { json: '[]' },
      fields: [
        { key: 'json', label: 'JSON Data (Array)', type: 'text' }
      ],
      onSave: (dto: any) => {
        const userId = this.getUserId();
        if (!userId) throw new Error('UserId missing');

        try {
          const tasks = JSON.parse(dto.json);
          if (!Array.isArray(tasks)) throw new Error('Root must be an array');

          this.tableData = { ...this.tableData, loading: true };
          this.cdr.detectChanges();

          return this.api.createBulk(tasks, userId);
        } catch (e: any) {
          this.toastr.error('Invalid JSON: ' + e.message);
          return throwError(() => e);
        }
      }
    };

    this.dialog
      .open(GenericDialogComponent, { width: '600px', data })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.getAllTasks();
      });
  }

  onDeleteTask(row: any): void {
    const id = this.getTaskId(row);
    if (!id) {
      this.tableData = { ...this.tableData, error: 'TaskId missing' };
      this.cdr.detectChanges();
      return;
    }

    // 1) Ask confirmation FIRST
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Task',
        message: `Are you sure you want to delete task ${id}?`,
        okText: 'Delete',
        cancelText: 'Cancel'
      }
    })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        // 2) Only if user confirms, call delete API
        this.tableData = { ...this.tableData, loading: true, error: '' };
        this.cdr.detectChanges();

        this.api.deleteTask(id).subscribe({
          next: () => this.zone.run(() => this.getAllTasks()),
          error: (err) => {
            this.zone.run(() => {
              const msg = err?.error?.message ?? err?.message ?? 'Delete failed';
              this.tableData = { ...this.tableData, loading: false, error: msg };
              this.cdr.detectChanges();
            });
          }
        });
      });
  }
}
