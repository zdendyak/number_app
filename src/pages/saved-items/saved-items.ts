import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { DigitStatsPage } from '../digit-stats/digit-stats';
import { ProcessImageProvider } from '../../providers/process-image/process-image';

@IonicPage()
@Component({
  selector: 'page-saved-items',
  templateUrl: 'saved-items.html',
})
export class SavedItemsPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, 
              private imageService: ProcessImageProvider) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SavedItemsPage');
  }

  getStoredImages() {
    return this.imageService.getStoredImages().sort((a,b) => a.label - b.label) || [];
  }

  deleteImage(image) {
    console.log('delete', image);
  } 

  goTo(route) {
    if (route == 'stats') this.navCtrl.push(DigitStatsPage);
  }

}
