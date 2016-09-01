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
//# sourceMappingURL=data:application/json;base64,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YSxJQUFiLElBQXFCLFFBQVEsSUFBUixDQUFyQjtBQUNBO0FBQ0Q7QUFDRDs7O3NCQS9HWTtBQUNaLFVBQU8sS0FBSyxPQUFaO0FBQ0EsRztzQkFFd0I7QUFBQSxPQUFkLE9BQWMseURBQUosRUFBSTs7QUFDeEIsUUFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0E7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0QkE7Ozs7Ozs7c0JBSWE7QUFDWixVQUFPO0FBQ04sYUFBUyxLQUFLLE9BQUwsQ0FBYSxPQURoQjtBQUVOLGtCQUFjLEtBQUssT0FBTCxDQUFhLFlBRnJCO0FBR04sZUFBVyxLQUFLLE9BQUwsQ0FBYSxTQUhsQjtBQUlOLHFCQUFpQixLQUFLLE9BQUwsQ0FBYSxlQUp4QjtBQUtOLFdBQU8sS0FBSyxPQUFMLENBQWEsS0FMZDtBQU1OLFVBQU0sS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixDQUFqQixDQU5BO0FBT04sZ0JBQVksS0FBSyxRQUFMLENBQWMsS0FBZCxDQUFvQixDQUFwQixDQVBOO0FBUU4saUJBQWEsS0FBSyxTQUFMLENBQWUsS0FBZixDQUFxQixDQUFyQixDQVJQO0FBU04sWUFBUSxLQUFLLE9BQUwsQ0FBYSxPQUFiLEdBQ0gsS0FBSyxRQUFMLENBQWMsTUFBZCxHQUF1QixLQUFLLE9BQUwsQ0FBYSxlQURqQyxHQUVILEtBQUssS0FBTCxDQUFXLE1BQVgsR0FBb0IsS0FBSyxPQUFMLENBQWE7QUFYaEMsSUFBUDtBQWFBOzs7OztBQTBERDs7a0JBRWMsVyIsImZpbGUiOiJ4bW0tcGhyYXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBYTU0gY29tcGF0aWJsZSBwaHJhc2UgYnVpbGRlciB1dGlsaXR5IDxiciAvPlxuICogQ2xhc3MgdG8gZWFzZSB0aGUgY3JlYXRpb24gb2YgWE1NIGNvbXBhdGlibGUgZGF0YSByZWNvcmRpbmdzLCBha2EgcGhyYXNlcy4gPGJyIC8+XG4gKiBQaHJhc2VzIGFyZSB0eXBpY2FsbHkgYXJyYXlzIChmbGF0dGVuZWQgbWF0cmljZXMpIG9mIHNpemUgTiAqIE0sXG4gKiBOIGJlaW5nIHRoZSBzaXplIG9mIGEgdmVjdG9yIGVsZW1lbnQsIGFuZCBNIHRoZSBsZW5ndGggb2YgdGhlIHBocmFzZSBpdHNlbGYsXG4gKiB3cmFwcGVkIHRvZ2V0aGVyIGluIGFuIG9iamVjdCB3aXRoIGEgZmV3IHNldHRpbmdzLlxuICovXG5cbmNsYXNzIFBocmFzZU1ha2VyIHtcblx0LyoqXG5cdCAqIFhNTSBwaHJhc2UgY29uZmlndXJhdGlvbiBvYmplY3QuXG5cdCAqIEB0eXBlZGVmIFhtbVBocmFzZUNvbmZpZ1xuXHQgKiBAdHlwZSB7T2JqZWN0fVxuXHQgKiBAbmFtZSBYbW1QaHJhc2VDb25maWdcblx0ICogQHByb3BlcnR5IHtCb29sZWFufSBiaW1vZGFsIC0gSW5kaWNhdGVzIHdldGhlciBwaHJhc2UgZGF0YSBzaG91bGQgYmUgY29uc2lkZXJlZCBiaW1vZGFsLlxuXHQgKiBJZiB0cnVlLCB0aGUgPGNvZGU+ZGltZW5zaW9uX2lucHV0PC9jb2RlPiBwcm9wZXJ0eSB3aWxsIGJlIHRha2VuIGludG8gYWNjb3VudC5cblx0ICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbiAtIFNpemUgb2YgYSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudC5cblx0ICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbl9pbnB1dCAtIFNpemUgb2YgdGhlIHBhcnQgb2YgYW4gaW5wdXQgdmVjdG9yIGVsZW1lbnQgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdHJhaW5pbmcuXG5cdCAqIFRoaXMgaW1wbGllcyB0aGF0IHRoZSByZXN0IG9mIHRoZSB2ZWN0b3IgKG9mIHNpemUgPGNvZGU+ZGltZW5zaW9uIC0gZGltZW5zaW9uX2lucHV0PC9jb2RlPilcblx0ICogd2lsbCBiZSB1c2VkIGZvciByZWdyZXNzaW9uLiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlLlxuXHQgKiBAcHJvcGVydHkge0FycmF5LlN0cmluZ30gY29sdW1uX25hbWVzIC0gQXJyYXkgb2Ygc3RyaW5nIGlkZW50aWZpZXJzIGRlc2NyaWJpbmcgZWFjaCBzY2FsYXIgb2YgdGhlIHBocmFzZSdzIHZlY3RvciBlbGVtZW50cy5cblx0ICogVHlwaWNhbGx5IG9mIHNpemUgPGNvZGU+ZGltZW5zaW9uPC9jb2RlPi5cblx0ICogQHByb3BlcnR5IHtTdHJpbmd9IGxhYmVsIC0gVGhlIHN0cmluZyBpZGVudGlmaWVyIG9mIHRoZSBjbGFzcyB0aGUgcGhyYXNlIGJlbG9uZ3MgdG8uXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge1htbVBocmFzZUNvbmZpZ30gb3B0aW9ucyAtIERlZmF1bHQgcGhyYXNlIGNvbmZpZ3VyYXRpb24uXG5cdCAqIEBzZWUge0BsaW5rIGNvbmZpZ30uXG5cdCAqL1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcblx0XHRjb25zdCBkZWZhdWx0cyA9IHtcblx0XHRcdGJpbW9kYWw6IGZhbHNlLFxuXHRcdFx0ZGltZW5zaW9uOiAxLFxuXHRcdFx0ZGltZW5zaW9uX2lucHV0OiAwLFxuXHRcdFx0Y29sdW1uX25hbWVzOiBbJyddLFxuXHRcdFx0bGFiZWw6ICcnXG5cdFx0fVxuXHRcdE9iamVjdC5hc3NpZ24oZGVmYXVsdHMsIG9wdGlvbnMpO1xuXHRcdHRoaXMuX2NvbmZpZyA9IHt9O1xuXHRcdHRoaXMuX3NldENvbmZpZyhvcHRpb25zKTtcblxuXHRcdHRoaXMucmVzZXQoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBYTU0gcGhyYXNlIGNvbmZpZ3VyYXRpb24gb2JqZWN0LlxuXHQgKiBPbmx5IGxlZ2FsIGZpZWxkcyB3aWxsIGJlIGNoZWNrZWQgYmVmb3JlIGJlaW5nIGFkZGVkIHRvIHRoZSBjb25maWcsIG90aGVycyB3aWxsIGJlIGlnbm9yZWRcblx0ICogQHR5cGUge1htbVBocmFzZUNvbmZpZ31cblx0ICovXG5cdGdldCBjb25maWcoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2NvbmZpZztcblx0fVxuXG5cdHNldCBjb25maWcob3B0aW9ucyA9IHt9KSB7XG5cdFx0dGhpcy5fc2V0Q29uZmlnKG9wdGlvbnMpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEEgcmVndWxhciBYTU0gcGhyYXNlLCByZWFkeSB0byBiZSB1c2VkIGJ5IHRoZSBsaWJyYXJ5LlxuXHQgKiBAdHlwZWRlZiBYbW1QaHJhc2Vcblx0ICogQHR5cGUge09iamVjdH1cblx0ICogQG5hbWUgWG1tUGhyYXNlXG5cdCAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gYmltb2RhbCAtIEluZGljYXRlcyB3ZXRoZXIgcGhyYXNlIGRhdGEgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYmltb2RhbC5cblx0ICogSWYgdHJ1ZSwgdGhlIDxjb2RlPmRpbWVuc2lvbl9pbnB1dDwvY29kZT4gcHJvcGVydHkgd2lsbCBiZSB0YWtlbiBpbnRvIGFjY291bnQuXG5cdCAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkaW1lbnNpb24gLSBTaXplIG9mIGEgcGhyYXNlJ3MgdmVjdG9yIGVsZW1lbnQuXG5cdCAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkaW1lbnNpb25faW5wdXQgLSBTaXplIG9mIHRoZSBwYXJ0IG9mIGFuIGlucHV0IHZlY3RvciBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRyYWluaW5nLlxuXHQgKiBUaGlzIGltcGxpZXMgdGhhdCB0aGUgcmVzdCBvZiB0aGUgdmVjdG9yIChvZiBzaXplIDxjb2RlPmRpbWVuc2lvbiAtIGRpbWVuc2lvbl9pbnB1dDwvY29kZT4pXG5cdCAqIHdpbGwgYmUgdXNlZCBmb3IgcmVncmVzc2lvbi4gT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cblx0ICogQHByb3BlcnR5IHtBcnJheS5TdHJpbmd9IGNvbHVtbl9uYW1lcyAtIEFycmF5IG9mIHN0cmluZyBpZGVudGlmaWVycyBkZXNjcmliaW5nIGVhY2ggc2NhbGFyIG9mIHRoZSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudHMuXG5cdCAqIFR5cGljYWxseSBvZiBzaXplIDxjb2RlPmRpbWVuc2lvbjwvY29kZT4uXG5cdCAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBsYWJlbCAtIFRoZSBzdHJpbmcgaWRlbnRpZmllciBvZiB0aGUgY2xhc3MgdGhlIHBocmFzZSBiZWxvbmdzIHRvLlxuXHQgKiBAcHJvcGVydHkge0FycmF5Lk51bWJlcn0gZGF0YSAtIFRoZSBwaHJhc2UncyBkYXRhLCBjb250YWluaW5nIGFsbCB0aGUgdmVjdG9ycyBmbGF0dGVuZWQgaW50byBhIHNpbmdsZSBvbmUuXG5cdCAqIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIGZhbHNlLlxuXHQgKiBAcHJvcGVydHkge0FycmF5Lk51bWJlcn0gZGF0YV9pbnB1dCAtIFRoZSBwaHJhc2UncyBkYXRhIHdoaWNoIHdpbGwgYmUgdXNlZCBmb3IgdHJhaW5pbmcsIGZsYXR0ZW5lZCBpbnRvIGEgc2luZ2xlIHZlY3Rvci5cblx0ICogT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cblx0ICogQHByb3BlcnR5IHtBcnJheS5OdW1iZXJ9IGRhdGFfb3V0cHV0IC0gVGhlIHBocmFzZSdzIGRhdGEgd2hpY2ggd2lsbCBiZSB1c2VkIGZvciByZWdyZXNzaW9uLCBmbGF0dGVuZWQgaW50byBhIHNpbmdsZSB2ZWN0b3IuXG5cdCAqIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIHRydWUuXG5cdCAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBsZW5ndGggLSBUaGUgbGVuZ3RoIG9mIHRoZSBwaHJhc2UsIGUuZy4gb25lIG9mIHRoZSBmb2xsb3dpbmcgOlxuXHQgKiA8bGkgc3R5bGU9XCJsaXN0LXN0eWxlLXR5cGU6IG5vbmU7XCI+XG5cdCAqIDx1bD48Y29kZT5kYXRhLmxlbmd0aCAvIGRpbWVuc2lvbjwvY29kZT48L3VsPlxuXHQgKiA8dWw+PGNvZGU+ZGF0YV9pbnB1dC5sZW5ndGggLyBkaW1lbnNpb25faW5wdXQ8L2NvZGU+PC91bD5cblx0ICogPHVsPjxjb2RlPmRhdGFfb3V0cHV0Lmxlbmd0aCAvIGRpbWVuc2lvbl9vdXRwdXQ8L2NvZGU+PC91bD5cblx0ICogPC9saT5cblx0ICovXG5cblx0LyoqXG5cdCAqIEFuIFhNTSB2YWxpZCBwaHJhc2UsIHJlYWR5IHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgbGlicmFyeVxuXHQgKiBAdHlwZSB7WG1tUGhyYXNlfVxuXHQgKi9cblx0Z2V0IHBocmFzZSgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Ymltb2RhbDogdGhpcy5fY29uZmlnLmJpbW9kYWwsXG5cdFx0XHRjb2x1bW5fbmFtZXM6IHRoaXMuX2NvbmZpZy5jb2x1bW5fbmFtZXMsXG5cdFx0XHRkaW1lbnNpb246IHRoaXMuX2NvbmZpZy5kaW1lbnNpb24sXG5cdFx0XHRkaW1lbnNpb25faW5wdXQ6IHRoaXMuX2NvbmZpZy5kaW1lbnNpb25faW5wdXQsXG5cdFx0XHRsYWJlbDogdGhpcy5fY29uZmlnLmxhYmVsLFxuXHRcdFx0ZGF0YTogdGhpcy5fZGF0YS5zbGljZSgwKSxcblx0XHRcdGRhdGFfaW5wdXQ6IHRoaXMuX2RhdGFfaW4uc2xpY2UoMCksXG5cdFx0XHRkYXRhX291dHB1dDogdGhpcy5fZGF0YV9vdXQuc2xpY2UoMCksXG5cdFx0XHRsZW5ndGg6IHRoaXMuX2NvbmZpZy5iaW1vZGFsXG5cdFx0XHRcdFx0XHQ/XHR0aGlzLl9kYXRhX2luLmxlbmd0aCAvIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25faW5wdXRcblx0XHRcdFx0XHRcdDogdGhpcy5fZGF0YS5sZW5ndGggLyB0aGlzLl9jb25maWcuZGltZW5zaW9uXG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBcHBlbmQgYW4gb2JzZXJ2YXRpb24gdmVjdG9yIHRvIHRoZSBwaHJhc2UncyBkYXRhLiBNdXN0IGJlIG9mIGxlbmd0aCB7QGxpbmsgWG1tUGhyYXNlQ29uZmlnI2RpbWVuc2lvbn0uXG5cdCAqIEBwYXJhbSB7QXJyYXkuTnVtYmVyfSBvYnMgLSBBbiBpbnB1dCB2ZWN0b3IsIGFrYSBvYnNlcnZhdGlvbi4gSWYge1htbVBocmFzZUNvbmZpZyNiaW1vZGFsfSBpcyB0cnVlXG5cdCAqIEB0aHJvd3MgV2lsbCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgaW5wdXQgdmVjdG9yIGRvZXNuJ3QgbWF0Y2ggdGhlIGNvbmZpZy5cblx0ICovXG5cdGFkZE9ic2VydmF0aW9uKG9icykge1xuXHRcdGlmIChvYnMubGVuZ3RoICE9PSB0aGlzLl9jb25maWcuZGltZW5zaW9uIHx8XG5cdFx0XHRcdCh0eXBlb2Yob2JzKSA9PT0gJ251bWJlcicgJiYgdGhpcy5fY29uZmlnLmRpbWVuc2lvbiAhPT0gMSkpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXG5cdFx0XHRcdCdlcnJvciA6IGluY29taW5nIG9ic2VydmF0aW9uIGxlbmd0aCBub3QgbWF0Y2hpbmcgd2l0aCBkaW1lbnNpb25zJ1xuXHRcdFx0KTtcblx0XHRcdHRocm93ICdCYWRWZWN0b3JTaXplRXhjZXB0aW9uJztcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5fY29uZmlnLmJpbW9kYWwpIHtcblx0XHRcdHRoaXMuX2RhdGFfaW4gPSB0aGlzLl9kYXRhX2luLmNvbmNhdChcblx0XHRcdFx0b2JzLnNsaWNlKDAsIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25faW5wdXQpXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5fZGF0YV9vdXQgPSB0aGlzLl9kYXRhX291dC5jb25jYXQoXG5cdFx0XHRcdG9icy5zbGljZSh0aGlzLl9jb25maWcuZGltZW5zaW9uX2lucHV0KVxuXHRcdFx0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkob2JzKSkge1xuXHRcdFx0XHR0aGlzLl9kYXRhID0gdGhpcy5fZGF0YS5jb25jYXQob2JzKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuX2RhdGEucHVzaChvYnMpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDbGVhciB0aGUgcGhyYXNlJ3MgZGF0YSBzbyB0aGF0IGEgbmV3IG9uZSBpcyByZWFkeSB0byBiZSByZWNvcmRlZC5cblx0ICovXG5cdHJlc2V0KCkge1xuXHRcdHRoaXMuX2RhdGEgPSBbXTtcblx0XHR0aGlzLl9kYXRhX2luID0gW107XG5cdFx0dGhpcy5fZGF0YV9vdXQgPSBbXTtcblx0fVxuXG5cdC8qKiBAcHJpdmF0ZSAqL1xuXHRfc2V0Q29uZmlnKG9wdGlvbnMgPSB7fSkge1xuXHRcdGZvciAobGV0IHByb3AgaW4gb3B0aW9ucykge1xuXHRcdFx0aWYgKHByb3AgPT09ICdiaW1vZGFsJyAmJiB0eXBlb2Yob3B0aW9uc1twcm9wXSkgPT09ICdib29sZWFuJykge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuXHRcdFx0fSBlbHNlIGlmIChwcm9wID09PSAnZGltZW5zaW9uJyAmJiBOdW1iZXIuaXNJbnRlZ2VyKG9wdGlvbnNbcHJvcF0pKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG5cdFx0XHR9IGVsc2UgaWYgKHByb3AgPT09ICdkaW1lbnNpb25faW5wdXQnICYmIE51bWJlci5pc0ludGVnZXIob3B0aW9uc1twcm9wXSkpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcblx0XHRcdH0gZWxzZSBpZiAocHJvcCA9PT0gJ2NvbHVtbl9uYW1lcycgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zW3Byb3BdKSkge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdLnNsaWNlKDApO1xuXHRcdFx0fSBlbHNlIGlmIChwcm9wID09PSAnbGFiZWwnICYmIHR5cGVvZihvcHRpb25zW3Byb3BdKSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcblx0XHRcdH1cblx0XHR9XHRcdFxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQaHJhc2VNYWtlcjsiXX0=