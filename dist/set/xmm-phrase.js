'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

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
   * @property {Number} dimensionInput - Size of the part of an input vector element that should be used for training.
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
      dimensionInput: 0,
      columnNames: [''],
      label: ''
    };

    this._config = defaults;
    this._setConfig(options);

    this.reset();
  }

  /**
   * XMM phrase configuration object.
   * Only legal fields will be checked before being added to the config, others will be ignored
   * @type {XmmPhraseConfig}
   * @deprecated since version 0.2.0
   */


  (0, _createClass3.default)(PhraseMaker, [{
    key: 'getConfig',


    // new API (b-ma tip : don' use accessors if there is some magic behind,
    // which is the case in _setConfig)
    // keeping accessors for backwards compatibility

    /**
     * Returns the current configuration.
     */
    value: function getConfig() {
      return this._config;
    }

    /**
     * Updates the current configuration with the provided information.
     * @param {XmmPhraseConfig} options
     */

  }, {
    key: 'setConfig',
    value: function setConfig() {
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
    key: 'addObservation',


    /**
     * Append an observation vector to the phrase's data. Must be of length <code>dimension</code>.
     * @param {Array.Number} obs - An input vector, aka observation. If <code>bimodal</code> is true
     * @throws Will throw an error if the input vector doesn't match the config.
     */
    value: function addObservation(obs) {
      // check input validity
      var badLengthMsg = 'Bad input length: observation length must match phrase dimension';
      var badTypeMsg = 'Bad data type: all observation values must be numbers';

      if (obs.length !== this._config.dimension || typeof obs === 'number' && this._config.dimension !== 1) {
        throw new Error(badLengthMsg);
      }

      if (Array.isArray(obs)) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = (0, _getIterator3.default)(obs), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var val = _step.value;

            if (typeof val !== 'number') {
              throw new Error(badTypeMsg);
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
      } else if ((0, _typeof3.default)(obs !== 'number')) {
        throw new Error(badTypeMsg);
      }

      // add value(s) to internal arrays
      if (this._config.bimodal) {
        this._dataIn = this._dataIn.concat(obs.slice(0, this._config.dimensionInput));
        this._dataOut = this._dataOut.concat(obs.slice(this._config.dimensionInput));
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
      this._dataIn = [];
      this._dataOut = [];
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
        } else if (prop === 'dimensionInput' && (0, _isInteger2.default)(options[prop])) {
          this._config[prop] = options[prop];
        } else if (prop === 'columnNames' && Array.isArray(options[prop])) {
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
  }, {
    key: 'phrase',
    get: function get() {
      return this.getPhrase();
    }
  }]);
  return PhraseMaker;
}();

;

exports.default = PhraseMaker;
//# sourceMappingURL=data:application/json;base64,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RCxFQUErRDtBQUM3RCxlQUFLLE9BQUwsQ0FBYSxJQUFiLElBQXFCLFFBQVEsSUFBUixDQUFyQjtBQUNELFNBRkQsTUFFTyxJQUFJLFNBQVMsV0FBVCxJQUF3Qix5QkFBaUIsUUFBUSxJQUFSLENBQWpCLENBQTVCLEVBQTZEO0FBQ2xFLGVBQUssT0FBTCxDQUFhLElBQWIsSUFBcUIsUUFBUSxJQUFSLENBQXJCO0FBQ0QsU0FGTSxNQUVBLElBQUksU0FBUyxnQkFBVCxJQUE2Qix5QkFBaUIsUUFBUSxJQUFSLENBQWpCLENBQWpDLEVBQWtFO0FBQ3ZFLGVBQUssT0FBTCxDQUFhLElBQWIsSUFBcUIsUUFBUSxJQUFSLENBQXJCO0FBQ0QsU0FGTSxNQUVBLElBQUksU0FBUyxhQUFULElBQTBCLE1BQU0sT0FBTixDQUFjLFFBQVEsSUFBUixDQUFkLENBQTlCLEVBQTREO0FBQ2pFLGVBQUssT0FBTCxDQUFhLElBQWIsSUFBcUIsUUFBUSxJQUFSLEVBQWMsS0FBZCxDQUFvQixDQUFwQixDQUFyQjtBQUNELFNBRk0sTUFFQSxJQUFJLFNBQVMsT0FBVCxJQUFvQixPQUFPLFFBQVEsSUFBUixDQUFQLEtBQTBCLFFBQWxELEVBQTREO0FBQ2pFLGVBQUssT0FBTCxDQUFhLElBQWIsSUFBcUIsUUFBUSxJQUFSLENBQXJCO0FBQ0Q7QUFDRjtBQUNGOzs7d0JBbElZO0FBQ1gsYUFBTyxLQUFLLE9BQVo7QUFDRCxLO3dCQUV3QjtBQUFBLFVBQWQsT0FBYyx5REFBSixFQUFJOztBQUN2QixXQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDRDs7O3dCQXNEWTtBQUNYLGFBQU8sS0FBSyxTQUFMLEVBQVA7QUFDRDs7Ozs7QUFxRUY7O2tCQUVjLFciLCJmaWxlIjoieG1tLXBocmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogWE1NIGNvbXBhdGlibGUgcGhyYXNlIGJ1aWxkZXIgdXRpbGl0eSA8YnIgLz5cbiAqIENsYXNzIHRvIGVhc2UgdGhlIGNyZWF0aW9uIG9mIFhNTSBjb21wYXRpYmxlIGRhdGEgcmVjb3JkaW5ncywgYWthIHBocmFzZXMuIDxiciAvPlxuICogUGhyYXNlcyBhcmUgdHlwaWNhbGx5IGFycmF5cyAoZmxhdHRlbmVkIG1hdHJpY2VzKSBvZiBzaXplIE4gKiBNLFxuICogTiBiZWluZyB0aGUgc2l6ZSBvZiBhIHZlY3RvciBlbGVtZW50LCBhbmQgTSB0aGUgbGVuZ3RoIG9mIHRoZSBwaHJhc2UgaXRzZWxmLFxuICogd3JhcHBlZCB0b2dldGhlciBpbiBhbiBvYmplY3Qgd2l0aCBhIGZldyBzZXR0aW5ncy5cbiAqIEBjbGFzc1xuICovXG5cbmNsYXNzIFBocmFzZU1ha2VyIHtcbiAgLyoqXG4gICAqIFhNTSBwaHJhc2UgY29uZmlndXJhdGlvbiBvYmplY3QuXG4gICAqIEB0eXBlZGVmIFhtbVBocmFzZUNvbmZpZ1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbmFtZSBYbW1QaHJhc2VDb25maWdcbiAgICogQHByb3BlcnR5IHtCb29sZWFufSBiaW1vZGFsIC0gSW5kaWNhdGVzIHdldGhlciBwaHJhc2UgZGF0YSBzaG91bGQgYmUgY29uc2lkZXJlZCBiaW1vZGFsLlxuICAgKiBJZiB0cnVlLCB0aGUgPGNvZGU+ZGltZW5zaW9uX2lucHV0PC9jb2RlPiBwcm9wZXJ0eSB3aWxsIGJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbiAtIFNpemUgb2YgYSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbklucHV0IC0gU2l6ZSBvZiB0aGUgcGFydCBvZiBhbiBpbnB1dCB2ZWN0b3IgZWxlbWVudCB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0cmFpbmluZy5cbiAgICogVGhpcyBpbXBsaWVzIHRoYXQgdGhlIHJlc3Qgb2YgdGhlIHZlY3RvciAob2Ygc2l6ZSA8Y29kZT5kaW1lbnNpb24gLSBkaW1lbnNpb25faW5wdXQ8L2NvZGU+KVxuICAgKiB3aWxsIGJlIHVzZWQgZm9yIHJlZ3Jlc3Npb24uIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIHRydWUuXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuU3RyaW5nfSBjb2x1bW5fbmFtZXMgLSBBcnJheSBvZiBzdHJpbmcgaWRlbnRpZmllcnMgZGVzY3JpYmluZyBlYWNoIHNjYWxhciBvZiB0aGUgcGhyYXNlJ3MgdmVjdG9yIGVsZW1lbnRzLlxuICAgKiBUeXBpY2FsbHkgb2Ygc2l6ZSA8Y29kZT5kaW1lbnNpb248L2NvZGU+LlxuICAgKiBAcHJvcGVydHkge1N0cmluZ30gbGFiZWwgLSBUaGUgc3RyaW5nIGlkZW50aWZpZXIgb2YgdGhlIGNsYXNzIHRoZSBwaHJhc2UgYmVsb25ncyB0by5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7WG1tUGhyYXNlQ29uZmlnfSBvcHRpb25zIC0gRGVmYXVsdCBwaHJhc2UgY29uZmlndXJhdGlvbi5cbiAgICogQHNlZSB7QGxpbmsgY29uZmlnfS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IGRlZmF1bHRzID0ge1xuICAgICAgYmltb2RhbDogZmFsc2UsXG4gICAgICBkaW1lbnNpb246IDEsXG4gICAgICBkaW1lbnNpb25JbnB1dDogMCxcbiAgICAgIGNvbHVtbk5hbWVzOiBbJyddLFxuICAgICAgbGFiZWw6ICcnXG4gICAgfVxuXG4gICAgdGhpcy5fY29uZmlnID0gZGVmYXVsdHM7XG4gICAgdGhpcy5fc2V0Q29uZmlnKG9wdGlvbnMpO1xuXG4gICAgdGhpcy5yZXNldCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFhNTSBwaHJhc2UgY29uZmlndXJhdGlvbiBvYmplY3QuXG4gICAqIE9ubHkgbGVnYWwgZmllbGRzIHdpbGwgYmUgY2hlY2tlZCBiZWZvcmUgYmVpbmcgYWRkZWQgdG8gdGhlIGNvbmZpZywgb3RoZXJzIHdpbGwgYmUgaWdub3JlZFxuICAgKiBAdHlwZSB7WG1tUGhyYXNlQ29uZmlnfVxuICAgKiBAZGVwcmVjYXRlZCBzaW5jZSB2ZXJzaW9uIDAuMi4wXG4gICAqL1xuICBnZXQgY29uZmlnKCkge1xuICAgIHJldHVybiB0aGlzLl9jb25maWc7XG4gIH1cblxuICBzZXQgY29uZmlnKG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuX3NldENvbmZpZyhvcHRpb25zKTtcbiAgfVxuXG4gIC8vIG5ldyBBUEkgKGItbWEgdGlwIDogZG9uJyB1c2UgYWNjZXNzb3JzIGlmIHRoZXJlIGlzIHNvbWUgbWFnaWMgYmVoaW5kLFxuICAvLyB3aGljaCBpcyB0aGUgY2FzZSBpbiBfc2V0Q29uZmlnKVxuICAvLyBrZWVwaW5nIGFjY2Vzc29ycyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uLlxuICAgKi9cbiAgZ2V0Q29uZmlnKCkge1xuICAgIHJldHVybiB0aGlzLl9jb25maWc7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uIHdpdGggdGhlIHByb3ZpZGVkIGluZm9ybWF0aW9uLlxuICAgKiBAcGFyYW0ge1htbVBocmFzZUNvbmZpZ30gb3B0aW9uc1xuICAgKi9cbiAgc2V0Q29uZmlnKG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuX3NldENvbmZpZyhvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHZhbGlkIFhNTSBwaHJhc2UsIHJlYWR5IHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgWE1NIGxpYnJhcnkuXG4gICAqIEB0eXBlZGVmIFhtbVBocmFzZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbmFtZSBYbW1QaHJhc2VcbiAgICogQHByb3BlcnR5IHtCb29sZWFufSBiaW1vZGFsIC0gSW5kaWNhdGVzIHdldGhlciBwaHJhc2UgZGF0YSBzaG91bGQgYmUgY29uc2lkZXJlZCBiaW1vZGFsLlxuICAgKiBJZiB0cnVlLCB0aGUgPGNvZGU+ZGltZW5zaW9uX2lucHV0PC9jb2RlPiBwcm9wZXJ0eSB3aWxsIGJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbiAtIFNpemUgb2YgYSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbl9pbnB1dCAtIFNpemUgb2YgdGhlIHBhcnQgb2YgYW4gaW5wdXQgdmVjdG9yIGVsZW1lbnQgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdHJhaW5pbmcuXG4gICAqIFRoaXMgaW1wbGllcyB0aGF0IHRoZSByZXN0IG9mIHRoZSB2ZWN0b3IgKG9mIHNpemUgPGNvZGU+ZGltZW5zaW9uIC0gZGltZW5zaW9uX2lucHV0PC9jb2RlPilcbiAgICogd2lsbCBiZSB1c2VkIGZvciByZWdyZXNzaW9uLiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlLlxuICAgKiBAcHJvcGVydHkge0FycmF5LlN0cmluZ30gY29sdW1uX25hbWVzIC0gQXJyYXkgb2Ygc3RyaW5nIGlkZW50aWZpZXJzIGRlc2NyaWJpbmcgZWFjaCBzY2FsYXIgb2YgdGhlIHBocmFzZSdzIHZlY3RvciBlbGVtZW50cy5cbiAgICogVHlwaWNhbGx5IG9mIHNpemUgPGNvZGU+ZGltZW5zaW9uPC9jb2RlPi5cbiAgICogQHByb3BlcnR5IHtTdHJpbmd9IGxhYmVsIC0gVGhlIHN0cmluZyBpZGVudGlmaWVyIG9mIHRoZSBjbGFzcyB0aGUgcGhyYXNlIGJlbG9uZ3MgdG8uXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuTnVtYmVyfSBkYXRhIC0gVGhlIHBocmFzZSdzIGRhdGEsIGNvbnRhaW5pbmcgYWxsIHRoZSB2ZWN0b3JzIGZsYXR0ZW5lZCBpbnRvIGEgc2luZ2xlIG9uZS5cbiAgICogT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgZmFsc2UuXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuTnVtYmVyfSBkYXRhX2lucHV0IC0gVGhlIHBocmFzZSdzIGRhdGEgd2hpY2ggd2lsbCBiZSB1c2VkIGZvciB0cmFpbmluZywgZmxhdHRlbmVkIGludG8gYSBzaW5nbGUgdmVjdG9yLlxuICAgKiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlLlxuICAgKiBAcHJvcGVydHkge0FycmF5Lk51bWJlcn0gZGF0YV9vdXRwdXQgLSBUaGUgcGhyYXNlJ3MgZGF0YSB3aGljaCB3aWxsIGJlIHVzZWQgZm9yIHJlZ3Jlc3Npb24sIGZsYXR0ZW5lZCBpbnRvIGEgc2luZ2xlIHZlY3Rvci5cbiAgICogT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGxlbmd0aCAtIFRoZSBsZW5ndGggb2YgdGhlIHBocmFzZSwgZS5nLiBvbmUgb2YgdGhlIGZvbGxvd2luZyA6XG4gICAqIDxsaSBzdHlsZT1cImxpc3Qtc3R5bGUtdHlwZTogbm9uZTtcIj5cbiAgICogPHVsPjxjb2RlPmRhdGEubGVuZ3RoIC8gZGltZW5zaW9uPC9jb2RlPjwvdWw+XG4gICAqIDx1bD48Y29kZT5kYXRhX2lucHV0Lmxlbmd0aCAvIGRpbWVuc2lvbl9pbnB1dDwvY29kZT48L3VsPlxuICAgKiA8dWw+PGNvZGU+ZGF0YV9vdXRwdXQubGVuZ3RoIC8gZGltZW5zaW9uX291dHB1dDwvY29kZT48L3VsPlxuICAgKiA8L2xpPlxuICAgKi9cblxuICAvKipcbiAgICogQSB2YWxpZCBYTU0gcGhyYXNlLCByZWFkeSB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIFhNTSBsaWJyYXJ5LlxuICAgKiBAcmVhZG9ubHlcbiAgICogQHR5cGUge1htbVBocmFzZX1cbiAgICovXG4gIGdldCBwaHJhc2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UGhyYXNlKCk7XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIGFuIG9ic2VydmF0aW9uIHZlY3RvciB0byB0aGUgcGhyYXNlJ3MgZGF0YS4gTXVzdCBiZSBvZiBsZW5ndGggPGNvZGU+ZGltZW5zaW9uPC9jb2RlPi5cbiAgICogQHBhcmFtIHtBcnJheS5OdW1iZXJ9IG9icyAtIEFuIGlucHV0IHZlY3RvciwgYWthIG9ic2VydmF0aW9uLiBJZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlXG4gICAqIEB0aHJvd3MgV2lsbCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgaW5wdXQgdmVjdG9yIGRvZXNuJ3QgbWF0Y2ggdGhlIGNvbmZpZy5cbiAgICovXG4gIGFkZE9ic2VydmF0aW9uKG9icykge1xuICAgIC8vIGNoZWNrIGlucHV0IHZhbGlkaXR5XG4gICAgY29uc3QgYmFkTGVuZ3RoTXNnID0gJ0JhZCBpbnB1dCBsZW5ndGg6IG9ic2VydmF0aW9uIGxlbmd0aCBtdXN0IG1hdGNoIHBocmFzZSBkaW1lbnNpb24nO1xuICAgIGNvbnN0IGJhZFR5cGVNc2cgPSAnQmFkIGRhdGEgdHlwZTogYWxsIG9ic2VydmF0aW9uIHZhbHVlcyBtdXN0IGJlIG51bWJlcnMnO1xuXG4gICAgaWYgKG9icy5sZW5ndGggIT09IHRoaXMuX2NvbmZpZy5kaW1lbnNpb24gfHxcbiAgICAgICAgKHR5cGVvZihvYnMpID09PSAnbnVtYmVyJyAmJiB0aGlzLl9jb25maWcuZGltZW5zaW9uICE9PSAxKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGJhZExlbmd0aE1zZyk7XG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkob2JzKSkge1xuICAgICAgZm9yIChsZXQgdmFsIG9mIG9icykge1xuICAgICAgICBpZiAodHlwZW9mKHZhbCkgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGJhZFR5cGVNc2cpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2Yob2JzICE9PSAnbnVtYmVyJykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihiYWRUeXBlTXNnKTtcbiAgICB9XG5cbiAgICAvLyBhZGQgdmFsdWUocykgdG8gaW50ZXJuYWwgYXJyYXlzXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5iaW1vZGFsKSB7XG4gICAgICB0aGlzLl9kYXRhSW4gPSB0aGlzLl9kYXRhSW4uY29uY2F0KFxuICAgICAgICBvYnMuc2xpY2UoMCwgdGhpcy5fY29uZmlnLmRpbWVuc2lvbklucHV0KVxuICAgICAgKTtcbiAgICAgIHRoaXMuX2RhdGFPdXQgPSB0aGlzLl9kYXRhT3V0LmNvbmNhdChcbiAgICAgICAgb2JzLnNsaWNlKHRoaXMuX2NvbmZpZy5kaW1lbnNpb25JbnB1dClcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KG9icykpIHtcbiAgICAgICAgdGhpcy5fZGF0YSA9IHRoaXMuX2RhdGEuY29uY2F0KG9icyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9kYXRhLnB1c2gob2JzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXIgdGhlIHBocmFzZSdzIGRhdGEgc28gdGhhdCBhIG5ldyBvbmUgaXMgcmVhZHkgdG8gYmUgcmVjb3JkZWQuXG4gICAqL1xuICByZXNldCgpIHtcbiAgICB0aGlzLl9kYXRhID0gW107XG4gICAgdGhpcy5fZGF0YUluID0gW107XG4gICAgdGhpcy5fZGF0YU91dCA9IFtdO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9zZXRDb25maWcob3B0aW9ucyA9IHt9KSB7XG4gICAgZm9yIChsZXQgcHJvcCBpbiBvcHRpb25zKSB7XG4gICAgICBpZiAocHJvcCA9PT0gJ2JpbW9kYWwnICYmIHR5cGVvZihvcHRpb25zW3Byb3BdKSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG4gICAgICB9IGVsc2UgaWYgKHByb3AgPT09ICdkaW1lbnNpb24nICYmIE51bWJlci5pc0ludGVnZXIob3B0aW9uc1twcm9wXSkpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbklucHV0JyAmJiBOdW1iZXIuaXNJbnRlZ2VyKG9wdGlvbnNbcHJvcF0pKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG4gICAgICB9IGVsc2UgaWYgKHByb3AgPT09ICdjb2x1bW5OYW1lcycgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zW3Byb3BdKSkge1xuICAgICAgICB0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdLnNsaWNlKDApO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnbGFiZWwnICYmIHR5cGVvZihvcHRpb25zW3Byb3BdKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcbiAgICAgIH1cbiAgICB9ICAgXG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFBocmFzZU1ha2VyOyJdfQ==