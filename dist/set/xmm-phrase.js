'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isArray = function isArray(v) {
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

var PhraseMaker = function () {
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
   * Returns the current configuration.
   * @returns {xmmPhraseConfig}
   */


  (0, _createClass3.default)(PhraseMaker, [{
    key: 'getConfig',
    value: function getConfig() {
      return this._config;
    }

    /**
     * Updates the current configuration with the provided information.
     * @param {xmmPhraseConfig} options
     */

  }, {
    key: 'setConfig',
    value: function setConfig() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this._setConfig(options);
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

      if (isArray(obs)) {
        for (var i = 0; i < obs.length; i++) {
          if (typeof obs[i] !== 'number') {
            throw new Error(badTypeMsg);
          }
        }
      } else if ((0, _typeof3.default)(obs !== 'number')) {
        throw new Error(badTypeMsg);
      }

      if (obs.length !== this._config.dimension || typeof obs === 'number' && this._config.dimension !== 1) {
        throw new Error(badLengthMsg);
      }

      // add value(s) to internal arrays
      if (this._config.bimodal) {
        for (var _i = 0; _i < this._config.dimensionInput; _i++) {
          this._dataIn.push(obs[_i]);
        }

        for (var _i2 = this._config.dimensionInput; _i2 < this._config.dimension; _i2++) {
          this._dataOut.push(obs[_i2]);
        }
      } else {
        if (isArray(obs)) {
          for (var _i3 = 0; _i3 < obs.length; _i3++) {
            this._data.push(obs[_i3]);
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

  }, {
    key: 'getPhrase',
    value: function getPhrase() {
      return this._getPhrase();
    }

    /** @private */

  }, {
    key: '_getPhrase',
    value: function _getPhrase() {
      var res = {
        bimodal: this._config.bimodal,
        column_names: this._config.columnNames,
        dimension: this._config.dimension,
        dimension_input: this._config.dimensionInput,
        label: this._config.label,
        length: this._config.bimodal ? this._dataIn.length / this._config.dimensionInput : this._data.length / this._config.dimension
      };

      if (this._config.bimodal) {
        res.data_input = this._dataIn; //.slice(0);
        res.data_output = this._dataOut; //.slice(0);
      } else {
        res.data = this._data; //.slice(0);
      }

      return res;
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
  }]);
  return PhraseMaker;
}();

;

exports.default = PhraseMaker;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInhtbS1waHJhc2UuanMiXSwibmFtZXMiOlsiaXNBcnJheSIsInYiLCJjb25zdHJ1Y3RvciIsIkZsb2F0MzJBcnJheSIsIkFycmF5IiwiUGhyYXNlTWFrZXIiLCJvcHRpb25zIiwiZGVmYXVsdHMiLCJiaW1vZGFsIiwiZGltZW5zaW9uIiwiZGltZW5zaW9uSW5wdXQiLCJjb2x1bW5OYW1lcyIsImxhYmVsIiwiX2NvbmZpZyIsIl9zZXRDb25maWciLCJyZXNldCIsInByb3AiLCJzbGljZSIsIm9icyIsImJhZExlbmd0aE1zZyIsImJhZFR5cGVNc2ciLCJpIiwibGVuZ3RoIiwiRXJyb3IiLCJfZGF0YUluIiwicHVzaCIsIl9kYXRhT3V0IiwiX2RhdGEiLCJfZ2V0UGhyYXNlIiwicmVzIiwiY29sdW1uX25hbWVzIiwiZGltZW5zaW9uX2lucHV0IiwiZGF0YV9pbnB1dCIsImRhdGFfb3V0cHV0IiwiZGF0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsVUFBVSxTQUFWQSxPQUFVLElBQUs7QUFDbkIsU0FBT0MsRUFBRUMsV0FBRixLQUFrQkMsWUFBbEIsSUFBa0NDLE1BQU1KLE9BQU4sQ0FBY0MsQ0FBZCxDQUF6QztBQUNELENBRkQ7O0FBSUE7Ozs7Ozs7OztJQVNNSSxXO0FBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7QUFJQSx5QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFDeEIsUUFBTUMsV0FBVztBQUNmQyxlQUFTLEtBRE07QUFFZkMsaUJBQVcsQ0FGSTtBQUdmQyxzQkFBZ0IsQ0FIRDtBQUlmQyxtQkFBYSxDQUFDLEVBQUQsQ0FKRTtBQUtmQyxhQUFPO0FBTFEsS0FBakI7O0FBUUEsU0FBS0MsT0FBTCxHQUFlTixRQUFmO0FBQ0EsU0FBS08sVUFBTCxDQUFnQlIsT0FBaEI7O0FBRUEsU0FBS1MsS0FBTDtBQUNEOztBQUVEOzs7Ozs7OztnQ0FJWTtBQUNWLGFBQU8sS0FBS0YsT0FB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R0FBZSxFQUFmO0FBQ0EsV0FBS0UsUUFBTCxHQUFnQixFQUFoQjtBQUNEOzs7OztBQUNGOztrQkFFY3JCLFciLCJmaWxlIjoieG1tLXBocmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGlzQXJyYXkgPSB2ID0+IHtcbiAgcmV0dXJuIHYuY29uc3RydWN0b3IgPT09IEZsb2F0MzJBcnJheSB8fCBBcnJheS5pc0FycmF5KHYpO1xufTtcblxuLyoqXG4gKiBYTU0gY29tcGF0aWJsZSBwaHJhc2UgYnVpbGRlciB1dGlsaXR5IDxiciAvPlxuICogQ2xhc3MgdG8gZWFzZSB0aGUgY3JlYXRpb24gb2YgWE1NIGNvbXBhdGlibGUgZGF0YSByZWNvcmRpbmdzLCBha2EgcGhyYXNlcy4gPGJyIC8+XG4gKiBQaHJhc2VzIGFyZSB0eXBpY2FsbHkgYXJyYXlzIChmbGF0dGVuZWQgbWF0cmljZXMpIG9mIHNpemUgTiAqIE0sXG4gKiBOIGJlaW5nIHRoZSBzaXplIG9mIGEgdmVjdG9yIGVsZW1lbnQsIGFuZCBNIHRoZSBsZW5ndGggb2YgdGhlIHBocmFzZSBpdHNlbGYsXG4gKiB3cmFwcGVkIHRvZ2V0aGVyIGluIGFuIG9iamVjdCB3aXRoIGEgZmV3IHNldHRpbmdzLlxuICogQGNsYXNzXG4gKi9cblxuY2xhc3MgUGhyYXNlTWFrZXIge1xuICAvKipcbiAgICogWE1NIHBocmFzZSBjb25maWd1cmF0aW9uIG9iamVjdC5cbiAgICogQHR5cGVkZWYgeG1tUGhyYXNlQ29uZmlnXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBuYW1lIHhtbVBocmFzZUNvbmZpZ1xuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IGJpbW9kYWwgLSBJbmRpY2F0ZXMgd2V0aGVyIHBocmFzZSBkYXRhIHNob3VsZCBiZSBjb25zaWRlcmVkIGJpbW9kYWwuXG4gICAqIElmIHRydWUsIHRoZSA8Y29kZT5kaW1lbnNpb25faW5wdXQ8L2NvZGU+IHByb3BlcnR5IHdpbGwgYmUgdGFrZW4gaW50byBhY2NvdW50LlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uIC0gU2l6ZSBvZiBhIHBocmFzZSdzIHZlY3RvciBlbGVtZW50LlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uSW5wdXQgLSBTaXplIG9mIHRoZSBwYXJ0IG9mIGFuIGlucHV0IHZlY3RvciBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRyYWluaW5nLlxuICAgKiBUaGlzIGltcGxpZXMgdGhhdCB0aGUgcmVzdCBvZiB0aGUgdmVjdG9yIChvZiBzaXplIDxjb2RlPmRpbWVuc2lvbiAtIGRpbWVuc2lvbl9pbnB1dDwvY29kZT4pXG4gICAqIHdpbGwgYmUgdXNlZCBmb3IgcmVncmVzc2lvbi4gT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cbiAgICogQHByb3BlcnR5IHtBcnJheS5TdHJpbmd9IGNvbHVtbl9uYW1lcyAtIEFycmF5IG9mIHN0cmluZyBpZGVudGlmaWVycyBkZXNjcmliaW5nIGVhY2ggc2NhbGFyIG9mIHRoZSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudHMuXG4gICAqIFR5cGljYWxseSBvZiBzaXplIDxjb2RlPmRpbWVuc2lvbjwvY29kZT4uXG4gICAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBsYWJlbCAtIFRoZSBzdHJpbmcgaWRlbnRpZmllciBvZiB0aGUgY2xhc3MgdGhlIHBocmFzZSBiZWxvbmdzIHRvLlxuICAgKi9cblxuICAvKipcbiAgICogQHBhcmFtIHt4bW1QaHJhc2VDb25maWd9IG9wdGlvbnMgLSBEZWZhdWx0IHBocmFzZSBjb25maWd1cmF0aW9uLlxuICAgKiBAc2VlIHtAbGluayBjb25maWd9LlxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgZGVmYXVsdHMgPSB7XG4gICAgICBiaW1vZGFsOiBmYWxzZSxcbiAgICAgIGRpbWVuc2lvbjogMSxcbiAgICAgIGRpbWVuc2lvbklucHV0OiAwLFxuICAgICAgY29sdW1uTmFtZXM6IFsnJ10sXG4gICAgICBsYWJlbDogJydcbiAgICB9XG5cbiAgICB0aGlzLl9jb25maWcgPSBkZWZhdWx0cztcbiAgICB0aGlzLl9zZXRDb25maWcob3B0aW9ucyk7XG5cbiAgICB0aGlzLnJlc2V0KCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uLlxuICAgKiBAcmV0dXJucyB7eG1tUGhyYXNlQ29uZmlnfVxuICAgKi9cbiAgZ2V0Q29uZmlnKCkge1xuICAgIHJldHVybiB0aGlzLl9jb25maWc7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uIHdpdGggdGhlIHByb3ZpZGVkIGluZm9ybWF0aW9uLlxuICAgKiBAcGFyYW0ge3htbVBocmFzZUNvbmZpZ30gb3B0aW9uc1xuICAgKi9cbiAgc2V0Q29uZmlnKG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuX3NldENvbmZpZyhvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfc2V0Q29uZmlnKG9wdGlvbnMgPSB7fSkge1xuICAgIGZvciAobGV0IHByb3AgaW4gb3B0aW9ucykge1xuICAgICAgaWYgKHByb3AgPT09ICdiaW1vZGFsJyAmJiB0eXBlb2Yob3B0aW9uc1twcm9wXSkgPT09ICdib29sZWFuJykge1xuICAgICAgICB0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnZGltZW5zaW9uJyAmJiBOdW1iZXIuaXNJbnRlZ2VyKG9wdGlvbnNbcHJvcF0pKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG4gICAgICB9IGVsc2UgaWYgKHByb3AgPT09ICdkaW1lbnNpb25JbnB1dCcgJiYgTnVtYmVyLmlzSW50ZWdlcihvcHRpb25zW3Byb3BdKSkge1xuICAgICAgICB0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnY29sdW1uTmFtZXMnICYmIEFycmF5LmlzQXJyYXkob3B0aW9uc1twcm9wXSkpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXS5zbGljZSgwKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2xhYmVsJyAmJiB0eXBlb2Yob3B0aW9uc1twcm9wXSkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG4gICAgICB9XG4gICAgfSAgIFxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZCBhbiBvYnNlcnZhdGlvbiB2ZWN0b3IgdG8gdGhlIHBocmFzZSdzIGRhdGEuIE11c3QgYmUgb2YgbGVuZ3RoIDxjb2RlPmRpbWVuc2lvbjwvY29kZT4uXG4gICAqIEBwYXJhbSB7QXJyYXkuTnVtYmVyfSBvYnMgLSBBbiBpbnB1dCB2ZWN0b3IsIGFrYSBvYnNlcnZhdGlvbi4gSWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZVxuICAgKiBAdGhyb3dzIFdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGlucHV0IHZlY3RvciBkb2Vzbid0IG1hdGNoIHRoZSBjb25maWcuXG4gICAqL1xuICBhZGRPYnNlcnZhdGlvbihvYnMpIHtcbiAgICAvLyBjaGVjayBpbnB1dCB2YWxpZGl0eVxuICAgIGNvbnN0IGJhZExlbmd0aE1zZyA9ICdCYWQgaW5wdXQgbGVuZ3RoOiBvYnNlcnZhdGlvbiBsZW5ndGggbXVzdCBtYXRjaCBwaHJhc2UgZGltZW5zaW9uJztcbiAgICBjb25zdCBiYWRUeXBlTXNnID0gJ0JhZCBkYXRhIHR5cGU6IGFsbCBvYnNlcnZhdGlvbiB2YWx1ZXMgbXVzdCBiZSBudW1iZXJzJztcblxuICAgIGlmIChpc0FycmF5KG9icykpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0eXBlb2Yob2JzW2ldKSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYmFkVHlwZU1zZyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZihvYnMgIT09ICdudW1iZXInKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGJhZFR5cGVNc2cpO1xuICAgIH1cblxuICAgIGlmIChvYnMubGVuZ3RoICE9PSB0aGlzLl9jb25maWcuZGltZW5zaW9uIHx8XG4gICAgICAgICh0eXBlb2Yob2JzKSA9PT0gJ251bWJlcicgJiYgdGhpcy5fY29uZmlnLmRpbWVuc2lvbiAhPT0gMSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihiYWRMZW5ndGhNc2cpO1xuICAgIH1cblxuICAgIC8vIGFkZCB2YWx1ZShzKSB0byBpbnRlcm5hbCBhcnJheXNcbiAgICBpZiAodGhpcy5fY29uZmlnLmJpbW9kYWwpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fY29uZmlnLmRpbWVuc2lvbklucHV0OyBpKyspIHtcbiAgICAgICAgdGhpcy5fZGF0YUluLnB1c2gob2JzW2ldKTtcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaSA9IHRoaXMuX2NvbmZpZy5kaW1lbnNpb25JbnB1dDsgaSA8IHRoaXMuX2NvbmZpZy5kaW1lbnNpb247IGkrKykge1xuICAgICAgICB0aGlzLl9kYXRhT3V0LnB1c2gob2JzW2ldKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGlzQXJyYXkob2JzKSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9icy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHRoaXMuX2RhdGEucHVzaChvYnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9kYXRhLnB1c2gob2JzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQSB2YWxpZCBYTU0gcGhyYXNlLCByZWFkeSB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIFhNTSBsaWJyYXJ5LlxuICAgKiBAdHlwZWRlZiB4bW1QaHJhc2VcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG5hbWUgeG1tUGhyYXNlXG4gICAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gYmltb2RhbCAtIEluZGljYXRlcyB3ZXRoZXIgcGhyYXNlIGRhdGEgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYmltb2RhbC5cbiAgICogSWYgdHJ1ZSwgdGhlIDxjb2RlPmRpbWVuc2lvbl9pbnB1dDwvY29kZT4gcHJvcGVydHkgd2lsbCBiZSB0YWtlbiBpbnRvIGFjY291bnQuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkaW1lbnNpb24gLSBTaXplIG9mIGEgcGhyYXNlJ3MgdmVjdG9yIGVsZW1lbnQuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkaW1lbnNpb25faW5wdXQgLSBTaXplIG9mIHRoZSBwYXJ0IG9mIGFuIGlucHV0IHZlY3RvciBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRyYWluaW5nLlxuICAgKiBUaGlzIGltcGxpZXMgdGhhdCB0aGUgcmVzdCBvZiB0aGUgdmVjdG9yIChvZiBzaXplIDxjb2RlPmRpbWVuc2lvbiAtIGRpbWVuc2lvbl9pbnB1dDwvY29kZT4pXG4gICAqIHdpbGwgYmUgdXNlZCBmb3IgcmVncmVzc2lvbi4gT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cbiAgICogQHByb3BlcnR5IHtBcnJheS5TdHJpbmd9IGNvbHVtbl9uYW1lcyAtIEFycmF5IG9mIHN0cmluZyBpZGVudGlmaWVycyBkZXNjcmliaW5nIGVhY2ggc2NhbGFyIG9mIHRoZSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudHMuXG4gICAqIFR5cGljYWxseSBvZiBzaXplIDxjb2RlPmRpbWVuc2lvbjwvY29kZT4uXG4gICAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBsYWJlbCAtIFRoZSBzdHJpbmcgaWRlbnRpZmllciBvZiB0aGUgY2xhc3MgdGhlIHBocmFzZSBiZWxvbmdzIHRvLlxuICAgKiBAcHJvcGVydHkge0FycmF5Lk51bWJlcn0gZGF0YSAtIFRoZSBwaHJhc2UncyBkYXRhLCBjb250YWluaW5nIGFsbCB0aGUgdmVjdG9ycyBmbGF0dGVuZWQgaW50byBhIHNpbmdsZSBvbmUuXG4gICAqIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIGZhbHNlLlxuICAgKiBAcHJvcGVydHkge0FycmF5Lk51bWJlcn0gZGF0YV9pbnB1dCAtIFRoZSBwaHJhc2UncyBkYXRhIHdoaWNoIHdpbGwgYmUgdXNlZCBmb3IgdHJhaW5pbmcsIGZsYXR0ZW5lZCBpbnRvIGEgc2luZ2xlIHZlY3Rvci5cbiAgICogT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cbiAgICogQHByb3BlcnR5IHtBcnJheS5OdW1iZXJ9IGRhdGFfb3V0cHV0IC0gVGhlIHBocmFzZSdzIGRhdGEgd2hpY2ggd2lsbCBiZSB1c2VkIGZvciByZWdyZXNzaW9uLCBmbGF0dGVuZWQgaW50byBhIHNpbmdsZSB2ZWN0b3IuXG4gICAqIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIHRydWUuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBsZW5ndGggLSBUaGUgbGVuZ3RoIG9mIHRoZSBwaHJhc2UsIGUuZy4gb25lIG9mIHRoZSBmb2xsb3dpbmcgOlxuICAgKiA8bGkgc3R5bGU9XCJsaXN0LXN0eWxlLXR5cGU6IG5vbmU7XCI+XG4gICAqIDx1bD48Y29kZT5kYXRhLmxlbmd0aCAvIGRpbWVuc2lvbjwvY29kZT48L3VsPlxuICAgKiA8dWw+PGNvZGU+ZGF0YV9pbnB1dC5sZW5ndGggLyBkaW1lbnNpb25faW5wdXQ8L2NvZGU+PC91bD5cbiAgICogPHVsPjxjb2RlPmRhdGFfb3V0cHV0Lmxlbmd0aCAvIGRpbWVuc2lvbl9vdXRwdXQ8L2NvZGU+PC91bD5cbiAgICogPC9saT5cbiAgICovXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB2YWxpZCBYTU0gcGhyYXNlIGNyZWF0ZWQgZnJvbSB0aGUgY29uZmlnIGFuZCB0aGUgcmVjb3JkZWQgZGF0YS5cbiAgICogQHJldHVybnMge3htbVBocmFzZX1cbiAgICovXG4gIGdldFBocmFzZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0UGhyYXNlKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX2dldFBocmFzZSgpIHtcbiAgICBsZXQgcmVzID0ge1xuICAgICAgYmltb2RhbDogdGhpcy5fY29uZmlnLmJpbW9kYWwsXG4gICAgICBjb2x1bW5fbmFtZXM6IHRoaXMuX2NvbmZpZy5jb2x1bW5OYW1lcyxcbiAgICAgIGRpbWVuc2lvbjogdGhpcy5fY29uZmlnLmRpbWVuc2lvbixcbiAgICAgIGRpbWVuc2lvbl9pbnB1dDogdGhpcy5fY29uZmlnLmRpbWVuc2lvbklucHV0LFxuICAgICAgbGFiZWw6IHRoaXMuX2NvbmZpZy5sYWJlbCxcbiAgICAgIGxlbmd0aDogdGhpcy5fY29uZmlnLmJpbW9kYWxcbiAgICAgICAgICAgID8gdGhpcy5fZGF0YUluLmxlbmd0aCAvIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25JbnB1dFxuICAgICAgICAgICAgOiB0aGlzLl9kYXRhLmxlbmd0aCAvIHRoaXMuX2NvbmZpZy5kaW1lbnNpb24gICAgICBcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5iaW1vZGFsKSB7XG4gICAgICByZXMuZGF0YV9pbnB1dCA9IHRoaXMuX2RhdGFJbjsvLy5zbGljZSgwKTtcbiAgICAgIHJlcy5kYXRhX291dHB1dCA9IHRoaXMuX2RhdGFPdXQ7Ly8uc2xpY2UoMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5kYXRhID0gdGhpcy5fZGF0YTsvLy5zbGljZSgwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzOyAgICBcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciB0aGUgcGhyYXNlJ3MgZGF0YSBzbyB0aGF0IGEgbmV3IG9uZSBpcyByZWFkeSB0byBiZSByZWNvcmRlZC5cbiAgICovXG4gIHJlc2V0KCkge1xuICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICB0aGlzLl9kYXRhSW4gPSBbXTtcbiAgICB0aGlzLl9kYXRhT3V0ID0gW107XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFBocmFzZU1ha2VyOyJdfQ==