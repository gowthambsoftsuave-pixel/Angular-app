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

import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { HttpParams } from '@angular/common/http';

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

  // ✅ keep for all your existing modules
  rows?: T[];

  loading: boolean;
  error: string;

  showActions?: boolean;
  showAdd?: boolean;
  addLabel?: string;

  showPagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];

  // ✅ enable server mode when provided
  apiService?: any;
  entityName?: string;
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

  // Search UI state
  searchText: string = '';

  dataSource = new MatTableDataSource<T>([]);
  displayedColumns: string[] = [];

  // Server-side paginator length
  resultsLength = 0;

  private _sort?: MatSort;
  private _paginator?: MatPaginator;

  private sortSub?: Subscription;

  // Server-side state (works even if paginator not created yet)
  private pageIndexState = 0;
  private pageSizeState = 5;
  private sortActiveState = '';
  private sortDirectionState: 'asc' | 'desc' | '' = '';

  private get isServerMode(): boolean {
    return !!this.tableData?.apiService && !!this.tableData?.entityName;
  }

  @ViewChild(MatSort) set sortRef(s: MatSort | null) {
    if (!s) return;
    if (this._sort === s) return;

    this._sort = s;

    // ✅ Client mode: let MatTableDataSource sort locally
    if (!this.isServerMode) {
      this.dataSource.sort = s;
    }

    this.sortSub?.unsubscribe();
    this.sortSub = s.sortChange.subscribe((ev: Sort) => {
      // reset to first page on sort
      this.pageIndexState = 0;
      this._paginator?.firstPage();

      // Store sort state for server mode
      this.sortActiveState = ev.active ?? '';
      this.sortDirectionState = (ev.direction ?? '') as any;

      if (this.isServerMode) {
        this.loadServerPage();
      }
    });
  }

  @ViewChild(MatPaginator) set paginatorRef(p: MatPaginator | null) {
    if (!p) return;
    this._paginator = p;

    // ✅ Client mode: MatTableDataSource does paging
    if (!this.isServerMode && this.tableData?.showPagination !== false) {
      this.dataSource.paginator = p;
    }

    // Set initial state
    this.initPaginatorState();
    this.applyPaginatorConfig();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.tableData) return;

    const colKeys = (this.tableData.columns ?? []).map((c) => c.field.toString());
    this.displayedColumns = this.tableData.showActions ? [...colKeys, 'actions'] : colKeys;

    // Update page size defaults
    this.pageSizeState = this.tableData.pageSize ?? this.pageSizeState;

    if (this.isServerMode) {
      // When apiService/entityName becomes available later, trigger first server load
      setTimeout(() => this.loadServerPage(), 0);
      return;
    }

    // ✅ CLIENT MODE (original behavior)
    this.dataSource.data = this.tableData.rows ?? [];

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

    this.dataSource.filterPredicate = (row: any, filter: string) => {
      const q = (filter ?? '').toString().trim().toLowerCase();
      if (!q) return true;

      const text = (this.tableData.columns ?? [])
        .map((c) => ((this.getCellValue(row, c) ?? '').toString().toLowerCase()))
        .join(' | ');

      return text.includes(q);
    };

    this.applySearchClient();

    if (this._sort) this.dataSource.sort = this._sort;

    if (this._paginator && this.tableData.showPagination !== false) {
      this.dataSource.paginator = this._paginator;
      this.initPaginatorState();
      this.applyPaginatorConfig();
    }
  }

  ngAfterViewInit(): void {
    // nothing extra needed
  }

  ngOnDestroy(): void {
    this.sortSub?.unsubscribe();
  }

  // Called from the search input (ngModelChange)
  applySearch(): void {
    if (this.isServerMode) {
      this.pageIndexState = 0;
      this._paginator?.firstPage();
      this.loadServerPage();
      return;
    }

    this.applySearchClient();
  }

  private applySearchClient(): void {
    this.dataSource.filter = (this.searchText ?? '').toString().trim().toLowerCase();
    this._paginator?.firstPage();
  }

  onPaginatorChange(ev: PageEvent): void {
    // Always keep state updated
    this.pageIndexState = ev.pageIndex;
    this.pageSizeState = ev.pageSize;

    // Client mode: keep your old behavior (store page size)
    if (!this.isServerMode) {
      if (this.tableData) {
        this.tableData = { ...this.tableData, pageSize: ev.pageSize };
      }
      return;
    }

    // Server mode: load requested page
    this.loadServerPage();
  }

  private loadServerPage(): void {
    if (!this.isServerMode) return;

    // pageSize fallback if paginator is not created yet
    const pageSize =
      this._paginator?.pageSize ??
      this.tableData.pageSize ??
      this.pageSizeState ??
      5;

    const pageNumber =
      (this._paginator?.pageIndex ?? this.pageIndexState ?? 0) + 1;

    // sort fallback if MatSort not created yet
    const sortBy = this._sort?.active ?? this.sortActiveState ?? '';
    const sortDir = this._sort?.direction ?? this.sortDirectionState ?? '';

    this.tableData.loading = true;
    this.tableData.error = '';

    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString())
      .set('search', (this.searchText ?? '').trim());

    if (sortBy && sortDir) {
      params = params.set('SortBy', sortBy).set('SortDirection', sortDir);
    }

    // NOTE: For now this calls getPersonsPaged(). Later we can make it generic per entity.
    this.tableData.apiService.getPersonsPaged(params).subscribe({
      next: (response: any) => {
        this.dataSource.data = response.data ?? [];
        this.resultsLength = response.totalRecords ?? 0;
        this.tableData.loading = false;
      },
      error: (error: any) => {
        console.error('Server load failed:', error);
        this.dataSource.data = [];
        this.resultsLength = 0;
        this.tableData.error = 'Server load failed';
        this.tableData.loading = false;
      }
    });
  }

  getCellValue(row: any, col: TableColumn<T>) {
    if (col.valueFn) return col.valueFn(row);

    const path = (col.field ?? '').toString();
    if (!path) return '';

    return path.split('.').reduce((acc: any, k: string) => (acc ? acc[k] : undefined), row) ?? '';
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

  private initPaginatorState(): void {
    const incoming = this.tableData?.pageSize ?? 5;
    if (this.pageSizeState !== incoming && this._paginator?.pageSize === 5 && incoming !== 5) {
      this.pageSizeState = incoming;
    }
  }

  private applyPaginatorConfig(): void {
    if (!this._paginator) return;

    const options = this.tableData?.pageSizeOptions ?? [5, 10, 20];
    if (!options.includes(this.pageSizeState)) this.pageSizeState = options[0] ?? 5;

    this._paginator.pageSizeOptions = options;
    this._paginator.pageSize = this.pageSizeState;
  }
  
}
