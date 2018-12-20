import { Component } from '@angular/core';

import { TrainPage } from '../train/train';
import { DataPage } from '../data/data';
import { HomePage } from '../home/home';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = TrainPage;
  tab3Root = DataPage;

  constructor() {

  }
}
