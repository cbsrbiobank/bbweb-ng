import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { AuthStoreEffects } from './auth-store-module-effects';
import { authReducer } from './auth-store-module-reducer';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('auth', authReducer),
    EffectsModule.forFeature([AuthStoreEffects])
  ],
  providers: [AuthStoreEffects]
})
export class AuthStoreModule { }
