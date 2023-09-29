import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { Task } from '@lit-labs/task';
import { axios } from '../../../utils/cachedAxios';

import './SearchFieldOnly';
import './SearchFieldSuggestionsList';

import Styles from '../../../../stylesheets/object/component/search-field-with-suggestions.scss';
import { debounce } from '../../../utils/debounce';

/**
 * @typedef SearchFieldOptions
 * @type {object}
 * @property {object} valueMappings - what from suggestion to map to the .value and .label
 * @property {string} valueMappings.valueKey - what to map to the .value (usually "id")
 * @property {string} valueMappings.labelKey - what to map to the .label
 * @property {string} valueMappings.aliasOfKey - what to map to the .subText
 * @property {{[key: string]: string}} titleMappings - how to map to the suggestion title
 */

@customElement('search-field-with-suggestions')
class SearchFieldtWithSuggestions extends LitElement {
  static styles = [Styles];

  _getSuggestURL = (text) => text;

  /** @type {SearchFieldOptions} */
  _searchFieldOptions = {};

  /** @property {string[]} */
  _suggestionKeysArray = [];

  _apiTask = new Task(
    this,
    async (term) => {
      if (term.length >= 3) {
        this.showSuggestions = true;

        const { data } = await axios.get(this._getSuggestURL(term));
        let dataToReturn;

        // Make suggestion data same format for simple & gene etc search
        if (Array.isArray(data)) {
          dataToReturn = { data: data };
          this._suggestionKeysArray = ['data'];
        } else {
          dataToReturn = data;
          this._suggestionKeysArray = Object.keys(data);
        }
        return (this.suggestData = dataToReturn);
      }
      return Promise.resolve(() => (this.showSuggestions = false));
    },
    () => this.term
  );

  /**
   * @param {string} placeholder - Placeholder text
   * @param {string} suggestAPIURL - URL to fetch suggestions from
   * @param {string} suggestAPIQueryParam - Query parameter to be used for the API call
   * @param {HTMLElement} element - HTML element to which the search field is attached
   * @param {SearchFieldOptions} options - Options for the search field
   */
  constructor(
    placeholder,
    suggestAPIURL,
    suggestAPIQueryParam,
    element,
    options
  ) {
    super();
    this.placeholder = placeholder;
    this.suggestAPIURL = suggestAPIURL;
    this.suggestAPIQueryParam = suggestAPIQueryParam;
    this._searchFieldOptions = options;

    if (element) {
      element.appendChild(this);
      if (this.suggestAPIQueryParam) {
        this._getSuggestURL = (text) => {
          const url = new URL(this.suggestAPIURL);
          url.searchParams.set(this.suggestAPIQueryParam, text);
          return url.toString();
        };
      } else {
        this._getSuggestURL = (text) => {
          return `${this.suggestAPIURL}/${text}`;
        };
      }
    }
  }

  /** value of the selected suggestion */
  @property({ type: String, state: true })
  value = null;

  /** label of selected suggestion */
  @property({ type: String, state: true })
  label = '';

  @property({ type: Boolean, state: true })
  showSuggestions = false;

  @property({ type: Number, state: true })
  currentSuggestionIndex = -1;

  @property({ type: Number, state: true })
  currentSuggestionColumnIndex = 0;

  @property({ type: Object, state: true })
  options;

  @property({ type: Array, state: true })
  suggestData = [];

  /** currently entered text */
  @property({ type: String })
  term = '';

  @property({ type: Boolean })
  hideSuggestions = false;

  @property({ type: String })
  placeholder;

  @property({ type: String, reflect: true })
  suggestAPIURL;

  /** simpeleでは使用しないのでいらない? 将来的にgemeもLitにするのでそのときにいるかも。componentを分けるかもしれないから、いらないかもだけど */
  // @property({ type: String, reflect: true })
  // suggestAPIQueryParam

  willUpdate(changed) {
    if (changed.has('suggestAPIURL') && this.suggestAPIURL) {
      if (this.suggestAPIQueryParam) {
        this._getSuggestURL = (text) => {
          const url = new URL(this.suggestAPIURL);
          url.searchParams.set(this.suggestAPIQueryParam, text);
          return url.toString();
        };
      } else {
        this._getSuggestURL = (text) => {
          return `${this.suggestAPIURL}/${text}`;
        };
      }
    }

    if (changed.has('options') && this.options) {
      this._searchFieldOptions = {
        ...this._searchFieldOptions,
        ...this.options,
      };
    }
  }

  _hideSuggestions = () => {
    this.showSuggestions = false;
  };

  _handleStepThroughColumns() {
    if (
      this.currentSuggestionIndex >
      this.suggestData[
        this._suggestionKeysArray[this.currentSuggestionColumnIndex]
      ].length -
        1
    ) {
      this.currentSuggestionIndex =
        this.suggestData[
          this._suggestionKeysArray[this.currentSuggestionColumnIndex]
        ].length - 1;
    }
  }

  _handleUpDownKeys = (e) => {
    if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight'
    ) {
      e.preventDefault();
    }

    switch (e.key) {
      case 'ArrowLeft':
        if (this.currentSuggestionColumnIndex - 1 < 0) {
          this.currentSuggestionColumnIndex =
            this._suggestionKeysArray.length - 1;

          return;
        }
        this.currentSuggestionColumnIndex--;
        this._handleStepThroughColumns();
        break;
      case 'ArrowRight':
        if (
          this.currentSuggestionColumnIndex + 1 >
          this._suggestionKeysArray.length - 1
        ) {
          this.currentSuggestionColumnIndex = 0;
          return;
        }
        this.currentSuggestionColumnIndex++;
        this._handleStepThroughColumns();
        break;
      case 'ArrowUp':
        if (this.currentSuggestionIndex - 1 < 0) {
          this.currentSuggestionIndex =
            this.suggestData[
              this._suggestionKeysArray[this.currentSuggestionColumnIndex]
            ].length - 1;
          return;
        }
        this.currentSuggestionIndex--;
        break;
      case 'ArrowDown':
        if (
          this.currentSuggestionIndex + 1 >
          this.suggestData[
            this._suggestionKeysArray[this.currentSuggestionColumnIndex]
          ].length -
            1
        ) {
          this.currentSuggestionIndex = 0;
          return;
        }
        this.currentSuggestionIndex++;
        break;
      case 'Enter':
        if (this.showSuggestions && this.currentSuggestionIndex !== -1) {
          this._select(
            this.suggestData[
              this._suggestionKeysArray[this.currentSuggestionColumnIndex]
            ][this.currentSuggestionIndex]
          );
          // } else if (this.showSuggestions && this.currentSuggestionIndex === -1) {
          //   this.#apiWithoutSelect(this.term);
        } else {
          //
          this._hideSuggestions();
          this._handleEnterKey();
        }

        break;
      case 'Escape':
        if (this.showSuggestions) {
          this._hideSuggestions();
        } else {
          this.showSuggestions = true;
        }
        break;
      default:
        break;
    }
  };

  _handleEnterKey() {
    this.dispatchEvent(
      new CustomEvent('search-term-enter', {
        detail: {
          term: this.term,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _select = (suggestion) => {
    this.value = suggestion[this._searchFieldOptions.valueMappings.valueKey];
    this.label = suggestion[this._searchFieldOptions.valueMappings.labelKey];

    this.dispatchEvent(
      new CustomEvent('new-suggestion-selected', {
        detail: {
          id: suggestion[this._searchFieldOptions.valueMappings.valueKey],
          label: suggestion[this._searchFieldOptions.valueMappings.labelKey],
        },
        bubbles: true,
        composed: true,
      })
    );
    this._hideSuggestions();
  };

  // #apiWithoutSelect = (term) => {
  //   this.dispatchEvent(
  //     new CustomEvent('term-enter', {
  //       detail: term,
  //       bubbles: true,
  //       composed: true,
  //     })
  //   );
  //   this._hideSuggestions();
  // };

  _handleSuggestionSelected = (e) => {
    this._select(e.detail);
  };

  _handleInput(e) {
    this.term = e.data;
    if (this.term.length < 3) {
      this._hideSuggestions();
      this.suggestData = [];
    }
  }

  _handleClick() {
    this.currentSuggestionIndex = -1;
    this.currentSuggestionColumnIndex = 0;
  }

  _handleFocusIn() {
    if (this.term.length > 3) {
      this.showSuggestions = true;
    }
  }

  _handleFocusOut() {
    this._hideSuggestions();
  }

  render() {
    return html`
      <search-field-only
        @change=${debounce(this._handleInput, 300)}
        @click=${this._handleClick}
        @focusin=${this._handleFocusIn}
        @focusout=${this._handleFocusOut}
        @keydown=${this._handleUpDownKeys}
        .placeholder=${this.placeholder}
        .value=${this.term}
        exportparts="input-field"
      ></search-field-only>
      <div class="suggestions-container">
        ${this.suggestData && this.showSuggestions && !this.hideSuggestions
          ? html`
              ${map(this._suggestionKeysArray, (key, keyIndex) => {
                return html`
                  <div class="column">
                    <search-field-suggestions-list
                      .suggestData=${this.suggestData[key]}
                      .highlightedSuggestionIndex="${keyIndex ===
                      this.currentSuggestionColumnIndex
                        ? this.currentSuggestionIndex
                        : -1}"
                      .itemIdKey=${'term'}
                      .itemLabelKey=${'term'}
                      .subTextKey=${this._searchFieldOptions?.valueMappings
                        ?.aliasOfKey}
                      title=${this._searchFieldOptions?.titleMappings?.[key]}
                      @suggestion-selected=${this._handleSuggestionSelected}
                    ></search-field-suggestions-list>
                  </div>
                `;
              })}
            `
          : nothing}
      </div>
    `;
  }

  setTerm(term) {
    this.label = term;
  }
}

export default SearchFieldtWithSuggestions;
