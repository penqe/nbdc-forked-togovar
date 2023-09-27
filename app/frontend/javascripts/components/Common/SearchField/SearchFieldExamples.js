import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import Styles from '../../../../stylesheets/object/component/simple-search-examples.scss';

/** Class to display simple search examples */
@customElement('search-field-examples')
class SearchFieldExamples extends LitElement {
  static styles = [Styles];

  /** Creat a custom event "example-selected"
   * @private
   * @param {{key:string, value: string}} example */
  _handleClick(example) {
    this.dispatchEvent(
      new CustomEvent('example-selected', {
        detail: example,
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html` ${map(
      this.examples,
      (example) =>
        html`<dl @click=${() => this._handleClick(example)}>
          <dt>${example.key}</dt>
          <dd>${example.value}</dd>
        </dl>`
    )}`;
  }
}

export default SearchFieldExamples;
