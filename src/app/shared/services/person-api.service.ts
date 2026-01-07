// src/app/shared/person-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { PersonCreateDto, PersonDto, PersonTeamResponseDto, PersonUpdateDto,PersonPagedResponseDto } from '../dtos/api.dtos';

@Injectable({ providedIn: 'root' })
export class PersonApiService {
  private readonly baseUrl = `${API_BASE}/Person`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PersonDto[]> {
    return this.http.get<PersonDto[]>(this.baseUrl);
  }

  getById(id: string): Observable<PersonDto> {
    return this.http.get<PersonDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: PersonCreateDto): Observable<PersonDto> {
    return this.http.post<PersonDto>(this.baseUrl, dto);
  }

  update(id: string, dto: PersonUpdateDto): Observable<string> {
    return this.http.put(`${this.baseUrl}/${id}`, dto, { responseType: 'text' });
  }

  delete(id: string): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }

  getTeamDetails(projectTeamId: string, requesterId: string): Observable<PersonTeamResponseDto> {
    const headers = new HttpHeaders({ requesterId });
    return this.http.get<PersonTeamResponseDto>(`${this.baseUrl}/team/${projectTeamId}`, { headers });
  }

  getPersonsPaged(params:HttpParams):Observable<PersonPagedResponseDto>{
    return this.http.get<PersonPagedResponseDto>(`${this.baseUrl}/paged`,{
      params });
  }
}
