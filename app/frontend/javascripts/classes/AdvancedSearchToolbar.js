import { ADVANCED_CONDITIONS } from '../global.js';
import AdvancedSearchBuilderView from './AdvancedSearchBuilderView.js';

export default class AdvancedSearchToolbar {
  #advancedSearchBuilderView;

  /**
   *
   * @param {AdvancedSearchBuilderView} advancedSearchBuilderView
   * @param {HTMLElement} toolbar
   */
  constructor(advancedSearchBuilderView, toolbar) {
    this.#advancedSearchBuilderView = advancedSearchBuilderView;

    toolbar.classList.add('advanced-search-toolbar');

    // make HTML
    const COMMANDS = [
      {
        command: 'group',
        label: 'Group',
        shortcut: [71],
      },
      {
        command: 'ungroup',
        label: 'Ungroup',
        shortcut: [16, 71],
      },
      // {
      //   command: 'copy',
      //   label: 'Copy',
      //   shortcut: [67]
      // },
      // {
      //   command: 'edit',
      //   label: 'Edit',
      //   shortcut: [69]
      // },
      {
        command: 'delete',
        label: 'Delete',
        shortcut: [46],
      },
    ];

    toolbar.innerHTML = `
    <ul>
      <li class="-haschild">
        <p>Add condition</p>
        <ul>
          ${Object.keys(ADVANCED_CONDITIONS)
            .map(
              (key, index) => `
          <li class="command" data-command="add-condition" data-condition="${key}" data-shortcut="${
                index + 1
              }">
            <p>${ADVANCED_CONDITIONS[key].label}</p>
            <small class="shortcut"><span class="char -command"></span>${
              index + 1
            }</small>
          </li>
          `
            )
            .join('')}
        </ul>
      </li>
      ${COMMANDS.map(
        (command) => `
      <li class="command" data-command="${command.command}">
        <p>${
          command.label
        }<small class="shortcut"><span class="char -command"></span>${String.fromCharCode(
          ...command.shortcut
        )}</small></p>
      </li>
      `
      ).join('')}
    
    </ul>
    `;

    // references

    // events
    toolbar.querySelectorAll('.command').forEach((command) => {
      command.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
        switch (command.dataset.command) {
          case 'add-condition':
            {
              const defaultValue =
                typeof e.detail === 'object' ? e.detail : null;
              this.#advancedSearchBuilderView.addCondition(
                command.dataset.condition,
                defaultValue
              );
            }
            break;
          case 'group':
            this.#advancedSearchBuilderView.group();
            break;
          case 'ungroup':
            this.#advancedSearchBuilderView.ungroup();
            break;
          case 'copy':
            this.#advancedSearchBuilderView.copy();
            break;
          case 'edit':
            this.#advancedSearchBuilderView.edit();
            break;
          case 'delete':
            this.#advancedSearchBuilderView.delete();
            break;
        }
      });
    });
  }

  // public methods

  // canSearch(can) {
  //   if (can) this._searchButton.classList.remove('-disabled');
  //   else this._searchButton.classList.add('-disabled');
  // }
}
