'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _wavesLfo = require('waves-lfo');

var lfo = _interopRequireWildcard(_wavesLfo);

var _xmmDecoderCommon = require('./xmm-decoder-common');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO : add reset() function (empty likelihood_buffer)

//=================== THE EXPORTED CLASS ======================//

var XmmGmmDecoder = function (_lfo$core$BaseLfo) {
	(0, _inherits3.default)(XmmGmmDecoder, _lfo$core$BaseLfo);

	function XmmGmmDecoder() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		(0, _classCallCheck3.default)(this, XmmGmmDecoder);

		var defaults = {
			likelihoodWindow: 5
		};

		var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(XmmGmmDecoder).call(this, defaults, options));

		_this.model = undefined;
		_this.modelResults = undefined;
		_this.likelihoodWindow = _this.params.likelihoodWindow;
		// original xmm modelResults fields :
		// instantLikelihoods, instantNormalizedLikelihoods,
		// smoothedLikelihoods, smoothedNormalizedLikelihoods,
		// smoothedLogLikelihoods, likeliest, outputValues, outputVariance
		return _this;
	}

	(0, _createClass3.default)(XmmGmmDecoder, [{
		key: 'process',
		value: function process(time, frame, metaData) {

			//incoming frame is observation vector
			if (this.model === undefined) {
				console.log("no model loaded");
				return;
			}

			this.time = time;
			this.metaData = metaData;

			var outFrame = this.outFrame;

			(0, _xmmDecoderCommon.gmmLikelihoods)(frame, this.model, this.modelResults);
			//gmmLikelihoods(frame, this.model, this.modelResults);			

			for (var i = 0; i < this.model.models.length; i++) {
				outFrame[i] = this.modelResults.smoothed_normalized_likelihoods[i];
			}

			this.output();
		}
	}, {
		key: 'setModel',
		value: function setModel(model) {
			this.model = undefined;
			this.modelResults = undefined;

			// test if model is valid here (TODO : write a better test)
			if (model.models !== undefined) {
				this.model = model;
				var nmodels = model.models.length;
				this.modelResults = {
					instant_likelihoods: new Array(nmodels),
					smoothed_log_likelihoods: new Array(nmodels),
					smoothed_likelihoods: new Array(nmodels),
					instant_normalized_likelihoods: new Array(nmodels),
					smoothed_normalized_likelihoods: new Array(nmodels),
					likeliest: -1,
					singleClassGmmModelResults: []
				};

				for (var i = 0; i < model.models.length; i++) {

					this.modelResults.instant_likelihoods[i] = 0;
					this.modelResults.smoothed_log_likelihoods[i] = 0;
					this.modelResults.smoothed_likelihoods[i] = 0;
					this.modelResults.instant_normalized_likelihoods[i] = 0;
					this.modelResults.smoothed_normalized_likelihoods[i] = 0;

					var res = {};
					res.instant_likelihood = 0;
					res.log_likelihood = 0;
					res.likelihood_buffer = [];
					res.likelihood_buffer.length = this.likelihoodWindow;
					for (var j = 0; j < this.likelihoodWindow; j++) {
						res.likelihood_buffer[j] = 1 / this.likelihoodWindow;
					}
					this.modelResults.singleClassGmmModelResults.push(res);
				}
			}

			this.initialize({ frameSize: this.model.models.length });
		}
	}, {
		key: 'setLikelihoodWindow',
		value: function setLikelihoodWindow(newWindowSize) {
			this.likelihoodWindow = newWindowSize;
			if (this.model === undefined) return;
			var res = this.modelResults.singleClassModelResults;
			for (var i = 0; i < this.model.models.length; i++) {
				res[i].likelihood_buffer = [];
				res[i].likelihood_buffer.length = this.likelihoodWindow;
				for (var j = 0; j < this.likelihoodWindow; j++) {
					res.likelihood_buffer[j] = 1 / this.likelihoodWindow;
				}
			}
		}
	}, {
		key: 'setVarianceOffset',
		value: function setVarianceOffset() {
			// not used for now (need to implement updateInverseCovariance method)
		}
	}, {
		key: 'likeliestLabel',
		get: function get() {
			if (this.modelResults !== undefined) {
				if (this.modelResults.likeliest > -1) {
					return this.model.models[this.modelResults.likeliest].label;
				}
			}
			return 'unknown';
			//return('no estimation available');
		}
	}]);
	return XmmGmmDecoder;
}(lfo.core.BaseLfo);

exports.default = XmmGmmDecoder;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxmby14bW0tZ21tLWRlY29kZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7SUFBWSxHOztBQUNaOzs7Ozs7QUFFQTs7QUFFQTs7SUFFcUIsYTs7O0FBQ3BCLDBCQUEwQjtBQUFBLE1BQWQsT0FBYyx5REFBSixFQUFJO0FBQUE7O0FBQ3pCLE1BQU0sV0FBVztBQUNoQixxQkFBa0I7QUFERixHQUFqQjs7QUFEeUIscUhBSW5CLFFBSm1CLEVBSVQsT0FKUzs7QUFNekIsUUFBSyxLQUFMLEdBQWEsU0FBYjtBQUNBLFFBQUssWUFBTCxHQUFvQixTQUFwQjtBQUNBLFFBQUssZ0JBQUwsR0FBd0IsTUFBSyxNQUFMLENBQVksZ0JBQXBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFaeUI7QUFhekI7Ozs7MEJBWU8sSSxFQUFNLEssRUFBTyxRLEVBQVU7O0FBRTlCO0FBQ0EsT0FBRyxLQUFLLEtBQUwsS0FBZSxTQUFsQixFQUE2QjtBQUM1QixZQUFRLEdBQVIsQ0FBWSxpQkFBWjtBQUNBO0FBQ0E7O0FBRUQsUUFBSyxJQUFMLEdBQVksSUFBWjtBQUNBLFFBQUssUUFBTCxHQUFnQixRQUFoQjs7QUFFQSxPQUFNLFdBQVcsS0FBSyxRQUF0Qjs7QUFFQSx5Q0FBZSxLQUFmLEVBQXNCLEtBQUssS0FBM0IsRUFBa0MsS0FBSyxZQUF2QztBQUNBOztBQUVBLFFBQUksSUFBSSxJQUFFLENBQVYsRUFBYSxJQUFFLEtBQUssS0FBTCxDQUFXLE1BQVgsQ0FBa0IsTUFBakMsRUFBeUMsR0FBekMsRUFBOEM7QUFDN0MsYUFBUyxDQUFULElBQWMsS0FBSyxZQUFMLENBQWtCLCtCQUFsQixDQUFrRCxDQUFsRCxDQUFkO0FBQ0E7O0FBRUQsUUFBSyxNQUFMO0FBQ0E7OzsyQkFFUSxLLEVBQU87QUFDZixRQUFLLEtBQUwsR0FBYSxTQUFiO0FBQ0EsUUFBSyxZQUFMLEdBQW9CLFNBQXBCOztBQUVBO0FBQ0EsT0FBRyxNQUFNLE1B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OiJsZm8teG1tLWdtbS1kZWNvZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbGZvIGZyb20gJ3dhdmVzLWxmbyc7XG5pbXBvcnQgeyBnbW1MaWtlbGlob29kcyB9IGZyb20gJy4veG1tLWRlY29kZXItY29tbW9uJ1xuXG4vLyBUT0RPIDogYWRkIHJlc2V0KCkgZnVuY3Rpb24gKGVtcHR5IGxpa2VsaWhvb2RfYnVmZmVyKVxuXG4vLz09PT09PT09PT09PT09PT09PT0gVEhFIEVYUE9SVEVEIENMQVNTID09PT09PT09PT09PT09PT09PT09PT0vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBYbW1HbW1EZWNvZGVyIGV4dGVuZHMgbGZvLmNvcmUuQmFzZUxmbyB7XG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuXHRcdGNvbnN0IGRlZmF1bHRzID0ge1xuXHRcdFx0bGlrZWxpaG9vZFdpbmRvdzogNSxcblx0XHR9O1xuXHRcdHN1cGVyKGRlZmF1bHRzLCBvcHRpb25zKTtcblxuXHRcdHRoaXMubW9kZWwgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5tb2RlbFJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5saWtlbGlob29kV2luZG93ID0gdGhpcy5wYXJhbXMubGlrZWxpaG9vZFdpbmRvdztcblx0XHQvLyBvcmlnaW5hbCB4bW0gbW9kZWxSZXN1bHRzIGZpZWxkcyA6XG5cdFx0Ly8gaW5zdGFudExpa2VsaWhvb2RzLCBpbnN0YW50Tm9ybWFsaXplZExpa2VsaWhvb2RzLFxuXHRcdC8vIHNtb290aGVkTGlrZWxpaG9vZHMsIHNtb290aGVkTm9ybWFsaXplZExpa2VsaWhvb2RzLFxuXHRcdC8vIHNtb290aGVkTG9nTGlrZWxpaG9vZHMsIGxpa2VsaWVzdCwgb3V0cHV0VmFsdWVzLCBvdXRwdXRWYXJpYW5jZVxuXHR9XG5cblx0Z2V0IGxpa2VsaWVzdExhYmVsKCkge1xuXHRcdGlmKHRoaXMubW9kZWxSZXN1bHRzICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGlmKHRoaXMubW9kZWxSZXN1bHRzLmxpa2VsaWVzdCA+IC0xKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLm1vZGVsLm1vZGVsc1t0aGlzLm1vZGVsUmVzdWx0cy5saWtlbGllc3RdLmxhYmVsO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gJ3Vua25vd24nO1xuXHRcdC8vcmV0dXJuKCdubyBlc3RpbWF0aW9uIGF2YWlsYWJsZScpO1xuXHR9XG5cblx0cHJvY2Vzcyh0aW1lLCBmcmFtZSwgbWV0YURhdGEpIHtcblxuXHRcdC8vaW5jb21pbmcgZnJhbWUgaXMgb2JzZXJ2YXRpb24gdmVjdG9yXG5cdFx0aWYodGhpcy5tb2RlbCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIm5vIG1vZGVsIGxvYWRlZFwiKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLnRpbWUgPSB0aW1lO1xuXHRcdHRoaXMubWV0YURhdGEgPSBtZXRhRGF0YTtcblxuXHRcdGNvbnN0IG91dEZyYW1lID0gdGhpcy5vdXRGcmFtZTtcblxuXHRcdGdtbUxpa2VsaWhvb2RzKGZyYW1lLCB0aGlzLm1vZGVsLCB0aGlzLm1vZGVsUmVzdWx0cyk7XHRcdFx0XG5cdFx0Ly9nbW1MaWtlbGlob29kcyhmcmFtZSwgdGhpcy5tb2RlbCwgdGhpcy5tb2RlbFJlc3VsdHMpO1x0XHRcdFxuXG5cdFx0Zm9yKGxldCBpPTA7IGk8dGhpcy5tb2RlbC5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdG91dEZyYW1lW2ldID0gdGhpcy5tb2RlbFJlc3VsdHMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcblx0XHR9XG5cblx0XHR0aGlzLm91dHB1dCgpO1xuXHR9XG5cblx0c2V0TW9kZWwobW9kZWwpIHtcblx0XHR0aGlzLm1vZGVsID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMubW9kZWxSZXN1bHRzID0gdW5kZWZpbmVkO1xuXG5cdFx0Ly8gdGVzdCBpZiBtb2RlbCBpcyB2YWxpZCBoZXJlIChUT0RPIDogd3JpdGUgYSBiZXR0ZXIgdGVzdClcblx0XHRpZihtb2RlbC5tb2RlbHMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dGhpcy5tb2RlbCA9IG1vZGVsO1xuXHRcdFx0bGV0IG5tb2RlbHMgPSBtb2RlbC5tb2RlbHMubGVuZ3RoO1xuXHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMgPSB7XG5cdFx0XHRcdGluc3RhbnRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0c21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG5cdFx0XHRcdHNtb290aGVkX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG5cdFx0XHRcdGluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuXHRcdFx0XHRzbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG5cdFx0XHRcdGxpa2VsaWVzdDogLTEsXG5cdFx0XHRcdHNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzOiBbXVxuXHRcdFx0fTtcblxuXHRcdFx0Zm9yKGxldCBpPTA7IGk8bW9kZWwubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuaW5zdGFudF9saWtlbGlob29kc1tpXSA9IDA7XG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA9IDA7XG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldID0gMDtcblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gMDtcblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IDA7XG5cblx0XHRcdFx0bGV0IHJlcyA9IHt9O1xuXHRcdFx0XHRyZXMuaW5zdGFudF9saWtlbGlob29kID0gMDtcblx0XHRcdFx0cmVzLmxvZ19saWtlbGlob29kID0gMDtcblx0XHRcdFx0cmVzLmxpa2VsaWhvb2RfYnVmZmVyID0gW107XG5cdFx0XHRcdHJlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGggPSB0aGlzLmxpa2VsaWhvb2RXaW5kb3c7XG5cdFx0XHRcdGZvcihsZXQgaj0wOyBqPHRoaXMubGlrZWxpaG9vZFdpbmRvdzsgaisrKSB7XG5cdFx0XHRcdFx0cmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMSAvIHRoaXMubGlrZWxpaG9vZFdpbmRvdztcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLm1vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cy5wdXNoKHJlcyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5pbml0aWFsaXplKHsgZnJhbWVTaXplOiB0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGggfSk7XG5cdH1cblxuXHRzZXRMaWtlbGlob29kV2luZG93KG5ld1dpbmRvd1NpemUpIHtcblx0XHR0aGlzLmxpa2VsaWhvb2RXaW5kb3cgPSBuZXdXaW5kb3dTaXplO1xuXHRcdGlmKHRoaXMubW9kZWwgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXHRcdGxldCByZXMgPSB0aGlzLm1vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc01vZGVsUmVzdWx0cztcblx0XHRmb3IobGV0IGk9MDsgaTx0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXHRcdFx0cmVzW2ldLmxpa2VsaWhvb2RfYnVmZmVyID0gW107XG5cdFx0XHRyZXNbaV0ubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoID0gdGhpcy5saWtlbGlob29kV2luZG93O1xuXHRcdFx0Zm9yKGxldCBqPTA7IGo8dGhpcy5saWtlbGlob29kV2luZG93OyBqKyspIHtcblx0XHRcdFx0cmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMSAvIHRoaXMubGlrZWxpaG9vZFdpbmRvdztcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRzZXRWYXJpYW5jZU9mZnNldCgpIHtcblx0XHQvLyBub3QgdXNlZCBmb3Igbm93IChuZWVkIHRvIGltcGxlbWVudCB1cGRhdGVJbnZlcnNlQ292YXJpYW5jZSBtZXRob2QpXG5cdH1cbn07XG4iXX0=