const isArray = v => {
  return v.constructor === Float32Array || Array.isArray(v);
};

/**
 * XMM compatible phrase builder utility <br />
 * Class to ease the creation of XMM compatible data recordings, aka phrases. <br />
 * Phrases are typically arrays (flattened matrices) of size N * M,
 * N being the size of a vector element, and M the length of the phrase itself,
 * wrapped together in an object with a few settings.
 * @class
 */

class PhraseMaker {
  /**
   * XMM phrase configuration object.
   * @typedef xmmPhraseConfig
   * @type {Object}
   * @name xmmPhraseConfig
   * @property {Boolean} bimodal - Indicates wether phrase data should be considered bimodal.
   * If true, the <code>dimension_input</code> property will be taken into account.
   * @property {Number} dimension - Size of a phrase's vector element.
   * @property {Number} dimensionInput - Size of the part of an input vector element that should be used for training.
   * This implies that the rest of the vector (of size <code>dimension - dimension_input</code>)
   * will be used for regression. Only taken into account if <code>bimodal</code> is true.
   * @property {Array.String} column_names - Array of string identifiers describing each scalar of the phrase's vector elements.
   * Typically of size <code>dimension</code>.
   * @property {String} label - The string identifier of the class the phrase belongs to.
   */

  /**
   * @param {xmmPhraseConfig} options - Default phrase configuration.
   * @see {@link config}.
   */
  constructor(options = {}) {
    const defaults = {
      bimodal: false,
      dimension: 1,
      dimensionInput: 0,
      columnNames: [''],
      label: ''
    }

    this._config = defaults;
    this._setConfig(options);

    this.reset();
  }

  /**
   * Returns the current configuration.
   * @returns {xmmPhraseConfig}
   */
  getConfig() {
    return this._config;
  }

  /**
   * Updates the current configuration with the provided information.
   * @param {xmmPhraseConfig} options
   */
  setConfig(options = {}) {
    this._setConfig(options);
  }

  /** @private */
  _setConfig(options = {}) {
    for (let prop in options) {
      if (prop === 'bimodal' && typeof(options[prop]) === 'boolean') {
        this._config[prop] = options[prop];
      } else if (prop === 'dimension' && Number.isInteger(options[prop])) {
        this._config[prop] = options[prop];
      } else if (prop === 'dimensionInput' && Number.isInteger(options[prop])) {
        this._config[prop] = options[prop];
      } else if (prop === 'columnNames' && Array.isArray(options[prop])) {
        this._config[prop] = options[prop].slice(0);
      } else if (prop === 'label' && typeof(options[prop]) === 'string') {
        this._config[prop] = options[prop];
      }
    }   
  }

  /**
   * Append an observation vector to the phrase's data. Must be of length <code>dimension</code>.
   * @param {Array.Number} obs - An input vector, aka observation. If <code>bimodal</code> is true
   * @throws Will throw an error if the input vector doesn't match the config.
   */
  addObservation(obs) {
    // check input validity
    const badLengthMsg = 'Bad input length: observation length must match phrase dimension';
    const badTypeMsg = 'Bad data type: all observation values must be numbers';

    if (isArray(obs)) {
      for (let i = 0; i < obs.length; i++) {
        if (typeof(obs[i]) !== 'number') {
          throw new Error(badTypeMsg);
        }
      }
    } else if (typeof(obs !== 'number')) {
      throw new Error(badTypeMsg);
    }

    if (obs.length !== this._config.dimension ||
        (typeof(obs) === 'number' && this._config.dimension !== 1)) {
      throw new Error(badLengthMsg);
    }

    // add value(s) to internal arrays
    if (this._config.bimodal) {
      for (let i = 0; i < this._config.dimensionInput; i++) {
        this._dataIn.push(obs[i]);
      }

      for (let i = this._config.dimensionInput; i < this._config.dimension; i++) {
        this._dataOut.push(obs[i]);
      }
    } else {
      if (isArray(obs)) {
        for (let i = 0; i < obs.length; i++) {
          this._data.push(obs[i]);
        }
      } else {
        this._data.push(obs);
      }
    }
  }

  /**
   * A valid XMM phrase, ready to be processed by the XMM library.
   * @typedef xmmPhrase
   * @type {Object}
   * @name xmmPhrase
   * @property {Boolean} bimodal - Indicates wether phrase data should be considered bimodal.
   * If true, the <code>dimension_input</code> property will be taken into account.
   * @property {Number} dimension - Size of a phrase's vector element.
   * @property {Number} dimension_input - Size of the part of an input vector element that should be used for training.
   * This implies that the rest of the vector (of size <code>dimension - dimension_input</code>)
   * will be used for regression. Only taken into account if <code>bimodal</code> is true.
   * @property {Array.String} column_names - Array of string identifiers describing each scalar of the phrase's vector elements.
   * Typically of size <code>dimension</code>.
   * @property {String} label - The string identifier of the class the phrase belongs to.
   * @property {Array.Number} data - The phrase's data, containing all the vectors flattened into a single one.
   * Only taken into account if <code>bimodal</code> is false.
   * @property {Array.Number} data_input - The phrase's data which will be used for training, flattened into a single vector.
   * Only taken into account if <code>bimodal</code> is true.
   * @property {Array.Number} data_output - The phrase's data which will be used for regression, flattened into a single vector.
   * Only taken into account if <code>bimodal</code> is true.
   * @property {Number} length - The length of the phrase, e.g. one of the following :
   * <li style="list-style-type: none;">
   * <ul><code>data.length / dimension</code></ul>
   * <ul><code>data_input.length / dimension_input</code></ul>
   * <ul><code>data_output.length / dimension_output</code></ul>
   * </li>
   */

  /**
   * Returns a valid XMM phrase created from the config and the recorded data.
   * @returns {xmmPhrase}
   */
  getPhrase() {
    return this._getPhrase();
  }

  /** @private */
  _getPhrase() {
    let res = {
      bimodal: this._config.bimodal,
      column_names: this._config.columnNames,
      dimension: this._config.dimension,
      dimension_input: this._config.dimensionInput,
      label: this._config.label,
      length: this._config.bimodal
            ? this._dataIn.length / this._config.dimensionInput
            : this._data.length / this._config.dimension      
    };

    if (this._config.bimodal) {
      res.data_input = this._dataIn;//.slice(0);
      res.data_output = this._dataOut;//.slice(0);
    } else {
      res.data = this._data;//.slice(0);
    }

    return res;    
  }

  /**
   * Clear the phrase's data so that a new one is ready to be recorded.
   */
  reset() {
    this._data = [];
    this._dataIn = [];
    this._dataOut = [];
  }
};

export default PhraseMaker;