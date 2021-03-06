import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RoleIds, UserRole } from '@app/domain/access';
import { User } from '@app/domain/users';
import { AuthStoreActions, AuthStoreReducer } from '@app/root-store/auth-store';
import { Store, StoreModule } from '@ngrx/store';
import { AdminComponent } from './admin.component';

describe('AdminComponent', () => {
  let store: Store<AuthStoreReducer.State>;
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({
          'auth': AuthStoreReducer.reducer
        })
      ],
      declarations: [AdminComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });

    store = TestBed.get(Store);
    fixture = TestBed.createComponent(AdminComponent);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display cards when user has the correct permissions', function() {
    const roles = [
      new UserRole().deserialize({ id: RoleIds.StudyAdministrator }),
      new UserRole().deserialize({ id: RoleIds.CentreAdministrator }),
      new UserRole().deserialize({ id: RoleIds.UserAdministrator })
    ];

    roles.forEach(role => {
      const user = new User().deserialize({ roles: [ role ] } as any);
      const action = new AuthStoreActions.LoginSuccessAction({ user });
      store.dispatch(action);

      fixture.detectChanges();
      const cards = fixture.debugElement.queryAll(By.css('.card'));
      expect(cards).toBeTruthy();
    });
  });
});
