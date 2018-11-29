import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { RootStoreState } from '@app/root-store';
import { select, Store } from '@ngrx/store';
import { Observable, race } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { CollectionEventType } from '@app/domain/studies';
import { EventTypeStoreSelectors, EventTypeStoreActions } from '@app/root-store/event-type';

@Injectable({
  providedIn: 'root'
})
export class EventTypeResolver implements Resolve<CollectionEventType> {
  constructor(private store$: Store<RootStoreState.State>,
              private router: Router) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<CollectionEventType> {
    const studySlug = route.parent.parent.parent.paramMap.get('slug');
    const eventTypeSlug = route.paramMap.get('eventTypeSlug');

    this.store$.dispatch(new EventTypeStoreActions.GetEventTypeRequest({ studySlug, eventTypeSlug }));

    return race(
      this.store$.pipe(
        select(EventTypeStoreSelectors.selectError),
        filter(s => !!s),
        tap(() => this.router.navigateByUrl('/404'))),
      this.store$.pipe(
        select(EventTypeStoreSelectors.selectAllEventTypes),
        filter(ets => ets.length > 0),
        map((ets: CollectionEventType[]) => ets.find(et => et.slug === eventTypeSlug)),
        map(eventType => {
          // have to do the following because of this issue:
          //
          // https://github.com/ngrx/platform/issues/976
          return (eventType instanceof CollectionEventType)
            ? eventType :  new CollectionEventType().deserialize(eventType);
        })))
      .pipe(take(1));
  }
}
