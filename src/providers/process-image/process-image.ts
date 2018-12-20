import { Injectable } from '@angular/core';

import { Storage } from '@ionic/storage';

import * as tf from '@tensorflow/tfjs';

@Injectable()
export class ProcessImageProvider {

  categories: string[] = ['storedImages', 'figures', 'ox', 'testImages'];
  category: string = 'storedImages';
  storedImages = [];
  testImages = [];

  constructor(private storage: Storage) {
    // Load saved images
    this.loadImages(this.category);
  }

  setCategory (category) {
    this.category = category;
    this.loadImages(this.category);
  }

  loadImages (key="storedImages") {
    this.storage.get(key).then(val => {
      console.log(key, JSON.parse(val));
      this[key] = JSON.parse(val) || []; 
    });
  }

  saveAllImages(imageList, key="storedImages") {
    this.storage.set(key, JSON.stringify(imageList));
  }


  saveImage (image, key="storedImages") {
    this[key].push(image);
    this.saveAllImages(this[key], key);
  }

  getStoredImages (key="storedImages") {
    return this[key] || [];
  }

  deleteImage (index, key="storedImages") {
    this[key].splice(index, 1);
    this.saveAllImages(this[key], key);
  }

  deleteStoredImages (key="storedImages") {
    return this.storage.remove(key)
      .then(() => {
        this[key] = [];
      });
  }

  getTensorFromImageData(imageSource) {
    return tf.fromPixels(imageSource, 1);
  }

  imageResize(imgData, size) {
    return tf.image.resizeBilinear(imgData, size);
  }

  // take Tensor 2D/3D/TypedArray and HTMLCanvasElement. 
  // Return Promise.
  getImageFromTensor(tensor, canvas) {
    return tf.toPixels(tensor, canvas);   
  }


}
