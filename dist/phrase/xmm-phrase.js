'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

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
		this._setConfig(options);

		this._data = [];
	}

	(0, _createClass3.default)(PhraseMaker, [{
		key: 'addObservation',
		value: function addObservation(obs) {
			if (Array.isArray(obs)) {
				for (var id in obs) {
					this._data.push(obs[id]);
				}
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
		key: '_setConfig',
		value: function _setConfig() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			for (var prop in options) {
				if (prop === 'bimodal' && typeof options[prop] === 'boolean') {
					this._config[prop] = options[prop];
				} else if (prop === 'dimension' && (0, _isInteger2.default)(options[prop])) {
					this._config[prop] = options[prop];
				} else if (prop === 'dimension_input' && (0, _isInteger2.default)(options[prop])) {
					this._config[prop] = options[prop];
				} else if (prop === 'column_names' && Array.isArray(options[prop])) {
					this._config[prop] = options[prop].slice(0);
				}
			}
		}
	}, {
		key: 'config',
		set: function set() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			this._setConfig(options);
		},
		get: function get() {
			return this._config;
		}
	}, {
		key: 'phrase',
		get: function get() {
			return {
				bimodal: this._config.bimodal,
				dimension: this._config.dimension,
				dimension_input: this._config.dimension_input,
				data: this._data.slice(0),
				length: this._data.length / this._config.dimension
			};
		}
	}]);
	return PhraseMaker;
}();

exports.default = PhraseMaker;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInhtbS1waHJhc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7OztJQU9xQixXO0FBQ3BCLHdCQUEwQjtBQUFBLE1BQWQsT0FBYyx5REFBSixFQUFJO0FBQUE7O0FBQ3pCLE1BQU0sV0FBVztBQUNoQixZQUFTLEtBRE87QUFFaEIsY0FBVyxDQUZLO0FBR2hCLG9CQUFpQixDQUhEO0FBSWhCLGlCQUFjLENBQUMsRUFBRDtBQUpFLEdBQWpCO0FBTUEsT0FBSyxPQUFMLEdBQWUsRUFBZjtBQUNBLE9BQUssVUFBTCxDQUFnQixPQUFoQjs7QUFFQSxPQUFLLEtBQUwsR0FBYSxFQUFiO0FBQ0E7Ozs7aUNBb0JjLEcsRUFBSztBQUNuQixPQUFJLE1BQU0sT0FBTixDQUFjLEdBQWQsQ0FBSixFQUF3QjtBQUN2QixTQUFJLElBQUksRUFBUixJQUFjLEdBQWQsRUFBbUI7QUFDbEIsVUFBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixJQUFJLEVBQUosQ0FBaEI7QUFDQTtBQUNELElBSkQsTUFJTztBQUNOLFNBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsR0FBaEI7QUFDQTtBQUNEOzs7MEJBRU87QUFDUCxRQUFLLEtBQUwsR0FBYSxFQUFiO0FBQ0E7OzsrQkFFd0I7QUFBQSxPQUFkLE9BQWMseURBQUosRUFBSTs7QUFDeEIsUUFBSyxJQUFJLElBQVQsSUFBaUIsT0FBakIsRUFBMEI7QUFDekIsUUFBSSxTQUFTLFNBQVQsSUFBc0IsT0FBTyxRQUFRLElBQVIsQ0FBUCxLQUEwQixTQUFwRCxFQUErRDtBQUM5RCxVQUFLLE9BQUwsQ0FBYSxJQUFiLElBQXFCLFFBQVEsSUFBUixDQUFyQjtBQUNBLEtBRkQsTUFFTyxJQUFJLFNBQVMsV0FBVCxJQUF3Qix5QkFBaUIsUUFBUSxJQUFSLENBQWpCLENBQTVCLEVBQTZEO0FBQ25FLFVBQUssT0FBTCxDQUFhLElBQWIsSUFBcUIsUUFBUSxJQUFSLENBQXJCO0FBQ0EsS0FGTSxNQUVBLElBQUksU0FBUyxpQkFBVCxJQUE4Qix5QkFBaUIsUUFBUSxJQUFSLENBQWpCLENBQWxDLEVBQW1FO0FBQ3pFLFVBQUssT0FBTCxDQUFhLElBQWIsSUFBcUIsUUFBUSxJQUFSLENBQXJCO0FBQ0EsS0FGTSxNQUVBLElBQUksU0FBUyxjQUFULElBQTJCLE1BQU0sT0FBTixDQUFjLFFBQVEsSUFBUixDQUFkLENBQS9CLEVBQTZEO0FBQ25FLFVBQUssT0FBTCxDQUFhLElBQWIsSUFBcUIsUUFBUSxJQUFSLEVBQWMsS0FBZCxDQUFvQixDQUFwQixDQUFyQjtBQUNBO0FBQ0Q7QUFDRDs7O3NCQTVDd0I7QUFBQSxPQUFkLE9BQWMseURBQUosRUFBSTs7QUFDeEIsUUFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0EsRztzQkFFWTtBQUNaLFVBQU8sS0FBSyxPQUFaO0FBQ0E7OztzQkFFWTtBQUNaLFVBQU87QUFDTixhQUFTLEtBQUssT0FBTCxDQUFhLE9BRGhCO0FBRU4sZUFBVyxLQUFLLE9BQUwsQ0FBYSxTQUZsQjtBQUdOLHFCQUFpQixLQUFLLE9BQUwsQ0FBYSxlQUh4QjtBQUlOLFVBQU0sS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixDQUFqQixDQUpBO0FBS04sWUFBUSxLQUFLLEtBQUwsQ0FBVyxNQUFYLEdBQW9CLEtBQUssT0FBTCxDQUFhO0FBTG5DLElBQVA7QUFPQTs7Ozs7a0JBOUJtQixXO0FBMkRwQiIsImZpbGUiOiJ4bW0tcGhyYXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDbGFzcyB0byBlYXNlIHRoZSBjcmVhdGlvbiBvZiBYTU0gY29tcGF0aWJsZSBkYXRhIHJlY29yZGluZ3NcbiAqIGFibGUgdG8gdmFsaWRhdGUgYSByZWNvcmRlZCBidWZmZXIgKHBocmFzZSkgb3IgZGlyZWN0bHkgcmVjb3JkIGEgdmFsaWQgcGhyYXNlXG4gKlxuICogQHRvZG8gc3BlY2lmeSBhbmQgaW1wbGVtZW50XG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGhyYXNlTWFrZXIge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcblx0XHRjb25zdCBkZWZhdWx0cyA9IHtcblx0XHRcdGJpbW9kYWw6IGZhbHNlLFxuXHRcdFx0ZGltZW5zaW9uOiAxLFxuXHRcdFx0ZGltZW5zaW9uX2lucHV0OiAwLFxuXHRcdFx0Y29sdW1uX25hbWVzOiBbJyddXG5cdFx0fVxuXHRcdHRoaXMuX2NvbmZpZyA9IHt9O1xuXHRcdHRoaXMuX3NldENvbmZpZyhvcHRpb25zKTtcblxuXHRcdHRoaXMuX2RhdGEgPSBbXTtcblx0fVxuXG5cdHNldCBjb25maWcob3B0aW9ucyA9IHt9KSB7XG5cdFx0dGhpcy5fc2V0Q29uZmlnKG9wdGlvbnMpO1xuXHR9XG5cblx0Z2V0IGNvbmZpZygpIHtcblx0XHRyZXR1cm4gdGhpcy5fY29uZmlnO1xuXHR9XG5cblx0Z2V0IHBocmFzZSgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Ymltb2RhbDogdGhpcy5fY29uZmlnLmJpbW9kYWwsXG5cdFx0XHRkaW1lbnNpb246IHRoaXMuX2NvbmZpZy5kaW1lbnNpb24sXG5cdFx0XHRkaW1lbnNpb25faW5wdXQ6IHRoaXMuX2NvbmZpZy5kaW1lbnNpb25faW5wdXQsXG5cdFx0XHRkYXRhOiB0aGlzLl9kYXRhLnNsaWNlKDApLFxuXHRcdFx0bGVuZ3RoOiB0aGlzLl9kYXRhLmxlbmd0aCAvIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25cblx0XHR9O1xuXHR9XG5cblx0YWRkT2JzZXJ2YXRpb24ob2JzKSB7XG5cdFx0aWYgKEFycmF5LmlzQXJyYXkob2JzKSkge1xuXHRcdFx0Zm9yKGxldCBpZCBpbiBvYnMpIHtcblx0XHRcdFx0dGhpcy5fZGF0YS5wdXNoKG9ic1tpZF0pO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLl9kYXRhLnB1c2gob2JzKTtcblx0XHR9XG5cdH1cblxuXHRyZXNldCgpIHtcblx0XHR0aGlzLl9kYXRhID0gW107XG5cdH1cblxuXHRfc2V0Q29uZmlnKG9wdGlvbnMgPSB7fSkge1xuXHRcdGZvciAobGV0IHByb3AgaW4gb3B0aW9ucykge1xuXHRcdFx0aWYgKHByb3AgPT09ICdiaW1vZGFsJyAmJiB0eXBlb2Yob3B0aW9uc1twcm9wXSkgPT09ICdib29sZWFuJykge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuXHRcdFx0fSBlbHNlIGlmIChwcm9wID09PSAnZGltZW5zaW9uJyAmJiBOdW1iZXIuaXNJbnRlZ2VyKG9wdGlvbnNbcHJvcF0pKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG5cdFx0XHR9IGVsc2UgaWYgKHByb3AgPT09ICdkaW1lbnNpb25faW5wdXQnICYmIE51bWJlci5pc0ludGVnZXIob3B0aW9uc1twcm9wXSkpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcblx0XHRcdH0gZWxzZSBpZiAocHJvcCA9PT0gJ2NvbHVtbl9uYW1lcycgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zW3Byb3BdKSkge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdLnNsaWNlKDApO1xuXHRcdFx0fVxuXHRcdH1cdFx0XG5cdH1cbn07Il19