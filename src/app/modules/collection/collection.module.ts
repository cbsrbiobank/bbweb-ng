import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@app/modules/material.module';
import { SharedModule } from '@app/shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { ModalInputModule } from '../modals/modals.module';
import { CollectionRoutingModule } from './collection-routing.module';
import { AnnotationsAddSubformComponent } from './components/annotations-add-subform/annotations-add-subform.component';
import { CollectionPageComponent } from './components/collection-page/collection-page.component';
import { ModalInputAnnotationComponent } from './components/modal-input-annotation/modal-input-annotation.component';
import { EventAddFormComponent } from './components/event-add-form/event-add-form.component';
import { ParticipantAddFormComponent } from './components/participant-add-form/participant-add-form.component';
import { ParticipantAddPageComponent } from './components/participant-add-page/participant-add-page.component';
import { ParticipantEventsComponent } from './components/participant-events/participant-events.component';
import { ParticipantSummaryComponent } from './components/participant-summary/participant-summary.component';
import { ParticipantViewPageComponent } from './components/participant-view-page/participant-view-page.component';
import { EventAddSelectComponent } from './components/event-add-select/event-add-select.component';
import { EventViewComponent } from './components/event-view/event-view.component';
import { EventSpecimensViewComponent } from './components/event-specimens-view/event-specimens-view.component';
import { SpecimenViewModalComponent } from './components/specimen-view-modal/specimen-view-modal.component';
import { MatSortModule, MatTableModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    CollectionRoutingModule,
    ModalInputModule,
    FontAwesomeModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    NgbModule,
    MatTableModule,
    MatSortModule
  ],
  declarations: [
    CollectionPageComponent,
    ParticipantAddPageComponent,
    ParticipantViewPageComponent,
    ParticipantAddFormComponent,
    AnnotationsAddSubformComponent,
    ParticipantSummaryComponent,
    EventAddFormComponent,
    ParticipantEventsComponent,
    ModalInputAnnotationComponent,
    EventAddSelectComponent,
    EventViewComponent,
    EventSpecimensViewComponent,
    SpecimenViewModalComponent
  ],
  entryComponents: [
    SpecimenViewModalComponent
  ]
})
export class CollectionModule { }
