import ConditionValueEditorCheckboxes from './ConditionValueEditorCheckboxes.js';
import ConditionValueEditorColumns from './ConditionValueEditorColumns.js';
import ConditionValueEditorTextField from './ConditionValueEditorTextField.js';
import ConditionValueEditorFrequencyCount from './ConditionValueEditorFrequencyCount.js';
// import {ADVANCED_CONDITIONS} from '../global.js';
import {CONDITION_TYPE} from '../definition.js';

export default class ConditionValues {

  constructor(conditionView) {

    this._conditionView = conditionView;
    this._editors = [];

    // HTML
    conditionView.editorElement.innerHTML = `
      <div class="sections"></div>
      <div class="buttons">
        <button class="button-view -disabled">OK</button>
        <button class="button-view -negative">Cancel</button>
      </div>`;

    // references
    this._sections = conditionView.editorElement.querySelector(':scope > .sections');
    const buttons = conditionView.editorElement.querySelector(':scope > .buttons');
    this._okButton = buttons.querySelector(':scope > .button-view:nth-child(1)');

    // events
    this._okButton.addEventListener('click', this._clickOkButton.bind(this));
    buttons.querySelector(':scope > .button-view:nth-child(2)').addEventListener('click', this._clickCancelButton.bind(this));

    // initialization by types
    // TODO: conditionType は ADVANCED_CONDITIONS[conditionView.conditionType].type を参照して処理をスイッチさせたい
    console.log('conditionType:', conditionView.conditionType)
    switch (conditionView.conditionType) {
      case CONDITION_TYPE.type:
      case CONDITION_TYPE.significance:
        this._editors.push(new ConditionValueEditorCheckboxes(this, this._conditionView.conditionType));
      break;
      case CONDITION_TYPE.consequence:
        this._editors.push(new ConditionValueEditorColumns(this, this._conditionView.conditionType));
      break;
      case CONDITION_TYPE.dataset:
        this._editors.push(new ConditionValueEditorColumns(this, this._conditionView.conditionType));
        this._editors.push(new ConditionValueEditorFrequencyCount(this, this._conditionView.conditionType));
      break;
      case CONDITION_TYPE.gene_symbol:
        this._editors.push(new ConditionValueEditorTextField(this, this._conditionView.conditionType));
      break;
      case CONDITION_TYPE.disease:
        this._editors.push(
          new ConditionValueEditorTextField(this, this._conditionView.conditionType),
          new ConditionValueEditorColumns(this, this._conditionView.conditionType)
        );
      break;
    }

  }


  // public methods

  startToEditCondition() {
    // save values
    for (const editor of this._editors) {
      editor.keepLastValues();
    }
  }

  update(isValid) {
    if (this._conditionView.conditionType === CONDITION_TYPE.dataset) {
      isValid = this._editors.every(editor => editor.isValid);
    }
    if (isValid) {
      console.log('ok')
      this._okButton.classList.remove('-disabled');
    } else {
      console.log('boooo')
      this._okButton.classList.add('-disabled');
    }
  }


  // private methods

  _clickOkButton(e) {
    console.log(e)
    e.stopImmediatePropagation();
    // 
    this._conditionView.doneEditing();
  }

  _clickCancelButton(e) {
    e.stopImmediatePropagation();
    if (this._conditionView.isFirstTime) {
      // delete for the first time 
      this._conditionView.remove();
    } else {
      // otherwise, revert to the previous state 
      for (const editor of this._editors) {
        editor.restore();
      }
      this._conditionView.doneEditing();
    }
  }


  // accessor

  // get type() {
  //   return CONDITION_ITEM_TYPE.condition;
  // }

  get conditionView() {
    return this._conditionView;
  }

  get sections() {
    return this._sections;
  }

}