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

			hhmmUtils.hhmmFilter(observation, this.model, this.modelResults);

			// TODO :  fill results with relevant modelResults fields
			var results = {};

			resultsFunction(results);
			// OR :
			// return results;


			// THIS SHOULD BE DESTROYED (OLD GARBAGE DONE BY hhmmFilter)		
			/*
   //--------------------------------------------------------- hierarchical
   if(this.model.configuration.default_parameters.hierarchical) {
   	if(this.modelResults.forward_initialized) {
   		hhmmUtils.forwardUpdate(
   			observation, this.model, this.modelResults
   		);
   	}
   	else {
   		hhmmUtils.forwardInit(
   			observation, this.model, this.modelResults
   		);
   	}
   }
   //----------------------------------------------------- non-hierarchical
   else { // non-hierarchical
   	for(let i = 0; i < this.model.models.length; i++) {
   		hhmmUtils.this.modelResults
   	}
   }
   	// compute time progression
   for(let i = 0; i < this.model.models.length; i++) {
   	hhmmUtils.hmmUpdateAlphaWindow(
   		this.model.models[i],
   		this.modelResults.singleClassHmmModelResults[i]
   	);
   	hhmmUtils.hmmUpdateResults();
   }
   */
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
				var m = this.model;
				var nmodels = m.models.length;

				var nstatesGlobal = m.configuration.default_parameters.states;
				this.params.frameSize = nstatesGlobal;

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

				// move output_values / output_covariance here for regression
				// and dupe (.slice(0)) them in sub-modelResults
				var params = m.shared_parameters;
				var dimOut = params.dimension - params.dimension_input;
				this.modelResults.output_values = new Array(dimOut);
				for (var i = 0; i < dimOut; i++) {
					this.modelResults.output_values[i] = 0.0;
				}

				var outCovarSize = void 0;
				if (m.configuration.default_parameters.covariance_mode == 0) {
					// full
					outCovarSize = dimOut * dimOut;
				} else {
					// diagonal
					outCovarSize = dimOut;
				}
				this.modelResults.output_covariance = new Array(outCovarSize);
				for (var _i = 0; _i < dimOut; _i++) {
					this.modelResults.output_covariance[_i] = 0.0;
				}

				for (var _i2 = 0; _i2 < nmodels; _i2++) {

					this.modelResults.instant_likelihoods[_i2] = 0;
					this.modelResults.smoothed_log_likelihoods[_i2] = 0;
					this.modelResults.smoothed_likelihoods[_i2] = 0;
					this.modelResults.instant_normalized_likelihoods[_i2] = 0;
					this.modelResults.smoothed_normalized_likelihoods[_i2] = 0;

					var nstates = m.models[_i2].parameters.states;

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

					var winSize = m.shared_parameters.likelihood_window;
					var likelihood_buffer = new Array(winSize);
					for (var _j2 = 0; _j2 < winSize; _j2++) {
						likelihood_buffer[_j2] = 0.0;
					}

					var hmmRes = {
						hierarchical: m.configuration.default_parameters.hierarchical,
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

						// for non-hierarchical mode
						forward_initialized: false,

						singleClassGmmModelResults: [] // states
					};

					hmmRes.output_values = this.modelResults.output_values.slice(0);
					hmmRes.output_covariance = this.modelResults.output_covariance.slice(0);

					// ADD INDIVIDUAL STATES (GMMs)
					for (var _j3 = 0; _j3 < nstates; _j3++) {
						var gmmRes = {
							instant_likelihood: 0,
							log_likelihood: 0
						};
						gmmRes.beta = new Array(this.model.models[_i2].parameters.gaussians);
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
}(); //import * as gmmUtils from '../utils/gmm-utils';


exports.default = HhmmDecoder;
//# sourceMappingURL=data:application/json;base64,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QUVaLHVCQUFnQjtBQUZKLE9BQWI7QUFJQSxhQUFPLElBQVAsR0FDRyxJQUFJLEtBQUosQ0FBVSxLQUFLLEtBQUwsQ0FBVyxNQUFYLENBQWtCLEdBQWxCLEVBQXFCLFVBQXJCLENBQWdDLFNBQTFDLENBREg7QUFFQSxXQUFJLElBQUksS0FBSSxDQUFaLEVBQWUsS0FBSSxPQUFPLElBQVAsQ0FBWSxNQUEvQixFQUF1QyxJQUF2QyxFQUE0QztBQUMzQyxjQUFPLElBQVAsQ0FBWSxFQUFaLElBQWlCLElBQUksT0FBTyxJQUFQLENBQVksTUFBakM7QUFDQTs7QUFFVyxhQUFPLGFBQVAsR0FBdUIsT0FBTyxhQUFQLENBQXFCLEtBQXJCLENBQTJCLENBQTNCLENBQXZCO0FBQ0EsYUFBTyxpQkFBUCxHQUNHLE9BQU8saUJBQVAsQ0FBeUIsS0FBekIsQ0FBK0IsQ0FBL0IsQ0FESDs7QUFHWixhQUFPLDBCQUFQLENBQWtDLElBQWxDLENBQXVDLE1BQXZDO0FBQ0E7O0FBRUQsVUFBSyxZQUFMLENBQWtCLDBCQUFsQixDQUE2QyxJQUE3QyxDQUFrRCxNQUFsRDtBQUNBO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBOztBQUVEOzs7O3NCQUVxQjtBQUNwQixPQUFHLEtBQUssWUFBTCxLQUFzQixTQUF6QixFQUFvQztBQUNuQyxRQUFHLEtBQUssWUFBTCxDQUFrQixTQUFsQixHQUE4QixDQUFDLENBQWxDLEVBQXFDO0FBQ3BDLFlBQU8sS0FBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixLQUFLLFlBQUwsQ0FBa0IsU0FBcEMsRUFBK0MsS0FBdEQ7QUFDQTtBQUNEO0FBQ0QsVUFBTyxTQUFQO0FBQ0E7QUFDQTs7O0tBck9GOzs7a0JBR3FCLFciLCJmaWxlIjoiaGhtbS1kZWNvZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy9pbXBvcnQgKiBhcyBnbW1VdGlscyBmcm9tICcuLi91dGlscy9nbW0tdXRpbHMnO1xuaW1wb3J0ICogYXMgaGhtbVV0aWxzIGZyb20gJy4uL3V0aWxzL2hobW0tdXRpbHMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIaG1tRGVjb2RlciB7XG5cblx0Y29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG5cdFx0Y29uc3QgZGVmYXVsdHMgPSB7XG5cdFx0XHRsaWtlbGlob29kV2luZG93OiA1LFxuXHRcdH07XG5cdFx0bGV0IHBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuXHRcdHRoaXMubW9kZWwgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5tb2RlbFJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5saWtlbGlob29kV2luZG93ID0gcGFyYW1zLmxpa2VsaWhvb2RXaW5kb3c7XG5cdH1cblxuXHRmaWx0ZXIob2JzZXJ2YXRpb24sIHJlc3VsdHNGdW5jdGlvbikge1xuXHRcdGlmKHRoaXMubW9kZWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJubyBtb2RlbCBsb2FkZWRcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aGhtbVV0aWxzLmhobW1GaWx0ZXIob2JzZXJ2YXRpb24sIHRoaXMubW9kZWwsIHRoaXMubW9kZWxSZXN1bHRzKTtcblxuXHRcdC8vIFRPRE8gOiAgZmlsbCByZXN1bHRzIHdpdGggcmVsZXZhbnQgbW9kZWxSZXN1bHRzIGZpZWxkc1xuXHRcdGxldCByZXN1bHRzID0ge307XG5cblx0XHRyZXN1bHRzRnVuY3Rpb24ocmVzdWx0cyk7XG5cdFx0Ly8gT1IgOlxuXHRcdC8vIHJldHVybiByZXN1bHRzO1xuXG5cblx0XHQvLyBUSElTIFNIT1VMRCBCRSBERVNUUk9ZRUQgKE9MRCBHQVJCQUdFIERPTkUgQlkgaGhtbUZpbHRlcilcdFx0XG5cdFx0Lypcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcblx0XHRpZih0aGlzLm1vZGVsLmNvbmZpZ3VyYXRpb24uZGVmYXVsdF9wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkge1xuXHRcdFx0aWYodGhpcy5tb2RlbFJlc3VsdHMuZm9yd2FyZF9pbml0aWFsaXplZCkge1xuXHRcdFx0XHRoaG1tVXRpbHMuZm9yd2FyZFVwZGF0ZShcblx0XHRcdFx0XHRvYnNlcnZhdGlvbiwgdGhpcy5tb2RlbCwgdGhpcy5tb2RlbFJlc3VsdHNcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRoaG1tVXRpbHMuZm9yd2FyZEluaXQoXG5cdFx0XHRcdFx0b2JzZXJ2YXRpb24sIHRoaXMubW9kZWwsIHRoaXMubW9kZWxSZXN1bHRzXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuXHRcdGVsc2UgeyAvLyBub24taGllcmFyY2hpY2FsXG5cdFx0XHRmb3IobGV0IGkgPSAwOyBpIDwgdGhpcy5tb2RlbC5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aGhtbVV0aWxzLnRoaXMubW9kZWxSZXN1bHRzXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gY29tcHV0ZSB0aW1lIHByb2dyZXNzaW9uXG5cdFx0Zm9yKGxldCBpID0gMDsgaSA8IHRoaXMubW9kZWwubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRoaG1tVXRpbHMuaG1tVXBkYXRlQWxwaGFXaW5kb3coXG5cdFx0XHRcdHRoaXMubW9kZWwubW9kZWxzW2ldLFxuXHRcdFx0XHR0aGlzLm1vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuXHRcdFx0KTtcblx0XHRcdGhobW1VdGlscy5obW1VcGRhdGVSZXN1bHRzKCk7XG5cdFx0fVxuXHRcdCovXG5cdH1cblxuXHRyZXNldCgpIHtcblx0XHR0aGlzLm1vZGVsUmVzdWx0cy5mb3J3YXJkX2luaXRpYWxpemVkID0gZmFsc2U7XG5cdH1cblxuXHQvLyA9PT09PT09PT09PT09PT09PT09PSBTRVRURVJTID09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuXHRzZXQgbW9kZWwobW9kZWwpIHtcdFx0XG5cblx0XHR0aGlzLm1vZGVsID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMubW9kZWxSZXN1bHRzID0gdW5kZWZpbmVkO1xuXG5cdFx0Ly8gdGVzdCBpZiBtb2RlbCBpcyB2YWxpZCBoZXJlIChUT0RPIDogd3JpdGUgYSBiZXR0ZXIgdGVzdClcblx0XHRpZihtb2RlbC5tb2RlbHMgIT09IHVuZGVmaW5lZCkge1xuXG5cdFx0XHRjb25zb2xlLmxvZyhtb2RlbCk7XG5cblx0XHRcdHRoaXMubW9kZWwgPSBtb2RlbDtcblx0XHRcdGxldCBtID0gdGhpcy5tb2RlbDtcblx0XHRcdGxldCBubW9kZWxzID0gbS5tb2RlbHMubGVuZ3RoO1xuXG5cdFx0XHRsZXQgbnN0YXRlc0dsb2JhbCA9IG0uY29uZmlndXJhdGlvbi5kZWZhdWx0X3BhcmFtZXRlcnMuc3RhdGVzO1xuXHRcdFx0dGhpcy5wYXJhbXMuZnJhbWVTaXplID0gbnN0YXRlc0dsb2JhbDtcblxuXHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMgPSB7XG5cdFx0XHRcdGluc3RhbnRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0c21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG5cdFx0XHRcdHNtb290aGVkX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG5cdFx0XHRcdGluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuXHRcdFx0XHRzbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG5cdFx0XHRcdGxpa2VsaWVzdDogLTEsXG5cdFx0XHRcdGZyb250aWVyX3YxOiBuZXcgQXJyYXkobm1vZGVscyksXG5cdFx0XHRcdGZyb250aWVyX3YyOiBuZXcgQXJyYXkobm1vZGVscyksXG5cdFx0XHRcdGZvcndhcmRfaW5pdGlhbGl6ZWQ6IGZhbHNlLFxuXHRcdFx0XHRzaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0czogW11cblx0XHRcdH07XG5cblx0XHRcdC8vIG1vdmUgb3V0cHV0X3ZhbHVlcyAvIG91dHB1dF9jb3ZhcmlhbmNlIGhlcmUgZm9yIHJlZ3Jlc3Npb25cblx0XHRcdC8vIGFuZCBkdXBlICguc2xpY2UoMCkpIHRoZW0gaW4gc3ViLW1vZGVsUmVzdWx0c1xuICAgICAgICAgICAgbGV0IHBhcmFtcyA9IG0uc2hhcmVkX3BhcmFtZXRlcnM7XG4gICAgICAgICAgICBsZXQgZGltT3V0ID0gcGFyYW1zLmRpbWVuc2lvbiAtIHBhcmFtcy5kaW1lbnNpb25faW5wdXQ7XG4gICAgICAgICAgICB0aGlzLm1vZGVsUmVzdWx0cy5vdXRwdXRfdmFsdWVzID0gbmV3IEFycmF5KGRpbU91dCk7XG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGVsUmVzdWx0cy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgb3V0Q292YXJTaXplO1xuICAgICAgICAgICAgaWYobS5jb25maWd1cmF0aW9uLmRlZmF1bHRfcGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGVcbiAgICAgICAgICAgIFx0PT0gMCkgeyAvLyBmdWxsXG4gICAgICAgICAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0ICogZGltT3V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7IC8vIGRpYWdvbmFsXG4gICAgICAgICAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tb2RlbFJlc3VsdHMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuICAgICAgICAgICAgfVxuXG5cdFx0XHRmb3IobGV0IGkgPSAwOyBpIDwgbm1vZGVsczsgaSsrKSB7XG5cblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuaW5zdGFudF9saWtlbGlob29kc1tpXSA9IDA7XG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA9IDA7XG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldID0gMDtcblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gMDtcblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IDA7XG5cblx0XHRcdFx0bGV0IG5zdGF0ZXMgPSBtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlcztcblxuXHRcdFx0XHRsZXQgYWxwaGFfaCA9IG5ldyBBcnJheSgzKTtcblx0XHRcdFx0Zm9yKGxldCBqPTA7IGo8MzsgaisrKSB7XG5cdFx0XHRcdFx0YWxwaGFfaFtqXSA9IG5ldyBBcnJheShuc3RhdGVzKTtcblx0XHRcdFx0XHRmb3IobGV0IGs9MDsgazxuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0XHRcdGFscGhhX2hbal1ba10gPSAwO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0bGV0IGFscGhhID0gbmV3IEFycmF5KG5zdGF0ZXMpO1xuXHRcdFx0XHRmb3IobGV0IGogPSAwOyBqIDwgbnN0YXRlczsgaisrKSB7XG5cdFx0XHRcdFx0YWxwaGFbal0gPSAwO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IHdpblNpemUgPSBtLnNoYXJlZF9wYXJhbWV0ZXJzLmxpa2VsaWhvb2Rfd2luZG93XG5cdFx0XHRcdGxldCBsaWtlbGlob29kX2J1ZmZlciA9IG5ldyBBcnJheSh3aW5TaXplKTtcblx0XHRcdFx0Zm9yKGxldCBqID0gMDsgaiA8IHdpblNpemU7IGorKykge1xuXHRcdFx0XHRcdGxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMC4wO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IGhtbVJlcyA9IHtcblx0XHRcdFx0XHRoaWVyYXJjaGljYWw6XG5cdFx0XHRcdFx0XHRtLmNvbmZpZ3VyYXRpb24uZGVmYXVsdF9wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCxcblx0XHRcdFx0XHRpbnN0YW50X2xpa2VsaWhvb2Q6IDAsXG5cdFx0XHRcdFx0bG9nX2xpa2VsaWhvb2Q6IDAsXG5cdFx0XHRcdFx0Ly8gZm9yIGNpcmN1bGFyIGJ1ZmZlciBpbXBsZW1lbnRhdGlvblxuXHRcdFx0XHRcdC8vIChzZWUgaG1tVXBkYXRlUmVzdWx0cykgOlxuXHRcdFx0XHRcdGxpa2VsaWhvb2RfYnVmZmVyOiBsaWtlbGlob29kX2J1ZmZlcixcblx0XHRcdFx0XHRsaWtlbGlob29kX2J1ZmZlcl9pbmRleDogMCxcblx0XHRcdFx0XHRwcm9ncmVzczogMCxcblxuXHRcdFx0XHRcdC8vIG5ldmVyIHVzZWQgPyAtPiBjaGVjayB4bW0gY3BwXG5cdFx0XHRcdFx0ZXhpdF9saWtlbGlob29kOiAwLFxuXHRcdFx0XHRcdGV4aXRfcmF0aW86IDAsXG5cblx0XHRcdFx0XHRsaWtlbGllc3Rfc3RhdGU6IC0xLFxuXG5cdFx0XHRcdFx0Ly8gZm9yIG5vbi1oaWVyYXJjaGljYWwgOlxuXHRcdFx0XHRcdHByZXZpb3VzX2FscGhhOiBhbHBoYS5zbGljZSgwKSxcblx0XHRcdFx0XHRhbHBoYTogYWxwaGEsXG5cdFx0XHRcdFx0Ly8gZm9yIGhpZXJhcmNoaWNhbCA6XHRcdFxuXHRcdFx0XHRcdGFscGhhX2g6IGFscGhhX2gsXG5cdFx0XHRcdFx0cHJpb3I6IG5ldyBBcnJheShuc3RhdGVzKSxcblx0XHRcdFx0XHR0cmFuc2l0aW9uOiBuZXcgQXJyYXkobnN0YXRlcyksXG5cblx0XHRcdFx0XHQvLyB1c2VkIGluIGhtbVVwZGF0ZUFscGhhV2luZG93XG5cdFx0XHRcdFx0d2luZG93X21pbmluZGV4OiAwLFxuXHRcdFx0XHRcdHdpbmRvd19tYXhpbmRleDogMCxcblx0XHRcdFx0XHR3aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDogMCxcblxuXHRcdFx0XHRcdC8vIGZvciBub24taGllcmFyY2hpY2FsIG1vZGVcblx0XHRcdFx0XHRmb3J3YXJkX2luaXRpYWxpemVkOiBmYWxzZSxcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0czogW11cdC8vIHN0YXRlc1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGhtbVJlcy5vdXRwdXRfdmFsdWVzID0gdGhpcy5tb2RlbFJlc3VsdHMub3V0cHV0X3ZhbHVlcy5zbGljZSgwKTtcblx0XHRcdFx0aG1tUmVzLm91dHB1dF9jb3ZhcmlhbmNlXG5cdFx0XHRcdFx0PSB0aGlzLm1vZGVsUmVzdWx0cy5vdXRwdXRfY292YXJpYW5jZS5zbGljZSgwKTtcblxuXHRcdFx0XHQvLyBBREQgSU5ESVZJRFVBTCBTVEFURVMgKEdNTXMpXG5cdFx0XHRcdGZvcihsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcblx0XHRcdFx0XHRsZXQgZ21tUmVzID0ge1xuXHRcdFx0XHRcdFx0aW5zdGFudF9saWtlbGlob29kOiAwLFxuXHRcdFx0XHRcdFx0bG9nX2xpa2VsaWhvb2Q6IDAsXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRnbW1SZXMuYmV0YVxuXHRcdFx0XHRcdFx0PSBuZXcgQXJyYXkodGhpcy5tb2RlbC5tb2RlbHNbaV0ucGFyYW1ldGVycy5nYXVzc2lhbnMpO1xuXHRcdFx0XHRcdGZvcihsZXQgayA9IDA7IGsgPCBnbW1SZXMuYmV0YS5sZW5ndGg7IGsrKykge1xuXHRcdFx0XHRcdFx0Z21tUmVzLmJldGFba10gPSAxIC8gZ21tUmVzLmJldGEubGVuZ3RoO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0ICAgICAgICAgICAgICAgIGdtbVJlcy5vdXRwdXRfdmFsdWVzID0gaG1tUmVzLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG5cdCAgICAgICAgICAgICAgICBnbW1SZXMub3V0cHV0X2NvdmFyaWFuY2Vcblx0ICAgICAgICAgICAgICAgIFx0PSBobW1SZXMub3V0cHV0X2NvdmFyaWFuY2Uuc2xpY2UoMCk7XG5cblx0XHRcdFx0XHRobW1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHMucHVzaChnbW1SZXMpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHMucHVzaChobW1SZXMpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vID09PT09PT09PT0gTEZPIHNwZWNpZmljXG5cdFx0Ly8gdGhpcy5pbml0aWFsaXplKHsgZnJhbWVTaXplOiB0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGggfSk7XG5cdH1cblxuXHQvLyA9PT09PT09PT09PT09PT09PT09PSBHRVRURVJTID09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuXHRnZXQgbGlrZWxpZXN0TGFiZWwoKSB7XG5cdFx0aWYodGhpcy5tb2RlbFJlc3VsdHMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0aWYodGhpcy5tb2RlbFJlc3VsdHMubGlrZWxpZXN0ID4gLTEpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMubW9kZWwubW9kZWxzW3RoaXMubW9kZWxSZXN1bHRzLmxpa2VsaWVzdF0ubGFiZWw7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAndW5rbm93bic7XG5cdFx0Ly9yZXR1cm4oJ25vIGVzdGltYXRpb24gYXZhaWxhYmxlJyk7XG5cdH1cblxufSJdfQ==