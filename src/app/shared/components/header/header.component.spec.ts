import { CUSTOM_ELEMENTS_SCHEMA, NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { RoleIds } from '@app/domain/access';
import { User } from '@app/domain/users';
import { AuthStoreActions, AuthStoreReducer } from '@app/root-store/auth-store';
import { Factory } from '@test/factory';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Store, StoreModule } from '@ngrx/store';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {

  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let ngZone: NgZone;
  let store: Store<AuthStoreReducer.State>;
  let router: Router;
  let factory: Factory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbModule,
        RouterTestingModule,
        StoreModule.forRoot({
          'auth': AuthStoreReducer.reducer
        })
      ],
      declarations: [HeaderComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    ngZone = TestBed.get(NgZone);
    store = TestBed.get(Store);
    router = TestBed.get(Router);
    factory = new Factory();

    ngZone.run(() => router.initialNavigation());

    spyOn(store, 'dispatch').and.callThrough();
    spyOn(router, 'navigate').and.callThrough();

    fixture.detectChanges();
  });

  it('should create', () => {
    debugger;
    expect(component).toBeTruthy();
  });

  it('a dropdown menu item is created with the user`s name', () => {
    const user = new User().deserialize(factory.user({
      roles: [
        factory.role({ id: RoleIds.SpecimenCollector })
      ]
    }));
    const action = new AuthStoreActions.LoginSuccessAction({ user });
    store.dispatch(action);

    fixture.detectChanges();
    const dropdowns = fixture.debugElement.queryAll(By.css('.dropdown'));
    const textContent = dropdowns.map(d => d.nativeElement.textContent).join();
    expect(textContent).toContain(user.name);
  });

  it('calling logout dispatches an action and goes to home state', () => {
    ngZone.run(() => component.logout());
    const action = new AuthStoreActions.LogoutRequestAction();
    expect(store.dispatch).toHaveBeenCalledWith(action);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('clicking navbar collapse button shows the navbar when hidden',() => {
    let buttons = fixture.debugElement.queryAll(By.css('.navbar-toggler-right'));
    expect(buttons.length).toBeGreaterThan(0);
    component.isCollapsed = true;
    buttons[0].nativeElement.click();
    fixture.detectChanges();
    expect(component.isCollapsed).toBeFalsy();
  });


  it('clicking navbar collapse button hides the navbar when shown',() => {
    let buttons = fixture.debugElement.queryAll(By.css('.navbar-toggler-right'));
    expect(buttons.length).toBeGreaterThan(0);
    component.isCollapsed = false;
    buttons[0].nativeElement.click();
    fixture.detectChanges();
    expect(component.isCollapsed).toBeTruthy();
  });
});
