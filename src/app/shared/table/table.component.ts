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

  // Search UI state (belongs to component, not TableData interface)
  searchText: string = '';

  dataSource = new MatTableDataSource<T>([]);
  displayedColumns: string[] = [];

  private _sort?: MatSort;
  private _paginator?: MatPaginator;

  private sortSub?: Subscription;

  private pageSizeState = 5;

  @ViewChild(MatSort) set sortRef(s: MatSort | null) {
    if (!s) return;
    if (this._sort === s) return;

    this._sort = s;
    this.dataSource.sort = s;

    this.sortSub?.unsubscribe();
    this.sortSub = s.sortChange.subscribe((_ev: Sort) => {
      this._paginator?.firstPage();
    });
  }

  @ViewChild(MatPaginator) set paginatorRef(p: MatPaginator | null) {
    if (!p) return;

    this._paginator = p;

    if (this.tableData?.showPagination !== false) {
      this.dataSource.paginator = p;
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

    // Sorting accessor (your existing logic)
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

    // ✅ Search across ALL columns (Material way)
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

    // Re-apply search when new rows come
    this.applySearch();

    if (this._sort) this.dataSource.sort = this._sort;

    if (this._paginator && this.tableData.showPagination !== false) {
      this.dataSource.paginator = this._paginator;
      this.initPaginatorState();
      this.applyPaginatorConfig();
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.sortSub?.unsubscribe();
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

  onPaginatorChange(ev: PageEvent): void {
    this.pageSizeState = ev.pageSize;

    if (this.tableData) {
      this.tableData = { ...this.tableData, pageSize: ev.pageSize };
    }
  }

  getCellValue(row: any, col: TableColumn<T>) {
    if (col.valueFn) return col.valueFn(row);

    const path = (col.field ?? '').toString();
    if (!path) return '';

    return path.split('.').reduce((acc: any, k: string) => (acc ? acc[k] : undefined), row) ?? '';
  }

  // Called from the search input (ngModelChange)
  applySearch(): void {
    this.dataSource.filter = (this.searchText ?? '').toString().trim().toLowerCase();

    // If paginator exists, reset to first page after filter (common UX)
    this._paginator?.firstPage();
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
