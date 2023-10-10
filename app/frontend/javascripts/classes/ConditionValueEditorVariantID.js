import ConditionValueEditor from './ConditionValueEditor.js';
import SearchFieldOnly from '../components/Common/SearchField/SearchFieldOnly.js';

/** Variant ID editing screen */
class ConditionValueEditorVariantID extends ConditionValueEditor {
  /**
   * @param {ConditionValues} valuesView - _cancelButton{HTMLButtonElement}, _conditionView{ConditionItemView}, _editors{ConditionValueEditorVariantID[]}, _okButton{HTMLButtonElement}, _sections{HTMLDivElement}
   * @param {String} conditionType - "id" */
  constructor(valuesView, conditionType) {
    super(valuesView, conditionType);

    // HTML
    this._createElement(
      'text-field-editor-view',
      `<header>Search for ${conditionType}</header>
      <div class="body"></div>`
    );

    /** @property {HTMLDivElement} _searchFieldView - CustomEl */
    this._searchFieldView = new SearchFieldOnly(this._body, 'rs1489251879');

    this._searchFieldView.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const id = this._searchFieldView.value;

        if (this._searchFieldView.value.trim().length > 0) {
          this._addValueView(id, id, false, true);
          this._update();

          this._searchFieldView.value = '';
        }
      }
    });
  }

  /** Update whether OK Button is disabled
   * @private
   * @returns {void} */
  _update() {
    this._valuesView.update(this.isValid);
  }

  // public methods
  /** Variant ID does not have _searchFieldView.term and does not manage lastValue, so it is always " "
   * See {@link ConditionValues} startToEditCondition
   * @public
   * @property {string} _lastValue
   */
  keepLastValues() {
    this._lastValueViews = this._valueViews;
  }

  /**
   * See {@link ConditionValues} _clickCancelButton with not isFirst
   * @public */
  restore() {
    this._updateValueViews(this._lastValueViews);
    this._update();
  }

  /**
   * See {@link AdvancedSearchBuilderView} changeCondition
   * @public */
  search() {
    this._update();
  }

  //accessor
  /** Valid only if there are some 'condition-item-value-view' elements in the valuesView
   * @type {boolean} */
  get isValid() {
    return true;
  }
}

export default ConditionValueEditorVariantID;
