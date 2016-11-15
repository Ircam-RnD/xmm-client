// An xmm-compatible training set must have the following fields :
// - bimodal (boolean)
// - column_names (array of strings)
// - dimension (integer)
// - dimension_input (integer < dimension)
// - phrases (array of phrases)
//   - on export, each phrase must have an extra "index" field
//     => when the class returns a set with getPhrasesOfLabel or getTrainingSet,
//        it should add these index fields before returning the result.
//     => when a set is added with addTrainingSet, the indexes must be removed
//        from the phrases before they are added to the internal array

/**
 * XMM compatible training set manager utility <br />
 * Class to ease the creation of XMM compatible training sets. <br />
 * Phrases should be generated with the PhraseMaker class or the original XMM library.
 */
class SetMaker {
  constructor() {
    this._config = {};
    this._phrases = [];
  }

  /***
   * The current total number of phrases in the set.
   * @readonly
   */
  // get size() {
  //   return this._phrases.length;
  // }

  /**
   * A valid XMM training set, ready to be processed by the XMM library.
   * @typedef xmmTrainingSet
   * @type {Object}
   * @name xmmTrainingSet
   * @property {Boolean} bimodal - Indicates wether the set's phrases data should be considered bimodal.
   * If true, the <code>dimension_input</code> property will be taken into account.
   * @property {Number} dimension - Size of a vector element of the set's phrases.
   * @property {Number} dimension_input - Size of the part of an input vector element that should be used for training.
   * This implies that the rest of the vector (of size <code>dimension - dimension_input</code>)
   * will be used for regression. Only taken into account if <code>bimodal</code> is true.
   * @property {Array.String} column_names - Array of string identifiers describing each scalar of a phrase's vector elements.
   * Typically of size <code>dimension</code>.
   * @property {Array.xmmPhrase} phrases  - Array of valid XMM phrases containing an extra "index" field.
   */

  /**
   * Get the total number of phrases actually in the set.
   * @returns {Number}
   */
  getSize() {
    return this._phrases.length;
  }

  /**
   * Add an XMM phrase to the current set.
   * @param {xmmPhrase} phrase - An XMM compatible phrase (ie created with the PhraseMaker class)
   */
  addPhrase(phrase) {
    if (this._phrases.length === 0) {
      this._setConfigFrom(phrase);
    } else if (!this._checkCompatibility(phrase)) {
      throw new Error('Bad phrase format: added phrase must match current set configuration');
    }
    this._phrases.push(phrase);
  }

  /**
   * Add all phrases from another training set.
   * @param {xmmTrainingSet} set - An XMM compatible training set.
   */
  addTrainingSet(set) {
    if (this._phrases.length === 0) {
      this._setConfigFrom(set);
    } else if (!this._checkCompatibility(set)) {
      throw new Error('Bad set format: added set must match current set configuration');
    }

    const phrases = set['phrases'];
    for (let phrase of phrases) {
      this._phrases.push(phrase);
    }
  }

  /**
   * Get phrase at a particular index.
   * @param {Number} index - The index of the phrase to retrieve.
   * @returns {xmmPhrase}
   */
  getPhrase(index) {
    if (index > -1 && index < this._phrases.length) {
      // return a new copy of the phrase :
      return JSON.parse(JSON.srtingify(this._phrases[index]));
    }
    return null;
  }

  /**
   * Remove phrase at a particular index.
   * @param {Number} index - The index of the phrase to remove.
   */
  removePhrase(index) {
    if (index > -1 && index < this._phrases.length) {
      this._phrases.splice(index, 1);
    }
  }

  /**
   * Return the subset of phrases of a particular label.
   * @param {String} label - The label of the phrases from which to generate the sub-training set.
   * @returns {xmmTrainingSet}
   */
  getPhrasesOfLabel(label) {
    const res = {};

    for (let prop in this._config) {
      res[prop] = this._config[prop];
    }

    res['phrases'] = [];
    let index = 0;

    for (let phrase of this._phrases) {
      if (phrase['label'] === label) {
        let p = JSON.parse(JSON.stringify(phrase));
        p['index'] = index++;
        res['phrases'].push(p);
      }
    }

    return res;
  }

  /**
   * Remove all phrases of a particular label.
   * @param {String} label - The label of the phrases to remove.
   */
  removePhrasesOfLabel(label) {
    for (let i = 0; i < this._phrases.length; i++) {
      if (this._phrases[i]['label'] === label) {
        this.phrases.splice(i, 1);
      }
    }
  }

  /**
   * Return the current training set.
   * @returns {xmmTrainingSet}
   */
  getTrainingSet() {
    let res = {};

    for (let prop in this._config) {
      res[prop] = this._config[prop];
    }

    res['phrases'] = [];
    let index = 0;

    for (let phrase of this._phrases) {
      let p = JSON.parse(JSON.stringify(phrase));
      p['index'] = index++;
      res['phrases'].push(p);
    }

    return res;
  }

  /**
   * Clear the whole set.
   */
  clear() {
    this._config = {};
    this._phrases = [];
  }

  /**
   * Check the config of a phrase or training set before applying it
   * to the current class.
   * Throw errors if not valid ?
   * @private
   */
  _setConfigFrom(obj) {
    for (let prop in obj) {
      if (prop === 'bimodal' && typeof(obj['bimodal']) === 'boolean') {
        this._config[prop] = obj[prop];
      } else if (prop === 'column_names' && Array.isArray(obj[prop])) {
        this._config[prop] = obj[prop].slice(0);
      } else if (prop === 'dimension' && Number.isInteger(obj[prop])) {
        this._config[prop] = obj[prop];
      } else if (prop === 'dimension_input' && Number.isInteger(obj[prop])) {
        this._config[prop] = obj[prop];
      }
    }
  }

  /**
   * Check if the phrase or set is compatible with the current settings.
   * @private
   */
  _checkCompatibility(obj) {
    if (obj['bimodal'] !== this._config['bimodal']
      || obj['dimension'] !== this._config['dimension']
      || obj['dimension_input'] !== this._config['dimension_input']) {
      return false;
    }

    const ocn = obj['column_names'];
    const ccn = this._config['column_names'];

    if (ocn.length !== ccn.length) {
      return false;
    } else {
      for (let i = 0; i < ocn.length; i++) {
        if (ocn[i] !== ccn[i]) {
          return false;
        }
      }
    }

    return true;
  }
};

export default SetMaker;