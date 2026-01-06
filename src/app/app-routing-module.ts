import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { AccessGuard } from './auth/access.guard';

const routes: Routes = [
  // Public
  { path: 'login', component: LoginComponent },

  // Optional: unauthorized page (make a simple component)
  // { path: 'unauthorized', component: UnauthorizedComponent, canActivate: [AuthGuard] },

  // Legacy redirects
  { path: 'persons/delete/:id', redirectTo: 'dashboard/persons/delete/:id' },
  { path: 'persons/:id', redirectTo: 'dashboard/persons/:id' },
  { path: 'persons', redirectTo: 'dashboard/persons', pathMatch: 'full' },

  { path: 'projects/delete/:id', redirectTo: 'dashboard/projects/delete/:id' },
  { path: 'projects/:id', redirectTo: 'dashboard/projects/:id' },
  { path: 'projects', redirectTo: 'dashboard/projects', pathMatch: 'full' },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AccessGuard],
    children: [
      { path: '', redirectTo: 'projects', pathMatch: 'full' },

      {
        path: 'persons',
        loadChildren: () =>
          import('./person/person.module').then((m) => m.PersonModule)
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./project/project.module').then((m) => m.ProjectModule)
      },

      // If you want unauthorized page inside dashboard layout instead:
      // { path: 'unauthorized', component: UnauthorizedComponent },
    ]
  },

  // Default
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // Fallback
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
