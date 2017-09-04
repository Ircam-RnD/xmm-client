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

      if (obs.length !== this._config.dimension || typeof obs === 'number' && this._config.dimension !== 1) {
        throw new Error(badLengthMsg);
      }

      if (isArray(obs)) {
        for (var i = 0; i < obs.length; i++) {
          if (typeof obs[i] !== 'number') {
            throw new Error(badTypeMsg);
          }
        }
      } else if ((0, _typeof3.default)(obs !== 'number')) {
        throw new Error(badTypeMsg);
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
            this._dataIn.push(obs[_i3]);
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
        res.data_input = this._dataIn.slice(0);
        res.data_output = this._dataOut.slice(0);
      } else {
        res.data = this._data.slice(0);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInhtbS1waHJhc2UuanMiXSwibmFtZXMiOlsiaXNBcnJheSIsInYiLCJjb25zdHJ1Y3RvciIsIkZsb2F0MzJBcnJheSIsIkFycmF5IiwiUGhyYXNlTWFrZXIiLCJvcHRpb25zIiwiZGVmYXVsdHMiLCJiaW1vZGFsIiwiZGltZW5zaW9uIiwiZGltZW5zaW9uSW5wdXQiLCJjb2x1bW5OYW1lcyIsImxhYmVsIiwiX2NvbmZpZyIsIl9zZXRDb25maWciLCJyZXNldCIsInByb3AiLCJzbGljZSIsIm9icyIsImJhZExlbmd0aE1zZyIsImJhZFR5cGVNc2ciLCJsZW5ndGgiLCJFcnJvciIsImkiLCJfZGF0YUluIiwicHVzaCIsIl9kYXRhT3V0IiwiX2RhdGEiLCJfZ2V0UGhyYXNlIiwicmVzIiwiY29sdW1uX25hbWVzIiwiZGltZW5zaW9uX2lucHV0IiwiZGF0YV9pbnB1dCIsImRhdGFfb3V0cHV0IiwiZGF0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsVUFBVSxTQUFWQSxPQUFVLElBQUs7QUFDbkIsU0FBT0MsRUFBRUMsV0FBRixLQUFrQkMsWUFBbEIsSUFBa0NDLE1BQU1KLE9BQU4sQ0FBY0MsQ0FBZCxDQUF6QztBQUNELENBRkQ7O0FBSUE7Ozs7Ozs7OztJQVNNSSxXO0FBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7QUFJQSx5QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFDeEIsUUFBTUMsV0FBVztBQUNmQyxlQUFTLEtBRE07QUFFZkMsaUJBQVcsQ0FGSTtBQUdmQyxzQkFBZ0IsQ0FIRDtBQUlmQyxtQkFBYSxDQUFDLEVBQUQsQ0FKRTtBQUtmQyxhQUFPO0FBTFEsS0FBakI7O0FBUUEsU0FBS0MsT0FBTCxHQUFlTixRQUFmO0FBQ0EsU0FBS08sVUFBTCxDQUFnQlIsT0FBaEI7O0FBRUEsU0FBS1MsS0FBTDtBQUNEOztBQUVEOzs7Ozs7OztnQ0FJWTtBQUNWLGFBQU8sS0FBS0YsT0FB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QkFHUTtBQUNOLFdBQUtGLEtBQUwsR0FBYSxFQUFiO0FBQ0EsV0FBS0gsT0FBTCxHQUFlLEVBQWY7QUFDQSxXQUFLRSxRQUFMLEdBQWdCLEVBQWhCO0FBQ0Q7Ozs7O0FBQ0Y7O2tCQUVjckIsVyIsImZpbGUiOiJ4bW0tcGhyYXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgaXNBcnJheSA9IHYgPT4ge1xuICByZXR1cm4gdi5jb25zdHJ1Y3RvciA9PT0gRmxvYXQzMkFycmF5IHx8IEFycmF5LmlzQXJyYXkodik7XG59O1xuXG4vKipcbiAqIFhNTSBjb21wYXRpYmxlIHBocmFzZSBidWlsZGVyIHV0aWxpdHkgPGJyIC8+XG4gKiBDbGFzcyB0byBlYXNlIHRoZSBjcmVhdGlvbiBvZiBYTU0gY29tcGF0aWJsZSBkYXRhIHJlY29yZGluZ3MsIGFrYSBwaHJhc2VzLiA8YnIgLz5cbiAqIFBocmFzZXMgYXJlIHR5cGljYWxseSBhcnJheXMgKGZsYXR0ZW5lZCBtYXRyaWNlcykgb2Ygc2l6ZSBOICogTSxcbiAqIE4gYmVpbmcgdGhlIHNpemUgb2YgYSB2ZWN0b3IgZWxlbWVudCwgYW5kIE0gdGhlIGxlbmd0aCBvZiB0aGUgcGhyYXNlIGl0c2VsZixcbiAqIHdyYXBwZWQgdG9nZXRoZXIgaW4gYW4gb2JqZWN0IHdpdGggYSBmZXcgc2V0dGluZ3MuXG4gKiBAY2xhc3NcbiAqL1xuXG5jbGFzcyBQaHJhc2VNYWtlciB7XG4gIC8qKlxuICAgKiBYTU0gcGhyYXNlIGNvbmZpZ3VyYXRpb24gb2JqZWN0LlxuICAgKiBAdHlwZWRlZiB4bW1QaHJhc2VDb25maWdcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQG5hbWUgeG1tUGhyYXNlQ29uZmlnXG4gICAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gYmltb2RhbCAtIEluZGljYXRlcyB3ZXRoZXIgcGhyYXNlIGRhdGEgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYmltb2RhbC5cbiAgICogSWYgdHJ1ZSwgdGhlIDxjb2RlPmRpbWVuc2lvbl9pbnB1dDwvY29kZT4gcHJvcGVydHkgd2lsbCBiZSB0YWtlbiBpbnRvIGFjY291bnQuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkaW1lbnNpb24gLSBTaXplIG9mIGEgcGhyYXNlJ3MgdmVjdG9yIGVsZW1lbnQuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkaW1lbnNpb25JbnB1dCAtIFNpemUgb2YgdGhlIHBhcnQgb2YgYW4gaW5wdXQgdmVjdG9yIGVsZW1lbnQgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdHJhaW5pbmcuXG4gICAqIFRoaXMgaW1wbGllcyB0aGF0IHRoZSByZXN0IG9mIHRoZSB2ZWN0b3IgKG9mIHNpemUgPGNvZGU+ZGltZW5zaW9uIC0gZGltZW5zaW9uX2lucHV0PC9jb2RlPilcbiAgICogd2lsbCBiZSB1c2VkIGZvciByZWdyZXNzaW9uLiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlLlxuICAgKiBAcHJvcGVydHkge0FycmF5LlN0cmluZ30gY29sdW1uX25hbWVzIC0gQXJyYXkgb2Ygc3RyaW5nIGlkZW50aWZpZXJzIGRlc2NyaWJpbmcgZWFjaCBzY2FsYXIgb2YgdGhlIHBocmFzZSdzIHZlY3RvciBlbGVtZW50cy5cbiAgICogVHlwaWNhbGx5IG9mIHNpemUgPGNvZGU+ZGltZW5zaW9uPC9jb2RlPi5cbiAgICogQHByb3BlcnR5IHtTdHJpbmd9IGxhYmVsIC0gVGhlIHN0cmluZyBpZGVudGlmaWVyIG9mIHRoZSBjbGFzcyB0aGUgcGhyYXNlIGJlbG9uZ3MgdG8uXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3htbVBocmFzZUNvbmZpZ30gb3B0aW9ucyAtIERlZmF1bHQgcGhyYXNlIGNvbmZpZ3VyYXRpb24uXG4gICAqIEBzZWUge0BsaW5rIGNvbmZpZ30uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBkZWZhdWx0cyA9IHtcbiAgICAgIGJpbW9kYWw6IGZhbHNlLFxuICAgICAgZGltZW5zaW9uOiAxLFxuICAgICAgZGltZW5zaW9uSW5wdXQ6IDAsXG4gICAgICBjb2x1bW5OYW1lczogWycnXSxcbiAgICAgIGxhYmVsOiAnJ1xuICAgIH1cblxuICAgIHRoaXMuX2NvbmZpZyA9IGRlZmF1bHRzO1xuICAgIHRoaXMuX3NldENvbmZpZyhvcHRpb25zKTtcblxuICAgIHRoaXMucmVzZXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGNvbmZpZ3VyYXRpb24uXG4gICAqIEByZXR1cm5zIHt4bW1QaHJhc2VDb25maWd9XG4gICAqL1xuICBnZXRDb25maWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbmZpZztcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjdXJyZW50IGNvbmZpZ3VyYXRpb24gd2l0aCB0aGUgcHJvdmlkZWQgaW5mb3JtYXRpb24uXG4gICAqIEBwYXJhbSB7eG1tUGhyYXNlQ29uZmlnfSBvcHRpb25zXG4gICAqL1xuICBzZXRDb25maWcob3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5fc2V0Q29uZmlnKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9zZXRDb25maWcob3B0aW9ucyA9IHt9KSB7XG4gICAgZm9yIChsZXQgcHJvcCBpbiBvcHRpb25zKSB7XG4gICAgICBpZiAocHJvcCA9PT0gJ2JpbW9kYWwnICYmIHR5cGVvZihvcHRpb25zW3Byb3BdKSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG4gICAgICB9IGVsc2UgaWYgKHByb3AgPT09ICdkaW1lbnNpb24nICYmIE51bWJlci5pc0ludGVnZXIob3B0aW9uc1twcm9wXSkpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbklucHV0JyAmJiBOdW1iZXIuaXNJbnRlZ2VyKG9wdGlvbnNbcHJvcF0pKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG4gICAgICB9IGVsc2UgaWYgKHByb3AgPT09ICdjb2x1bW5OYW1lcycgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zW3Byb3BdKSkge1xuICAgICAgICB0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdLnNsaWNlKDApO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnbGFiZWwnICYmIHR5cGVvZihvcHRpb25zW3Byb3BdKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcbiAgICAgIH1cbiAgICB9ICAgXG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIGFuIG9ic2VydmF0aW9uIHZlY3RvciB0byB0aGUgcGhyYXNlJ3MgZGF0YS4gTXVzdCBiZSBvZiBsZW5ndGggPGNvZGU+ZGltZW5zaW9uPC9jb2RlPi5cbiAgICogQHBhcmFtIHtBcnJheS5OdW1iZXJ9IG9icyAtIEFuIGlucHV0IHZlY3RvciwgYWthIG9ic2VydmF0aW9uLiBJZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlXG4gICAqIEB0aHJvd3MgV2lsbCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgaW5wdXQgdmVjdG9yIGRvZXNuJ3QgbWF0Y2ggdGhlIGNvbmZpZy5cbiAgICovXG4gIGFkZE9ic2VydmF0aW9uKG9icykge1xuICAgIC8vIGNoZWNrIGlucHV0IHZhbGlkaXR5XG4gICAgY29uc3QgYmFkTGVuZ3RoTXNnID0gJ0JhZCBpbnB1dCBsZW5ndGg6IG9ic2VydmF0aW9uIGxlbmd0aCBtdXN0IG1hdGNoIHBocmFzZSBkaW1lbnNpb24nO1xuICAgIGNvbnN0IGJhZFR5cGVNc2cgPSAnQmFkIGRhdGEgdHlwZTogYWxsIG9ic2VydmF0aW9uIHZhbHVlcyBtdXN0IGJlIG51bWJlcnMnO1xuXG4gICAgaWYgKG9icy5sZW5ndGggIT09IHRoaXMuX2NvbmZpZy5kaW1lbnNpb24gfHxcbiAgICAgICAgKHR5cGVvZihvYnMpID09PSAnbnVtYmVyJyAmJiB0aGlzLl9jb25maWcuZGltZW5zaW9uICE9PSAxKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGJhZExlbmd0aE1zZyk7XG4gICAgfVxuXG4gICAgaWYgKGlzQXJyYXkob2JzKSkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHR5cGVvZihvYnNbaV0pICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihiYWRUeXBlTXNnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mKG9icyAhPT0gJ251bWJlcicpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYmFkVHlwZU1zZyk7XG4gICAgfVxuXG4gICAgLy8gYWRkIHZhbHVlKHMpIHRvIGludGVybmFsIGFycmF5c1xuICAgIGlmICh0aGlzLl9jb25maWcuYmltb2RhbCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9jb25maWcuZGltZW5zaW9uSW5wdXQ7IGkrKykge1xuICAgICAgICB0aGlzLl9kYXRhSW4ucHVzaChvYnNbaV0pO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBpID0gdGhpcy5fY29uZmlnLmRpbWVuc2lvbklucHV0OyBpIDwgdGhpcy5fY29uZmlnLmRpbWVuc2lvbjsgaSsrKSB7XG4gICAgICAgIHRoaXMuX2RhdGFPdXQucHVzaChvYnNbaV0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaXNBcnJheShvYnMpKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdGhpcy5fZGF0YUluLnB1c2gob2JzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZGF0YS5wdXNoKG9icyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEEgdmFsaWQgWE1NIHBocmFzZSwgcmVhZHkgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBYTU0gbGlicmFyeS5cbiAgICogQHR5cGVkZWYgeG1tUGhyYXNlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBuYW1lIHhtbVBocmFzZVxuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IGJpbW9kYWwgLSBJbmRpY2F0ZXMgd2V0aGVyIHBocmFzZSBkYXRhIHNob3VsZCBiZSBjb25zaWRlcmVkIGJpbW9kYWwuXG4gICAqIElmIHRydWUsIHRoZSA8Y29kZT5kaW1lbnNpb25faW5wdXQ8L2NvZGU+IHByb3BlcnR5IHdpbGwgYmUgdGFrZW4gaW50byBhY2NvdW50LlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uIC0gU2l6ZSBvZiBhIHBocmFzZSdzIHZlY3RvciBlbGVtZW50LlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uX2lucHV0IC0gU2l6ZSBvZiB0aGUgcGFydCBvZiBhbiBpbnB1dCB2ZWN0b3IgZWxlbWVudCB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0cmFpbmluZy5cbiAgICogVGhpcyBpbXBsaWVzIHRoYXQgdGhlIHJlc3Qgb2YgdGhlIHZlY3RvciAob2Ygc2l6ZSA8Y29kZT5kaW1lbnNpb24gLSBkaW1lbnNpb25faW5wdXQ8L2NvZGU+KVxuICAgKiB3aWxsIGJlIHVzZWQgZm9yIHJlZ3Jlc3Npb24uIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIHRydWUuXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuU3RyaW5nfSBjb2x1bW5fbmFtZXMgLSBBcnJheSBvZiBzdHJpbmcgaWRlbnRpZmllcnMgZGVzY3JpYmluZyBlYWNoIHNjYWxhciBvZiB0aGUgcGhyYXNlJ3MgdmVjdG9yIGVsZW1lbnRzLlxuICAgKiBUeXBpY2FsbHkgb2Ygc2l6ZSA8Y29kZT5kaW1lbnNpb248L2NvZGU+LlxuICAgKiBAcHJvcGVydHkge1N0cmluZ30gbGFiZWwgLSBUaGUgc3RyaW5nIGlkZW50aWZpZXIgb2YgdGhlIGNsYXNzIHRoZSBwaHJhc2UgYmVsb25ncyB0by5cbiAgICogQHByb3BlcnR5IHtBcnJheS5OdW1iZXJ9IGRhdGEgLSBUaGUgcGhyYXNlJ3MgZGF0YSwgY29udGFpbmluZyBhbGwgdGhlIHZlY3RvcnMgZmxhdHRlbmVkIGludG8gYSBzaW5nbGUgb25lLlxuICAgKiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyBmYWxzZS5cbiAgICogQHByb3BlcnR5IHtBcnJheS5OdW1iZXJ9IGRhdGFfaW5wdXQgLSBUaGUgcGhyYXNlJ3MgZGF0YSB3aGljaCB3aWxsIGJlIHVzZWQgZm9yIHRyYWluaW5nLCBmbGF0dGVuZWQgaW50byBhIHNpbmdsZSB2ZWN0b3IuXG4gICAqIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIHRydWUuXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuTnVtYmVyfSBkYXRhX291dHB1dCAtIFRoZSBwaHJhc2UncyBkYXRhIHdoaWNoIHdpbGwgYmUgdXNlZCBmb3IgcmVncmVzc2lvbiwgZmxhdHRlbmVkIGludG8gYSBzaW5nbGUgdmVjdG9yLlxuICAgKiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlLlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gbGVuZ3RoIC0gVGhlIGxlbmd0aCBvZiB0aGUgcGhyYXNlLCBlLmcuIG9uZSBvZiB0aGUgZm9sbG93aW5nIDpcbiAgICogPGxpIHN0eWxlPVwibGlzdC1zdHlsZS10eXBlOiBub25lO1wiPlxuICAgKiA8dWw+PGNvZGU+ZGF0YS5sZW5ndGggLyBkaW1lbnNpb248L2NvZGU+PC91bD5cbiAgICogPHVsPjxjb2RlPmRhdGFfaW5wdXQubGVuZ3RoIC8gZGltZW5zaW9uX2lucHV0PC9jb2RlPjwvdWw+XG4gICAqIDx1bD48Y29kZT5kYXRhX291dHB1dC5sZW5ndGggLyBkaW1lbnNpb25fb3V0cHV0PC9jb2RlPjwvdWw+XG4gICAqIDwvbGk+XG4gICAqL1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgdmFsaWQgWE1NIHBocmFzZSBjcmVhdGVkIGZyb20gdGhlIGNvbmZpZyBhbmQgdGhlIHJlY29yZGVkIGRhdGEuXG4gICAqIEByZXR1cm5zIHt4bW1QaHJhc2V9XG4gICAqL1xuICBnZXRQaHJhc2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldFBocmFzZSgpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9nZXRQaHJhc2UoKSB7XG4gICAgbGV0IHJlcyA9IHtcbiAgICAgIGJpbW9kYWw6IHRoaXMuX2NvbmZpZy5iaW1vZGFsLFxuICAgICAgY29sdW1uX25hbWVzOiB0aGlzLl9jb25maWcuY29sdW1uTmFtZXMsXG4gICAgICBkaW1lbnNpb246IHRoaXMuX2NvbmZpZy5kaW1lbnNpb24sXG4gICAgICBkaW1lbnNpb25faW5wdXQ6IHRoaXMuX2NvbmZpZy5kaW1lbnNpb25JbnB1dCxcbiAgICAgIGxhYmVsOiB0aGlzLl9jb25maWcubGFiZWwsXG4gICAgICBsZW5ndGg6IHRoaXMuX2NvbmZpZy5iaW1vZGFsXG4gICAgICAgICAgICA/IHRoaXMuX2RhdGFJbi5sZW5ndGggLyB0aGlzLl9jb25maWcuZGltZW5zaW9uSW5wdXRcbiAgICAgICAgICAgIDogdGhpcy5fZGF0YS5sZW5ndGggLyB0aGlzLl9jb25maWcuZGltZW5zaW9uICAgICAgXG4gICAgfTtcblxuICAgIGlmICh0aGlzLl9jb25maWcuYmltb2RhbCkge1xuICAgICAgcmVzLmRhdGFfaW5wdXQgPSB0aGlzLl9kYXRhSW4uc2xpY2UoMCk7XG4gICAgICByZXMuZGF0YV9vdXRwdXQgPSB0aGlzLl9kYXRhT3V0LnNsaWNlKDApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMuZGF0YSA9IHRoaXMuX2RhdGEuc2xpY2UoMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlczsgICAgXG4gIH1cblxuICAvKipcbiAgICogQ2xlYXIgdGhlIHBocmFzZSdzIGRhdGEgc28gdGhhdCBhIG5ldyBvbmUgaXMgcmVhZHkgdG8gYmUgcmVjb3JkZWQuXG4gICAqL1xuICByZXNldCgpIHtcbiAgICB0aGlzLl9kYXRhID0gW107XG4gICAgdGhpcy5fZGF0YUluID0gW107XG4gICAgdGhpcy5fZGF0YU91dCA9IFtdO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQaHJhc2VNYWtlcjsiXX0=