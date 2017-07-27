'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInhtbS1waHJhc2UuanMiXSwibmFtZXMiOlsiUGhyYXNlTWFrZXIiLCJvcHRpb25zIiwiZGVmYXVsdHMiLCJiaW1vZGFsIiwiZGltZW5zaW9uIiwiZGltZW5zaW9uSW5wdXQiLCJjb2x1bW5OYW1lcyIsImxhYmVsIiwiX2NvbmZpZyIsIl9zZXRDb25maWciLCJyZXNldCIsInByb3AiLCJBcnJheSIsImlzQXJyYXkiLCJzbGljZSIsIm9icyIsImJhZExlbmd0aE1zZyIsImJhZFR5cGVNc2ciLCJsZW5ndGgiLCJFcnJvciIsInZhbCIsIl9kYXRhSW4iLCJjb25jYXQiLCJfZGF0YU91dCIsIl9kYXRhIiwicHVzaCIsIl9nZXRQaHJhc2UiLCJyZXMiLCJjb2x1bW5fbmFtZXMiLCJkaW1lbnNpb25faW5wdXQiLCJkYXRhX2lucHV0IiwiZGF0YV9vdXRwdXQiLCJkYXRhIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7OztJQVNNQSxXO0FBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7QUFJQSx5QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFDeEIsUUFBTUMsV0FBVztBQUNmQyxlQUFTLEtBRE07QUFFZkMsaUJBQVcsQ0FGSTtBQUdmQyxzQkFBZ0IsQ0FIRDtBQUlmQyxtQkFBYSxDQUFDLEVBQUQsQ0FKRTtBQUtmQyxhQUFPO0FBTFEsS0FBakI7O0FBUUEsU0FBS0MsT0FBTCxHQUFlTixRQUFmO0FBQ0EsU0FBS08sVUFBTCxDQUFnQlIsT0FBaEI7O0FBRUEsU0FBS1MsS0FBTDtBQUNEOztBQUVEOzs7Ozs7OztnQ0FJWTtBQUNWLGFBQU8sS0FBS0YsT0FBWjtBQUNEOztBQUVEOzs7Ozs7O2dDQUl3QjtBQUFBLFVBQWRQLE9BQWMsdUVBQUosRUFBSTs7QUFDdEIsV0FBS1EsVUFBTCxDQUFnQlIsT0FBaEI7QUFDRDs7QUFFRDs7OztpQ0FDeUI7QUFBQSxVQUFkQSxPQUFjLHVFQUFKLEVBQUk7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QTRCQTs7Ozs7OztnQ0FJWTtBQUNWLGFBQU8sS0FBS1csVUFBTCxFQUFQO0FBQ0Q7O0FBRUQ7Ozs7aUNBQ2E7QUFDWCxVQUFJQyxNQUFNO0FBQ1J4QixpQkFBUyxLQUFLSyxPQUFMLENBQWFMLE9BRGQ7QUFFUnlCLHNCQUFjLEtBQUtwQixPQUFMLENBQWFGLFdBRm5CO0FBR1JGLG1CQUFXLEtBQUtJLE9BQUwsQ0FBYUosU0FIaEI7QUFJUnlCLHlCQUFpQixLQUFLckIsT0FBTCxDQUFhSCxjQUp0QjtBQUtSRSxlQUFPLEtBQUtDLE9BQUwsQ0FBYUQsS0FMWjtBQU1SVyxnQkFBUSxLQUFLVixPQUFMLENBQWFMLE9BQWIsR0FDQSxLQUFLa0IsT0FBTCxDQUFhSCxNQUFiLEdBQXNCLEtBQUtWLE9BQUwsQ0FBYUgsY0FEbkMsR0FFQSxLQUFLbUIsS0FBTCxDQUFXTixNQUFYLEdBQW9CLEtBQUtWLE9BQUwsQ0FBYUo7QUFSakMsT0FBVjs7QUFXQSxVQUFJLEtBQUtJLE9BQUwsQ0FBYUwsT0FBakIsRUFBMEI7QUFDeEJ3QixZQUFJRyxVQUFKLEdBQWlCLEtBQUtULE9BQUwsQ0FBYVAsS0FBYixDQUFtQixDQUFuQixDQUFqQjtBQUNBYSxZQUFJSSxXQUFKLEdBQWtCLEtBQUtSLFFBQUwsQ0FBY1QsS0FBZCxDQUFvQixDQUFwQixDQUFsQjtBQUNELE9BSEQsTUFHTztBQUNMYSxZQUFJSyxJQUFKLEdBQVcsS0FBS1IsS0FBTCxDQUFXVixLQUFYLENBQWlCLENBQWpCLENBQVg7QUFDRDs7QUFFRCxhQUFPYSxHQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozs0QkFHUTtBQUNOLFdBQUtILEtBQUwsR0FBYSxFQUFiO0FBQ0EsV0FBS0gsT0FBTCxHQUFlLEVBQWY7QUFDQSxXQUFLRSxRQUFMLEdBQWdCLEVBQWhCO0FBQ0Q7Ozs7O0FBQ0Y7O2tCQUVjdkIsVyIsImZpbGUiOiJ4bW0tcGhyYXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBYTU0gY29tcGF0aWJsZSBwaHJhc2UgYnVpbGRlciB1dGlsaXR5IDxiciAvPlxuICogQ2xhc3MgdG8gZWFzZSB0aGUgY3JlYXRpb24gb2YgWE1NIGNvbXBhdGlibGUgZGF0YSByZWNvcmRpbmdzLCBha2EgcGhyYXNlcy4gPGJyIC8+XG4gKiBQaHJhc2VzIGFyZSB0eXBpY2FsbHkgYXJyYXlzIChmbGF0dGVuZWQgbWF0cmljZXMpIG9mIHNpemUgTiAqIE0sXG4gKiBOIGJlaW5nIHRoZSBzaXplIG9mIGEgdmVjdG9yIGVsZW1lbnQsIGFuZCBNIHRoZSBsZW5ndGggb2YgdGhlIHBocmFzZSBpdHNlbGYsXG4gKiB3cmFwcGVkIHRvZ2V0aGVyIGluIGFuIG9iamVjdCB3aXRoIGEgZmV3IHNldHRpbmdzLlxuICogQGNsYXNzXG4gKi9cblxuY2xhc3MgUGhyYXNlTWFrZXIge1xuICAvKipcbiAgICogWE1NIHBocmFzZSBjb25maWd1cmF0aW9uIG9iamVjdC5cbiAgICogQHR5cGVkZWYgeG1tUGhyYXNlQ29uZmlnXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBuYW1lIHhtbVBocmFzZUNvbmZpZ1xuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IGJpbW9kYWwgLSBJbmRpY2F0ZXMgd2V0aGVyIHBocmFzZSBkYXRhIHNob3VsZCBiZSBjb25zaWRlcmVkIGJpbW9kYWwuXG4gICAqIElmIHRydWUsIHRoZSA8Y29kZT5kaW1lbnNpb25faW5wdXQ8L2NvZGU+IHByb3BlcnR5IHdpbGwgYmUgdGFrZW4gaW50byBhY2NvdW50LlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uIC0gU2l6ZSBvZiBhIHBocmFzZSdzIHZlY3RvciBlbGVtZW50LlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uSW5wdXQgLSBTaXplIG9mIHRoZSBwYXJ0IG9mIGFuIGlucHV0IHZlY3RvciBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRyYWluaW5nLlxuICAgKiBUaGlzIGltcGxpZXMgdGhhdCB0aGUgcmVzdCBvZiB0aGUgdmVjdG9yIChvZiBzaXplIDxjb2RlPmRpbWVuc2lvbiAtIGRpbWVuc2lvbl9pbnB1dDwvY29kZT4pXG4gICAqIHdpbGwgYmUgdXNlZCBmb3IgcmVncmVzc2lvbi4gT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cbiAgICogQHByb3BlcnR5IHtBcnJheS5TdHJpbmd9IGNvbHVtbl9uYW1lcyAtIEFycmF5IG9mIHN0cmluZyBpZGVudGlmaWVycyBkZXNjcmliaW5nIGVhY2ggc2NhbGFyIG9mIHRoZSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudHMuXG4gICAqIFR5cGljYWxseSBvZiBzaXplIDxjb2RlPmRpbWVuc2lvbjwvY29kZT4uXG4gICAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBsYWJlbCAtIFRoZSBzdHJpbmcgaWRlbnRpZmllciBvZiB0aGUgY2xhc3MgdGhlIHBocmFzZSBiZWxvbmdzIHRvLlxuICAgKi9cblxuICAvKipcbiAgICogQHBhcmFtIHt4bW1QaHJhc2VDb25maWd9IG9wdGlvbnMgLSBEZWZhdWx0IHBocmFzZSBjb25maWd1cmF0aW9uLlxuICAgKiBAc2VlIHtAbGluayBjb25maWd9LlxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgZGVmYXVsdHMgPSB7XG4gICAgICBiaW1vZGFsOiBmYWxzZSxcbiAgICAgIGRpbWVuc2lvbjogMSxcbiAgICAgIGRpbWVuc2lvbklucHV0OiAwLFxuICAgICAgY29sdW1uTmFtZXM6IFsnJ10sXG4gICAgICBsYWJlbDogJydcbiAgICB9XG5cbiAgICB0aGlzLl9jb25maWcgPSBkZWZhdWx0cztcbiAgICB0aGlzLl9zZXRDb25maWcob3B0aW9ucyk7XG5cbiAgICB0aGlzLnJlc2V0KCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uLlxuICAgKiBAcmV0dXJucyB7eG1tUGhyYXNlQ29uZmlnfVxuICAgKi9cbiAgZ2V0Q29uZmlnKCkge1xuICAgIHJldHVybiB0aGlzLl9jb25maWc7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uIHdpdGggdGhlIHByb3ZpZGVkIGluZm9ybWF0aW9uLlxuICAgKiBAcGFyYW0ge3htbVBocmFzZUNvbmZpZ30gb3B0aW9uc1xuICAgKi9cbiAgc2V0Q29uZmlnKG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuX3NldENvbmZpZyhvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfc2V0Q29uZmlnKG9wdGlvbnMgPSB7fSkge1xuICAgIGZvciAobGV0IHByb3AgaW4gb3B0aW9ucykge1xuICAgICAgaWYgKHByb3AgPT09ICdiaW1vZGFsJyAmJiB0eXBlb2Yob3B0aW9uc1twcm9wXSkgPT09ICdib29sZWFuJykge1xuICAgICAgICB0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnZGltZW5zaW9uJyAmJiBOdW1iZXIuaXNJbnRlZ2VyKG9wdGlvbnNbcHJvcF0pKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG4gICAgICB9IGVsc2UgaWYgKHByb3AgPT09ICdkaW1lbnNpb25JbnB1dCcgJiYgTnVtYmVyLmlzSW50ZWdlcihvcHRpb25zW3Byb3BdKSkge1xuICAgICAgICB0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnY29sdW1uTmFtZXMnICYmIEFycmF5LmlzQXJyYXkob3B0aW9uc1twcm9wXSkpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXS5zbGljZSgwKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2xhYmVsJyAmJiB0eXBlb2Yob3B0aW9uc1twcm9wXSkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG4gICAgICB9XG4gICAgfSAgIFxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZCBhbiBvYnNlcnZhdGlvbiB2ZWN0b3IgdG8gdGhlIHBocmFzZSdzIGRhdGEuIE11c3QgYmUgb2YgbGVuZ3RoIDxjb2RlPmRpbWVuc2lvbjwvY29kZT4uXG4gICAqIEBwYXJhbSB7QXJyYXkuTnVtYmVyfSBvYnMgLSBBbiBpbnB1dCB2ZWN0b3IsIGFrYSBvYnNlcnZhdGlvbi4gSWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZVxuICAgKiBAdGhyb3dzIFdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGlucHV0IHZlY3RvciBkb2Vzbid0IG1hdGNoIHRoZSBjb25maWcuXG4gICAqL1xuICBhZGRPYnNlcnZhdGlvbihvYnMpIHtcbiAgICAvLyBjaGVjayBpbnB1dCB2YWxpZGl0eVxuICAgIGNvbnN0IGJhZExlbmd0aE1zZyA9ICdCYWQgaW5wdXQgbGVuZ3RoOiBvYnNlcnZhdGlvbiBsZW5ndGggbXVzdCBtYXRjaCBwaHJhc2UgZGltZW5zaW9uJztcbiAgICBjb25zdCBiYWRUeXBlTXNnID0gJ0JhZCBkYXRhIHR5cGU6IGFsbCBvYnNlcnZhdGlvbiB2YWx1ZXMgbXVzdCBiZSBudW1iZXJzJztcblxuICAgIGlmIChvYnMubGVuZ3RoICE9PSB0aGlzLl9jb25maWcuZGltZW5zaW9uIHx8XG4gICAgICAgICh0eXBlb2Yob2JzKSA9PT0gJ251bWJlcicgJiYgdGhpcy5fY29uZmlnLmRpbWVuc2lvbiAhPT0gMSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihiYWRMZW5ndGhNc2cpO1xuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KG9icykpIHtcbiAgICAgIGZvciAobGV0IHZhbCBvZiBvYnMpIHtcbiAgICAgICAgaWYgKHR5cGVvZih2YWwpICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihiYWRUeXBlTXNnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mKG9icyAhPT0gJ251bWJlcicpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYmFkVHlwZU1zZyk7XG4gICAgfVxuXG4gICAgLy8gYWRkIHZhbHVlKHMpIHRvIGludGVybmFsIGFycmF5c1xuICAgIGlmICh0aGlzLl9jb25maWcuYmltb2RhbCkge1xuICAgICAgdGhpcy5fZGF0YUluID0gdGhpcy5fZGF0YUluLmNvbmNhdChcbiAgICAgICAgb2JzLnNsaWNlKDAsIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25JbnB1dClcbiAgICAgICk7XG4gICAgICB0aGlzLl9kYXRhT3V0ID0gdGhpcy5fZGF0YU91dC5jb25jYXQoXG4gICAgICAgIG9icy5zbGljZSh0aGlzLl9jb25maWcuZGltZW5zaW9uSW5wdXQpXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShvYnMpKSB7XG4gICAgICAgIHRoaXMuX2RhdGEgPSB0aGlzLl9kYXRhLmNvbmNhdChvYnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZGF0YS5wdXNoKG9icyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEEgdmFsaWQgWE1NIHBocmFzZSwgcmVhZHkgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBYTU0gbGlicmFyeS5cbiAgICogQHR5cGVkZWYgeG1tUGhyYXNlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBuYW1lIHhtbVBocmFzZVxuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IGJpbW9kYWwgLSBJbmRpY2F0ZXMgd2V0aGVyIHBocmFzZSBkYXRhIHNob3VsZCBiZSBjb25zaWRlcmVkIGJpbW9kYWwuXG4gICAqIElmIHRydWUsIHRoZSA8Y29kZT5kaW1lbnNpb25faW5wdXQ8L2NvZGU+IHByb3BlcnR5IHdpbGwgYmUgdGFrZW4gaW50byBhY2NvdW50LlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uIC0gU2l6ZSBvZiBhIHBocmFzZSdzIHZlY3RvciBlbGVtZW50LlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZGltZW5zaW9uX2lucHV0IC0gU2l6ZSBvZiB0aGUgcGFydCBvZiBhbiBpbnB1dCB2ZWN0b3IgZWxlbWVudCB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0cmFpbmluZy5cbiAgICogVGhpcyBpbXBsaWVzIHRoYXQgdGhlIHJlc3Qgb2YgdGhlIHZlY3RvciAob2Ygc2l6ZSA8Y29kZT5kaW1lbnNpb24gLSBkaW1lbnNpb25faW5wdXQ8L2NvZGU+KVxuICAgKiB3aWxsIGJlIHVzZWQgZm9yIHJlZ3Jlc3Npb24uIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIHRydWUuXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuU3RyaW5nfSBjb2x1bW5fbmFtZXMgLSBBcnJheSBvZiBzdHJpbmcgaWRlbnRpZmllcnMgZGVzY3JpYmluZyBlYWNoIHNjYWxhciBvZiB0aGUgcGhyYXNlJ3MgdmVjdG9yIGVsZW1lbnRzLlxuICAgKiBUeXBpY2FsbHkgb2Ygc2l6ZSA8Y29kZT5kaW1lbnNpb248L2NvZGU+LlxuICAgKiBAcHJvcGVydHkge1N0cmluZ30gbGFiZWwgLSBUaGUgc3RyaW5nIGlkZW50aWZpZXIgb2YgdGhlIGNsYXNzIHRoZSBwaHJhc2UgYmVsb25ncyB0by5cbiAgICogQHByb3BlcnR5IHtBcnJheS5OdW1iZXJ9IGRhdGEgLSBUaGUgcGhyYXNlJ3MgZGF0YSwgY29udGFpbmluZyBhbGwgdGhlIHZlY3RvcnMgZmxhdHRlbmVkIGludG8gYSBzaW5nbGUgb25lLlxuICAgKiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyBmYWxzZS5cbiAgICogQHByb3BlcnR5IHtBcnJheS5OdW1iZXJ9IGRhdGFfaW5wdXQgLSBUaGUgcGhyYXNlJ3MgZGF0YSB3aGljaCB3aWxsIGJlIHVzZWQgZm9yIHRyYWluaW5nLCBmbGF0dGVuZWQgaW50byBhIHNpbmdsZSB2ZWN0b3IuXG4gICAqIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIHRydWUuXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuTnVtYmVyfSBkYXRhX291dHB1dCAtIFRoZSBwaHJhc2UncyBkYXRhIHdoaWNoIHdpbGwgYmUgdXNlZCBmb3IgcmVncmVzc2lvbiwgZmxhdHRlbmVkIGludG8gYSBzaW5nbGUgdmVjdG9yLlxuICAgKiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlLlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gbGVuZ3RoIC0gVGhlIGxlbmd0aCBvZiB0aGUgcGhyYXNlLCBlLmcuIG9uZSBvZiB0aGUgZm9sbG93aW5nIDpcbiAgICogPGxpIHN0eWxlPVwibGlzdC1zdHlsZS10eXBlOiBub25lO1wiPlxuICAgKiA8dWw+PGNvZGU+ZGF0YS5sZW5ndGggLyBkaW1lbnNpb248L2NvZGU+PC91bD5cbiAgICogPHVsPjxjb2RlPmRhdGFfaW5wdXQubGVuZ3RoIC8gZGltZW5zaW9uX2lucHV0PC9jb2RlPjwvdWw+XG4gICAqIDx1bD48Y29kZT5kYXRhX291dHB1dC5sZW5ndGggLyBkaW1lbnNpb25fb3V0cHV0PC9jb2RlPjwvdWw+XG4gICAqIDwvbGk+XG4gICAqL1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgdmFsaWQgWE1NIHBocmFzZSBjcmVhdGVkIGZyb20gdGhlIGNvbmZpZyBhbmQgdGhlIHJlY29yZGVkIGRhdGEuXG4gICAqIEByZXR1cm5zIHt4bW1QaHJhc2V9XG4gICAqL1xuICBnZXRQaHJhc2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldFBocmFzZSgpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9nZXRQaHJhc2UoKSB7XG4gICAgbGV0IHJlcyA9IHtcbiAgICAgIGJpbW9kYWw6IHRoaXMuX2NvbmZpZy5iaW1vZGFsLFxuICAgICAgY29sdW1uX25hbWVzOiB0aGlzLl9jb25maWcuY29sdW1uTmFtZXMsXG4gICAgICBkaW1lbnNpb246IHRoaXMuX2NvbmZpZy5kaW1lbnNpb24sXG4gICAgICBkaW1lbnNpb25faW5wdXQ6IHRoaXMuX2NvbmZpZy5kaW1lbnNpb25JbnB1dCxcbiAgICAgIGxhYmVsOiB0aGlzLl9jb25maWcubGFiZWwsXG4gICAgICBsZW5ndGg6IHRoaXMuX2NvbmZpZy5iaW1vZGFsXG4gICAgICAgICAgICA/IHRoaXMuX2RhdGFJbi5sZW5ndGggLyB0aGlzLl9jb25maWcuZGltZW5zaW9uSW5wdXRcbiAgICAgICAgICAgIDogdGhpcy5fZGF0YS5sZW5ndGggLyB0aGlzLl9jb25maWcuZGltZW5zaW9uICAgICAgXG4gICAgfTtcblxuICAgIGlmICh0aGlzLl9jb25maWcuYmltb2RhbCkge1xuICAgICAgcmVzLmRhdGFfaW5wdXQgPSB0aGlzLl9kYXRhSW4uc2xpY2UoMCk7XG4gICAgICByZXMuZGF0YV9vdXRwdXQgPSB0aGlzLl9kYXRhT3V0LnNsaWNlKDApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMuZGF0YSA9IHRoaXMuX2RhdGEuc2xpY2UoMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlczsgICAgXG4gIH1cblxuICAvKipcbiAgICogQ2xlYXIgdGhlIHBocmFzZSdzIGRhdGEgc28gdGhhdCBhIG5ldyBvbmUgaXMgcmVhZHkgdG8gYmUgcmVjb3JkZWQuXG4gICAqL1xuICByZXNldCgpIHtcbiAgICB0aGlzLl9kYXRhID0gW107XG4gICAgdGhpcy5fZGF0YUluID0gW107XG4gICAgdGhpcy5fZGF0YU91dCA9IFtdO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQaHJhc2VNYWtlcjsiXX0=