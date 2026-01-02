import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TableData } from '../../shared/table/table.component';
import { ProjectApiService } from '../../shared/project-api.service';

@Component({
  selector: 'app-project-details',
  standalone: false,
  templateUrl: './projectdetails.component.html',
  styleUrls: ['./projectdetails.component.scss']
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  private sub!: Subscription;
  projectId = '';

  tableData: TableData<any> = {
    title: 'Project Details',
    loading: false,
    error: '',
    columns: [
      { header: 'ID', field: 'projectId' },
      { header: 'Project', field: 'projectName' },
      { header: 'Total Sprints', field: 'totalSprintCount' },
      { header: 'Current', field: 'currentSprintCount' },
      { header: 'Created By', field: 'createdByAdminId' },
      { header: 'Status', field: 'isCompleted', valueFn: (p: any) => (p.isCompleted ? 'Completed' : 'In Progress') }
    ],
    rows: []
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ProjectApiService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(pm => {
      const id = (pm.get('id') ?? '').trim();
      this.projectId = id;

      if (!id) {
        this.tableData = { ...this.tableData, error: 'Invalid project id', rows: [] };
        this.cdr.detectChanges();
        return;
      }

      this.load(id);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load(id: string): void {
    this.tableData = { ...this.tableData, loading: true, error: '', rows: [] };
    this.cdr.detectChanges();

    this.api.getById(id).subscribe({
      next: (project) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, loading: false, rows: project ? [project] : [] };
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

  back(): void {
    this.router.navigate(['/projects']);
  }
}
