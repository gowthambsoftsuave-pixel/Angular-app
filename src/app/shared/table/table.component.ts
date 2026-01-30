import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnChanges,
  SimpleChanges,
  OnDestroy
} from '@angular/core';

import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

export interface TableColumn<T = any> {
  header: string;
  field: keyof T | string;
  valueFn?: (row: T) => any;
  clickable?: boolean;
  sortable?: boolean;
  clickEvent?: 'view' | 'sprint';
}

export interface TableData<T = any> {
  title?: string;
  columns: TableColumn<T>[];
  rows: T[];
  loading: boolean;
  error: string;

  showActions?: boolean;

  showAdd?: boolean;
  addLabel?: string;

  showPagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];

  // Server-side support
  serverSide?: boolean;
  totalRecords?: number;
  pageNumber?: number;
}

@Component({
  selector: 'app-tables',
  standalone: false,
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T = any> implements OnChanges, AfterViewInit, OnDestroy {
  @Input() tableData!: TableData<T>;

  @Output() view = new EventEmitter<T>();
  @Output() edit = new EventEmitter<T>();
  @Output() remove = new EventEmitter<T>();
  @Output() sprint = new EventEmitter<T>();
  @Output() add = new EventEmitter<void>();

  // Server-side events
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() searchChange = new EventEmitter<string>();

  // Search UI state (belongs to component, not TableData interface)
  searchText: string = '';

  dataSource = new MatTableDataSource<T>([]);
  displayedColumns: string[] = [];

  private _sort?: MatSort;
  private _paginator?: MatPaginator;

  private sortSub?: Subscription;
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  private pageSizeState = 5;

  constructor() {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.searchText = term;
      this.applySearch();
    });
  }

  @ViewChild(MatSort) set sortRef(s: MatSort | null) {
    if (!s) return;
    if (this._sort === s) return;

    this._sort = s;
    if (!this.tableData?.serverSide) {
      this.dataSource.sort = s;
    }

    this.sortSub?.unsubscribe();
    this.sortSub = s.sortChange.subscribe((ev: Sort) => {
      if (this.tableData?.serverSide) {
        this.sortChange.emit(ev);
      } else {
        this._paginator?.firstPage();
      }
    });
  }

  @ViewChild(MatPaginator) set paginatorRef(p: MatPaginator | null) {
    if (!p) return;

    this._paginator = p;

    if (this.tableData?.showPagination !== false) {
      if (!this.tableData?.serverSide) {
        this.dataSource.paginator = p;
      }
      this.initPaginatorState();
      this.applyPaginatorConfig();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.tableData) return;

    const colKeys = (this.tableData.columns ?? []).map((c) => c.field.toString());
    this.displayedColumns = this.tableData.showActions ? [...colKeys, 'actions'] : colKeys;

    // Set data
    this.dataSource.data = this.tableData.rows ?? [];

    if (!this.tableData.serverSide) {
      // Local Sorting accessor
      this.dataSource.sortingDataAccessor = (row: any, columnId: string) => {
        const col = (this.tableData.columns ?? []).find((c) => c.field.toString() === columnId);
        if (!col) return '';

        const path = (col.field ?? '').toString();

        let value: any = path
          ? path.split('.').reduce((acc: any, k: string) => (acc ? acc[k] : undefined), row)
          : undefined;

        if (value === undefined || value === null) value = col.valueFn ? col.valueFn(row) : '';

        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return Number(trimmed);
          return trimmed.toLowerCase();
        }

        return value;
      };

      // ✅ Local Search across ALL columns (Material way)
      this.dataSource.filterPredicate = (row: any, filter: string) => {
        const q = (filter ?? '').toString().trim().toLowerCase();
        if (!q) return true;

        const text = (this.tableData.columns ?? [])
          .map((c) => {
            const v = this.getCellValue(row, c);
            return (v ?? '').toString().toLowerCase();
          })
          .join(' | ');

        return text.includes(q);
      };

      this.applySearch();
    }

    if (this._sort && !this.tableData.serverSide) this.dataSource.sort = this._sort;

    if (this._paginator && this.tableData.showPagination !== false) {
      if (!this.tableData.serverSide) {
        this.dataSource.paginator = this._paginator;
      }
      this.initPaginatorState();
      this.applyPaginatorConfig();
    }
  }

  ngAfterViewInit(): void { }

  ngOnDestroy(): void {
    this.sortSub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  private initPaginatorState(): void {
    const incoming = this.tableData?.pageSize ?? 5;
    if (this.pageSizeState !== incoming && (!this._paginator || this._paginator.pageSize === 5) && incoming !== 5) {
      this.pageSizeState = incoming;
    }
  }

  private applyPaginatorConfig(): void {
    if (!this._paginator) return;

    const options = this.tableData?.pageSizeOptions ?? [5, 10, 20];
    if (!options.includes(this.pageSizeState)) this.pageSizeState = options[0] ?? 5;

    this._paginator.pageSizeOptions = options;
    this._paginator.pageSize = this.pageSizeState;

    if (this.tableData.serverSide && this.tableData.pageNumber !== undefined) {
      this._paginator.pageIndex = this.tableData.pageNumber - 1;
      this._paginator.length = this.tableData.totalRecords ?? 0;
    }
  }

  onPaginatorChange(ev: PageEvent): void {
    this.pageSizeState = ev.pageSize;

    if (this.tableData) {
      this.tableData = { ...this.tableData, pageSize: ev.pageSize };
      if (this.tableData.serverSide) {
        this.pageChange.emit(ev);
      }
    }
  }

  getCellValue(row: any, col: TableColumn<T>) {
    if (col.valueFn) return col.valueFn(row);

    const path = (col.field ?? '').toString();
    if (!path) return '';

    return path.split('.').reduce((acc: any, k: string) => (acc ? acc[k] : undefined), row) ?? '';
  }

  // Called from the search input (ngModelChange)
  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  applySearch(): void {
    if (this.tableData?.serverSide) {
      this.searchChange.emit(this.searchText);
    } else {
      this.dataSource.filter = (this.searchText ?? '').toString().trim().toLowerCase();
      this._paginator?.firstPage();
    }
  }

  onCellClick(row: T, col: TableColumn<T>): void {
    if (!col.clickable) return;

    const ev = col.clickEvent ?? 'view';
    if (ev === 'view') this.view.emit(row);
    if (ev === 'sprint') this.sprint.emit(row);
  }

  onAddClick(): void {
    this.add.emit();
  }
}
