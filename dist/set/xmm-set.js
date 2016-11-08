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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInhtbS1zZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7O0lBS00sUTtBQUNKLHNCQUFjO0FBQUE7O0FBQ1osU0FBSyxPQUFMLEdBQWUsRUFBZjtBQUNBLFNBQUssUUFBTCxHQUFnQixFQUFoQjtBQUNEOztBQUVEOzs7Ozs7Ozs7O0FBUUE7Ozs7OEJBSVUsTSxFQUFRO0FBQ2hCLFVBQUksS0FBSyxRQUFMLENBQWMsTUFBZCxLQUF5QixDQUE3QixFQUFnQztBQUM5QixhQUFLLGNBQUwsQ0FBb0IsTUFBcEI7QUFDRCxPQUZELE1BRU8sSUFBSSxDQUFDLEtBQUssbUJBQUwsQ0FBeUIsTUFBekIsQ0FBTCxFQUF1QztBQUM1QyxjQUFNLElBQUksS0FBSixDQUFVLHNFQUFWLENBQU47QUFDRDtBQUNELFdBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsTUFBbkI7QUFDRDs7QUFFRDs7Ozs7OzttQ0FJZSxHLEVBQUs7QUFDbEIsVUFBSSxLQUFLLFFBQUwsQ0FBYyxNQUFkLEtBQXlCLENBQTdCLEVBQWdDO0FBQzlCLGFBQUssY0FBTCxDQUFvQixHQUFwQjtBQUNELE9BRkQsTUFFTyxJQUFJLENBQUMsS0FBSyxtQkFBTCxDQUF5QixHQUF6QixDQUFMLEVBQW9DO0FBQ3pDLGNBQU0sSUFBSSxLQUFKLENBQVUsZ0VBQVYsQ0FBTjtBQUNEOztBQUVELFVBQU0sVUFBVSxJQUFJLFNBQUosQ0FBaEI7QUFQa0I7QUFBQTtBQUFBOztBQUFBO0FBUWxCLHdEQUFtQixPQUFuQiw0R0FBNEI7QUFBQSxjQUFuQixNQUFtQjs7QUFDMUIsZUFBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixNQUFuQjtBQUNEO0FBVmlCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFXbkI7O0FBRUQ7Ozs7Ozs7OzhCQUtVLEssRUFBTztBQUNmLFVBQUksUUFBUSxDQUFDLENBQVQsSUFBYyxRQUFRLEtBQUssUUFBTCxDQUFjLE1BQXhDLEVBQWdEO0FBQzlDO0FBQ0EsZUFBTyxLQUFLLEtBQUwsQ0FBVyxLQUFLLFNBQUwsQ0FBZSxLQUFLLFFBQUwsQ0FBYyxLQUFkLENBQWYsQ0FBWCxDQUFQO0FBQ0Q7QUFDRCxhQUFPLElBQVA7QUFDRDs7QUFFRDs7Ozs7OztpQ0FJYSxLLEVBQU87QUFDbEIsVUFBSSxRQUFRLENBQUMsQ0FBVCxJQUFjLFFBQVEsS0FBSyxRQUFMLENBQWMsTUFBeEMsRUFBZ0Q7QUFDOUMsYUFBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixLQUFyQixFQUE0QixDQUE1QjtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7Ozs7O3NDQUtrQixLLEVBQU87QUFDdkIsVUFBTSxNQUFNLEVBQVo7O0FBRUEsV0FBSyxJQUFJLElBQVQsSUFBaUIsS0FBSyxPQUF0QixFQUErQjtBQUM3QixZQUFJLElBQUosSUFBWSxLQUFLLE9BQUwsQ0FBYSxJQUFiLENBQVo7QUFDRDs7QUFFRCxVQUFJLFNBQUosSUFBaUIsRUFBakI7QUFDQSxVQUFJLFFBQVEsQ0FBWjs7QUFSdUI7QUFBQTtBQUFBOztBQUFBO0FBVXZCLHlEQUFtQixLQUFLLFFBQXhCLGlIQUFrQztBQUFBLGNBQXpCLE1BQXlCOztBQUNoQyxjQUFJLE9BQU8sT0FBUCxNQUFvQixLQUF4QixFQUErQjtBQUM3QixnQkFBSSxJQUFJLEtBQUssS0FBTCxDQUFXLHlCQUFlLE1BQWYsQ0FBWCxDQUFSO0FBQ0EsY0FBRSxPQUFGLElBQWEsT0FBYjtBQUNBLGdCQUFJLFNBQUosRUFBZSxJQUFmLENBQW9CLENBQXBCO0FBQ0Q7QUFDRjtBQWhCc0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFrQnZCLGFBQU8sR0FBUDtBQUNEOztBQUVEOzs7Ozs7O3lDQUlxQixLLEVBQU87QUFDMUIsV0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssUUFBTCxDQUFjLE1BQWxDLEVBQTBDLEdBQTFDLEVBQStDO0FBQzdDLFlBQUksS0FBSyxRQUFMLENBQWMsQ0FBZCxFQUFpQixPQUFqQixNQUE4QixLQUFsQyxFQUF5QztBQUN2QyxlQUFLLE9BQUwsQ0FBYSxNQUFiLENBQW9CLENBQXBCLEVBQXVCLENBQXZCO0FBQ0Q7QUFDRjtBQUNGOztBQUVEOzs7Ozs7O3FDQUlpQjtBQUNmLFVBQUksTUFBTSxFQUFWOztBQUVBLFdBQUssSUFBSSxJQUFULElBQWlCLEtBQUssT0FBdEIsRUFBK0I7QUFDN0IsWUFBSSxJQUFKLElBQVksS0FBSyxPQUFMLENBQWEsSUFBYixDQUFaO0FBQ0Q7O0FBRUQsVUFBSSxTQUFKLElBQWlCLEVBQWpCO0FBQ0EsVUFBSSxRQUFRLENBQVo7O0FBUmU7QUFBQTtBQUFBOztBQUFBO0FBVWYseURBQW1CLEtBQUssUUFBeEIsaUhBQWtDO0FBQUEsY0FBekIsTUFBeUI7O0FBQ2hDLGNBQUksSUFBSSxLQUFLLEtBQUwsQ0FBVyx5QkFBZSxNQUFmLENBQVgsQ0FBUjtBQUNBLFlBQUUsT0FBRixJQUFhLE9BQWI7QUFDQSxjQUFJLFNBQUosRUFBZSxJQUFmLENBQW9CLENBQXBCO0FBQ0Q7QUFkYztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQWdCZixhQUFPLEdBQVA7QUFDRDs7QUFFRDs7Ozs7OzRCQUdRO0FBQ04sV0FBSyxPQUFMLEdBQWUsRUFBZjtBQUNBLFdBQUssUUFBTCxHQUFnQixFQUFoQjtBQUNEOztBQUVEOzs7Ozs7Ozs7bUNBTWUsRyxFQUFLO0FBQ2xCLFdBQUssSUFBSSxJQUFULElBQWlCLEdBQWpCLEVBQXNCO0FBQ3BCLFlBQUksU0FBUyxTQUFULElBQXNCLE9BQU8sSUFBSSxTQUFKLENBQVAsS0FBMkIsU0FBckQsRUFBZ0U7QUFDOUQsZUFBSyxPQUFMLENBQWEsSUFBYixJQUFxQixJQUFJLElBQUosQ0FBckI7QUFDRCxTQUZELE1BRU8sSUFBSSxTQUFTLGNBQVQsSUFBMkIsTUFBTSxPQUFOLENBQWMsSUFBSSxJQUFKLENBQWQsQ0FBL0IsRUFBeUQ7QUFDOUQsZUFBSyxPQUFMLENBQWEsSUFBYixJQUFxQixJQUFJLElBQUosRUFBVSxLQUFWLENBQWdCLENBQWhCLENBQXJCO0FBQ0QsU0FGTSxNQUVBLElBQUksU0FBUyxXQUFULElBQXdCLHlCQUFpQixJQUFJLElBQUosQ0FBakIsQ0FBNUIsRUFBeUQ7QUFDOUQsZUFBSyxPQUFMLENBQWEsSUFBYixJQUFxQixJQUFJLElBQUosQ0FBckI7QUFDRCxTQUZNLE1BRUEsSUFBSSxTQUFTLGlCQUFULElBQThCLHlCQUFpQixJQUFJLElBQUosQ0FBakIsQ0FBbEMsRUFBK0Q7QUFDcEUsZUFBSyxPQUFMLENBQWEsSUFBYixJQUFxQixJQUFJLElBQUosQ0FBckI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQ7Ozs7Ozs7d0NBSW9CLEcsRUFBSztBQUN2QixVQUFJLElBQUksU0FBSixNQUFtQixLQUFLLE9BQUwsQ0FBYSxTQUFiLENBQW5CLElBQ0MsSUFBSSxXQUFKLE1BQXFCLEtBQUssT0FBTCxDQUFhLFdBQWIsQ0FEdEIsSUFFQyxJQUFJLGlCQUFKLE1BQTJCLEtBQUssT0FBTCxDQUFhLGlCQUFiLENBRmhDLEVBRWlFO0FBQy9ELGVBQU8sS0FBUDtBQUNEOztBQUVELFVBQU0sTUFBTSxJQUFJLGNBQUosQ0FBWjtBQUNBLFVBQU0sTUFBTSxLQUFLLE9BQUwsQ0FBYSxjQUFiLENBQVo7O0FBRUEsVUFBSSxJQUFJLE1BQUosS0FBZSxJQUFJLE1BQXZCLEVBQStCO0FBQzdCLGVBQU8sS0FBUDtBQUNELE9BRkQsTUFFTztBQUNMLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxJQUFJLE1BQXhCLEVBQWdDLEdBQWhDLEVBQXFDO0FBQ25DLGNBQUksSUFBSSxDQUFKLE1BQVcsSUFBSSxDQUFKLENBQWYsRUFBdUI7QUFDckIsbUJBQU8sS0FBUDtBQUNEO0FBQ0Y7QUFDRjs7QUFFRCxhQUFPLElBQVA7QUFDRDs7O3dCQTNLVTtBQUNULGFBQU8sS0FBSyxRQUFMLENBQWMsTUFBckI7QUFDRDs7Ozs7QUEwS0Y7O2tCQUVjLFEiLCJmaWxlIjoieG1tLXNldC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEFuIHhtbS1jb21wYXRpYmxlIHRyYWluaW5nIHNldCBtdXN0IGhhdmUgdGhlIGZvbGxvd2luZyBmaWVsZHMgOlxuLy8gLSBiaW1vZGFsIChib29sZWFuKVxuLy8gLSBjb2x1bW5fbmFtZXMgKGFycmF5IG9mIHN0cmluZ3MpXG4vLyAtIGRpbWVuc2lvbiAoaW50ZWdlcilcbi8vIC0gZGltZW5zaW9uX2lucHV0IChpbnRlZ2VyIDwgZGltZW5zaW9uKVxuLy8gLSBwaHJhc2VzIChhcnJheSBvZiBwaHJhc2VzKVxuLy8gICAtIG9uIGV4cG9ydCwgZWFjaCBwaHJhc2UgbXVzdCBoYXZlIGFuIGV4dHJhIFwiaW5kZXhcIiBmaWVsZFxuLy8gICAgID0+IHdoZW4gdGhlIGNsYXNzIHJldHVybnMgYSBzZXQgd2l0aCBnZXRQaHJhc2VzT2ZMYWJlbCBvciBnZXRUcmFpbmluZ1NldCxcbi8vICAgICAgICBpdCBzaG91bGQgYWRkIHRoZXNlIGluZGV4IGZpZWxkcyBiZWZvcmUgcmV0dXJuaW5nIHRoZSByZXN1bHQuXG4vLyAgICAgPT4gd2hlbiBhIHNldCBpcyBhZGRlZCB3aXRoIGFkZFRyYWluaW5nU2V0LCB0aGUgaW5kZXhlcyBtdXN0IGJlIHJlbW92ZWRcbi8vICAgICAgICBmcm9tIHRoZSBwaHJhc2VzIGJlZm9yZSB0aGV5IGFyZSBhZGRlZCB0byB0aGUgaW50ZXJuYWwgYXJyYXlcblxuLyoqXG4gKiBYTU0gY29tcGF0aWJsZSB0cmFpbmluZyBzZXQgbWFuYWdlciB1dGlsaXR5IDxiciAvPlxuICogQ2xhc3MgdG8gZWFzZSB0aGUgY3JlYXRpb24gb2YgWE1NIGNvbXBhdGlibGUgdHJhaW5pbmcgc2V0cy4gPGJyIC8+XG4gKiBQaHJhc2VzIHNob3VsZCBiZSBnZW5lcmF0ZWQgd2l0aCB0aGUgUGhyYXNlTWFrZXIgY2xhc3Mgb3IgdGhlIG9yaWdpbmFsIFhNTSBsaWJyYXJ5LlxuICovXG5jbGFzcyBTZXRNYWtlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2NvbmZpZyA9IHt9O1xuICAgIHRoaXMuX3BocmFzZXMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgY3VycmVudCB0b3RhbCBudW1iZXIgb2YgcGhyYXNlcyBpbiB0aGUgc2V0LlxuICAgKiBAcmVhZG9ubHlcbiAgICovXG4gIGdldCBzaXplKCkge1xuICAgIHJldHVybiB0aGlzLl9waHJhc2VzLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYW4gWE1NIHBocmFzZSB0byB0aGUgY3VycmVudCBzZXQuXG4gICAqIEBwYXJhbSB7WG1tUGhyYXNlfSBwaHJhc2UgLSBBbiBYTU0gY29tcGF0aWJsZSBwaHJhc2UgKGllIGNyZWF0ZWQgd2l0aCB0aGUgUGhyYXNlTWFrZXIgY2xhc3MpXG4gICAqL1xuICBhZGRQaHJhc2UocGhyYXNlKSB7XG4gICAgaWYgKHRoaXMuX3BocmFzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLl9zZXRDb25maWdGcm9tKHBocmFzZSk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5fY2hlY2tDb21wYXRpYmlsaXR5KHBocmFzZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQmFkIHBocmFzZSBmb3JtYXQ6IGFkZGVkIHBocmFzZSBtdXN0IG1hdGNoIGN1cnJlbnQgc2V0IGNvbmZpZ3VyYXRpb24nKTtcbiAgICB9XG4gICAgdGhpcy5fcGhyYXNlcy5wdXNoKHBocmFzZSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFsbCBwaHJhc2VzIGZyb20gYW5vdGhlciB0cmFpbmluZyBzZXQuXG4gICAqIEBwYXJhbSB7WG1tVHJhaW5pbmdTZXR9IHNldCAtIEFuIFhNTSBjb21wYXRpYmxlIHRyYWluaW5nIHNldC5cbiAgICovXG4gIGFkZFRyYWluaW5nU2V0KHNldCkge1xuICAgIGlmICh0aGlzLl9waHJhc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5fc2V0Q29uZmlnRnJvbShzZXQpO1xuICAgIH0gZWxzZSBpZiAoIXRoaXMuX2NoZWNrQ29tcGF0aWJpbGl0eShzZXQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JhZCBzZXQgZm9ybWF0OiBhZGRlZCBzZXQgbXVzdCBtYXRjaCBjdXJyZW50IHNldCBjb25maWd1cmF0aW9uJyk7XG4gICAgfVxuXG4gICAgY29uc3QgcGhyYXNlcyA9IHNldFsncGhyYXNlcyddO1xuICAgIGZvciAobGV0IHBocmFzZSBvZiBwaHJhc2VzKSB7XG4gICAgICB0aGlzLl9waHJhc2VzLnB1c2gocGhyYXNlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHBocmFzZSBhdCBhIHBhcnRpY3VsYXIgaW5kZXguXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleCAtIFRoZSBpbmRleCBvZiB0aGUgcGhyYXNlIHRvIHJldHJpZXZlLlxuICAgKiBAcmV0dXJucyB7WG1tUGhyYXNlfVxuICAgKi9cbiAgZ2V0UGhyYXNlKGluZGV4KSB7XG4gICAgaWYgKGluZGV4ID4gLTEgJiYgaW5kZXggPCB0aGlzLl9waHJhc2VzLmxlbmd0aCkge1xuICAgICAgLy8gcmV0dXJuIGEgbmV3IGNvcHkgb2YgdGhlIHBocmFzZSA6XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnNydGluZ2lmeSh0aGlzLl9waHJhc2VzW2luZGV4XSkpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgcGhyYXNlIGF0IGEgcGFydGljdWxhciBpbmRleC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4IC0gVGhlIGluZGV4IG9mIHRoZSBwaHJhc2UgdG8gcmVtb3ZlLlxuICAgKi9cbiAgcmVtb3ZlUGhyYXNlKGluZGV4KSB7XG4gICAgaWYgKGluZGV4ID4gLTEgJiYgaW5kZXggPCB0aGlzLl9waHJhc2VzLmxlbmd0aCkge1xuICAgICAgdGhpcy5fcGhyYXNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHN1YnNldCBvZiBwaHJhc2VzIG9mIGEgcGFydGljdWxhciBsYWJlbC5cbiAgICogQHBhcmFtIHtTdHJpbmd9IGxhYmVsIC0gVGhlIGxhYmVsIG9mIHRoZSBwaHJhc2VzIGZyb20gd2hpY2ggdG8gZ2VuZXJhdGUgdGhlIHN1Yi10cmFpbmluZyBzZXQuXG4gICAqIEByZXR1cm5zIHtYbW1UcmFpbmluZ1NldH1cbiAgICovXG4gIGdldFBocmFzZXNPZkxhYmVsKGxhYmVsKSB7XG4gICAgY29uc3QgcmVzID0ge307XG5cbiAgICBmb3IgKGxldCBwcm9wIGluIHRoaXMuX2NvbmZpZykge1xuICAgICAgcmVzW3Byb3BdID0gdGhpcy5fY29uZmlnW3Byb3BdO1xuICAgIH1cblxuICAgIHJlc1sncGhyYXNlcyddID0gW107XG4gICAgbGV0IGluZGV4ID0gMDtcblxuICAgIGZvciAobGV0IHBocmFzZSBvZiB0aGlzLl9waHJhc2VzKSB7XG4gICAgICBpZiAocGhyYXNlWydsYWJlbCddID09PSBsYWJlbCkge1xuICAgICAgICBsZXQgcCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkocGhyYXNlKSk7XG4gICAgICAgIHBbJ2luZGV4J10gPSBpbmRleCsrO1xuICAgICAgICByZXNbJ3BocmFzZXMnXS5wdXNoKHApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFsbCBwaHJhc2VzIG9mIGEgcGFydGljdWxhciBsYWJlbC5cbiAgICogQHBhcmFtIHtTdHJpbmd9IGxhYmVsIC0gVGhlIGxhYmVsIG9mIHRoZSBwaHJhc2VzIHRvIHJlbW92ZS5cbiAgICovXG4gIHJlbW92ZVBocmFzZXNPZkxhYmVsKGxhYmVsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9waHJhc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5fcGhyYXNlc1tpXVsnbGFiZWwnXSA9PT0gbGFiZWwpIHtcbiAgICAgICAgdGhpcy5waHJhc2VzLnNwbGljZShpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSBjdXJyZW50IHRyYWluaW5nIHNldC5cbiAgICogQHJldHVybnMge1RyYWluaW5nU2V0fVxuICAgKi9cbiAgZ2V0VHJhaW5pbmdTZXQoKSB7XG4gICAgbGV0IHJlcyA9IHt9O1xuXG4gICAgZm9yIChsZXQgcHJvcCBpbiB0aGlzLl9jb25maWcpIHtcbiAgICAgIHJlc1twcm9wXSA9IHRoaXMuX2NvbmZpZ1twcm9wXTtcbiAgICB9XG5cbiAgICByZXNbJ3BocmFzZXMnXSA9IFtdO1xuICAgIGxldCBpbmRleCA9IDA7XG5cbiAgICBmb3IgKGxldCBwaHJhc2Ugb2YgdGhpcy5fcGhyYXNlcykge1xuICAgICAgbGV0IHAgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHBocmFzZSkpO1xuICAgICAgcFsnaW5kZXgnXSA9IGluZGV4Kys7XG4gICAgICByZXNbJ3BocmFzZXMnXS5wdXNoKHApO1xuICAgIH1cblxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXIgdGhlIHdob2xlIHNldC5cbiAgICovXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuX2NvbmZpZyA9IHt9O1xuICAgIHRoaXMuX3BocmFzZXMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB0aGUgY29uZmlnIG9mIGEgcGhyYXNlIG9yIHRyYWluaW5nIHNldCBiZWZvcmUgYXBwbHlpbmcgaXRcbiAgICogdG8gdGhlIGN1cnJlbnQgY2xhc3MuXG4gICAqIFRocm93IGVycm9ycyBpZiBub3QgdmFsaWQgP1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldENvbmZpZ0Zyb20ob2JqKSB7XG4gICAgZm9yIChsZXQgcHJvcCBpbiBvYmopIHtcbiAgICAgIGlmIChwcm9wID09PSAnYmltb2RhbCcgJiYgdHlwZW9mKG9ialsnYmltb2RhbCddKSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2NvbHVtbl9uYW1lcycgJiYgQXJyYXkuaXNBcnJheShvYmpbcHJvcF0pKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9ialtwcm9wXS5zbGljZSgwKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbicgJiYgTnVtYmVyLmlzSW50ZWdlcihvYmpbcHJvcF0pKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbl9pbnB1dCcgJiYgTnVtYmVyLmlzSW50ZWdlcihvYmpbcHJvcF0pKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIHBocmFzZSBvciBzZXQgaXMgY29tcGF0aWJsZSB3aXRoIHRoZSBjdXJyZW50IHNldHRpbmdzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2NoZWNrQ29tcGF0aWJpbGl0eShvYmopIHtcbiAgICBpZiAob2JqWydiaW1vZGFsJ10gIT09IHRoaXMuX2NvbmZpZ1snYmltb2RhbCddXG4gICAgICB8fCBvYmpbJ2RpbWVuc2lvbiddICE9PSB0aGlzLl9jb25maWdbJ2RpbWVuc2lvbiddXG4gICAgICB8fCBvYmpbJ2RpbWVuc2lvbl9pbnB1dCddICE9PSB0aGlzLl9jb25maWdbJ2RpbWVuc2lvbl9pbnB1dCddKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgb2NuID0gb2JqWydjb2x1bW5fbmFtZXMnXTtcbiAgICBjb25zdCBjY24gPSB0aGlzLl9jb25maWdbJ2NvbHVtbl9uYW1lcyddO1xuXG4gICAgaWYgKG9jbi5sZW5ndGggIT09IGNjbi5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvY24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKG9jbltpXSAhPT0gY2NuW2ldKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFNldE1ha2VyOyJdfQ==