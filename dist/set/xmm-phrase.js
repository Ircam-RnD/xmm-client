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
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
    key: '_getPhrase',


    /** @private */
    value: function _getPhrase() {
      return {
        bimodal: this._config.bimodal,
        column_names: this._config.columnNames,
        dimension: this._config.dimension,
        dimension_input: this._config.dimensionInput,
        label: this._config.label,
        data: this._data.slice(0),
        data_input: this._dataIn.slice(0),
        data_output: this._dataOut.slice(0),
        length: this._config.bimodal ? this._dataIn.length / this._config.dimensionInput : this._data.length / this._config.dimension
      };
    }
    /**
     * Append an observation vector to the phrase's data. Must be of length <code>dimension</code>.
     * @param {Array.Number} obs - An input vector, aka observation. If <code>bimodal</code> is true
     * @throws Will throw an error if the input vector doesn't match the config.
     */

  }, {
    key: 'addObservation',
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
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this._setConfig(options);
    }
  }, {
    key: 'phrase',
    get: function get() {
      return this._getPhrase();
    }
  }]);
  return PhraseMaker;
}();

;

exports.default = PhraseMaker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInhtbS1waHJhc2UuanMiXSwibmFtZXMiOlsiUGhyYXNlTWFrZXIiLCJvcHRpb25zIiwiZGVmYXVsdHMiLCJiaW1vZGFsIiwiZGltZW5zaW9uIiwiZGltZW5zaW9uSW5wdXQiLCJjb2x1bW5OYW1lcyIsImxhYmVsIiwiX2NvbmZpZyIsIl9zZXRDb25maWciLCJyZXNldCIsImNvbHVtbl9uYW1lcyIsImRpbWVuc2lvbl9pbnB1dCIsImRhdGEiLCJfZGF0YSIsInNsaWNlIiwiZGF0YV9pbnB1dCIsIl9kYXRhSW4iLCJkYXRhX291dHB1dCIsIl9kYXRhT3V0IiwibGVuZ3RoIiwib2JzIiwiYmFkTGVuZ3RoTXNnIiwiYmFkVHlwZU1zZyIsIkVycm9yIiwiQXJyYXkiLCJpc0FycmF5IiwidmFsIiwiY29uY2F0IiwicHVzaCIsInByb3AiLCJfZ2V0UGhyYXNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7OztJQVNNQSxXO0FBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7QUFJQSx5QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFDeEIsUUFBTUMsV0FBVztBQUNmQyxlQUFTLEtBRE07QUFFZkMsaUJBQVcsQ0FGSTtBQUdmQyxzQkFBZ0IsQ0FIRDtBQUlmQyxtQkFBYSxDQUFDLEVBQUQsQ0FKRTtBQUtmQyxhQUFPO0FBTFEsS0FBakI7O0FBUUEsU0FBS0MsT0FBTCxHQUFlTixRQUFmO0FBQ0EsU0FBS08sVUFBTCxDQUFnQlIsT0FBaEI7O0FBRUEsU0FBS1MsS0FBTDtBQUNEOztBQUVEOzs7Ozs7Ozs7Ozs7QUFjQTtBQUNBO0FBQ0E7O0FBRUE7OztnQ0FHWTtBQUNWLGFBQU8sS0FBS0YsT0FBWjtBQUNEOztBQUVEOzs7Ozs7O2dDQUl3QjtBQUFBLFVBQWRQLE9BQWMsdUVBQUosRUFBSTs7QUFDdEIsV0FBS1EsVUFBTCxDQUFnQlIsT0FBaEI7QUFDRDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7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Y29tcGF0aWJsZSBwaHJhc2UgYnVpbGRlciB1dGlsaXR5IDxiciAvPlxuICogQ2xhc3MgdG8gZWFzZSB0aGUgY3JlYXRpb24gb2YgWE1NIGNvbXBhdGlibGUgZGF0YSByZWNvcmRpbmdzLCBha2EgcGhyYXNlcy4gPGJyIC8+XG4gKiBQaHJhc2VzIGFyZSB0eXBpY2FsbHkgYXJyYXlzIChmbGF0dGVuZWQgbWF0cmljZXMpIG9mIHNpemUgTiAqIE0sXG4gKiBOIGJlaW5nIHRoZSBzaXplIG9mIGEgdmVjdG9yIGVsZW1lbnQsIGFuZCBNIHRoZSBsZW5ndGggb2YgdGhlIHBocmFzZSBpdHNlbGYsXG4gKiB3cmFwcGVkIHRvZ2V0aGVyIGluIGFuIG9iamVjdCB3aXRoIGEgZmV3IHNldHRpbmdzLlxuICogQGNsYXNzXG4gKi9cblxuY2xhc3MgUGhyYXNlTWFrZXIge1xuICAvKipcbiAgICogWE1NIHBocmFzZSBjb25maWd1cmF0aW9uIG9iamVjdC5cbiAgICogQHR5cGVkZWYgWG1tUGhyYXNlQ29uZmlnXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBuYW1lIFhtbVBocmFzZUNvbmZpZ1xuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IGJpbW9kYWwgLSBJbmRpY2F0ZXMgd2V0aGVyIHBocmFzZSBkYXRhIHNob3VsZCBiZSBjb25zaWRlcmVkIGJpbW9kYWwuXG4gICAqIElmIHRydWUsIHRoZSA8Y29kZT5kaW1lbnNpb25faW5wdXQ8L2NvZGU+IHByb3BlcnR5IHdpbGwgYmUgdGFrZW4gaW50byBhY2NvdW50LlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uIC0gU2l6ZSBvZiBhIHBocmFzZSdzIHZlY3RvciBlbGVtZW50LlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uSW5wdXQgLSBTaXplIG9mIHRoZSBwYXJ0IG9mIGFuIGlucHV0IHZlY3RvciBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRyYWluaW5nLlxuICAgKiBUaGlzIGltcGxpZXMgdGhhdCB0aGUgcmVzdCBvZiB0aGUgdmVjdG9yIChvZiBzaXplIDxjb2RlPmRpbWVuc2lvbiAtIGRpbWVuc2lvbl9pbnB1dDwvY29kZT4pXG4gICAqIHdpbGwgYmUgdXNlZCBmb3IgcmVncmVzc2lvbi4gT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cbiAgICogQHByb3BlcnR5IHtBcnJheS5TdHJpbmd9IGNvbHVtbl9uYW1lcyAtIEFycmF5IG9mIHN0cmluZyBpZGVudGlmaWVycyBkZXNjcmliaW5nIGVhY2ggc2NhbGFyIG9mIHRoZSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudHMuXG4gICAqIFR5cGljYWxseSBvZiBzaXplIDxjb2RlPmRpbWVuc2lvbjwvY29kZT4uXG4gICAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBsYWJlbCAtIFRoZSBzdHJpbmcgaWRlbnRpZmllciBvZiB0aGUgY2xhc3MgdGhlIHBocmFzZSBiZWxvbmdzIHRvLlxuICAgKi9cblxuICAvKipcbiAgICogQHBhcmFtIHtYbW1QaHJhc2VDb25maWd9IG9wdGlvbnMgLSBEZWZhdWx0IHBocmFzZSBjb25maWd1cmF0aW9uLlxuICAgKiBAc2VlIHtAbGluayBjb25maWd9LlxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgZGVmYXVsdHMgPSB7XG4gICAgICBiaW1vZGFsOiBmYWxzZSxcbiAgICAgIGRpbWVuc2lvbjogMSxcbiAgICAgIGRpbWVuc2lvbklucHV0OiAwLFxuICAgICAgY29sdW1uTmFtZXM6IFsnJ10sXG4gICAgICBsYWJlbDogJydcbiAgICB9XG5cbiAgICB0aGlzLl9jb25maWcgPSBkZWZhdWx0cztcbiAgICB0aGlzLl9zZXRDb25maWcob3B0aW9ucyk7XG5cbiAgICB0aGlzLnJlc2V0KCk7XG4gIH1cblxuICAvKipcbiAgICogWE1NIHBocmFzZSBjb25maWd1cmF0aW9uIG9iamVjdC5cbiAgICogT25seSBsZWdhbCBmaWVsZHMgd2lsbCBiZSBjaGVja2VkIGJlZm9yZSBiZWluZyBhZGRlZCB0byB0aGUgY29uZmlnLCBvdGhlcnMgd2lsbCBiZSBpZ25vcmVkXG4gICAqIEB0eXBlIHtYbW1QaHJhc2VDb25maWd9XG4gICAqIEBkZXByZWNhdGVkIHNpbmNlIHZlcnNpb24gMC4yLjBcbiAgICovXG4gIGdldCBjb25maWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbmZpZztcbiAgfVxuXG4gIHNldCBjb25maWcob3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5fc2V0Q29uZmlnKG9wdGlvbnMpO1xuICB9XG5cbiAgLy8gbmV3IEFQSSAoYi1tYSB0aXAgOiBkb24nIHVzZSBhY2Nlc3NvcnMgaWYgdGhlcmUgaXMgc29tZSBtYWdpYyBiZWhpbmQsXG4gIC8vIHdoaWNoIGlzIHRoZSBjYXNlIGluIF9zZXRDb25maWcpXG4gIC8vIGtlZXBpbmcgYWNjZXNzb3JzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGNvbmZpZ3VyYXRpb24uXG4gICAqL1xuICBnZXRDb25maWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbmZpZztcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjdXJyZW50IGNvbmZpZ3VyYXRpb24gd2l0aCB0aGUgcHJvdmlkZWQgaW5mb3JtYXRpb24uXG4gICAqIEBwYXJhbSB7WG1tUGhyYXNlQ29uZmlnfSBvcHRpb25zXG4gICAqL1xuICBzZXRDb25maWcob3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5fc2V0Q29uZmlnKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgdmFsaWQgWE1NIHBocmFzZSwgcmVhZHkgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBYTU0gbGlicmFyeS5cbiAgICogQHR5cGVkZWYgWG1tUGhyYXNlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBuYW1lIFhtbVBocmFzZVxuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IGJpbW9kYWwgLSBJbmRpY2F0ZXMgd2V0aGVyIHBocmFzZSBkYXRhIHNob3VsZCBiZSBjb25zaWRlcmVkIGJpbW9kYWwuXG4gICAqIElmIHRydWUsIHRoZSA8Y29kZT5kaW1lbnNpb25faW5wdXQ8L2NvZGU+IHByb3BlcnR5IHdpbGwgYmUgdGFrZW4gaW50byBhY2NvdW50LlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uIC0gU2l6ZSBvZiBhIHBocmFzZSdzIHZlY3RvciBlbGVtZW50LlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uX2lucHV0IC0gU2l6ZSBvZiB0aGUgcGFydCBvZiBhbiBpbnB1dCB2ZWN0b3IgZWxlbWVudCB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0cmFpbmluZy5cbiAgICogVGhpcyBpbXBsaWVzIHRoYXQgdGhlIHJlc3Qgb2YgdGhlIHZlY3RvciAob2Ygc2l6ZSA8Y29kZT5kaW1lbnNpb24gLSBkaW1lbnNpb25faW5wdXQ8L2NvZGU+KVxuICAgKiB3aWxsIGJlIHVzZWQgZm9yIHJlZ3Jlc3Npb24uIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIHRydWUuXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuU3RyaW5nfSBjb2x1bW5fbmFtZXMgLSBBcnJheSBvZiBzdHJpbmcgaWRlbnRpZmllcnMgZGVzY3JpYmluZyBlYWNoIHNjYWxhciBvZiB0aGUgcGhyYXNlJ3MgdmVjdG9yIGVsZW1lbnRzLlxuICAgKiBUeXBpY2FsbHkgb2Ygc2l6ZSA8Y29kZT5kaW1lbnNpb248L2NvZGU+LlxuICAgKiBAcHJvcGVydHkge1N0cmluZ30gbGFiZWwgLSBUaGUgc3RyaW5nIGlkZW50aWZpZXIgb2YgdGhlIGNsYXNzIHRoZSBwaHJhc2UgYmVsb25ncyB0by5cbiAgICogQHByb3BlcnR5IHtBcnJheS5OdW1iZXJ9IGRhdGEgLSBUaGUgcGhyYXNlJ3MgZGF0YSwgY29udGFpbmluZyBhbGwgdGhlIHZlY3RvcnMgZmxhdHRlbmVkIGludG8gYSBzaW5nbGUgb25lLlxuICAgKiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyBmYWxzZS5cbiAgICogQHByb3BlcnR5IHtBcnJheS5OdW1iZXJ9IGRhdGFfaW5wdXQgLSBUaGUgcGhyYXNlJ3MgZGF0YSB3aGljaCB3aWxsIGJlIHVzZWQgZm9yIHRyYWluaW5nLCBmbGF0dGVuZWQgaW50byBhIHNpbmdsZSB2ZWN0b3IuXG4gICAqIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIHRydWUuXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuTnVtYmVyfSBkYXRhX291dHB1dCAtIFRoZSBwaHJhc2UncyBkYXRhIHdoaWNoIHdpbGwgYmUgdXNlZCBmb3IgcmVncmVzc2lvbiwgZmxhdHRlbmVkIGludG8gYSBzaW5nbGUgdmVjdG9yLlxuICAgKiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlLlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gbGVuZ3RoIC0gVGhlIGxlbmd0aCBvZiB0aGUgcGhyYXNlLCBlLmcuIG9uZSBvZiB0aGUgZm9sbG93aW5nIDpcbiAgICogPGxpIHN0eWxlPVwibGlzdC1zdHlsZS10eXBlOiBub25lO1wiPlxuICAgKiA8dWw+PGNvZGU+ZGF0YS5sZW5ndGggLyBkaW1lbnNpb248L2NvZGU+PC91bD5cbiAgICogPHVsPjxjb2RlPmRhdGFfaW5wdXQubGVuZ3RoIC8gZGltZW5zaW9uX2lucHV0PC9jb2RlPjwvdWw+XG4gICAqIDx1bD48Y29kZT5kYXRhX291dHB1dC5sZW5ndGggLyBkaW1lbnNpb25fb3V0cHV0PC9jb2RlPjwvdWw+XG4gICAqIDwvbGk+XG4gICAqL1xuXG4gIC8qKlxuICAgKiBBIHZhbGlkIFhNTSBwaHJhc2UsIHJlYWR5IHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgWE1NIGxpYnJhcnkuXG4gICAqIEByZWFkb25seVxuICAgKiBAdHlwZSB7WG1tUGhyYXNlfVxuICAgKi9cbiAgZ2V0IHBocmFzZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0UGhyYXNlKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX2dldFBocmFzZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYmltb2RhbDogdGhpcy5fY29uZmlnLmJpbW9kYWwsXG4gICAgICBjb2x1bW5fbmFtZXM6IHRoaXMuX2NvbmZpZy5jb2x1bW5OYW1lcyxcbiAgICAgIGRpbWVuc2lvbjogdGhpcy5fY29uZmlnLmRpbWVuc2lvbixcbiAgICAgIGRpbWVuc2lvbl9pbnB1dDogdGhpcy5fY29uZmlnLmRpbWVuc2lvbklucHV0LFxuICAgICAgbGFiZWw6IHRoaXMuX2NvbmZpZy5sYWJlbCxcbiAgICAgIGRhdGE6IHRoaXMuX2RhdGEuc2xpY2UoMCksXG4gICAgICBkYXRhX2lucHV0OiB0aGlzLl9kYXRhSW4uc2xpY2UoMCksXG4gICAgICBkYXRhX291dHB1dDogdGhpcy5fZGF0YU91dC5zbGljZSgwKSxcbiAgICAgIGxlbmd0aDogdGhpcy5fY29uZmlnLmJpbW9kYWxcbiAgICAgICAgICAgID8gdGhpcy5fZGF0YUluLmxlbmd0aCAvIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25JbnB1dFxuICAgICAgICAgICAgOiB0aGlzLl9kYXRhLmxlbmd0aCAvIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25cbiAgICB9O1xuICB9XG4gIC8qKlxuICAgKiBBcHBlbmQgYW4gb2JzZXJ2YXRpb24gdmVjdG9yIHRvIHRoZSBwaHJhc2UncyBkYXRhLiBNdXN0IGJlIG9mIGxlbmd0aCA8Y29kZT5kaW1lbnNpb248L2NvZGU+LlxuICAgKiBAcGFyYW0ge0FycmF5Lk51bWJlcn0gb2JzIC0gQW4gaW5wdXQgdmVjdG9yLCBha2Egb2JzZXJ2YXRpb24uIElmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIHRydWVcbiAgICogQHRocm93cyBXaWxsIHRocm93IGFuIGVycm9yIGlmIHRoZSBpbnB1dCB2ZWN0b3IgZG9lc24ndCBtYXRjaCB0aGUgY29uZmlnLlxuICAgKi9cbiAgYWRkT2JzZXJ2YXRpb24ob2JzKSB7XG4gICAgLy8gY2hlY2sgaW5wdXQgdmFsaWRpdHlcbiAgICBjb25zdCBiYWRMZW5ndGhNc2cgPSAnQmFkIGlucHV0IGxlbmd0aDogb2JzZXJ2YXRpb24gbGVuZ3RoIG11c3QgbWF0Y2ggcGhyYXNlIGRpbWVuc2lvbic7XG4gICAgY29uc3QgYmFkVHlwZU1zZyA9ICdCYWQgZGF0YSB0eXBlOiBhbGwgb2JzZXJ2YXRpb24gdmFsdWVzIG11c3QgYmUgbnVtYmVycyc7XG5cbiAgICBpZiAob2JzLmxlbmd0aCAhPT0gdGhpcy5fY29uZmlnLmRpbWVuc2lvbiB8fFxuICAgICAgICAodHlwZW9mKG9icykgPT09ICdudW1iZXInICYmIHRoaXMuX2NvbmZpZy5kaW1lbnNpb24gIT09IDEpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYmFkTGVuZ3RoTXNnKTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYnMpKSB7XG4gICAgICBmb3IgKGxldCB2YWwgb2Ygb2JzKSB7XG4gICAgICAgIGlmICh0eXBlb2YodmFsKSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYmFkVHlwZU1zZyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZihvYnMgIT09ICdudW1iZXInKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGJhZFR5cGVNc2cpO1xuICAgIH1cblxuICAgIC8vIGFkZCB2YWx1ZShzKSB0byBpbnRlcm5hbCBhcnJheXNcbiAgICBpZiAodGhpcy5fY29uZmlnLmJpbW9kYWwpIHtcbiAgICAgIHRoaXMuX2RhdGFJbiA9IHRoaXMuX2RhdGFJbi5jb25jYXQoXG4gICAgICAgIG9icy5zbGljZSgwLCB0aGlzLl9jb25maWcuZGltZW5zaW9uSW5wdXQpXG4gICAgICApO1xuICAgICAgdGhpcy5fZGF0YU91dCA9IHRoaXMuX2RhdGFPdXQuY29uY2F0KFxuICAgICAgICBvYnMuc2xpY2UodGhpcy5fY29uZmlnLmRpbWVuc2lvbklucHV0KVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JzKSkge1xuICAgICAgICB0aGlzLl9kYXRhID0gdGhpcy5fZGF0YS5jb25jYXQob2JzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2RhdGEucHVzaChvYnMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciB0aGUgcGhyYXNlJ3MgZGF0YSBzbyB0aGF0IGEgbmV3IG9uZSBpcyByZWFkeSB0byBiZSByZWNvcmRlZC5cbiAgICovXG4gIHJlc2V0KCkge1xuICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICB0aGlzLl9kYXRhSW4gPSBbXTtcbiAgICB0aGlzLl9kYXRhT3V0ID0gW107XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX3NldENvbmZpZyhvcHRpb25zID0ge30pIHtcbiAgICBmb3IgKGxldCBwcm9wIGluIG9wdGlvbnMpIHtcbiAgICAgIGlmIChwcm9wID09PSAnYmltb2RhbCcgJiYgdHlwZW9mKG9wdGlvbnNbcHJvcF0pID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbicgJiYgTnVtYmVyLmlzSW50ZWdlcihvcHRpb25zW3Byb3BdKSkge1xuICAgICAgICB0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnZGltZW5zaW9uSW5wdXQnICYmIE51bWJlci5pc0ludGVnZXIob3B0aW9uc1twcm9wXSkpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2NvbHVtbk5hbWVzJyAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnNbcHJvcF0pKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF0uc2xpY2UoMCk7XG4gICAgICB9IGVsc2UgaWYgKHByb3AgPT09ICdsYWJlbCcgJiYgdHlwZW9mKG9wdGlvbnNbcHJvcF0pID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuICAgICAgfVxuICAgIH0gICBcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgUGhyYXNlTWFrZXI7Il19