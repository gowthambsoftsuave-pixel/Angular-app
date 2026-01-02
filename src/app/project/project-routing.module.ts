import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { ProjectComponent } from "./project.component";
import { ProjectDeleteComponent } from "./projectdelete/projectdelete.component";
import { ProjectDetailsComponent } from "./projectdetails/projectdetails.component";

const routes: Routes = [
  { path: '', component: ProjectComponent },
  { path: 'delete/:id', component: ProjectDeleteComponent },
  { path: ':id', component: ProjectDetailsComponent }
];


@NgModule({
    imports : [RouterModule.forChild(routes)],
    exports : [RouterModule]
})

export class ProjectRoutingModule{}