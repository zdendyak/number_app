import { Injectable } from '@angular/core';

import * as tf from '@tensorflow/tfjs';

import { ProcessImageProvider } from '../../providers/process-image/process-image';
import { IMAGENET_CLASSES } from './imagenet_classes';

/*
  Generated class for the MobilenetProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class MobilenetProvider {
  public mobilenetModel: any = null;

  constructor(private imageService: ProcessImageProvider) {
  }

  
  async loadMobileNetModel() {
    const IMAGE_SIZE = 224;
    const MOBILENET_MODEL_PATH ='https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json';
    this.mobilenetModel = await tf.loadModel(MOBILENET_MODEL_PATH);
    this.mobilenetModel.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3])).dispose();
    console.log('mobilenet model loaded', this.mobilenetModel);
  }

  async mobilenetPredict(imgElement) {
    if (!this.mobilenetModel) this.loadMobileNetModel();
    const IMAGE_SIZE = 224;
    const TOPK_PREDICTIONS = 10;

    async function getTopKClasses(logits, topK) {
      const values = await logits.data();
      const valuesAndIndices = [];
      for (let i = 0; i < values.length; i++) {
        valuesAndIndices.push({ value: values[i], index: i });
      }
      valuesAndIndices.sort((a, b) => {
        return b.value - a.value;
      });
      const topkValues = new Float32Array(topK);
      const topkIndices = new Int32Array(topK);
      for (let i = 0; i < topK; i++) {
        topkValues[i] = valuesAndIndices[i].value;
        topkIndices[i] = valuesAndIndices[i].index;
      }

      const topClassesAndProbs = [];
      for (let i = 0; i < topkIndices.length; i++) {
        topClassesAndProbs.push({
          className: IMAGENET_CLASSES[topkIndices[i]],
          probability: topkValues[i]
        });
      }
      return topClassesAndProbs;
    }

    const logits = tf.tidy(() => {
      const img = tf.fromPixels(imgElement).toFloat();
      const imgResized = this.imageService.imageResize(img, [IMAGE_SIZE, IMAGE_SIZE]);

      const offset = tf.scalar(127.5);
      // Normalize the image from [0,255] to [1,-1]
      const normalized = imgResized.sub(offset).div(offset);

      // Reshape to a single-element batch 
      const batched = normalized.reshape([1, IMAGE_SIZE, IMAGE_SIZE, 3]);

      // Make a prediction 
      return this.mobilenetModel.predict(batched); 
    });

    const classes = await getTopKClasses(logits, TOPK_PREDICTIONS);
    return classes;
  } 
}
