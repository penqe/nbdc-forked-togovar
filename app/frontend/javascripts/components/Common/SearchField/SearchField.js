import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import Style from '../../../../stylesheets/object/component/search-field.scss';

/** Class to create a only search field */
@customElement('search-field')
class SearchField extends LitElement {
  static styles = [Style];
  _inputRef = createRef();

  /**
   * @description Creates a styled search field
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

  /**
   * @param {HTMLDivElement} element - HTML element to which the search field is attached. (for vairant id)
   * @param {string} placeholder - Placeholder text */
  constructor(element, placeholder) {
    super();
    this.placeholder = placeholder;

    if (element) {
      element.appendChild(this);
    }
  }

  @property({ type: String }) placeholder;
  @property({ type: String }) value;

  /** Put a value into input when loaded */
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('load', this._handleLoad);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('load', this._handleLoad);
  }

  /** update input value */
  willUpdate(changed) {
    if (changed.has('value') && this._inputRef.value) {
      this._inputRef.value.value = this.value;
    }
  }

  /** If url has a value, put the value in input (simple search)
   * @private */
  _handleLoad = () => {
    this._inputRef.value.value = this.value;
  };

  /**
   * See {@link SearchFieldtWithSuggestions _handleInput}
   * @private
   * @param {KeyboardEvent} e */
  _handleInput(e) {
    e.preventDefault();
    this.value = e.target.value;
    this.dispatchEvent(
      new InputEvent('input-change', {
        data: this.value,
        bubbles: true,
        composed: true,
      })
    );
  }

  /** Control the normal behavior when pressing enter
   * @private
   * @param {KeyboardEvent} e */
  _handleForm(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  }

  /** Fires an event when the cross button is pressed
   * @private */
  _handleResetClick() {
    this.dispatchEvent(new MouseEvent('input-reset'));
  }

  render() {
    return html` <div class="search-field-view">
      <div class="fieldcontainer">
        <div class="field">
          <form class="input-form" @keydown=${this._handleForm}>
            <input
              class="searchfield"
              part="input-field"
              ${ref(this._inputRef)}
              type="text"
              .placeholder=${this.placeholder}
              @input=${this._handleInput}
              required
            />
            <button
              class="delete"
              type="reset"
              @click=${this._handleResetClick}
            ></button>
          </form>
        </div>
      </div>
    </div>`;
  }
}

export default SearchField;
