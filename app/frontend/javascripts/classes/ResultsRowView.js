import {VARIANT_TYPE_LABELS, DATASETS, CONSEQUENCES, COLUMNS} from '../global.js';
import StoreManager from "./StoreManager.js";

const REF_ALT_SHOW_LENGTH = 4;

export default class ResultsRowView {

  constructor(index) {
    this.index = index;
    this.selected = false;
    this.tr = document.createElement('tr');
    this.tr.classList.add('-loading');
    this.tr.innerHTML = `<td colspan="${COLUMNS.length}"></td>`;
    this.tr.addEventListener('click', this.click.bind(this));
    StoreManager.bind('selectedRow', this);
    StoreManager.bind('offset', this);
    StoreManager.bind('rowCount', this);
  }

  click() {
    StoreManager.setData('selectedRow', this.selected ? undefined : this.index);
  }

  offset() {
    this.update();
  }

  selectedRow(index) {
    if (index === this.index) {
      this.selected = true;
      this.tr.classList.add('-selected');
    } else {
      this.selected = false;
      this.tr.classList.remove('-selected');
    }
  }

  rowCount() {
    this.update();
  }

  prepareTableData() {
    let html = '';
    for (const column of COLUMNS) {
      switch (column.id) {
        case 'togovar_id':
          html += '<td class="togovar_id"><a href="" class="hyper-text -internal" target="_blank"></a></td>';
          break;
        case 'refsnp_id':
          html += `<td class="refsnp_id" data-remains=""><a href="" target="_blank" class="hyper-text -external"></a></td>`;
          break;
        case 'position':
          html += `<td class="position"><div class="chromosome-position"><div class="chromosome"></div><div class="coordinate"></div></div></td>`;
          break;
        case 'ref_alt':
          html += `<td class="ref_alt"><div class="ref-alt"><span class="ref" data-sum=""></span><span class="arrow"></span><span class="alt" data-sum=""><span class="sum"></span></span></div></td>`;
          break;
        case 'type':
          html += `<td class="type"><div class="variant-type"></div></td>`;
          break;
        case 'gene':
          html += '<td class="gene" data-remains=""><a href="" class="hyper-text -internal" target="_blank"></a></td>';
          break;
        case 'alt_frequency':
          html += `
            <td class="alt_frequency">
              <div class="frequency-graph">
                ${Object.keys(DATASETS).map(dataset => {
                  if (dataset == 'gnomad' || dataset == 'mgend' || dataset == 'clinvar') {
                    return '';
                  } else {
                    return `<div class="dataset" data-dataset="${dataset}" data-frequency=""></div>`;
                  }
                }).join('')}
              </div>
            </td>
          `;
          break;
        case 'consequence':
          html += '<td class="consequence" data-remains=""><div class="consequence-item"></div></td>';
          break;
        case 'sift':
          html += '<td class="sift" data-remains=""><div class="variant-function" data-function=""></div></td>';
          break;
        case 'polyphen':
          html += '<td class="polyphen" data-remains=""><div class="variant-function" data-function=""></div></td>';
          break;
        case 'clinical_significance':
          html += '<td class="clinical_significance" data-remains=""><div href="" class="clinical-significance" data-sign=""></div><a href="" class="hyper-text -internal" target="_blank"></a></td>';
          break;
      }
    }

    this.tr.innerHTML = html;
    this.tdTGVAnchor = this.tr.querySelector('td.togovar_id > a');
    this.tdRS = this.tr.querySelector('td.refsnp_id');
    this.tdRSAnchor = this.tdRS.querySelector('a');
    const tdPosition = this.tr.querySelector('td.position > .chromosome-position');
    this.tdPositionChromosome = tdPosition.querySelector('.chromosome');
    this.tdPositionCoordinate = tdPosition.querySelector('.coordinate');
    const tdRefAlt = this.tr.querySelector('td.ref_alt > .ref-alt');
    this.tdRefAltRef = tdRefAlt.querySelector('.ref');
    this.tdRefAltAlt = tdRefAlt.querySelector('.alt');
    this.tdType = this.tr.querySelector('td.type > .variant-type');
    this.tdGene = this.tr.querySelector('td.gene');
    this.tdGeneAnchor = this.tdGene.querySelector('a');
    this.tdFrequencies = {};
    this.tr.querySelectorAll('td.alt_frequency > .frequency-graph > .dataset').forEach(elm => this.tdFrequencies[elm.dataset.dataset] = elm);
    this.tdConsequence = this.tr.querySelector('td.consequence');
    this.tdConsequenceItem = this.tdConsequence.querySelector('.consequence-item');
    this.tdSift = this.tr.querySelector('td.sift');
    this.tdSiftFunction = this.tdSift.querySelector('.variant-function');
    this.tdPolyphen = this.tr.querySelector('td.polyphen');
    this.tdPolyphenFunction = this.tdPolyphen.querySelector('.variant-function');
    this.tdClinical = this.tr.querySelector('td.clinical_significance');
    this.tdClinicalSign = this.tdClinical.querySelector('.clinical-significance');
    this.tdClinicalAnchor = this.tdClinical.querySelector('a.hyper-text.-internal');
  }

  update() {
    if (StoreManager.getData('rowCount') <= this.index) {
      this.tr.classList.add('-out-of-range');
      return
    }

    const result = StoreManager.getRecordByIndex(this.index);

    if (result === 'loading') {
      this.tr.classList.add('-loading');
      this.tr.classList.remove('-out-of-range');
      this.tr.innerHTML = `<td colspan="${COLUMNS.length}"></td>`;
      return;
    }
    if (result === 'out of range') {
      this.tr.classList.remove('-loading');
      this.tr.classList.add('-out-of-range');
      return
    }
    if (this.tr.classList.contains('-loading')) {
      this.prepareTableData();
    }
    this.tr.classList.remove('-loading');
    this.tr.classList.remove('-out-of-range');

    for (const column of COLUMNS) {
      switch (column.id) {
        case 'togovar_id': {
          this.tdTGVAnchor.href = `/variant/${result.id}`;
          this.tdTGVAnchor.textContent = result.id;
        }
          break;
        case 'refsnp_id': {
          if (result.existing_variations.length > 0) {
            this.tdRS.dataset.remains = result.existing_variations.length - 1;
            this.tdRSAnchor.href = `http://identifiers.org/dbsnp/${result.existing_variations[0]}`;
            this.tdRSAnchor.textContent = `${result.existing_variations[0]}`;
          } else {
            this.tdRS.dataset.remains = 0;
            this.tdRSAnchor.href = '';
            this.tdRSAnchor.textContent = '';
          }
        }
          break;
        case 'position': {
          this.tdPositionChromosome.textContent = result.chromosome;
          this.tdPositionCoordinate.textContent = result.start;
        }
          break;
        case 'ref_alt': {
          const refalt = {
            ref: result.reference ? result.reference : '',
            alt: result.alternative ? result.alternative : ''
          };
          this.tdRefAltRef.textContent = refalt.ref.substr(0, REF_ALT_SHOW_LENGTH) + (refalt.ref.length > REF_ALT_SHOW_LENGTH ? '...' : '');
          this.tdRefAltRef.dataset.sum = refalt.ref.length;
          this.tdRefAltAlt.textContent = refalt.alt.substr(0, REF_ALT_SHOW_LENGTH) + (refalt.alt.length > REF_ALT_SHOW_LENGTH ? '...' : '');
          this.tdRefAltAlt.dataset.sum = refalt.alt.length;
        }
          break;
        case 'type': {
          this.tdType.textContent = VARIANT_TYPE_LABELS[result.type];
        }
          break;
        case 'gene': {
          if (result.symbols.length) {
            this.tdGene.dataset.remains = result.symbols.length - 1;
            this.tdGeneAnchor.href = `http://identifiers.org/hgnc/${result.symbols[0].id}`;
            this.tdGeneAnchor.textContent = result.symbols[0].name;
          } else {
            this.tdGene.dataset.remains = 0;
            this.tdGeneAnchor.href = '';
            this.tdGeneAnchor.textContent = '';
          }
        }
          break;
        case 'alt_frequency': {
          for (const key in DATASETS) {
            if (key === 'gnomad' || key === 'mgend' || key === 'clinvar') continue;
            const frequency = result.frequencies ? result.frequencies.find(frequency => frequency.source === DATASETS[key].search) : undefined;
            let frequencyValue;
            if (frequency) {
              switch (true) {
                case frequency.num_alt_alleles == 1:
                  frequencyValue = 'singleton';
                  break;
                case frequency.frequency >= .5:
                  frequencyValue = '≥0.5';
                  break;
                case frequency.frequency > .05:
                  frequencyValue = '<0.5';
                  break;
                case frequency.frequency > .01:
                  frequencyValue = '<0.05';
                  break;
                case frequency.frequency > .001:
                  frequencyValue = '<0.01';
                  break;
                case frequency.frequency > .0001:
                  frequencyValue = '<0.001';
                  break;
                case frequency.frequency > 0:
                  frequencyValue = '<0.0001';
                  break;
                default:
                  frequencyValue = 'monomorphic';
                  break;
              }
            } else {
              frequencyValue = 'na';
            }
            this.tdFrequencies[key].dataset.frequency = frequencyValue;
          }
        }
          break;
        case 'consequence': {
          if (result.most_severe_consequence) {
            this.tdConsequence.dataset.remains = result.transcripts.length - 1;
            this.tdConsequenceItem.textContent = CONSEQUENCES.find(consequence => consequence.accession === result.most_severe_consequence).label;
          } else {
            this.tdConsequence.dataset.remains = 0;
            this.tdConsequenceItem.textContent = '';
          }
        }
          break;
        case 'sift': {
          const sifts = result.transcripts.filter(transcript => transcript.sift);
          if (sifts.length > 0) {
            this.tdSift.dataset.remains = sifts.length - 1;
            this.tdSiftFunction.textContent = result.sift;
            this.tdSiftFunction.dataset.function = result.sift >= .05 ? 'T' : 'D';
          } else {
            this.tdSift.dataset.remains = 0;
            this.tdSiftFunction.textContent = '';
            this.tdSiftFunction.dataset.function = '';
          }
        }
          break;
        case 'polyphen': {
          const polyphens = result.transcripts.filter(transcript => transcript.polyphen);
          if (polyphens.length > 0) {
            this.tdPolyphen.dataset.remains = polyphens.length - 1;
            this.tdPolyphenFunction.textContent = result.polyphen;
            switch (true) {
              case result.polyphen > .908:
                this.tdPolyphenFunction.dataset.function = 'PROBD';
                break;
              case result.polyphen > .446:
                this.tdPolyphenFunction.dataset.function = 'POSSD';
                break;
              case result.polyphen >= 0:
                this.tdPolyphenFunction.dataset.function = 'B';
                break;
              default:
                this.tdPolyphenFunction.dataset.function = 'U';
                break;
            }
          } else {
            this.tdPolyphen.dataset.remains = 0;
            this.tdPolyphenFunction.textContent = '';
            this.tdPolyphenFunction.dataset.function = '';
          }
        }
          break;
        case 'clinical_significance': {
          if (result.significance.length) {
            this.tdClinical.dataset.remains = result.significance.length - 1;
            this.tdClinicalSign.dataset.sign = result.significance[0].interpretations[0];
            this.tdClinicalAnchor.textContent = result.significance[0].condition;
          } else {
            this.tdClinical.dataset.remains = 0;
            this.tdClinicalSign.dataset.sign = '';
            this.tdClinicalAnchor.textContent = '';
          }
        }
          break;
      }
    }
  }
}