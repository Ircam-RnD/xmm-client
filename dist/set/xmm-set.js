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
      this._phrases.push(phrase);
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
      for (var i = 0; i < this._phrases.length; i++) {
        if (this._phrases[i]['label'] === label) {
          this.phrases.splice(i, 1);
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
  }]);
  return SetMaker;
}();

;

exports.default = SetMaker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInhtbS1zZXQuanMiXSwibmFtZXMiOlsiU2V0TWFrZXIiLCJfY29uZmlnIiwiX3BocmFzZXMiLCJsZW5ndGgiLCJwaHJhc2UiLCJfc2V0Q29uZmlnRnJvbSIsIl9jaGVja0NvbXBhdGliaWxpdHkiLCJFcnJvciIsInB1c2giLCJzZXQiLCJwaHJhc2VzIiwiaW5kZXgiLCJKU09OIiwicGFyc2UiLCJzcnRpbmdpZnkiLCJzcGxpY2UiLCJsYWJlbCIsInJlcyIsInByb3AiLCJwIiwiaSIsIm9iaiIsIkFycmF5IiwiaXNBcnJheSIsInNsaWNlIiwib2NuIiwiY2NuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7SUFLTUEsUTtBQUNKLHNCQUFjO0FBQUE7O0FBQ1osU0FBS0MsT0FBTCxHQUFlLEVBQWY7QUFDQSxTQUFLQyxRQUFMLEdBQWdCLEVBQWhCO0FBQ0Q7O0FBRUQ7Ozs7QUFJQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7Ozs7OzhCQUlVO0FBQ1IsYUFBTyxLQUFLQSxRQUFMLENBQWNDLE1BQXJCO0FBQ0Q7O0FBRUQ7Ozs7Ozs7OEJBSVVDLE0sRUFBUTtBQUNoQixVQUFJLEtBQUtGLFFBQUwsQ0FBY0MsTUFBZCxLQUF5QixDQUE3QixFQUFnQztBQUM5QixhQUFLRSxjQUFMLENBQW9CRCxNQUFwQjtBQUNELE9BRkQsTUFFTyxJQUFJLENBQUMsS0FBS0UsbUJBQUwsQ0FBeUJGLE1BQXpCLENBQUwsRUFBdUM7QUFDNUMsY0FBTSxJQUFJRyxLQUFKLENBQVUsc0VBQVYsQ0FBTjtBQUNEO0FBQ0QsV0FBS0wsUUFBTCxDQUFjTSxJQUFkLENBQW1CSixNQUFuQjtBQUNEOztBQUVEOzs7Ozs7O21DQUllSyxHLEVBQUs7QUFDbEIsVUFBSSxLQUFLUCxRQUFMLENBQWNDLE1BQWQsS0FBeUIsQ0FBN0IsRUFBZ0M7QUFDOUIsYUFBS0UsY0FBTCxDQUFvQkksR0FBcEI7QUFDRCxPQUZELE1BRU8sSUFBSSxDQUFDLEtBQUtILG1CQUFMLENBQXlCRyxHQUF6QixDQUFMLEVBQW9DO0FBQ3pDLGNBQU0sSUFBSUYsS0FBSixDQUFVLGdFQUFWLENBQU47QUFDRDs7QUFFRCxVQUFNRyxVQUFVRCxJQUFJLFNBQUosQ0FBaEI7QUFQa0I7QUFBQTtBQUFBOztBQUFBO0FBUWxCLHdEQUFtQkMsT0FBbkIsNEdBQTRCO0FBQUEsY0FBbkJOLE1BQW1COztBQUMxQixlQUFLRixRQUFMLENBQWNNLElBQWQsQ0FBbUJKLE1BQW5CO0FBQ0Q7QUFWaUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVduQjs7QUFFRDs7Ozs7Ozs7OEJBS1VPLEssRUFBTztBQUNmLFVBQUlBLFFBQVEsQ0FBQyxDQUFULElBQWNBLFFBQVEsS0FBS1QsUUFBTCxDQUFjQyxNQUF4QyxFQUFnRDtBQUM5QztBQUNBLGVBQU9TLEtBQUtDLEtBQUwsQ0FBV0QsS0FBS0UsU0FBTCxDQUFlLEtBQUtaLFFBQUwsQ0FBY1MsS0FBZCxDQUFmLENBQVgsQ0FBUDtBQUNEO0FBQ0QsYUFBTyxJQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozs7aUNBSWFBLEssRUFBTztBQUNsQixVQUFJQSxRQUFRLENBQUMsQ0FBVCxJQUFjQSxRQUFRLEtBQUtULFFBQUwsQ0FBY0MsTUFBeEMsRUFBZ0Q7QUFDOUMsYUFBS0QsUUFBTCxDQUFjYSxNQUFkLENBQXFCSixLQUFyQixFQUE0QixDQUE1QjtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7Ozs7O3NDQUtrQkssSyxFQUFPO0FBQ3ZCLFVBQU1DLE1BQU0sRUFBWjs7QUFFQSxXQUFLLElBQUlDLElBQVQsSUFBaUIsS0FBS2pCLE9BQXRCLEVBQStCO0FBQzdCZ0IsWUFBSUMsSUFBSixJQUFZLEtBQUtqQixPQUFMLENBQWFpQixJQUFiLENBQVo7QUFDRDs7QUFFREQsVUFBSSxTQUFKLElBQWlCLEVBQWpCO0FBQ0EsVUFBSU4sUUFBUSxDQUFaOztBQVJ1QjtBQUFBO0FBQUE7O0FBQUE7QUFVdkIseURBQW1CLEtBQUtULFFBQXhCLGlIQUFrQztBQUFBLGNBQXpCRSxNQUF5Qjs7QUFDaEMsY0FBSUEsT0FBTyxPQUFQLE1BQW9CWSxLQUF4QixFQUErQjtBQUM3QixnQkFBSUcsSUFBSVAsS0FBS0MsS0FBTCxDQUFXLHlCQUFlVCxNQUFmLENBQVgsQ0FBUjtBQUNBZSxjQUFFLE9BQUYsSUFBYVIsT0FBYjtBQUNBTSxnQkFBSSxTQUFKLEVBQWVULElBQWYsQ0FBb0JXLENBQXBCO0FBQ0Q7QUFDRjtBQWhCc0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFrQnZCLGFBQU9GLEdBQVA7QUFDRDs7QUFFRDs7Ozs7Ozt5Q0FJcUJELEssRUFBTztBQUMxQixXQUFLLElBQUlJLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLbEIsUUFBTCxDQUFjQyxNQUFsQyxFQUEwQ2lCLEdBQTFDLEVBQStDO0FBQzdDLFlBQUksS0FBS2xCLFFBQUwsQ0FBY2tCLENBQWQsRUFBaUIsT0FBakIsTUFBOEJKLEtBQWxDLEVBQXlDO0FBQ3ZDLGVBQUtOLE9BQUwsQ0FBYUssTUFBYixDQUFvQkssQ0FBcEIsRUFBdUIsQ0FBdkI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQ7Ozs7Ozs7cUNBSWlCO0FBQ2YsVUFBSUgsTUFBTSxFQUFWOztBQUVBLFdBQUssSUFBSUMsSUFBVCxJQUFpQixLQUFLakIsT0FBdEIsRUFBK0I7QUFDN0JnQixZQUFJQyxJQUFKLElBQVksS0FBS2pCLE9BQUwsQ0FBYWlCLElBQWIsQ0FBWjtBQUNEOztBQUVERCxVQUFJLFNBQUosSUFBaUIsRUFBakI7QUFDQSxVQUFJTixRQUFRLENBQVo7O0FBUmU7QUFBQTtBQUFBOztBQUFBO0FBVWYseURBQW1CLEtBQUtULFFBQXhCLGlIQUFrQztBQUFBLGNBQXpCRSxNQUF5Qjs7QUFDaEMsY0FBSWUsSUFBSVAsS0FBS0MsS0FBTCxDQUFXLHlCQUFlVCxNQUFmLENBQVgsQ0FBUjtBQUNBZSxZQUFFLE9BQUYsSUFBYVIsT0FBYjtBQUNBTSxjQUFJLFNBQUosRUFBZVQsSUFBZixDQUFvQlcsQ0FBcEI7QUFDRDtBQWRjO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBZ0JmLGFBQU9GLEdBQVA7QUFDRDs7QUFFRDs7Ozs7OzRCQUdRO0FBQ04sV0FBS2hCLE9BQUwsR0FBZSxFQUFmO0FBQ0EsV0FBS0MsUUFBTCxHQUFnQixFQUFoQjtBQUNEOztBQUVEOzs7Ozs7Ozs7bUNBTWVtQixHLEVBQUs7QUFDbEIsV0FBSyxJQUFJSCxJQUFULElBQWlCRyxHQUFqQixFQUFzQjtBQUNwQixZQUFJSCxTQUFTLFNBQVQsSUFBc0IsT0FBT0csSUFBSSxTQUFKLENBQVAsS0FBMkIsU0FBckQsRUFBZ0U7QUFDOUQsZUFBS3BCLE9BQUwsQ0FBYWlCLElBQWIsSUFBcUJHLElBQUlILElBQUosQ0FBckI7QUFDRCxTQUZELE1BRU8sSUFBSUEsU0FBUyxjQUFULElBQTJCSSxNQUFNQyxPQUFOLENBQWNGLElBQUlILElBQUosQ0FBZCxDQUEvQixFQUF5RDtBQUM5RCxlQUFLakIsT0FBTCxDQUFhaUIsSUFBYixJQUFxQkcsSUFBSUgsSUFBSixFQUFVTSxLQUFWLENBQWdCLENBQWhCLENBQXJCO0FBQ0QsU0FGTSxNQUVBLElBQUlOLFNBQVMsV0FBVCxJQUF3Qix5QkFBaUJHLElBQUlILElBQUosQ0FBakIsQ0FBNUIsRUFBeUQ7QUFDOUQsZUFBS2pCLE9BQUwsQ0FBYWlCLElBQWIsSUFBcUJHLElBQUlILElBQUosQ0FBckI7QUFDRCxTQUZNLE1BRUEsSUFBSUEsU0FBUyxpQkFBVCxJQUE4Qix5QkFBaUJHLElBQUlILElBQUosQ0FBakIsQ0FBbEMsRUFBK0Q7QUFDcEUsZUFBS2pCLE9BQUwsQ0FBYWlCLElBQWIsSUFBcUJHLElBQUlILElBQUosQ0FBckI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQ7Ozs7Ozs7d0NBSW9CRyxHLEVBQUs7QUFDdkIsVUFBSUEsSUFBSSxTQUFKLE1BQW1CLEtBQUtwQixPQUFMLENBQWEsU0FBYixDQUFuQixJQUNDb0IsSUFBSSxXQUFKLE1BQXFCLEtBQUtwQixPQUFMLENBQWEsV0FBYixDQUR0QixJQUVDb0IsSUFBSSxpQkFBSixNQUEyQixLQUFLcEIsT0FBTCxDQUFhLGlCQUFiLENBRmhDLEVBRWlFO0FBQy9ELGVBQU8sS0FBUDtBQUNEOztBQUVELFVBQU13QixNQUFNSixJQUFJLGNBQUosQ0FBWjtBQUNBLFVBQU1LLE1BQU0sS0FBS3pCLE9BQUwsQ0FBYSxjQUFiLENBQVo7O0FBRUEsVUFBSXdCLElBQUl0QixNQUFKLEtBQWV1QixJQUFJdkIsTUFBdkIsRUFBK0I7QUFDN0IsZUFBTyxLQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsYUFBSyxJQUFJaUIsSUFBSSxDQUFiLEVBQWdCQSxJQUFJSyxJQUFJdEIsTUFBeEIsRUFBZ0NpQixHQUFoQyxFQUFxQztBQUNuQyxjQUFJSyxJQUFJTCxDQUFKLE1BQVdNLElBQUlOLENBQUosQ0FBZixFQUF1QjtBQUNyQixtQkFBTyxLQUFQO0FBQ0Q7QUFDRjtBQUNGOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7OztBQUNGOztrQkFFY3BCLFEiLCJmaWxlIjoieG1tLXNldC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEFuIHhtbS1jb21wYXRpYmxlIHRyYWluaW5nIHNldCBtdXN0IGhhdmUgdGhlIGZvbGxvd2luZyBmaWVsZHMgOlxuLy8gLSBiaW1vZGFsIChib29sZWFuKVxuLy8gLSBjb2x1bW5fbmFtZXMgKGFycmF5IG9mIHN0cmluZ3MpXG4vLyAtIGRpbWVuc2lvbiAoaW50ZWdlcilcbi8vIC0gZGltZW5zaW9uX2lucHV0IChpbnRlZ2VyIDwgZGltZW5zaW9uKVxuLy8gLSBwaHJhc2VzIChhcnJheSBvZiBwaHJhc2VzKVxuLy8gICAtIG9uIGV4cG9ydCwgZWFjaCBwaHJhc2UgbXVzdCBoYXZlIGFuIGV4dHJhIFwiaW5kZXhcIiBmaWVsZFxuLy8gICAgID0+IHdoZW4gdGhlIGNsYXNzIHJldHVybnMgYSBzZXQgd2l0aCBnZXRQaHJhc2VzT2ZMYWJlbCBvciBnZXRUcmFpbmluZ1NldCxcbi8vICAgICAgICBpdCBzaG91bGQgYWRkIHRoZXNlIGluZGV4IGZpZWxkcyBiZWZvcmUgcmV0dXJuaW5nIHRoZSByZXN1bHQuXG4vLyAgICAgPT4gd2hlbiBhIHNldCBpcyBhZGRlZCB3aXRoIGFkZFRyYWluaW5nU2V0LCB0aGUgaW5kZXhlcyBtdXN0IGJlIHJlbW92ZWRcbi8vICAgICAgICBmcm9tIHRoZSBwaHJhc2VzIGJlZm9yZSB0aGV5IGFyZSBhZGRlZCB0byB0aGUgaW50ZXJuYWwgYXJyYXlcblxuLyoqXG4gKiBYTU0gY29tcGF0aWJsZSB0cmFpbmluZyBzZXQgbWFuYWdlciB1dGlsaXR5IDxiciAvPlxuICogQ2xhc3MgdG8gZWFzZSB0aGUgY3JlYXRpb24gb2YgWE1NIGNvbXBhdGlibGUgdHJhaW5pbmcgc2V0cy4gPGJyIC8+XG4gKiBQaHJhc2VzIHNob3VsZCBiZSBnZW5lcmF0ZWQgd2l0aCB0aGUgUGhyYXNlTWFrZXIgY2xhc3Mgb3IgdGhlIG9yaWdpbmFsIFhNTSBsaWJyYXJ5LlxuICovXG5jbGFzcyBTZXRNYWtlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2NvbmZpZyA9IHt9O1xuICAgIHRoaXMuX3BocmFzZXMgPSBbXTtcbiAgfVxuXG4gIC8qKipcbiAgICogVGhlIGN1cnJlbnQgdG90YWwgbnVtYmVyIG9mIHBocmFzZXMgaW4gdGhlIHNldC5cbiAgICogQHJlYWRvbmx5XG4gICAqL1xuICAvLyBnZXQgc2l6ZSgpIHtcbiAgLy8gICByZXR1cm4gdGhpcy5fcGhyYXNlcy5sZW5ndGg7XG4gIC8vIH1cblxuICAvKipcbiAgICogQSB2YWxpZCBYTU0gdHJhaW5pbmcgc2V0LCByZWFkeSB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIFhNTSBsaWJyYXJ5LlxuICAgKiBAdHlwZWRlZiB4bW1UcmFpbmluZ1NldFxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAbmFtZSB4bW1UcmFpbmluZ1NldFxuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IGJpbW9kYWwgLSBJbmRpY2F0ZXMgd2V0aGVyIHRoZSBzZXQncyBwaHJhc2VzIGRhdGEgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYmltb2RhbC5cbiAgICogSWYgdHJ1ZSwgdGhlIDxjb2RlPmRpbWVuc2lvbl9pbnB1dDwvY29kZT4gcHJvcGVydHkgd2lsbCBiZSB0YWtlbiBpbnRvIGFjY291bnQuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkaW1lbnNpb24gLSBTaXplIG9mIGEgdmVjdG9yIGVsZW1lbnQgb2YgdGhlIHNldCdzIHBocmFzZXMuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkaW1lbnNpb25faW5wdXQgLSBTaXplIG9mIHRoZSBwYXJ0IG9mIGFuIGlucHV0IHZlY3RvciBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRyYWluaW5nLlxuICAgKiBUaGlzIGltcGxpZXMgdGhhdCB0aGUgcmVzdCBvZiB0aGUgdmVjdG9yIChvZiBzaXplIDxjb2RlPmRpbWVuc2lvbiAtIGRpbWVuc2lvbl9pbnB1dDwvY29kZT4pXG4gICAqIHdpbGwgYmUgdXNlZCBmb3IgcmVncmVzc2lvbi4gT25seSB0YWtlbiBpbnRvIGFjY291bnQgaWYgPGNvZGU+Ymltb2RhbDwvY29kZT4gaXMgdHJ1ZS5cbiAgICogQHByb3BlcnR5IHtBcnJheS5TdHJpbmd9IGNvbHVtbl9uYW1lcyAtIEFycmF5IG9mIHN0cmluZyBpZGVudGlmaWVycyBkZXNjcmliaW5nIGVhY2ggc2NhbGFyIG9mIGEgcGhyYXNlJ3MgdmVjdG9yIGVsZW1lbnRzLlxuICAgKiBUeXBpY2FsbHkgb2Ygc2l6ZSA8Y29kZT5kaW1lbnNpb248L2NvZGU+LlxuICAgKiBAcHJvcGVydHkge0FycmF5LnhtbVBocmFzZX0gcGhyYXNlcyAgLSBBcnJheSBvZiB2YWxpZCBYTU0gcGhyYXNlcyBjb250YWluaW5nIGFuIGV4dHJhIFwiaW5kZXhcIiBmaWVsZC5cbiAgICovXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdG90YWwgbnVtYmVyIG9mIHBocmFzZXMgYWN0dWFsbHkgaW4gdGhlIHNldC5cbiAgICogQHJldHVybnMge051bWJlcn1cbiAgICovXG4gIGdldFNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BocmFzZXMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBYTU0gcGhyYXNlIHRvIHRoZSBjdXJyZW50IHNldC5cbiAgICogQHBhcmFtIHt4bW1QaHJhc2V9IHBocmFzZSAtIEFuIFhNTSBjb21wYXRpYmxlIHBocmFzZSAoaWUgY3JlYXRlZCB3aXRoIHRoZSBQaHJhc2VNYWtlciBjbGFzcylcbiAgICovXG4gIGFkZFBocmFzZShwaHJhc2UpIHtcbiAgICBpZiAodGhpcy5fcGhyYXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuX3NldENvbmZpZ0Zyb20ocGhyYXNlKTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9jaGVja0NvbXBhdGliaWxpdHkocGhyYXNlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCYWQgcGhyYXNlIGZvcm1hdDogYWRkZWQgcGhyYXNlIG11c3QgbWF0Y2ggY3VycmVudCBzZXQgY29uZmlndXJhdGlvbicpO1xuICAgIH1cbiAgICB0aGlzLl9waHJhc2VzLnB1c2gocGhyYXNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYWxsIHBocmFzZXMgZnJvbSBhbm90aGVyIHRyYWluaW5nIHNldC5cbiAgICogQHBhcmFtIHt4bW1UcmFpbmluZ1NldH0gc2V0IC0gQW4gWE1NIGNvbXBhdGlibGUgdHJhaW5pbmcgc2V0LlxuICAgKi9cbiAgYWRkVHJhaW5pbmdTZXQoc2V0KSB7XG4gICAgaWYgKHRoaXMuX3BocmFzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLl9zZXRDb25maWdGcm9tKHNldCk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5fY2hlY2tDb21wYXRpYmlsaXR5KHNldCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQmFkIHNldCBmb3JtYXQ6IGFkZGVkIHNldCBtdXN0IG1hdGNoIGN1cnJlbnQgc2V0IGNvbmZpZ3VyYXRpb24nKTtcbiAgICB9XG5cbiAgICBjb25zdCBwaHJhc2VzID0gc2V0WydwaHJhc2VzJ107XG4gICAgZm9yIChsZXQgcGhyYXNlIG9mIHBocmFzZXMpIHtcbiAgICAgIHRoaXMuX3BocmFzZXMucHVzaChwaHJhc2UpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcGhyYXNlIGF0IGEgcGFydGljdWxhciBpbmRleC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4IC0gVGhlIGluZGV4IG9mIHRoZSBwaHJhc2UgdG8gcmV0cmlldmUuXG4gICAqIEByZXR1cm5zIHt4bW1QaHJhc2V9XG4gICAqL1xuICBnZXRQaHJhc2UoaW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPiAtMSAmJiBpbmRleCA8IHRoaXMuX3BocmFzZXMubGVuZ3RoKSB7XG4gICAgICAvLyByZXR1cm4gYSBuZXcgY29weSBvZiB0aGUgcGhyYXNlIDpcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3J0aW5naWZ5KHRoaXMuX3BocmFzZXNbaW5kZXhdKSk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBwaHJhc2UgYXQgYSBwYXJ0aWN1bGFyIGluZGV4LlxuICAgKiBAcGFyYW0ge051bWJlcn0gaW5kZXggLSBUaGUgaW5kZXggb2YgdGhlIHBocmFzZSB0byByZW1vdmUuXG4gICAqL1xuICByZW1vdmVQaHJhc2UoaW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPiAtMSAmJiBpbmRleCA8IHRoaXMuX3BocmFzZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9waHJhc2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgc3Vic2V0IG9mIHBocmFzZXMgb2YgYSBwYXJ0aWN1bGFyIGxhYmVsLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbGFiZWwgLSBUaGUgbGFiZWwgb2YgdGhlIHBocmFzZXMgZnJvbSB3aGljaCB0byBnZW5lcmF0ZSB0aGUgc3ViLXRyYWluaW5nIHNldC5cbiAgICogQHJldHVybnMge3htbVRyYWluaW5nU2V0fVxuICAgKi9cbiAgZ2V0UGhyYXNlc09mTGFiZWwobGFiZWwpIHtcbiAgICBjb25zdCByZXMgPSB7fTtcblxuICAgIGZvciAobGV0IHByb3AgaW4gdGhpcy5fY29uZmlnKSB7XG4gICAgICByZXNbcHJvcF0gPSB0aGlzLl9jb25maWdbcHJvcF07XG4gICAgfVxuXG4gICAgcmVzWydwaHJhc2VzJ10gPSBbXTtcbiAgICBsZXQgaW5kZXggPSAwO1xuXG4gICAgZm9yIChsZXQgcGhyYXNlIG9mIHRoaXMuX3BocmFzZXMpIHtcbiAgICAgIGlmIChwaHJhc2VbJ2xhYmVsJ10gPT09IGxhYmVsKSB7XG4gICAgICAgIGxldCBwID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShwaHJhc2UpKTtcbiAgICAgICAgcFsnaW5kZXgnXSA9IGluZGV4Kys7XG4gICAgICAgIHJlc1sncGhyYXNlcyddLnB1c2gocCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYWxsIHBocmFzZXMgb2YgYSBwYXJ0aWN1bGFyIGxhYmVsLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbGFiZWwgLSBUaGUgbGFiZWwgb2YgdGhlIHBocmFzZXMgdG8gcmVtb3ZlLlxuICAgKi9cbiAgcmVtb3ZlUGhyYXNlc09mTGFiZWwobGFiZWwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3BocmFzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLl9waHJhc2VzW2ldWydsYWJlbCddID09PSBsYWJlbCkge1xuICAgICAgICB0aGlzLnBocmFzZXMuc3BsaWNlKGksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGN1cnJlbnQgdHJhaW5pbmcgc2V0LlxuICAgKiBAcmV0dXJucyB7eG1tVHJhaW5pbmdTZXR9XG4gICAqL1xuICBnZXRUcmFpbmluZ1NldCgpIHtcbiAgICBsZXQgcmVzID0ge307XG5cbiAgICBmb3IgKGxldCBwcm9wIGluIHRoaXMuX2NvbmZpZykge1xuICAgICAgcmVzW3Byb3BdID0gdGhpcy5fY29uZmlnW3Byb3BdO1xuICAgIH1cblxuICAgIHJlc1sncGhyYXNlcyddID0gW107XG4gICAgbGV0IGluZGV4ID0gMDtcblxuICAgIGZvciAobGV0IHBocmFzZSBvZiB0aGlzLl9waHJhc2VzKSB7XG4gICAgICBsZXQgcCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkocGhyYXNlKSk7XG4gICAgICBwWydpbmRleCddID0gaW5kZXgrKztcbiAgICAgIHJlc1sncGhyYXNlcyddLnB1c2gocCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciB0aGUgd2hvbGUgc2V0LlxuICAgKi9cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5fY29uZmlnID0ge307XG4gICAgdGhpcy5fcGhyYXNlcyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHRoZSBjb25maWcgb2YgYSBwaHJhc2Ugb3IgdHJhaW5pbmcgc2V0IGJlZm9yZSBhcHBseWluZyBpdFxuICAgKiB0byB0aGUgY3VycmVudCBjbGFzcy5cbiAgICogVGhyb3cgZXJyb3JzIGlmIG5vdCB2YWxpZCA/XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0Q29uZmlnRnJvbShvYmopIHtcbiAgICBmb3IgKGxldCBwcm9wIGluIG9iaikge1xuICAgICAgaWYgKHByb3AgPT09ICdiaW1vZGFsJyAmJiB0eXBlb2Yob2JqWydiaW1vZGFsJ10pID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnY29sdW1uX25hbWVzJyAmJiBBcnJheS5pc0FycmF5KG9ialtwcm9wXSkpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb2JqW3Byb3BdLnNsaWNlKDApO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnZGltZW5zaW9uJyAmJiBOdW1iZXIuaXNJbnRlZ2VyKG9ialtwcm9wXSkpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnZGltZW5zaW9uX2lucHV0JyAmJiBOdW1iZXIuaXNJbnRlZ2VyKG9ialtwcm9wXSkpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgcGhyYXNlIG9yIHNldCBpcyBjb21wYXRpYmxlIHdpdGggdGhlIGN1cnJlbnQgc2V0dGluZ3MuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2hlY2tDb21wYXRpYmlsaXR5KG9iaikge1xuICAgIGlmIChvYmpbJ2JpbW9kYWwnXSAhPT0gdGhpcy5fY29uZmlnWydiaW1vZGFsJ11cbiAgICAgIHx8IG9ialsnZGltZW5zaW9uJ10gIT09IHRoaXMuX2NvbmZpZ1snZGltZW5zaW9uJ11cbiAgICAgIHx8IG9ialsnZGltZW5zaW9uX2lucHV0J10gIT09IHRoaXMuX2NvbmZpZ1snZGltZW5zaW9uX2lucHV0J10pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBvY24gPSBvYmpbJ2NvbHVtbl9uYW1lcyddO1xuICAgIGNvbnN0IGNjbiA9IHRoaXMuX2NvbmZpZ1snY29sdW1uX25hbWVzJ107XG5cbiAgICBpZiAob2NuLmxlbmd0aCAhPT0gY2NuLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9jbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAob2NuW2ldICE9PSBjY25baV0pIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgU2V0TWFrZXI7Il19