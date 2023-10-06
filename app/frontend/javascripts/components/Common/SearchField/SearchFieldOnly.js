import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import SimpleSearchStyle from '../../../../stylesheets/object/component/search-field-only.scss';

/** Class to create a only search field */
@customElement('search-field-only')
class SearchFieldOnly extends LitElement {
  static styles = [SimpleSearchStyle];
  _inputRef = createRef();

  /**
   * @description Creates a styled search field
   * @param {string} placeholder - Placeholder text
   * @param {HTMLElement} element - HTML element to which the search field is attached
   *
   * All events of the input field are dispatched on the element itself.
   * Can be attached with JS like this:
   * ```js
   * const searchField = new SearchField('Search', document.getElementById('search'));
   * ```
   *
   * Or with Lit like this:
   * ```js
   * render() {
   *   html`
   *     <search-field-only placeholder="Search"></search-field-only>
   *   `
   * }
   * ```
   */

  static get properties() {
    return {
      value: { type: String },
      placeholder: { type: String, attribute: 'placeholder' },
    };
  }

  constructor(element, placeholder) {
    super();

    this.value = '';
    this.placeholder = placeholder;
    this.term = '';

    //varieent idで検索するとき
    if (element) {
      element.appendChild(this);
    }
  }

  /**
   * @private
   * @param {Event} e
   */
  _handleInput(e) {
    this.value = e.target.value;

    this.dispatchEvent(
      new InputEvent('change', {
        data: this.value,
        bubbles: true,
        composed: true,
      })
    );
  }

  setTerm(term) {
    this.value = term;
  }

  willUpdate(changed) {
    if (changed.has('value') && this._inputRef.value) {
      this._inputRef.value.value = this.value;
    }
  }

  render() {
    return html` <div class="search-field-view">
      <div class="fieldcontainer">
        <div class="field">
          <input
            part="input-field"
            ${ref(this._inputRef)}
            type="text"
            placeholder=${this.placeholder}
            @input=${this._handleInput}
          />
        </div>
      </div>
    </div>`;
  }
}

export default SearchFieldOnly;
