"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 *	functions translated from the decoding part of XMM
 */

// TODO : write methods for generating modelResults object

// get the inverse_covariances matrix of each of the GMM classes
// for each input data, compute the distance of the frame to each of the GMMs
// with the following equations :

// ================================= //
// as in xmmGaussianDistribution.cpp //
// ================================= //

// from xmmGaussianDistribution::regression
var gmmComponentRegression = exports.gmmComponentRegression = function gmmComponentRegression(observationIn, predictionOut, gaussianComponent) {
	var c = gaussianComponent;
	var dim = c.dimension;
	var dimIn = c.dimension_input;
	var dimOut = dim - dimIn;
	//let predictedOut = [];
	predictionOut = new Array(dimOut);

	if (c.covariance_mode === 0) {
		// full
		for (var d = 0; d < dimOut; d++) {
			predictionOut[d] = c.mean[dimIn + d];
			for (var e = 0; e < dimIn; e++) {
				var tmp = 0.0;
				for (var f = 0; f < dimIn; f++) {
					tmp += c.inverse_covariance_input[e * dimIn + f] * (observationIn[f] - c.mean[f]);
				}
				predictionOut[d] += c.covariance[(d + dimIn) * dim + e] * tmp;
			}
		}
	} else {
		// diagonal
		for (var _d = 0; _d < dimOut; _d++) {
			predictionOut[_d] = c.covariance[_d + dimIn];
		}
	}
	//return predictionOut;
};

var gmmComponentLikelihood = exports.gmmComponentLikelihood = function gmmComponentLikelihood(observation, gaussianComponent) {
	var c = gaussianComponent;
	// if(c.covariance_determinant === 0) {
	// 	return undefined;
	// }
	var euclidianDistance = 0.0;
	if (c.covariance_mode === 0) {
		for (var l = 0; l < c.dimension; l++) {
			var tmp = 0.0;
			for (var k = 0; k < c.dimension; k++) {
				tmp += c.inverse_covariance[l * c.dimension + k] * (observation[k] - c.mean[k]);
			}
			euclidianDistance += (observation[l] - c.mean[l]) * tmp;
		}
	} else {
		// diagonal
		for (var _l = 0; _l < c.dimension; _l++) {
			euclidianDistance += c.inverse_covariance[_l] * (observation[_l] - c.mean[_l]) * (observation[_l] - c.mean[_l]);
		}
	}

	var p = Math.exp(-0.5 * euclidianDistance);
	p /= Math.sqrt(c.covariance_determinant * Math.pow(2 * Math.PI, c.dimension));

	if (p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
		p = 1e-180;
	}
	return p;
};

var gmmComponentLikelihoodInput = exports.gmmComponentLikelihoodInput = function gmmComponentLikelihoodInput(observationIn, gaussianComponent) {
	var c = gaussianComponent;
	// if(c.covariance_determinant === 0) {
	// 	return undefined;
	// }
	var euclidianDistance = 0.0;
	if (c.covariance_mode === 0) {
		// full
		for (var l = 0; l < c.dimension_input; l++) {
			var tmp = 0.0;
			for (var k = 0; k < c.dimension_input; k++) {
				tmp += c.inverse_covariance_input[l * c.dimension_input + k] * (observationIn[k] - c.mean[k]);
			}
			euclidianDistance += (observationIn[l] - c.mean[l]) * tmp;
		}
	} else {
		// diagonal
		for (var _l2 = 0; _l2 < c.dimension_input; _l2++) {
			// or would it be c.inverse_covariance_input[l] ?
			// sounds logic ... but, according to Jules (cf e-mail), not really important.
			euclidianDistance += c.inverse_covariance_input[_l2] * (observationIn[_l2] - c.mean[_l2]) * (observationIn[_l2] - c.mean[_l2]);
		}
	}

	var p = Math.exp(-0.5 * euclidianDistance);
	p /= Math.sqrt(c.covariance_determinant_input * Math.pow(2 * Math.PI, c.dimension_input));

	if (p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
		p = 1e-180;
	}
	return p;
};

var gmmComponentLikelihoodBimodal = exports.gmmComponentLikelihoodBimodal = function gmmComponentLikelihoodBimodal(observationIn, observationOut, gaussianComponent) {
	var c = gaussianComponent;
	// if(c.covariance_determinant === 0) {
	// 	return undefined;
	// }
	var dimension_output = c.dimension - c.dimension_input;
	var euclidianDistance = 0.0;
	if (c.covariance_mode === 0) {
		// full
		for (var l = 0; l < c.dimension; l++) {
			var tmp = 0.0;
			for (var k = 0; k < c.dimension_input; k++) {
				tmp += c.inverse_covariance[l * c.dimension + k] * (observationIn[k] - c.mean[k]);
			}
			for (var _k = 0; _k < dimension_output; _k++) {
				tmp += c.inverse_covariance[l * c.dimension + c.dimension_input + _k] * (observationOut[_k] - c.mean[c.dimension_input + _k]);
			}
			if (l < c.dimension_input) {
				euclidianDistance += (observationIn[l] - c.mean[l]) * tmp;
			} else {
				euclidianDistance += (observationOut[l - c.dimension_input] - c.mean[l]) * tmp;
			}
		}
	} else {
		// diagonal
		for (var _l3 = 0; _l3 < c.dimension_input; _l3++) {
			euclidianDistance += c.inverse_covariance[_l3] * (observationIn[_l3] - c.mean[_l3]) * (observationIn[_l3] - c.mean[_l3]);
		}
		for (var _l4 = c.dimension_input; _l4 < c.dimension; _l4++) {
			var sq = (observationOut[_l4 - c.dimension_input] - c.mean[_l4]) * (observationOut[_l4 - c.dimension_input] - c.mean[_l4]);
			euclidianDistance += c.inverse_covariance[_l4] * sq;
		}
	}

	var p = Math.exp(-0.5 * euclidianDistance);
	p /= Math.sqrt(c.covariance_determinant * Math.pow(2 * Math.PI, c.dimension));

	if (p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
		p = 1e-180;
	}
	return p;
};

// ================================= //
//    as in xmmGmmSingleClass.cpp    //
// ================================= //

var gmmRegression = exports.gmmRegression = function gmmRegression(observationIn, singleClassGmmModel, singleClassGmmModelResults) {
	var model = singleClassGmmModel;
	var res = singleClassGmmModelResults;

	var dim = model.components[0].dimension;
	var dimIn = model.components[0].dimension_input;
	var dimOut = dim - dimIn;

	res.output_values = new Array(dimOut);
	for (var i = 0; i < dimOut; i++) {
		res.output_values[i] = 0.0;
	}

	var outCovarSize = void 0;
	if (model.parameters.covariance_mode === 0) {
		//full
		outCovarSize = dimOut * dimOut;
	} else {
		// === 1 : diagonal
		outCovarSize = dimOut;
	}
	res.output_covariance = new Array(outCovarSize);
	for (var _i = 0; _i < outCovarSize; _i++) {
		res.output_covariance[_i] = 0.0;
	}

	var tmp_output_values = new Array(dimOut);
	for (var _i2 = 0; _i2 < dimOut; _i2++) {
		tmp_output_values[_i2] = 0.0;
	}

	for (var _c = 0; _c < model.components.length; _c++) {
		gmmComponentRegression(observationIn, tmp_output_value, model.components[_c]);
		var sqbeta = res.beta[_c] * res.beta[_c];
		for (var d = 0; d < dimOut; d++) {
			res.output_values[d] += res.beta[_c] * tmp_output_values[d];
			if (model.parameters.covariance_mode === 0) {
				//full
				for (var d2 = 0; d2 < dimOut; d2++) {
					var index = d * dimOut + d2;
					res.output_covariance[index] += sqbeta * model.components[_c].output_covariance[index];
				}
			} else {
				// diagonal
				res.output_covariance[d] += sqbeta * model.components[_c].output_covariance[d];
			}
		}
	}
};

var gmmObsProb = exports.gmmObsProb = function gmmObsProb(observationIn, singleClassGmmModel) {
	var componentId = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

	var coeffs = singleClassGmmModel.mixture_coeffs;
	//console.log(coeffs);
	//if(coeffs === undefined) coeffs = [1];
	var components = singleClassGmmModel.components;
	var p = 0.0;
	if (componentId < 0) {
		for (var _c2 = 0; _c2 < components.length; _c2++) {
			p += gmmObsProb(observationIn, singleClassGmmModel, _c2);
		}
	} else {
		p = coeffs[c] * gmmComponentLikelihood(observationIn, components[c]);
	}
	return p;
};

var gmmObsProbInput = exports.gmmObsProbInput = function gmmObsProbInput(observationIn, singleClassGmmModel) {
	var componentId = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

	var coeffs = singleClassGmmModel.mixture_coeffs;
	var components = singleClassGmmModel.components;
	var p = 0.0;
	if (componentId < 0) {
		for (var _c3 = 0; _c3 < components.length; _c3++) {
			p += gmmObsProbInput(observationIn, singleClassGmmModel, _c3);
		}
	} else {
		p = coeffs[c] * gmmComponentLikelihoodInput(observationIn, components[c]);
	}
	return p;
};

var gmmObsProbBimodal = exports.gmmObsProbBimodal = function gmmObsProbBimodal(observationIn, observationOut, singleClassGmmModel) {
	var componentId = arguments.length <= 3 || arguments[3] === undefined ? -1 : arguments[3];

	var coeffs = singleClassGmmModel.mixture_coeffs;
	var components = singleClassGmmModel.components;
	var p = 0.0;
	if (componentId < 0) {
		for (var _c4 = 0; _c4 < components.length; _c4++) {
			p += gmmObsProbBimodal(observationIn, observationOut, singleClassGmmModel, _c4);
		}
	} else {
		p = coeffs[c] * gmmComponentLikelihoodBimodal(observationIn, observationOut, components[c]);
	}
	return p;
};

var gmmLikelihood = exports.gmmLikelihood = function gmmLikelihood(observationIn, singleClassGmmModel, singleClassGmmModelResults) {
	var observationOut = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

	var coeffs = singleClassGmmModel.mixture_coeffs;
	var components = singleClassGmmModel.components;
	var res = singleClassGmmModelResults;
	var likelihood = 0.0;
	for (var _c5 = 0; _c5 < components.length; _c5++) {
		if (singleClassGmmModel.components[_c5].bimodal) {
			if (observationOut.length === 0) {
				// maybe check if observationOut is an array ?
				res.beta[_c5] = gmmObsProbInput(observationIn, singleClassGmmModel, _c5);
			} else {
				res.beta[_c5] = gmmObsProbBimodal(observationIn, observationOut, singleClassGmmModel, _c5);
			}
		} else {
			res.beta[_c5] = gmmObsProb(observationIn, singleClassGmmModel, _c5);
		}
		likelihood += res.beta[_c5];
	}
	for (var _c6 = 0; _c6 < coeffs.length; _c6++) {
		res.beta[_c6] /= likelihood;
	}

	res.instant_likelihood = likelihood;

	// as in xmm::SingleClassGMM::updateResults :
	// ------------------------------------------
	//res.likelihood_buffer.unshift(likelihood);
	//res.likelihood_buffer.length--;
	// THIS IS BETTER (circular buffer)
	res.likelihood_buffer[res.likelihood_buffer_index] = likelihood;
	res.likelihood_buffer_index = (res.likelihood_buffer_index + 1) % res.likelihood_buffer.length;
	// sum all array values :
	res.log_likelihood = res.likelihood_buffer.reduce(function (a, b) {
		return a + b;
	}, 0);
	res.log_likelihood /= res.likelihood_buffer.length;

	return likelihood;
};

// ================================= //
//          as in xmmGmm.cpp         //
// ================================= //

var gmmLikelihoods = exports.gmmLikelihoods = function gmmLikelihoods(observation, gmmModel, gmmModelResults) {
	var likelihoods = [];
	var models = gmmModel.models;
	var res = gmmModelResults;

	var maxLogLikelihood = 0;
	var normConstInstant = 0;
	var normConstSmoothed = 0;

	for (var i = 0; i < models.length; i++) {

		var singleRes = res.singleClassGmmModelResults[i];
		res.instant_likelihoods[i] = gmmLikelihood(observation, models[i], singleRes);

		// as in xmm::GMM::updateResults :
		// -------------------------------
		res.smoothed_log_likelihoods[i] = singleRes.log_likelihood;
		res.smoothed_likelihoods[i] = Math.exp(res.smoothed_log_likelihoods[i]);
		res.instant_normalized_likelihoods[i] = res.instant_likelihoods[i];
		res.smoothed_normalized_likelihoods[i] = res.smoothed_likelihoods[i];

		normConstInstant += res.instant_normalized_likelihoods[i];
		normConstSmoothed += res.smoothed_normalized_likelihoods[i];

		if (i == 0 || res.smoothed_log_likelihoods[i] > maxLogLikelihood) {
			maxLogLikelihood = res.smoothed_log_likelihoods[i];
			res.likeliest = i;
		}
	}

	for (var _i3 = 0; _i3 < models.length; _i3++) {

		res.instant_normalized_likelihoods[_i3] /= normConstInstant;
		res.smoothed_normalized_likelihoods[_i3] /= normConstSmoothed;
	}

	// if model is bimodal :
	// ---------------------
	var params = gmmModel.shared_parameters;
	var config = gmmModel.configuration;

	if (params.bimodal) {
		var dim = params.dimension;
		var dimIn = params.dimension_input;
		var dimOut = dim - dimIn;

		if (config.multiClass_regression_estimator === 0) {
			// likeliest
			res.output_values = res.singleClassModelResults[res.likeliest].output_values;
			res.output_covariance = res.singleClassModelResults[res.likeliest].output_covariance;
		} else {
			// mixture
			// zero-fill output_values and output_covariance
			res.output_values = new Array(dimOut);
			for (var _i4 = 0; _i4 < dimOut; _i4++) {
				res.output_values[_i4] = 0.0;
			}

			var outCovarSize = void 0;
			if (config.default_parameters.covariance_mode == 0) {
				// full
				outCovarSize = dimOut * dimOut;
			} else {
				// diagonal
				outCovarSize = dimOut;
			}
			res.output_covariance = new Array(outCovarSize);
			for (var _i5 = 0; _i5 < outCovarSize; _i5++) {
				res.output_covariance[_i5] = 0.0;
			}

			// compute the actual values :
			for (var _i6 = 0; _i6 < models.length; _i6++) {
				var smoothNormLikelihood = res.smoothed_normalized_likelihoods[_i6];
				var _singleRes = res.singleClassGmmModelResults[_i6];
				for (var d = 0; d < dimOut; _i6++) {
					res.output_values[d] += smoothNormLikelihood * _singleRes.output_values[d];
					if (config.default_parameters.covariance_mode === 0) {
						//full
						for (var d2 = 0; d2 < dimOut; d2++) {
							var index = d * dimOut + d2;
							res.output_covariance[index] += smoothNormLikelihood * _singleRes.output_covariance[index];
						}
					} else {
						// diagonal
						res.output_covariance[d] += smoothNormLikelihood * _singleRes.output_covariance[d];
					}
				}
			}
		}
	} // end if params.bimodal
};
//# sourceMappingURL=data:application/json;base64,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QStCLEdBQS9CLENBQWhCO0FBQ0EsU0FBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksTUFBbkIsRUFBMkIsS0FBM0IsRUFBZ0M7QUFDL0IsU0FBSSxhQUFKLENBQWtCLENBQWxCLEtBQXdCLHVCQUF1QixXQUFVLGFBQVYsQ0FBd0IsQ0FBeEIsQ0FBL0M7QUFDQSxTQUFHLE9BQU8sa0JBQVAsQ0FBMEIsZUFBMUIsS0FBOEMsQ0FBakQsRUFBb0Q7QUFBRTtBQUNyRCxXQUFJLElBQUksS0FBSyxDQUFiLEVBQWdCLEtBQUssTUFBckIsRUFBNkIsSUFBN0IsRUFBbUM7QUFDbEMsV0FBSSxRQUFRLElBQUksTUFBSixHQUFhLEVBQXpCO0FBQ0EsV0FBSSxpQkFBSixDQUFzQixLQUF0QixLQUFnQyx1QkFDdEIsV0FBVSxpQkFBVixDQUE0QixLQUE1QixDQURWO0FBRUE7QUFDRCxNQU5ELE1BT0s7QUFBRTtBQUNOLFVBQUksaUJBQUosQ0FBc0IsQ0FBdEIsS0FBNEIsdUJBQ25CLFdBQVUsaUJBQVYsQ0FBNEIsQ0FBNUIsQ0FEVDtBQUVBO0FBQ0Q7QUFDRDtBQUNWO0FBQ0QsRUEzRndFLENBMkZ2RTtBQUNGLENBNUZNIiwiZmlsZSI6ImdtbS11dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcdGZ1bmN0aW9ucyB0cmFuc2xhdGVkIGZyb20gdGhlIGRlY29kaW5nIHBhcnQgb2YgWE1NXG4gKi9cblxuLy8gVE9ETyA6IHdyaXRlIG1ldGhvZHMgZm9yIGdlbmVyYXRpbmcgbW9kZWxSZXN1bHRzIG9iamVjdFxuXG4vLyBnZXQgdGhlIGludmVyc2VfY292YXJpYW5jZXMgbWF0cml4IG9mIGVhY2ggb2YgdGhlIEdNTSBjbGFzc2VzXG4vLyBmb3IgZWFjaCBpbnB1dCBkYXRhLCBjb21wdXRlIHRoZSBkaXN0YW5jZSBvZiB0aGUgZnJhbWUgdG8gZWFjaCBvZiB0aGUgR01Nc1xuLy8gd2l0aCB0aGUgZm9sbG93aW5nIGVxdWF0aW9ucyA6XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gYXMgaW4geG1tR2F1c3NpYW5EaXN0cmlidXRpb24uY3BwIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuLy8gZnJvbSB4bW1HYXVzc2lhbkRpc3RyaWJ1dGlvbjo6cmVncmVzc2lvblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudFJlZ3Jlc3Npb24gPSAob2JzZXJ2YXRpb25JbiwgcHJlZGljdGlvbk91dCwgZ2F1c3NpYW5Db21wb25lbnQpID0+IHtcblx0bGV0IGMgPSBnYXVzc2lhbkNvbXBvbmVudDtcblx0bGV0IGRpbSA9IGMuZGltZW5zaW9uO1xuXHRsZXQgZGltSW4gPSBjLmRpbWVuc2lvbl9pbnB1dDtcblx0bGV0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXHQvL2xldCBwcmVkaWN0ZWRPdXQgPSBbXTtcblx0cHJlZGljdGlvbk91dCA9IG5ldyBBcnJheShkaW1PdXQpO1xuXG5cdGlmKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7IC8vIGZ1bGxcblx0XHRmb3IobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcblx0XHRcdHByZWRpY3Rpb25PdXRbZF0gPSBjLm1lYW5bZGltSW4gKyBkXTtcblx0XHRcdGZvcihsZXQgZSA9IDA7IGUgPCBkaW1JbjsgZSsrKSB7XG5cdFx0XHRcdGxldCB0bXAgPSAwLjA7XG5cdFx0XHRcdGZvcihsZXQgZiA9IDA7IGYgPCBkaW1JbjsgZisrKSB7XG5cdFx0XHRcdFx0dG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0W2UgKiBkaW1JbiArIGZdXG5cdFx0XHRcdFx0XHQqIChvYnNlcnZhdGlvbkluW2ZdIC0gYy5tZWFuW2ZdKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRwcmVkaWN0aW9uT3V0W2RdICs9IGMuY292YXJpYW5jZVsoZCArIGRpbUluKSAqIGRpbSArIGVdICogdG1wO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRlbHNlIHsgLy8gZGlhZ29uYWxcblx0XHRmb3IobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcblx0XHRcdHByZWRpY3Rpb25PdXRbZF0gPSBjLmNvdmFyaWFuY2VbZCArIGRpbUluXTtcblx0XHR9XG5cdH1cblx0Ly9yZXR1cm4gcHJlZGljdGlvbk91dDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2QgPSAob2JzZXJ2YXRpb24sIGdhdXNzaWFuQ29tcG9uZW50KSA9PiB7XG5cdGxldCBjID0gZ2F1c3NpYW5Db21wb25lbnQ7XG5cdC8vIGlmKGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCA9PT0gMCkge1xuXHQvLyBcdHJldHVybiB1bmRlZmluZWQ7XG5cdC8vIH1cblx0bGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuXHRpZiAoYy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcblx0XHRmb3IobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb247IGwrKykge1xuXHRcdFx0bGV0IHRtcCA9IDAuMDtcblx0XHRcdGZvcihsZXQgayA9IDA7IGsgPCBjLmRpbWVuc2lvbjsgaysrKSB7XG5cdFx0XHRcdHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZVtsICogYy5kaW1lbnNpb24gKyBrXVxuXHRcdFx0XHRcdCogKG9ic2VydmF0aW9uW2tdIC0gYy5tZWFuW2tdKTtcblx0XHRcdH1cblx0XHRcdGV1Y2xpZGlhbkRpc3RhbmNlICs9IChvYnNlcnZhdGlvbltsXSAtIGMubWVhbltsXSkgKiB0bXA7XG5cdFx0fVxuXHR9XG5cdGVsc2UgeyAvLyBkaWFnb25hbFxuXHRcdGZvcihsZXQgbCA9IDA7IGwgPCBjLmRpbWVuc2lvbjsgbCsrKSB7XG5cdFx0XHRldWNsaWRpYW5EaXN0YW5jZSArPSBjLmludmVyc2VfY292YXJpYW5jZVtsXVxuXHRcdFx0XHRcdFx0XHQgICogKG9ic2VydmF0aW9uW2xdIC0gYy5tZWFuW2xdKVxuXHRcdFx0XHRcdFx0XHQgICogKG9ic2VydmF0aW9uW2xdIC0gYy5tZWFuW2xdKTtcblx0XHR9XG5cdH1cblxuXHRsZXQgcCA9IE1hdGguZXhwKC0wLjUgKiBldWNsaWRpYW5EaXN0YW5jZSk7XG5cdHAgLz0gTWF0aC5zcXJ0KGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCAqIE1hdGgucG93KDIgKiBNYXRoLlBJLCBjLmRpbWVuc2lvbikpO1xuXG5cdGlmKCBwIDwgMWUtMTgwIHx8IGlzTmFOKHApIHx8IGlzTmFOKE1hdGguYWJzKHApKSkge1xuXHRcdHAgPSAxZS0xODA7XG5cdH1cblx0cmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRMaWtlbGlob29kSW5wdXQgPSAob2JzZXJ2YXRpb25JbiwgZ2F1c3NpYW5Db21wb25lbnQpID0+IHtcblx0bGV0IGMgPSBnYXVzc2lhbkNvbXBvbmVudDtcblx0Ly8gaWYoYy5jb3ZhcmlhbmNlX2RldGVybWluYW50ID09PSAwKSB7XG5cdC8vIFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0Ly8gfVxuXHRsZXQgZXVjbGlkaWFuRGlzdGFuY2UgPSAwLjA7XG5cdGlmKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7IC8vIGZ1bGxcblx0XHRmb3IobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb25faW5wdXQ7IGwrKykge1xuXHRcdFx0bGV0IHRtcCA9IDAuMDtcblx0XHRcdGZvcihsZXQgayA9IDA7IGsgPCBjLmRpbWVuc2lvbl9pbnB1dDsgaysrKSB7XG5cdFx0XHRcdHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtsICogYy5kaW1lbnNpb25faW5wdXQgKyBrXVxuXHRcdFx0XHRcdCogKG9ic2VydmF0aW9uSW5ba10gLSBjLm1lYW5ba10pO1xuXHRcdFx0fVxuXHRcdFx0ZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic2VydmF0aW9uSW5bbF0gLSBjLm1lYW5bbF0pICogdG1wO1xuXHRcdH1cblx0fVxuXHRlbHNlIHsgLy8gZGlhZ29uYWxcblx0XHRmb3IobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb25faW5wdXQ7IGwrKykge1xuXHRcdFx0Ly8gb3Igd291bGQgaXQgYmUgYy5pbnZlcnNlX2NvdmFyaWFuY2VfaW5wdXRbbF0gP1xuXHRcdFx0Ly8gc291bmRzIGxvZ2ljIC4uLiBidXQsIGFjY29yZGluZyB0byBKdWxlcyAoY2YgZS1tYWlsKSwgbm90IHJlYWxseSBpbXBvcnRhbnQuXG5cdFx0XHRldWNsaWRpYW5EaXN0YW5jZSArPSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtsXVxuXHRcdFx0XHRcdFx0XHQgICogKG9ic2VydmF0aW9uSW5bbF0gLSBjLm1lYW5bbF0pXG5cdFx0XHRcdFx0XHRcdCAgKiAob2JzZXJ2YXRpb25JbltsXSAtIGMubWVhbltsXSk7XG5cdFx0fVxuXHR9XG5cblx0bGV0IHAgPSBNYXRoLmV4cCgtMC41ICogZXVjbGlkaWFuRGlzdGFuY2UpO1xuXHRwIC89IE1hdGguc3FydChjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnRfaW5wdXQgKiBNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb25faW5wdXQpKTtcblxuXHRpZihwIDwgMWUtMTgwIHx8aXNOYU4ocCkgfHwgaXNOYU4oTWF0aC5hYnMocCkpKSB7XG5cdFx0cCA9IDFlLTE4MDtcblx0fVxuXHRyZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2RCaW1vZGFsID0gKG9ic2VydmF0aW9uSW4sIG9ic2VydmF0aW9uT3V0LCBnYXVzc2lhbkNvbXBvbmVudCkgPT4ge1xuXHRsZXQgYyA9IGdhdXNzaWFuQ29tcG9uZW50O1xuXHQvLyBpZihjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgPT09IDApIHtcblx0Ly8gXHRyZXR1cm4gdW5kZWZpbmVkO1xuXHQvLyB9XG5cdGxldCBkaW1lbnNpb25fb3V0cHV0ID0gYy5kaW1lbnNpb24gLSBjLmRpbWVuc2lvbl9pbnB1dDtcblx0bGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuXHRpZihjLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkgeyAvLyBmdWxsXG5cdFx0Zm9yKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uOyBsKyspIHtcblx0XHRcdGxldCB0bXAgPSAwLjA7XG5cdFx0XHRmb3IobGV0IGsgPSAwOyBrIDwgYy5kaW1lbnNpb25faW5wdXQ7IGsrKykge1xuXHRcdFx0XHR0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbCAqIGMuZGltZW5zaW9uICsga11cblx0XHRcdFx0XHQqIChvYnNlcnZhdGlvbkluW2tdIC0gYy5tZWFuW2tdKTtcblx0XHRcdH1cblx0XHRcdGZvcihsZXQgayA9ICAwOyBrIDwgZGltZW5zaW9uX291dHB1dDsgaysrKSB7XG5cdFx0XHRcdHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZVtsICogYy5kaW1lbnNpb24gKyBjLmRpbWVuc2lvbl9pbnB1dCArIGtdXG5cdFx0XHRcdFx0KiAob2JzZXJ2YXRpb25PdXRba10gLSBjLm1lYW5bYy5kaW1lbnNpb25faW5wdXQgK2tdKTtcblx0XHRcdH1cblx0XHRcdGlmKGwgPCBjLmRpbWVuc2lvbl9pbnB1dCkge1xuXHRcdFx0XHRldWNsaWRpYW5EaXN0YW5jZSArPSAob2JzZXJ2YXRpb25JbltsXSAtIGMubWVhbltsXSkgKiB0bXA7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0ZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic2VydmF0aW9uT3V0W2wgLSBjLmRpbWVuc2lvbl9pbnB1dF0gLSBjLm1lYW5bbF0pICogdG1wO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRlbHNlIHsgLy8gZGlhZ29uYWxcblx0XHRmb3IobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb25faW5wdXQ7IGwrKykge1xuXHRcdFx0ZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbF1cblx0XHRcdFx0XHRcdFx0ICAqIChvYnNlcnZhdGlvbkluW2xdIC0gYy5tZWFuW2xdKVxuXHRcdFx0XHRcdFx0XHQgICogKG9ic2VydmF0aW9uSW5bbF0gLSBjLm1lYW5bbF0pO1xuXHRcdH1cblx0XHRmb3IobGV0IGwgPSBjLmRpbWVuc2lvbl9pbnB1dDsgbCA8IGMuZGltZW5zaW9uOyBsKyspIHtcblx0XHRcdGxldCBzcSA9IChvYnNlcnZhdGlvbk91dFtsIC0gYy5kaW1lbnNpb25faW5wdXRdIC0gYy5tZWFuW2xdKVxuXHRcdFx0XHQgICAqIChvYnNlcnZhdGlvbk91dFtsIC0gYy5kaW1lbnNpb25faW5wdXRdIC0gYy5tZWFuW2xdKTtcblx0XHRcdGV1Y2xpZGlhbkRpc3RhbmNlICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2xdICogc3E7XG5cdFx0fVxuXHR9XG5cblx0bGV0IHAgPSBNYXRoLmV4cCgtMC41ICogZXVjbGlkaWFuRGlzdGFuY2UpO1xuXHRwIC89IE1hdGguc3FydChjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgKiBNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb24pKTtcblxuXHRpZihwIDwgMWUtMTgwIHx8IGlzTmFOKHApIHx8IGlzTmFOKE1hdGguYWJzKHApKSkge1xuXHRcdHAgPSAxZS0xODA7XG5cdH1cblx0cmV0dXJuIHA7XG59O1xuXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICAgYXMgaW4geG1tR21tU2luZ2xlQ2xhc3MuY3BwICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGdtbVJlZ3Jlc3Npb24gPSAob2JzZXJ2YXRpb25Jbiwgc2luZ2xlQ2xhc3NHbW1Nb2RlbCwgc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHMpID0+IHtcblx0bGV0IG1vZGVsID0gc2luZ2xlQ2xhc3NHbW1Nb2RlbDtcblx0bGV0IHJlcyA9IHNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzO1xuXG5cdGxldCBkaW0gPSBtb2RlbC5jb21wb25lbnRzWzBdLmRpbWVuc2lvbjtcblx0bGV0IGRpbUluID0gbW9kZWwuY29tcG9uZW50c1swXS5kaW1lbnNpb25faW5wdXQ7XG5cdGxldCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuXHRyZXMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuXHRmb3IobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcblx0XHRyZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcblx0fVxuXG5cdGxldCBvdXRDb3ZhclNpemU7XG5cdGlmKG1vZGVsLnBhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7IC8vZnVsbFxuXHRcdG91dENvdmFyU2l6ZSA9IGRpbU91dCAqIGRpbU91dDtcblx0fVxuXHRlbHNlIHsgLy8gPT09IDEgOiBkaWFnb25hbFxuXHRcdG91dENvdmFyU2l6ZSA9IGRpbU91dDtcblx0fVxuXHRyZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcblx0Zm9yKGxldCBpID0gMDsgaSA8IG91dENvdmFyU2l6ZTsgaSsrKSB7XG5cdFx0cmVzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuXHR9XG5cblx0bGV0IHRtcF9vdXRwdXRfdmFsdWVzID0gbmV3IEFycmF5KGRpbU91dCk7XG5cdGZvcihsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuXHRcdHRtcF9vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuXHR9XG5cblx0Zm9yKGxldCBjID0gMDsgYyA8IG1vZGVsLmNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcblx0XHRnbW1Db21wb25lbnRSZWdyZXNzaW9uKG9ic2VydmF0aW9uSW4sIHRtcF9vdXRwdXRfdmFsdWUsIG1vZGVsLmNvbXBvbmVudHNbY10pO1xuXHRcdGxldCBzcWJldGEgPSByZXMuYmV0YVtjXSAqIHJlcy5iZXRhW2NdO1xuXHRcdGZvcihsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuXHRcdFx0cmVzLm91dHB1dF92YWx1ZXNbZF0gKz0gcmVzLmJldGFbY10gKiB0bXBfb3V0cHV0X3ZhbHVlc1tkXTtcblx0XHRcdGlmKG1vZGVsLnBhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7IC8vZnVsbFxuXHRcdFx0XHRmb3IobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyKyspIHtcblx0XHRcdFx0XHRsZXQgaW5kZXggPSBkICogZGltT3V0ICsgZDI7XG5cdFx0XHRcdFx0cmVzLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XSArPSBzcWJldGFcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCAqIG1vZGVsLmNvbXBvbmVudHNbY10ub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHsgLy8gZGlhZ29uYWxcblx0XHRcdFx0cmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdICs9IHNxYmV0YSAqIG1vZGVsLmNvbXBvbmVudHNbY10ub3V0cHV0X2NvdmFyaWFuY2VbZF07XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1PYnNQcm9iID0gKG9ic2VydmF0aW9uSW4sIHNpbmdsZUNsYXNzR21tTW9kZWwsIGNvbXBvbmVudElkID0gLTEpID0+IHtcblx0bGV0IGNvZWZmcyA9IHNpbmdsZUNsYXNzR21tTW9kZWwubWl4dHVyZV9jb2VmZnM7XG5cdC8vY29uc29sZS5sb2coY29lZmZzKTtcblx0Ly9pZihjb2VmZnMgPT09IHVuZGVmaW5lZCkgY29lZmZzID0gWzFdO1xuXHRsZXQgY29tcG9uZW50cyA9IHNpbmdsZUNsYXNzR21tTW9kZWwuY29tcG9uZW50cztcblx0bGV0IHAgPSAwLjA7XG5cdGlmKGNvbXBvbmVudElkIDwgMCkge1xuXHRcdGZvcihsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG5cdFx0XHRwICs9IGdtbU9ic1Byb2Iob2JzZXJ2YXRpb25Jbiwgc2luZ2xlQ2xhc3NHbW1Nb2RlbCwgYyk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHAgPSBjb2VmZnNbY10gKiBnbW1Db21wb25lbnRMaWtlbGlob29kKG9ic2VydmF0aW9uSW4sIGNvbXBvbmVudHNbY10pO1x0XHRcblx0fVxuXHRyZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbU9ic1Byb2JJbnB1dCA9IChvYnNlcnZhdGlvbkluLCBzaW5nbGVDbGFzc0dtbU1vZGVsLCBjb21wb25lbnRJZCA9IC0xKSA9PiB7XG5cdGxldCBjb2VmZnMgPSBzaW5nbGVDbGFzc0dtbU1vZGVsLm1peHR1cmVfY29lZmZzO1xuXHRsZXQgY29tcG9uZW50cyA9IHNpbmdsZUNsYXNzR21tTW9kZWwuY29tcG9uZW50cztcblx0bGV0IHAgPSAwLjA7XG5cdGlmKGNvbXBvbmVudElkIDwgMCkge1xuXHRcdGZvcihsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG5cdFx0XHRwICs9IGdtbU9ic1Byb2JJbnB1dChvYnNlcnZhdGlvbkluLCBzaW5nbGVDbGFzc0dtbU1vZGVsLCBjKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cCA9IGNvZWZmc1tjXSAqIGdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dChvYnNlcnZhdGlvbkluLCBjb21wb25lbnRzW2NdKTtcdFx0XG5cdH1cblx0cmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1PYnNQcm9iQmltb2RhbCA9IChvYnNlcnZhdGlvbkluLCBvYnNlcnZhdGlvbk91dCwgc2luZ2xlQ2xhc3NHbW1Nb2RlbCwgY29tcG9uZW50SWQgPSAtMSkgPT4ge1xuXHRsZXQgY29lZmZzID0gc2luZ2xlQ2xhc3NHbW1Nb2RlbC5taXh0dXJlX2NvZWZmcztcblx0bGV0IGNvbXBvbmVudHMgPSBzaW5nbGVDbGFzc0dtbU1vZGVsLmNvbXBvbmVudHM7XG5cdGxldCBwID0gMC4wO1xuXHRpZihjb21wb25lbnRJZCA8IDApIHtcblx0XHRmb3IobGV0IGMgPSAwOyBjIDwgY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuXHRcdFx0cCArPSBnbW1PYnNQcm9iQmltb2RhbChvYnNlcnZhdGlvbkluLCBvYnNlcnZhdGlvbk91dCwgc2luZ2xlQ2xhc3NHbW1Nb2RlbCwgYyk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHAgPSBjb2VmZnNbY10gKiBnbW1Db21wb25lbnRMaWtlbGlob29kQmltb2RhbChvYnNlcnZhdGlvbkluLCBvYnNlcnZhdGlvbk91dCwgY29tcG9uZW50c1tjXSk7XG5cdH1cblx0cmV0dXJuIHA7XG59O1xuXG5leHBvcnQgY29uc3QgZ21tTGlrZWxpaG9vZCA9IChvYnNlcnZhdGlvbkluLCBzaW5nbGVDbGFzc0dtbU1vZGVsLCBzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cywgb2JzZXJ2YXRpb25PdXQgPSBbXSkgPT4ge1xuXHRsZXQgY29lZmZzID0gc2luZ2xlQ2xhc3NHbW1Nb2RlbC5taXh0dXJlX2NvZWZmcztcblx0bGV0IGNvbXBvbmVudHMgPSBzaW5nbGVDbGFzc0dtbU1vZGVsLmNvbXBvbmVudHM7XG5cdGxldCByZXMgPSBzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cztcblx0bGV0IGxpa2VsaWhvb2QgPSAwLjA7XG5cdGZvcihsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG5cdFx0aWYoc2luZ2xlQ2xhc3NHbW1Nb2RlbC5jb21wb25lbnRzW2NdLmJpbW9kYWwpIHtcblx0XHRcdGlmKG9ic2VydmF0aW9uT3V0Lmxlbmd0aCA9PT0gMCkgeyAvLyBtYXliZSBjaGVjayBpZiBvYnNlcnZhdGlvbk91dCBpcyBhbiBhcnJheSA/XG5cdFx0XHRcdHJlcy5iZXRhW2NdID0gZ21tT2JzUHJvYklucHV0KG9ic2VydmF0aW9uSW4sIHNpbmdsZUNsYXNzR21tTW9kZWwsIGMpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHJlcy5iZXRhW2NdID0gZ21tT2JzUHJvYkJpbW9kYWwob2JzZXJ2YXRpb25Jbiwgb2JzZXJ2YXRpb25PdXQsIHNpbmdsZUNsYXNzR21tTW9kZWwsIGMpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJlcy5iZXRhW2NdID0gZ21tT2JzUHJvYihvYnNlcnZhdGlvbkluLCBzaW5nbGVDbGFzc0dtbU1vZGVsLCBjKTtcblx0XHR9XG5cdFx0bGlrZWxpaG9vZCArPSByZXMuYmV0YVtjXTtcblx0fVxuXHRmb3IobGV0IGMgPSAwOyBjIDwgY29lZmZzLmxlbmd0aDsgYysrKSB7XG5cdFx0cmVzLmJldGFbY10gLz0gbGlrZWxpaG9vZDtcblx0fVxuXG5cdHJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSBsaWtlbGlob29kO1xuXG5cdC8vIGFzIGluIHhtbTo6U2luZ2xlQ2xhc3NHTU06OnVwZGF0ZVJlc3VsdHMgOlxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Ly9yZXMubGlrZWxpaG9vZF9idWZmZXIudW5zaGlmdChsaWtlbGlob29kKTtcblx0Ly9yZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoLS07XG5cdC8vIFRISVMgSVMgQkVUVEVSIChjaXJjdWxhciBidWZmZXIpXG5cdHJlcy5saWtlbGlob29kX2J1ZmZlcltyZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhdID0gbGlrZWxpaG9vZDtcblx0cmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4XG5cdFx0PSAocmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4ICsgMSkgJSByZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuXHQvLyBzdW0gYWxsIGFycmF5IHZhbHVlcyA6XG5cdHJlcy5sb2dfbGlrZWxpaG9vZCA9IHJlcy5saWtlbGlob29kX2J1ZmZlci5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcblx0cmVzLmxvZ19saWtlbGlob29kIC89IHJlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGg7XG5cblx0cmV0dXJuIGxpa2VsaWhvb2Q7XG59O1xuXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICAgICAgICAgYXMgaW4geG1tR21tLmNwcCAgICAgICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGdtbUxpa2VsaWhvb2RzID0gKG9ic2VydmF0aW9uLCBnbW1Nb2RlbCwgZ21tTW9kZWxSZXN1bHRzKSA9PiB7XG5cdGxldCBsaWtlbGlob29kcyA9IFtdO1xuXHRsZXQgbW9kZWxzID0gZ21tTW9kZWwubW9kZWxzO1xuXHRsZXQgcmVzID0gZ21tTW9kZWxSZXN1bHRzO1xuXG5cdGxldCBtYXhMb2dMaWtlbGlob29kID0gMDtcblx0bGV0IG5vcm1Db25zdEluc3RhbnQgPSAwO1xuXHRsZXQgbm9ybUNvbnN0U21vb3RoZWQgPSAwO1xuXG5cdGZvcihsZXQgaSA9IDA7IGkgPCBtb2RlbHMubGVuZ3RoOyBpKyspIHtcblxuXHRcdGxldCBzaW5nbGVSZXMgPSByZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV07XG5cdFx0cmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV0gPSBnbW1MaWtlbGlob29kKG9ic2VydmF0aW9uLCBtb2RlbHNbaV0sIHNpbmdsZVJlcyk7XG5cblx0XHQvLyBhcyBpbiB4bW06OkdNTTo6dXBkYXRlUmVzdWx0cyA6XG5cdFx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdHJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSBzaW5nbGVSZXMubG9nX2xpa2VsaWhvb2Q7XG5cdFx0cmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldID0gTWF0aC5leHAocmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSk7XG5cdFx0cmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IHJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldO1xuXHRcdHJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gcmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldO1xuXG5cdFx0bm9ybUNvbnN0SW5zdGFudCArPSByZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXHRcdG5vcm1Db25zdFNtb290aGVkICs9IHJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXG5cdFx0aWYoaSA9PSAwIHx8IHJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPiBtYXhMb2dMaWtlbGlob29kKSB7XG5cdFx0XHRtYXhMb2dMaWtlbGlob29kID0gcmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXTtcblx0XHRcdHJlcy5saWtlbGllc3QgPSBpO1xuXHRcdH1cblx0fVxuXG5cdGZvcihsZXQgaT0wOyBpPG1vZGVscy5sZW5ndGg7IGkrKykge1xuXG5cdFx0cmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAvPSBub3JtQ29uc3RJbnN0YW50O1xuXHRcdHJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1Db25zdFNtb290aGVkO1xuXHR9XG5cblx0Ly8gaWYgbW9kZWwgaXMgYmltb2RhbCA6XG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRsZXQgcGFyYW1zID0gZ21tTW9kZWwuc2hhcmVkX3BhcmFtZXRlcnM7XG5cdGxldCBjb25maWcgPSBnbW1Nb2RlbC5jb25maWd1cmF0aW9uO1xuXG5cdGlmKHBhcmFtcy5iaW1vZGFsKSB7XG5cdFx0bGV0IGRpbSA9IHBhcmFtcy5kaW1lbnNpb247XG5cdFx0bGV0IGRpbUluID0gcGFyYW1zLmRpbWVuc2lvbl9pbnB1dDtcblx0XHRsZXQgZGltT3V0ID0gZGltIC0gZGltSW47XG5cblx0XHRpZihjb25maWcubXVsdGlDbGFzc19yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMCkgeyAvLyBsaWtlbGllc3Rcblx0XHRcdHJlcy5vdXRwdXRfdmFsdWVzXG5cdFx0XHRcdD0gcmVzLnNpbmdsZUNsYXNzTW9kZWxSZXN1bHRzW3Jlcy5saWtlbGllc3RdLm91dHB1dF92YWx1ZXM7XG5cdFx0XHRyZXMub3V0cHV0X2NvdmFyaWFuY2Vcblx0XHRcdFx0PSByZXMuc2luZ2xlQ2xhc3NNb2RlbFJlc3VsdHNbcmVzLmxpa2VsaWVzdF0ub3V0cHV0X2NvdmFyaWFuY2U7XHRcdFx0XG5cdFx0fVxuXHRcdGVsc2UgeyAvLyBtaXh0dXJlXG5cdFx0XHQvLyB6ZXJvLWZpbGwgb3V0cHV0X3ZhbHVlcyBhbmQgb3V0cHV0X2NvdmFyaWFuY2Vcblx0XHRcdHJlcy5vdXRwdXRfdmFsdWVzID0gbmV3IEFycmF5KGRpbU91dCk7XG5cdFx0XHRmb3IobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcblx0XHRcdFx0cmVzLm91dHB1dF92YWx1ZXNbaV0gPSAwLjA7XG5cdFx0XHR9XG5cbiAgICAgICAgICAgIGxldCBvdXRDb3ZhclNpemU7XG4gICAgICAgICAgICBpZihjb25maWcuZGVmYXVsdF9wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PSAwKSB7IC8vIGZ1bGxcbiAgICAgICAgICAgICAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHsgLy8gZGlhZ29uYWxcbiAgICAgICAgICAgICAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuICAgICAgICAgICAgXHRyZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNvbXB1dGUgdGhlIGFjdHVhbCB2YWx1ZXMgOlxuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgXHRsZXQgc21vb3RoTm9ybUxpa2VsaWhvb2QgPSByZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcbiAgICAgICAgICAgIFx0bGV0IHNpbmdsZVJlcyA9IHJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXTtcbiAgICAgICAgICAgIFx0Zm9yKGxldCBkID0gMDsgZCA8IGRpbU91dDsgaSsrKSB7XG4gICAgICAgICAgICBcdFx0cmVzLm91dHB1dF92YWx1ZXNbZF0gKz0gc21vb3RoTm9ybUxpa2VsaWhvb2QgKiBzaW5nbGVSZXMub3V0cHV0X3ZhbHVlc1tkXTtcbiAgICAgICAgICAgIFx0XHRpZihjb25maWcuZGVmYXVsdF9wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkgeyAvL2Z1bGxcbiAgICAgICAgICAgIFx0XHRcdGZvcihsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIrKykge1xuICAgICAgICAgICAgXHRcdFx0XHRsZXQgaW5kZXggPSBkICogZGltT3V0ICsgZDI7XG4gICAgICAgICAgICBcdFx0XHRcdHJlcy5vdXRwdXRfY292YXJpYW5jZVtpbmRleF0gKz0gc21vb3RoTm9ybUxpa2VsaWhvb2RcbiAgICAgICAgICAgIFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgKiBzaW5nbGVSZXMub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdO1xuICAgICAgICAgICAgXHRcdFx0fVxuICAgICAgICAgICAgXHRcdH1cbiAgICAgICAgICAgIFx0XHRlbHNlIHsgLy8gZGlhZ29uYWxcbiAgICAgICAgICAgIFx0XHRcdHJlcy5vdXRwdXRfY292YXJpYW5jZVtkXSArPSBzbW9vdGhOb3JtTGlrZWxpaG9vZFxuICAgICAgICAgICAgXHRcdFx0XHRcdFx0XHRcdFx0ICogc2luZ2xlUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdO1xuICAgICAgICAgICAgXHRcdH1cbiAgICAgICAgICAgIFx0fVxuICAgICAgICAgICAgfVxuXHRcdH1cblx0fSAvLyBlbmQgaWYgcGFyYW1zLmJpbW9kYWxcbn07XG4iXX0=