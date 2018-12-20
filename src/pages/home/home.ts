import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { LocalModelPage } from '../local-model/local-model';
import { MobileNetPage } from '../mobile-net/mobile-net';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController) {

  }


  goTo(model) {
    switch (model) {
      case 'train':
        this.navCtrl.parent.select(1);
        break;
      case 'local': 
        this.navCtrl.push(LocalModelPage);
        break;
      case 'mobilenet':
        this.navCtrl.push(MobileNetPage);
        break;
    }
  }
}
