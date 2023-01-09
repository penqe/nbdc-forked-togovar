import StoreManager from './StoreManager.js';
import ConditionGroupView from './ConditionGroupView.js';
import AdvancedSearchToolbar from './AdvancedSearchToolbar.js';
import AdvancedSearchSelection from './AdvancedSearchSelection.js';
// import {ADVANCED_CONDITIONS} from '../global.js';
// import {API_URL} from "../global.js";
import { CONDITION_ITEM_TYPE } from '../definition.js';

export default class AdvancedSearchBuilderView {
  #isBuildingConditionViews = false;

  constructor(elm) {
    this._elm = elm;
    this._container = elm.querySelector(':scope > .inner');
    this._rootGroup = new ConditionGroupView(this, this, 'and', [], null, true);

    // toolbar
    this._toolbar = new AdvancedSearchToolbar(
      this,
      this._rootGroup.maketToolbar()
    );

    // events
    StoreManager.bind('advancedSearchConditions', this);
    this._defineEvents();

    // select conditions
    this._selection = new AdvancedSearchSelection(this._rootGroup.elm, this);

    // default condition
    const conditions = StoreManager.getAdvancedSearchConditions();
    this.#updateConditionViews(conditions);
  }

  // public methods

  advancedSearchConditions(conditions) {
    this.#updateConditionViews(conditions);
  }

  /**
   *
   * @param {Array} conditionViews
   */
  selectedConditionViews(conditionViews) {
    // change status
    let canUngroup = false;
    let canCopy = false;
    if (conditionViews.length === 1) {
      canUngroup = conditionViews[0].type === CONDITION_ITEM_TYPE.group;
      canCopy = conditionViews[0].type === CONDITION_ITEM_TYPE.condition;
    }
    // can delete
    this._elm.dataset.canDelete = conditionViews.length > 0;
    // can group
    this._elm.dataset.canGroup =
      conditionViews.length > 1 &&
      conditionViews[0].siblingElms.length > conditionViews.length;
    // can ungroup
    this._elm.dataset.canUngroup = canUngroup;
    // can copy
    this._elm.dataset.canCopy = canCopy;
    // can edit
    // TODO:
  }

  // deselectedConditions(conditions) {
  //   console.log(conditions)
  // }

  // addConditions(conditions) {

  // }

  // removeConditions(conditions) {

  // }

  changeCondition() {
    if (this.#isBuildingConditionViews) return;
    this.#search();
  }

  group() {
    const conditionViews = this._selection.getSelectingConditionViews();
    const parentGroupView = conditionViews[0].parentView;
    // insert position
    const siblingViews = parentGroupView.childViews;
    let position = Infinity,
      referenceElm = null;
    conditionViews.forEach((view) => {
      const index = siblingViews.indexOf(view);
      if (index < position) {
        position = index;
        referenceElm = view.elm;
      }
    });
    // add new gropu
    const conditionGroupView = parentGroupView.addNewConditionGroup(
      conditionViews,
      referenceElm
    );
    this._selection.selectConditionView(conditionGroupView, true);
    this.changeCondition();
  }

  ungroup() {
    const conditionViews = this._selection.getSelectingConditionViews();
    // deselect selecting group
    conditionViews.forEach((conditionView) => {
      this._selection.deselectConditionView(conditionView);
    });
    // ungroup
    conditionViews[0].ungroup();
    this.changeCondition();
  }

  // copy() {
  //   console.log('_copy')
  //   const selectingConditionViews = this._selection.getSelectingConditionViews();
  //   // TODO:
  //   this.changeCondition();
  // }

  // edit() {
  //   console.log('_edit')
  //   this.changeCondition();
  // }

  /**
   *
   * @param {Array<ConditionView>} views
   */
  delete(views) {
    const conditionViews =
      views ?? this._selection.getSelectingConditionViews();
    for (const view of conditionViews) {
      view.remove();
      this._selection.deselectConditionView(view);
    }
    this.changeCondition();
  }

  #updateConditionViews(conditions) {
    console.log(conditions);
    this.#isBuildingConditionViews = true;
    // clear condition
    this._deleteAllConditions();
    // update conditions
    this._buildConditions(conditions);
    this.#isBuildingConditionViews = false;
  }

  _deleteAllConditions() {
    const nodes = [...this._rootGroup.container.childNodes];
    for (const node of nodes) {
      node.delegate.remove();
    }
  }

  _buildConditions(conditions) {
    console.log(conditions);
    const conditionViews = [];
    for (const type in conditions) {
      if (type === 'and' || type === 'or') {
        // this.group();
        const conditionViews2 = [];
        for (const condition of conditions[type]) {
          conditionViews2.push(this._buildConditions(condition));
        }
        console.log(conditionViews2);
      } else {
        conditionViews.push(this.addCondition(type, conditions[type]));
      }
    }
    return conditionViews;
  }

  #search() {
    const query = this._rootGroup.query;
    StoreManager.setAdvancedSearchCondition(query);
  }

  // add search condition to the currently selected layer
  /**
   *
   * @param {String} conditionType // 'type', 'significance', 'disease', e.t.c...
   * @param {Object} defaultValues
   */
  addCondition(conditionType, defaultValues) {
    console.log(conditionType, defaultValues);
    // get selecting condition
    const selectingConditionViews =
      this._selection.getSelectingConditionViews();
    const selectingConditionView =
      selectingConditionViews.length > 0
        ? selectingConditionViews[0]
        : this._rootGroup;
    console.log(selectingConditionView);

    // release exist conditions
    this._selection.deselectAllConditions();

    // add
    let addedConditionView;
    switch (selectingConditionView.type) {
      case CONDITION_ITEM_TYPE.condition:
        addedConditionView =
          selectingConditionView.parentView.addNewConditionItem(
            conditionType,
            defaultValues,
            selectingConditionView.elm
          );
        break;
      case CONDITION_ITEM_TYPE.group:
        addedConditionView = selectingConditionView.addNewConditionItem(
          conditionType,
          defaultValues
        );
        break;
    }

    return addedConditionView;
  }

  // private methods

  _defineEvents() {
    let downX, downY;
    this._elm.addEventListener('mousedown', (e) => {
      [downX, downY] = [e.x, e.y];
    });
    this._elm.addEventListener('click', (e) => {
      if (Math.abs(downX - e.x) > 2 || Math.abs(downY - e.y) > 2) return;
      e.stopImmediatePropagation();
      this._selection.deselectAllConditions();
    });
  }

  // accessor

  get elm() {
    return this._elm;
  }

  get container() {
    return this._container;
  }

  get selection() {
    return this._selection;
  }
}
