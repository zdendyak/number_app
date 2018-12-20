import { Component, ViewChild, Renderer } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';

import { ProcessImageProvider } from '../../providers/process-image/process-image';
import Chart from 'chart.js';

@IonicPage()
@Component({
  selector: 'page-digit-stats',
  templateUrl: 'digit-stats.html',
})
export class DigitStatsPage {

  @ViewChild('imageCanvas') canvas: any;
  canvasElement: any;

  @ViewChild('fixedContainer') fixedContainer: any;

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public renderer: Renderer, private plt: Platform,
    public imageService: ProcessImageProvider,) {
  }

  ionViewDidLoad() {
    this.canvasElement = this.canvas.nativeElement;
    let minScreenSize = Math.min(this.plt.width(), this.plt.height());
    let ratio = Math.floor((minScreenSize - 10) / 28); 
    this.canvasElement.width =  ratio * 28 + '';
    this.canvasElement.height = this.canvasElement.width;  
    const data = this.getDigitChartData();
    this.drawDigitStat(data);
  }

  drawDigitStat (data, options=null) {
    const ctx = this.canvasElement.getContext('2d');
    const digitChart = new Chart(ctx, {
      type: 'bar',
      data,
      options: options || {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
    return digitChart;
  }

  getDigitChartData () {
    const images = this.imageService.getStoredImages();
    const data = Array(10).fill(0);
    if (images) {
      for (let img of images) {
        data[img.label] +=1;
      }
    }
    return {
      labels: Object.keys(data),
      datasets: [{
        label: '# of digits',
        data,
        backgroundColor: 'rgba(75, 192, 192, 0.4)',
        borderColor: 'rgba(75, 192, 192)',
        borderWidth: 1
      }]
    }
  }

}
