'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

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
 */

var PhraseMaker = function () {
	/**
  * @typedef {Object} XmmPhraseConfig
  * @property {Boolean} bimodal - Indicates wether phrase data should be considered bimodal.
  * If true, the {@link XmmPhraseConfig#dimension_input} property will be taken into account.
  * @property {Number} dimension - Size of a phrase's vector element.
  * @property {Number} dimension_input - Size of the part of an input vector element that should be used for training.
  * This implies that the rest of the vector (of size <emph>dimension - dimension_input</emph>)
  * will be used for regression. Only taken into account if {@link XmmPhraseConfig#bimodal} is true.
  * @property {Array.String} column_names - Array of string identifiers describing each scalar of the phrase's vector elements.
  * Typically of size {@link XmmPhraseConfig#dimension}.
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
   * Append an observation vector to the phrase's data. Must be of length {@link XmmPhraseConfig#dimension}.
   * @param {Array.Number} obs - An input vector, aka observation. If {XmmPhraseConfig#bimodal} is true
   * @throws Will throw an error if the input vector doesn't match the config.
   */
		value: function addObservation(obs) {
			if (obs.length !== this._config.dimension || typeof obs === 'number' && this._config.dimension !== 1) {
				console.error('error : incoming observation length not matching with dimensions');
				throw 'BadVectorSizeException';
				return;
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
   * @typedef {Object} XmmPhrase
   * @property {Boolean} bimodal - Indicates wether phrase data should be considered bimodal.
   * If true, the {@link XmmPhrase#dimension_input} property will be taken into account.
   * @property {Number} dimension - Size of a phrase's vector element.
   * @property {Number} dimension_input - Size of the part of an input vector element that should be used for training.
   * This implies that the rest of the vector (of size dimension - dimension_input)
   * will be used for regression. Only taken into account if {@link XmmPhraseConfig#bimodal} is true.
   * @property {Array.String} column_names - Array of string identifiers describing each scalar of the phrase's vector elements.
   * Typically of size {@link XmmPhraseConfig#dimension}.
   * @property {String} label - The string identifier of the class the phrase belongs to.
   * @property {Array.Number} - The phrase's data, containing all the vectors flattened into a single one.
   * Only taken into account if {@link XmmPhraseConfig#bimodal} is false.
   * @property {Array.Number} data_input - The phrase's data which will be used for training, flattened into a single vector.
   * Only taken into account if {@link XmmPhraseConfig#bimodal} is true.
   * @property {Array.Number} data_output - The phrase's data which will be used for regression, flattened into a single vector.
   * Only taken into account if {@link XmmPhraseConfig#bimodal} is true.
   * @property {Number} length - The length of the phrase, e.g. one of the following :
   * <li>
   * <ul><pre><code>data.length / {@link XmmPhrase#dimension}</code></pre></ul>
   * <ul><pre><code>data_input.length / {@link XmmPhrase#dimension_input}</code></pre></ul>
   * <ul><pre><code>data_output.length / {@link XmmPhrase#dimension_output}</code></pre></ul>
   * </li>
   */

		/**
   * An XMM valid phrase, ready to be processed by the library
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
//# sourceMappingURL=data:application/json;base64,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QWIsSUFBcUIsUUFBUSxJQUFSLENBQXJCO0FBQ0E7QUFDRDtBQUNEOzs7c0JBNUdZO0FBQ1osVUFBTyxLQUFLLE9BQVo7QUFDQSxHO3NCQUV3QjtBQUFBLE9BQWQsT0FBYyx5REFBSixFQUFJOztBQUN4QixRQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDQTs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlCQTs7Ozs7OztzQkFJYTtBQUNaLFVBQU87QUFDTixhQUFTLEtBQUssT0FBTCxDQUFhLE9BRGhCO0FBRU4sa0JBQWMsS0FBSyxPQUFMLENBQWEsWUFGckI7QUFHTixlQUFXLEtBQUssT0FBTCxDQUFhLFNBSGxCO0FBSU4scUJBQWlCLEtBQUssT0FBTCxDQUFhLGVBSnhCO0FBS04sV0FBTyxLQUFLLE9BQUwsQ0FBYSxLQUxkO0FBTU4sVUFBTSxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLENBQWpCLENBTkE7QUFPTixnQkFBWSxLQUFLLFFBQUwsQ0FBYyxLQUFkLENBQW9CLENBQXBCLENBUE47QUFRTixpQkFBYSxLQUFLLFNBQUwsQ0FBZSxLQUFmLENBQXFCLENBQXJCLENBUlA7QUFTTixZQUFRLEtBQUssT0FBTCxDQUFhLE9BQWIsR0FDSCxLQUFLLFFBQUwsQ0FBYyxNQUFkLEdBQXVCLEtBQUssT0FBTCxDQUFhLGVBRGpDLEdBRUgsS0FBSyxLQUFMLENBQVcsTUFBWCxHQUFvQixLQUFLLE9BQUwsQ0FBYTtBQVhoQyxJQUFQO0FBYUE7Ozs7O0FBMEREOztrQkFFYyxXIiwiZmlsZSI6InhtbS1waHJhc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFhNTSBjb21wYXRpYmxlIHBocmFzZSBidWlsZGVyIHV0aWxpdHkgPGJyIC8+XG4gKiBDbGFzcyB0byBlYXNlIHRoZSBjcmVhdGlvbiBvZiBYTU0gY29tcGF0aWJsZSBkYXRhIHJlY29yZGluZ3MsIGFrYSBwaHJhc2VzLiA8YnIgLz5cbiAqIFBocmFzZXMgYXJlIHR5cGljYWxseSBhcnJheXMgKGZsYXR0ZW5lZCBtYXRyaWNlcykgb2Ygc2l6ZSBOICogTSxcbiAqIE4gYmVpbmcgdGhlIHNpemUgb2YgYSB2ZWN0b3IgZWxlbWVudCwgYW5kIE0gdGhlIGxlbmd0aCBvZiB0aGUgcGhyYXNlIGl0c2VsZixcbiAqIHdyYXBwZWQgdG9nZXRoZXIgaW4gYW4gb2JqZWN0IHdpdGggYSBmZXcgc2V0dGluZ3MuXG4gKi9cblxuY2xhc3MgUGhyYXNlTWFrZXIge1xuXHQvKipcblx0ICogQHR5cGVkZWYge09iamVjdH0gWG1tUGhyYXNlQ29uZmlnXG5cdCAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gYmltb2RhbCAtIEluZGljYXRlcyB3ZXRoZXIgcGhyYXNlIGRhdGEgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYmltb2RhbC5cblx0ICogSWYgdHJ1ZSwgdGhlIHtAbGluayBYbW1QaHJhc2VDb25maWcjZGltZW5zaW9uX2lucHV0fSBwcm9wZXJ0eSB3aWxsIGJlIHRha2VuIGludG8gYWNjb3VudC5cblx0ICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbiAtIFNpemUgb2YgYSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudC5cblx0ICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbl9pbnB1dCAtIFNpemUgb2YgdGhlIHBhcnQgb2YgYW4gaW5wdXQgdmVjdG9yIGVsZW1lbnQgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdHJhaW5pbmcuXG5cdCAqIFRoaXMgaW1wbGllcyB0aGF0IHRoZSByZXN0IG9mIHRoZSB2ZWN0b3IgKG9mIHNpemUgPGVtcGg+ZGltZW5zaW9uIC0gZGltZW5zaW9uX2lucHV0PC9lbXBoPilcblx0ICogd2lsbCBiZSB1c2VkIGZvciByZWdyZXNzaW9uLiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiB7QGxpbmsgWG1tUGhyYXNlQ29uZmlnI2JpbW9kYWx9IGlzIHRydWUuXG5cdCAqIEBwcm9wZXJ0eSB7QXJyYXkuU3RyaW5nfSBjb2x1bW5fbmFtZXMgLSBBcnJheSBvZiBzdHJpbmcgaWRlbnRpZmllcnMgZGVzY3JpYmluZyBlYWNoIHNjYWxhciBvZiB0aGUgcGhyYXNlJ3MgdmVjdG9yIGVsZW1lbnRzLlxuXHQgKiBUeXBpY2FsbHkgb2Ygc2l6ZSB7QGxpbmsgWG1tUGhyYXNlQ29uZmlnI2RpbWVuc2lvbn0uXG5cdCAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBsYWJlbCAtIFRoZSBzdHJpbmcgaWRlbnRpZmllciBvZiB0aGUgY2xhc3MgdGhlIHBocmFzZSBiZWxvbmdzIHRvLlxuXHQgKi9cblxuXHQvKipcblx0ICogQHBhcmFtIHtYbW1QaHJhc2VDb25maWd9IG9wdGlvbnMgLSBEZWZhdWx0IHBocmFzZSBjb25maWd1cmF0aW9uLlxuXHQgKiBAc2VlIHtAbGluayBjb25maWd9LlxuXHQgKi9cblx0Y29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG5cdFx0Y29uc3QgZGVmYXVsdHMgPSB7XG5cdFx0XHRiaW1vZGFsOiBmYWxzZSxcblx0XHRcdGRpbWVuc2lvbjogMSxcblx0XHRcdGRpbWVuc2lvbl9pbnB1dDogMCxcblx0XHRcdGNvbHVtbl9uYW1lczogWycnXSxcblx0XHRcdGxhYmVsOiAnJ1xuXHRcdH1cblx0XHRPYmplY3QuYXNzaWduKGRlZmF1bHRzLCBvcHRpb25zKTtcblx0XHR0aGlzLl9jb25maWcgPSB7fTtcblx0XHR0aGlzLl9zZXRDb25maWcob3B0aW9ucyk7XG5cblx0XHR0aGlzLnJlc2V0KCk7XG5cdH1cblxuXHQvKipcblx0ICogWE1NIHBocmFzZSBjb25maWd1cmF0aW9uIG9iamVjdC5cblx0ICogT25seSBsZWdhbCBmaWVsZHMgd2lsbCBiZSBjaGVja2VkIGJlZm9yZSBiZWluZyBhZGRlZCB0byB0aGUgY29uZmlnLCBvdGhlcnMgd2lsbCBiZSBpZ25vcmVkXG5cdCAqIEB0eXBlIHtYbW1QaHJhc2VDb25maWd9XG5cdCAqL1xuXHRnZXQgY29uZmlnKCkge1xuXHRcdHJldHVybiB0aGlzLl9jb25maWc7XG5cdH1cblxuXHRzZXQgY29uZmlnKG9wdGlvbnMgPSB7fSkge1xuXHRcdHRoaXMuX3NldENvbmZpZyhvcHRpb25zKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAdHlwZWRlZiB7T2JqZWN0fSBYbW1QaHJhc2Vcblx0ICogQHByb3BlcnR5IHtCb29sZWFufSBiaW1vZGFsIC0gSW5kaWNhdGVzIHdldGhlciBwaHJhc2UgZGF0YSBzaG91bGQgYmUgY29uc2lkZXJlZCBiaW1vZGFsLlxuXHQgKiBJZiB0cnVlLCB0aGUge0BsaW5rIFhtbVBocmFzZSNkaW1lbnNpb25faW5wdXR9IHByb3BlcnR5IHdpbGwgYmUgdGFrZW4gaW50byBhY2NvdW50LlxuXHQgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uIC0gU2l6ZSBvZiBhIHBocmFzZSdzIHZlY3RvciBlbGVtZW50LlxuXHQgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uX2lucHV0IC0gU2l6ZSBvZiB0aGUgcGFydCBvZiBhbiBpbnB1dCB2ZWN0b3IgZWxlbWVudCB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0cmFpbmluZy5cblx0ICogVGhpcyBpbXBsaWVzIHRoYXQgdGhlIHJlc3Qgb2YgdGhlIHZlY3RvciAob2Ygc2l6ZSBkaW1lbnNpb24gLSBkaW1lbnNpb25faW5wdXQpXG5cdCAqIHdpbGwgYmUgdXNlZCBmb3IgcmVncmVzc2lvbi4gT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYge0BsaW5rIFhtbVBocmFzZUNvbmZpZyNiaW1vZGFsfSBpcyB0cnVlLlxuXHQgKiBAcHJvcGVydHkge0FycmF5LlN0cmluZ30gY29sdW1uX25hbWVzIC0gQXJyYXkgb2Ygc3RyaW5nIGlkZW50aWZpZXJzIGRlc2NyaWJpbmcgZWFjaCBzY2FsYXIgb2YgdGhlIHBocmFzZSdzIHZlY3RvciBlbGVtZW50cy5cblx0ICogVHlwaWNhbGx5IG9mIHNpemUge0BsaW5rIFhtbVBocmFzZUNvbmZpZyNkaW1lbnNpb259LlxuXHQgKiBAcHJvcGVydHkge1N0cmluZ30gbGFiZWwgLSBUaGUgc3RyaW5nIGlkZW50aWZpZXIgb2YgdGhlIGNsYXNzIHRoZSBwaHJhc2UgYmVsb25ncyB0by5cblx0ICogQHByb3BlcnR5IHtBcnJheS5OdW1iZXJ9IC0gVGhlIHBocmFzZSdzIGRhdGEsIGNvbnRhaW5pbmcgYWxsIHRoZSB2ZWN0b3JzIGZsYXR0ZW5lZCBpbnRvIGEgc2luZ2xlIG9uZS5cblx0ICogT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYge0BsaW5rIFhtbVBocmFzZUNvbmZpZyNiaW1vZGFsfSBpcyBmYWxzZS5cblx0ICogQHByb3BlcnR5IHtBcnJheS5OdW1iZXJ9IGRhdGFfaW5wdXQgLSBUaGUgcGhyYXNlJ3MgZGF0YSB3aGljaCB3aWxsIGJlIHVzZWQgZm9yIHRyYWluaW5nLCBmbGF0dGVuZWQgaW50byBhIHNpbmdsZSB2ZWN0b3IuXG5cdCAqIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIHtAbGluayBYbW1QaHJhc2VDb25maWcjYmltb2RhbH0gaXMgdHJ1ZS5cblx0ICogQHByb3BlcnR5IHtBcnJheS5OdW1iZXJ9IGRhdGFfb3V0cHV0IC0gVGhlIHBocmFzZSdzIGRhdGEgd2hpY2ggd2lsbCBiZSB1c2VkIGZvciByZWdyZXNzaW9uLCBmbGF0dGVuZWQgaW50byBhIHNpbmdsZSB2ZWN0b3IuXG5cdCAqIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIHtAbGluayBYbW1QaHJhc2VDb25maWcjYmltb2RhbH0gaXMgdHJ1ZS5cblx0ICogQHByb3BlcnR5IHtOdW1iZXJ9IGxlbmd0aCAtIFRoZSBsZW5ndGggb2YgdGhlIHBocmFzZSwgZS5nLiBvbmUgb2YgdGhlIGZvbGxvd2luZyA6XG5cdCAqIDxsaT5cblx0ICogPHVsPjxwcmU+PGNvZGU+ZGF0YS5sZW5ndGggLyB7QGxpbmsgWG1tUGhyYXNlI2RpbWVuc2lvbn08L2NvZGU+PC9wcmU+PC91bD5cblx0ICogPHVsPjxwcmU+PGNvZGU+ZGF0YV9pbnB1dC5sZW5ndGggLyB7QGxpbmsgWG1tUGhyYXNlI2RpbWVuc2lvbl9pbnB1dH08L2NvZGU+PC9wcmU+PC91bD5cblx0ICogPHVsPjxwcmU+PGNvZGU+ZGF0YV9vdXRwdXQubGVuZ3RoIC8ge0BsaW5rIFhtbVBocmFzZSNkaW1lbnNpb25fb3V0cHV0fTwvY29kZT48L3ByZT48L3VsPlxuXHQgKiA8L2xpPlxuXHQgKi9cblxuXHQvKipcblx0ICogQW4gWE1NIHZhbGlkIHBocmFzZSwgcmVhZHkgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBsaWJyYXJ5XG5cdCAqIEB0eXBlIHtYbW1QaHJhc2V9XG5cdCAqL1xuXHRnZXQgcGhyYXNlKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRiaW1vZGFsOiB0aGlzLl9jb25maWcuYmltb2RhbCxcblx0XHRcdGNvbHVtbl9uYW1lczogdGhpcy5fY29uZmlnLmNvbHVtbl9uYW1lcyxcblx0XHRcdGRpbWVuc2lvbjogdGhpcy5fY29uZmlnLmRpbWVuc2lvbixcblx0XHRcdGRpbWVuc2lvbl9pbnB1dDogdGhpcy5fY29uZmlnLmRpbWVuc2lvbl9pbnB1dCxcblx0XHRcdGxhYmVsOiB0aGlzLl9jb25maWcubGFiZWwsXG5cdFx0XHRkYXRhOiB0aGlzLl9kYXRhLnNsaWNlKDApLFxuXHRcdFx0ZGF0YV9pbnB1dDogdGhpcy5fZGF0YV9pbi5zbGljZSgwKSxcblx0XHRcdGRhdGFfb3V0cHV0OiB0aGlzLl9kYXRhX291dC5zbGljZSgwKSxcblx0XHRcdGxlbmd0aDogdGhpcy5fY29uZmlnLmJpbW9kYWxcblx0XHRcdFx0XHRcdD9cdHRoaXMuX2RhdGFfaW4ubGVuZ3RoIC8gdGhpcy5fY29uZmlnLmRpbWVuc2lvbl9pbnB1dFxuXHRcdFx0XHRcdFx0OiB0aGlzLl9kYXRhLmxlbmd0aCAvIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25cblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIEFwcGVuZCBhbiBvYnNlcnZhdGlvbiB2ZWN0b3IgdG8gdGhlIHBocmFzZSdzIGRhdGEuIE11c3QgYmUgb2YgbGVuZ3RoIHtAbGluayBYbW1QaHJhc2VDb25maWcjZGltZW5zaW9ufS5cblx0ICogQHBhcmFtIHtBcnJheS5OdW1iZXJ9IG9icyAtIEFuIGlucHV0IHZlY3RvciwgYWthIG9ic2VydmF0aW9uLiBJZiB7WG1tUGhyYXNlQ29uZmlnI2JpbW9kYWx9IGlzIHRydWVcblx0ICogQHRocm93cyBXaWxsIHRocm93IGFuIGVycm9yIGlmIHRoZSBpbnB1dCB2ZWN0b3IgZG9lc24ndCBtYXRjaCB0aGUgY29uZmlnLlxuXHQgKi9cblx0YWRkT2JzZXJ2YXRpb24ob2JzKSB7XG5cdFx0aWYgKG9icy5sZW5ndGggIT09IHRoaXMuX2NvbmZpZy5kaW1lbnNpb24gfHxcblx0XHRcdFx0KHR5cGVvZihvYnMpID09PSAnbnVtYmVyJyAmJiB0aGlzLl9jb25maWcuZGltZW5zaW9uICE9PSAxKSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcblx0XHRcdFx0J2Vycm9yIDogaW5jb21pbmcgb2JzZXJ2YXRpb24gbGVuZ3RoIG5vdCBtYXRjaGluZyB3aXRoIGRpbWVuc2lvbnMnXG5cdFx0XHQpO1xuXHRcdFx0dGhyb3cgJ0JhZFZlY3RvclNpemVFeGNlcHRpb24nO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLl9jb25maWcuYmltb2RhbCkge1xuXHRcdFx0dGhpcy5fZGF0YV9pbiA9IHRoaXMuX2RhdGFfaW4uY29uY2F0KFxuXHRcdFx0XHRvYnMuc2xpY2UoMCwgdGhpcy5fY29uZmlnLmRpbWVuc2lvbl9pbnB1dClcblx0XHRcdCk7XG5cdFx0XHR0aGlzLl9kYXRhX291dCA9IHRoaXMuX2RhdGFfb3V0LmNvbmNhdChcblx0XHRcdFx0b2JzLnNsaWNlKHRoaXMuX2NvbmZpZy5kaW1lbnNpb25faW5wdXQpXG5cdFx0XHQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheShvYnMpKSB7XG5cdFx0XHRcdHRoaXMuX2RhdGEgPSB0aGlzLl9kYXRhLmNvbmNhdChvYnMpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5fZGF0YS5wdXNoKG9icyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIENsZWFyIHRoZSBwaHJhc2UncyBkYXRhIHNvIHRoYXQgYSBuZXcgb25lIGlzIHJlYWR5IHRvIGJlIHJlY29yZGVkLlxuXHQgKi9cblx0cmVzZXQoKSB7XG5cdFx0dGhpcy5fZGF0YSA9IFtdO1xuXHRcdHRoaXMuX2RhdGFfaW4gPSBbXTtcblx0XHR0aGlzLl9kYXRhX291dCA9IFtdO1xuXHR9XG5cblx0LyoqIEBwcml2YXRlICovXG5cdF9zZXRDb25maWcob3B0aW9ucyA9IHt9KSB7XG5cdFx0Zm9yIChsZXQgcHJvcCBpbiBvcHRpb25zKSB7XG5cdFx0XHRpZiAocHJvcCA9PT0gJ2JpbW9kYWwnICYmIHR5cGVvZihvcHRpb25zW3Byb3BdKSA9PT0gJ2Jvb2xlYW4nKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG5cdFx0XHR9IGVsc2UgaWYgKHByb3AgPT09ICdkaW1lbnNpb24nICYmIE51bWJlci5pc0ludGVnZXIob3B0aW9uc1twcm9wXSkpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcblx0XHRcdH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbl9pbnB1dCcgJiYgTnVtYmVyLmlzSW50ZWdlcihvcHRpb25zW3Byb3BdKSkge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuXHRcdFx0fSBlbHNlIGlmIChwcm9wID09PSAnY29sdW1uX25hbWVzJyAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnNbcHJvcF0pKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF0uc2xpY2UoMCk7XG5cdFx0XHR9IGVsc2UgaWYgKHByb3AgPT09ICdsYWJlbCcgJiYgdHlwZW9mKG9wdGlvbnNbcHJvcF0pID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuXHRcdFx0fVxuXHRcdH1cdFx0XG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFBocmFzZU1ha2VyOyJdfQ==