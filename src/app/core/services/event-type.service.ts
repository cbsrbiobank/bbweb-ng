import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiReply, PagedReply, SearchParams } from '@app/domain';
import { CollectionEventType, CollectionEventTypeToAdd, CollectedSpecimenDefinition, CollectedSpecimenDefinitionName } from '@app/domain/studies';
import { Observable } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { AnnotationType } from '@app/domain/annotations';

@Injectable({
  providedIn: 'root'
})
export class EventTypeService {

  readonly BASE_URL = '/api/studies/cetypes';

  constructor(private http: HttpClient) {}

  /**
   * Used to search studies.
   *
   * <p>A paged API is used to list studies. See below for more details.</p>
   *
   * @param searchParams - The options to use to search for studies.
   *
   * @returns The studies within a PagedReply.
   */
  search(studySlug: String, searchParams: SearchParams): Observable<PagedReply<CollectionEventType>> {
    return this.http.get<ApiReply>(`${this.BASE_URL}/${studySlug}`,
                                   { params: searchParams.httpParams() })
      .pipe(
        map((reply: ApiReply) => {
          if (reply && reply.data && reply.data.items) {
            const entities: CollectionEventType[] =
              reply.data.items.map(obj => new CollectionEventType().deserialize(obj));
            return {
              searchParams,
              entities,
              offset: reply.data.offset,
              total: reply.data.total,
              maxPages: reply.data.maxPages
            };
          }
          throw new Error('expected a paged reply');
        }));
  }

  /**
   * Retrieves a CollectionEventType from the server.
   *
   * @param studySlug the slug of the {@link Study}.
   * @param eventTypeSlug the slug of the {@link CollectionEventType} to retrieve.
   */
  get(studySlug: String, eventTypeSlug: string): Observable<CollectionEventType> {
    return this.http.get<ApiReply>(`${this.BASE_URL}/${studySlug}/${eventTypeSlug}`)
      .pipe(map(this.replyToEventType));
  }

  /**
   * Retrieves a CollectionEventType from the server.
   *
   * @param studyId the ID of the {@link Study}.
   * @param eventTypeId the ID of the {@link CollectionEventType} to retrieve.
   */
  getById(studyId: string, eventTypeId: string): Observable<CollectionEventType> {
    return this.http.get<ApiReply>(`${this.BASE_URL}/id/${studyId}/${eventTypeId}`)
      .pipe(map(this.replyToEventType));
  }

  /**
   * Retrieves all the specimen definitions for all {@link CollectionEventTypes} in a {@link
   * Study} from the server.
   *
   * @param studySlug The slug of the {@link Study} to return results for.
   */
  getSpecimenDefinitionNames(studySlug: String): Observable<CollectedSpecimenDefinitionName[]> {
    return this.http.get<ApiReply>(`${this.BASE_URL}/spcdefs/${studySlug}`)
      .pipe(map((reply: ApiReply) => {
        if (reply && reply.data) {
          return reply.data
            .map(info => new CollectedSpecimenDefinitionName().deserialize(info));
        }
        throw new Error('expected a processed specimen definition names array');
      }));
  }

  add(eventType: CollectionEventTypeToAdd): Observable<CollectionEventType> {
    const json = {
      name: eventType.name,
      description: eventType.description,
      recurring: eventType.recurring,
      studyId: eventType.studyId
    };
    return this.http.post<ApiReply>(`${this.BASE_URL}/${eventType.studyId}`, json)
      .pipe(map(this.replyToEventType));
  }

  update(eventType: CollectionEventType,
         attributeName: string, value: string): Observable<CollectionEventType> {
    let json;
    let url;

    switch (attributeName) {
      case 'name':
        json = { name: value };
        url = `${this.BASE_URL}/name/${eventType.id}`;
        break;
      case 'description':
        json = { description: value };
        url = `${this.BASE_URL}/description/${eventType.id}`;
        break;
      case 'recurring':
        json = { recurring: value };
        url = `${this.BASE_URL}/recurring/${eventType.id}`;
        break;

      default:
        throw new Error('invalid attribute name for update: ' + attributeName);
    }

    Object.assign(json, {
      studyId: eventType.studyId,
      expectedVersion: eventType.version
    })

    return this.http.post<ApiReply>(url, json).pipe(
      map(this.replyToEventType));
  }

  addOrUpdateAnnotationType(eventType: CollectionEventType,
                            annotationType: AnnotationType): Observable<CollectionEventType> {
    const json = {
      ...annotationType,
      studyId: eventType.studyId,
      expectedVersion: eventType.version
    };
    let url = `${this.BASE_URL}/annottype/${eventType.id}`;
    if (!annotationType.isNew()) {
      url += '/' + annotationType.id;
    }
    return this.http.post<ApiReply>(url, json).pipe(
      //delay(2000),
      map(this.replyToEventType));
  }

  removeAnnotationType(eventType: CollectionEventType,
                       annotationTypeId: string): Observable<CollectionEventType> {
    const url = `${this.BASE_URL}/annottype/${eventType.studyId}/${eventType.id}/${eventType.version}/${annotationTypeId}`;
    return this.http.delete<ApiReply>(url)
      .pipe(map(this.replyToEventType));
  }

  addOrUpdateSpecimenDefinition(eventType: CollectionEventType,
                                specimenDefinition: CollectedSpecimenDefinition)
  : Observable<CollectionEventType> {
    const json = {
      ...specimenDefinition,
      studyId: eventType.studyId,
      expectedVersion: eventType.version
    };
    let url = `${this.BASE_URL}/spcdef/${eventType.id}`;
    if (!specimenDefinition.isNew()) {
      url += '/' + specimenDefinition.id;
    }
    return this.http.post<ApiReply>(url, json).pipe(
      //delay(2000),
      map(this.replyToEventType));
  }

  removeSpecimenDefinition(eventType: CollectionEventType,
                           specimenDefinitionId: string): Observable<CollectionEventType> {
    const url = `${this.BASE_URL}/spcdef/${eventType.studyId}/${eventType.id}/${eventType.version}/${specimenDefinitionId}`;
    return this.http.delete<ApiReply>(url)
      .pipe(map(this.replyToEventType));
  }

  removeEventType(eventType: CollectionEventType): Observable<string> {
    const url = `${this.BASE_URL}/${eventType.studyId}/${eventType.id}/${eventType.version}`;
    return this.http.delete<ApiReply>(url)
      .pipe(map((reply: ApiReply) => {
        if (reply && reply.data) {
          return eventType.id;
        }
        throw new Error('expected a valid reply');
      }));
  }

  private replyToEventType(reply: ApiReply): CollectionEventType {
    if (reply && reply.data) {
      return new CollectionEventType().deserialize(reply.data);
    }
    throw new Error('expected a collection event type object');
  }

}
