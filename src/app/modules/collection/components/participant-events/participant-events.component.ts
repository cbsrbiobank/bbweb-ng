import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionEvent, Participant } from '@app/domain/participants';
import { ParticipantStoreSelectors, RootStoreState } from '@app/root-store';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-participant-events',
  templateUrl: './participant-events.component.html',
  styleUrls: ['./participant-events.component.scss']
})
export class ParticipantEventsComponent implements OnInit {

  participant$: Observable<Participant>;

  constructor(private store$: Store<RootStoreState.State>,
              private router: Router,
              private route: ActivatedRoute) {}

  ngOnInit() {
    this.participant$ = this.store$.pipe(
      select(ParticipantStoreSelectors.selectAllParticipantEntities),
      map(entities => {
        const entity = entities[this.route.parent.parent.snapshot.data.participant.id];
        if (entity) {
          return (entity instanceof Participant) ? entity :  new Participant().deserialize(entity);
        }
        return undefined;
      }));
  }

  addEventSelected() {
    this.router.navigate([ '../add' ], { relativeTo: this.route });
  }

  eventSelected(event: CollectionEvent) {
    this.router.navigate([ event.visitNumber ], { relativeTo: this.route });
  }

}
