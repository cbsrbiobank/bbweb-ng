import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Participant } from '@app/domain/participants';
import { EventStoreReducer, ParticipantStoreReducer, StudyStoreReducer, ParticipantStoreActions, StudyStoreActions } from '@app/root-store';
import { Store, StoreModule } from '@ngrx/store';
import { Factory } from '@test/factory';
import { MockActivatedRoute } from '@test/mocks';
import { ToastrModule } from 'ngx-toastr';
import { ParticipantSummaryComponent } from './participant-summary.component';
import { Study } from '@app/domain/studies';
import { cold } from 'jasmine-marbles';


describe('ParticipantSummaryComponent', () => {
  let component: ParticipantSummaryComponent;
  let fixture: ComponentFixture<ParticipantSummaryComponent>;
  const mockActivatedRoute = new MockActivatedRoute();
  const factory = new Factory();
  let study: Study;
  let participant: Participant;
  let store: Store<ParticipantStoreReducer.State>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        StoreModule.forRoot({
          'study': StudyStoreReducer.reducer,
          'participant': ParticipantStoreReducer.reducer,
          'event': EventStoreReducer.reducer
        }),
        ToastrModule.forRoot()
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: mockActivatedRoute
        }
      ],
      declarations: [
        ParticipantSummaryComponent
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantSummaryComponent);
    component = fixture.componentInstance;

    store = TestBed.get(Store);
    participant = new Participant().deserialize(factory.participant());
    study = new Study().deserialize(factory.defaultStudy());
    mockActivatedRouteSnapshot(participant);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  fit('entities is loaded from the store', () => {
    fixture.detectChanges();
    expect(component.entities$).toBeObservable(cold('a', { a: undefined }));

    store.dispatch(StudyStoreActions.getStudySuccess({ study }));
    store.dispatch(ParticipantStoreActions.getParticipantSuccess({ participant }));
    fixture.detectChanges();
    //expect(component.entities$).toBeObservable(cold('a', { a: { participant, study } }));
    const entities = { participant, study };
    expect(component.entities$).toBeObservable(cold('a', { a: entities }));
  });

  function mockActivatedRouteSnapshot(participant: Participant): void {
    mockActivatedRoute.spyOnParent(() => ({
      snapshot: {
        data: {
          participant
        },
        params: {
          slug: participant.slug
        }
      }
    }));

    mockActivatedRoute.spyOnSnapshot(() => ({
      params: {}
    }));
  }
});
