import { Injectable } from "@angular/core";
import { HttpClient,HttpParams,HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { API_BASE } from "../api.config";
import { TaskDto,TaskCreateDto,TaskResponseDto,TaskUpdateDto } from "../dtos/api.dtos";

@Injectable({providedIn : 'root'})
export class TaskApiService{
    private readonly baseUrl = `${API_BASE}/Task`;

    constructor(private http:HttpClient){}

    getAll(): Observable<TaskDto[]>{
        return this.http.get<TaskDto[]>(this.baseUrl);
    }

    getById(id: string): Observable<TaskDto>{
        return this.http.get<TaskDto>(`${this.baseUrl}/${id}`);
    }

    create(dto: TaskCreateDto): Observable<TaskDto>{
        return this.http.post<TaskDto>(this.baseUrl,dto);
    }

    updateStatus (taskId:string,userId:string,dto:TaskUpdateDto): Observable<TaskResponseDto>{
        const url = `${this.baseUrl}/${taskId}/status`;
        return this.http.put(url,dto,{params:{userId}});
    }

    reassignTask (taskId:string,userId:string,newPersonId:string):Observable<TaskResponseDto>{
        const url = `${this.baseUrl}/${taskId}/reassign`;
        return this.http.put(url,null,{params:{userId,newPersonId}})
    }

    deleteTask(taskId:string):Observable<string>{
        return this.http.delete(`${this.baseUrl}/${taskId}`,{responseType:'text'})
    }
}