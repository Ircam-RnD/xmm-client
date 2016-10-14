'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * XMM compatible phrase builder utility <br />
 * Class to ease the creation of XMM compatible data recordings, aka phrases. <br />
 * Phrases are typically arrays (flattened matrices) of size N * M,
 * N being the size of a vector element, and M the length of the phrase itself,
 * wrapped together in an object with a few settings.
 * @class
 */

var PhraseMaker = function () {
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
	function PhraseMaker() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		(0, _classCallCheck3.default)(this, PhraseMaker);

		var defaults = {
			bimodal: false,
			dimension: 1,
			dimension_input: 0,
			column_names: [''],
			label: ''
		};
		(0, _assign2.default)(defaults, options);
		this._config = {};
		this._setConfig(options);

		this.reset();
	}

	/**
  * XMM phrase configuration object.
  * Only legal fields will be checked before being added to the config, others will be ignored
  * @type {XmmPhraseConfig}
  */


	(0, _createClass3.default)(PhraseMaker, [{
		key: 'addObservation',


		/**
   * Append an observation vector to the phrase's data. Must be of length <code>dimension</code>.
   * @param {Array.Number} obs - An input vector, aka observation. If <code>bimodal</code> is true
   * @throws Will throw an error if the input vector doesn't match the config.
   */
		value: function addObservation(obs) {
			// todo : add tests that throw the right exceptions

			if (obs.length !== this._config.dimension || typeof obs === 'number' && this._config.dimension !== 1) {
				console.error('error : incoming observation length not matching with dimensions');
				throw 'BadVectorSizeException';
				return;
			}

			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = (0, _getIterator3.default)(obs), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var val = _step.value;

					if (typeof val !== 'number') {
						console.error('error : observation values must all be numbers');
						throw 'BadDataTypeException';
						return;
					}
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			if (this._config.bimodal) {
				this._data_in = this._data_in.concat(obs.slice(0, this._config.dimension_input));
				this._data_out = this._data_out.concat(obs.slice(this._config.dimension_input));
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

	}, {
		key: 'reset',
		value: function reset() {
			this._data = [];
			this._data_in = [];
			this._data_out = [];
		}

		/** @private */

	}, {
		key: '_setConfig',
		value: function _setConfig() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			for (var prop in options) {
				if (prop === 'bimodal' && typeof options[prop] === 'boolean') {
					this._config[prop] = options[prop];
				} else if (prop === 'dimension' && (0, _isInteger2.default)(options[prop])) {
					this._config[prop] = options[prop];
				} else if (prop === 'dimension_input' && (0, _isInteger2.default)(options[prop])) {
					this._config[prop] = options[prop];
				} else if (prop === 'column_names' && Array.isArray(options[prop])) {
					this._config[prop] = options[prop].slice(0);
				} else if (prop === 'label' && typeof options[prop] === 'string') {
					this._config[prop] = options[prop];
				}
			}
		}
	}, {
		key: 'config',
		get: function get() {
			return this._config;
		},
		set: function set() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			this._setConfig(options);
		}

		/**
   * A valid XMM phrase, ready to be processed by the XMM library.
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
   * A valid XMM phrase, ready to be processed by the XMM library.
   * @readonly
   * @type {XmmPhrase}
   */

	}, {
		key: 'phrase',
		get: function get() {
			return {
				bimodal: this._config.bimodal,
				column_names: this._config.column_names,
				dimension: this._config.dimension,
				dimension_input: this._config.dimension_input,
				label: this._config.label,
				data: this._data.slice(0),
				data_input: this._data_in.slice(0),
				data_output: this._data_out.slice(0),
				length: this._config.bimodal ? this._data_in.length / this._config.dimension_input : this._data.length / this._config.dimension
			};
		}
	}]);
	return PhraseMaker;
}();

;

exports.default = PhraseMaker;
//# sourceMappingURL=data:application/json;base64,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Ozs7O0FBc0VEOztrQkFFYyxXIiwiZmlsZSI6InhtbS1waHJhc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFhNTSBjb21wYXRpYmxlIHBocmFzZSBidWlsZGVyIHV0aWxpdHkgPGJyIC8+XG4gKiBDbGFzcyB0byBlYXNlIHRoZSBjcmVhdGlvbiBvZiBYTU0gY29tcGF0aWJsZSBkYXRhIHJlY29yZGluZ3MsIGFrYSBwaHJhc2VzLiA8YnIgLz5cbiAqIFBocmFzZXMgYXJlIHR5cGljYWxseSBhcnJheXMgKGZsYXR0ZW5lZCBtYXRyaWNlcykgb2Ygc2l6ZSBOICogTSxcbiAqIE4gYmVpbmcgdGhlIHNpemUgb2YgYSB2ZWN0b3IgZWxlbWVudCwgYW5kIE0gdGhlIGxlbmd0aCBvZiB0aGUgcGhyYXNlIGl0c2VsZixcbiAqIHdyYXBwZWQgdG9nZXRoZXIgaW4gYW4gb2JqZWN0IHdpdGggYSBmZXcgc2V0dGluZ3MuXG4gKiBAY2xhc3NcbiAqL1xuXG5jbGFzcyBQaHJhc2VNYWtlciB7XG5cdC8qKlxuXHQgKiBYTU0gcGhyYXNlIGNvbmZpZ3VyYXRpb24gb2JqZWN0LlxuXHQgKiBAdHlwZWRlZiBYbW1QaHJhc2VDb25maWdcblx0ICogQHR5cGUge09iamVjdH1cblx0ICogQG5hbWUgWG1tUGhyYXNlQ29uZmlnXG5cdCAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gYmltb2RhbCAtIEluZGljYXRlcyB3ZXRoZXIgcGhyYXNlIGRhdGEgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYmltb2RhbC5cblx0ICogSWYgdHJ1ZSwgdGhlIDxjb2RlPmRpbWVuc2lvbl9pbnB1dDwvY29kZT4gcHJvcGVydHkgd2lsbCBiZSB0YWtlbiBpbnRvIGFjY291bnQuXG5cdCAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkaW1lbnNpb24gLSBTaXplIG9mIGEgcGhyYXNlJ3MgdmVjdG9yIGVsZW1lbnQuXG5cdCAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkaW1lbnNpb25faW5wdXQgLSBTaXplIG9mIHRoZSBwYXJ0IG9mIGFuIGlucHV0IHZlY3RvciBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRyYWluaW5nLlxuXHQgKiBUaGlzIGltcGxpZXMgdGhhdCB0aGUgcmVzdCBvZiB0aGUgdmVjdG9yIChvZiBzaXplIDxjb2RlPmRpbWVuc2lvbiAtIGRpbWVuc2lvbl9pbnB1dDwvY29kZT4pXG5cdCAqIHdpbGwgYmUgdXNlZCBmb3IgcmVncmVzc2lvbi4gT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cblx0ICogQHByb3BlcnR5IHtBcnJheS5TdHJpbmd9IGNvbHVtbl9uYW1lcyAtIEFycmF5IG9mIHN0cmluZyBpZGVudGlmaWVycyBkZXNjcmliaW5nIGVhY2ggc2NhbGFyIG9mIHRoZSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudHMuXG5cdCAqIFR5cGljYWxseSBvZiBzaXplIDxjb2RlPmRpbWVuc2lvbjwvY29kZT4uXG5cdCAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBsYWJlbCAtIFRoZSBzdHJpbmcgaWRlbnRpZmllciBvZiB0aGUgY2xhc3MgdGhlIHBocmFzZSBiZWxvbmdzIHRvLlxuXHQgKi9cblxuXHQvKipcblx0ICogQHBhcmFtIHtYbW1QaHJhc2VDb25maWd9IG9wdGlvbnMgLSBEZWZhdWx0IHBocmFzZSBjb25maWd1cmF0aW9uLlxuXHQgKiBAc2VlIHtAbGluayBjb25maWd9LlxuXHQgKi9cblx0Y29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG5cdFx0Y29uc3QgZGVmYXVsdHMgPSB7XG5cdFx0XHRiaW1vZGFsOiBmYWxzZSxcblx0XHRcdGRpbWVuc2lvbjogMSxcblx0XHRcdGRpbWVuc2lvbl9pbnB1dDogMCxcblx0XHRcdGNvbHVtbl9uYW1lczogWycnXSxcblx0XHRcdGxhYmVsOiAnJ1xuXHRcdH1cblx0XHRPYmplY3QuYXNzaWduKGRlZmF1bHRzLCBvcHRpb25zKTtcblx0XHR0aGlzLl9jb25maWcgPSB7fTtcblx0XHR0aGlzLl9zZXRDb25maWcob3B0aW9ucyk7XG5cblx0XHR0aGlzLnJlc2V0KCk7XG5cdH1cblxuXHQvKipcblx0ICogWE1NIHBocmFzZSBjb25maWd1cmF0aW9uIG9iamVjdC5cblx0ICogT25seSBsZWdhbCBmaWVsZHMgd2lsbCBiZSBjaGVja2VkIGJlZm9yZSBiZWluZyBhZGRlZCB0byB0aGUgY29uZmlnLCBvdGhlcnMgd2lsbCBiZSBpZ25vcmVkXG5cdCAqIEB0eXBlIHtYbW1QaHJhc2VDb25maWd9XG5cdCAqL1xuXHRnZXQgY29uZmlnKCkge1xuXHRcdHJldHVybiB0aGlzLl9jb25maWc7XG5cdH1cblxuXHRzZXQgY29uZmlnKG9wdGlvbnMgPSB7fSkge1xuXHRcdHRoaXMuX3NldENvbmZpZyhvcHRpb25zKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBIHZhbGlkIFhNTSBwaHJhc2UsIHJlYWR5IHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgWE1NIGxpYnJhcnkuXG5cdCAqIEB0eXBlZGVmIFhtbVBocmFzZVxuXHQgKiBAdHlwZSB7T2JqZWN0fVxuXHQgKiBAbmFtZSBYbW1QaHJhc2Vcblx0ICogQHByb3BlcnR5IHtCb29sZWFufSBiaW1vZGFsIC0gSW5kaWNhdGVzIHdldGhlciBwaHJhc2UgZGF0YSBzaG91bGQgYmUgY29uc2lkZXJlZCBiaW1vZGFsLlxuXHQgKiBJZiB0cnVlLCB0aGUgPGNvZGU+ZGltZW5zaW9uX2lucHV0PC9jb2RlPiBwcm9wZXJ0eSB3aWxsIGJlIHRha2VuIGludG8gYWNjb3VudC5cblx0ICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbiAtIFNpemUgb2YgYSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudC5cblx0ICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbl9pbnB1dCAtIFNpemUgb2YgdGhlIHBhcnQgb2YgYW4gaW5wdXQgdmVjdG9yIGVsZW1lbnQgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdHJhaW5pbmcuXG5cdCAqIFRoaXMgaW1wbGllcyB0aGF0IHRoZSByZXN0IG9mIHRoZSB2ZWN0b3IgKG9mIHNpemUgPGNvZGU+ZGltZW5zaW9uIC0gZGltZW5zaW9uX2lucHV0PC9jb2RlPilcblx0ICogd2lsbCBiZSB1c2VkIGZvciByZWdyZXNzaW9uLiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlLlxuXHQgKiBAcHJvcGVydHkge0FycmF5LlN0cmluZ30gY29sdW1uX25hbWVzIC0gQXJyYXkgb2Ygc3RyaW5nIGlkZW50aWZpZXJzIGRlc2NyaWJpbmcgZWFjaCBzY2FsYXIgb2YgdGhlIHBocmFzZSdzIHZlY3RvciBlbGVtZW50cy5cblx0ICogVHlwaWNhbGx5IG9mIHNpemUgPGNvZGU+ZGltZW5zaW9uPC9jb2RlPi5cblx0ICogQHByb3BlcnR5IHtTdHJpbmd9IGxhYmVsIC0gVGhlIHN0cmluZyBpZGVudGlmaWVyIG9mIHRoZSBjbGFzcyB0aGUgcGhyYXNlIGJlbG9uZ3MgdG8uXG5cdCAqIEBwcm9wZXJ0eSB7QXJyYXkuTnVtYmVyfSBkYXRhIC0gVGhlIHBocmFzZSdzIGRhdGEsIGNvbnRhaW5pbmcgYWxsIHRoZSB2ZWN0b3JzIGZsYXR0ZW5lZCBpbnRvIGEgc2luZ2xlIG9uZS5cblx0ICogT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgZmFsc2UuXG5cdCAqIEBwcm9wZXJ0eSB7QXJyYXkuTnVtYmVyfSBkYXRhX2lucHV0IC0gVGhlIHBocmFzZSdzIGRhdGEgd2hpY2ggd2lsbCBiZSB1c2VkIGZvciB0cmFpbmluZywgZmxhdHRlbmVkIGludG8gYSBzaW5nbGUgdmVjdG9yLlxuXHQgKiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlLlxuXHQgKiBAcHJvcGVydHkge0FycmF5Lk51bWJlcn0gZGF0YV9vdXRwdXQgLSBUaGUgcGhyYXNlJ3MgZGF0YSB3aGljaCB3aWxsIGJlIHVzZWQgZm9yIHJlZ3Jlc3Npb24sIGZsYXR0ZW5lZCBpbnRvIGEgc2luZ2xlIHZlY3Rvci5cblx0ICogT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cblx0ICogQHByb3BlcnR5IHtOdW1iZXJ9IGxlbmd0aCAtIFRoZSBsZW5ndGggb2YgdGhlIHBocmFzZSwgZS5nLiBvbmUgb2YgdGhlIGZvbGxvd2luZyA6XG5cdCAqIDxsaSBzdHlsZT1cImxpc3Qtc3R5bGUtdHlwZTogbm9uZTtcIj5cblx0ICogPHVsPjxjb2RlPmRhdGEubGVuZ3RoIC8gZGltZW5zaW9uPC9jb2RlPjwvdWw+XG5cdCAqIDx1bD48Y29kZT5kYXRhX2lucHV0Lmxlbmd0aCAvIGRpbWVuc2lvbl9pbnB1dDwvY29kZT48L3VsPlxuXHQgKiA8dWw+PGNvZGU+ZGF0YV9vdXRwdXQubGVuZ3RoIC8gZGltZW5zaW9uX291dHB1dDwvY29kZT48L3VsPlxuXHQgKiA8L2xpPlxuXHQgKi9cblxuXHQvKipcblx0ICogQSB2YWxpZCBYTU0gcGhyYXNlLCByZWFkeSB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIFhNTSBsaWJyYXJ5LlxuXHQgKiBAcmVhZG9ubHlcblx0ICogQHR5cGUge1htbVBocmFzZX1cblx0ICovXG5cdGdldCBwaHJhc2UoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGJpbW9kYWw6IHRoaXMuX2NvbmZpZy5iaW1vZGFsLFxuXHRcdFx0Y29sdW1uX25hbWVzOiB0aGlzLl9jb25maWcuY29sdW1uX25hbWVzLFxuXHRcdFx0ZGltZW5zaW9uOiB0aGlzLl9jb25maWcuZGltZW5zaW9uLFxuXHRcdFx0ZGltZW5zaW9uX2lucHV0OiB0aGlzLl9jb25maWcuZGltZW5zaW9uX2lucHV0LFxuXHRcdFx0bGFiZWw6IHRoaXMuX2NvbmZpZy5sYWJlbCxcblx0XHRcdGRhdGE6IHRoaXMuX2RhdGEuc2xpY2UoMCksXG5cdFx0XHRkYXRhX2lucHV0OiB0aGlzLl9kYXRhX2luLnNsaWNlKDApLFxuXHRcdFx0ZGF0YV9vdXRwdXQ6IHRoaXMuX2RhdGFfb3V0LnNsaWNlKDApLFxuXHRcdFx0bGVuZ3RoOiB0aGlzLl9jb25maWcuYmltb2RhbFxuXHRcdFx0XHRcdFx0P1x0dGhpcy5fZGF0YV9pbi5sZW5ndGggLyB0aGlzLl9jb25maWcuZGltZW5zaW9uX2lucHV0XG5cdFx0XHRcdFx0XHQ6IHRoaXMuX2RhdGEubGVuZ3RoIC8gdGhpcy5fY29uZmlnLmRpbWVuc2lvblxuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogQXBwZW5kIGFuIG9ic2VydmF0aW9uIHZlY3RvciB0byB0aGUgcGhyYXNlJ3MgZGF0YS4gTXVzdCBiZSBvZiBsZW5ndGggPGNvZGU+ZGltZW5zaW9uPC9jb2RlPi5cblx0ICogQHBhcmFtIHtBcnJheS5OdW1iZXJ9IG9icyAtIEFuIGlucHV0IHZlY3RvciwgYWthIG9ic2VydmF0aW9uLiBJZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlXG5cdCAqIEB0aHJvd3MgV2lsbCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgaW5wdXQgdmVjdG9yIGRvZXNuJ3QgbWF0Y2ggdGhlIGNvbmZpZy5cblx0ICovXG5cdGFkZE9ic2VydmF0aW9uKG9icykge1xuXHRcdC8vIHRvZG8gOiBhZGQgdGVzdHMgdGhhdCB0aHJvdyB0aGUgcmlnaHQgZXhjZXB0aW9uc1xuXHRcdFxuXHRcdGlmIChvYnMubGVuZ3RoICE9PSB0aGlzLl9jb25maWcuZGltZW5zaW9uIHx8XG5cdFx0XHRcdCh0eXBlb2Yob2JzKSA9PT0gJ251bWJlcicgJiYgdGhpcy5fY29uZmlnLmRpbWVuc2lvbiAhPT0gMSkpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXG5cdFx0XHRcdCdlcnJvciA6IGluY29taW5nIG9ic2VydmF0aW9uIGxlbmd0aCBub3QgbWF0Y2hpbmcgd2l0aCBkaW1lbnNpb25zJ1xuXHRcdFx0KTtcblx0XHRcdHRocm93ICdCYWRWZWN0b3JTaXplRXhjZXB0aW9uJztcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRmb3IgKGxldCB2YWwgb2Ygb2JzKSB7XG5cdFx0XHRpZiAodHlwZW9mKHZhbCkgIT09ICdudW1iZXInKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXG5cdFx0XHRcdFx0J2Vycm9yIDogb2JzZXJ2YXRpb24gdmFsdWVzIG11c3QgYWxsIGJlIG51bWJlcnMnXG5cdFx0XHRcdCk7XG5cdFx0XHRcdHRocm93ICdCYWREYXRhVHlwZUV4Y2VwdGlvbic7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAodGhpcy5fY29uZmlnLmJpbW9kYWwpIHtcblx0XHRcdHRoaXMuX2RhdGFfaW4gPSB0aGlzLl9kYXRhX2luLmNvbmNhdChcblx0XHRcdFx0b2JzLnNsaWNlKDAsIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25faW5wdXQpXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5fZGF0YV9vdXQgPSB0aGlzLl9kYXRhX291dC5jb25jYXQoXG5cdFx0XHRcdG9icy5zbGljZSh0aGlzLl9jb25maWcuZGltZW5zaW9uX2lucHV0KVxuXHRcdFx0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkob2JzKSkge1xuXHRcdFx0XHR0aGlzLl9kYXRhID0gdGhpcy5fZGF0YS5jb25jYXQob2JzKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuX2RhdGEucHVzaChvYnMpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDbGVhciB0aGUgcGhyYXNlJ3MgZGF0YSBzbyB0aGF0IGEgbmV3IG9uZSBpcyByZWFkeSB0byBiZSByZWNvcmRlZC5cblx0ICovXG5cdHJlc2V0KCkge1xuXHRcdHRoaXMuX2RhdGEgPSBbXTtcblx0XHR0aGlzLl9kYXRhX2luID0gW107XG5cdFx0dGhpcy5fZGF0YV9vdXQgPSBbXTtcblx0fVxuXG5cdC8qKiBAcHJpdmF0ZSAqL1xuXHRfc2V0Q29uZmlnKG9wdGlvbnMgPSB7fSkge1xuXHRcdGZvciAobGV0IHByb3AgaW4gb3B0aW9ucykge1xuXHRcdFx0aWYgKHByb3AgPT09ICdiaW1vZGFsJyAmJiB0eXBlb2Yob3B0aW9uc1twcm9wXSkgPT09ICdib29sZWFuJykge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuXHRcdFx0fSBlbHNlIGlmIChwcm9wID09PSAnZGltZW5zaW9uJyAmJiBOdW1iZXIuaXNJbnRlZ2VyKG9wdGlvbnNbcHJvcF0pKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG5cdFx0XHR9IGVsc2UgaWYgKHByb3AgPT09ICdkaW1lbnNpb25faW5wdXQnICYmIE51bWJlci5pc0ludGVnZXIob3B0aW9uc1twcm9wXSkpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcblx0XHRcdH0gZWxzZSBpZiAocHJvcCA9PT0gJ2NvbHVtbl9uYW1lcycgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zW3Byb3BdKSkge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdLnNsaWNlKDApO1xuXHRcdFx0fSBlbHNlIGlmIChwcm9wID09PSAnbGFiZWwnICYmIHR5cGVvZihvcHRpb25zW3Byb3BdKSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcblx0XHRcdH1cblx0XHR9XHRcdFxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQaHJhc2VNYWtlcjsiXX0=