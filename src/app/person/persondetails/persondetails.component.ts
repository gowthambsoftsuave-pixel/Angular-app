import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PersonApiService} from '../../shared/services/person-api.service';
import { TableData } from '../../shared/table/table.component';

@Component({
  selector: 'app-person-detail',
  standalone: false,
  templateUrl: './persondetails.component.html',
  styleUrls: ['./persondetails.component.scss']
})
export class PersonDetailComponent implements OnInit, OnDestroy {
  private sub!: Subscription;
  personId = '';

  tableData: TableData<any> = {
    title: 'Person Details',
    loading: false,
    error: '',
    columns: [
      { header: 'ID', field: 'personId' },
      { header: 'Name', field: 'name' },
      { header: 'Role', field: 'role' },
      { header: 'Active', field: 'isActive' }
    ],
    rows: []
  };

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
      this.personId = id;

      if (!id) {
        this.tableData = { ...this.tableData, error: 'Invalid person id', rows: [] };
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
      next: (person) => {
        this.zone.run(() => {
          this.tableData = { ...this.tableData, loading: false, rows: person ? [person] : [] };
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

  back(): void {
    this.router.navigate(['/persons']);
  }
}
