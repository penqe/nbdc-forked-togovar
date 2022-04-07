// import {ADVANCED_CONDITIONS} from '../global.js';

export default class ConditionItemView {

  /**
   * 
   * @param {AdvancedSearchBuilderView} builder 
   * @param {ConditionItemView | ConditionGroupView} parentView 
   * @param {Node} referenceElm
   */
  constructor(type, builder, parentView, referenceElm) {
    // console.log(type, builder, parentView, referenceElm)

    this._type = type;
    this._builder = builder;
    // this._parentView = parentView;

    // make HTML
    this._elm = document.createElement('div');
    this._elm.classList.add('advanced-search-condition-view');
    this._elm.delegate = this;
    parentView.container.insertBefore(this._elm, referenceElm);

    // event
    // let eventTarget;
    // switch (type) {
    //   case 'group':
    //   eventTarget = this._elm;
    //   break;
    //   case 'item':
    //   console.log(this._elm)
    //   console.log(this._elm.querySelector(':scope'))
    //   console.log(this._elm.querySelector(':scope > .body'))
    //   console.log(this._elm.querySelector(':scope > .body > .summary'))
    //   eventTarget = this._elm.querySelector(':scope > .body > .summary');
    //   break;
    // }
    // console.log(eventTarget)
    // eventTarget.addEventListener('click', e => {
    //   e.stopPropagation();
    //   console.log('click', this, e)
      
    // });
  }


  // private methods

  _toggleSelecting(e) {
    e.stopImmediatePropagation();
    if (e.shiftKey) {
      if (this.isSelecting) {
        this._builder.selection.deselectConditionViews([this]);
      } else {
        this._builder.selection.selectConditionViews([this], false);
      }
    } else {
      this._builder.selection.selectConditionViews([this], true);
    }
  }


  // public methods

  select() {
    this._elm.classList.add('-selected');
  }

  deselect() {
    this._elm.classList.remove('-selected');
  }

  remove() {
    console.log(this)
    this.parentView.removeConditionView(this);
    delete this;
  }


  // accessor

  /**
   * @return {HTMLElement}
   */
  get elm() {
    return this._elm;
  }

  /**
   * @return {Number}
   */
  get type() {
    return this._type;
  }

  /**
   * @return {Boolean}
   */
  get isSelecting() {
    return this._elm.classList.contains('-selected');
  }

  /**
   * @return {ConditionItemView | ConditionGroupView}
   */
  get parentView() {
    return this.elm.parentNode.closest('.advanced-search-condition-view').delegate;
  }

  /**
   * @param {parentView} conditionGroupView
   */
  set parentView(parentView) {
    this._parentView = parentView;
  }

  get depth() {
    let parentView = this.parentView;
    console.log('****', this.elm, parentView)
    let depth = 0;
    while (parentView) {
      parentView = parentView.parentView;
      if (parentView) depth++;
      console.log(parentView?.elm, depth)
    }
    return depth;
  }

}