import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/projects', pathMatch: 'full' },

  { path: 'persons', loadChildren: () => import('./person/person.module').then(m => m.PersonModule) },
  { path: 'projects', loadChildren: () => import('./project/project.module').then(m => m.ProjectModule) },

  { path: '**', redirectTo: '/projects' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
