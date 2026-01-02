import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PersonComponent } from '../person/person.component';
import { PersonDetailComponent } from '../person/persondetails/persondetails.component';
import { PersonDeleteComponent } from '../person/persondelete/persondelete.component';

const routes: Routes = [
  { path: '', component: PersonComponent },
  { path: 'delete/:id', component: PersonDeleteComponent },
  { path: ':id', component: PersonDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PersonRoutingModule {}
