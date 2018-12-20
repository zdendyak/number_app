import { Component, ViewChild, Renderer } from '@angular/core';
import { IonicPage, NavController, NavParams, Content, Platform, ToastController } from 'ionic-angular';

import { ProcessImageProvider } from '../../providers/process-image/process-image';
import { SavedItemsPage } from '../saved-items/saved-items';

@IonicPage()
@Component({
  selector: 'page-data',
  templateUrl: 'data.html',
})
export class DataPage {

  @ViewChild('imageCanvas') canvas: any;
  canvasElement: any;

  saveX: number;
  saveY: number;
  storedImages = [];

  @ViewChild(Content) content: Content;
  @ViewChild('fixedContainer') fixedContainer: any;

  selectedColor = '#fff';
  label = '';

  constructor(
    public navCtrl: NavController, public navParams: NavParams,
    public renderer: Renderer, private plt: Platform,
    public imageService: ProcessImageProvider,
    private toastCtrl: ToastController
  ) {
  }

  ionViewDidEnter() {
    this.scrollbyFixed();
  }

  ionViewDidLeave() {
    this.label = '';
  }

  ionViewDidLoad() {
    this.canvasElement = this.canvas.nativeElement;
    let minScreenSize = Math.min(this.plt.width(), this.plt.height(), 500);
    let ratio = Math.floor((minScreenSize - 16) / 28); 
    this.canvasElement.width =  ratio * 28 + '';
    this.canvasElement.height = this.canvasElement.width;  
    // const marginLeft = (minScreenSize - ratio * 28) / 2;
    // this.canvasElement.style.marginLeft = `${marginLeft}px`; 
    this.clearCanvas(); 
  }

  scrollbyFixed() {
    // Get the heigth of the fixed item
    let itemHeight = this.fixedContainer.nativeElement.offsetHeight;
    let scroll = this.content.getScrollElement();

    // Add preexisting scroll margin to fixed container size
    const marginTop = Number.parseFloat(scroll.style.marginTop.replace("px", ""));
    itemHeight = marginTop < itemHeight ? marginTop + itemHeight : marginTop;
    scroll.style.marginTop = itemHeight + 'px';
  }

  startDrawing(ev) {
    var canvasPosition = this.canvasElement.getBoundingClientRect();

    this.saveX = ev.touches[0].pageX - canvasPosition.x;
    this.saveY = ev.touches[0].pageY - canvasPosition.y;
  }

  moved(ev) {
    var canvasPosition = this.canvasElement.getBoundingClientRect();
    
    const ctx = this.canvasElement.getContext('2d');
    const currentX = ev.touches[0].pageX - canvasPosition.x;
    const currentY = ev.touches[0].pageY - canvasPosition.y;
    
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

  saveImageAndLabel() {
    if (!this.label) return this.presentToast('Image value is not defined');
    console.log('saved');
    const ctx = this.canvasElement.getContext('2d');
    const imageData = ctx.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);
        
    const label = (this.label && (parseInt(this.label) || parseInt(this.label) === 0) && this.label === parseInt(this.label).toString()) ? parseInt(this.label) : this.label;
    this.clearCanvas();
    this.resizeImage(imageData)
    .then(resizedImageData => {
      this.imageService.saveImage({ imageData: resizedImageData, label, size: 28 });
    })
    .catch(error => {
      this.presentToast('Cannot save image ' + error);
    });
  }

  resizeImage (imageData) {
    return new Promise((resolve, reject) => {
      const imageTensor = this.imageService.getTensorFromImageData(imageData);
      const imageResized = this.imageService.imageResize(imageTensor, [28, 28]);
      // console.log('imageTensor', imageTensor.print(true));
      // console.log('imageResized', imageResized.print(true));
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

  removeItem(i, key="storedImages") {
    console.log('remove item ', i);
    return this.imageService.deleteImage(i, key);
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
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }

  goTo(route) {
    if (route == 'savedItems') this.navCtrl.push(SavedItemsPage);
  }

}
