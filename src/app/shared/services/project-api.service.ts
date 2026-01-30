import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { PagedRequest, PagedResponse, ProjectCreateDto, ProjectDto, ProjectUpdateDto } from '../dtos/api.dtos';

@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private readonly baseUrl = `${API_BASE}/Project`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(this.baseUrl);
  }

  getPaged(request: PagedRequest): Observable<PagedResponse<ProjectDto>> {
    let params = new HttpParams()
      .set('pageNumber', request.pageNumber.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.search) params = params.set('search', request.search);
    if (request.sortBy) params = params.set('sortBy', request.sortBy);
    if (request.sortDirection) params = params.set('sortDirection', request.sortDirection);

    return this.http.get<PagedResponse<ProjectDto>>(`${this.baseUrl}/paged`, { params });
  }

  getById(id: string): Observable<ProjectDto> {
    return this.http.get<ProjectDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: ProjectCreateDto): Observable<ProjectDto> {
    return this.http.post<ProjectDto>(this.baseUrl, dto);
  }

  createBulk(dtos: ProjectCreateDto[]): Observable<ProjectDto[]> {
    return this.http.post<ProjectDto[]>(`${this.baseUrl}/bulk`, dtos);
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
