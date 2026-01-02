import {NgModule } from '@angular/core'
import {CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { ProjectComponent } from './project.component'
import { SharedModule } from '../shared/shared.module'
import { ProjectRoutingModule } from './project-routing.module'
import { ProjectDeleteComponent } from './projectdelete/projectdelete.component'
import { ProjectDetailsComponent } from './projectdetails/projectdetails.component'

@NgModule({
    declarations : [ProjectComponent,ProjectDeleteComponent,ProjectDetailsComponent],
    imports : [CommonModule,FormsModule,SharedModule,ProjectRoutingModule]
})

export class ProjectModule {}