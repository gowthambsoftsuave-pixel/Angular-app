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
import { MatPaginator } from '@angular/material/paginator';

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

  showPagination?: boolean;     // default true
  pageSize?: number;            // default 5
  pageSizeOptions?: number[];   // default [5,10,20]
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

  dataSource = new MatTableDataSource<T>([]);
  displayedColumns: string[] = [];

  private _sort?: MatSort;
  private _paginator?: MatPaginator;

  private sortSub?: Subscription;

  // Works safely with *ngIf (can be null during destroy/recreate)
  @ViewChild(MatSort) set sortRef(s: MatSort | null) {
    if (!s) return;
    if (this._sort === s) return;

    this._sort = s;
    this.dataSource.sort = s;

    // only one subscription
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
      this.applyPaginatorConfig();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.tableData) return;

    const colKeys = (this.tableData.columns ?? []).map((c) => c.field.toString());
    this.displayedColumns = this.tableData.showActions ? [...colKeys, 'actions'] : colKeys;

    this.dataSource.data = this.tableData.rows ?? [];

    // Sorting accessor (nested fields + valueFn + numeric strings)
    this.dataSource.sortingDataAccessor = (row: any, columnId: string) => {
      const col = (this.tableData.columns ?? []).find((c) => c.field.toString() === columnId);
      if (!col) return '';

      const path = (col.field ?? '').toString();

      let value: any = path
        ? path.split('.').reduce((acc: any, k: string) => (acc ? acc[k] : undefined), row)
        : undefined;

      if (value === undefined || value === null) {
        value = col.valueFn ? col.valueFn(row) : '';
      }

      // numeric sort fix
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return Number(trimmed);
        return trimmed.toLowerCase();
      }

      return value;
    };

    // reattach sort/paginator after async data load
    if (this._sort) this.dataSource.sort = this._sort;

    if (this._paginator && this.tableData.showPagination !== false) {
      this.dataSource.paginator = this._paginator;
      this.applyPaginatorConfig();
      this._paginator.firstPage();
    }
  }

  ngAfterViewInit(): void {
    // setters already attach sort/paginator
  }

  ngOnDestroy(): void {
    this.sortSub?.unsubscribe();
  }

  private applyPaginatorConfig(): void {
    if (!this._paginator) return;
    this._paginator.pageSize = this.tableData?.pageSize ?? 5;
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
}
