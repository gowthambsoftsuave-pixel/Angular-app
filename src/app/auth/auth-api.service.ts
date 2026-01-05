import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface MeDto {
  userId: string;
  username: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private http: HttpClient) {}

  me(): Observable<MeDto> {
    return this.http.get<MeDto>(`${environment.apiBaseUrl}/api/auth/me`);
  }
}
