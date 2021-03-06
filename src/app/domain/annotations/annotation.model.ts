import { DomainEntity, IDomainEntity, JSONArray, JSONObject } from '@app/domain';
import { AnnotationType } from './annotation-type.model';
import { ValueTypes } from './value-type.enum';

type AnnotationValueType = string | Date | Number | string[];

/**
 * Annotations allow the system to collect custom named and defined pieces of data.
 *
 * The type information for an Annotation is stored in an {@link app.domain.annotations.AnnotationType
 * AnnotationType}.
 */
export interface IAnnotation extends IDomainEntity {

  /**
   * The ID of the {@link app.domain.annotations.AnnotationType| AnnotationType} that defines
   * the contents of this annotation.
   */
  annotationTypeId: string;

  valueType: ValueTypes;

  /** The value stored in this annotation. */
  value: AnnotationValueType;

}

export abstract class Annotation extends DomainEntity implements IAnnotation {

  annotationTypeId: string;
  valueType: ValueTypes;
  value: AnnotationValueType;

  abstract serverAnnotation(): any;

}
