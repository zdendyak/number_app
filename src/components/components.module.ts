import { NgModule } from '@angular/core';
import { DisplayCanvasComponent } from './display-canvas/display-canvas';
import { SaveFormComponent } from './save-form/save-form';
@NgModule({
	declarations: [DisplayCanvasComponent,
    SaveFormComponent],
	imports: [],
	exports: [DisplayCanvasComponent,
    SaveFormComponent]
})
export class ComponentsModule {}
