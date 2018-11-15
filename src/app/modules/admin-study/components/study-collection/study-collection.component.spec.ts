import { CUSTOM_ELEMENTS_SCHEMA, NgZone } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CollectionEventType, Study, StudyState } from '@app/domain/studies';
import { EventTypeStoreActions, EventTypeStoreReducer, StudyStoreReducer } from '@app/root-store';
import { SpinnerStoreReducer } from '@app/root-store/spinner';
import { TruncatePipe } from '@app/shared/pipes';
import { YesNoPipe } from '@app/shared/pipes/yes-no-pipe';
import { Factory } from '@app/test/factory';
import { MockActivatedRoute } from '@app/test/mocks';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Store, StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { EventTypeViewComponent } from '../event-type-view/event-type-view.component';
import { EventTypesAddAndSelectComponent } from '../event-types-add-and-select/event-types-add-and-select.component';
import { StudyCollectionComponent } from './study-collection.component';

describe('StudyCollectionComponent', () => {

  let component: StudyCollectionComponent;
  let fixture: ComponentFixture<StudyCollectionComponent>;
  let ngZone: NgZone;
  let router: Router;
  let store: Store<StudyStoreReducer.State>;
  let mockActivatedRoute = new MockActivatedRoute();
  let factory: Factory;

  beforeEach(async(() => {
    factory = new Factory();

    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        NgbModule.forRoot(),
        RouterTestingModule,
        StoreModule.forRoot({
          'spinner': SpinnerStoreReducer.reducer,
          'study': StudyStoreReducer.reducer,
          'event-type': EventTypeStoreReducer.reducer
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
        StudyCollectionComponent,
        EventTypesAddAndSelectComponent,
        EventTypeViewComponent,
        TruncatePipe,
        YesNoPipe
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    ngZone = TestBed.get(NgZone);
    router = TestBed.get(Router);
    store = TestBed.get(Store);

    jest.spyOn(router, 'navigate');

    fixture = TestBed.createComponent(StudyCollectionComponent);
    component = fixture.componentInstance;

    ngZone.run(() => router.initialNavigation());
  });

  it('should create', () => {
    const study = new Study().deserialize(factory.study());
    expect(study.state).toBe(StudyState.Disabled);
    mockActivatedRouteSnapshot(study);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('when user wants to add an event type', () => {

    it('changes state if study is disabled', () => {
    const study = new Study().deserialize(factory.study());
    mockActivatedRouteSnapshot(study);
      fixture.detectChanges();
      ngZone.run(() => component.addEventTypeSelected());
      expect(router.navigate.mock.calls.length).toBe(1);
      expect(router.navigate.mock.calls[0][0]).toEqual([ 'add' ]);
    });

    it('throws an error if user  ', () => {
      [ StudyState.Enabled, StudyState.Retired ].forEach(state => {
        const studyWrongState = new Study().deserialize({
          ...factory.study(),
          state
        });
        mockActivatedRouteSnapshot(studyWrongState);
        component.ngOnInit();
        expect(() => component.addEventTypeSelected()).toThrowError('modifications not allowed');
      });
    });

  });

  it('dispatches and action when user selects and existing event type', () => {
    const study = new Study().deserialize(factory.study());
    const eventType = new CollectionEventType().deserialize(factory.collectionEventType());
    jest.spyOn(store, 'dispatch');

    mockActivatedRouteSnapshot(study);
    fixture.detectChanges();
    store.dispatch.mockReset();
    ngZone.run(() => component.eventTypeSelected(eventType));
    fixture.detectChanges();

    expect(store.dispatch.mock.calls.length).toBe(1);
    expect(store.dispatch.mock.calls[0][0])
      .toEqual(new EventTypeStoreActions.EventTypeSelected({ id: eventType.id }));
  });

  function mockActivatedRouteSnapshot(study: Study): void {
    mockActivatedRoute.spyOnParent(() => ({
      parent: {
        snapshot: {
          data: {
            study
          }
        }
      }
    }));

    mockActivatedRoute.spyOnSnapshot(() => ({
      params: {
        slug: study.slug
      }
    }));
  }
});
