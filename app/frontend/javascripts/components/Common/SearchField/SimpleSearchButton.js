import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import Styles from '../../../../stylesheets/object/component/simple-search-button.scss';

/**
 * Class to create a simple search button
 */
@customElement('search-button')
class SearchButton extends LitElement {
  static styles = [Styles];

  render() {
    return html`<button class="btn" />`;
  }
}

export default SearchButton;
