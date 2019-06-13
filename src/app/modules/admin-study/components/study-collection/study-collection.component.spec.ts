import { CUSTOM_ELEMENTS_SCHEMA, NgZone } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Study, StudyState } from '@app/domain/studies';
import { EventTypeStoreReducer, StudyStoreActions, StudyStoreReducer } from '@app/root-store';
import { SpinnerStoreReducer } from '@app/root-store/spinner';
import { TruncatePipe } from '@app/shared/pipes';
import { YesNoPipe } from '@app/shared/pipes/yes-no-pipe';
import { Factory } from '@test/factory';
import { MockActivatedRoute } from '@test/mocks';
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
  const mockActivatedRoute = new MockActivatedRoute();
  let routerListener: any;
  const factory = new Factory();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        NgbModule,
        RouterTestingModule,
        StoreModule.forRoot({
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

    routerListener = jest.spyOn(router, 'navigate');

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

    it('changes state if study is disabled', async(() => {
      const study = new Study().deserialize(factory.study());
      expect(study.state).toBe(StudyState.Disabled);
      mockActivatedRouteSnapshot(study);
      store.dispatch(StudyStoreActions.getStudySuccess({ study }));
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        ngZone.run(() => component.addEventTypeSelected());
        expect(routerListener.mock.calls.length).toBe(1);
        expect(routerListener.mock.calls[0][0]).toEqual([ '../add' ]);
      });
    }));

    it('throws an error if is study is not disabled', () => {
      [ StudyState.Enabled, StudyState.Retired ].forEach(state => {
        const studyWrongState = new Study().deserialize({
          ...factory.study(),
          state
        });
        mockActivatedRouteSnapshot(studyWrongState);
        store.dispatch(StudyStoreActions.getStudySuccess({ study: studyWrongState }));
        fixture.detectChanges();
        expect(() => component.addEventTypeSelected()).toThrowError('modifications not allowed');
      });
    });

  });

  function mockActivatedRouteSnapshot(study: Study): void {
    mockActivatedRoute.spyOnParent(() => ({
      parent: {
        snapshot: {
          params: {
            slug: study.slug
          },
          data: {
            study
          }
        }
      }
    }));

    mockActivatedRoute.spyOnSnapshot(() => ({
      params: {}
    }));
  }
});
