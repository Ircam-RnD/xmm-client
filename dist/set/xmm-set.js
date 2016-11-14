'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

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

  /**
   * The current total number of phrases in the set.
   * @readonly
   */


  (0, _createClass3.default)(SetMaker, [{
    key: 'addPhrase',


    /**
     * Add an XMM phrase to the current set.
     * @param {XmmPhrase} phrase - An XMM compatible phrase (ie created with the PhraseMaker class)
     */
    value: function addPhrase(phrase) {
      if (this._phrases.length === 0) {
        this._setConfigFrom(phrase);
      } else if (!this._checkCompatibility(phrase)) {
        throw new Error('Bad phrase format: added phrase must match current set configuration');
      }
      this._phrases.push(phrase);
    }

    /**
     * Add all phrases from another training set.
     * @param {XmmTrainingSet} set - An XMM compatible training set.
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
     * @returns {XmmPhrase}
     */

  }, {
    key: 'getPhrase',
    value: function getPhrase(index) {
      if (index > -1 && index < this._phrases.length) {
        // return a new copy of the phrase :
        return JSON.parse(JSON.srtingify(this._phrases[index]));
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
     * @returns {XmmTrainingSet}
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
      for (var i = 0; i < this._phrases.length; i++) {
        if (this._phrases[i]['label'] === label) {
          this.phrases.splice(i, 1);
        }
      }
    }

    /**
     * Return the current training set.
     * @returns {TrainingSet}
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

      if (ocn.length !== ccn.length) {
        return false;
      } else {
        for (var i = 0; i < ocn.length; i++) {
          if (ocn[i] !== ccn[i]) {
            return false;
          }
        }
      }

      return true;
    }
  }, {
    key: 'size',
    get: function get() {
      return this._phrases.length;
    }
  }]);
  return SetMaker;
}();

;

exports.default = SetMaker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInhtbS1zZXQuanMiXSwibmFtZXMiOlsiU2V0TWFrZXIiLCJfY29uZmlnIiwiX3BocmFzZXMiLCJwaHJhc2UiLCJsZW5ndGgiLCJfc2V0Q29uZmlnRnJvbSIsIl9jaGVja0NvbXBhdGliaWxpdHkiLCJFcnJvciIsInB1c2giLCJzZXQiLCJwaHJhc2VzIiwiaW5kZXgiLCJKU09OIiwicGFyc2UiLCJzcnRpbmdpZnkiLCJzcGxpY2UiLCJsYWJlbCIsInJlcyIsInByb3AiLCJwIiwiaSIsIm9iaiIsIkFycmF5IiwiaXNBcnJheSIsInNsaWNlIiwib2NuIiwiY2NuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7SUFLTUEsUTtBQUNKLHNCQUFjO0FBQUE7O0FBQ1osU0FBS0MsT0FBTCxHQUFlLEVBQWY7QUFDQSxTQUFLQyxRQUFMLEdBQWdCLEVBQWhCO0FBQ0Q7O0FBRUQ7Ozs7Ozs7Ozs7QUFRQTs7Ozs4QkFJVUMsTSxFQUFRO0FBQ2hCLFVBQUksS0FBS0QsUUFBTCxDQUFjRSxNQUFkLEtBQXlCLENBQTdCLEVBQWdDO0FBQzlCLGFBQUtDLGNBQUwsQ0FBb0JGLE1BQXBCO0FBQ0QsT0FGRCxNQUVPLElBQUksQ0FBQyxLQUFLRyxtQkFBTCxDQUF5QkgsTUFBekIsQ0FBTCxFQUF1QztBQUM1QyxjQUFNLElBQUlJLEtBQUosQ0FBVSxzRUFBVixDQUFOO0FBQ0Q7QUFDRCxXQUFLTCxRQUFMLENBQWNNLElBQWQsQ0FBbUJMLE1BQW5CO0FBQ0Q7O0FBRUQ7Ozs7Ozs7bUNBSWVNLEcsRUFBSztBQUNsQixVQUFJLEtBQUtQLFFBQUwsQ0FBY0UsTUFBZCxLQUF5QixDQUE3QixFQUFnQztBQUM5QixhQUFLQyxjQUFMLENBQW9CSSxHQUFwQjtBQUNELE9BRkQsTUFFTyxJQUFJLENBQUMsS0FBS0gsbUJBQUwsQ0FBeUJHLEdBQXpCLENBQUwsRUFBb0M7QUFDekMsY0FBTSxJQUFJRixLQUFKLENBQVUsZ0VBQVYsQ0FBTjtBQUNEOztBQUVELFVBQU1HLFVBQVVELElBQUksU0FBSixDQUFoQjtBQVBrQjtBQUFBO0FBQUE7O0FBQUE7QUFRbEIsd0RBQW1CQyxPQUFuQiw0R0FBNEI7QUFBQSxjQUFuQlAsTUFBbUI7O0FBQzFCLGVBQUtELFFBQUwsQ0FBY00sSUFBZCxDQUFtQkwsTUFBbkI7QUFDRDtBQVZpQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBV25COztBQUVEOzs7Ozs7Ozs4QkFLVVEsSyxFQUFPO0FBQ2YsVUFBSUEsUUFBUSxDQUFDLENBQVQsSUFBY0EsUUFBUSxLQUFLVCxRQUFMLENBQWNFLE1BQXhDLEVBQWdEO0FBQzlDO0FBQ0EsZUFBT1EsS0FBS0MsS0FBTCxDQUFXRCxLQUFLRSxTQUFMLENBQWUsS0FBS1osUUFBTCxDQUFjUyxLQUFkLENBQWYsQ0FBWCxDQUFQO0FBQ0Q7QUFDRCxhQUFPLElBQVA7QUFDRDs7QUFFRDs7Ozs7OztpQ0FJYUEsSyxFQUFPO0FBQ2xCLFVBQUlBLFFBQVEsQ0FBQyxDQUFULElBQWNBLFFBQVEsS0FBS1QsUUFBTCxDQUFjRSxNQUF4QyxFQUFnRDtBQUM5QyxhQUFLRixRQUFMLENBQWNhLE1BQWQsQ0FBcUJKLEtBQXJCLEVBQTRCLENBQTVCO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7Ozs7c0NBS2tCSyxLLEVBQU87QUFDdkIsVUFBTUMsTUFBTSxFQUFaOztBQUVBLFdBQUssSUFBSUMsSUFBVCxJQUFpQixLQUFLakIsT0FBdEIsRUFBK0I7QUFDN0JnQixZQUFJQyxJQUFKLElBQVksS0FBS2pCLE9BQUwsQ0FBYWlCLElBQWIsQ0FBWjtBQUNEOztBQUVERCxVQUFJLFNBQUosSUFBaUIsRUFBakI7QUFDQSxVQUFJTixRQUFRLENBQVo7O0FBUnVCO0FBQUE7QUFBQTs7QUFBQTtBQVV2Qix5REFBbUIsS0FBS1QsUUFBeEIsaUhBQWtDO0FBQUEsY0FBekJDLE1BQXlCOztBQUNoQyxjQUFJQSxPQUFPLE9BQVAsTUFBb0JhLEtBQXhCLEVBQStCO0FBQzdCLGdCQUFJRyxJQUFJUCxLQUFLQyxLQUFMLENBQVcseUJBQWVWLE1BQWYsQ0FBWCxDQUFSO0FBQ0FnQixjQUFFLE9BQUYsSUFBYVIsT0FBYjtBQUNBTSxnQkFBSSxTQUFKLEVBQWVULElBQWYsQ0FBb0JXLENBQXBCO0FBQ0Q7QUFDRjtBQWhCc0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFrQnZCLGFBQU9GLEdBQVA7QUFDRDs7QUFFRDs7Ozs7Ozt5Q0FJcUJELEssRUFBTztBQUMxQixXQUFLLElBQUlJLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLbEIsUUFBTCxDQUFjRSxNQUFsQyxFQUEwQ2dCLEdBQTFDLEVBQStDO0FBQzdDLFlBQUksS0FBS2xCLFFBQUwsQ0FBY2tCLENBQWQsRUFBaUIsT0FBakIsTUFBOEJKLEtBQWxDLEVBQXlDO0FBQ3ZDLGVBQUtOLE9BQUwsQ0FBYUssTUFBYixDQUFvQkssQ0FBcEIsRUFBdUIsQ0FBdkI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQ7Ozs7Ozs7cUNBSWlCO0FBQ2YsVUFBSUgsTUFBTSxFQUFWOztBQUVBLFdBQUssSUFBSUMsSUFBVCxJQUFpQixLQUFLakIsT0FBdEIsRUFBK0I7QUFDN0JnQixZQUFJQyxJQUFKLElBQVksS0FBS2pCLE9BQUwsQ0FBYWlCLElBQWIsQ0FBWjtBQUNEOztBQUVERCxVQUFJLFNBQUosSUFBaUIsRUFBakI7QUFDQSxVQUFJTixRQUFRLENBQVo7O0FBUmU7QUFBQTtBQUFBOztBQUFBO0FBVWYseURBQW1CLEtBQUtULFFBQXhCLGlIQUFrQztBQUFBLGNBQXpCQyxNQUF5Qjs7QUFDaEMsY0FBSWdCLElBQUlQLEtBQUtDLEtBQUwsQ0FBVyx5QkFBZVYsTUFBZixDQUFYLENBQVI7QUFDQWdCLFlBQUUsT0FBRixJQUFhUixPQUFiO0FBQ0FNLGNBQUksU0FBSixFQUFlVCxJQUFmLENBQW9CVyxDQUFwQjtBQUNEO0FBZGM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFnQmYsYUFBT0YsR0FBUDtBQUNEOztBQUVEOzs7Ozs7NEJBR1E7QUFDTixXQUFLaEIsT0FBTCxHQUFlLEVBQWY7QUFDQSxXQUFLQyxRQUFMLEdBQWdCLEVBQWhCO0FBQ0Q7O0FBRUQ7Ozs7Ozs7OzttQ0FNZW1CLEcsRUFBSztBQUNsQixXQUFLLElBQUlILElBQVQsSUFBaUJHLEdBQWpCLEVBQXNCO0FBQ3BCLFlBQUlILFNBQVMsU0FBVCxJQUFzQixPQUFPRyxJQUFJLFNBQUosQ0FBUCxLQUEyQixTQUFyRCxFQUFnRTtBQUM5RCxlQUFLcEIsT0FBTCxDQUFhaUIsSUFBYixJQUFxQkcsSUFBSUgsSUFBSixDQUFyQjtBQUNELFNBRkQsTUFFTyxJQUFJQSxTQUFTLGNBQVQsSUFBMkJJLE1BQU1DLE9BQU4sQ0FBY0YsSUFBSUgsSUFBSixDQUFkLENBQS9CLEVBQXlEO0FBQzlELGVBQUtqQixPQUFMLENBQWFpQixJQUFiLElBQXFCRyxJQUFJSCxJQUFKLEVBQVVNLEtBQVYsQ0FBZ0IsQ0FBaEIsQ0FBckI7QUFDRCxTQUZNLE1BRUEsSUFBSU4sU0FBUyxXQUFULElBQXdCLHlCQUFpQkcsSUFBSUgsSUFBSixDQUFqQixDQUE1QixFQUF5RDtBQUM5RCxlQUFLakIsT0FBTCxDQUFhaUIsSUFBYixJQUFxQkcsSUFBSUgsSUFBSixDQUFyQjtBQUNELFNBRk0sTUFFQSxJQUFJQSxTQUFTLGlCQUFULElBQThCLHlCQUFpQkcsSUFBSUgsSUFBSixDQUFqQixDQUFsQyxFQUErRDtBQUNwRSxlQUFLakIsT0FBTCxDQUFhaUIsSUFBYixJQUFxQkcsSUFBSUgsSUFBSixDQUFyQjtBQUNEO0FBQ0Y7QUFDRjs7QUFFRDs7Ozs7Ozt3Q0FJb0JHLEcsRUFBSztBQUN2QixVQUFJQSxJQUFJLFNBQUosTUFBbUIsS0FBS3BCLE9BQUwsQ0FBYSxTQUFiLENBQW5CLElBQ0NvQixJQUFJLFdBQUosTUFBcUIsS0FBS3BCLE9BQUwsQ0FBYSxXQUFiLENBRHRCLElBRUNvQixJQUFJLGlCQUFKLE1BQTJCLEtBQUtwQixPQUFMLENBQWEsaUJBQWIsQ0FGaEMsRUFFaUU7QUFDL0QsZUFBTyxLQUFQO0FBQ0Q7O0FBRUQsVUFBTXdCLE1BQU1KLElBQUksY0FBSixDQUFaO0FBQ0EsVUFBTUssTUFBTSxLQUFLekIsT0FBTCxDQUFhLGNBQWIsQ0FBWjs7QUFFQSxVQUFJd0IsSUFBSXJCLE1BQUosS0FBZXNCLElBQUl0QixNQUF2QixFQUErQjtBQUM3QixlQUFPLEtBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxhQUFLLElBQUlnQixJQUFJLENBQWIsRUFBZ0JBLElBQUlLLElBQUlyQixNQUF4QixFQUFnQ2dCLEdBQWhDLEVBQXFDO0FBQ25DLGNBQUlLLElBQUlMLENBQUosTUFBV00sSUFBSU4sQ0FBSixDQUFmLEVBQXVCO0FBQ3JCLG1CQUFPLEtBQVA7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQsYUFBTyxJQUFQO0FBQ0Q7Ozt3QkEzS1U7QUFDVCxhQUFPLEtBQUtsQixRQUFMLENBQWNFLE1BQXJCO0FBQ0Q7Ozs7O0FBMEtGOztrQkFFY0osUSIsImZpbGUiOiJ4bW0tc2V0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQW4geG1tLWNvbXBhdGlibGUgdHJhaW5pbmcgc2V0IG11c3QgaGF2ZSB0aGUgZm9sbG93aW5nIGZpZWxkcyA6XG4vLyAtIGJpbW9kYWwgKGJvb2xlYW4pXG4vLyAtIGNvbHVtbl9uYW1lcyAoYXJyYXkgb2Ygc3RyaW5ncylcbi8vIC0gZGltZW5zaW9uIChpbnRlZ2VyKVxuLy8gLSBkaW1lbnNpb25faW5wdXQgKGludGVnZXIgPCBkaW1lbnNpb24pXG4vLyAtIHBocmFzZXMgKGFycmF5IG9mIHBocmFzZXMpXG4vLyAgIC0gb24gZXhwb3J0LCBlYWNoIHBocmFzZSBtdXN0IGhhdmUgYW4gZXh0cmEgXCJpbmRleFwiIGZpZWxkXG4vLyAgICAgPT4gd2hlbiB0aGUgY2xhc3MgcmV0dXJucyBhIHNldCB3aXRoIGdldFBocmFzZXNPZkxhYmVsIG9yIGdldFRyYWluaW5nU2V0LFxuLy8gICAgICAgIGl0IHNob3VsZCBhZGQgdGhlc2UgaW5kZXggZmllbGRzIGJlZm9yZSByZXR1cm5pbmcgdGhlIHJlc3VsdC5cbi8vICAgICA9PiB3aGVuIGEgc2V0IGlzIGFkZGVkIHdpdGggYWRkVHJhaW5pbmdTZXQsIHRoZSBpbmRleGVzIG11c3QgYmUgcmVtb3ZlZFxuLy8gICAgICAgIGZyb20gdGhlIHBocmFzZXMgYmVmb3JlIHRoZXkgYXJlIGFkZGVkIHRvIHRoZSBpbnRlcm5hbCBhcnJheVxuXG4vKipcbiAqIFhNTSBjb21wYXRpYmxlIHRyYWluaW5nIHNldCBtYW5hZ2VyIHV0aWxpdHkgPGJyIC8+XG4gKiBDbGFzcyB0byBlYXNlIHRoZSBjcmVhdGlvbiBvZiBYTU0gY29tcGF0aWJsZSB0cmFpbmluZyBzZXRzLiA8YnIgLz5cbiAqIFBocmFzZXMgc2hvdWxkIGJlIGdlbmVyYXRlZCB3aXRoIHRoZSBQaHJhc2VNYWtlciBjbGFzcyBvciB0aGUgb3JpZ2luYWwgWE1NIGxpYnJhcnkuXG4gKi9cbmNsYXNzIFNldE1ha2VyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fY29uZmlnID0ge307XG4gICAgdGhpcy5fcGhyYXNlcyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBjdXJyZW50IHRvdGFsIG51bWJlciBvZiBwaHJhc2VzIGluIHRoZSBzZXQuXG4gICAqIEByZWFkb25seVxuICAgKi9cbiAgZ2V0IHNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BocmFzZXMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBYTU0gcGhyYXNlIHRvIHRoZSBjdXJyZW50IHNldC5cbiAgICogQHBhcmFtIHtYbW1QaHJhc2V9IHBocmFzZSAtIEFuIFhNTSBjb21wYXRpYmxlIHBocmFzZSAoaWUgY3JlYXRlZCB3aXRoIHRoZSBQaHJhc2VNYWtlciBjbGFzcylcbiAgICovXG4gIGFkZFBocmFzZShwaHJhc2UpIHtcbiAgICBpZiAodGhpcy5fcGhyYXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuX3NldENvbmZpZ0Zyb20ocGhyYXNlKTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9jaGVja0NvbXBhdGliaWxpdHkocGhyYXNlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCYWQgcGhyYXNlIGZvcm1hdDogYWRkZWQgcGhyYXNlIG11c3QgbWF0Y2ggY3VycmVudCBzZXQgY29uZmlndXJhdGlvbicpO1xuICAgIH1cbiAgICB0aGlzLl9waHJhc2VzLnB1c2gocGhyYXNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYWxsIHBocmFzZXMgZnJvbSBhbm90aGVyIHRyYWluaW5nIHNldC5cbiAgICogQHBhcmFtIHtYbW1UcmFpbmluZ1NldH0gc2V0IC0gQW4gWE1NIGNvbXBhdGlibGUgdHJhaW5pbmcgc2V0LlxuICAgKi9cbiAgYWRkVHJhaW5pbmdTZXQoc2V0KSB7XG4gICAgaWYgKHRoaXMuX3BocmFzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLl9zZXRDb25maWdGcm9tKHNldCk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5fY2hlY2tDb21wYXRpYmlsaXR5KHNldCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQmFkIHNldCBmb3JtYXQ6IGFkZGVkIHNldCBtdXN0IG1hdGNoIGN1cnJlbnQgc2V0IGNvbmZpZ3VyYXRpb24nKTtcbiAgICB9XG5cbiAgICBjb25zdCBwaHJhc2VzID0gc2V0WydwaHJhc2VzJ107XG4gICAgZm9yIChsZXQgcGhyYXNlIG9mIHBocmFzZXMpIHtcbiAgICAgIHRoaXMuX3BocmFzZXMucHVzaChwaHJhc2UpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcGhyYXNlIGF0IGEgcGFydGljdWxhciBpbmRleC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4IC0gVGhlIGluZGV4IG9mIHRoZSBwaHJhc2UgdG8gcmV0cmlldmUuXG4gICAqIEByZXR1cm5zIHtYbW1QaHJhc2V9XG4gICAqL1xuICBnZXRQaHJhc2UoaW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPiAtMSAmJiBpbmRleCA8IHRoaXMuX3BocmFzZXMubGVuZ3RoKSB7XG4gICAgICAvLyByZXR1cm4gYSBuZXcgY29weSBvZiB0aGUgcGhyYXNlIDpcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3J0aW5naWZ5KHRoaXMuX3BocmFzZXNbaW5kZXhdKSk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBwaHJhc2UgYXQgYSBwYXJ0aWN1bGFyIGluZGV4LlxuICAgKiBAcGFyYW0ge051bWJlcn0gaW5kZXggLSBUaGUgaW5kZXggb2YgdGhlIHBocmFzZSB0byByZW1vdmUuXG4gICAqL1xuICByZW1vdmVQaHJhc2UoaW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPiAtMSAmJiBpbmRleCA8IHRoaXMuX3BocmFzZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9waHJhc2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgc3Vic2V0IG9mIHBocmFzZXMgb2YgYSBwYXJ0aWN1bGFyIGxhYmVsLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbGFiZWwgLSBUaGUgbGFiZWwgb2YgdGhlIHBocmFzZXMgZnJvbSB3aGljaCB0byBnZW5lcmF0ZSB0aGUgc3ViLXRyYWluaW5nIHNldC5cbiAgICogQHJldHVybnMge1htbVRyYWluaW5nU2V0fVxuICAgKi9cbiAgZ2V0UGhyYXNlc09mTGFiZWwobGFiZWwpIHtcbiAgICBjb25zdCByZXMgPSB7fTtcblxuICAgIGZvciAobGV0IHByb3AgaW4gdGhpcy5fY29uZmlnKSB7XG4gICAgICByZXNbcHJvcF0gPSB0aGlzLl9jb25maWdbcHJvcF07XG4gICAgfVxuXG4gICAgcmVzWydwaHJhc2VzJ10gPSBbXTtcbiAgICBsZXQgaW5kZXggPSAwO1xuXG4gICAgZm9yIChsZXQgcGhyYXNlIG9mIHRoaXMuX3BocmFzZXMpIHtcbiAgICAgIGlmIChwaHJhc2VbJ2xhYmVsJ10gPT09IGxhYmVsKSB7XG4gICAgICAgIGxldCBwID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShwaHJhc2UpKTtcbiAgICAgICAgcFsnaW5kZXgnXSA9IGluZGV4Kys7XG4gICAgICAgIHJlc1sncGhyYXNlcyddLnB1c2gocCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYWxsIHBocmFzZXMgb2YgYSBwYXJ0aWN1bGFyIGxhYmVsLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbGFiZWwgLSBUaGUgbGFiZWwgb2YgdGhlIHBocmFzZXMgdG8gcmVtb3ZlLlxuICAgKi9cbiAgcmVtb3ZlUGhyYXNlc09mTGFiZWwobGFiZWwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3BocmFzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLl9waHJhc2VzW2ldWydsYWJlbCddID09PSBsYWJlbCkge1xuICAgICAgICB0aGlzLnBocmFzZXMuc3BsaWNlKGksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGN1cnJlbnQgdHJhaW5pbmcgc2V0LlxuICAgKiBAcmV0dXJucyB7VHJhaW5pbmdTZXR9XG4gICAqL1xuICBnZXRUcmFpbmluZ1NldCgpIHtcbiAgICBsZXQgcmVzID0ge307XG5cbiAgICBmb3IgKGxldCBwcm9wIGluIHRoaXMuX2NvbmZpZykge1xuICAgICAgcmVzW3Byb3BdID0gdGhpcy5fY29uZmlnW3Byb3BdO1xuICAgIH1cblxuICAgIHJlc1sncGhyYXNlcyddID0gW107XG4gICAgbGV0IGluZGV4ID0gMDtcblxuICAgIGZvciAobGV0IHBocmFzZSBvZiB0aGlzLl9waHJhc2VzKSB7XG4gICAgICBsZXQgcCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkocGhyYXNlKSk7XG4gICAgICBwWydpbmRleCddID0gaW5kZXgrKztcbiAgICAgIHJlc1sncGhyYXNlcyddLnB1c2gocCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciB0aGUgd2hvbGUgc2V0LlxuICAgKi9cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5fY29uZmlnID0ge307XG4gICAgdGhpcy5fcGhyYXNlcyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHRoZSBjb25maWcgb2YgYSBwaHJhc2Ugb3IgdHJhaW5pbmcgc2V0IGJlZm9yZSBhcHBseWluZyBpdFxuICAgKiB0byB0aGUgY3VycmVudCBjbGFzcy5cbiAgICogVGhyb3cgZXJyb3JzIGlmIG5vdCB2YWxpZCA/XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0Q29uZmlnRnJvbShvYmopIHtcbiAgICBmb3IgKGxldCBwcm9wIGluIG9iaikge1xuICAgICAgaWYgKHByb3AgPT09ICdiaW1vZGFsJyAmJiB0eXBlb2Yob2JqWydiaW1vZGFsJ10pID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnY29sdW1uX25hbWVzJyAmJiBBcnJheS5pc0FycmF5KG9ialtwcm9wXSkpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb2JqW3Byb3BdLnNsaWNlKDApO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnZGltZW5zaW9uJyAmJiBOdW1iZXIuaXNJbnRlZ2VyKG9ialtwcm9wXSkpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnZGltZW5zaW9uX2lucHV0JyAmJiBOdW1iZXIuaXNJbnRlZ2VyKG9ialtwcm9wXSkpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgcGhyYXNlIG9yIHNldCBpcyBjb21wYXRpYmxlIHdpdGggdGhlIGN1cnJlbnQgc2V0dGluZ3MuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2hlY2tDb21wYXRpYmlsaXR5KG9iaikge1xuICAgIGlmIChvYmpbJ2JpbW9kYWwnXSAhPT0gdGhpcy5fY29uZmlnWydiaW1vZGFsJ11cbiAgICAgIHx8IG9ialsnZGltZW5zaW9uJ10gIT09IHRoaXMuX2NvbmZpZ1snZGltZW5zaW9uJ11cbiAgICAgIHx8IG9ialsnZGltZW5zaW9uX2lucHV0J10gIT09IHRoaXMuX2NvbmZpZ1snZGltZW5zaW9uX2lucHV0J10pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBvY24gPSBvYmpbJ2NvbHVtbl9uYW1lcyddO1xuICAgIGNvbnN0IGNjbiA9IHRoaXMuX2NvbmZpZ1snY29sdW1uX25hbWVzJ107XG5cbiAgICBpZiAob2NuLmxlbmd0aCAhPT0gY2NuLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9jbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAob2NuW2ldICE9PSBjY25baV0pIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgU2V0TWFrZXI7Il19