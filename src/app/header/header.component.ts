import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone:false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  q = '';

  // Map search keywords to routes
  private routes: Array<{ keys: string[]; url: string }> = [
    { keys: ['project', 'projects'], url: '/dashboard/projects' },
    { keys: ['person', 'persons', 'people'], url: '/dashboard/persons' },
    { keys: ['task', 'tasks'], url: '/dashboard/tasks' }
  ];

  constructor(private router: Router, private auth: AuthService) {}

  onSearchEnter(): void {
    const text = (this.q ?? '').toString().trim().toLowerCase();
    if (!text) return;

    const match = this.routes.find(r => r.keys.some(k => text.includes(k)));
    if (match) {
      this.router.navigate([match.url]); // standard navigation [web:338]
      this.q = '';
      return;
    }

    // optional: navigate to a "search results" page instead
    this.router.navigate(['/dashboard/search'], { queryParams: { q: text } });
  }

    logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
