import { Component, ViewChild, Renderer } from '@angular/core';
import { IonicPage, NavController, NavParams, Content, Platform, ToastController, AlertController } from 'ionic-angular';

import { ProcessImageProvider } from '../../providers/process-image/process-image';
import { ProcessDataProvider } from '../../providers/process-data/process-data';
import { SavedItemsPage } from '../saved-items/saved-items';
// import { SaveFormComponent } from '../../components/save-form/save-form';
import Chart from 'chart.js';

 
@IonicPage()
@Component({
  selector: 'page-train',
  templateUrl: 'train.html',
})
export class TrainPage {

  @ViewChild('imageCanvas') canvas: any;
  canvasElement: any;

  saveX: number;
  saveY: number;
  storedImages = [];
  trainCompleted:boolean = false;

  @ViewChild(Content) content: Content;
  @ViewChild('fixedContainer') fixedContainer: any;

  epochs = '10';
  learningRate = '0.001';
  batchSize = '32';
  validationSplit = '0.2';
  optimizer = 'adam';

  constructor(
    public navCtrl: NavController, public navParams: NavParams,
    public renderer: Renderer, private plt: Platform,
    public imageService: ProcessImageProvider,
    private dataService: ProcessDataProvider,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
  }

  ionViewDidLoad() {
    this.canvasElement = this.canvas.nativeElement;
    let minScreenSize = Math.min(this.plt.width(), this.plt.height());
    let ratio = Math.floor((minScreenSize - 10) / 28); 
    this.canvasElement.width =  ratio * 28 + '';
    // this.canvasElement.height = ratio *28 * 0.7 + '';  
    this.canvasElement.height = 0 + '';    
    this.clearCanvas(); 
  }

  train () {
    this.canvasElement.height = Number.parseFloat(this.canvasElement.width) * 0.7 + '';   
    try {
      this.watchTraining();
    } catch (error) {
      this.presentToast(error);
    }
  }

  async trainMnist () {  
    
    this.watchTraining(true);
    // const trainingHistory = await this.dataService.trainModel(320, 3, 0.15, true, );
  }

  presentSaveModal () {
    const saveModal = this.alertCtrl.create({
      title: 'Save Options',
      inputs: [
        {
          name: 'modelName',
          placeholder: 'Model name'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: (data) => {
            if (data.modelName.trim()) {
              data.type = 'localStorage';
              this.dataService.saveModel(data)
                .then(result => {
                  this.presentToast('Model saved!');
                })
                .catch(error => {
                  this.presentToast('Error occurred when saving the model');
                  console.error(error);
                });
            } else {
              return false;
            }
          }
        }
      ]
    });
    saveModal.present();
  }

  save() {
    this.presentSaveModal();
  }

  presentToast(message) {
    let toast = this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom' 
    });
    toast.present();
  }

  clearCanvas() {
    let ctx = this.canvasElement.getContext('2d');
    ctx.fillStyle = "#eee";
    ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }

  goTo(route) {
    if (route == 'savedItems') this.navCtrl.push(SavedItemsPage);
  }


  async watchTraining(useMnist=false) {
    console.log('start watch training');
    // const metrics = ['loss', 'val_loss', 'acc', 'val_acc'];
    this.trainCompleted = false;
    const history = {
      acc: [],
      val_acc: [],
      loss: [],
      val_loss: []
    };
    // let batchCounter = 0;
    const chart = this.drawChart(history);
    const callbacks = (tf) => ({
      onEpochEnd: async (epoch, logs) => {
        console.log('onEpochEndLocal: ', {epoch, logs});
        this.updateChart(chart, logs);
        await tf.nextFrame();
      },
      // onBatchEnd: async (batch, logs) => {
      //   batchCounter++;
      //   if (batchCounter % 10 === 0) console.log(`Batch ${batchCounter} completed: `, {batch, logs });
      //   await tf.nextFrame();
      // }
    });

    this.checkInputs();
    const batchSize = parseInt(this.batchSize);
    const epochs = parseInt(this.epochs);
    const validationSplit = parseFloat(this.validationSplit);
    const learningRate = parseFloat(this.learningRate);
    const optimizer = this.optimizer || 'adam';
    return this.dataService.trainModel(batchSize, epochs, validationSplit, useMnist, callbacks, learningRate, optimizer)
      .then(result => {
        console.log('history', result);
        this.trainCompleted = true;
      });
  }

  checkInputs () {
    const batchSize = parseInt(this.batchSize);
    const epochs = parseInt(this.epochs);
    const validationSplit = parseFloat(this.validationSplit);
    const learningRate = parseFloat(this.learningRate);
    let isError = false;
    if (batchSize < 1) { this.batchSize = '1'; isError = true; }
    if (epochs < 1) { this.epochs = '1'; isError = true; }
    if (validationSplit < 0.01) { this.validationSplit = '0.1'; isError = true; }
    if (learningRate < 0) { this.learningRate = '0.001'; isError = true; }
    if (isError) this.presentToast('Invalid settings. Model data have been updated');
  }

  drawChart (history, options=null) {
    const data = this.getChartData(history);
    const ctx = this.canvasElement.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
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
    return chart;
  }

  updateChart(chart, logs) {
    chart.data.datasets.forEach(dataset => {
      dataset.data.push(logs[dataset.label]);
    });
    chart.update({
      duration: 200,
      easing: 'easeOutBounce'
  });
  }

  getChartData (history, metrics=['acc', 'val_acc']) {
    const colors = {
      loss: 'rgba(75, 192, 192)',
      acc: 'rgba(54, 162, 235)',
      val_acc: 'rgba(255, 159, 64)',
      val_loss: 'rgba(255, 99, 132)'
    };
    const datasets = [];

    for (let m of metrics) {
      datasets.push({
        label: m,
        data: history[m],
        borderColor: colors[m],
        borderWidth: 1,
        fill: false
      })
    }
    return {
      labels: Object.keys(Array(parseInt(this.epochs)).fill(0)),
      datasets
    }
  }
}
