import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController, Platform, LoadingController, AlertController } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { MobilenetProvider } from '../../providers/mobilenet/mobilenet';


@IonicPage()
@Component({
  selector: 'page-mobile-net',
  templateUrl: 'mobile-net.html',
})
export class MobileNetPage {

  @ViewChild('imageCanvas') canvas: any;
  canvasElement: any;

  public isImage: boolean = false;
  private loader: any = false;
  public classes: any = [];

  constructor(
      public navCtrl: NavController, 
      public navParams: NavParams,
      private dataService: MobilenetProvider,
      public actionSheetCtrl: ActionSheetController,
      private plt: Platform,
      private alertCtrl: AlertController,
      private loadingCtrl: LoadingController,
      public camera: Camera) {
  }

  ionViewDidLoad() {
    if (!this.dataService.mobilenetModel) {
      this.loader = false;
      this.dataService.loadMobileNetModel()
        .then(() => {
          this.loader = true;
        });
    } else {
      this.loader = true;
    }
    this.canvasElement = this.canvas.nativeElement;
    let minScreenSize = Math.min(this.plt.width(), this.plt.height());
    let ratio = Math.floor((minScreenSize - 10) / 28); 
    this.canvasElement.width =  ratio * 28 + '';
    this.canvasElement.height = this.canvasElement.width;   
    this.clearCanvas(); 
  }

  clearCanvas() {
    let ctx = this.canvasElement.getContext('2d');
    ctx.fillStyle = "#eee";
    ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }

  loadTestImage () {
    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = function () {
      ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
    }
    image.src="../../assets/imgs/dog.jpg";
    this.isImage = true;
  }

  loadImage (url) {
    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.onload = function () {
      ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
    }
    image.src = url;
    this.isImage = true;
    this.classes = [];
  }

  presentLoading (content='Loading MobileNet model...') {
    this.loader = this.loadingCtrl.create({
      content,
      dismissOnPageChange: true
    });
    this.loader.present();
  }

  presentUrlPrompt() {
    let alert = this.alertCtrl.create({
      title: 'Image URL',
      inputs: [
        {
          name: 'url',
          placeholder: 'image url',
          value: "../../assets/imgs/"
        }
      ],
      buttons: [
      {  
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Ok',
        handler: data => this.loadImage(data.url)
      }
      ]
    });
    alert.present();
  }

  presentActionSheet () {
    const actionSheet = this.actionSheetCtrl.create({
      title: 'Upload picture or take photo',
      buttons: [
        {
          text: 'Take photo',
          role: 'destructive',
          handler: () => {
            console.log('take a photo');
            this.captureImage(false);
          }
        },
        {
          text: "Choose from Gallery",
          handler: () => {
            console.log('choose from galerry');
            this.captureImage(true);
          }
        },
        {
          text: "Use URL",
          handler: () => {
            console.log('use url');
            this.presentUrlPrompt();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    actionSheet.present();
  }

  async captureImage(useAlbum:boolean) {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.PNG,
      mediaType: this.camera.MediaType.PICTURE,
      ...useAlbum ? { sourceType: this.camera.PictureSourceType.SAVEDPHOTOALBUM} : {}
    }

    const imageData = await this.camera.getPicture(options);
    const base64Image = `data:image/png;base64,${imageData}`;
    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.onload = function () {
      ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
    }
    image.src = base64Image;
    this.isImage = true;
  }


  async predict() {
   this.classes = [];
    this.classes = await this.dataService.mobilenetPredict(this.canvasElement)
  }
}
