import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PersonApiService } from '../../shared/services/person-api.service';

@Component({
  selector: 'app-person-delete',
  standalone: false,
  templateUrl: './persondelete.component.html',
  styleUrls: ['./persondelete.component.scss']
})
export class PersonDeleteComponent implements OnInit, OnDestroy {
  private sub!: Subscription;

  id = '';
  loading = false;
  error = '';
  person: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: PersonApiService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(pm => {
      const id = (pm.get('id') ?? '').trim();
      this.id = id;

      if (!id) {
        this.error = 'Invalid person id';
        this.cdr.detectChanges();
        return;
      }

      this.loadPerson(id);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadPerson(id: string): void {
    this.loading = true;
    this.error = '';
    this.person = null;
    this.cdr.detectChanges();

    this.api.getById(id).subscribe({
      next: (p) => {
        this.zone.run(() => {
          this.person = p;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.person = null;
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
          this.router.navigate(['/persons']);
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
    this.router.navigate(['/persons']);
  }
}
