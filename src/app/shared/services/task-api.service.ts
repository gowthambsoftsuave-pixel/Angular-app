import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { API_BASE } from "../api.config";
import { TaskDto, TaskCreateDto, TaskResponseDto, PagedRequest, PagedResponse } from "../dtos/api.dtos";

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly baseUrl = `${API_BASE}/Task`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<TaskDto[]> {
    return this.http.get<TaskDto[]>(this.baseUrl);
  }

  getPaged(request: PagedRequest): Observable<PagedResponse<TaskDto>> {
    let params = new HttpParams()
      .set('pageNumber', request.pageNumber.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.search) params = params.set('search', request.search);
    if (request.status) params = params.set('status', request.status);
    if (request.sortBy) params = params.set('sortBy', request.sortBy);
    if (request.sortDirection) params = params.set('sortDirection', request.sortDirection);

    return this.http.get<PagedResponse<TaskDto>>(`${this.baseUrl}/paged`, { params });
  }

  getById(id: string): Observable<TaskDto> {
    return this.http.get<TaskDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: TaskCreateDto, managerId: string): Observable<TaskDto> {
    const params = new HttpParams().set('managerId', managerId);
    return this.http.post<TaskDto>(this.baseUrl, dto, { params });
  }

  createBulk(dtos: TaskCreateDto[], managerId: string): Observable<TaskDto[]> {
    const params = new HttpParams().set('managerId', managerId);
    return this.http.post<TaskDto[]>(`${this.baseUrl}/bulk`, dtos, { params });
  }

  // PUT /api/Task/{id}/status?userId=...  body = TaskStatusEnum number
  updateStatus(taskId: string, userId: string, status: number): Observable<TaskResponseDto> {
    const url = `${this.baseUrl}/${taskId}/status`;

    const params = new HttpParams().set('userId', userId); // HttpParams immutable [web:68]
    return this.http.put<TaskResponseDto>(url, Number(status), { params }); // body is number [web:77]
  }

  // PUT /api/Task/{id}/reassign?managerId=...&newPersonId=...
  reassignTask(taskId: string, managerId: string, newPersonId: string): Observable<TaskResponseDto> {
    const cleaned = (newPersonId ?? '').toString().trim();
    if (!cleaned) throw new Error('Enter new person id');

    const url = `${this.baseUrl}/${taskId}/reassign`;

    const params = new HttpParams()
      .set('managerId', managerId)
      .set('newPersonId', cleaned);

    return this.http.put<TaskResponseDto>(url, null, { params });
  }

  deleteTask(taskId: string): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${taskId}`, { responseType: 'text' });
  }
}
