import { Component, Input, AfterViewInit, ViewChild, Renderer, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'display-canvas',
  templateUrl: 'display-canvas.html'
})
export class DisplayCanvasComponent implements AfterViewInit {

  @ViewChild('displayCanvas') canvas: any;
  @Input() image: any;
  @Output() delete = new EventEmitter<object>();

  canvasElement: any;

  showLabel: boolean = false;

  constructor(public renderer: Renderer) {
  }

  ngAfterViewInit() {
    let size = this.image.size;
    let data = new Uint8ClampedArray(this.image.imageData);
    let image = new ImageData(data, size, size);
    this.canvasElement = this.canvas.nativeElement;
    this.canvasElement.width =  size + '';
    this.canvasElement.height = this.canvasElement.width;  
    let ctx = this.canvasElement.getContext('2d');
    ctx.putImageData(image, 0, 0);    
  }

  showActiveSheet () {
    this.showLabel = !this.showLabel;
    this.delete.emit(this.image);
  }

}
