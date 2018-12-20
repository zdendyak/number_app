import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MobileNetPage } from './mobile-net';
import { Camera } from '@ionic-native/camera';
import { MobilenetProvider } from '../../providers/mobilenet/mobilenet';

@NgModule({
  declarations: [
    MobileNetPage,
  ],
  imports: [
    IonicPageModule.forChild(MobileNetPage),
  ],
  providers: [
    Camera,
    MobilenetProvider
  ]
})
export class MobileNetPageModule {}
