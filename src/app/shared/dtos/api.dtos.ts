// src/app/shared/api.dtos.ts

// Generic Pagination DTOs
export interface PagedRequest {
  pageNumber: number;
  pageSize: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PagedResponse<T> {
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
}

// Matches your table + controllers usage [file:53][file:52]
export interface PersonDto {
  personId: string;
  name: string;
  role: number;
  isActive: boolean;
}

export interface PersonCreateDto {
  name: string;
  role: number;
  isActive?: boolean;
}

export interface PersonUpdateDto {
  name: string;
  role: number;
  isActive?: boolean;
}

export interface PersonTeamResponseDto {
  projectTeamId: string;
  personId: string[];
}

export interface ProjectDto {
  projectId: string;
  projectName: string;
  totalSprintCount: number;
  currentSprintCount: number;
  createdByAdminId: string;
  isCompleted: boolean;
}

export interface ProjectCreateDto {
  projectName: string;
  totalSprintCount: number;
  createdByAdminId: string;
}

export interface ProjectUpdateDto {
  projectName?: string;
  isCompleted?: boolean;
}

export interface TaskCreateDto {
  TaskName?: string;
  ProjectId?: string;
  AssignedToPersonId?: string;
  SprintNumber?: number;
  Status?: number;
}

export interface TaskDto {
  TaskId?: string;
  TaskName?: string;
  ProjectId?: string;
  AssignedToPersonId?: string;
  SprintNumber?: number;
  Status?: number;
}


export interface TaskUpdateDto {
  Status?: number;
}

export interface TaskResponseDto {
  TaskId?: string;
  TaskName?: string;
  ProjectId?: string;
}

