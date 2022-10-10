import { API_URL } from '../global.js';
import { CONDITION_TYPE } from '../definition.js';

const NUMBER_OF_SUGGESTS = 10; // TODO: Config
const SUGGEST_LABELS = {
  gene: 'Gene symbol',
  disease: 'Disease name',
};

const KEY_INCREMENT = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

export default class SearchFieldView {
  /**
   * @param {Object} _delegate - SimpleSearchView Object ?
   * @param {Element} _elm - SimpleSearchView Element
   * @param {String} _placeholder - placeholder for gene, disease
   * @param {Array} _suggestDictionaries - ['gene', 'disease']
   * @param {URL} _queryURL
   * @param {String | Undefined} _conditionType - 'gene' or 'disease' or undefined
   */
  constructor(
    _delegate,
    _elm,
    _placeholder,
    _suggestDictionaries,
    _queryURL = `${API_URL}/suggest?term=`,
    _conditionType
  ) {
    this._delegate = _delegate;
    this._queryURL = _queryURL;
    this._suggestDictionaries = _suggestDictionaries;
    this._conditionType = _conditionType;

    // make HTML
    _elm.innerHTML = `
    <div class="search-field-view">
      <div class="fieldcontainer">
        <div class="field">
          <input type="text" title="${_placeholder}" placeholder="${_placeholder}">
          <button>Search</button>
        </div>
      </div>
      <div class="examples"></div>
      <div class="suggest-view"></div>
    </div>`;

    // reference
    const view = _elm.querySelector(':scope > .search-field-view');
    const field = view.querySelector(':scope > .fieldcontainer > .field');
    this._field = field.querySelector(':scope > input[type="text"]');
    this._button = field.querySelector(':scope > button');
    this._examples = view.querySelector(':scope > .examples');
    this._suggestView = view.querySelector(':scope > .suggest-view');
    this._suggesting = false;

    // events
    this._field.addEventListener('keydown', this._itemSelect.bind(this));
    this._field.addEventListener(
      'keyup',
      this._suggestDecisionAndShowHide.bind(this)
    );
    // this._field.addEventListener('blur', this._blur.bind(this));
    this._button.addEventListener('click', this._search.bind(this));
  }

  // private methods

  //現在表示エリア外の際のnth-childが取れない問題が出ている
  _itemSelect(e) {
    if (this._suggesting && KEY_INCREMENT[e.code]) {
      let item = this._suggestView.querySelector(
        `.column:nth-child(${this._suggestPosition.x + 1})
        > .list
        > .item:nth-child(${this._suggestPosition.y + 1})`
      );
      if (item) item.classList.remove('-selected');

      // console.log(this._suggestPosition.x, this._suggestPosition.y);
      // if (this._suggestPosition.x !== -1 && this._suggestPosition.y !== -1) {
      this._suggestPositionShift(KEY_INCREMENT[e.code]);
      item = this._suggestView.querySelector(
        `.column:nth-child(${this._suggestPosition.x + 1})
        > .list
        > .item:nth-child(${this._suggestPosition.y + 1})`
      );
      item.classList.add('-selected');
      // }
      // e.preventDefault();
      // return false;
    }
  }

  _suggestDecisionAndShowHide(e) {
    // e.preventDefault();

    if (e.key === 'Enter') {
      this._suggestDecision();
    } else {
      this._suggestHide(e);
      this._suggestShow();
    }
  }

  _suggestDecision() {
    const selectWithCursor =
      this._suggesting &&
      this._suggestPosition.x !== -1 &&
      this._suggestPosition.y !== -1;

    if (selectWithCursor) {
      this._field.value =
        this._suggestList[this._suggestPosition.x][this._suggestPosition.y]
          .alias_of ||
        this._suggestList[this._suggestPosition.x][this._suggestPosition.y]
          .term;
    }
    this._suggesting = false;
    this._suggestView.innerHTML = '';
    this._search();
  }

  _suggestHide(e) {
    const hideSuggest =
      this._suggesting && (e.key === 'Escape' || this._field.value.length < 3);

    if (hideSuggest) {
      this._suggesting = false;
      this._suggestView.innerHTML = '';
      this.lastValue = '';
    }
  }

  _suggestShow() {
    const showSuggest =
      this._field.value.length >= 3 && this._field.value !== this.lastValue;

    if (showSuggest) {
      fetch(`${this._queryURL}${this._field.value}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
        .then((response) => response.json())
        .then((json) => this._suggest(json));
    }
  }

  // where are you blurring?
  // _blur() {
  //   setTimeout(() => {
  //     if (this._suggesting) {
  //       this._suggesting = false;
  //       this._suggestView.innerHTML = '';
  //       this.lastValue = '';
  //     }
  //   }, 250);
  // }

  _suggestPositionShift(incrementOfXY) {
    this._initialChangeOfSuggestPosition(incrementOfXY);
    this._changeSuggestPositionOnReturn(incrementOfXY);

    // if (
    //   this._suggestList[this._suggestPosition.x][this._suggestPosition.y] ===
    //   undefined
    // ) {
    //   this._suggestPositionShift(increment);
    // }
  }

  _keyDirection(incrementOfXY) {
    return {
      arrowUp: incrementOfXY.y === -1,
      arrowDown: incrementOfXY.y === 1,
      arrowLeft: incrementOfXY.x === -1,
      arrowRight: incrementOfXY.x === 1,
    };
  }

  _initialChangeOfSuggestPosition(incrementOfXY) {
    if (this._suggestPosition.x === -1 && this._suggestPosition.y === -1) {
      switch (true) {
        case this._keyDirection(incrementOfXY).arrowUp:
          return (this._suggestPosition = { x: 0, y: -1 });
        case this._keyDirection(incrementOfXY).arrowDown:
          return (this._suggestPosition = { x: 0, y: 0 });
        case this._keyDirection(incrementOfXY).arrowLeft:
          return (this._suggestPosition = { x: 0, y: 0 });
        case this._keyDirection(incrementOfXY).arrowRight:
          return (this._suggestPosition = { x: -1, y: 0 });
      }
    } else {
      this._suggestPosition.x += incrementOfXY.x;
      this._suggestPosition.y += incrementOfXY.y;
    }
  }

  _changeSuggestPositionOnReturn(incrementOfXY) {
    switch (true) {
      case this._keyDirection(incrementOfXY).arrowUp:
        if (this._suggestPosition.y < 0)
          return (this._suggestPosition.y = this._suggestList[0].length - 1);
      case this._keyDirection(incrementOfXY).arrowDown:
        if (this._suggestPosition.y >= this._suggestList[0].length)
          return (this._suggestPosition.y = 0);
      case this._keyDirection(incrementOfXY).arrowLeft:
        if (this._suggestPosition.x < 0)
          return (this._suggestPosition.x = this._suggestList.length - 1);
      case this._keyDirection(incrementOfXY).arrowRight:
        if (this._suggestPosition.x >= this._suggestList.length)
          return (this._suggestPosition.x = 0);
    }
  }

  _search() {
    this._delegate.search();
  }

  _suggest(data) {
    this._suggesting = true;
    this.lastValue = this._field.value;
    this._suggestPosition = { x: -1, y: -1 };

    let max;

    const dictionaries = [];
    this._suggestList = [];

    // if we are querying with simple search, API returns an object {gene:..., disease:...}, if searching disease / gene, it returns an array [{id:..., label:..., highlight:...}, ...]
    if (!Array.isArray(data)) {
      max = Math.max(
        ...this._suggestDictionaries.map((key) => data[key].length)
      );
      max = Math.min(max, NUMBER_OF_SUGGESTS);

      Object.keys(data).forEach((key, index) => {
        if (this._suggestDictionaries.indexOf(key) !== -1) {
          if (data[key].length > 0) {
            dictionaries.push(key);
            const column = [];
            for (let i = 0; i < max; i++) {
              column.push(data[key][i]);
            }
            this._suggestList[index] = column;
          }
        }
      });

      this._suggestView.innerHTML = dictionaries
        .map((key, index) => {
          const column = this._suggestList[index];
          return `
      <div class="column">
        <h3 class="title">${SUGGEST_LABELS[key]}</h3>
        <ul class="list">
          ${column
            .map((item) => {
              return `<li class="item${
                item === undefined ? ' -disabled' : ''
              }" data-value="${item ? item.term : ''}" data-alias="${
                item && item.alias_of ? item.alias_of : ''
              }">
              ${
                item
                  ? `${
                      `<span class="main">${
                        item.alias_of ? item.alias_of : item.term
                      }</span>` +
                      (item.alias_of
                        ? `<span class="sub">alias: ${item.term}</span>`
                        : '')
                    }`
                  : ''
              }
            </li>`;
            })
            .join('')}
        </ul>
      </div>`;
        })
        .join('');

      this._suggestView
        .querySelectorAll('.column > .list > .item')
        .forEach((item) => {
          if (!item.classList.contains('-disabled')) {
            $(item).on('click', (e) => {
              e.stopPropagation();
              this._field.value =
                e.currentTarget.dataset.alias || e.currentTarget.dataset.value;
              this._suggesting = false;
              this._suggestView.innerHTML = '';
              this._search();
            });
          }
        });
    } else {
      max = Math.min(data.length, NUMBER_OF_SUGGESTS);
      this._suggestList = data;
      this._suggestView.innerHTML = `
      <div class="column">
        <h3 class="title">Disease</h3>
      </div>
      `;
      const ul = document.createElement('ul');
      ul.className = 'list';
      if (max !== 0) {
        for (let i = 0; i < max; i++) {
          const item = data[i];
          const li = document.createElement('li');
          li.className = 'item';
          li.dataset.value = item.id;
          li.dataset.label =
            this._conditionType === CONDITION_TYPE.gene_symbol
              ? item.symbol
              : item.id;
          li.innerHTML = item.highlight;
          ul.appendChild(li);
        }

        ul.addEventListener('click', (e) => {
          e.stopPropagation();
          if (e.target && e.target.dataset.value) {
            this._field.value = e.target.dataset.label; // text field value, i.e. "label"
            this._field.dataset.value = e.target.dataset.value; // text dataset value for query, i.e. "value"
            this._suggesting = false;
            this._suggestView.innerHTML = '';
            this._search();
          }
        });
      } else {
        ul.innerHTML = `<li class="item -disabled">No results found</li>`;
      }
      this._suggestView.querySelector('.column').appendChild(ul);
    }
  }

  // public method

  setExamples(examples) {
    this._examples.innerHTML = examples
      .map(
        (example) => `<dl><dt>${example.key}</dt><dd>${example.value}</dd></dl>`
      )
      .join('');
    return this._examples.querySelectorAll('dl');
  }

  setTerm(term, excute = false) {
    this._field.value = term;
    if (excute) this._button.dispatchEvent(new Event('click'));
  }

  get value() {
    return this._field.dataset.value;
  }

  get label() {
    return this._field.value;
  }
}
