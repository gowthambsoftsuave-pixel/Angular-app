import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  constructor(private router: Router, private auth: AuthService) {}

  goToPersons() {
    this.router.navigateByUrl('/dashboard/persons');
  }

  goToProjects() {
    this.router.navigateByUrl('/dashboard/projects');
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
