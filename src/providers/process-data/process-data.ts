import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { Storage } from '@ionic/storage';
import { ProcessImageProvider } from '../process-image/process-image';
import { MnistDataProvider } from '../../providers/mnist-data/mnist-data';


@Injectable()
export class ProcessDataProvider {
  model: any;
  modelName: string = '';
  savedModels: any[];

  constructor(
      private mnistService: MnistDataProvider,
      private imageServise: ProcessImageProvider,
      private storage: Storage) {
    this.loadModelNames()
    .then(() => {
      if (this.savedModels.length) {
        this.loadModel(this.savedModels[this.savedModels.length-1]);
      }
    });
  }

  loadModelNames (key="savedModels") {
    return this.storage.get(key).then(val => {
      console.log(key, JSON.parse(val));
      this[key] = JSON.parse(val) || []; 
    });
  }

  saveModelNames (key="savedModels") {
    return this.storage.set(key, JSON.stringify(this[key]));
  }

  saveModel (opt: any) {
    if (!opt.type) opt.type = 'localStorage';
    if (!opt.modelName) opt.modelName = (new Date()).toString();
    return this.saveTFModel(opt)
      .then(result => {
        this.modelName = opt.modelName;
        this.savedModels.push(opt);
        this.saveModelNames();
      });
  }

  async loadModel(opt) {
    let model: any;

    try {
      switch (opt.type) {
        case 'file': 
          model = await tf.loadModel(
          tf.io.browserFiles([opt.jsonUpload.files[0], opt.weightsUpload.files[0]]));
          break;
        case 'localStorage':
          model = await tf.loadModel('localstorage://' + opt.modelName);
          break;
        case 'indexedDB': 
          model = await tf.loadModel('indexeddb://' + opt.modelName);
          break;
        case 'http':
          model = await tf.loadModel(opt.url);
          break;
        default:
          model = null;
      }
    } catch (e) {
      console.log('Error when trying load the model', e);
      model = null;
    }
    console.log('model loaded: ', opt.modelName);
    this.model = model;
    if (model) this.modelName = opt.modelName 
    else this.modelName = '';
    return model;
  }

  createModel(learning_rate = 0.001, optimizerFn="adam", conv_activation="relu", numClasses=10) {
    let model = tf.sequential();

    model.add(tf.layers.conv2d({
      inputShape: [28, 28, 1],
      kernelSize: 3,
      filters: 16,
      strides: 1,
      activation: conv_activation,
      kernelInitializer: 'VarianceScaling'
    }));

    model.add(tf.layers.maxPooling2d({
      poolSize: [2, 2],
      strides: [2, 2]
    }));

    model.add(tf.layers.conv2d({
      kernelSize: 3,
      filters: 32,
      strides: 1,
      activation: conv_activation,
    }));
    
    model.add(tf.layers.maxPooling2d({
      poolSize: [2, 2],
      strides: [2, 2]
    }));

    model.add(tf.layers.flatten());

    model.add(tf.layers.dense({
      units: numClasses,
      kernelInitializer: 'VarianceScaling',
      activation: 'softmax'
    }));

    const optimizer = tf.train[optimizerFn](learning_rate);
    model.compile({
      optimizer,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }


  async trainModel (batchSize = 24, epochs=10, validationSplit=0.2, useMnist=false, fitCallbacks=null, learningRate=0.001, optimizer="adam") {
    
    
    let trainData;
    try {
      if (useMnist) {
        trainData =  await this.mnistService.getTrainData();
      } else {
        trainData = this.getTrainData();
      }
    } catch(error) {
      return Promise.reject(error);
    }
    console.log('data loaded', trainData);
    
    this.model = this.createModel(learningRate, optimizer, 'relu', trainData.numClasses || 10);
    this.modelName = '';

    // const totalNumBatches = Math.ceil(trainData.xs.shape[0] * (1 - validationSplit) / batchSize) * epochs;
    console.log('start training');
    const history = await this.model.fit(trainData.xs, trainData.labels, {
      batchSize,
      validationSplit,
      epochs,
      shuffle: true,
      callbacks: fitCallbacks(tf)
    });
    return history;
  }

  getTrainData() {
    const storedImages = this.shuffle(this.imageServise.getStoredImages());
    if (!storedImages || !storedImages.length) throw new Error('No data provided to train the nodel');
    const imageData = [];
    const imageLabels = [];
    const imageWidth = storedImages[0] && storedImages[0].size || 28; 
    const imageHeight = imageWidth;
    const imageSize = imageWidth * imageHeight;
    storedImages.forEach(image => {
      const redChannel = image.imageData.filter((img, index) => index % 4 === 0).map(value => (value - 127.5)/127.5);
      imageData.push(...redChannel);
      imageLabels.push(image.label);
    });
    const trainClasses = new Set(imageLabels);
    const numClasses = Array.from(trainClasses).length;
    const xs = tf.tensor4d(imageData, [imageData.length / (imageSize), imageWidth, imageHeight, 1]);
    const labels= tf.oneHot(tf.tensor1d(imageLabels, 'int32'), numClasses);
    return { xs, labels, imageLabels, numClasses };
  }

  shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

  predict(imageData) {
    if (!this.model) {
      console.error('No model!');
      return { ok: false, message: 'No model' };
    }
    
    let value; 
    tf.tidy(() => {
      const xs = tf.tensor4d(imageData, [imageData.length / (28 * 28) , 28, 28, 1]);
      const offset = tf.scalar(127.5);
      // Normalize the image from [0,255] to [0,1]
      const normalized = xs.sub(offset).div(offset);

      value = this.model.predict(normalized);
      value = value.dataSync()
    });
    return { ok: true, value };
  }

  saveTFModel(opt) {
    if (!this.model) return Promise.reject('No model to save');

    try {
      switch (opt.type) {
        case 'file': 
          return this.model.save('file:///' + opt.path + opt.modelName); 
        case 'localStorage':
          return this.model.save('localstorage://' + opt.modelName);
        case 'indexedDB': 
          return this.model.save('indexeddb://' + opt.modelName);
        case 'http':
          const { url, type } = opt; 
          return this.model.save('http://' + url);
        default:
          return Promise.resolve(null);
      }
    } catch (e) {
      console.log('Error when trying to save the model', e);
      return Promise.reject('Error when trying to save the model');
    }

  }




}
