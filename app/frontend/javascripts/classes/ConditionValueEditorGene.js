import ConditionValueEditor from './ConditionValueEditor.js';
import SearchFieldWithSuggestions from '../components/Common/SearchField/SearchFieldWithSuggestions.js';
import { API_URL } from '../global.js';

/** Gene and variant editing screen */
class ConditionValueEditorGene extends ConditionValueEditor {
  /**
   * @param {ConditionValues} valuesView
   * @param {String} conditionType - "gene" */
  constructor(valuesView, conditionType) {
    super(valuesView, conditionType);
    /** @property {number} _value - value of the selected suggestion */
    this._value;
    /** @property {string} _label - label of the selected suggestion */
    this._label;

    // HTML
    this._createElement(
      'text-field-editor-view',
      `<header>Search for ${conditionType}</header>
      <div class="body"></div>`
    );

    this._searchFieldView = new SearchFieldWithSuggestions(
      'BRCA2',
      `${API_URL}/api/search/${conditionType}`,
      'term',
      this._body,
      {
        valueMappings: {
          valueKey: 'id',
          labelKey: 'symbol',
          aliasOfKey: 'alias_of',
        },
      }
    );

    this._searchFieldView.addEventListener(
      'new-suggestion-selected',
      this._handleSuggestSelect
    );
  }

  /** Add condition-item-value-view with selected suggestion data
   * @private
   * @params {CustomEvent} */
  _handleSuggestSelect = (e) => {
    this._value = e.detail.id;
    this._label = e.detail.label;
    this._addValueView(this._value, this._label, true, false);
    this._update();
  };

  /** Update is OK button is disabled on not
   * @private */
  _update() {
    this._valuesView.update(this._validate());
  }

  _validate() {
    return this.isValid;
  }

  // public methods
  /** When the screen changes to the editing screen
   *  @public */
  keepLastValues() {
    this._lastValue = this._value || '';
    this._lastLabel = this._label || '';
  }

  /** When the cancel button is clicked when it is not isFirstTime */
  restore() {
    this._addValueView(this._lastValue, this._lastLabel, true);
    this._update();
  }

  search() {
    this._update();
  }

  //accessor
  /** Valid only if there are some condition-item-value-view 's in the valuesView */
  get isValid() {
    return this._valueViews.length > 0;
  }
}

export default ConditionValueEditorGene;
