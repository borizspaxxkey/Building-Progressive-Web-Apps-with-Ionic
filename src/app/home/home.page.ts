import { Component, OnDestroy, OnInit, ApplicationRef } from '@angular/core';
import { EventResponse } from '../interfaces';
import { Subscription, from, interval, concat } from 'rxjs';
import { EventsService } from '../events.service';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { Network } from '@ngx-pwa/offline';
import { SwUpdate, UpdateAvailableEvent } from '@angular/service-worker';
import { first } from 'rxjs/operators';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  events: EventResponse[] = [];
  subscriptions: Subscription[] = [];
  online$ = this.network.onlineChanges;

  constructor(private eventService: EventsService,
    private nav: NavController,
    private appRef: ApplicationRef,
    private network: Network,
    private updater: SwUpdate,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventService.getAll()
      .subscribe(e => this.events.push(e)));

    this.initUpdater();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getEvents(): EventResponse[] {
    return this.events.sort((a, b) => a.event.created > b.event.created ? -1 : 1);
  }

  details(response: EventResponse) {
    this.nav.navigateForward(`/details/${response.event.id}`);
  }

  initUpdater() {

    const updateInterval$ = interval(1000 * 60 * 1);
    const appIsStable$ = this.appRef.isStable.pipe(first(isStable => isStable === true));
    const appStableInterval$ = concat(appIsStable$, updateInterval$);

    this.subscriptions.push(this.updater.available.subscribe((e) => this.onUpdateAvailable(e)));
    this.subscriptions.push(this.updater.available.subscribe((e) => this.onUpdateActivated(e)));
    this.subscriptions.push(appStableInterval$.subscribe(() => this.checkForUpdate()));
  }

  async checkForUpdate() {
    if (this.updater.isEnabled) {
      await this.updater.checkForUpdate();
    }
  }

  async onUpdateActivated(e: UpdateAvailableEvent) {
    await this.showToastMessage('Application updating');
  }

  async onUpdateAvailable(event: UpdateAvailableEvent) {
    const updateMessage = event.available.appData['updateMessage'];
    console.log('A new version is available: ', updateMessage);

    const alert = await this.alertController.create({
      header: 'Update Available',
      message: 'A new version of the application is available. ' +
        `(Details: ${updateMessage}) ` +
        `Click OK to update now.`,
      buttons: [
        {
          text: 'Not Now',
          role: 'cancel',
          cssClass: 'secondary',
          handler: async () => {
            await this.showToastMessage('Update deferred');
          }
        },
        {
          text: 'OK',
          handler: async () => {
            await this.updater.activateUpdate();
            window.location.reload();
          }
        }
      ]
    });
  }

  async showToastMessage(msg: string) {
    console.log(msg);
    const toast = await this.toastController.create({
      message: msg,
      duration: 3000,
      showCloseButton: true,
      position: 'top',
      closeButtonText: 'OK'
    });
  }

  async doRefresh(event) {
    try {
      const maxEvent = this.events.reduce((prev, current) =>
        (prev.event.id > current.event.id) ? prev : current);
      const maxEventId = +maxEvent.event.id + 1;

      const response = await this.eventService.getById(maxEventId).toPromise();

      this.events.push(response);
    } catch (err) {
      console.log(err)
    } finally {
      event.target.complete();
    }
  }

}
