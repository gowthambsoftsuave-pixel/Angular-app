import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { API_BASE } from "../api.config";
import { TaskDto, TaskCreateDto, TaskResponseDto } from "../dtos/api.dtos";

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly baseUrl = `${API_BASE}/Task`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TaskDto[]> {
    return this.http.get<TaskDto[]>(this.baseUrl);
  }

  getById(id: string): Observable<TaskDto> {
    return this.http.get<TaskDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: TaskCreateDto): Observable<TaskDto> {
    return this.http.post<TaskDto>(this.baseUrl, dto);
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
