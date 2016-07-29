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

			gmmUtils.gmmLikelihoods(observation, this.model, this.modelResults);

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

			// do something for regression here (add regression results to results) :
			if (this.model.shared_parameters.bimodal) {
				results.output_values = this.modelResults.output_values.slice(0);
				// results.output_covariance = this.modelResults.output_covariance.slice(0);
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

				// the following variables are used for regression :

				var params = this.model.shared_parameters;
				var dimOut = params.dimension - params.dimension_input;
				this.modelResults.output_values = new Array(dimOut);
				for (var i = 0; i < dimOut; i++) {
					this.modelResults.output_values[i] = 0.0;
				}

				var outCovarSize = void 0;
				if (this.model.configuration.default_parameters.covariance_mode == 0) {
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

					res.beta = new Array(this.model.models[_i2].components.length);
					for (var _j = 0; _j < res.beta.length; _j++) {
						res.beta[_j] = 1 / res.beta.length;
					}

					res.output_values = this.modelResults.output_values.slice(0);
					res.output_covariance = this.modelResults.output_covariance.slice(0);

					// now add this singleModelResults object to the global modelResults object :

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
		// not used for now (need to implement updateInverseCovariance method)
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
//# sourceMappingURL=data:application/json;base64,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TCxLQUFzQixTQUF6QixFQUFvQztBQUNuQyxRQUFHLEtBQUssWUFBTCxDQUFrQixTQUFsQixHQUE4QixDQUFDLENBQWxDLEVBQXFDO0FBQ3BDLFlBQU8sS0FBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixLQUFLLFlBQUwsQ0FBa0IsU0FBcEMsRUFBK0MsS0FBdEQ7QUFDQTtBQUNEO0FBQ0QsVUFBTyxTQUFQO0FBQ0E7Ozs7O2tCQTdKbUIsVSIsImZpbGUiOiJnbW0tZGVjb2Rlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGdtbVV0aWxzIGZyb20gJy4uL3V0aWxzL2dtbS11dGlscyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdtbURlY29kZXIge1xuXG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuXHRcdGNvbnN0IGRlZmF1bHRzID0ge1xuXHRcdFx0bGlrZWxpaG9vZFdpbmRvdzogNVxuXHRcdH07XG5cdFx0bGV0IHBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuXHRcdHRoaXMubW9kZWwgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5tb2RlbFJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5saWtlbGlob29kV2luZG93ID0gcGFyYW1zLmxpa2VsaWhvb2RXaW5kb3c7XG5cdH1cblxuXHRmaWx0ZXIob2JzZXJ2YXRpb24sIHJlc3VsdHNGdW5jdGlvbikge1xuXHRcdGlmKHRoaXMubW9kZWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJubyBtb2RlbCBsb2FkZWRcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Z21tVXRpbHMuZ21tTGlrZWxpaG9vZHMob2JzZXJ2YXRpb24sIHRoaXMubW9kZWwsIHRoaXMubW9kZWxSZXN1bHRzKTtcdFx0XHRcblxuXHRcdC8vPT09PT09PT09PT09PT09PSBMRk8gc3BlY2lmaWMgOlxuXHRcdC8vZ21tTGlrZWxpaG9vZHMoZnJhbWUsIHRoaXMubW9kZWwsIHRoaXMubW9kZWxSZXN1bHRzKTtcdFx0XHRcblx0XHQvL3RoaXMudGltZSA9IHRpbWU7XG5cdFx0Ly90aGlzLm1ldGFEYXRhID0gbWV0YURhdGE7XG5cdFx0Ly9jb25zdCBvdXRGcmFtZSA9IHRoaXMub3V0RnJhbWU7XG5cdFx0Ly9mb3IobGV0IGk9MDsgaTx0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXHRcdC8vXHRvdXRGcmFtZVtpXSA9IHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG5cdFx0Ly99XG5cdFx0Ly90aGlzLm91dHB1dCgpO1xuXG5cdFx0bGV0IGxrbGhkcyA9IHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMuc2xpY2UoMCk7XG5cdFx0bGV0IGxrbHN0ID0gJ3Vua25vd24nO1xuXHRcdGlmKHRoaXMubW9kZWxSZXN1bHRzLmxpa2VsaWVzdCA+IC0xKSB7XG5cdFx0XHRsa2xzdCA9IHRoaXMubW9kZWwubW9kZWxzW3RoaXMubW9kZWxSZXN1bHRzLmxpa2VsaWVzdF0ubGFiZWw7XG5cdFx0fVxuXHRcdGxldCByZXN1bHRzID0ge1xuXHRcdFx0bGlrZWxpZXN0OiBsa2xzdCxcblx0XHRcdGxpa2VsaWhvb2RzOiBsa2xoZHNcdFx0XHRcblx0XHR9XG5cblx0XHQvLyBkbyBzb21ldGhpbmcgZm9yIHJlZ3Jlc3Npb24gaGVyZSAoYWRkIHJlZ3Jlc3Npb24gcmVzdWx0cyB0byByZXN1bHRzKSA6XG5cdFx0aWYodGhpcy5tb2RlbC5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG4gICAgICAgICAgICByZXN1bHRzLm91dHB1dF92YWx1ZXMgPSB0aGlzLm1vZGVsUmVzdWx0cy5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuICAgICAgICAgICAgLy8gcmVzdWx0cy5vdXRwdXRfY292YXJpYW5jZSA9IHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF9jb3ZhcmlhbmNlLnNsaWNlKDApO1xuXHRcdH1cblxuXHRcdHJlc3VsdHNGdW5jdGlvbihyZXN1bHRzKTtcblx0XHQvLyBPUiA6XG5cdFx0Ly8gcmV0dXJuIHJlc3VsdHM7XG5cdH1cblxuXHQvLz09PT09PT09PT09PT09PT09PT0gU0VUVEVSUyA9PT09PT09PT09PT09PT09PT09PT0vL1xuXG5cdHNldCBtb2RlbChtb2RlbCkge1xuXHRcdHRoaXMubW9kZWwgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5tb2RlbFJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cblx0XHQvLyB0ZXN0IGlmIG1vZGVsIGlzIHZhbGlkIGhlcmUgKFRPRE8gOiB3cml0ZSBhIGJldHRlciB0ZXN0KVxuXHRcdGlmKG1vZGVsLm1vZGVscyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR0aGlzLm1vZGVsID0gbW9kZWw7XG5cdFx0XHRsZXQgbm1vZGVscyA9IG1vZGVsLm1vZGVscy5sZW5ndGg7XG5cdFx0XHR0aGlzLm1vZGVsUmVzdWx0cyA9IHtcblx0XHRcdFx0aW5zdGFudF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuXHRcdFx0XHRzbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0c21vb3RoZWRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0aW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG5cdFx0XHRcdHNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0bGlrZWxpZXN0OiAtMSxcblx0XHRcdFx0c2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHM6IFtdXG5cdFx0XHR9O1xuXG4gICAgICAgICAgICAvLyB0aGUgZm9sbG93aW5nIHZhcmlhYmxlcyBhcmUgdXNlZCBmb3IgcmVncmVzc2lvbiA6XG5cbiAgICAgICAgICAgIGxldCBwYXJhbXMgPSB0aGlzLm1vZGVsLnNoYXJlZF9wYXJhbWV0ZXJzO1xuICAgICAgICAgICAgbGV0IGRpbU91dCA9IHBhcmFtcy5kaW1lbnNpb24gLSBwYXJhbXMuZGltZW5zaW9uX2lucHV0O1xuICAgICAgICAgICAgdGhpcy5tb2RlbFJlc3VsdHMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlbFJlc3VsdHMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IG91dENvdmFyU2l6ZTtcbiAgICAgICAgICAgIGlmKHRoaXMubW9kZWwuY29uZmlndXJhdGlvbi5kZWZhdWx0X3BhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09IDApIHsgLy8gZnVsbFxuICAgICAgICAgICAgICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dCAqIGRpbU91dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgeyAvLyBkaWFnb25hbFxuICAgICAgICAgICAgICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF9jb3ZhcmlhbmNlID0gbmV3IEFycmF5KG91dENvdmFyU2l6ZSk7XG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGVsUmVzdWx0cy5vdXRwdXRfY292YXJpYW5jZVtpXSA9IDAuMDtcbiAgICAgICAgICAgIH1cblxuXG5cdFx0XHRmb3IobGV0IGkgPSAwOyBpIDwgbm1vZGVsczsgaSsrKSB7XG5cblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuaW5zdGFudF9saWtlbGlob29kc1tpXSA9IDA7XG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA9IDA7XG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldID0gMDtcblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gMDtcblx0XHRcdFx0dGhpcy5tb2RlbFJlc3VsdHMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IDA7XG5cblx0XHRcdFx0bGV0IHJlcyA9IHt9O1xuXHRcdFx0XHRyZXMuaW5zdGFudF9saWtlbGlob29kID0gMDtcblx0XHRcdFx0cmVzLmxvZ19saWtlbGlob29kID0gMDtcblxuXHRcdFx0XHRyZXMubGlrZWxpaG9vZF9idWZmZXIgPSBuZXcgQXJyYXkodGhpcy5saWtlbGlob29kV2luZG93KTtcblx0XHRcdFx0cmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aCA9IHRoaXMubGlrZWxpaG9vZFdpbmRvdztcblx0XHRcdFx0Zm9yKGxldCBqID0gMDsgaiA8IHRoaXMubGlrZWxpaG9vZFdpbmRvdzsgaisrKSB7XG5cdFx0XHRcdFx0cmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMSAvIHRoaXMubGlrZWxpaG9vZFdpbmRvdztcblx0XHRcdFx0fVxuICAgICAgICAgICAgICAgIHJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleCA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLyB0aGUgZm9sbG93aW5nIHZhcmlhYmxlcyBhcmUgdXNlZCBmb3IgcmVncmVzc2lvbiA6XG5cblx0XHRcdFx0cmVzLmJldGEgPSBuZXcgQXJyYXkodGhpcy5tb2RlbC5tb2RlbHNbaV0uY29tcG9uZW50cy5sZW5ndGgpO1xuXHRcdFx0XHRmb3IobGV0IGogPSAwOyBqIDwgcmVzLmJldGEubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRyZXMuYmV0YVtqXSA9IDEgLyByZXMuYmV0YS5sZW5ndGg7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG4gICAgICAgICAgICAgICAgcmVzLm91dHB1dF92YWx1ZXMgPSB0aGlzLm1vZGVsUmVzdWx0cy5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuICAgICAgICAgICAgICAgIHJlcy5vdXRwdXRfY292YXJpYW5jZSA9IHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF9jb3ZhcmlhbmNlLnNsaWNlKDApO1xuXG4gICAgICAgICAgICAgICAgLy8gbm93IGFkZCB0aGlzIHNpbmdsZU1vZGVsUmVzdWx0cyBvYmplY3QgdG8gdGhlIGdsb2JhbCBtb2RlbFJlc3VsdHMgb2JqZWN0IDpcblxuXHRcdFx0XHR0aGlzLm1vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cy5wdXNoKHJlcyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vPT09PT09PT09PSBMRk8gc3BlY2lmaWMgOiBkb24ndCBmb3JnZXQgdG8gYWRkIGl0IGluIHRoZSBMRk8gd3JhcHBlclxuXHRcdC8vdGhpcy5pbml0aWFsaXplKHsgZnJhbWVTaXplOiB0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGggfSk7XG5cdH1cblxuXHRzZXQgbGlrZWxpaG9vZFdpbmRvdyhuZXdXaW5kb3dTaXplKSB7XG5cdFx0dGhpcy5saWtlbGlob29kV2luZG93ID0gbmV3V2luZG93U2l6ZTtcblx0XHRpZih0aGlzLm1vZGVsID09PSB1bmRlZmluZWQpIHJldHVybjtcblx0XHRsZXQgcmVzID0gdGhpcy5tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NNb2RlbFJlc3VsdHM7XG5cdFx0Zm9yKGxldCBpPTA7IGk8dGhpcy5tb2RlbC5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHJlc1tpXS5saWtlbGlob29kX2J1ZmZlciA9IG5ldyBBcnJheSh0aGlzLmxpa2VsaWhvb2RXaW5kb3cpO1xuXHRcdFx0Zm9yKGxldCBqPTA7IGo8dGhpcy5saWtlbGlob29kV2luZG93OyBqKyspIHtcblx0XHRcdFx0cmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMSAvIHRoaXMubGlrZWxpaG9vZFdpbmRvdztcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvL3NldCB2YXJpYW5jZU9mZnNldCgpIHtcblx0XHQvLyBub3QgdXNlZCBmb3Igbm93IChuZWVkIHRvIGltcGxlbWVudCB1cGRhdGVJbnZlcnNlQ292YXJpYW5jZSBtZXRob2QpXG5cdC8vfVxuXG5cdC8vPT09PT09PT09PT09PT09PT09PSBHRVRURVJTID09PT09PT09PT09PT09PT09PT09PS8vXG5cblx0Z2V0IGxpa2VsaWVzdExhYmVsKCkge1xuXHRcdGlmKHRoaXMubW9kZWxSZXN1bHRzICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGlmKHRoaXMubW9kZWxSZXN1bHRzLmxpa2VsaWVzdCA+IC0xKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLm1vZGVsLm1vZGVsc1t0aGlzLm1vZGVsUmVzdWx0cy5saWtlbGllc3RdLmxhYmVsO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gJ3Vua25vd24nO1xuXHR9XG5cbn0iXX0=