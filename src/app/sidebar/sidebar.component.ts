import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone : false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  goToPersons() {
    console.log('Go to Persons');
  }

  goToProjects() {
    console.log('Go to Projects');
  }
}
