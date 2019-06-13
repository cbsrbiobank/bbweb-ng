import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Participant, CollectionEvent } from '@app/domain/participants';
import { EventStoreReducer, ParticipantStoreActions, ParticipantStoreReducer } from '@app/root-store';
import { Store, StoreModule } from '@ngrx/store';
import { Factory } from '@test/factory';
import { MockActivatedRoute } from '@test/mocks';
import { ToastrModule } from 'ngx-toastr';
import { EventAddSelectComponent } from '../event-add-select/event-add-select.component';
import { ParticipantEventsComponent } from './participant-events.component';
import { cold } from 'jasmine-marbles';

describe('ParticipantEventsComponent', () => {
  let component: ParticipantEventsComponent;
  let fixture: ComponentFixture<ParticipantEventsComponent>;
  const mockActivatedRoute = new MockActivatedRoute();
  const factory = new Factory();
  let participant: Participant;
  let store: Store<ParticipantStoreReducer.State>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        StoreModule.forRoot({
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
        EventAddSelectComponent,
        ParticipantEventsComponent
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantEventsComponent);
    component = fixture.componentInstance;

    store = TestBed.get(Store);
    participant = new Participant().deserialize(factory.participant());
    mockActivatedRouteSnapshot(participant);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('participant is loaded from the store', () => {
    fixture.detectChanges();
    expect(component.participant$).toBeObservable(cold('a', { a: undefined }));

    store.dispatch(ParticipantStoreActions.getParticipantSuccess({ participant }));
    fixture.detectChanges();
    expect(component.participant$).toBeObservable(cold('a', { a: participant }));
  });

  it('change state when an event is added', () => {
    const router = TestBed.get(Router);
    const routerListener = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    component.addEventSelected();
    fixture.detectChanges();
    expect(routerListener.mock.calls.length).toBe(1);
    expect(routerListener.mock.calls[0][0]).toEqual([ '../add' ]);
  });

  it('change state when an event is selected', () => {
    const router = TestBed.get(Router);
    const routerListener = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    const event = new CollectionEvent().deserialize(factory.collectionEvent());
    component.eventSelected(event);
    fixture.detectChanges();
    expect(routerListener.mock.calls.length).toBe(1);
    expect(routerListener.mock.calls[0][0]).toEqual([ event.visitNumber ]);
  });

  function mockActivatedRouteSnapshot(participant: Participant): void {
    mockActivatedRoute.spyOnParent(() => ({
      parent: {
        snapshot: {
          data: {
            participant
          },
          params: {
            slug: participant.slug
          }
        }
      }
    }));

    mockActivatedRoute.spyOnSnapshot(() => ({
      params: {}
    }));
  }
});
