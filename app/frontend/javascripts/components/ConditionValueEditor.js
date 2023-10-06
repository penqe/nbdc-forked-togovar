import { property } from 'lit/decorators.js';

/** core of ConditionValueEditor
 * @typedef ConditionValues
 * @type {Object}
 * @property {ConditionItemView} _conditionView - (_builder, _conditionType, _conditionValues, _editor, _elm, _isFirstTime, _type, _values)
 * @property {ConditionValueEditorCheckboxes[]|ConditionValueEditorColumns[]|ConditionValueEditorFrequencyCount[]|ConditionValueEditorDisease[]|ConditionValueEditorTextField[]} _editors
 * @property {HTMLButtonElement} _okButton - button.button-view
 * @property {HTMLDivElement} _sections - div.sections
 */

/** The core of advanced search conditions.
 * Superclass of
 * {@link ConditionValueEditorCheckboxes},
 * {@link ConditionValueEditorColumns},
 * {@link ConditionValueEditorDisease}
 * {@link ConditionValueEditorFrequencyCount},
 * {@link ConditionValueEditorGene},
 * {@link ConditionValueEditorLocation},
 * {@link ConditionValueEditorVariantID},
 */

const ConditionValueEditor = (superClass) =>
  class extends superClass {
    /**
     * @param {ConditionValues} valuesView
     * @param {string} conditionType - dataset, significance, consequence, disease, gene, id, location, type */
    constructor(valuesView, conditionType) {
      super();
      /** @property {ConditionValues} valuesView */
      this._valuesView = valuesView;
      /** @property {string} conditionType */
      this._conditionType = conditionType;

      this._valuesView.conditionView.elm.addEventListener(
        'delete-condition-item',
        this._handleDeleteValue.bind(this)
      );
    }

    @property({ type: Object }) _valuesView;
    @property({ type: String }) _conditionType;

    //private methods
    /**
     * Delete value when button.delete is pressed on edit screen
     * Use the update function for this._valuesView and change it so that if isFirstTime === true and the length is 0, the ok button cannot be pressed.
     * isFirstTime is a private class, so it is not a good idea to use it. I want to know how to use state!!!!!!!!!!!!
     * @private
     * @param {Event} e */
    _handleDeleteValue(e) {
      e.stopPropagation();
      this._removeValueView(e.detail);
      if (this._valuesView._conditionView._isFirstTime) {
        this._valuesView.update(this._valueViews.length > 0);
      }
    }

    //protected methods
    /** Create an element for the edit screen?
     * @protected
     * @param {"checkboxes-editor-view"|"columns-editor-view"|"disease-editor-view"|"frequency-count-editor-view"|"location-editor-view"|"text-field-editor-view"} className
     * @param {string} html - \<header>Select [ConditionType]\</header>\<div class="body">\</div>
     */
    _createElement(className, html) {
      this._el = document.createElement('section');
      this._el.classList.add(className);
      this._el.dataset.conditionType = this._conditionType;
      this._el.innerHTML = html;
      this._valuesView.sections.append(this._el);
      this._body = this._el.querySelector(':scope > .body');
    }

    /**
     * If there is only one value in the condition, update it,
     * for multiple values, add them without duplicates.
     * @protected
     * @param {string} value - The value to add or update.
     * @param {string} label - The label for the value.
     * @param {boolean} isOnly - Whether there is one value in one condition
     * @param {boolean} showDeleteButton - Whether to show the delete button. (for variant id)
     * @returns {HTMLDivElement} - condition-item-value-view element.
     */
    _addValueView(value, label, isOnly = false, showDeleteButton = false) {
      const selector = isOnly ? '' : `[data-value="${value}"]`;
      let valueView = this._valuesElement.querySelector(
        `condition-item-value-view${selector}`
      );

      if (!valueView) {
        valueView = document.createElement('condition-item-value-view');
        valueView.conditionType = this._conditionType;
        valueView.deleteButton = showDeleteButton;
        this._valuesElement.append(valueView);
      }
      valueView.label = label;
      valueView.value = value;

      return valueView;
    }

    /**
     * Delete if argument value contains a value
     * @protected
     * @param {string} value
     */
    _removeValueView(value) {
      const selector = value ? `[data-value="${value}"]` : '';
      const valueView = this._valuesElement.querySelector(
        `condition-item-value-view${selector}`
      );
      if (valueView) {
        valueView.remove();
      }
    }

    //accessor
    /**
     * div.values which is a wrapper for condition-item-value-view
     * @protected
     * @type {HTMLDivElement}
     */
    get _valuesElement() {
      return this._valuesView.conditionView.valuesElement;
    }

    /**
     * [condition-item-value-view]
     * @protected
     * @type {Array<HTMLDivElement>} */
    get _valueViews() {
      const valueViews = Array.from(
        this._valuesElement.querySelectorAll(
          ':scope > condition-item-value-view'
        )
      );
      return valueViews;
    }
  };

export default ConditionValueEditor;
