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

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var GmmDecoder = function () {
	function GmmDecoder() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		(0, _classCallCheck3.default)(this, GmmDecoder);

		var defaults = {
			likelihoodWindow: 5
		};
		var params = (0, _assign2.default)({}, defaults, options);

		this.model = undefined;
		this.modelResults = undefined;
		this.likelihoodWindow = params.likelihoodWindow;
	}

	(0, _createClass3.default)(GmmDecoder, [{
		key: 'filter',
		value: function filter(observation, resultsFunction) {
			if (this.model === undefined) {
				console.log("no model loaded");
				return;
			}

			gmmUtils.gmmFilter(observation, this.model, this.modelResults);

			//================ LFO specific :
			//gmmLikelihoods(frame, this.model, this.modelResults);			
			//this.time = time;
			//this.metaData = metaData;
			//const outFrame = this.outFrame;
			//for(let i=0; i<this.model.models.length; i++) {
			//	outFrame[i] = this.modelResults.smoothed_normalized_likelihoods[i];
			//}
			//this.output();

			var lklhds = this.modelResults.smoothed_normalized_likelihoods.slice(0);
			var lklst = 'unknown';
			if (this.modelResults.likeliest > -1) {
				lklst = this.model.models[this.modelResults.likeliest].label;
			}
			var results = {
				likeliest: lklst,
				likelihoods: lklhds
			};

			// add regression results to global results if bimodal :
			if (this.model.shared_parameters.bimodal) {
				results.output_values = this.modelResults.output_values.slice(0);
				// results.output_covariance
				//     = this.modelResults.output_covariance.slice(0);
			}

			resultsFunction(results);
			// OR :
			// return results;
		}

		//=================== SETTERS =====================//

	}, {
		key: 'model',
		set: function set(model) {
			this.model = undefined;
			this.modelResults = undefined;

			// test if model is valid here (TODO : write a better test)
			if (model.models !== undefined) {
				this.model = model;
				var m = this.model;
				var nmodels = m.models.length;
				this.modelResults = {
					instant_likelihoods: new Array(nmodels),
					smoothed_log_likelihoods: new Array(nmodels),
					smoothed_likelihoods: new Array(nmodels),
					instant_normalized_likelihoods: new Array(nmodels),
					smoothed_normalized_likelihoods: new Array(nmodels),
					likeliest: -1,
					singleClassGmmModelResults: []
				};

				// the following variables are used for regression :

				var params = m.shared_parameters;
				var dimOut = params.dimension - params.dimension_input;
				this.modelResults.output_values = new Array(dimOut);
				for (var i = 0; i < dimOut; i++) {
					this.modelResults.output_values[i] = 0.0;
				}

				var outCovarSize = void 0;
				//------------------------------------------------------------- full
				if (m.configuration.default_parameters.covariance_mode == 0) {
					outCovarSize = dimOut * dimOut;
					//--------------------------------------------------------- diagonal
				} else {
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

					var res = {};
					res.instant_likelihood = 0;
					res.log_likelihood = 0;

					res.likelihood_buffer = new Array(this.likelihoodWindow);
					res.likelihood_buffer.length = this.likelihoodWindow;
					for (var j = 0; j < this.likelihoodWindow; j++) {
						res.likelihood_buffer[j] = 1 / this.likelihoodWindow;
					}
					res.likelihood_buffer_index = 0;

					// the following variables are used for regression :

					res.beta = new Array(m.models[_i2].components.length);
					for (var _j = 0; _j < res.beta.length; _j++) {
						res.beta[_j] = 1 / res.beta.length;
					}
					res.output_values = this.modelResults.output_values.slice(0);
					res.output_covariance = this.modelResults.output_covariance.slice(0);

					// now add this singleModelResults object
					// to the global modelResults object :

					this.modelResults.singleClassGmmModelResults.push(res);
				}
			}
			//========== LFO specific : don't forget to add it in the LFO wrapper
			//this.initialize({ frameSize: this.model.models.length });
		}
	}, {
		key: 'likelihoodWindow',
		set: function set(newWindowSize) {
			this.likelihoodWindow = newWindowSize;
			if (this.model === undefined) return;
			var res = this.modelResults.singleClassModelResults;
			for (var i = 0; i < this.model.models.length; i++) {
				res[i].likelihood_buffer = new Array(this.likelihoodWindow);
				for (var j = 0; j < this.likelihoodWindow; j++) {
					res.likelihood_buffer[j] = 1 / this.likelihoodWindow;
				}
			}
		}

		//set varianceOffset() {
		/*
        not used for now (need to implement updateInverseCovariance method)
        */
		//}

		//=================== GETTERS =====================//

	}, {
		key: 'likeliestLabel',
		get: function get() {
			if (this.modelResults !== undefined) {
				if (this.modelResults.likeliest > -1) {
					return this.model.models[this.modelResults.likeliest].label;
				}
			}
			return 'unknown';
		}
	}]);
	return GmmDecoder;
}();

exports.default = GmmDecoder;
//# sourceMappingURL=data:application/json;base64,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QUFzQixTQUF6QixFQUFvQztBQUNuQyxRQUFHLEtBQUssWUFBTCxDQUFrQixTQUFsQixHQUE4QixDQUFDLENBQWxDLEVBQXFDO0FBQ3BDLFlBQU8sS0FBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixLQUFLLFlBQUwsQ0FBa0IsU0FBcEMsRUFBK0MsS0FBdEQ7QUFDQTtBQUNEO0FBQ0QsVUFBTyxTQUFQO0FBQ0E7Ozs7O2tCQXBLbUIsVSIsImZpbGUiOiJnbW0tZGVjb2Rlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGdtbVV0aWxzIGZyb20gJy4uL3V0aWxzL2dtbS11dGlscyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdtbURlY29kZXIge1xuXG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuXHRcdGNvbnN0IGRlZmF1bHRzID0ge1xuXHRcdFx0bGlrZWxpaG9vZFdpbmRvdzogNVxuXHRcdH07XG5cdFx0bGV0IHBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuXHRcdHRoaXMubW9kZWwgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5tb2RlbFJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5saWtlbGlob29kV2luZG93ID0gcGFyYW1zLmxpa2VsaWhvb2RXaW5kb3c7XG5cdH1cblxuXHRmaWx0ZXIob2JzZXJ2YXRpb24sIHJlc3VsdHNGdW5jdGlvbikge1xuXHRcdGlmKHRoaXMubW9kZWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJubyBtb2RlbCBsb2FkZWRcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Z21tVXRpbHMuZ21tRmlsdGVyKG9ic2VydmF0aW9uLCB0aGlzLm1vZGVsLCB0aGlzLm1vZGVsUmVzdWx0cyk7XHRcdFx0XG5cblx0XHQvLz09PT09PT09PT09PT09PT0gTEZPIHNwZWNpZmljIDpcblx0XHQvL2dtbUxpa2VsaWhvb2RzKGZyYW1lLCB0aGlzLm1vZGVsLCB0aGlzLm1vZGVsUmVzdWx0cyk7XHRcdFx0XG5cdFx0Ly90aGlzLnRpbWUgPSB0aW1lO1xuXHRcdC8vdGhpcy5tZXRhRGF0YSA9IG1ldGFEYXRhO1xuXHRcdC8vY29uc3Qgb3V0RnJhbWUgPSB0aGlzLm91dEZyYW1lO1xuXHRcdC8vZm9yKGxldCBpPTA7IGk8dGhpcy5tb2RlbC5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHQvL1x0b3V0RnJhbWVbaV0gPSB0aGlzLm1vZGVsUmVzdWx0cy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXHRcdC8vfVxuXHRcdC8vdGhpcy5vdXRwdXQoKTtcblxuXHRcdGxldCBsa2xoZHMgPSB0aGlzLm1vZGVsUmVzdWx0cy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzLnNsaWNlKDApO1xuXHRcdGxldCBsa2xzdCA9ICd1bmtub3duJztcblx0XHRpZih0aGlzLm1vZGVsUmVzdWx0cy5saWtlbGllc3QgPiAtMSkge1xuXHRcdFx0bGtsc3QgPSB0aGlzLm1vZGVsLm1vZGVsc1t0aGlzLm1vZGVsUmVzdWx0cy5saWtlbGllc3RdLmxhYmVsO1xuXHRcdH1cblx0XHRsZXQgcmVzdWx0cyA9IHtcblx0XHRcdGxpa2VsaWVzdDogbGtsc3QsXG5cdFx0XHRsaWtlbGlob29kczogbGtsaGRzXHRcdFx0XG5cdFx0fVxuXG5cdFx0Ly8gYWRkIHJlZ3Jlc3Npb24gcmVzdWx0cyB0byBnbG9iYWwgcmVzdWx0cyBpZiBiaW1vZGFsIDpcblx0XHRpZih0aGlzLm1vZGVsLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcbiAgICAgICAgICAgIHJlc3VsdHMub3V0cHV0X3ZhbHVlcyA9IHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG4gICAgICAgICAgICAvLyByZXN1bHRzLm91dHB1dF9jb3ZhcmlhbmNlXG4gICAgICAgICAgICAvLyAgICAgPSB0aGlzLm1vZGVsUmVzdWx0cy5vdXRwdXRfY292YXJpYW5jZS5zbGljZSgwKTtcblx0XHR9XG5cblx0XHRyZXN1bHRzRnVuY3Rpb24ocmVzdWx0cyk7XG5cdFx0Ly8gT1IgOlxuXHRcdC8vIHJldHVybiByZXN1bHRzO1xuXHR9XG5cblx0Ly89PT09PT09PT09PT09PT09PT09IFNFVFRFUlMgPT09PT09PT09PT09PT09PT09PT09Ly9cblxuXHRzZXQgbW9kZWwobW9kZWwpIHtcblx0XHR0aGlzLm1vZGVsID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMubW9kZWxSZXN1bHRzID0gdW5kZWZpbmVkO1xuXG5cdFx0Ly8gdGVzdCBpZiBtb2RlbCBpcyB2YWxpZCBoZXJlIChUT0RPIDogd3JpdGUgYSBiZXR0ZXIgdGVzdClcblx0XHRpZihtb2RlbC5tb2RlbHMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgICAgICAgbGV0IG0gPSB0aGlzLm1vZGVsO1xuXHRcdFx0bGV0IG5tb2RlbHMgPSBtLm1vZGVscy5sZW5ndGg7XG5cdFx0XHR0aGlzLm1vZGVsUmVzdWx0cyA9IHtcblx0XHRcdFx0aW5zdGFudF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuXHRcdFx0XHRzbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0c21vb3RoZWRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0aW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG5cdFx0XHRcdHNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0bGlrZWxpZXN0OiAtMSxcblx0XHRcdFx0c2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHM6IFtdXG5cdFx0XHR9O1xuXG4gICAgICAgICAgICAvLyB0aGUgZm9sbG93aW5nIHZhcmlhYmxlcyBhcmUgdXNlZCBmb3IgcmVncmVzc2lvbiA6XG5cbiAgICAgICAgICAgIGxldCBwYXJhbXMgPSBtLnNoYXJlZF9wYXJhbWV0ZXJzO1xuICAgICAgICAgICAgbGV0IGRpbU91dCA9IHBhcmFtcy5kaW1lbnNpb24gLSBwYXJhbXMuZGltZW5zaW9uX2lucHV0O1xuICAgICAgICAgICAgdGhpcy5tb2RlbFJlc3VsdHMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlbFJlc3VsdHMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IG91dENvdmFyU2l6ZTtcbiAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgICBpZihtLmNvbmZpZ3VyYXRpb24uZGVmYXVsdF9wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0ICogZGltT3V0O1xuICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tb2RlbFJlc3VsdHMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuICAgICAgICAgICAgfVxuXG5cblx0XHRcdGZvcihsZXQgaSA9IDA7IGkgPCBubW9kZWxzOyBpKyspIHtcblxuXHRcdFx0XHR0aGlzLm1vZGVsUmVzdWx0cy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldID0gMDtcblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldID0gMDtcblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuc21vb3RoZWRfbGlrZWxpaG9vZHNbaV0gPSAwO1xuXHRcdFx0XHR0aGlzLm1vZGVsUmVzdWx0cy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSAwO1xuXHRcdFx0XHR0aGlzLm1vZGVsUmVzdWx0cy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gMDtcblxuXHRcdFx0XHRsZXQgcmVzID0ge307XG5cdFx0XHRcdHJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSAwO1xuXHRcdFx0XHRyZXMubG9nX2xpa2VsaWhvb2QgPSAwO1xuXG5cdFx0XHRcdHJlcy5saWtlbGlob29kX2J1ZmZlciA9IG5ldyBBcnJheSh0aGlzLmxpa2VsaWhvb2RXaW5kb3cpO1xuXHRcdFx0XHRyZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoID0gdGhpcy5saWtlbGlob29kV2luZG93O1xuXHRcdFx0XHRmb3IobGV0IGogPSAwOyBqIDwgdGhpcy5saWtlbGlob29kV2luZG93OyBqKyspIHtcblx0XHRcdFx0XHRyZXMubGlrZWxpaG9vZF9idWZmZXJbal0gPSAxIC8gdGhpcy5saWtlbGlob29kV2luZG93O1xuXHRcdFx0XHR9XG4gICAgICAgICAgICAgICAgcmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4ID0gMDtcblxuICAgICAgICAgICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgdmFyaWFibGVzIGFyZSB1c2VkIGZvciByZWdyZXNzaW9uIDpcblxuXHRcdFx0XHRyZXMuYmV0YSA9IG5ldyBBcnJheShtLm1vZGVsc1tpXS5jb21wb25lbnRzLmxlbmd0aCk7XG5cdFx0XHRcdGZvcihsZXQgaiA9IDA7IGogPCByZXMuYmV0YS5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdHJlcy5iZXRhW2pdID0gMSAvIHJlcy5iZXRhLmxlbmd0aDtcblx0XHRcdFx0fVxuICAgICAgICAgICAgICAgIHJlcy5vdXRwdXRfdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgID0gdGhpcy5tb2RlbFJlc3VsdHMub3V0cHV0X3ZhbHVlcy5zbGljZSgwKTtcbiAgICAgICAgICAgICAgICByZXMub3V0cHV0X2NvdmFyaWFuY2VcbiAgICAgICAgICAgICAgICAgICAgPSB0aGlzLm1vZGVsUmVzdWx0cy5vdXRwdXRfY292YXJpYW5jZS5zbGljZSgwKTtcblxuICAgICAgICAgICAgICAgIC8vIG5vdyBhZGQgdGhpcyBzaW5nbGVNb2RlbFJlc3VsdHMgb2JqZWN0XG4gICAgICAgICAgICAgICAgLy8gdG8gdGhlIGdsb2JhbCBtb2RlbFJlc3VsdHMgb2JqZWN0IDpcblxuXHRcdFx0XHR0aGlzLm1vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cy5wdXNoKHJlcyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vPT09PT09PT09PSBMRk8gc3BlY2lmaWMgOiBkb24ndCBmb3JnZXQgdG8gYWRkIGl0IGluIHRoZSBMRk8gd3JhcHBlclxuXHRcdC8vdGhpcy5pbml0aWFsaXplKHsgZnJhbWVTaXplOiB0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGggfSk7XG5cdH1cblxuXHRzZXQgbGlrZWxpaG9vZFdpbmRvdyhuZXdXaW5kb3dTaXplKSB7XG5cdFx0dGhpcy5saWtlbGlob29kV2luZG93ID0gbmV3V2luZG93U2l6ZTtcblx0XHRpZih0aGlzLm1vZGVsID09PSB1bmRlZmluZWQpIHJldHVybjtcblx0XHRsZXQgcmVzID0gdGhpcy5tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NNb2RlbFJlc3VsdHM7XG5cdFx0Zm9yKGxldCBpPTA7IGk8dGhpcy5tb2RlbC5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHJlc1tpXS5saWtlbGlob29kX2J1ZmZlciA9IG5ldyBBcnJheSh0aGlzLmxpa2VsaWhvb2RXaW5kb3cpO1xuXHRcdFx0Zm9yKGxldCBqPTA7IGo8dGhpcy5saWtlbGlob29kV2luZG93OyBqKyspIHtcblx0XHRcdFx0cmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMSAvIHRoaXMubGlrZWxpaG9vZFdpbmRvdztcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvL3NldCB2YXJpYW5jZU9mZnNldCgpIHtcblx0XHQvKlxuICAgICAgICBub3QgdXNlZCBmb3Igbm93IChuZWVkIHRvIGltcGxlbWVudCB1cGRhdGVJbnZlcnNlQ292YXJpYW5jZSBtZXRob2QpXG4gICAgICAgICovXG5cdC8vfVxuXG5cdC8vPT09PT09PT09PT09PT09PT09PSBHRVRURVJTID09PT09PT09PT09PT09PT09PT09PS8vXG5cblx0Z2V0IGxpa2VsaWVzdExhYmVsKCkge1xuXHRcdGlmKHRoaXMubW9kZWxSZXN1bHRzICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGlmKHRoaXMubW9kZWxSZXN1bHRzLmxpa2VsaWVzdCA+IC0xKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLm1vZGVsLm1vZGVsc1t0aGlzLm1vZGVsUmVzdWx0cy5saWtlbGllc3RdLmxhYmVsO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gJ3Vua25vd24nO1xuXHR9XG5cbn0iXX0=