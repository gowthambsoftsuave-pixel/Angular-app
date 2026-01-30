// src/app/shared/person-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { PagedRequest, PagedResponse, PersonCreateDto, PersonDto, PersonTeamResponseDto, PersonUpdateDto } from '../dtos/api.dtos';

@Injectable({ providedIn: 'root' })
export class PersonApiService {
  private readonly baseUrl = `${API_BASE}/Person`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<PersonDto[]> {
    return this.http.get<PersonDto[]>(this.baseUrl);
  }

  getPaged(request: PagedRequest): Observable<PagedResponse<PersonDto>> {
    let params = new HttpParams()
      .set('pageNumber', request.pageNumber.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.search) params = params.set('search', request.search);
    if (request.role) params = params.set('role', request.role);
    if (request.sortBy) params = params.set('sortBy', request.sortBy);
    if (request.sortDirection) params = params.set('sortDirection', request.sortDirection);

    return this.http.get<PagedResponse<PersonDto>>(`${this.baseUrl}/paged`, { params });
  }

  getById(id: string): Observable<PersonDto> {
    return this.http.get<PersonDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: PersonCreateDto): Observable<PersonDto> {
    return this.http.post<PersonDto>(this.baseUrl, dto);
  }

  createBulk(dtos: PersonCreateDto[]): Observable<PersonDto[]> {
    return this.http.post<PersonDto[]>(`${this.baseUrl}/bulk`, dtos);
  }

  update(id: string, dto: PersonUpdateDto): Observable<string> {
    return this.http.put(`${this.baseUrl}/${id}`, dto, { responseType: 'text' });
  }

  delete(id: string): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }

  getTeamDetails(projectTeamId: string, requesterId: string): Observable<PersonTeamResponseDto> {
    // Controller expects requesterId in header [file:53]
    const headers = new HttpHeaders({ requesterId });
    return this.http.get<PersonTeamResponseDto>(`${this.baseUrl}/team/${projectTeamId}`, { headers });
  }
}
