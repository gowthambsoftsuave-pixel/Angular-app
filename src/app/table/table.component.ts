// table.component.ts
import { Component, Input } from '@angular/core';

export interface TableColumn<T = any> {
  header: string;

  // Use one of these:
  field?: keyof T | string;           
  valueFn?: (row: T) => any;          
}

export interface TableData<T = any> {
  title?: string;
  columns: TableColumn<T>[];
  rows: T[];
  loading: boolean;
  error: string;
}

@Component({
  selector: 'app-tables',
  standalone: false,
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TablesComponent<T = any> {
  @Input() tableData!: TableData<T>;

  getCellValue(row: any, col: TableColumn<any>): any {
    if (col.valueFn) return col.valueFn(row);

    const path = (col.field ?? '').toString();
    if (!path) return '';

    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), row) ?? '';
  }
}
