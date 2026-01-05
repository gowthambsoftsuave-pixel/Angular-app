import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

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

  // NEW: Add button (POST)
  showAdd?: boolean;
  addLabel?: string;
}

@Component({
  selector: 'app-tables',
  standalone: false,
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T = any> implements OnChanges, AfterViewInit {
  @Input() tableData!: TableData<T>;

  @Output() view = new EventEmitter<T>();
  @Output() edit = new EventEmitter<T>();
  @Output() remove = new EventEmitter<T>();
  @Output() sprint = new EventEmitter<T>();

  // NEW
  @Output() add = new EventEmitter<void>();

  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<T>([]);
  displayedColumns: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.tableData) return;

    const colKeys = (this.tableData.columns ?? []).map((c) => c.field.toString());
    this.displayedColumns = this.tableData.showActions ? [...colKeys, 'actions'] : colKeys;

    this.dataSource.data = this.tableData.rows ?? [];

    this.dataSource.sortingDataAccessor = (row: any, columnId: string) => {
      const col = (this.tableData.columns ?? []).find((c) => c.field.toString() === columnId);
      if (!col) return '';

      const path = (col.field ?? '').toString();
      const fieldValue = path
        ? path.split('.').reduce((acc: any, k: string) => (acc ? acc[k] : undefined), row)
        : undefined;

      if (fieldValue !== undefined && fieldValue !== null) return fieldValue;
      return col.valueFn ? col.valueFn(row) : '';
    };

    if (this.sort) this.dataSource.sort = this.sort;
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
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
