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

  /***
   * XMM phrase configuration object.
   * Only legal fields will be checked before being added to the config, others will be ignored
   * @type {XmmPhraseConfig}
   * @deprecated since version 0.2.0
   */
  // get config() {
  //   return this._config;
  // }

  // set config(options = {}) {
  //   this._setConfig(options);
  // }

  // new API (b-ma tip : don' use accessors if there is some magic behind,
  // which is the case in _setConfig)
  // keeping accessors for backwards compatibility

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

    /***
     * A valid XMM phrase, ready to be processed by the XMM library.
     * @readonly
     * @type {xmmPhrase}
     */
    // get phrase() {
    //   return this._getPhrase();
    // }

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInhtbS1waHJhc2UuanMiXSwibmFtZXMiOlsiUGhyYXNlTWFrZXIiLCJvcHRpb25zIiwiZGVmYXVsdHMiLCJiaW1vZGFsIiwiZGltZW5zaW9uIiwiZGltZW5zaW9uSW5wdXQiLCJjb2x1bW5OYW1lcyIsImxhYmVsIiwiX2NvbmZpZyIsIl9zZXRDb25maWciLCJyZXNldCIsInByb3AiLCJBcnJheSIsImlzQXJyYXkiLCJzbGljZSIsIm9icyIsImJhZExlbmd0aE1zZyIsImJhZFR5cGVNc2ciLCJsZW5ndGgiLCJFcnJvciIsInZhbCIsIl9kYXRhSW4iLCJjb25jYXQiLCJfZGF0YU91dCIsIl9kYXRhIiwicHVzaCIsIl9nZXRQaHJhc2UiLCJjb2x1bW5fbmFtZXMiLCJkaW1lbnNpb25faW5wdXQiLCJkYXRhIiwiZGF0YV9pbnB1dCIsImRhdGFfb3V0cHV0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7OztJQVNNQSxXO0FBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7QUFJQSx5QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFDeEIsUUFBTUMsV0FBVztBQUNmQyxlQUFTLEtBRE07QUFFZkMsaUJBQVcsQ0FGSTtBQUdmQyxzQkFBZ0IsQ0FIRDtBQUlmQyxtQkFBYSxDQUFDLEVBQUQsQ0FKRTtBQUtmQyxhQUFPO0FBTFEsS0FBakI7O0FBUUEsU0FBS0MsT0FBTCxHQUFlTixRQUFmO0FBQ0EsU0FBS08sVUFBTCxDQUFnQlIsT0FBaEI7O0FBRUEsU0FBS1MsS0FBTDtBQUNEOztBQUVEOzs7Ozs7QUFNQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7Ozs7Z0NBSVk7QUFDVixhQUFPLEtBQUtGLE9BQVo7QUFDRDs7QUFFRDs7Ozs7OztnQ0FJd0I7QUFBQSxVQUFkUCxPQUFjLHVFQUFKLEVBQUk7O0FBQ3RCLFdBQUtRLFVBQUwsQ0FBZ0JSLE9BQWhCO0FBQ0Q7O0FBRUQ7Ozs7aUNBQ3lCO0FBQUEsVUFBZEEsT0FBYyx1RUFBSixFQUFJOztBQUN2QixXQUFLLElBQUlVLElBQVQsSUFBaUJWLE9BQWpCLEVBQTBCO0FBQ3hCLFlBQUlVLFNBQVMsU0FBVCxJQUFzQixPQUFPVixRQUFRVSxJQUFSLENBQVAsS0FBMEIsU0FBcEQsRUFBK0Q7QUFDN0QsZUFBS0gsT0FBTCxDQUFhRyxJQUFiLElBQXFCVixRQUFRVSxJQUFSLENBQXJCO0FBQ0QsU0FGRCxNQUVPLElBQUlBLFNBQVMsV0FBVCxJQUF3Qix5QkFBaUJWLFFBQVFVLElBQVIsQ0FBakIsQ0FBNUIsRUFBNkQ7QUFDbEUsZUFBS0gsT0FBTCxDQUFhRyxJQUFiLElBQXFCVixRQUFRVSxJQUFSLENBQXJCO0FBQ0QsU0FGTSxNQUVBLElBQUlBLFNBQVMsZ0JBQVQsSUFBNkIseUJBQWlCVixRQUFRVSxJQUFSLENBQWpCLENBQWpDLEVBQWtFO0FBQ3ZFLGVBQUtILE9BQUwsQ0FBYUcsSUFBYixJQUFxQlYsUUFBUVUsSUFBUixDQUFyQjtBQUNELFNBRk0sTUFFQSxJQUFJQSxTQUFTLGFBQVQsSUFBMEJDLE1BQU1DLE9BQU4sQ0FBY1osUUFBUVUsSUFBUixDQUFkLENBQTlCLEVBQTREO0FBQ2pFLGVBQUtILE9BQUwsQ0FBYUcsSUFBYixJQUFxQlYsUUFBUVUsSUFBUixFQUFjRyxLQUFkLENBQW9CLENBQXBCLENBQXJCO0FBQ0QsU0FGTSxNQUVBLElBQUlILFNBQVMsT0FBVCxJQUFvQixPQUFPVixRQUFRVSxJQUFSLENBQVAsS0FBMEIsUUFBbEQsRUFBNEQ7QUFDakUsZUFBS0gsT0FBTCxDQUFhRyxJQUFiLElBQXFCVixRQUFRVSxJQUFSLENBQXJCO0FBQ0Q7QUFDRjtBQUNGOztBQUVEOzs7Ozs7OzttQ0FLZUksRyxFQUFLO0FBQ2xCO0FBQ0EsVUFBTUMsZUFBZSxrRUFBckI7QUFDQSxVQUFNQyxhQUFhLHVEQUFuQjs7QUFFQSxVQUFJRixJQUFJRyxNQUFKLEtBQWUsS0FBS1YsT0FBTCxDQUFhSixTQUE1QixJQUNDLE9BQU9XLEdBQVAsS0FBZ0IsUUFBaEIsSUFBNEIsS0FBS1AsT0FBTCxDQUFhSixTQUFiLEtBQTJCLENBRDVELEVBQ2dFO0FBQzlELGNBQU0sSUFBSWUsS0FBSixDQUFVSCxZQUFWLENBQU47QUFDRDs7QUFFRCxVQUFJSixNQUFNQyxPQUFOLENBQWNFLEdBQWQsQ0FBSixFQUF3QjtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUN0QiwwREFBZ0JBLEdBQWhCLDRHQUFxQjtBQUFBLGdCQUFaSyxHQUFZOztBQUNuQixnQkFBSSxPQUFPQSxHQUFQLEtBQWdCLFFBQXBCLEVBQThCO0FBQzVCLG9CQUFNLElBQUlELEtBQUosQ0FBVUYsVUFBVixDQUFOO0FBQ0Q7QUFDRjtBQUxxQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBTXZCLE9BTkQsTUFNTywwQkFBV0YsUUFBUSxRQUFuQixHQUE4QjtBQUNuQyxjQUFNLElBQUlJLEtBQUosQ0FBVUYsVUFBVixDQUFOO0FBQ0Q7O0FBRUQ7QUFDQSxVQUFJLEtBQUtULE9BQUwsQ0FBYUwsT0FBakIsRUFBMEI7QUFDeEIsYUFBS2tCLE9BQUwsR0FBZSxLQUFLQSxPQUFMLENBQWFDLE1BQWIsQ0FDYlAsSUFBSUQsS0FBSixDQUFVLENBQVYsRUFBYSxLQUFLTixPQUFMLENBQWFILGNBQTFCLENBRGEsQ0FBZjtBQUdBLGFBQUtrQixRQUFMLEdBQWdCLEtBQUtBLFFBQUwsQ0FBY0QsTUFBZCxDQUNkUCxJQUFJRCxLQUFKLENBQVUsS0FBS04sT0FBTCxDQUFhSCxjQUF2QixDQURjLENBQWhCO0FBR0QsT0FQRCxNQU9PO0FBQ0wsWUFBSU8sTUFBTUMsT0FBTixDQUFjRSxHQUFkLENBQUosRUFBd0I7QUFDdEIsZUFBS1MsS0FBTCxHQUFhLEtBQUtBLEtBQUwsQ0FBV0YsTUFBWCxDQUFrQlAsR0FBbEIsQ0FBYjtBQUNELFNBRkQsTUFFTztBQUNMLGVBQUtTLEtBQUwsQ0FBV0MsSUFBWCxDQUFnQlYsR0FBaEI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0QkE7Ozs7O0FBS0E7QUFDQTtBQUNBOztBQUVBOzs7Ozs7O2dDQUlZO0FBQ1YsYUFBTyxLQUFLVyxVQUFMLEVBQVA7QUFDRDs7QUFFRDs7OztpQ0FDYTtBQUNYLGFBQU87QUFDTHZCLGlCQUFTLEtBQUtLLE9BQUwsQ0FBYUwsT0FEakI7QUFFTHdCLHNCQUFjLEtBQUtuQixPQUFMLENBQWFGLFdBRnRCO0FBR0xGLG1CQUFXLEtBQUtJLE9BQUwsQ0FBYUosU0FIbkI7QUFJTHdCLHlCQUFpQixLQUFLcEIsT0FBTCxDQUFhSCxjQUp6QjtBQUtMRSxlQUFPLEtBQUtDLE9BQUwsQ0FBYUQsS0FMZjtBQU1Mc0IsY0FBTSxLQUFLTCxLQUFMLENBQVdWLEtBQVgsQ0FBaUIsQ0FBakIsQ0FORDtBQU9MZ0Isb0JBQVksS0FBS1QsT0FBTCxDQUFhUCxLQUFiLENBQW1CLENBQW5CLENBUFA7QUFRTGlCLHFCQUFhLEtBQUtSLFFBQUwsQ0FBY1QsS0FBZCxDQUFvQixDQUFwQixDQVJSO0FBU0xJLGdCQUFRLEtBQUtWLE9BQUwsQ0FBYUwsT0FBYixHQUNBLEtBQUtrQixPQUFMLENBQWFILE1BQWIsR0FBc0IsS0FBS1YsT0FBTCxDQUFhSCxjQURuQyxHQUVBLEtBQUttQixLQUFMLENBQVdOLE1BQVgsR0FBb0IsS0FBS1YsT0FBTCxDQUFhSjtBQVhwQyxPQUFQO0FBYUQ7O0FBRUQ7Ozs7Ozs0QkFHUTtBQUNOLFdBQUtvQixLQUFMLEdBQWEsRUFBYjtBQUNBLFdBQUtILE9BQUwsR0FBZSxFQUFmO0FBQ0EsV0FBS0UsUUFBTCxHQUFnQixFQUFoQjtBQUNEOzs7OztBQUNGOztrQkFFY3ZCLFciLCJmaWxlIjoieG1tLXBocmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogWE1NIGNvbXBhdGlibGUgcGhyYXNlIGJ1aWxkZXIgdXRpbGl0eSA8YnIgLz5cbiAqIENsYXNzIHRvIGVhc2UgdGhlIGNyZWF0aW9uIG9mIFhNTSBjb21wYXRpYmxlIGRhdGEgcmVjb3JkaW5ncywgYWthIHBocmFzZXMuIDxiciAvPlxuICogUGhyYXNlcyBhcmUgdHlwaWNhbGx5IGFycmF5cyAoZmxhdHRlbmVkIG1hdHJpY2VzKSBvZiBzaXplIE4gKiBNLFxuICogTiBiZWluZyB0aGUgc2l6ZSBvZiBhIHZlY3RvciBlbGVtZW50LCBhbmQgTSB0aGUgbGVuZ3RoIG9mIHRoZSBwaHJhc2UgaXRzZWxmLFxuICogd3JhcHBlZCB0b2dldGhlciBpbiBhbiBvYmplY3Qgd2l0aCBhIGZldyBzZXR0aW5ncy5cbiAqIEBjbGFzc1xuICovXG5cbmNsYXNzIFBocmFzZU1ha2VyIHtcbiAgLyoqXG4gICAqIFhNTSBwaHJhc2UgY29uZmlndXJhdGlvbiBvYmplY3QuXG4gICAqIEB0eXBlZGVmIHhtbVBocmFzZUNvbmZpZ1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbmFtZSB4bW1QaHJhc2VDb25maWdcbiAgICogQHByb3BlcnR5IHtCb29sZWFufSBiaW1vZGFsIC0gSW5kaWNhdGVzIHdldGhlciBwaHJhc2UgZGF0YSBzaG91bGQgYmUgY29uc2lkZXJlZCBiaW1vZGFsLlxuICAgKiBJZiB0cnVlLCB0aGUgPGNvZGU+ZGltZW5zaW9uX2lucHV0PC9jb2RlPiBwcm9wZXJ0eSB3aWxsIGJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbiAtIFNpemUgb2YgYSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbklucHV0IC0gU2l6ZSBvZiB0aGUgcGFydCBvZiBhbiBpbnB1dCB2ZWN0b3IgZWxlbWVudCB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0cmFpbmluZy5cbiAgICogVGhpcyBpbXBsaWVzIHRoYXQgdGhlIHJlc3Qgb2YgdGhlIHZlY3RvciAob2Ygc2l6ZSA8Y29kZT5kaW1lbnNpb24gLSBkaW1lbnNpb25faW5wdXQ8L2NvZGU+KVxuICAgKiB3aWxsIGJlIHVzZWQgZm9yIHJlZ3Jlc3Npb24uIE9ubHkgdGFrZW4gaW50byBhY2NvdW50IGlmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIHRydWUuXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuU3RyaW5nfSBjb2x1bW5fbmFtZXMgLSBBcnJheSBvZiBzdHJpbmcgaWRlbnRpZmllcnMgZGVzY3JpYmluZyBlYWNoIHNjYWxhciBvZiB0aGUgcGhyYXNlJ3MgdmVjdG9yIGVsZW1lbnRzLlxuICAgKiBUeXBpY2FsbHkgb2Ygc2l6ZSA8Y29kZT5kaW1lbnNpb248L2NvZGU+LlxuICAgKiBAcHJvcGVydHkge1N0cmluZ30gbGFiZWwgLSBUaGUgc3RyaW5nIGlkZW50aWZpZXIgb2YgdGhlIGNsYXNzIHRoZSBwaHJhc2UgYmVsb25ncyB0by5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7eG1tUGhyYXNlQ29uZmlnfSBvcHRpb25zIC0gRGVmYXVsdCBwaHJhc2UgY29uZmlndXJhdGlvbi5cbiAgICogQHNlZSB7QGxpbmsgY29uZmlnfS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IGRlZmF1bHRzID0ge1xuICAgICAgYmltb2RhbDogZmFsc2UsXG4gICAgICBkaW1lbnNpb246IDEsXG4gICAgICBkaW1lbnNpb25JbnB1dDogMCxcbiAgICAgIGNvbHVtbk5hbWVzOiBbJyddLFxuICAgICAgbGFiZWw6ICcnXG4gICAgfVxuXG4gICAgdGhpcy5fY29uZmlnID0gZGVmYXVsdHM7XG4gICAgdGhpcy5fc2V0Q29uZmlnKG9wdGlvbnMpO1xuXG4gICAgdGhpcy5yZXNldCgpO1xuICB9XG5cbiAgLyoqKlxuICAgKiBYTU0gcGhyYXNlIGNvbmZpZ3VyYXRpb24gb2JqZWN0LlxuICAgKiBPbmx5IGxlZ2FsIGZpZWxkcyB3aWxsIGJlIGNoZWNrZWQgYmVmb3JlIGJlaW5nIGFkZGVkIHRvIHRoZSBjb25maWcsIG90aGVycyB3aWxsIGJlIGlnbm9yZWRcbiAgICogQHR5cGUge1htbVBocmFzZUNvbmZpZ31cbiAgICogQGRlcHJlY2F0ZWQgc2luY2UgdmVyc2lvbiAwLjIuMFxuICAgKi9cbiAgLy8gZ2V0IGNvbmZpZygpIHtcbiAgLy8gICByZXR1cm4gdGhpcy5fY29uZmlnO1xuICAvLyB9XG5cbiAgLy8gc2V0IGNvbmZpZyhvcHRpb25zID0ge30pIHtcbiAgLy8gICB0aGlzLl9zZXRDb25maWcob3B0aW9ucyk7XG4gIC8vIH1cblxuICAvLyBuZXcgQVBJIChiLW1hIHRpcCA6IGRvbicgdXNlIGFjY2Vzc29ycyBpZiB0aGVyZSBpcyBzb21lIG1hZ2ljIGJlaGluZCxcbiAgLy8gd2hpY2ggaXMgdGhlIGNhc2UgaW4gX3NldENvbmZpZylcbiAgLy8ga2VlcGluZyBhY2Nlc3NvcnMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgY29uZmlndXJhdGlvbi5cbiAgICogQHJldHVybnMge3htbVBocmFzZUNvbmZpZ31cbiAgICovXG4gIGdldENvbmZpZygpIHtcbiAgICByZXR1cm4gdGhpcy5fY29uZmlnO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGN1cnJlbnQgY29uZmlndXJhdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBpbmZvcm1hdGlvbi5cbiAgICogQHBhcmFtIHt4bW1QaHJhc2VDb25maWd9IG9wdGlvbnNcbiAgICovXG4gIHNldENvbmZpZyhvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLl9zZXRDb25maWcob3B0aW9ucyk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX3NldENvbmZpZyhvcHRpb25zID0ge30pIHtcbiAgICBmb3IgKGxldCBwcm9wIGluIG9wdGlvbnMpIHtcbiAgICAgIGlmIChwcm9wID09PSAnYmltb2RhbCcgJiYgdHlwZW9mKG9wdGlvbnNbcHJvcF0pID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbicgJiYgTnVtYmVyLmlzSW50ZWdlcihvcHRpb25zW3Byb3BdKSkge1xuICAgICAgICB0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnZGltZW5zaW9uSW5wdXQnICYmIE51bWJlci5pc0ludGVnZXIob3B0aW9uc1twcm9wXSkpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2NvbHVtbk5hbWVzJyAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnNbcHJvcF0pKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF0uc2xpY2UoMCk7XG4gICAgICB9IGVsc2UgaWYgKHByb3AgPT09ICdsYWJlbCcgJiYgdHlwZW9mKG9wdGlvbnNbcHJvcF0pID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuICAgICAgfVxuICAgIH0gICBcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgYW4gb2JzZXJ2YXRpb24gdmVjdG9yIHRvIHRoZSBwaHJhc2UncyBkYXRhLiBNdXN0IGJlIG9mIGxlbmd0aCA8Y29kZT5kaW1lbnNpb248L2NvZGU+LlxuICAgKiBAcGFyYW0ge0FycmF5Lk51bWJlcn0gb2JzIC0gQW4gaW5wdXQgdmVjdG9yLCBha2Egb2JzZXJ2YXRpb24uIElmIDxjb2RlPmJpbW9kYWw8L2NvZGU+IGlzIHRydWVcbiAgICogQHRocm93cyBXaWxsIHRocm93IGFuIGVycm9yIGlmIHRoZSBpbnB1dCB2ZWN0b3IgZG9lc24ndCBtYXRjaCB0aGUgY29uZmlnLlxuICAgKi9cbiAgYWRkT2JzZXJ2YXRpb24ob2JzKSB7XG4gICAgLy8gY2hlY2sgaW5wdXQgdmFsaWRpdHlcbiAgICBjb25zdCBiYWRMZW5ndGhNc2cgPSAnQmFkIGlucHV0IGxlbmd0aDogb2JzZXJ2YXRpb24gbGVuZ3RoIG11c3QgbWF0Y2ggcGhyYXNlIGRpbWVuc2lvbic7XG4gICAgY29uc3QgYmFkVHlwZU1zZyA9ICdCYWQgZGF0YSB0eXBlOiBhbGwgb2JzZXJ2YXRpb24gdmFsdWVzIG11c3QgYmUgbnVtYmVycyc7XG5cbiAgICBpZiAob2JzLmxlbmd0aCAhPT0gdGhpcy5fY29uZmlnLmRpbWVuc2lvbiB8fFxuICAgICAgICAodHlwZW9mKG9icykgPT09ICdudW1iZXInICYmIHRoaXMuX2NvbmZpZy5kaW1lbnNpb24gIT09IDEpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYmFkTGVuZ3RoTXNnKTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYnMpKSB7XG4gICAgICBmb3IgKGxldCB2YWwgb2Ygb2JzKSB7XG4gICAgICAgIGlmICh0eXBlb2YodmFsKSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYmFkVHlwZU1zZyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZihvYnMgIT09ICdudW1iZXInKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGJhZFR5cGVNc2cpO1xuICAgIH1cblxuICAgIC8vIGFkZCB2YWx1ZShzKSB0byBpbnRlcm5hbCBhcnJheXNcbiAgICBpZiAodGhpcy5fY29uZmlnLmJpbW9kYWwpIHtcbiAgICAgIHRoaXMuX2RhdGFJbiA9IHRoaXMuX2RhdGFJbi5jb25jYXQoXG4gICAgICAgIG9icy5zbGljZSgwLCB0aGlzLl9jb25maWcuZGltZW5zaW9uSW5wdXQpXG4gICAgICApO1xuICAgICAgdGhpcy5fZGF0YU91dCA9IHRoaXMuX2RhdGFPdXQuY29uY2F0KFxuICAgICAgICBvYnMuc2xpY2UodGhpcy5fY29uZmlnLmRpbWVuc2lvbklucHV0KVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JzKSkge1xuICAgICAgICB0aGlzLl9kYXRhID0gdGhpcy5fZGF0YS5jb25jYXQob2JzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2RhdGEucHVzaChvYnMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBIHZhbGlkIFhNTSBwaHJhc2UsIHJlYWR5IHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgWE1NIGxpYnJhcnkuXG4gICAqIEB0eXBlZGVmIHhtbVBocmFzZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbmFtZSB4bW1QaHJhc2VcbiAgICogQHByb3BlcnR5IHtCb29sZWFufSBiaW1vZGFsIC0gSW5kaWNhdGVzIHdldGhlciBwaHJhc2UgZGF0YSBzaG91bGQgYmUgY29uc2lkZXJlZCBiaW1vZGFsLlxuICAgKiBJZiB0cnVlLCB0aGUgPGNvZGU+ZGltZW5zaW9uX2lucHV0PC9jb2RlPiBwcm9wZXJ0eSB3aWxsIGJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbiAtIFNpemUgb2YgYSBwaHJhc2UncyB2ZWN0b3IgZWxlbWVudC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGRpbWVuc2lvbl9pbnB1dCAtIFNpemUgb2YgdGhlIHBhcnQgb2YgYW4gaW5wdXQgdmVjdG9yIGVsZW1lbnQgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdHJhaW5pbmcuXG4gICAqIFRoaXMgaW1wbGllcyB0aGF0IHRoZSByZXN0IG9mIHRoZSB2ZWN0b3IgKG9mIHNpemUgPGNvZGU+ZGltZW5zaW9uIC0gZGltZW5zaW9uX2lucHV0PC9jb2RlPilcbiAgICogd2lsbCBiZSB1c2VkIGZvciByZWdyZXNzaW9uLiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlLlxuICAgKiBAcHJvcGVydHkge0FycmF5LlN0cmluZ30gY29sdW1uX25hbWVzIC0gQXJyYXkgb2Ygc3RyaW5nIGlkZW50aWZpZXJzIGRlc2NyaWJpbmcgZWFjaCBzY2FsYXIgb2YgdGhlIHBocmFzZSdzIHZlY3RvciBlbGVtZW50cy5cbiAgICogVHlwaWNhbGx5IG9mIHNpemUgPGNvZGU+ZGltZW5zaW9uPC9jb2RlPi5cbiAgICogQHByb3BlcnR5IHtTdHJpbmd9IGxhYmVsIC0gVGhlIHN0cmluZyBpZGVudGlmaWVyIG9mIHRoZSBjbGFzcyB0aGUgcGhyYXNlIGJlbG9uZ3MgdG8uXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuTnVtYmVyfSBkYXRhIC0gVGhlIHBocmFzZSdzIGRhdGEsIGNvbnRhaW5pbmcgYWxsIHRoZSB2ZWN0b3JzIGZsYXR0ZW5lZCBpbnRvIGEgc2luZ2xlIG9uZS5cbiAgICogT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgZmFsc2UuXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuTnVtYmVyfSBkYXRhX2lucHV0IC0gVGhlIHBocmFzZSdzIGRhdGEgd2hpY2ggd2lsbCBiZSB1c2VkIGZvciB0cmFpbmluZywgZmxhdHRlbmVkIGludG8gYSBzaW5nbGUgdmVjdG9yLlxuICAgKiBPbmx5IHRha2VuIGludG8gYWNjb3VudCBpZiA8Y29kZT5iaW1vZGFsPC9jb2RlPiBpcyB0cnVlLlxuICAgKiBAcHJvcGVydHkge0FycmF5Lk51bWJlcn0gZGF0YV9vdXRwdXQgLSBUaGUgcGhyYXNlJ3MgZGF0YSB3aGljaCB3aWxsIGJlIHVzZWQgZm9yIHJlZ3Jlc3Npb24sIGZsYXR0ZW5lZCBpbnRvIGEgc2luZ2xlIHZlY3Rvci5cbiAgICogT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGxlbmd0aCAtIFRoZSBsZW5ndGggb2YgdGhlIHBocmFzZSwgZS5nLiBvbmUgb2YgdGhlIGZvbGxvd2luZyA6XG4gICAqIDxsaSBzdHlsZT1cImxpc3Qtc3R5bGUtdHlwZTogbm9uZTtcIj5cbiAgICogPHVsPjxjb2RlPmRhdGEubGVuZ3RoIC8gZGltZW5zaW9uPC9jb2RlPjwvdWw+XG4gICAqIDx1bD48Y29kZT5kYXRhX2lucHV0Lmxlbmd0aCAvIGRpbWVuc2lvbl9pbnB1dDwvY29kZT48L3VsPlxuICAgKiA8dWw+PGNvZGU+ZGF0YV9vdXRwdXQubGVuZ3RoIC8gZGltZW5zaW9uX291dHB1dDwvY29kZT48L3VsPlxuICAgKiA8L2xpPlxuICAgKi9cblxuICAvKioqXG4gICAqIEEgdmFsaWQgWE1NIHBocmFzZSwgcmVhZHkgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBYTU0gbGlicmFyeS5cbiAgICogQHJlYWRvbmx5XG4gICAqIEB0eXBlIHt4bW1QaHJhc2V9XG4gICAqL1xuICAvLyBnZXQgcGhyYXNlKCkge1xuICAvLyAgIHJldHVybiB0aGlzLl9nZXRQaHJhc2UoKTtcbiAgLy8gfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgdmFsaWQgWE1NIHBocmFzZSBjcmVhdGVkIGZyb20gdGhlIGNvbmZpZyBhbmQgdGhlIHJlY29yZGVkIGRhdGEuXG4gICAqIEByZXR1cm5zIHt4bW1QaHJhc2V9XG4gICAqL1xuICBnZXRQaHJhc2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldFBocmFzZSgpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9nZXRQaHJhc2UoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJpbW9kYWw6IHRoaXMuX2NvbmZpZy5iaW1vZGFsLFxuICAgICAgY29sdW1uX25hbWVzOiB0aGlzLl9jb25maWcuY29sdW1uTmFtZXMsXG4gICAgICBkaW1lbnNpb246IHRoaXMuX2NvbmZpZy5kaW1lbnNpb24sXG4gICAgICBkaW1lbnNpb25faW5wdXQ6IHRoaXMuX2NvbmZpZy5kaW1lbnNpb25JbnB1dCxcbiAgICAgIGxhYmVsOiB0aGlzLl9jb25maWcubGFiZWwsXG4gICAgICBkYXRhOiB0aGlzLl9kYXRhLnNsaWNlKDApLFxuICAgICAgZGF0YV9pbnB1dDogdGhpcy5fZGF0YUluLnNsaWNlKDApLFxuICAgICAgZGF0YV9vdXRwdXQ6IHRoaXMuX2RhdGFPdXQuc2xpY2UoMCksXG4gICAgICBsZW5ndGg6IHRoaXMuX2NvbmZpZy5iaW1vZGFsXG4gICAgICAgICAgICA/IHRoaXMuX2RhdGFJbi5sZW5ndGggLyB0aGlzLl9jb25maWcuZGltZW5zaW9uSW5wdXRcbiAgICAgICAgICAgIDogdGhpcy5fZGF0YS5sZW5ndGggLyB0aGlzLl9jb25maWcuZGltZW5zaW9uXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciB0aGUgcGhyYXNlJ3MgZGF0YSBzbyB0aGF0IGEgbmV3IG9uZSBpcyByZWFkeSB0byBiZSByZWNvcmRlZC5cbiAgICovXG4gIHJlc2V0KCkge1xuICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICB0aGlzLl9kYXRhSW4gPSBbXTtcbiAgICB0aGlzLl9kYXRhT3V0ID0gW107XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFBocmFzZU1ha2VyOyJdfQ==