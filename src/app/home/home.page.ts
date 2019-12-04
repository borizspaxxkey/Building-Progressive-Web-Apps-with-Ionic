import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventResponse } from '../interfaces';
import { Subscription } from 'rxjs';
import { EventsService } from '../events.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  events: EventResponse[] = [];
  sub: Subscription;

  constructor(private eventService: EventsService,
              private nav: NavController
  ) { }

  ngOnInit(): void {
    this.sub = this.eventService.getAll()
      .subscribe(e => this.events.push(e));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  getEvents(): EventResponse[] {
    return this.events.sort((a, b) => a.event.created > b.event.created ? -1 : 1);
  }

  details(response: EventResponse) {
    this.nav.navigateForward(`/details/${response.event.id}`);
  }
}
