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
			column_names: ['']
		}
		this._config = {};
		this._setConfig(options);

		this._data = [];
	}

	set config(options = {}) {
		this._setConfig(options);
	}

	get config() {
		return this._config;
	}

	get phrase() {
		let res = {
			bimodal: this._config.bimodal,
			dimension: this._config.dimension,
			dimension_input: this._config.dimension_input,
			data: this._data.slice(0)
		};
		return res;
	}

	appendObservation(obs) {
		if (Array.isArray(obs)) {
			this._datadata = data.concat(obs);
		} else {
			this._data.push(obs);
		}
	}

	reset() {
		this._data = [];
	}

	_setConfig(options = {}) {
		for (let prop of options) {
			if (prop === 'bimodal' && typeof(options[prop]) === 'boolean') {
				this._config[prop] = options[prop];
			} else if (prop === 'dimension' && Number.isInteger(options[prop])) {
				this._config[prop] = options[prop];
			} else if (prop === 'dimension_input' && Number.isInteger(options[prop])) {
				this._config[pop] = options[prop];
			} else if (prop === 'column_names' && Array.isArray(options[prop])) {
				this._config[prop] = options[prop].slice(0);
			}
		}		
	}
};