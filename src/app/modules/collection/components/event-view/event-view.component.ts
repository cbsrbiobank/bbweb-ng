import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionEvent, Specimen, Participant } from '@app/domain/participants';
import { CollectionEventType } from '@app/domain/studies';
import { EventTypeStoreActions, EventTypeStoreSelectors, RootStoreState, EventStoreActions, EventStoreSelectors, SpecimenStoreActions, SpecimenStoreSelectors } from '@app/root-store';
import { Dictionary } from '@ngrx/entity';
import { select, Store, createSelector } from '@ngrx/store';
import { Observable, Subject, combineLatest, BehaviorSubject } from 'rxjs';
import { map, takeUntil, tap, withLatestFrom, shareReplay, take, filter } from 'rxjs/operators';
import { annotationFromType, Annotation } from '@app/domain/annotations';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SearchParams } from '@app/domain';
import { ModalInputOptions } from '@app/modules/modals/models';

interface SelectorData {
  events: Dictionary<CollectionEvent>;
  eventTypes: Dictionary<CollectionEventType>;
  specimens: Specimen[];
}

interface EntityData {
  event: CollectionEvent;
  eventType: CollectionEventType;
  specimens: Specimen[];
}

@Component({
  selector: 'app-event-view',
  templateUrl: './event-view.component.html',
  styleUrls: ['./event-view.component.scss']
})
export class EventViewComponent implements OnInit, OnDestroy {

  @ViewChild('updateVisitNumberModal') updateVisitNumberModal: TemplateRef<any>;
  @ViewChild('updateTimeCompletedModal') updateTimeCompletedModal: TemplateRef<any>;
  @ViewChild('updateAnnotationModal') updateAnnotationModal: TemplateRef<any>;
  @ViewChild('removeEventModal') removeEventModal: TemplateRef<any>;
  @ViewChild('hasSpecimensModal') hasSpecimensModal: TemplateRef<any>;

  data$: Observable<EntityData>;
  event$: Observable<CollectionEvent>;
  eventTypes$: Observable<Dictionary<CollectionEventType>>;
  eventType$: Observable<CollectionEventType>;
  specimens$: Observable<Specimen[]>;
  annotations$: Observable<Annotation[]>;
  participant: Participant;
  annotationToEdit: Annotation;
  visitNumberModalOptions: ModalInputOptions;
  timeCompletedModalOptions: ModalInputOptions;
  isCardCollapsed = false;

  private entitiesSubject = new BehaviorSubject(null);
  private updatedMessage$ = new Subject<string>();
  private unsubscribe$ = new Subject<void>();

  constructor(private store$: Store<RootStoreState.State>,
              private router: Router,
              private route: ActivatedRoute,
              private modalService: NgbModal,
              private toastr: ToastrService) { }

  ngOnInit() {
    this.participant = this.route.parent.parent.parent.parent.snapshot.data.participant;
    this.store$.dispatch(SpecimenStoreActions.searchSpecimensRequest({
      event: this.route.parent.snapshot.data.event,
      searchParams: new SearchParams()
    }));

    const entitiesSelector = createSelector(
      EventStoreSelectors.selectAllCollectionEventEntities,
      EventTypeStoreSelectors.selectAllEventTypeEntities,
      SpecimenStoreSelectors.selectAllSpecimens,
      (events: Dictionary<CollectionEvent>,
       eventTypes: Dictionary<CollectionEventType>,
       specimens: Specimen[]): SelectorData => ({
         events, eventTypes, specimens
      }));

    this.data$ = combineLatest([ this.route.parent.data, this.store$.pipe(select(entitiesSelector)) ]).pipe(
      map(([ routeData, entities ]) => {
        const event = entities.events[routeData.event.id];
        const eventType = entities.eventTypes[routeData.event.eventTypeId];
        const specimens = entities.specimens ? entities.specimens.filter(spc => spc.eventId === routeData.event.id) : [];

        if (eventType === undefined) {
          this.store$.dispatch(EventTypeStoreActions.getEventTypeByIdRequest({
            studyId: this.route.parent.parent.parent.parent.snapshot.data.participant.study.id,
            eventTypeId: event.eventTypeId
          }));
        }

        return { event, eventType, specimens };
      }),
      takeUntil(this.unsubscribe$),
      shareReplay());

    this.data$.pipe(takeUntil(this.unsubscribe$)).subscribe(this.entitiesSubject);
    this.event$ = this.data$.pipe(map(entities => entities.event));
    this.eventType$ = this.data$.pipe(map(entities => entities.eventType));
    this.specimens$ = this.data$.pipe(map(entities => entities.specimens));

    this.annotations$ = this.data$.pipe(map(entities => {
      if ((entities.event === undefined) || (entities.eventType === undefined)
          || (entities.eventType.annotationTypes === undefined)) {
        return [];
      }

      return entities.eventType.annotationTypes.map(at => {
        const annotation = annotationFromType(at);

        const eventAnnotation =
          entities.event.annotations.find(a => a.annotationTypeId === annotation.annotationTypeId);
        if (eventAnnotation) {
          annotation.value = eventAnnotation.value;
        }
        return annotation;
      });
    }));

    this.data$.pipe(
      withLatestFrom(this.updatedMessage$),
      takeUntil(this.unsubscribe$)
    ).subscribe(([ entities, message ]) => {
      if ((entities === undefined) || (message === null)) { return; }

      if (entities.event !== undefined) {
        this.toastr.success(message, 'Update Successfull');
        this.updatedMessage$.next(null);
        if (entities.event.visitNumber !== this.route.parent.snapshot.params.visitNumber) {
          // uniqueId was changed and a new slug was assigned
          //
          // need to change state since slug is used in URL and by breadcrumbs
          this.router.navigate([
            '/collection',
            this.route.parent.parent.parent.parent.snapshot.params.slug,
            'collection',
            'view',
            entities.event.visitNumber
          ]);
        }
      } else {
        this.toastr.success(message, 'Remove Successfull');
        this.router.navigate([
          '/collection',
          this.route.parent.parent.parent.parent.snapshot.params.slug,
          'collection'
        ]);
      }
    });

    this.store$.pipe(
      select(EventStoreSelectors.selectCollectionEventError),
      filter(error => error !== null),
      withLatestFrom(this.updatedMessage$),
      takeUntil(this.unsubscribe$)
    ).subscribe(([error, _msg]) => {
      let errMessage = error.error.error ? error.error.error.message : error.error.statusText;
      if (errMessage.indexOf('already exists') > -1) {
        errMessage = 'An event with that visit number exists. Please use a different one.';
      }
      this.toastr.error(errMessage, 'Update Error', { disableTimeOut: true });
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  updateVisitNumber() {
    const event = this.entitiesSubject.value.event;
    this.visitNumberModalOptions = { required: true };
    this.modalService.open(this.updateVisitNumberModal, { size: 'lg' }).result
      .then(value => {
        this.store$.dispatch(EventStoreActions.updateEventRequest({
          event,
          attributeName: 'visitNumber',
          value
        }));
        this.updatedMessage$.next('Visit number was updated');
      })
      .catch(() => {
        // don't care if user pressed the Cancel button
      });
  }

  updateTimeCompleted() {
    const event = this.entitiesSubject.value.event;
    this.timeCompletedModalOptions = { required: true };
    this.modalService.open(this.updateTimeCompletedModal, { size: 'lg' }).result
      .then(value => {
        this.store$.dispatch(EventStoreActions.updateEventRequest({
          event,
          attributeName: 'timeCompleted',
          value
        }));
        this.updatedMessage$.next('Time Completed was updated');
      })
      .catch(() => {
        // don't care if user pressed the Cancel button
      });
  }

  updateAnnotation(annotation: Annotation) {
    const event = this.entitiesSubject.value.event;
    this.annotationToEdit = annotation;

    this.modalService.open(this.updateAnnotationModal, { size: 'lg' }).result
      .then(value => {
        const updatedAnnotation = value;
        this.store$.dispatch(EventStoreActions.updateEventRequest({
          event,
          attributeName: 'addOrUpdateAnnotation',
          value: updatedAnnotation.serverAnnotation()
        }));
        this.updatedMessage$.next(`${annotation.label} was updated`);
      })
      .catch(() => {
        // don't care if user pressed the Cancel button
      });
  }

  remove() {
    const specimens = this.entitiesSubject.value.specimens;

    if (specimens.length > 0) {
      this.modalService.open(this.hasSpecimensModal, { size: 'lg' });
      return;
    }

    const event = this.entitiesSubject.value.event;
    this.modalService.open(this.removeEventModal).result
      .then(() => {
        this.store$.dispatch(EventStoreActions.removeEventRequest({ event }));
        this.updatedMessage$.next('Event Removed');
      })
      .catch(() => undefined);
  }

}