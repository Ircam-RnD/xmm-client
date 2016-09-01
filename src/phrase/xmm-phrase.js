/**
 * XMM compatible phrase builder utility <br />
 * Class to ease the creation of XMM compatible data recordings, aka phrases. <br />
 * Phrases are typically arrays (flattened matrices) of size N * M,
 * N being the size of a vector element, and M the length of the phrase itself,
 * wrapped together in an object with a few settings.
 */

class PhraseMaker {
	/**
	 * XMM phrase configuration object.
	 * @typedef XmmPhraseConfig
	 * @type {Object}
	 * @name XmmPhraseConfig
	 * @property {Boolean} bimodal - Indicates wether phrase data should be considered bimodal.
	 * If true, the <code>dimension_input</code> property will be taken into account.
	 * @property {Number} dimension - Size of a phrase's vector element.
	 * @property {Number} dimension_input - Size of the part of an input vector element that should be used for training.
	 * This implies that the rest of the vector (of size <code>dimension - dimension_input</code>)
	 * will be used for regression. Only taken into account if <code>bimodal</code> is true.
	 * @property {Array.String} column_names - Array of string identifiers describing each scalar of the phrase's vector elements.
	 * Typically of size <code>dimension</code>.
	 * @property {String} label - The string identifier of the class the phrase belongs to.
	 */

	/**
	 * @param {XmmPhraseConfig} options - Default phrase configuration.
	 * @see {@link config}.
	 */
	constructor(options = {}) {
		const defaults = {
			bimodal: false,
			dimension: 1,
			dimension_input: 0,
			column_names: [''],
			label: ''
		}
		Object.assign(defaults, options);
		this._config = {};
		this._setConfig(options);

		this.reset();
	}

	/**
	 * XMM phrase configuration object.
	 * Only legal fields will be checked before being added to the config, others will be ignored
	 * @type {XmmPhraseConfig}
	 */
	get config() {
		return this._config;
	}

	set config(options = {}) {
		this._setConfig(options);
	}

	/**
	 * A regular XMM phrase, ready to be used by the library.
	 * @typedef XmmPhrase
	 * @type {Object}
	 * @name XmmPhrase
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
	 * An XMM valid phrase, ready to be processed by the library
	 * @type {XmmPhrase}
	 */
	get phrase() {
		return {
			bimodal: this._config.bimodal,
			column_names: this._config.column_names,
			dimension: this._config.dimension,
			dimension_input: this._config.dimension_input,
			label: this._config.label,
			data: this._data.slice(0),
			data_input: this._data_in.slice(0),
			data_output: this._data_out.slice(0),
			length: this._config.bimodal
						?	this._data_in.length / this._config.dimension_input
						: this._data.length / this._config.dimension
		};
	}

	/**
	 * Append an observation vector to the phrase's data. Must be of length {@link XmmPhraseConfig#dimension}.
	 * @param {Array.Number} obs - An input vector, aka observation. If {XmmPhraseConfig#bimodal} is true
	 * @throws Will throw an error if the input vector doesn't match the config.
	 */
	addObservation(obs) {
		if (obs.length !== this._config.dimension ||
				(typeof(obs) === 'number' && this._config.dimension !== 1)) {
			console.error(
				'error : incoming observation length not matching with dimensions'
			);
			throw 'BadVectorSizeException';
			return;
		}

		if (this._config.bimodal) {
			this._data_in = this._data_in.concat(
				obs.slice(0, this._config.dimension_input)
			);
			this._data_out = this._data_out.concat(
				obs.slice(this._config.dimension_input)
			);
		} else {
			if (Array.isArray(obs)) {
				this._data = this._data.concat(obs);
			} else {
				this._data.push(obs);
			}
		}
	}

	/**
	 * Clear the phrase's data so that a new one is ready to be recorded.
	 */
	reset() {
		this._data = [];
		this._data_in = [];
		this._data_out = [];
	}

	/** @private */
	_setConfig(options = {}) {
		for (let prop in options) {
			if (prop === 'bimodal' && typeof(options[prop]) === 'boolean') {
				this._config[prop] = options[prop];
			} else if (prop === 'dimension' && Number.isInteger(options[prop])) {
				this._config[prop] = options[prop];
			} else if (prop === 'dimension_input' && Number.isInteger(options[prop])) {
				this._config[prop] = options[prop];
			} else if (prop === 'column_names' && Array.isArray(options[prop])) {
				this._config[prop] = options[prop].slice(0);
			} else if (prop === 'label' && typeof(options[prop]) === 'string') {
				this._config[prop] = options[prop];
			}
		}		
	}
};

export default PhraseMaker;