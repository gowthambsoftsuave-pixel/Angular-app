import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { ProjectCreateDto, ProjectDto, ProjectUpdateDto } from '../dtos/api.dtos';

@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private readonly baseUrl = `${API_BASE}/Project`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(this.baseUrl);
  }

  getById(id: string): Observable<ProjectDto> {
    return this.http.get<ProjectDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: ProjectCreateDto): Observable<ProjectDto> {
    return this.http.post<ProjectDto>(this.baseUrl, dto);
  }

  update(id: string, dto: ProjectUpdateDto): Observable<string> {
    return this.http.put(`${this.baseUrl}/${id}`, dto, { responseType: 'text' });
  }

  updateSprint(id: string, currentSprint: number): Observable<string> {
    const params = new HttpParams().set('currentSprint', currentSprint);
    return this.http.put(`${this.baseUrl}/${id}/sprint`, null, { params, responseType: 'text' });
  }

  delete(id: string): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}
