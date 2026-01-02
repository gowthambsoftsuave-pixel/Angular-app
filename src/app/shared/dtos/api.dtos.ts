// src/app/shared/api.dtos.ts

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
  isCompleted?: boolean;
}

export interface ProjectUpdateDto {
  projectName?: string;
  isCompleted?: boolean;
}
