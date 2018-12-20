import { NgModule, ErrorHandler } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { MyApp } from './app.component';

import { TrainPage } from '../pages/train/train';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { LocalModelPage } from '../pages/local-model/local-model';
import { SavedItemsPage } from '../pages/saved-items/saved-items';
import { DataPage } from '../pages/data/data';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ProcessDataProvider } from '../providers/process-data/process-data';

import { DisplayCanvasComponent } from '../components/display-canvas/display-canvas';
import { SaveFormComponent } from '../components/save-form/save-form';
import { ProcessImageProvider } from '../providers/process-image/process-image';

import { MobileNetPageModule } from '../pages/mobile-net/mobile-net.module';
import { MobilenetProvider } from '../providers/mobilenet/mobilenet';
import { MnistDataProvider } from '../providers/mnist-data/mnist-data';

import { DigitStatsPageModule } from '../pages/digit-stats/digit-stats.module';

@NgModule({
  declarations: [
    MyApp,
    TrainPage,
    SavedItemsPage,
    HomePage,
    LocalModelPage,
    TabsPage,
    DataPage,
    SaveFormComponent,
    DisplayCanvasComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    MobileNetPageModule,
    DigitStatsPageModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    TrainPage,
    SavedItemsPage,
    LocalModelPage,
    HomePage,
    TabsPage,
    DataPage,
    SaveFormComponent
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    ProcessDataProvider,
    ProcessImageProvider,
    MobilenetProvider,
    MnistDataProvider
  ]
})
export class AppModule {}
