import { HierarchyNode, hierarchy } from 'd3-hierarchy';
import { CONDITION_TYPE } from '../definition.js';
import { ADVANCED_CONDITIONS } from '../global.js';
import ConditionItemView from './ConditionItemView.js';
import ConditionValueEditor from './ConditionValueEditor.js';
import ConditionValues from './ConditionValues.js';
import StoreManager from './StoreManager.js';

type DataNode = {
  id: string;
  label: string;
  value: string;
  children?: Array<DataNode>;
};

type DataNodeWithChecked = DataNode & {
  checked: boolean;
  indeterminate?: boolean;
};

export default class ConditionValueEditorColumnsDataset extends ConditionValueEditor {
  #lastValueViews: Array<HTMLDivElement>;
  #data: HierarchyNode<DataNodeWithChecked>;
  #columns: HTMLElement;
  #nodesToShowInValueView: Array<HierarchyNode<DataNodeWithChecked>>;
  #uniqueIdCounter: number;

  constructor(valuesView: ConditionValues, conditionView: ConditionItemView) {
    super(valuesView, conditionView);

    this.#data = this.#prepareData();

    this.#nodesToShowInValueView = [];

    this.#uniqueIdCounter = 0;
    // HTML
    this._createElement(
      'columns-editor-view',
      `
    <header>Select ${this._conditionType}</header>
    <div class="body">
      <div class="columns"></div>
      <div class="description"></div>
    </div>`
    );
    this.#columns = this._body.querySelector(':scope > .columns');
    this.#drawColumn();
  }

  // public methods

  /** on click pencil icon in value view, save last values */
  keepLastValues() {
    this.#lastValueViews = this._valueViews;
  }

  /** Restore last values (on press Cancel button) */
  restore() {
    //reset all checked
    this.#data.each((datum) => {
      datum.data.checked = false;
    });

    for (const lastValue of this.#lastValueViews) {
      const node = this.#data.find(
        (d) => d.data.value === lastValue.dataset['value']
      );
      if (!node) continue;
      node.data.checked = true;
      this.#updateChildren(node, true);
      this.#updateParents(node, true);
    }
    this.#update();
    this._updateValueViews(this.#lastValueViews);
  }

  get isValid() {
    return this._valueViews.length > 0;
  }

  // private methods

  // Nodeに一意のIDを追加する関数
  #addIdsToDataNodes(dataNodes: DataNode[]): DataNodeWithChecked[] {
    return dataNodes.map((node) => {
      if (!Number.isInteger(this.#uniqueIdCounter)) {
        this.#uniqueIdCounter = 0; // 念のため整数で初期化
      }

      // 各ノードに一意のIDを設定
      const newNode: DataNodeWithChecked = {
        ...node,
        id: `${this.#uniqueIdCounter++}`,
        checked: false,
        indeterminate: false,
      };

      // 子ノードがある場合は再帰的に処理
      if (newNode.children && newNode.children.length > 0) {
        newNode.children = this.#addIdsToDataNodes(newNode.children);
      }
      return newNode;
    });
  }

  #prepareData() {
    switch (this._conditionType) {
      case CONDITION_TYPE.dataset: {
        const data = ADVANCED_CONDITIONS[this._conditionType]
          .values as DataNodeWithChecked[];
        const dataWithIds = this.#addIdsToDataNodes(data);

        const hierarchyData = hierarchy<DataNodeWithChecked>({
          id: '-1',
          label: 'root',
          value: '',
          children: dataWithIds,
          checked: false,
          indeterminate: false,
        });

        return hierarchyData;
      }
      default:
        throw new Error(
          'ConditionValueEditorColumnsDataset - Invalid condition type'
        );
    }
  }

  async #drawColumn(parentId?: string) {
    await StoreManager.fetchLoginStatus();
    const isLogin = StoreManager.getData('isLogin');
    this.#getItems(parentId).then((items) => {
      // make HTML
      const column = document.createElement('div');
      column.classList.add('column');
      column.dataset.depth = this.#columns
        .querySelectorAll(':scope > .column')
        .length.toString();
      this.#columns.append(column);
      column.innerHTML = `
        <ul>
          ${items
            .map((item) => {
              let listItem = `<li`;

              listItem += ` data-id="${item.data.id}"`;
              listItem += ` data-parent="${item.parent.data.id}"`;
              if (item.data.value) {
                listItem += ` data-value="${item.data.value}"`;
              }

              listItem += `>
                <label>
                  <input type="checkbox" value="${item.data.id}">`;

              // dataset-icon` 追加
              if (
                this._conditionType === CONDITION_TYPE.dataset &&
                item.depth === 1
              ) {
                listItem += `<span class="dataset-icon" data-dataset="${item.data.value}"> </span>`;
              }

              listItem += `<span>${item.data.label}</span>
                </label>`;

              // 子要素がある場合に矢印を追加
              if (item.children !== undefined) {
                if (!(isLogin === false && item.data.id === '1')) {
                  listItem += `<div class="arrow" data-id="${item.data.id}"></div>`;
                }
              }

              listItem += `</li>`;
              return listItem;
            })
            .join('')}
        </ul>`;

      // attach events
      // add/remove condition
      column.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const checked = target.checked;
        const nodeId = target.closest('li').dataset.id;
        const changedNode = this.#data.find((datum) => datum.data.id == nodeId);

        if (changedNode.children) this.#updateChildren(changedNode, checked);
        if (changedNode.parent) this.#updateParents(changedNode, checked);

        this.#update();
      });

      // drill down
      for (const item of column.querySelectorAll(':scope > ul > li > .arrow')) {
        item.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          const item = target.closest('li');
          const closestColumn: HTMLElement = item.closest('.column');
          const closestColumns: HTMLElement = item.closest('.columns');
          // release selecting item, and remove subdirectory
          item.parentNode
            .querySelector(':scope > .-selected')
            ?.classList.remove('-selected');
          const depth = parseInt(closestColumn.dataset.depth);
          for (const column of closestColumns.querySelectorAll(
            ':scope > .column'
          )) {
            //@ts-ignore
            if (parseInt(column.dataset.depth) > depth)
              column.parentNode.removeChild(column);
          }
          // select, and drill down
          item.classList.add('-selected');

          this.#drawColumn(target.dataset.id);
        });
      }
      this.#update();

      // scroll
      const left = this._body.scrollWidth - this._body.clientWidth;
      if (left > 0) {
        this._body.scrollTo({
          top: 0,
          left: left,
          behavior: 'smooth',
        });
      }
    });
  }

  #getItems(parentId?: string): Promise<HierarchyNode<DataNodeWithChecked>[]> {
    return new Promise((resolve, reject) => {
      if (!parentId) resolve(this.#data.children);
      const found = this.#data.find((datum) => datum.data.id === parentId);
      resolve(found?.children);
    });
  }

  #updateChildren(node: HierarchyNode<DataNodeWithChecked>, checked: boolean) {
    // reflect
    if (!node.children || node.children.length === 0) return;

    node.descendants().forEach((d) => {
      d.data.checked = checked;
    });
  }

  /** Update the parent nodes of the given node */
  #updateParents(
    dataNode: HierarchyNode<DataNodeWithChecked> | undefined,
    checked?: boolean
  ) {
    if (!dataNode) return;

    if (typeof checked === 'boolean') {
      // clicked this node
      dataNode.data.checked = checked;
      dataNode.data.indeterminate = false;
    } else {
      // clicked some descendant node
      const numberOfChecked = dataNode.children.filter(
        (child) => child.data.checked
      ).length;

      const everyChecked = numberOfChecked === dataNode.children.length;
      const someButNotEveryChecked =
        numberOfChecked > 0 && numberOfChecked < dataNode.children.length;
      const someIndeterminate = dataNode.children.some(
        (child) => child.data.indeterminate
      );

      dataNode.data.checked = everyChecked;
      dataNode.data.indeterminate = someIndeterminate || someButNotEveryChecked;
    }

    this.#updateParents(dataNode.parent);
  }

  #update() {
    // reflect check status in DOM
    this.#data.eachAfter((datum) => {
      const checkbox: HTMLInputElement = this.#columns.querySelector(
        `li[data-id="${datum.data.id}"] > label > input`
      );
      if (checkbox) {
        checkbox.checked = !datum.data.indeterminate && datum.data.checked;
        checkbox.indeterminate =
          !datum.data.checked && datum.data.indeterminate;
      }
    });

    // update values in the value view (ellipsises at the top)

    this.#processValuesToShowInValueView();
    this._clearValueViews();

    for (const valueViewToAdd of this.#nodesToShowInValueView) {
      this._addValueView(
        valueViewToAdd.data.value,
        this.#getLabelForValueToShow(valueViewToAdd)
      );
    }

    // validation
    this._valuesView.update(this.#validate());
  }

  #processValuesToShowInValueView() {
    this.#nodesToShowInValueView = concatNodesToParent(this.#data);
  }

  /** Get the label with path to show in the value view */
  #getLabelForValueToShow(node: HierarchyNode<DataNodeWithChecked>) {
    const [, ...path] = node.path(this.#data).reverse();
    return path.map((d) => d.data.label).join(' > ');
  }

  #validate() {
    return this.isValid;
  }
}

function concatNodesToParent(node: HierarchyNode<DataNodeWithChecked>) {
  if (!node.children) {
    if (node.data.checked) {
      return node;
    } else {
      return undefined;
    }
  }
  const children = node.children;
  const everyChildChecked = children.every((child) => child.data.checked);

  if (everyChildChecked && node.data.value) {
    return node;
  } else {
    return children
      .flatMap((child) => concatNodesToParent(child))
      .filter(Boolean);
  }
}
