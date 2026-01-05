import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProjectApiService } from '../../shared/services/project-api.service';

@Component({
  selector: 'app-project-delete',
  standalone: false,
  templateUrl: './projectdelete.component.html',
  styleUrls: ['./projectdelete.component.scss']
})
export class ProjectDeleteComponent implements OnInit, OnDestroy {
  private sub!: Subscription;

  id = '';
  loading = false;
  error = '';
  project: any = null;

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
      this.id = id;

      if (!id) {
        this.error = 'Invalid project id';
        this.cdr.detectChanges();
        return;
      }

      this.loadProject(id);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadProject(id: string): void {
    this.loading = true;
    this.error = '';
    this.project = null;
    this.cdr.detectChanges();

    this.api.getById(id).subscribe({
      next: (p) => {
        this.zone.run(() => {
          this.project = p;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.project = null;
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  confirmDelete(): void {
    if (!this.id) return;

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.api.delete(this.id).subscribe({
      next: () => {
        this.zone.run(() => {
          this.loading = false;
          this.router.navigate(['/projects']);
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;
          this.error = err?.message ?? err;
          this.cdr.detectChanges();
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/projects']);
  }
}
