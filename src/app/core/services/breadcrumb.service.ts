import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterState,
  RouterStateSnapshot,
  UrlSegment
} from '@angular/router';
import { Observable, BehaviorSubject, Subscription, from, of } from 'rxjs';
import { concat, distinct, filter, first, flatMap, toArray } from 'rxjs/operators';
import { Crumb } from '@app/domain/crumb';

// borrowed from:
//
// https://github.com/McNull/ngx-breadcrumbs/blob/master/src/lib/mc-breadcrumbs/src/service/mc-breadcrumbs.service.ts

import * as template from 'lodash.template';
import * as templateSettings from 'lodash.templatesettings';
import { Injectable } from '@angular/core';

const _ = {
  template: template,
  templateSettings: templateSettings
};

_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {

  private breadcrumbs = new BehaviorSubject<Crumb[]>([]);

  // (custom-set-faces '(tide-hl-identifier-face ((t (:foreground "#030303" :background "#6b6b6b")))))

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events
      .pipe(filter((x) => x instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {

        const currentRoot = router.routerState.snapshot.root;

        this.buildBreadcrumbs(currentRoot).pipe(
          flatMap((x) => x),
          distinct((x) => x.label),
          toArray(),
          flatMap((x) => {
            const y = this.postProcess(x);
            return this.wrapIntoObservable<Crumb[]>(y).pipe(first());
          }))
          .subscribe((x) => {
            this.breadcrumbs.next(x);
          });
      });
  }

  get crumbs$(): Observable<Crumb[]> {
    return this.breadcrumbs;
  }

  private postProcess(x: Crumb[]): Crumb[] {
    if (x.length && (x[0].label !== 'Home')) {
      return [{ label: 'Home', path: '' }].concat(x);
    }
    return x;
  }

  private buildBreadcrumbs(route: ActivatedRouteSnapshot): Observable<Crumb[]> {
    let crumbs$: Observable<Crumb[]>;

    const data = route.routeConfig && route.routeConfig.data;
    if (data && data.breadcrumbs) {

      const result = this.resolve(route, this.router.routerState.snapshot);
      crumbs$ = this.wrapIntoObservable<Crumb[]>(result).pipe(first());

    } else {
      crumbs$ = of([]);
    }

    if (route.firstChild) {
      crumbs$ = crumbs$.pipe(concat(this.buildBreadcrumbs(route.firstChild)));
    }

    return crumbs$;
  }

  private resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot)
    : Observable<Crumb[]> | Promise<Crumb[]> | Crumb[] {

    const data = route.routeConfig.data;
    const path = this.getFullPath(route);

    let label = typeof (data.breadcrumbs) === 'string'
      ? data.breadcrumbs : data.breadcrumbs.text || data.text || path;
    label = this.stringFormat(label, route.data);

    const crumbs: Crumb[] = [{ label: label, path: path }];

    return of(crumbs);
  }

  private getFullPath(route: ActivatedRouteSnapshot): string {
    const relativePath = (segments: UrlSegment[]) => segments.reduce((a, v) => a += '/' + v.path, '');
    const fullPath = (routes: ActivatedRouteSnapshot[]) => routes.reduce((a, v) => a += relativePath(v.url), '');

    return fullPath(route.pathFromRoot);
  }

  private wrapIntoObservable<T>(value: T | Promise<T> | Observable<T>)
    : Observable<T> {

    if (value instanceof Observable) {
      return value;
    }

    if (this.isPromise(value)) {
      return from(Promise.resolve(value));
    }

    return of(value as T);
  }

  private isPromise(value: any): boolean {
    return value && (typeof value.then === 'function');
  }

  private stringFormat(template: string, binding: any): string {
    const compiled = _.template(template);
    return compiled(binding);
  }

}
