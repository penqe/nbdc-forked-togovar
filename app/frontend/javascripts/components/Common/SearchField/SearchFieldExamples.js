import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import Styles from '../../../../stylesheets/object/component/simple-search-examples.scss';

@customElement('search-field-examples')
export default class SearchFieldExamples extends LitElement {
  static styles = [Styles];

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
