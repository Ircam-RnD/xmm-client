'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Class to ease the creation of XMM compatible data recordings
 * able to validate a recorded buffer (phrase) or directly record a valid phrase
 *
 * @todo specify and implement
 */

var PhraseMaker = function () {
	function PhraseMaker() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		(0, _classCallCheck3.default)(this, PhraseMaker);

		var defaults = {
			bimodal: false,
			dimension: 1,
			dimension_input: 0,
			column_names: ['']
		};
		this._config = {};
		config(options);

		this._data = [];
	}

	(0, _createClass3.default)(PhraseMaker, [{
		key: 'appendObservation',
		value: function appendObservation(obs) {
			if (Array.isArray(obs)) {
				this._datadata = data.concat(obs);
			} else {
				this._data.push(obs);
			}
		}
	}, {
		key: 'reset',
		value: function reset() {
			this._data = [];
		}
	}, {
		key: 'config',
		set: function set() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = (0, _getIterator3.default)(options), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var prop = _step.value;

					if (prop === 'bimodal' && typeof options[prop] === 'boolean') {
						this._config[prop] = options[prop];
					} else if (prop === 'dimension' && (0, _isInteger2.default)(options[prop])) {
						this._config[prop] = options[prop];
					} else if (prop === 'dimension_input' && (0, _isInteger2.default)(options[prop])) {
						this._config[pop] = options[prop];
					} else if (prop === 'column_names' && Array.isArray(options[prop])) {
						this._config[prop] = options[prop].slice(0);
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
		},
		get: function get() {
			return this._config;
		}
	}, {
		key: 'phrase',
		get: function get() {
			var res = {
				bimodal: this._config.bimodal,
				dimension: this._config.dimension,
				dimension_input: this._config.dimension_input,
				data: this._data.slice(0)
			};
			return res;
		}
	}]);
	return PhraseMaker;
}();

exports.default = PhraseMaker;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInhtbS1waHJhc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7SUFPcUIsVztBQUNwQix3QkFBMEI7QUFBQSxNQUFkLE9BQWMseURBQUosRUFBSTtBQUFBOztBQUN6QixNQUFNLFdBQVc7QUFDaEIsWUFBUyxLQURPO0FBRWhCLGNBQVcsQ0FGSztBQUdoQixvQkFBaUIsQ0FIRDtBQUloQixpQkFBYyxDQUFDLEVBQUQ7QUFKRSxHQUFqQjtBQU1BLE9BQUssT0FBTCxHQUFlLEVBQWY7QUFDQSxTQUFPLE9BQVA7O0FBRUEsT0FBSyxLQUFMLEdBQWEsRUFBYjtBQUNBOzs7O29DQThCaUIsRyxFQUFLO0FBQ3RCLE9BQUksTUFBTSxPQUFOLENBQWMsR0FBZCxDQUFKLEVBQXdCO0FBQ3ZCLFNBQUssU0FBTCxHQUFpQixLQUFLLE1BQUwsQ0FBWSxHQUFaLENBQWpCO0FBQ0EsSUFGRCxNQUVPO0FBQ04sU0FBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixHQUFoQjtBQUNBO0FBQ0Q7OzswQkFFTztBQUNQLFFBQUssS0FBTCxHQUFhLEVBQWI7QUFDQTs7O3NCQXRDd0I7QUFBQSxPQUFkLE9BQWMseURBQUosRUFBSTtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUN4QixvREFBaUIsT0FBakIsNEdBQTBCO0FBQUEsU0FBakIsSUFBaUI7O0FBQ3pCLFNBQUksU0FBUyxTQUFULElBQXNCLE9BQU8sUUFBUSxJQUFSLENBQVAsS0FBMEIsU0FBcEQsRUFBK0Q7QUFDOUQsV0FBSyxPQUFMLENBQWEsSUFBYixJQUFxQixRQUFRLElBQVIsQ0FBckI7QUFDQSxNQUZELE1BRU8sSUFBSSxTQUFTLFdBQVQsSUFBd0IseUJBQWlCLFFBQVEsSUFBUixDQUFqQixDQUE1QixFQUE2RDtBQUNuRSxXQUFLLE9BQUwsQ0FBYSxJQUFiLElBQXFCLFFBQVEsSUFBUixDQUFyQjtBQUNBLE1BRk0sTUFFQSxJQUFJLFNBQVMsaUJBQVQsSUFBOEIseUJBQWlCLFFBQVEsSUFBUixDQUFqQixDQUFsQyxFQUFtRTtBQUN6RSxXQUFLLE9BQUwsQ0FBYSxHQUFiLElBQW9CLFFBQVEsSUFBUixDQUFwQjtBQUNBLE1BRk0sTUFFQSxJQUFJLFNBQVMsY0FBVCxJQUEyQixNQUFNLE9BQU4sQ0FBYyxRQUFRLElBQVIsQ0FBZCxDQUEvQixFQUE2RDtBQUNuRSxXQUFLLE9BQUwsQ0FBYSxJQUFiLElBQXFCLFFBQVEsSUFBUixFQUFjLEtBQWQsQ0FBb0IsQ0FBcEIsQ0FBckI7QUFDQTtBQUNEO0FBWHVCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFZeEIsRztzQkFFWTtBQUNaLFVBQU8sS0FBSyxPQUFaO0FBQ0E7OztzQkFFWTtBQUNaLE9BQUksTUFBTTtBQUNULGFBQVMsS0FBSyxPQUFMLENBQWEsT0FEYjtBQUVULGVBQVcsS0FBSyxPQUFMLENBQWEsU0FGZjtBQUdULHFCQUFpQixLQUFLLE9BQUwsQ0FBYSxlQUhyQjtBQUlULFVBQU0sS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixDQUFqQjtBQUpHLElBQVY7QUFNQSxVQUFPLEdBQVA7QUFDQTs7Ozs7a0JBeENtQixXO0FBcURwQiIsImZpbGUiOiJ4bW0tcGhyYXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDbGFzcyB0byBlYXNlIHRoZSBjcmVhdGlvbiBvZiBYTU0gY29tcGF0aWJsZSBkYXRhIHJlY29yZGluZ3NcbiAqIGFibGUgdG8gdmFsaWRhdGUgYSByZWNvcmRlZCBidWZmZXIgKHBocmFzZSkgb3IgZGlyZWN0bHkgcmVjb3JkIGEgdmFsaWQgcGhyYXNlXG4gKlxuICogQHRvZG8gc3BlY2lmeSBhbmQgaW1wbGVtZW50XG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGhyYXNlTWFrZXIge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcblx0XHRjb25zdCBkZWZhdWx0cyA9IHtcblx0XHRcdGJpbW9kYWw6IGZhbHNlLFxuXHRcdFx0ZGltZW5zaW9uOiAxLFxuXHRcdFx0ZGltZW5zaW9uX2lucHV0OiAwLFxuXHRcdFx0Y29sdW1uX25hbWVzOiBbJyddXG5cdFx0fVxuXHRcdHRoaXMuX2NvbmZpZyA9IHt9O1xuXHRcdGNvbmZpZyhvcHRpb25zKTtcblxuXHRcdHRoaXMuX2RhdGEgPSBbXTtcblx0fVxuXG5cdHNldCBjb25maWcob3B0aW9ucyA9IHt9KSB7XG5cdFx0Zm9yIChsZXQgcHJvcCBvZiBvcHRpb25zKSB7XG5cdFx0XHRpZiAocHJvcCA9PT0gJ2JpbW9kYWwnICYmIHR5cGVvZihvcHRpb25zW3Byb3BdKSA9PT0gJ2Jvb2xlYW4nKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG5cdFx0XHR9IGVsc2UgaWYgKHByb3AgPT09ICdkaW1lbnNpb24nICYmIE51bWJlci5pc0ludGVnZXIob3B0aW9uc1twcm9wXSkpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcblx0XHRcdH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbl9pbnB1dCcgJiYgTnVtYmVyLmlzSW50ZWdlcihvcHRpb25zW3Byb3BdKSkge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcG9wXSA9IG9wdGlvbnNbcHJvcF07XG5cdFx0XHR9IGVsc2UgaWYgKHByb3AgPT09ICdjb2x1bW5fbmFtZXMnICYmIEFycmF5LmlzQXJyYXkob3B0aW9uc1twcm9wXSkpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXS5zbGljZSgwKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRnZXQgY29uZmlnKCkge1xuXHRcdHJldHVybiB0aGlzLl9jb25maWc7XG5cdH1cblxuXHRnZXQgcGhyYXNlKCkge1xuXHRcdGxldCByZXMgPSB7XG5cdFx0XHRiaW1vZGFsOiB0aGlzLl9jb25maWcuYmltb2RhbCxcblx0XHRcdGRpbWVuc2lvbjogdGhpcy5fY29uZmlnLmRpbWVuc2lvbixcblx0XHRcdGRpbWVuc2lvbl9pbnB1dDogdGhpcy5fY29uZmlnLmRpbWVuc2lvbl9pbnB1dCxcblx0XHRcdGRhdGE6IHRoaXMuX2RhdGEuc2xpY2UoMClcblx0XHR9O1xuXHRcdHJldHVybiByZXM7XG5cdH1cblxuXHRhcHBlbmRPYnNlcnZhdGlvbihvYnMpIHtcblx0XHRpZiAoQXJyYXkuaXNBcnJheShvYnMpKSB7XG5cdFx0XHR0aGlzLl9kYXRhZGF0YSA9IGRhdGEuY29uY2F0KG9icyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuX2RhdGEucHVzaChvYnMpO1xuXHRcdH1cblx0fVxuXG5cdHJlc2V0KCkge1xuXHRcdHRoaXMuX2RhdGEgPSBbXTtcblx0fVxufTsiXX0=