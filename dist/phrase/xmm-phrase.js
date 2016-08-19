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
			if (obs.length !== this._config.dimension || typeof obs === 'number' && this._config.dimension !== 1) {
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
				column_names: this._config.column_names,
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
;
//# sourceMappingURL=data:application/json;base64,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ZCxPQUFjLHlEQUFKLEVBQUk7O0FBQ3hCLFFBQUssVUFBTCxDQUFnQixPQUFoQjtBQUNBLEc7c0JBRVk7QUFDWixVQUFPLEtBQUssT0FBWjtBQUNBOzs7c0JBRVk7QUFDWixVQUFPO0FBQ04sYUFBUyxLQUFLLE9BQUwsQ0FBYSxPQURoQjtBQUVOLGtCQUFjLEtBQUssT0FBTCxDQUFhLFlBRnJCO0FBR04sZUFBVyxLQUFLLE9BQUwsQ0FBYSxTQUhsQjtBQUlOLHFCQUFpQixLQUFLLE9BQUwsQ0FBYSxlQUp4QjtBQUtOLFdBQU8sS0FBSyxPQUFMLENBQWEsS0FMZDtBQU1OLFVBQU0sS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixDQUFqQixDQU5BO0FBT04sZ0JBQVksS0FBSyxRQUFMLENBQWMsS0FBZCxDQUFvQixDQUFwQixDQVBOO0FBUU4saUJBQWEsS0FBSyxTQUFMLENBQWUsS0FBZixDQUFxQixDQUFyQixDQVJQO0FBU04sWUFBUSxLQUFLLE9BQUwsQ0FBYSxPQUFiLEdBQ0gsS0FBSyxRQUFMLENBQWMsTUFBZCxHQUF1QixLQUFLLE9BQUwsQ0FBYSxlQURqQyxHQUVILEtBQUssS0FBTCxDQUFXLE1BQVgsR0FBb0IsS0FBSyxPQUFMLENBQWE7QUFYaEMsSUFBUDtBQWFBOzs7OztrQkExQ21CLFc7QUEwRnBCIiwiZmlsZSI6InhtbS1waHJhc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENsYXNzIHRvIGVhc2UgdGhlIGNyZWF0aW9uIG9mIFhNTSBjb21wYXRpYmxlIGRhdGEgcmVjb3JkaW5nc1xuICogYWJsZSB0byB2YWxpZGF0ZSBhIHJlY29yZGVkIGJ1ZmZlciAocGhyYXNlKSBvciBkaXJlY3RseSByZWNvcmQgYSB2YWxpZCBwaHJhc2VcbiAqXG4gKiBAdG9kbyBzcGVjaWZ5IGFuZCBpbXBsZW1lbnRcbiAqL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQaHJhc2VNYWtlciB7XG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuXHRcdGNvbnN0IGRlZmF1bHRzID0ge1xuXHRcdFx0Ymltb2RhbDogZmFsc2UsXG5cdFx0XHRkaW1lbnNpb246IDEsXG5cdFx0XHRkaW1lbnNpb25faW5wdXQ6IDAsXG5cdFx0XHRjb2x1bW5fbmFtZXM6IFsnJ10sXG5cdFx0XHRsYWJlbDogJydcblx0XHR9XG5cdFx0T2JqZWN0LmFzc2lnbihkZWZhdWx0cywgb3B0aW9ucyk7XG5cdFx0dGhpcy5fY29uZmlnID0ge307XG5cdFx0dGhpcy5fc2V0Q29uZmlnKG9wdGlvbnMpO1xuXG5cdFx0dGhpcy5yZXNldCgpO1xuXHRcdC8vIGRvZXMgOlxuXHRcdC8vIHRoaXMuX2RhdGEgPSBbXTtcblx0XHQvLyB0aGlzLl9kYXRhX2luID0gW107XG5cdFx0Ly8gdGhpcy5fZGF0YV9vdXQgPSBbXTtcblx0fVxuXG5cdHNldCBjb25maWcob3B0aW9ucyA9IHt9KSB7XG5cdFx0dGhpcy5fc2V0Q29uZmlnKG9wdGlvbnMpO1xuXHR9XG5cblx0Z2V0IGNvbmZpZygpIHtcblx0XHRyZXR1cm4gdGhpcy5fY29uZmlnO1xuXHR9XG5cblx0Z2V0IHBocmFzZSgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Ymltb2RhbDogdGhpcy5fY29uZmlnLmJpbW9kYWwsXG5cdFx0XHRjb2x1bW5fbmFtZXM6IHRoaXMuX2NvbmZpZy5jb2x1bW5fbmFtZXMsXG5cdFx0XHRkaW1lbnNpb246IHRoaXMuX2NvbmZpZy5kaW1lbnNpb24sXG5cdFx0XHRkaW1lbnNpb25faW5wdXQ6IHRoaXMuX2NvbmZpZy5kaW1lbnNpb25faW5wdXQsXG5cdFx0XHRsYWJlbDogdGhpcy5fY29uZmlnLmxhYmVsLFxuXHRcdFx0ZGF0YTogdGhpcy5fZGF0YS5zbGljZSgwKSxcblx0XHRcdGRhdGFfaW5wdXQ6IHRoaXMuX2RhdGFfaW4uc2xpY2UoMCksXG5cdFx0XHRkYXRhX291dHB1dDogdGhpcy5fZGF0YV9vdXQuc2xpY2UoMCksXG5cdFx0XHRsZW5ndGg6IHRoaXMuX2NvbmZpZy5iaW1vZGFsXG5cdFx0XHRcdFx0XHQ/XHR0aGlzLl9kYXRhX2luLmxlbmd0aCAvIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25faW5wdXRcblx0XHRcdFx0XHRcdDogdGhpcy5fZGF0YS5sZW5ndGggLyB0aGlzLl9jb25maWcuZGltZW5zaW9uXG5cdFx0fTtcblx0fVxuXG5cdGFkZE9ic2VydmF0aW9uKG9icykge1xuXHRcdGlmIChvYnMubGVuZ3RoICE9PSB0aGlzLl9jb25maWcuZGltZW5zaW9uIHx8XG5cdFx0XHRcdCh0eXBlb2Yob2JzKSA9PT0gJ251bWJlcicgJiYgdGhpcy5fY29uZmlnLmRpbWVuc2lvbiAhPT0gMSkpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXG5cdFx0XHRcdCdlcnJvciA6IGluY29taW5nIG9ic2VydmF0aW9uIGxlbmd0aCBub3QgbWF0Y2hpbmcgd2l0aCBkaW1lbnNpb25zJ1xuXHRcdFx0KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5fY29uZmlnLmJpbW9kYWwpIHtcblx0XHRcdHRoaXMuX2RhdGFfaW4gPSB0aGlzLl9kYXRhX2luLmNvbmNhdChcblx0XHRcdFx0b2JzLnNsaWNlKDAsIHRoaXMuX2NvbmZpZy5kaW1lbnNpb25faW5wdXQpXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5fZGF0YV9vdXQgPSB0aGlzLl9kYXRhX291dC5jb25jYXQoXG5cdFx0XHRcdG9icy5zbGljZSh0aGlzLl9jb25maWcuZGltZW5zaW9uX2lucHV0KVxuXHRcdFx0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkob2JzKSkge1xuXHRcdFx0XHR0aGlzLl9kYXRhID0gdGhpcy5fZGF0YS5jb25jYXQob2JzKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuX2RhdGEucHVzaChvYnMpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJlc2V0KCkge1xuXHRcdHRoaXMuX2RhdGEgPSBbXTtcblx0XHR0aGlzLl9kYXRhX2luID0gW107XG5cdFx0dGhpcy5fZGF0YV9vdXQgPSBbXTtcblx0fVxuXG5cdF9zZXRDb25maWcob3B0aW9ucyA9IHt9KSB7XG5cdFx0Zm9yIChsZXQgcHJvcCBpbiBvcHRpb25zKSB7XG5cdFx0XHRpZiAocHJvcCA9PT0gJ2JpbW9kYWwnICYmIHR5cGVvZihvcHRpb25zW3Byb3BdKSA9PT0gJ2Jvb2xlYW4nKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF07XG5cdFx0XHR9IGVsc2UgaWYgKHByb3AgPT09ICdkaW1lbnNpb24nICYmIE51bWJlci5pc0ludGVnZXIob3B0aW9uc1twcm9wXSkpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcblx0XHRcdH0gZWxzZSBpZiAocHJvcCA9PT0gJ2RpbWVuc2lvbl9pbnB1dCcgJiYgTnVtYmVyLmlzSW50ZWdlcihvcHRpb25zW3Byb3BdKSkge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuXHRcdFx0fSBlbHNlIGlmIChwcm9wID09PSAnY29sdW1uX25hbWVzJyAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnNbcHJvcF0pKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZ1twcm9wXSA9IG9wdGlvbnNbcHJvcF0uc2xpY2UoMCk7XG5cdFx0XHR9IGVsc2UgaWYgKHByb3AgPT09ICdsYWJlbCcgJiYgdHlwZW9mKG9wdGlvbnNbcHJvcF0pID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHR0aGlzLl9jb25maWdbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuXHRcdFx0fVxuXHRcdH1cdFx0XG5cdH1cbn07Il19