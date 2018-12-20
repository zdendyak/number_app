import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DigitStatsPage } from './digit-stats';

@NgModule({
  declarations: [
    DigitStatsPage,
  ],
  entryComponents: [
    DigitStatsPage
  ],
  imports: [
    IonicPageModule.forChild(DigitStatsPage),
  ],
})
export class DigitStatsPageModule {}
