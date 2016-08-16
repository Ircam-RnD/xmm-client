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
		key: '_setConfig',
		value: function _setConfig() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			for (var prop in options) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInhtbS1waHJhc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7OztJQU9xQixXO0FBQ3BCLHdCQUEwQjtBQUFBLE1BQWQsT0FBYyx5REFBSixFQUFJO0FBQUE7O0FBQ3pCLE1BQU0sV0FBVztBQUNoQixZQUFTLEtBRE87QUFFaEIsY0FBVyxDQUZLO0FBR2hCLG9CQUFpQixDQUhEO0FBSWhCLGlCQUFjLENBQUMsRUFBRDtBQUpFLEdBQWpCO0FBTUEsT0FBSyxPQUFMLEdBQWUsRUFBZjtBQUNBLE9BQUssVUFBTCxDQUFnQixPQUFoQjs7QUFFQSxPQUFLLEtBQUwsR0FBYSxFQUFiO0FBQ0E7Ozs7b0NBb0JpQixHLEVBQUs7QUFDdEIsT0FBSSxNQUFNLE9BQU4sQ0FBYyxHQUFkLENBQUosRUFBd0I7QUFDdkIsU0FBSyxTQUFMLEdBQWlCLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBakI7QUFDQSxJQUZELE1BRU87QUFDTixTQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLEdBQWhCO0FBQ0E7QUFDRDs7OzBCQUVPO0FBQ1AsUUFBSyxLQUFMLEdBQWEsRUFBYjtBQUNBOzs7K0JBRXdCO0FBQUEsT0FBZCxPQUFjLHlEQUFKLEVBQUk7O0FBQ3hCLFFBQUssSUFBSSxJQUFULElBQWlCLE9BQWpCLEVBQTBCO0FBQ3pCLFFBQUksU0FBUyxTQUFULElBQXNCLE9BQU8sUUFBUSxJQUFSLENBQVAsS0FBMEIsU0FBcEQsRUFBK0Q7QUFDOUQsVUFBSyxPQUFMLENBQWEsSUFBYixJQUFxQixRQUFRLElBQVIsQ0FBckI7QUFDQSxLQUZELE1BRU8sSUFBSSxTQUFTLFdBQVQsSUFBd0IseUJBQWlCLFFBQVEsSUFBUixDQUFqQixDQUE1QixFQUE2RDtBQUNuRSxVQUFLLE9BQUwsQ0FBYSxJQUFiLElBQXFCLFFBQVEsSUFBUixDQUFyQjtBQUNBLEtBRk0sTUFFQSxJQUFJLFNBQVMsaUJBQVQsSUFBOEIseUJBQWlCLFFBQVEsSUFBUixDQUFqQixDQUFsQyxFQUFtRTtBQUN6RSxVQUFLLE9BQUwsQ0FBYSxHQUFiLElBQW9CLFFBQVEsSUFBUixDQUFwQjtBQUNBLEtBRk0sTUFFQSxJQUFJLFNBQVMsY0FBVCxJQUEyQixNQUFNLE9BQU4sQ0FBYyxRQUFRLElBQVIsQ0FBZCxDQUEvQixFQUE2RDtBQUNuRSxVQUFLLE9BQUwsQ0FBYSxJQUFiLElBQXFCLFFBQVEsSUFBUixFQUFjLEtBQWQsQ0FBb0IsQ0FBcEIsQ0FBckI7QUFDQTtBQUNEO0FBQ0Q7OztzQkExQ3dCO0FBQUEsT0FBZCxPQUFjLHlEQUFKLEVBQUk7O0FBQ3hCLFFBQUssVUFBTCxDQUFnQixPQUFoQjtBQUNBLEc7c0JBRVk7QUFDWixVQUFPLEtBQUssT0FBWjtBQUNBOzs7c0JBRVk7QUFDWixPQUFJLE1BQU07QUFDVCxhQUFTLEtBQUssT0FBTCxDQUFhLE9BRGI7QUFFVCxlQUFXLEtBQUssT0FBTCxDQUFhLFNBRmY7QUFHVCxxQkFBaUIsS0FBSyxPQUFMLENBQWEsZUFIckI7QUFJVCxVQUFNLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsQ0FBakI7QUFKRyxJQUFWO0FBTUEsVUFBTyxHQUFQO0FBQ0E7Ozs7O2tCQTlCbUIsVztBQXlEcEIiLCJmaWxlIjoieG1tLXBocmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ2xhc3MgdG8gZWFzZSB0aGUgY3JlYXRpb24gb2YgWE1NIGNvbXBhdGlibGUgZGF0YSByZWNvcmRpbmdzXG4gKiBhYmxlIHRvIHZhbGlkYXRlIGEgcmVjb3JkZWQgYnVmZmVyIChwaHJhc2UpIG9yIGRpcmVjdGx5IHJlY29yZCBhIHZhbGlkIHBocmFzZVxuICpcbiAqIEB0b2RvIHNwZWNpZnkgYW5kIGltcGxlbWVudFxuICovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBocmFzZU1ha2VyIHtcblx0Y29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG5cdFx0Y29uc3QgZGVmYXVsdHMgPSB7XG5cdFx0XHRiaW1vZGFsOiBmYWxzZSxcblx0XHRcdGRpbWVuc2lvbjogMSxcblx0XHRcdGRpbWVuc2lvbl9pbnB1dDogMCxcblx0XHRcdGNvbHVtbl9uYW1lczogWycnXVxuXHRcdH1cblx0XHR0aGlzLl9jb25maWcgPSB7fTtcblx0XHR0aGlzLl9zZXRDb25maWcob3B0aW9ucyk7XG5cblx0XHR0aGlzLl9kYXRhID0gW107XG5cdH1cblxuXHRzZXQgY29uZmlnKG9wdGlvbnMgPSB7fSkge1xuXHRcdHRoaXMuX3NldENvbmZpZyhvcHRpb25zKTtcblx0fVxuXG5cdGdldCBjb25maWcoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2NvbmZpZztcblx0fVxuXG5cdGdldCBwaHJhc2UoKSB7XG5cdFx0bGV0IHJlcyA9IHtcblx0XHRcdGJpbW9kYWw6IHRoaXMuX2NvbmZpZy5iaW1vZGFsLFxuXHRcdFx0ZGltZW5zaW9uOiB0aGlzLl9jb25maWcuZGltZW5zaW9uLFxuXHRcdFx0ZGltZW5zaW9uX2lucHV0OiB0aGlzLl9jb25maWcuZGltZW5zaW9uX2lucHV0LFxuXHRcdFx0ZGF0YTogdGhpcy5fZGF0YS5zbGljZSgwKVxuXHRcdH07XG5cdFx0cmV0dXJuIHJlcztcblx0fVxuXG5cdGFwcGVuZE9ic2VydmF0aW9uKG9icykge1xuXHRcdGlmIChBcnJheS5pc0FycmF5KG9icykpIHtcblx0XHRcdHRoaXMuX2RhdGFkYXRhID0gZGF0YS5jb25jYXQob2JzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5fZGF0YS5wdXNoKG9icyk7XG5cdFx0fVxuXHR9XG5cblx0cmVzZXQoKSB7XG5cdFx0dGhpcy5fZGF0YSA9IFtdO1xuXHR9XG5cblx0X3NldENvbmZpZyhvcHRpb25zID0ge30pIHtcblx0XHRmb3IgKGxldCBwcm9wIGluIG9wdGlvbnMpIHtcblx0XHRcdGlmIChwcm9wID09PSAnYmltb2RhbCcgJiYgdHlwZW9mKG9wdGlvbnNbcHJvcF0pID09PSAnYm9vbGVhbicpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcblx0XHRcdH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbicgJiYgTnVtYmVyLmlzSW50ZWdlcihvcHRpb25zW3Byb3BdKSkge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuXHRcdFx0fSBlbHNlIGlmIChwcm9wID09PSAnZGltZW5zaW9uX2lucHV0JyAmJiBOdW1iZXIuaXNJbnRlZ2VyKG9wdGlvbnNbcHJvcF0pKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZ1twb3BdID0gb3B0aW9uc1twcm9wXTtcblx0XHRcdH0gZWxzZSBpZiAocHJvcCA9PT0gJ2NvbHVtbl9uYW1lcycgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zW3Byb3BdKSkge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdLnNsaWNlKDApO1xuXHRcdFx0fVxuXHRcdH1cdFx0XG5cdH1cbn07Il19