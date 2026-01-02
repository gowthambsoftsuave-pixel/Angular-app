import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { PersonComponent } from "./person.component";
import { SharedModule } from "../shared/shared.module";
import { PersonRoutingModule } from "./person-routing.module";
import { PersonDetailComponent } from "./persondetails/persondetails.component";
import { PersonDeleteComponent } from "./persondelete/persondelete.component";

@NgModule({
    declarations : [PersonComponent,PersonDetailComponent,PersonDeleteComponent],
    imports: [CommonModule,FormsModule,SharedModule,PersonRoutingModule]
})

export class PersonModule{}