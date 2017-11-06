'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// An xmm-compatible training set must have the following fields :
// - bimodal (boolean)
// - column_names (array of strings)
// - dimension (integer)
// - dimension_input (integer < dimension)
// - phrases (array of phrases)
//   - on export, each phrase must have an extra "index" field
//     => when the class returns a set with getPhrasesOfLabel or getTrainingSet,
//        it should add these index fields before returning the result.
//     => when a set is added with addTrainingSet, the indexes must be removed
//        from the phrases before they are added to the internal array

/**
 * XMM compatible training set manager utility <br />
 * Class to ease the creation of XMM compatible training sets. <br />
 * Phrases should be generated with the PhraseMaker class or the original XMM library.
 */
var SetMaker = function () {
  function SetMaker() {
    (0, _classCallCheck3.default)(this, SetMaker);

    this._config = {};
    this._phrases = [];
  }

  /***
   * The current total number of phrases in the set.
   * @readonly
   */
  // get size() {
  //   return this._phrases.length;
  // }

  /**
   * A valid XMM training set, ready to be processed by the XMM library.
   * @typedef xmmTrainingSet
   * @type {Object}
   * @name xmmTrainingSet
   * @property {Boolean} bimodal - Indicates wether the set's phrases data should be considered bimodal.
   * If true, the <code>dimension_input</code> property will be taken into account.
   * @property {Number} dimension - Size of a vector element of the set's phrases.
   * @property {Number} dimension_input - Size of the part of an input vector element that should be used for training.
   * This implies that the rest of the vector (of size <code>dimension - dimension_input</code>)
   * will be used for regression. Only taken into account if <code>bimodal</code> is true.
   * @property {Array.String} column_names - Array of string identifiers describing each scalar of a phrase's vector elements.
   * Typically of size <code>dimension</code>.
   * @property {Array.xmmPhrase} phrases  - Array of valid XMM phrases containing an extra "index" field.
   */

  /**
   * Get the total number of phrases actually in the set.
   * @returns {Number}
   */


  (0, _createClass3.default)(SetMaker, [{
    key: 'getSize',
    value: function getSize() {
      return this._phrases.length;
    }

    /**
     * Add an XMM phrase to the current set.
     * @param {xmmPhrase} phrase - An XMM compatible phrase (ie created with the PhraseMaker class)
     */

  }, {
    key: 'addPhrase',
    value: function addPhrase(phrase) {
      if (this._phrases.length === 0) {
        this._setConfigFrom(phrase);
      } else if (!this._checkCompatibility(phrase)) {
        throw new Error('Bad phrase format: added phrase must match current set configuration');
      }
      this._phrases.push(JSON.parse((0, _stringify2.default)(phrase)));
    }

    /**
     * Add all phrases from another training set.
     * @param {xmmTrainingSet} set - An XMM compatible training set.
     */

  }, {
    key: 'addTrainingSet',
    value: function addTrainingSet(set) {
      if (this._phrases.length === 0) {
        this._setConfigFrom(set);
      } else if (!this._checkCompatibility(set)) {
        throw new Error('Bad set format: added set must match current set configuration');
      }

      var phrases = set['phrases'];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(phrases), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var phrase = _step.value;

          this._phrases.push(phrase);
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
    }

    /**
     * Get phrase at a particular index.
     * @param {Number} index - The index of the phrase to retrieve.
     * @returns {xmmPhrase}
     */

  }, {
    key: 'getPhrase',
    value: function getPhrase(index) {
      if (index > -1 && index < this._phrases.length) {
        // return a new copy of the phrase :
        return JSON.parse((0, _stringify2.default)(this._phrases[index]));
      }
      return null;
    }

    /**
     * Remove phrase at a particular index.
     * @param {Number} index - The index of the phrase to remove.
     */

  }, {
    key: 'removePhrase',
    value: function removePhrase(index) {
      if (index > -1 && index < this._phrases.length) {
        this._phrases.splice(index, 1);
      }
    }

    /**
     * Return the subset of phrases of a particular label.
     * @param {String} label - The label of the phrases from which to generate the sub-training set.
     * @returns {xmmTrainingSet}
     */

  }, {
    key: 'getPhrasesOfLabel',
    value: function getPhrasesOfLabel(label) {
      var res = {};

      for (var prop in this._config) {
        res[prop] = this._config[prop];
      }

      res['phrases'] = [];
      var index = 0;

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = (0, _getIterator3.default)(this._phrases), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var phrase = _step2.value;

          if (phrase['label'] === label) {
            var p = JSON.parse((0, _stringify2.default)(phrase));
            p['index'] = index++;
            res['phrases'].push(p);
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return res;
    }

    /**
     * Remove all phrases of a particular label.
     * @param {String} label - The label of the phrases to remove.
     */

  }, {
    key: 'removePhrasesOfLabel',
    value: function removePhrasesOfLabel(label) {
      for (var i = this._phrases.length - 1; i >= 0; i--) {
        if (this._phrases[i]['label'] === label) {
          this._phrases.splice(i, 1);
        }
      }
    }

    /**
     * Return the current training set.
     * @returns {xmmTrainingSet}
     */

  }, {
    key: 'getTrainingSet',
    value: function getTrainingSet() {
      var res = {};

      for (var prop in this._config) {
        res[prop] = this._config[prop];
      }

      res['phrases'] = [];
      var index = 0;

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = (0, _getIterator3.default)(this._phrases), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var phrase = _step3.value;

          var p = JSON.parse((0, _stringify2.default)(phrase));
          p['index'] = index++;
          res['phrases'].push(p);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return res;
    }

    /**
     * Clear the whole set.
     */

  }, {
    key: 'clear',
    value: function clear() {
      this._config = {};
      this._phrases = [];
    }

    /**
     * Check the config of a phrase or training set before applying it
     * to the current class.
     * Throw errors if not valid ?
     * @private
     */

  }, {
    key: '_setConfigFrom',
    value: function _setConfigFrom(obj) {
      for (var prop in obj) {
        if (prop === 'bimodal' && typeof obj['bimodal'] === 'boolean') {
          this._config[prop] = obj[prop];
        } else if (prop === 'column_names' && Array.isArray(obj[prop])) {
          this._config[prop] = obj[prop].slice(0);
        } else if (prop === 'dimension' && (0, _isInteger2.default)(obj[prop])) {
          this._config[prop] = obj[prop];
        } else if (prop === 'dimension_input' && (0, _isInteger2.default)(obj[prop])) {
          this._config[prop] = obj[prop];
        }
      }
    }

    /**
     * Check if the phrase or set is compatible with the current settings.
     * @private
     */

  }, {
    key: '_checkCompatibility',
    value: function _checkCompatibility(obj) {
      if (obj['bimodal'] !== this._config['bimodal'] || obj['dimension'] !== this._config['dimension'] || obj['dimension_input'] !== this._config['dimension_input']) {
        return false;
      }

      var ocn = obj['column_names'];
      var ccn = this._config['column_names'];

      if (ocn && ccn) {
        if (ocn.length !== ccn.length) {
          return false;
        } else {
          for (var i = 0; i < ocn.length; i++) {
            if (ocn[i] !== ccn[i]) {
              return false;
            }
          }
        }
      }

      return true;
    }
  }]);
  return SetMaker;
}();

;

exports.default = SetMaker;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInhtbS1zZXQuanMiXSwibmFtZXMiOlsiU2V0TWFrZXIiLCJfY29uZmlnIiwiX3BocmFzZXMiLCJsZW5ndGgiLCJwaHJhc2UiLCJfc2V0Q29uZmlnRnJvbSIsIl9jaGVja0NvbXBhdGliaWxpdHkiLCJFcnJvciIsInB1c2giLCJKU09OIiwicGFyc2UiLCJzZXQiLCJwaHJhc2VzIiwiaW5kZXgiLCJzcGxpY2UiLCJsYWJlbCIsInJlcyIsInByb3AiLCJwIiwiaSIsIm9iaiIsIkFycmF5IiwiaXNBcnJheSIsInNsaWNlIiwib2NuIiwiY2NuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7SUFLTUEsUTtBQUNKLHNCQUFjO0FBQUE7O0FBQ1osU0FBS0MsT0FBTCxHQUFlLEVBQWY7QUFDQSxTQUFLQyxRQUFMLEdBQWdCLEVBQWhCO0FBQ0Q7O0FBRUQ7Ozs7QUFJQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7Ozs7OzhCQUlVO0FBQ1IsYUFBTyxLQUFLQSxRQUFMLENBQWNDLE1BQXJCO0FBQ0Q7O0FBRUQ7Ozs7Ozs7OEJBSVVDLE0sRUFBUTtBQUNoQixVQUFJLEtBQUtGLFFBQUwsQ0FBY0MsTUFBZCxLQUF5QixDQUE3QixFQUFnQztBQUM5QixhQUFLRSxjQUFMLENBQW9CRCxNQUFwQjtBQUNELE9BRkQsTUFFTyxJQUFJLENBQUMsS0FBS0UsbUJBQUwsQ0FBeUJGLE1BQXpCLENBQUwsRUFBdUM7QUFDNUMsY0FBTSxJQUFJRyxLQUFKLENBQVUsc0VBQVYsQ0FBTjtBQUNEO0FBQ0QsV0FBS0wsUUFBTCxDQUFjTSxJQUFkLENBQW1CQyxLQUFLQyxLQUFMLENBQVcseUJBQWVOLE1BQWYsQ0FBWCxDQUFuQjtBQUNEOztBQUVEOzs7Ozs7O21DQUllTyxHLEVBQUs7QUFDbEIsVUFBSSxLQUFLVCxRQUFM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QUFJSCxJQUFKLENBQXJCO0FBQ0Q7QUFDRjtBQUNGOztBQUVEOzs7Ozs7O3dDQUlvQkcsRyxFQUFLO0FBQ3ZCLFVBQUlBLElBQUksU0FBSixNQUFtQixLQUFLbkIsT0FBTCxDQUFhLFNBQWIsQ0FBbkIsSUFDQ21CLElBQUksV0FBSixNQUFxQixLQUFLbkIsT0FBTCxDQUFhLFdBQWIsQ0FEdEIsSUFFQ21CLElBQUksaUJBQUosTUFBMkIsS0FBS25CLE9BQUwsQ0FBYSxpQkFBYixDQUZoQyxFQUVpRTtBQUMvRCxlQUFPLEtBQVA7QUFDRDs7QUFFRCxVQUFNdUIsTUFBTUosSUFBSSxjQUFKLENBQVo7QUFDQSxVQUFNSyxNQUFNLEtBQUt4QixPQUFMLENBQWEsY0FBYixDQUFaOztBQUVBLFVBQUl1QixPQUFPQyxHQUFYLEVBQWdCO0FBQ2QsWUFBSUQsSUFBSXJCLE1BQUosS0FBZXNCLElBQUl0QixNQUF2QixFQUErQjtBQUM3QixpQkFBTyxLQUFQO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsZUFBSyxJQUFJZ0IsSUFBSSxDQUFiLEVBQWdCQSxJQUFJSyxJQUFJckIsTUFBeEIsRUFBZ0NnQixHQUFoQyxFQUFxQztBQUNuQyxnQkFBSUssSUFBSUwsQ0FBSixNQUFXTSxJQUFJTixDQUFKLENBQWYsRUFBdUI7QUFDckIscUJBQU8sS0FBUDtBQUNEO0FBQ0Y7QUFDRjtBQUNGOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7OztBQUNGOztrQkFFY25CLFEiLCJmaWxlIjoieG1tLXNldC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEFuIHhtbS1jb21wYXRpYmxlIHRyYWluaW5nIHNldCBtdXN0IGhhdmUgdGhlIGZvbGxvd2luZyBmaWVsZHMgOlxuLy8gLSBiaW1vZGFsIChib29sZWFuKVxuLy8gLSBjb2x1bW5fbmFtZXMgKGFycmF5IG9mIHN0cmluZ3MpXG4vLyAtIGRpbWVuc2lvbiAoaW50ZWdlcilcbi8vIC0gZGltZW5zaW9uX2lucHV0IChpbnRlZ2VyIDwgZGltZW5zaW9uKVxuLy8gLSBwaHJhc2VzIChhcnJheSBvZiBwaHJhc2VzKVxuLy8gICAtIG9uIGV4cG9ydCwgZWFjaCBwaHJhc2UgbXVzdCBoYXZlIGFuIGV4dHJhIFwiaW5kZXhcIiBmaWVsZFxuLy8gICAgID0+IHdoZW4gdGhlIGNsYXNzIHJldHVybnMgYSBzZXQgd2l0aCBnZXRQaHJhc2VzT2ZMYWJlbCBvciBnZXRUcmFpbmluZ1NldCxcbi8vICAgICAgICBpdCBzaG91bGQgYWRkIHRoZXNlIGluZGV4IGZpZWxkcyBiZWZvcmUgcmV0dXJuaW5nIHRoZSByZXN1bHQuXG4vLyAgICAgPT4gd2hlbiBhIHNldCBpcyBhZGRlZCB3aXRoIGFkZFRyYWluaW5nU2V0LCB0aGUgaW5kZXhlcyBtdXN0IGJlIHJlbW92ZWRcbi8vICAgICAgICBmcm9tIHRoZSBwaHJhc2VzIGJlZm9yZSB0aGV5IGFyZSBhZGRlZCB0byB0aGUgaW50ZXJuYWwgYXJyYXlcblxuLyoqXG4gKiBYTU0gY29tcGF0aWJsZSB0cmFpbmluZyBzZXQgbWFuYWdlciB1dGlsaXR5IDxiciAvPlxuICogQ2xhc3MgdG8gZWFzZSB0aGUgY3JlYXRpb24gb2YgWE1NIGNvbXBhdGlibGUgdHJhaW5pbmcgc2V0cy4gPGJyIC8+XG4gKiBQaHJhc2VzIHNob3VsZCBiZSBnZW5lcmF0ZWQgd2l0aCB0aGUgUGhyYXNlTWFrZXIgY2xhc3Mgb3IgdGhlIG9yaWdpbmFsIFhNTSBsaWJyYXJ5LlxuICovXG5jbGFzcyBTZXRNYWtlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2NvbmZpZyA9IHt9O1xuICAgIHRoaXMuX3BocmFzZXMgPSBbXTtcbiAgfVxuXG4gIC8qKipcbiAgICogVGhlIGN1cnJlbnQgdG90YWwgbnVtYmVyIG9mIHBocmFzZXMgaW4gdGhlIHNldC5cbiAgICogQHJlYWRvbmx5XG4gICAqL1xuICAvLyBnZXQgc2l6ZSgpIHtcbiAgLy8gICByZXR1cm4gdGhpcy5fcGhyYXNlcy5sZW5ndGg7XG4gIC8vIH1cblxuICAvKipcbiAgICogQSB2YWxpZCBYTU0gdHJhaW5pbmcgc2V0LCByZWFkeSB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIFhNTSBsaWJyYXJ5LlxuICAgKiBAdHlwZWRlZiB4bW1UcmFpbmluZ1NldFxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbmFtZSB4bW1UcmFpbmluZ1NldFxuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IGJpbW9kYWwgLSBJbmRpY2F0ZXMgd2V0aGVyIHRoZSBzZXQncyBwaHJhc2VzIGRhdGEgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYmltb2RhbC5cbiAgICogSWYgdHJ1ZSwgdGhlIDxjb2RlPmRpbWVuc2lvbl9pbnB1dDwvY29kZT4gcHJvcGVydHkgd2lsbCBiZSB0YWtlbiBpbnRvIGFjY291bnQuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkaW1lbnNpb24gLSBTaXplIG9mIGEgdmVjdG9yIGVsZW1lbnQgb2YgdGhlIHNldCdzIHBocmFzZXMuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkaW1lbnNpb25faW5wdXQgLSBTaXplIG9mIHRoZSBwYXJ0IG9mIGFuIGlucHV0IHZlY3RvciBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRyYWluaW5nLlxuICAgKiBUaGlzIGltcGxpZXMgdGhhdCB0aGUgcmVzdCBvZiB0aGUgdmVjdG9yIChvZiBzaXplIDxjb2RlPmRpbWVuc2lvbiAtIGRpbWVuc2lvbl9pbnB1dDwvY29kZT4pXG4gICAqIHdpbGwgYmUgdXNlZCBmb3IgcmVncmVzc2lvbi4gT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cbiAgICogQHByb3BlcnR5IHtBcnJheS5TdHJpbmd9IGNvbHVtbl9uYW1lcyAtIEFycmF5IG9mIHN0cmluZyBpZGVudGlmaWVycyBkZXNjcmliaW5nIGVhY2ggc2NhbGFyIG9mIGEgcGhyYXNlJ3MgdmVjdG9yIGVsZW1lbnRzLlxuICAgKiBUeXBpY2FsbHkgb2Ygc2l6ZSA8Y29kZT5kaW1lbnNpb248L2NvZGU+LlxuICAgKiBAcHJvcGVydHkge0FycmF5LnhtbVBocmFzZX0gcGhyYXNlcyAgLSBBcnJheSBvZiB2YWxpZCBYTU0gcGhyYXNlcyBjb250YWluaW5nIGFuIGV4dHJhIFwiaW5kZXhcIiBmaWVsZC5cbiAgICovXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdG90YWwgbnVtYmVyIG9mIHBocmFzZXMgYWN0dWFsbHkgaW4gdGhlIHNldC5cbiAgICogQHJldHVybnMge051bWJlcn1cbiAgICovXG4gIGdldFNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BocmFzZXMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBYTU0gcGhyYXNlIHRvIHRoZSBjdXJyZW50IHNldC5cbiAgICogQHBhcmFtIHt4bW1QaHJhc2V9IHBocmFzZSAtIEFuIFhNTSBjb21wYXRpYmxlIHBocmFzZSAoaWUgY3JlYXRlZCB3aXRoIHRoZSBQaHJhc2VNYWtlciBjbGFzcylcbiAgICovXG4gIGFkZFBocmFzZShwaHJhc2UpIHtcbiAgICBpZiAodGhpcy5fcGhyYXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuX3NldENvbmZpZ0Zyb20ocGhyYXNlKTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9jaGVja0NvbXBhdGliaWxpdHkocGhyYXNlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCYWQgcGhyYXNlIGZvcm1hdDogYWRkZWQgcGhyYXNlIG11c3QgbWF0Y2ggY3VycmVudCBzZXQgY29uZmlndXJhdGlvbicpO1xuICAgIH1cbiAgICB0aGlzLl9waHJhc2VzLnB1c2goSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShwaHJhc2UpKSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFsbCBwaHJhc2VzIGZyb20gYW5vdGhlciB0cmFpbmluZyBzZXQuXG4gICAqIEBwYXJhbSB7eG1tVHJhaW5pbmdTZXR9IHNldCAtIEFuIFhNTSBjb21wYXRpYmxlIHRyYWluaW5nIHNldC5cbiAgICovXG4gIGFkZFRyYWluaW5nU2V0KHNldCkge1xuICAgIGlmICh0aGlzLl9waHJhc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5fc2V0Q29uZmlnRnJvbShzZXQpO1xuICAgIH0gZWxzZSBpZiAoIXRoaXMuX2NoZWNrQ29tcGF0aWJpbGl0eShzZXQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JhZCBzZXQgZm9ybWF0OiBhZGRlZCBzZXQgbXVzdCBtYXRjaCBjdXJyZW50IHNldCBjb25maWd1cmF0aW9uJyk7XG4gICAgfVxuXG4gICAgY29uc3QgcGhyYXNlcyA9IHNldFsncGhyYXNlcyddO1xuICAgIGZvciAobGV0IHBocmFzZSBvZiBwaHJhc2VzKSB7XG4gICAgICB0aGlzLl9waHJhc2VzLnB1c2gocGhyYXNlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHBocmFzZSBhdCBhIHBhcnRpY3VsYXIgaW5kZXguXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleCAtIFRoZSBpbmRleCBvZiB0aGUgcGhyYXNlIHRvIHJldHJpZXZlLlxuICAgKiBAcmV0dXJucyB7eG1tUGhyYXNlfVxuICAgKi9cbiAgZ2V0UGhyYXNlKGluZGV4KSB7XG4gICAgaWYgKGluZGV4ID4gLTEgJiYgaW5kZXggPCB0aGlzLl9waHJhc2VzLmxlbmd0aCkge1xuICAgICAgLy8gcmV0dXJuIGEgbmV3IGNvcHkgb2YgdGhlIHBocmFzZSA6XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLl9waHJhc2VzW2luZGV4XSkpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgcGhyYXNlIGF0IGEgcGFydGljdWxhciBpbmRleC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4IC0gVGhlIGluZGV4IG9mIHRoZSBwaHJhc2UgdG8gcmVtb3ZlLlxuICAgKi9cbiAgcmVtb3ZlUGhyYXNlKGluZGV4KSB7XG4gICAgaWYgKGluZGV4ID4gLTEgJiYgaW5kZXggPCB0aGlzLl9waHJhc2VzLmxlbmd0aCkge1xuICAgICAgdGhpcy5fcGhyYXNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHN1YnNldCBvZiBwaHJhc2VzIG9mIGEgcGFydGljdWxhciBsYWJlbC5cbiAgICogQHBhcmFtIHtTdHJpbmd9IGxhYmVsIC0gVGhlIGxhYmVsIG9mIHRoZSBwaHJhc2VzIGZyb20gd2hpY2ggdG8gZ2VuZXJhdGUgdGhlIHN1Yi10cmFpbmluZyBzZXQuXG4gICAqIEByZXR1cm5zIHt4bW1UcmFpbmluZ1NldH1cbiAgICovXG4gIGdldFBocmFzZXNPZkxhYmVsKGxhYmVsKSB7XG4gICAgY29uc3QgcmVzID0ge307XG5cbiAgICBmb3IgKGxldCBwcm9wIGluIHRoaXMuX2NvbmZpZykge1xuICAgICAgcmVzW3Byb3BdID0gdGhpcy5fY29uZmlnW3Byb3BdO1xuICAgIH1cblxuICAgIHJlc1sncGhyYXNlcyddID0gW107XG4gICAgbGV0IGluZGV4ID0gMDtcblxuICAgIGZvciAobGV0IHBocmFzZSBvZiB0aGlzLl9waHJhc2VzKSB7XG4gICAgICBpZiAocGhyYXNlWydsYWJlbCddID09PSBsYWJlbCkge1xuICAgICAgICBsZXQgcCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkocGhyYXNlKSk7XG4gICAgICAgIHBbJ2luZGV4J10gPSBpbmRleCsrO1xuICAgICAgICByZXNbJ3BocmFzZXMnXS5wdXNoKHApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFsbCBwaHJhc2VzIG9mIGEgcGFydGljdWxhciBsYWJlbC5cbiAgICogQHBhcmFtIHtTdHJpbmd9IGxhYmVsIC0gVGhlIGxhYmVsIG9mIHRoZSBwaHJhc2VzIHRvIHJlbW92ZS5cbiAgICovXG4gIHJlbW92ZVBocmFzZXNPZkxhYmVsKGxhYmVsKSB7XG4gICAgZm9yIChsZXQgaSA9IHRoaXMuX3BocmFzZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmICh0aGlzLl9waHJhc2VzW2ldWydsYWJlbCddID09PSBsYWJlbCkge1xuICAgICAgICB0aGlzLl9waHJhc2VzLnNwbGljZShpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSBjdXJyZW50IHRyYWluaW5nIHNldC5cbiAgICogQHJldHVybnMge3htbVRyYWluaW5nU2V0fVxuICAgKi9cbiAgZ2V0VHJhaW5pbmdTZXQoKSB7XG4gICAgbGV0IHJlcyA9IHt9O1xuXG4gICAgZm9yIChsZXQgcHJvcCBpbiB0aGlzLl9jb25maWcpIHtcbiAgICAgIHJlc1twcm9wXSA9IHRoaXMuX2NvbmZpZ1twcm9wXTtcbiAgICB9XG5cbiAgICByZXNbJ3BocmFzZXMnXSA9IFtdO1xuICAgIGxldCBpbmRleCA9IDA7XG5cbiAgICBmb3IgKGxldCBwaHJhc2Ugb2YgdGhpcy5fcGhyYXNlcykge1xuICAgICAgbGV0IHAgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHBocmFzZSkpO1xuICAgICAgcFsnaW5kZXgnXSA9IGluZGV4Kys7XG4gICAgICByZXNbJ3BocmFzZXMnXS5wdXNoKHApO1xuICAgIH1cblxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXIgdGhlIHdob2xlIHNldC5cbiAgICovXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuX2NvbmZpZyA9IHt9O1xuICAgIHRoaXMuX3BocmFzZXMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB0aGUgY29uZmlnIG9mIGEgcGhyYXNlIG9yIHRyYWluaW5nIHNldCBiZWZvcmUgYXBwbHlpbmcgaXRcbiAgICogdG8gdGhlIGN1cnJlbnQgY2xhc3MuXG4gICAqIFRocm93IGVycm9ycyBpZiBub3QgdmFsaWQgP1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldENvbmZpZ0Zyb20ob2JqKSB7XG4gICAgZm9yIChsZXQgcHJvcCBpbiBvYmopIHtcbiAgICAgIGlmIChwcm9wID09PSAnYmltb2RhbCcgJiYgdHlwZW9mKG9ialsnYmltb2RhbCddKSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2NvbHVtbl9uYW1lcycgJiYgQXJyYXkuaXNBcnJheShvYmpbcHJvcF0pKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9ialtwcm9wXS5zbGljZSgwKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbicgJiYgTnVtYmVyLmlzSW50ZWdlcihvYmpbcHJvcF0pKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbl9pbnB1dCcgJiYgTnVtYmVyLmlzSW50ZWdlcihvYmpbcHJvcF0pKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIHBocmFzZSBvciBzZXQgaXMgY29tcGF0aWJsZSB3aXRoIHRoZSBjdXJyZW50IHNldHRpbmdzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2NoZWNrQ29tcGF0aWJpbGl0eShvYmopIHtcbiAgICBpZiAob2JqWydiaW1vZGFsJ10gIT09IHRoaXMuX2NvbmZpZ1snYmltb2RhbCddXG4gICAgICB8fCBvYmpbJ2RpbWVuc2lvbiddICE9PSB0aGlzLl9jb25maWdbJ2RpbWVuc2lvbiddXG4gICAgICB8fCBvYmpbJ2RpbWVuc2lvbl9pbnB1dCddICE9PSB0aGlzLl9jb25maWdbJ2RpbWVuc2lvbl9pbnB1dCddKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgb2NuID0gb2JqWydjb2x1bW5fbmFtZXMnXTtcbiAgICBjb25zdCBjY24gPSB0aGlzLl9jb25maWdbJ2NvbHVtbl9uYW1lcyddO1xuXG4gICAgaWYgKG9jbiAmJiBjY24pIHtcbiAgICAgIGlmIChvY24ubGVuZ3RoICE9PSBjY24ubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2NuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKG9jbltpXSAhPT0gY2NuW2ldKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFNldE1ha2VyOyJdfQ==