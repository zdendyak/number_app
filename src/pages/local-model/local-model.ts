import { Component, ViewChild, Renderer } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, Content, ToastController, AlertController } from 'ionic-angular';

import { ProcessDataProvider } from '../../providers/process-data/process-data';
import { ProcessImageProvider } from '../../providers/process-image/process-image';
import Chart from 'chart.js';

interface LoadOptions {
  type: string,
  modelName?: string,
  url?: string 
}

@IonicPage()
@Component({
  selector: 'page-local-model',
  templateUrl: 'local-model.html',
})
export class LocalModelPage {

  @ViewChild('imageCanvas') canvas: any;
  canvasElement: any;
  @ViewChild('resultCanvas') resultCanvas: any;
  resultElement: any;

  @ViewChild(Content) content: Content;
  @ViewChild('fixedContainer') fixedContainer: any;

  saveX: number;
  saveY: number;
  touched: boolean = false;

  loadOptions: LoadOptions = {
    type: 'localStorage',
    modelName: '',
    url: '',
  };


  selectedColor: string = '#fff';
  result = null;

  constructor(public navCtrl: NavController, public navParams: NavParams,
              private toastCtrl: ToastController,
              private alertCtrl: AlertController,
              private imageService: ProcessImageProvider, public dataService: ProcessDataProvider,
              public renderer: Renderer, private plt: Platform) {
  }

  ionViewDidEnter() {
    let itemHeight = this.fixedContainer.nativeElement.offsetHeight;
    const scroll = this.content.getScrollElement();
    itemHeight = Number.parseFloat(scroll.style.marginTop.replace("px", "")) + itemHeight;
    scroll.style.marginTop = itemHeight + 'px';
  }

  ionViewDidLoad() {
    // draw canvas
    this.canvasElement = this.canvas.nativeElement;
    let minScreenSize = Math.min(this.plt.width(), this.plt.height(), 500);
    let ratio = Math.floor((minScreenSize - 16) / 28); 
    this.canvasElement.width =  ratio * 28 + '';
    this.canvasElement.height = this.canvasElement.width;
    const marginLeft = (minScreenSize - ratio * 28) / 2;
    this.canvasElement.style.marginLeft = `${marginLeft}px`;
    this.clearCanvas(); 
  }

  presentToast(message) {
    let toast = this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom' 
    });
    toast.present();
  }

  openModal () {
    this.presentTypeAlert();
  }

  presentTypeAlert () {
    let alert = this.alertCtrl.create({
      title: 'Load type',
      inputs: [
        {
          type: 'radio',
          label: 'Local Storage',
          value: 'localStorage',
          checked: true
        },
        {
          type: 'radio',
          label: 'Indexed DB',
          value: 'indexedDb'
        },
        {
          type: 'radio',
          label: 'URL',
          value: 'http'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: "Ok",
          handler: (data: string) => {
            this.loadOptions.type = data;
            this.presentModelAlert(data); 
          }
        }
      ]
    });
    alert.present();
  }

  presentModelAlert (type: string) {
    const savedModels = this.dataService.getSavedModels(type);
    const currentModel = this.dataService.getModelName();
    if (type !== 'http' && (!savedModels || !savedModels.length)) {
      return this.presentToast('No saved model for selected type');
    }

    let alert = this.alertCtrl.create({
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: "Ok",
          handler: (data: any) => {
            if (type === 'http') {
              this.loadOptions.url = data.url;
            } else {
              this.loadOptions.modelName = data;
            }
            this.dataService.loadModel(this.loadOptions)
              .then(result => {
                console.log('model loaded', result);
                this.presentToast('Model loaded');
              })
              .catch(error => {
                console.log('error during model loading', error);
                this.presentToast('Loading failed');
              });
          }
        }
      ]
    });

    if (type === 'http') {
      alert.setTitle('Model URL');
      alert.addInput({
        type: 'text',
        label: 'Enter model URL',
        name: 'url'
      });
    } else {
      alert.setTitle('Model name');
      for (let model of savedModels) {
        alert.addInput({
          type: 'radio',
          label: model.modelName,
          value: model.modelName,
          checked: model.modelName === currentModel
        });
      }
    }
    alert.present();
  }


  startDrawing(ev) {
    var canvasPosition = this.canvasElement.getBoundingClientRect();

    this.saveX = ev.touches[0].pageX - canvasPosition.x;
    this.saveY = ev.touches[0].pageY - canvasPosition.y;
  }
  
  moved(ev) {
    this.touched = true;
    var canvasPosition = this.canvasElement.getBoundingClientRect();
    
    let ctx = this.canvasElement.getContext('2d');
    let currentX = ev.touches[0].pageX - canvasPosition.x;
    let currentY = ev.touches[0].pageY - canvasPosition.y;
    
    ctx.lineJoin = 'round';
    ctx.strokeStyle = this.selectedColor;
    ctx.lineWidth = 20;

    ctx.beginPath();
    ctx.moveTo(this.saveX, this.saveY);
    ctx.lineTo(currentX, currentY);
    ctx.closePath()

    ctx.stroke();

    this.saveX = currentX;
    this.saveY = currentY;
  }

  clearCanvas() {
    let ctx = this.canvasElement.getContext('2d');
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.touched = false;
  }

  resizeImage (imageData) {
    return new Promise((resolve, reject) => {
      const imageTensor = this.imageService.getTensorFromImageData(imageData);
      const imageResized = this.imageService.imageResize(imageTensor, [28, 28]);
      let helperCanvas = document.createElement('canvas');
      const helperCtx = helperCanvas.getContext('2d');
      helperCanvas.width = 28;
      helperCanvas.height = 28;
      this.imageService.getImageFromTensor(imageResized, helperCanvas)
        .then(() => {
          let resizedImageData:ImageData = helperCtx.getImageData(0, 0, 28, 28);
          helperCanvas = null;
          return resolve(Array.from(resizedImageData.data));
        })
        .catch(error => {
          helperCanvas = null;
          return reject(error);
        });

    });
  }

  recognize() {
    if (!this.touched) return this.presentToast('Please, draw an image');
    this.result = null;
    const ctx = this.canvasElement.getContext('2d');
    const imageData = ctx.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);
        
    this.resizeImage(imageData)
    .then((resizedImageData: any) => {
      resizedImageData = resizedImageData.filter((img, index) => index % 4 === 0);
      return this.dataService.predict(resizedImageData);
    })
    .then((result: any) => {
      console.log('recognized', result);
      if (result.ok) {
        this.clearCanvas();
        this.result = result.value;
        this.drawDigitStat();
      } else {
        this.presentToast(result.message || 'Error occurred');
      }
    })
    .catch(error => {
      console.error('Cannot recognize the image:  ' + error);
    });
  }

  drawDigitStat (options=null) {
    const data = this.getDigitChartData();
    if (!data) return;
    // result canvas size
    let minScreenSize = Math.min(this.plt.width(), this.plt.height());
    let ratio = Math.floor((minScreenSize - 16) / 28); 
    this.resultElement = this.resultCanvas.nativeElement;
    this.resultElement.width = ratio * 28 + '';
    this.resultElement.height = 0.7 * ratio * 28 + '';
    const marginLeft = (minScreenSize - ratio * 28) / 2;
    this.resultElement.style.marginLeft = `${marginLeft}px`;
    // draw the result bar chart
    const ctx = this.resultElement.getContext('2d');
    const digitChart = new Chart(ctx, {
      type: 'bar',
      data,
      options: options || {
        scales: {
          yAxes: [{
            ticks: {
              min: 0,
              max: 1
            }
          }]
        }
      }
    });
    return digitChart;
  }

  getDigitChartData () {
    if (!this.result) return null;
    return {
      labels: Object.keys(this.result),
      datasets: [{
        label: 'prediction',
        data: this.result.map(v => v.toFixed(3)),
        backgroundColor: 'rgba(75, 192, 192, 0.4)',
        borderColor: 'rgba(75, 192, 192)',
        borderWidth: 1
      }]
    }
  }


}
