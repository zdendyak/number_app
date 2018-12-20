import { Component } from '@angular/core';

/**
 * Generated class for the SaveFormComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'save-form',
  templateUrl: 'save-form.html'
})
export class SaveFormComponent {

  modelName: string;
  type: string;
  typeOptions: [
    { label: 'Local Storage', value: 'localStorage' },
    { label: 'Indexed DB', value: 'indexedDB' }
  ]

  constructor() {
    this.reset();
  }

  save () {
    console.log('save');
  }

  reset () {
    this.modelName = '';
    this.type = 'localStorage';
  }

}
