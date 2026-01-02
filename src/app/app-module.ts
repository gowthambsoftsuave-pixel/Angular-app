import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { PersonComponent } from './person/person.component';
import { ProjectComponent } from './project/project.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { OperationsComponent } from './operations/operations.component';
import { TablesComponent } from './table/table.component';

@NgModule({
  declarations: [App, PersonComponent, ProjectComponent, SidebarComponent, OperationsComponent, TablesComponent],
  imports: [BrowserModule, CommonModule, FormsModule, AppRoutingModule],
  providers: [provideClientHydration(withEventReplay()), provideHttpClient()],
  bootstrap: [App]
})
export class AppModule { }
