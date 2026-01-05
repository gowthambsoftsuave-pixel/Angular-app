import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { SidebarComponent } from './sidebar/sidebar.component';
import { OperationsComponent } from './operations/operations.component';

@NgModule({
  declarations: [App, SidebarComponent, OperationsComponent],
  imports: [BrowserModule, BrowserAnimationsModule, CommonModule, FormsModule, AppRoutingModule],
  providers: [provideClientHydration(withEventReplay()), provideHttpClient(withFetch())],
  bootstrap: [App]
})
export class AppModule { }
