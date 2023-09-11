import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import Styles from '../../../../stylesheets/object/component/simple-search-button.scss';

@customElement('search-button')
export default class SearchButton extends LitElement {
  static styles = [Styles];

  render() {
    return html`<button class="btn" />`;
  }
}
