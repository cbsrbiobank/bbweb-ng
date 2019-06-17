import { Component, OnInit, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Participant } from '@app/domain/participants';
import { ParticipantStoreSelectors, RootStoreState, StudyStoreActions, StudyStoreSelectors, ParticipantStoreActions } from '@app/root-store';
import { select, Store, createSelector } from '@ngrx/store';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, shareReplay, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { Dictionary } from '@ngrx/entity';
import { Study } from '@app/domain/studies';
import { annotationFromType, Annotation } from '@app/domain/annotations';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ModalInputTextOptions } from '@app/modules/modals/models';

interface EntityData {
  participant: Participant;
  study: Study;
}

@Component({
  selector: 'app-participant-summary',
  templateUrl: './participant-summary.component.html',
  styleUrls: ['./participant-summary.component.scss']
})
export class ParticipantSummaryComponent implements OnInit, OnDestroy {

  @ViewChild('updateUniqueIdModal') updateUniqueIdModal: TemplateRef<any>;
  @ViewChild('updateAnnotationModal') updateAnnotationModal: TemplateRef<any>;

  entities$: Observable<EntityData>;
  participant$: Observable<Participant>;
  annotations$: Observable<Annotation[]>;
  annotationToEdit: Annotation;

  uniqueIdModalOptions: ModalInputTextOptions = {
    required: true,
    minLength: 2
  };

  annotationModalOptions: ModalInputTextOptions = {};

  private newUniqueId: string;
  private entitiesSubject = new BehaviorSubject(null);
  private updatedMessage$ = new Subject<string>();
  private unsubscribe$ = new Subject<void>();

  constructor(private store$: Store<RootStoreState.State>,
              private router: Router,
              private route: ActivatedRoute,
              private modalService: NgbModal,
              private toastr: ToastrService) { }

  ngOnInit() {
    const entitiesSelector = createSelector(
      ParticipantStoreSelectors.selectAllParticipantEntities,
      StudyStoreSelectors.selectAllStudyEntities,
      (participants: Dictionary<Participant>, studies: Dictionary<Study>): EntityData => {
        const participantEntity = participants[this.route.parent.snapshot.data.participant.id];
        if (participantEntity !== undefined) {
          const participant = (participantEntity instanceof Participant)
            ? participantEntity : new Participant().deserialize(participantEntity);

          return {
            participant,
            study: this.studyFromId(participant.study.id, studies)
          };
        }

        return undefined;
      });

    this.entities$ = this.store$.pipe(
      select(entitiesSelector),
      tap(entities => {
        if (entities === undefined) { return; }
        if ((entities.study === undefined) || (entities.study.timeAdded === undefined)) {
          this.store$.dispatch(StudyStoreActions.getStudyRequest({ slug: entities.participant.study.slug }));
        }
      }),
      takeUntil(this.unsubscribe$),
      shareReplay());

    this.entities$.pipe(takeUntil(this.unsubscribe$)).subscribe(this.entitiesSubject);
    this.participant$ = this.entities$.pipe(map(entities => entities ? entities.participant : undefined));

    this.entities$.pipe(
      withLatestFrom(this.updatedMessage$),
      takeUntil(this.unsubscribe$)
    ).subscribe(([ entities, message ]) => {
      if ((entities === undefined) || (message == null)) { return; }

      this.toastr.success(message, 'Update Successfull');
      this.updatedMessage$.next(null);
      if (entities.participant.slug !== this.route.parent.snapshot.params.slug) {
        // uniqueId was changed and a new slug was assigned
        //
        // need to change state since slug is used in URL and by breadcrumbs
        this.router.navigate([ '../..', entities.participant.slug, 'summary' ], { relativeTo: this.route });
      }
    });

    this.store$.pipe(
      select(ParticipantStoreSelectors.selectParticipantError),
      withLatestFrom(this.updatedMessage$),
      takeUntil(this.unsubscribe$)
    ).subscribe(([ error, _msg ]) => {
      if (error === null) { return; }

      let errMessage = error.error.error ? error.error.error.message : error.error.statusText;
      if (errMessage.match(/participant with unique ID already exists/)) {
        errMessage = `A participant with the ID ${this.newUniqueId} already exits.`;
      }
      this.toastr.error(errMessage, 'Update Error', { disableTimeOut: true });
    });

    this.annotations$ = this.entities$.pipe(map(entities => {
      if (entities.study === undefined) { return []; }

      return entities.study.annotationTypes.map(at => {
        const annotation = annotationFromType(at);
        const participantAnnotation =
          entities.participant.annotations.find(a => a.annotationTypeId === annotation.annotationTypeId);
        if (participantAnnotation) {
          annotation.value = participantAnnotation.value;
        }
        return annotation;
      });
    }));
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  updateUniqueId() {
    const participant = this.entitiesSubject.value.participant;
    this.modalService.open(this.updateUniqueIdModal, { size: 'lg' }).result
      .then(value => {
        this.newUniqueId = value;
        this.store$.dispatch(ParticipantStoreActions.updateParticipantRequest({
          participant,
          attributeName: 'uniqueId',
          value
        }));
        this.updatedMessage$.next('Unique ID was updated');
      })
      .catch(() => {
        // don't care if user pressed the Cancel button
      });
  }

  updateAnnotation(annotation: Annotation) {
    const participant = this.entitiesSubject.value.participant;
    this.annotationToEdit = annotation;

    this.modalService.open(this.updateAnnotationModal, { size: 'lg' }).result
      .then(value => {
        const updatedAnnotation = value;
        this.store$.dispatch(ParticipantStoreActions.updateParticipantRequest({
          participant,
          attributeName: 'addAnnotation',
          value: updatedAnnotation.serverAnnotation()
        }));
        this.updatedMessage$.next(`${annotation.label} was updated`);
      })
      .catch(() => {
        // don't care if user pressed the Cancel button
      });
  }

  private studyFromId(studyId: string, studies: Dictionary<Study>): Study {
    const study = studies[studyId];

    if (study) {
      return (study instanceof Study) ? study : new Study().deserialize(study);
    }
    return undefined;
  }

}
