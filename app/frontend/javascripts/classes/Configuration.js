import {PAGE, COLUMNS} from "../global.js";
import StoreManager from "./StoreManager.js";

export default class Configuration {

  constructor(elm) {
    this.elm = elm;
    this.bg = elm.querySelector('.bg');

    switch (PAGE) {
      case 'home':
        this.initHome();
        break;
    }
  }

  typeEscape(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  open() {
    this.elm.classList.add('-shown');
    StoreManager.setData('showModal', true)
    document.addEventListener('keyup', this.typeEscape.bind(this));
  }

  close() {
    this.elm.classList.remove('-shown');
    StoreManager.setData('showModal', false)
    document.removeEventListener('keyup', this.typeEscape.bind(this));
  }

  // initialize
  initHome() {
    StoreManager.bind('columns', this);

    // コンフィグ開く
    document.querySelector('#GlobalHeader > .menus > .config > .menu-button').addEventListener('click', () => {
        this.open();
      });
    // コンフィグ閉じる
    this.bg.addEventListener('click', () => {
      this.close();
    });

    // 設定項目
    const CONFIGURES = [
      { // column
        constant: COLUMNS,
        //localStrageKey: 'columns',
        storeKey: 'columns',
        container: document.getElementById('ConfSortColumns')
      }
    ];

    for (const configure of CONFIGURES) {
      // user settings
      let stored = localStorage.getItem(configure.storeKey);
      if (stored) {
        stored = JSON.parse(stored);
      } else {
        // デフォルト値作成
        stored = configure.constant.map(item => {
          const newItem = Object.assign({}, item);
          if (newItem.id === 'type') {
            newItem.isUsed = false;
          } else {
            newItem.isUsed = true;
          }
          return newItem;
        });
      }
      // 生成
      configure.container.innerHTML = stored.map(item => `<li><label><input type="checkbox" value="${item.id}"${item.isUsed ? ' checked' : ''}>${item.label}</label></li>`).join('');
      // input イベント
      configure.container.querySelectorAll('li > label > input').forEach(input => {
          input.addEventListener('change', e => {
            const stored = StoreManager.getData(configure.storeKey);
            const item = stored.find(item => item.id === e.target.value);
            item.isUsed = e.target.checked;
            StoreManager.setData(configure.storeKey, stored);
          })
        });

      // set to store
      StoreManager.setData(configure.storeKey, stored);
    }
  }

  columns(columns) {
    for (const column of columns) {
      this.elm.querySelector(`#ConfSortColumns > li > label > input[value="${column.id}"]`).checked = column.isUsed;
    }
    localStorage.setItem('columns', JSON.stringify(columns));
  }

}
