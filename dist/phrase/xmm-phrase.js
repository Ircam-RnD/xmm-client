'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

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
			column_names: [''],
			label: ''
		};
		(0, _assign2.default)(defaults, options);
		this._config = {};
		this._setConfig(options);

		this.reset();
		// does :
		// this._data = [];
		// this._data_in = [];
		// this._data_out = [];
	}

	(0, _createClass3.default)(PhraseMaker, [{
		key: 'addObservation',
		value: function addObservation(obs) {
			if (obs.length != this._config.dimension || Number.isNumber(obs) && this._config.dimension != 1) {
				console.error('error : incoming observation length not matching with dimensions');
				return;
			}
			if (this._config.bimodal) {
				this._data_in = this._data_in.concat(obs.slice(0, this._config.dimension_input));
				this._data_out = this._data_out.concat(obs.slice(this._config.dimension_input));
			} else {
				if (Array.isArray(obs)) {
					this._data = this._data.concat(obs);
				} else {
					this._data.push(obs);
				}
			}
		}
	}, {
		key: 'reset',
		value: function reset() {
			this._data = [];
			this._data_in = [];
			this._data_out = [];
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
				} else if (prop === 'label' && typeof options[prop] === 'string') {
					this._config[prop] = options[prop];
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
				label: this._config.label,
				data: this._data.slice(0),
				data_input: this._data_in.slice(0),
				data_output: this._data_out.slice(0),
				length: this._config.bimodal ? this._data_in.length / this._config.dimension_input : this._data.length / this._config.dimension
			};
		}
	}]);
	return PhraseMaker;
}();

exports.default = PhraseMaker;
//# sourceMappingURL=data:application/json;base64,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LE9BQWMseURBQUosRUFBSTs7QUFDeEIsUUFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0EsRztzQkFFWTtBQUNaLFVBQU8sS0FBSyxPQUFaO0FBQ0E7OztzQkFFWTtBQUNaLFVBQU87QUFDTixhQUFTLEtBQUssT0FBTCxDQUFhLE9BRGhCO0FBRU4sZUFBVyxLQUFLLE9BQUwsQ0FBYSxTQUZsQjtBQUdOLHFCQUFpQixLQUFLLE9BQUwsQ0FBYSxlQUh4QjtBQUlOLFdBQU8sS0FBSyxPQUFMLENBQWEsS0FKZDtBQUtOLFVBQU0sS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixDQUFqQixDQUxBO0FBTU4sZ0JBQVksS0FBSyxRQUFMLENBQWMsS0FBZCxDQUFvQixDQUFwQixDQU5OO0FBT04saUJBQWEsS0FBSyxTQUFMLENBQWUsS0FBZixDQUFxQixDQUFyQixDQVBQO0FBUU4sWUFBUSxLQUFLLE9BQUwsQ0FBYSxPQUFiLEdBQ0gsS0FBSyxRQUFMLENBQWMsTUFBZCxHQUF1QixLQUFLLE9BQUwsQ0FBYSxlQURqQyxHQUVILEtBQUssS0FBTCxDQUFXLE1BQVgsR0FBb0IsS0FBSyxPQUFMLENBQWE7QUFWaEMsSUFBUDtBQVlBOzs7OztrQkF6Q21CLFciLCJmaWxlIjoieG1tLXBocmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ2xhc3MgdG8gZWFzZSB0aGUgY3JlYXRpb24gb2YgWE1NIGNvbXBhdGlibGUgZGF0YSByZWNvcmRpbmdzXG4gKiBhYmxlIHRvIHZhbGlkYXRlIGEgcmVjb3JkZWQgYnVmZmVyIChwaHJhc2UpIG9yIGRpcmVjdGx5IHJlY29yZCBhIHZhbGlkIHBocmFzZVxuICpcbiAqIEB0b2RvIHNwZWNpZnkgYW5kIGltcGxlbWVudFxuICovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBocmFzZU1ha2VyIHtcblx0Y29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG5cdFx0Y29uc3QgZGVmYXVsdHMgPSB7XG5cdFx0XHRiaW1vZGFsOiBmYWxzZSxcblx0XHRcdGRpbWVuc2lvbjogMSxcblx0XHRcdGRpbWVuc2lvbl9pbnB1dDogMCxcblx0XHRcdGNvbHVtbl9uYW1lczogWycnXSxcblx0XHRcdGxhYmVsOiAnJ1xuXHRcdH1cblx0XHRPYmplY3QuYXNzaWduKGRlZmF1bHRzLCBvcHRpb25zKTtcblx0XHR0aGlzLl9jb25maWcgPSB7fTtcblx0XHR0aGlzLl9zZXRDb25maWcob3B0aW9ucyk7XG5cblx0XHR0aGlzLnJlc2V0KCk7XG5cdFx0Ly8gZG9lcyA6XG5cdFx0Ly8gdGhpcy5fZGF0YSA9IFtdO1xuXHRcdC8vIHRoaXMuX2RhdGFfaW4gPSBbXTtcblx0XHQvLyB0aGlzLl9kYXRhX291dCA9IFtdO1xuXHR9XG5cblx0c2V0IGNvbmZpZyhvcHRpb25zID0ge30pIHtcblx0XHR0aGlzLl9zZXRDb25maWcob3B0aW9ucyk7XG5cdH1cblxuXHRnZXQgY29uZmlnKCkge1xuXHRcdHJldHVybiB0aGlzLl9jb25maWc7XG5cdH1cblxuXHRnZXQgcGhyYXNlKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRiaW1vZGFsOiB0aGlzLl9jb25maWcuYmltb2RhbCxcblx0XHRcdGRpbWVuc2lvbjogdGhpcy5fY29uZmlnLmRpbWVuc2lvbixcblx0XHRcdGRpbWVuc2lvbl9pbnB1dDogdGhpcy5fY29uZmlnLmRpbWVuc2lvbl9pbnB1dCxcblx0XHRcdGxhYmVsOiB0aGlzLl9jb25maWcubGFiZWwsXG5cdFx0XHRkYXRhOiB0aGlzLl9kYXRhLnNsaWNlKDApLFxuXHRcdFx0ZGF0YV9pbnB1dDogdGhpcy5fZGF0YV9pbi5zbGljZSgwKSxcblx0XHRcdGRhdGFfb3V0cHV0OiB0aGlzLl9kYXRhX291dC5zbGljZSgwKSxcblx0XHRcdGxlbmd0aDogdGhpcy5fY29uZmlnLmJpbW9kYWxcblx0XHRcdFx0XHRcdD9cdHRoaXMuX2RhdGFfaW4ubGVuZ3RoIC8gdGhpcy5fY29uZmlnLmRpbWVuc2lvbl9pbnB1dFxuXHRcdFx0XHRcdFx0OiB0aGlzLl9kYXRhLmxlbmd0aCAvIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25cblx0XHR9O1xuXHR9XG5cblx0YWRkT2JzZXJ2YXRpb24ob2JzKSB7XG5cdFx0aWYgKG9icy5sZW5ndGggIT0gdGhpcy5fY29uZmlnLmRpbWVuc2lvbiB8fFxuXHRcdFx0XHQoTnVtYmVyLmlzTnVtYmVyKG9icykgJiYgdGhpcy5fY29uZmlnLmRpbWVuc2lvbiAhPSAxKSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcblx0XHRcdFx0J2Vycm9yIDogaW5jb21pbmcgb2JzZXJ2YXRpb24gbGVuZ3RoIG5vdCBtYXRjaGluZyB3aXRoIGRpbWVuc2lvbnMnXG5cdFx0XHQpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpZiAodGhpcy5fY29uZmlnLmJpbW9kYWwpIHtcblx0XHRcdHRoaXMuX2RhdGFfaW4gPSB0aGlzLl9kYXRhX2luLmNvbmNhdChcblx0XHRcdFx0b2JzLnNsaWNlKDAsIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25faW5wdXQpXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5fZGF0YV9vdXQgPSB0aGlzLl9kYXRhX291dC5jb25jYXQoXG5cdFx0XHRcdG9icy5zbGljZSh0aGlzLl9jb25maWcuZGltZW5zaW9uX2lucHV0KVxuXHRcdFx0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkob2JzKSkge1xuXHRcdFx0XHR0aGlzLl9kYXRhID0gdGhpcy5fZGF0YS5jb25jYXQob2JzKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuX2RhdGEucHVzaChvYnMpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJlc2V0KCkge1xuXHRcdHRoaXMuX2RhdGEgPSBbXTtcblx0XHR0aGlzLl9kYXRhX2luID0gW107XG5cdFx0dGhpcy5fZGF0YV9vdXQgPSBbXTtcblx0fVxuXG5cdF9zZXRDb25maWcob3B0aW9ucyA9IHt9KSB7XG5cdFx0Zm9yIChsZXQgcHJvcCBpbiBvcHRpb25zKSB7XG5cdFx0XHRpZiAocHJvcCA9PT0gJ2JpbW9kYWwnICYmIHR5cGVvZihvcHRpb25zW3Byb3BdKSA9PT0gJ2Jvb2xlYW4nKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG5cdFx0XHR9IGVsc2UgaWYgKHByb3AgPT09ICdkaW1lbnNpb24nICYmIE51bWJlci5pc0ludGVnZXIob3B0aW9uc1twcm9wXSkpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcblx0XHRcdH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbl9pbnB1dCcgJiYgTnVtYmVyLmlzSW50ZWdlcihvcHRpb25zW3Byb3BdKSkge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuXHRcdFx0fSBlbHNlIGlmIChwcm9wID09PSAnY29sdW1uX25hbWVzJyAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnNbcHJvcF0pKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF0uc2xpY2UoMCk7XG5cdFx0XHR9IGVsc2UgaWYgKHByb3AgPT09ICdsYWJlbCcgJiYgdHlwZW9mKG9wdGlvbnNbcHJvcF0pID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuXHRcdFx0fVxuXHRcdH1cdFx0XG5cdH1cbn0iXX0=