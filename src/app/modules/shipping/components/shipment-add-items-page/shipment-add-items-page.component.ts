import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Shipment } from '@app/domain/shipments';
import { RootStoreState, ShipmentStoreSelectors } from '@app/root-store';
import { select, Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-shipment-add-items-page',
  templateUrl: './shipment-add-items-page.component.html',
  styleUrls: ['./shipment-add-items-page.component.scss']
})
export class ShipmentAddItemsPageComponent implements OnInit, OnDestroy {
  shipment: Shipment;

  private unsubscribe$ = new Subject<void>();

  constructor(private store$: Store<RootStoreState.State>, private route: ActivatedRoute) {}

  ngOnInit() {
    this.shipment = this.route.snapshot.data.shipment;

    this.store$
      .pipe(
        select(ShipmentStoreSelectors.selectAllShipmentEntities),
        map(shipments => {
          const shipmentEntity = shipments[this.shipment.id];
          if (shipmentEntity) {
            return shipmentEntity instanceof Shipment
              ? shipmentEntity
              : new Shipment().deserialize(shipmentEntity);
          }
          return undefined;
        }),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(shipment => {
        this.shipment = shipment;
      });
  }

  public ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  stepClick(event: StepperSelectionEvent) {
    if (event.selectedIndex < 3) {
      return;
    } else {
    }
  }
}
