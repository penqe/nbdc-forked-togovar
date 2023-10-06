// import ConditionValueEditor from './ConditionValueEditor.js';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import ConditionValueEditor from '../components/ConditionValueEditor.js';
import '../components/Common/SearchField/SearchFieldWithSuggestions.js';

/** Gene and variant editing screen */
@customElement('condition-value-editor-gene')
class ConditionValueEditorGene extends ConditionValueEditor(LitElement) {
  @property({ type: Object }) valuesView;
  @property({ type: String }) conditionType;
  /** value of the selected suggestion */
  @state({ type: Number }) _value;
  /** label of the selected suggestion */
  @state({ type: String }) _label;

  /**
   * @param {ConditionValues} valuesView
   * @param {String} conditionType - "gene" */
  constructor(valuesView, conditionType) {
    super(valuesView, conditionType);

    // HTML
    this._createElement(
      'text-field-editor-view',
      `<header>Search for ${conditionType}</header>
      <div class="body"></div>`
    );

    this._body.appendChild(this);
  }

  /** Add condition-item-value-view with selected suggestion data */
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

  render() {
    return html`
      <search-field-with-suggestions
        exportparts="input-field"
        .placeholder=${'BRCA2'}
        .suggestAPIURL=${'https://grch37.togovar.org/api/search/gene'}
        .suggestAPIQueryParam=${'term'}
        .options=${{
          valueMappings: {
            valueKey: 'id',
            labelKey: 'symbol',
            aliasOfKey: 'alias_of',
          },
        }}
        @new-suggestion-selected=${this._handleSuggestSelect}
      >
      </search-field-with-suggestions>
    `;
  }
}

export default ConditionValueEditorGene;
