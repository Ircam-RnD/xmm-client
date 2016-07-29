'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _gmmUtils = require('../utils/gmm-utils');

var gmmUtils = _interopRequireWildcard(_gmmUtils);

var _hhmmUtils = require('../utils/hhmm-utils');

var hhmmUtils = _interopRequireWildcard(_hhmmUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HhmmDecoder = function () {
	function HhmmDecoder() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		(0, _classCallCheck3.default)(this, HhmmDecoder);

		var defaults = {
			likelihoodWindow: 5
		};
		var params = (0, _assign2.default)({}, defaults, options);

		this.model = undefined;
		this.modelResults = undefined;
		this.likelihoodWindow = params.likelihoodWindow;
	}

	(0, _createClass3.default)(HhmmDecoder, [{
		key: 'filter',
		value: function filter(observation, resultsFunction) {
			if (this.model === undefined) {
				console.log("no model loaded");
				return;
			}

			// could I do that ? (don't think it's the best idea)
			// (also change gmm-decoder so that both are consistent)

			// HhmmUtils.HhmmLikelihoods(observation, this.model, this.modelResults);			
		}
	}, {
		key: 'reset',
		value: function reset() {
			this.modelResults.forward_initialized = false;
		}

		// ==================== SETTERS ====================== //

	}, {
		key: 'model',
		set: function set(model) {

			this.model = undefined;
			this.modelResults = undefined;

			// test if model is valid here (TODO : write a better test)
			if (model.models !== undefined) {

				console.log(model);

				this.model = model;
				var nmodels = model.models.length;

				var nstatesGlobal = model.configuration.default_parameters.states;
				this.params.frameSize = nstatesGlobal;

				// this.prior = new Array(nmodels);
				// this.exit_transition = new Array(nmodels);
				// this.transition = new Array(nmodels);
				// for(let i=0; i<nmodels; i++) {
				// 	this.transition[i] = new Array(nmodels);
				// }

				// this.frontier_v1 = new Array(nmodels);
				// this.frontier_v2 = new Array(nmodels);
				// this.forward_initialized = false;

				//this.results = {};

				this.modelResults = {
					instant_likelihoods: new Array(nmodels),
					smoothed_log_likelihoods: new Array(nmodels),
					smoothed_likelihoods: new Array(nmodels),
					instant_normalized_likelihoods: new Array(nmodels),
					smoothed_normalized_likelihoods: new Array(nmodels),
					likeliest: -1,
					frontier_v1: new Array(nmodels),
					frontier_v2: new Array(nmodels),
					forward_initialized: false,
					singleClassHmmModelResults: []
				};

				for (var i = 0; i < nmodels; i++) {

					this.modelResults.instant_likelihoods[i] = 0;
					this.modelResults.smoothed_log_likelihoods[i] = 0;
					this.modelResults.smoothed_likelihoods[i] = 0;
					this.modelResults.instant_normalized_likelihoods[i] = 0;
					this.modelResults.smoothed_normalized_likelihoods[i] = 0;

					var nstates = this.model.models[i].parameters.states;

					var alpha_h = new Array(3);
					for (var j = 0; j < 3; j++) {
						alpha_h[j] = new Array(nstates);
						for (var k = 0; k < nstates; k++) {
							alpha_h[j][k] = 0;
						}
					}

					var alpha = new Array(nstates);
					for (var _j = 0; _j < nstates; _j++) {
						alpha[_j] = 0;
					}

					var winSize = this.model.shared_parameters.likelihood_window;
					var likelihood_buffer = new Array(winSize);
					for (var _j2 = 0; _j2 < winSize; _j2++) {
						likelihood_buffer[_j2] = 0.0;
					}

					var hmmRes = {
						hierarchical: this.model.configuration.default_parameters.hierarchical,
						instant_likelihood: 0,
						log_likelihood: 0,
						// for circular buffer implementation
						// (see hmmUpdateResults) :
						likelihood_buffer: likelihood_buffer,
						likelihood_buffer_index: 0,
						progress: 0,

						// never used ? -> check xmm cpp
						exit_likelihood: 0,
						exit_ratio: 0,

						likeliest_state: -1,

						// for non-hierarchical :
						previous_alpha: alpha.slice(0),
						alpha: alpha,
						// for hierarchical :		
						alpha_h: alpha_h,
						prior: new Array(nstates),
						transition: new Array(nstates),

						// used in hmmUpdateAlphaWindow
						window_minindex: 0,
						window_maxindex: 0,
						window_normalization_constant: 0,

						singleClassGmmModelResults: [] // states
					};

					var params = this.model.shared_parameters;
					var dimOut = params.dimension - params.dimension_input;
					hmmRes.output_values = new Array(dimOut);
					for (var _i = 0; _i < dimOut; _i++) {
						hmmRes.output_values[_i] = 0.0;
					}

					var outCovarSize = void 0;
					if (this.model.configuration.default_parameters.covariance_mode == 0) {
						// full
						outCovarSize = dimOut * dimOut;
					} else {
						// diagonal
						outCovarSize = dimOut;
					}
					hmmRes.output_covariance = new Array(outCovarSize);
					for (var _i2 = 0; _i2 < dimOut; _i2++) {
						hmmRes.output_covariance[_i2] = 0.0;
					}

					// ADD INDIVIDUAL STATES (GMMs)
					for (var _j3 = 0; _j3 < nstates; _j3++) {
						var gmmRes = {
							instant_likelihood: 0,
							log_likelihood: 0
						};
						gmmRes.beta = new Array(this.model.models[i].parameters.gaussians);
						for (var _k = 0; _k < gmmRes.beta.length; _k++) {
							gmmRes.beta[_k] = 1 / gmmRes.beta.length;
						}

						gmmRes.output_values = hmmRes.output_values.slice(0);
						gmmRes.output_covariance = hmmRes.output_covariance.slice(0);

						hmmRes.singleClassGmmModelResults.push(gmmRes);
					}

					this.modelResults.singleClassHmmModelResults.push(hmmRes);
				}
			}

			// ========== LFO specific
			// this.initialize({ frameSize: this.model.models.length });
		}

		// ==================== GETTERS ====================== //

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
	return HhmmDecoder;
}();

exports.default = HhmmDecoder;
//# sourceMappingURL=data:application/json;base64,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QixPQUFPLGFBQVAsQ0FBcUIsS0FBckIsQ0FBMkIsQ0FBM0IsQ0FBdkI7QUFDQSxhQUFPLGlCQUFQLEdBQTJCLE9BQU8saUJBQVAsQ0FBeUIsS0FBekIsQ0FBK0IsQ0FBL0IsQ0FBM0I7O0FBRVosYUFBTywwQkFBUCxDQUFrQyxJQUFsQyxDQUF1QyxNQUF2QztBQUNBOztBQUVELFVBQUssWUFBTCxDQUFrQiwwQkFBbEIsQ0FBNkMsSUFBN0MsQ0FBa0QsTUFBbEQ7QUFDQTtBQUNEOztBQUVEO0FBQ0E7QUFDQTs7QUFFRDs7OztzQkFFcUI7QUFDcEIsT0FBRyxLQUFLLFlBQUwsS0FBc0IsU0FBekIsRUFBb0M7QUFDbkMsUUFBRyxLQUFLLFlBQUwsQ0FBa0IsU0FBbEIsR0FBOEIsQ0FBQyxDQUFsQyxFQUFxQztBQUNwQyxZQUFPLEtBQUssS0FBTCxDQUFXLE1BQVgsQ0FBa0IsS0FBSyxZQUFMLENBQWtCLFNBQXBDLEVBQStDLEtBQXREO0FBQ0E7QUFDRDtBQUNELFVBQU8sU0FBUDtBQUNBO0FBQ0E7Ozs7O2tCQWhNbUIsVyIsImZpbGUiOiJoaG1tLWRlY29kZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBnbW1VdGlscyBmcm9tICcuLi91dGlscy9nbW0tdXRpbHMnO1xuaW1wb3J0ICogYXMgaGhtbVV0aWxzIGZyb20gJy4uL3V0aWxzL2hobW0tdXRpbHMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIaG1tRGVjb2RlciB7XG5cblx0Y29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG5cdFx0Y29uc3QgZGVmYXVsdHMgPSB7XG5cdFx0XHRsaWtlbGlob29kV2luZG93OiA1LFxuXHRcdH07XG5cdFx0bGV0IHBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuXHRcdHRoaXMubW9kZWwgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5tb2RlbFJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5saWtlbGlob29kV2luZG93ID0gcGFyYW1zLmxpa2VsaWhvb2RXaW5kb3c7XG5cdH1cblxuXHRmaWx0ZXIob2JzZXJ2YXRpb24sIHJlc3VsdHNGdW5jdGlvbikge1xuXHRcdGlmKHRoaXMubW9kZWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJubyBtb2RlbCBsb2FkZWRcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gY291bGQgSSBkbyB0aGF0ID8gKGRvbid0IHRoaW5rIGl0J3MgdGhlIGJlc3QgaWRlYSlcblx0XHQvLyAoYWxzbyBjaGFuZ2UgZ21tLWRlY29kZXIgc28gdGhhdCBib3RoIGFyZSBjb25zaXN0ZW50KVxuXG5cdFx0Ly8gSGhtbVV0aWxzLkhobW1MaWtlbGlob29kcyhvYnNlcnZhdGlvbiwgdGhpcy5tb2RlbCwgdGhpcy5tb2RlbFJlc3VsdHMpO1x0XHRcdFxuXG5cdH1cblxuXHRyZXNldCgpIHtcblx0XHR0aGlzLm1vZGVsUmVzdWx0cy5mb3J3YXJkX2luaXRpYWxpemVkID0gZmFsc2U7XG5cdH1cblxuXHQvLyA9PT09PT09PT09PT09PT09PT09PSBTRVRURVJTID09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuXHRzZXQgbW9kZWwobW9kZWwpIHtcdFx0XG5cblx0XHR0aGlzLm1vZGVsID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMubW9kZWxSZXN1bHRzID0gdW5kZWZpbmVkO1xuXG5cdFx0Ly8gdGVzdCBpZiBtb2RlbCBpcyB2YWxpZCBoZXJlIChUT0RPIDogd3JpdGUgYSBiZXR0ZXIgdGVzdClcblx0XHRpZihtb2RlbC5tb2RlbHMgIT09IHVuZGVmaW5lZCkge1xuXG5cdFx0XHRjb25zb2xlLmxvZyhtb2RlbCk7XG5cblx0XHRcdHRoaXMubW9kZWwgPSBtb2RlbDtcblx0XHRcdGxldCBubW9kZWxzID0gbW9kZWwubW9kZWxzLmxlbmd0aDtcblxuXHRcdFx0bGV0IG5zdGF0ZXNHbG9iYWwgPSBtb2RlbC5jb25maWd1cmF0aW9uLmRlZmF1bHRfcGFyYW1ldGVycy5zdGF0ZXM7XG5cdFx0XHR0aGlzLnBhcmFtcy5mcmFtZVNpemUgPSBuc3RhdGVzR2xvYmFsO1xuXG5cdFx0XHQvLyB0aGlzLnByaW9yID0gbmV3IEFycmF5KG5tb2RlbHMpO1xuXHRcdFx0Ly8gdGhpcy5leGl0X3RyYW5zaXRpb24gPSBuZXcgQXJyYXkobm1vZGVscyk7XG5cdFx0XHQvLyB0aGlzLnRyYW5zaXRpb24gPSBuZXcgQXJyYXkobm1vZGVscyk7XG5cdFx0XHQvLyBmb3IobGV0IGk9MDsgaTxubW9kZWxzOyBpKyspIHtcblx0XHRcdC8vIFx0dGhpcy50cmFuc2l0aW9uW2ldID0gbmV3IEFycmF5KG5tb2RlbHMpO1xuXHRcdFx0Ly8gfVxuXG5cdFx0XHQvLyB0aGlzLmZyb250aWVyX3YxID0gbmV3IEFycmF5KG5tb2RlbHMpO1xuXHRcdFx0Ly8gdGhpcy5mcm9udGllcl92MiA9IG5ldyBBcnJheShubW9kZWxzKTtcblx0XHRcdC8vIHRoaXMuZm9yd2FyZF9pbml0aWFsaXplZCA9IGZhbHNlO1xuXG5cdFx0XHQvL3RoaXMucmVzdWx0cyA9IHt9O1xuXG5cdFx0XHR0aGlzLm1vZGVsUmVzdWx0cyA9IHtcblx0XHRcdFx0aW5zdGFudF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuXHRcdFx0XHRzbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0c21vb3RoZWRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0aW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG5cdFx0XHRcdHNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0bGlrZWxpZXN0OiAtMSxcblx0XHRcdFx0ZnJvbnRpZXJfdjE6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0ZnJvbnRpZXJfdjI6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0Zm9yd2FyZF9pbml0aWFsaXplZDogZmFsc2UsXG5cdFx0XHRcdHNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzOiBbXVxuXHRcdFx0fTtcblxuXHRcdFx0Zm9yKGxldCBpID0gMDsgaSA8IG5tb2RlbHM7IGkrKykge1xuXG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV0gPSAwO1xuXHRcdFx0XHR0aGlzLm1vZGVsUmVzdWx0cy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSAwO1xuXHRcdFx0XHR0aGlzLm1vZGVsUmVzdWx0cy5zbW9vdGhlZF9saWtlbGlob29kc1tpXSA9IDA7XG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IDA7XG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSAwO1xuXG5cdFx0XHRcdGxldCBuc3RhdGVzID0gdGhpcy5tb2RlbC5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7XG5cblx0XHRcdFx0bGV0IGFscGhhX2ggPSBuZXcgQXJyYXkoMyk7XG5cdFx0XHRcdGZvcihsZXQgaj0wOyBqPDM7IGorKykge1xuXHRcdFx0XHRcdGFscGhhX2hbal0gPSBuZXcgQXJyYXkobnN0YXRlcyk7XG5cdFx0XHRcdFx0Zm9yKGxldCBrPTA7IGs8bnN0YXRlczsgaysrKSB7XG5cdFx0XHRcdFx0XHRhbHBoYV9oW2pdW2tdID0gMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdGxldCBhbHBoYSA9IG5ldyBBcnJheShuc3RhdGVzKTtcblx0XHRcdFx0Zm9yKGxldCBqID0gMDsgaiA8IG5zdGF0ZXM7IGorKykge1xuXHRcdFx0XHRcdGFscGhhW2pdID0gMDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCB3aW5TaXplID0gdGhpcy5tb2RlbC5zaGFyZWRfcGFyYW1ldGVycy5saWtlbGlob29kX3dpbmRvd1xuXHRcdFx0XHRsZXQgbGlrZWxpaG9vZF9idWZmZXIgPSBuZXcgQXJyYXkod2luU2l6ZSk7XG5cdFx0XHRcdGZvcihsZXQgaiA9IDA7IGogPCB3aW5TaXplOyBqKyspIHtcblx0XHRcdFx0XHRsaWtlbGlob29kX2J1ZmZlcltqXSA9IDAuMDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCBobW1SZXMgPSB7XG5cdFx0XHRcdFx0aGllcmFyY2hpY2FsOlxuXHRcdFx0XHRcdFx0dGhpcy5tb2RlbC5jb25maWd1cmF0aW9uLmRlZmF1bHRfcGFyYW1ldGVycy5oaWVyYXJjaGljYWwsXG5cdFx0XHRcdFx0aW5zdGFudF9saWtlbGlob29kOiAwLFxuXHRcdFx0XHRcdGxvZ19saWtlbGlob29kOiAwLFxuXHRcdFx0XHRcdC8vIGZvciBjaXJjdWxhciBidWZmZXIgaW1wbGVtZW50YXRpb25cblx0XHRcdFx0XHQvLyAoc2VlIGhtbVVwZGF0ZVJlc3VsdHMpIDpcblx0XHRcdFx0XHRsaWtlbGlob29kX2J1ZmZlcjogbGlrZWxpaG9vZF9idWZmZXIsXG5cdFx0XHRcdFx0bGlrZWxpaG9vZF9idWZmZXJfaW5kZXg6IDAsXG5cdFx0XHRcdFx0cHJvZ3Jlc3M6IDAsXG5cblx0XHRcdFx0XHQvLyBuZXZlciB1c2VkID8gLT4gY2hlY2sgeG1tIGNwcFxuXHRcdFx0XHRcdGV4aXRfbGlrZWxpaG9vZDogMCxcblx0XHRcdFx0XHRleGl0X3JhdGlvOiAwLFxuXG5cdFx0XHRcdFx0bGlrZWxpZXN0X3N0YXRlOiAtMSxcblxuXHRcdFx0XHRcdC8vIGZvciBub24taGllcmFyY2hpY2FsIDpcblx0XHRcdFx0XHRwcmV2aW91c19hbHBoYTogYWxwaGEuc2xpY2UoMCksXG5cdFx0XHRcdFx0YWxwaGE6IGFscGhhLFxuXHRcdFx0XHRcdC8vIGZvciBoaWVyYXJjaGljYWwgOlx0XHRcblx0XHRcdFx0XHRhbHBoYV9oOiBhbHBoYV9oLFxuXHRcdFx0XHRcdHByaW9yOiBuZXcgQXJyYXkobnN0YXRlcyksXG5cdFx0XHRcdFx0dHJhbnNpdGlvbjogbmV3IEFycmF5KG5zdGF0ZXMpLFxuXG5cdFx0XHRcdFx0Ly8gdXNlZCBpbiBobW1VcGRhdGVBbHBoYVdpbmRvd1xuXHRcdFx0XHRcdHdpbmRvd19taW5pbmRleDogMCxcblx0XHRcdFx0XHR3aW5kb3dfbWF4aW5kZXg6IDAsXG5cdFx0XHRcdFx0d2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQ6IDAsXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0c2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHM6IFtdXHQvLyBzdGF0ZXNcblx0XHRcdFx0fTtcblxuXHQgICAgICAgICAgICBsZXQgcGFyYW1zID0gdGhpcy5tb2RlbC5zaGFyZWRfcGFyYW1ldGVycztcblx0ICAgICAgICAgICAgbGV0IGRpbU91dCA9IHBhcmFtcy5kaW1lbnNpb24gLSBwYXJhbXMuZGltZW5zaW9uX2lucHV0O1xuXHQgICAgICAgICAgICBobW1SZXMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuXHQgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIGhtbVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgbGV0IG91dENvdmFyU2l6ZTtcblx0ICAgICAgICAgICAgaWYodGhpcy5tb2RlbC5jb25maWd1cmF0aW9uLmRlZmF1bHRfcGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGVcblx0ICAgICAgICAgICAgXHQ9PSAwKSB7IC8vIGZ1bGxcblx0ICAgICAgICAgICAgICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dCAqIGRpbU91dDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHsgLy8gZGlhZ29uYWxcblx0ICAgICAgICAgICAgICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBobW1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcblx0ICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBobW1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG5cdCAgICAgICAgICAgIH1cblxuXHRcdFx0XHQvLyBBREQgSU5ESVZJRFVBTCBTVEFURVMgKEdNTXMpXG5cdFx0XHRcdGZvcihsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcblx0XHRcdFx0XHRsZXQgZ21tUmVzID0ge1xuXHRcdFx0XHRcdFx0aW5zdGFudF9saWtlbGlob29kOiAwLFxuXHRcdFx0XHRcdFx0bG9nX2xpa2VsaWhvb2Q6IDAsXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRnbW1SZXMuYmV0YVxuXHRcdFx0XHRcdFx0PSBuZXcgQXJyYXkodGhpcy5tb2RlbC5tb2RlbHNbaV0ucGFyYW1ldGVycy5nYXVzc2lhbnMpO1xuXHRcdFx0XHRcdGZvcihsZXQgayA9IDA7IGsgPCBnbW1SZXMuYmV0YS5sZW5ndGg7IGsrKykge1xuXHRcdFx0XHRcdFx0Z21tUmVzLmJldGFba10gPSAxIC8gZ21tUmVzLmJldGEubGVuZ3RoO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0ICAgICAgICAgICAgICAgIGdtbVJlcy5vdXRwdXRfdmFsdWVzID0gaG1tUmVzLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG5cdCAgICAgICAgICAgICAgICBnbW1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBobW1SZXMub3V0cHV0X2NvdmFyaWFuY2Uuc2xpY2UoMCk7XG5cblx0XHRcdFx0XHRobW1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHMucHVzaChnbW1SZXMpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHMucHVzaChobW1SZXMpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vID09PT09PT09PT0gTEZPIHNwZWNpZmljXG5cdFx0Ly8gdGhpcy5pbml0aWFsaXplKHsgZnJhbWVTaXplOiB0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGggfSk7XG5cdH1cblxuXHQvLyA9PT09PT09PT09PT09PT09PT09PSBHRVRURVJTID09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuXHRnZXQgbGlrZWxpZXN0TGFiZWwoKSB7XG5cdFx0aWYodGhpcy5tb2RlbFJlc3VsdHMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0aWYodGhpcy5tb2RlbFJlc3VsdHMubGlrZWxpZXN0ID4gLTEpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMubW9kZWwubW9kZWxzW3RoaXMubW9kZWxSZXN1bHRzLmxpa2VsaWVzdF0ubGFiZWw7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAndW5rbm93bic7XG5cdFx0Ly9yZXR1cm4oJ25vIGVzdGltYXRpb24gYXZhaWxhYmxlJyk7XG5cdH1cblxufSJdfQ==