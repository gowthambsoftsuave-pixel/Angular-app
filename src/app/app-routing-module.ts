import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PersonComponent } from './person/person.component';
import { ProjectComponent } from './project/project.component';

const routes: Routes = [
  { path: '', redirectTo: '/projects', pathMatch: 'full' },
  { path: 'persons', component: PersonComponent },
  { path: 'projects', component: ProjectComponent },
  { path: '**', redirectTo: '/projects' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
