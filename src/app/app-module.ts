import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { MaterialModule } from './shared/material.module';
import { ToastrModule } from 'ngx-toastr';

import { App } from './app';
import { SidebarComponent } from './sidebar/sidebar.component';
import { OperationsComponent } from './operations/operations.component';
import { HeaderComponent } from './header/header.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { AuthInterceptor } from './auth/auth.interceptor';

@NgModule({
  declarations: [
    App,
    SidebarComponent,
    OperationsComponent,
    HeaderComponent,
    LoginComponent,
    DashboardComponent
  ],

  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    MaterialModule,
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-right',
      timeOut: 3000,
      closeButton: true,
      progressBar: true
    })
  ],

  providers: [
    provideClientHydration(withEventReplay()),

    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
    ),

    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],

  bootstrap: [App]
})
export class AppModule {}
