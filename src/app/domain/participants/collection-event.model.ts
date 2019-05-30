import { ConcurrencySafeEntity, HasSlug, IConcurrencySafeEntity, JSONArray, JSONObject, applyMixins } from '@app/domain';
import { Annotation, annotationFactory, IAnnotation, HasAnnotations, AnnotationType } from '../annotations';
import { CollectionEventType } from '../studies';

/**
 * The subject for which a set of Specimens were collected from. The subject can be human or
 * non human. A CollectionEvent belongs to a single {@link app.domain.studies.Study | Study}.
 */
export interface ICollectionEvent extends IConcurrencySafeEntity, HasSlug {

  /**
   * The ID of the {@link app.domain.particiapnts.Participant | Participant} this CollectionEvent belongs to.
   */
  participantId: string;

  /**
   * The Slug of the {@link app.domain.particiapnts.Participant | Participant} this
   * CollectionEvent belongs to.
   */
  participantSlug: string;

  /**
   * The ID of the {@link app.domain.studies.CollectionEventType | CollectionEventType} this
   * CollectionEvent belongs to.
   */
  eventTypeId: string;

  /**
   * The Slug of the {@link app.domain.studies.CollectionEventType | CollectionEventType} this
   * CollectionEvent belongs to.
   */
  eventTypeSlug: string;

  /**
   * The number assigned to the collection event.
   */
  visitNumber: number;

  /**
   * The time this collection event was completed at.
   */
  timeCompleted: Date;

  /**
   * The values of the {@link app.domain.annotations.Annotation|Annotations} collected for this
   * CollectionEvent.
   */
  annotations: IAnnotation[];
}

export class CollectionEvent extends ConcurrencySafeEntity implements ICollectionEvent, HasAnnotations {

  slug: string;
  participantId: string;
  participantSlug: string;
  eventTypeId: string;
  eventTypeSlug: string;
  visitNumber: number;
  timeCompleted: Date;
  annotations: Annotation[];
  setAnnotationTypes: (at: AnnotationType[]) => void;

  private _eventType: CollectionEventType;

  set eventType(eventType: CollectionEventType) {
    if (this.eventTypeId && (this.eventTypeId !== eventType.id)) {
      throw new Error('collection event types do not match');
    }
    this.eventTypeId = eventType.id;
    this._eventType = eventType;
    this.setAnnotationTypes(eventType.annotationTypes);
  }

  deserialize(input: ICollectionEvent): this {
    const { slug, participantId, participantSlug, visitNumber } = input;
    Object.assign(this, { slug, participantId, participantSlug, visitNumber });

    this.eventTypeId = (input as any).collectionEventTypeId;
    this.eventTypeSlug = (input as any).collectionEventTypeSlug;

    super.deserialize(input);

    if (input.timeCompleted) {
      this.timeCompleted = new Date(input.timeCompleted);
    }

    if (input.annotations) {
      this.annotations = input.annotations.map(a => annotationFactory(a));
    }
    return this;
  }

}

applyMixins(CollectionEvent, [ HasAnnotations ]);
