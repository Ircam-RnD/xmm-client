/**
 * Class to ease the creation of XMM compatible data recordings
 * able to validate a recorded buffer (phrase) or directly record a valid phrase
 *
 * @todo specify and implement
 */

export default class PhraseMaker {
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
		// does :
		// this._data = [];
		// this._data_in = [];
		// this._data_out = [];
	}

	set config(options = {}) {
		this._setConfig(options);
	}

	get config() {
		return this._config;
	}

	get phrase() {
		return {
			bimodal: this._config.bimodal,
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

	addObservation(obs) {
		if (obs.length != this._config.dimension ||
				(Number.isNumber(obs) && this._config.dimension != 1)) {
			console.error(
				'error : incoming observation length not matching with dimensions'
			);
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

	reset() {
		this._data = [];
		this._data_in = [];
		this._data_out = [];
	}

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
}