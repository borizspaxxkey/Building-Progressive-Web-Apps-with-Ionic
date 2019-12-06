import { Component, OnInit } from '@angular/core';
import { EventResponse, EmergencyEvent, Acknowledgement } from '../interfaces';
import { ActivatedRoute } from '@angular/router';
import { EventsService } from '../events.service';
import { Network } from '@ngx-pwa/offline';

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit {
  eventId: number;
  eventResponse: EventResponse;
  event: EmergencyEvent;
  acknowledgments: Acknowledgement[] = [];
  newNote = '';
  online$ = this.network.onlineChanges;

  constructor(private route: ActivatedRoute,
              private eventService: EventsService,
              private network: Network) { }

  async ngOnInit() {
    this.eventId = +this.route.snapshot.params.eventId;
    this.eventResponse = await this.eventService
                                   .getById(this.eventId)
                                   .toPromise();

    this.event = this.eventResponse.event;
    this.acknowledgments = await this.eventService
                                     .getAcknowledgements(this.eventResponse)
                                     .toPromise();
  }

}
