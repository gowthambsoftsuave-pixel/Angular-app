import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationService } from '../shared/navigation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-operations',
  standalone:false,
  templateUrl: './operations.component.html',
  styleUrls: ['./operations.component.scss']
})

export class OperationsComponent implements OnInit, OnDestroy {
  currentSection = 'projects';
  private subscription!: Subscription;

  constructor(private navService: NavigationService) {}

  ngOnInit() {
    this.subscription = this.navService.currentSection$.subscribe(section => {
      this.currentSection = section;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
