import ConditionValueEditor from './ConditionValueEditor.js';
import { ADVANCED_CONDITIONS } from '../global.js';

export default class ConditionValueEditorCheckboxes extends ConditionValueEditor {
  constructor(valuesView, conditionType, defaultValues) {
    super(valuesView, conditionType);

    // HTML
    const master = ADVANCED_CONDITIONS[conditionType];
    this._createElement(
      'checkboxes-editor-view',
      `
    <header>Select ${conditionType}</header>
    <div class="buttons">
      <button class="button-view -weak">Select all</button>
      <button class="button-view -weak">Clear all</button>
    </div>
    <ul class="checkboxes body">${master.values
      .map(
        (value) => `
      <li data-value="${value.value}">
        <label><input
          type="checkbox"
          value="${value.value}"
          data-label="${value.label}"
          ${
            conditionType === 'significance' ? `data-sign="${value.value}"` : ''
          }>
            ${
              conditionType === 'significance'
                ? `<span class="clinical-significance" data-sign="${value.value}"></span>`
                : ''
            }${value.label}
        </label>
      </li>`
      )
      .join('')}
    </ul>
    `
    );

    // delete 'not in clinver'
    if (conditionType === 'significance') {
      this._el.querySelector('li[data-value="NC"]').remove();
    }

    // references
    this._checkboxes = Array.from(
      this._el.querySelectorAll(':scope > ul > li > label > input')
    );

    // attach events
    this._checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        this._update();
      });
    });
    this._el
      .querySelectorAll(':scope > .buttons > button')
      .forEach((button, index) => {
        button.addEventListener('click', () => {
          this._checkboxes.forEach((checkbox) => (checkbox.checked = !index));
          this._update();
        });
      });

    // default values
    if (defaultValues) {
      for (const checkbox of this._checkboxes) {
        checkbox.checked = defaultValues.terms.find(
          (term) => term === checkbox.value
        );
      }
      this._update();
    }
  }

  // public methods

  keepLastValues() {
    this._lastValues = Array.from(
      this._valuesView.conditionView.valuesElement.querySelectorAll(
        ':scope > condition-item-value-view'
      )
    ).map((value) => value.value);
  }

  restore() {
    this._checkboxes.forEach((checkbox) => {
      const value = this._lastValues.find((value) => value === checkbox.value);
      checkbox.checked = value !== undefined;
    });
    this._update();
  }

  get isValid() {
    return this._checkboxes.some((checkbox) => checkbox.checked);
  }

  // private methods

  _update() {
    // update values
    this._checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        this._addValueView(checkbox.value, checkbox.dataset.label);
      } else {
        this._removeValueView(checkbox.value);
      }
    });

    // validation
    this._valuesView.update(this._validate());
  }

  _validate() {
    return this.isValid;
  }
}
