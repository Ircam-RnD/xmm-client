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
var gmmComponentRegression = exports.gmmComponentRegression = function gmmComponentRegression(obsIn, predictOut, component) {
	var c = component;
	var dim = c.dimension;
	var dimIn = c.dimension_input;
	var dimOut = dim - dimIn;
	//let predictedOut = [];
	predictOut = new Array(dimOut);

	//--------------------------------------------------------------------- full
	if (c.covariance_mode === 0) {
		for (var d = 0; d < dimOut; d++) {
			predictOut[d] = c.mean[dimIn + d];
			for (var e = 0; e < dimIn; e++) {
				var tmp = 0.0;
				for (var f = 0; f < dimIn; f++) {
					tmp += c.inverse_covariance_input[e * dimIn + f] * (obsIn[f] - c.mean[f]);
				}
				predictOut[d] += c.covariance[(d + dimIn) * dim + e] * tmp;
			}
		}
		//----------------------------------------------------------------- diagonal
	} else {
		for (var _d = 0; _d < dimOut; _d++) {
			predictOut[_d] = c.covariance[_d + dimIn];
		}
	}
	//return predictionOut;
};

var gmmComponentLikelihood = exports.gmmComponentLikelihood = function gmmComponentLikelihood(obsIn, component) {
	var c = component;
	// if(c.covariance_determinant === 0) {
	// 	return undefined;
	// }
	var euclidianDistance = 0.0;

	//--------------------------------------------------------------------- full
	if (c.covariance_mode === 0) {
		for (var l = 0; l < c.dimension; l++) {
			var tmp = 0.0;
			for (var k = 0; k < c.dimension; k++) {
				tmp += c.inverse_covariance[l * c.dimension + k] * (obsIn[k] - c.mean[k]);
			}
			euclidianDistance += (obsIn[l] - c.mean[l]) * tmp;
		}
		//----------------------------------------------------------------- diagonal
	} else {
		for (var _l = 0; _l < c.dimension; _l++) {
			euclidianDistance += c.inverse_covariance[_l] * (obsIn[_l] - c.mean[_l]) * (obsIn[_l] - c.mean[_l]);
		}
	}

	var p = Math.exp(-0.5 * euclidianDistance) / Math.sqrt(c.covariance_determinant * Math.pow(2 * Math.PI, c.dimension));

	if (p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
		p = 1e-180;
	}
	return p;
};

var gmmComponentLikelihoodInput = exports.gmmComponentLikelihoodInput = function gmmComponentLikelihoodInput(obsIn, component) {
	var c = component;
	// if(c.covariance_determinant === 0) {
	// 	return undefined;
	// }
	var euclidianDistance = 0.0;
	//--------------------------------------------------------------------- full
	if (c.covariance_mode === 0) {
		for (var l = 0; l < c.dimension_input; l++) {
			var tmp = 0.0;
			for (var k = 0; k < c.dimension_input; k++) {
				tmp += c.inverse_covariance_input[l * c.dimension_input + k] * (obsIn[k] - c.mean[k]);
			}
			euclidianDistance += (obsIn[l] - c.mean[l]) * tmp;
		}
		//----------------------------------------------------------------- diagonal
	} else {
		for (var _l2 = 0; _l2 < c.dimension_input; _l2++) {
			// or would it be c.inverse_covariance_input[l] ?
			// sounds logic ... but, according to Jules (cf e-mail),
			// not really important.
			euclidianDistance += c.inverse_covariance_input[_l2] * (obsIn[_l2] - c.mean[_l2]) * (obsIn[_l2] - c.mean[_l2]);
		}
	}

	var p = Math.exp(-0.5 * euclidianDistance) / Math.sqrt(c.covariance_determinant_input * Math.pow(2 * Math.PI, c.dimension_input));

	if (p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
		p = 1e-180;
	}
	return p;
};

var gmmComponentLikelihoodBimodal = exports.gmmComponentLikelihoodBimodal = function gmmComponentLikelihoodBimodal(obsIn, obsOut, component) {
	var c = gaussianComponent;
	// if(c.covariance_determinant === 0) {
	// 	return undefined;
	// }
	var dim = c.dimension;
	var dimIn = c.dimension_input;
	var dimOut = dim - dimIn;
	var euclidianDistance = 0.0;

	//--------------------------------------------------------------------- full
	if (c.covariance_mode === 0) {
		for (var l = 0; l < dim; l++) {
			var tmp = 0.0;
			for (var k = 0; k < c.dimension_input; k++) {
				tmp += c.inverse_covariance[l * dim + k] * (obsIn[k] - c.mean[k]);
			}
			for (var _k = 0; _k < dimOut; _k++) {
				tmp += c.inverse_covariance[l * dim + dimIn + _k] * (obsOut[_k] - c.mean[dimIn + _k]);
			}
			if (l < dimIn) {
				euclidianDistance += (obsIn[l] - c.mean[l]) * tmp;
			} else {
				euclidianDistance += (obsOut[l - dimIn] - c.mean[l]) * tmp;
			}
		}
		//----------------------------------------------------------------- diagonal
	} else {
		for (var _l3 = 0; _l3 < dimIn; _l3++) {
			euclidianDistance += c.inverse_covariance[_l3] * (obsIn[_l3] - c.mean[_l3]) * (obsIn[_l3] - c.mean[_l3]);
		}
		for (var _l4 = c.dimension_input; _l4 < c.dimension; _l4++) {
			var sq = (obsOut[_l4 - dimIn] - c.mean[_l4]) * (obsOut[_l4 - dimIn] - c.mean[_l4]);
			euclidianDistance += c.inverse_covariance[_l4] * sq;
		}
	}

	var p = Math.exp(-0.5 * euclidianDistance) / Math.sqrt(c.covariance_determinant * Math.pow(2 * Math.PI, c.dimension));

	if (p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
		p = 1e-180;
	}
	return p;
};

// ================================= //
//    as in xmmGmmSingleClass.cpp    //
// ================================= //

var gmmRegression = exports.gmmRegression = function gmmRegression(obsIn, singleGmm, singleGmmRes) {
	var m = singleGmm;
	var mRes = singleGmmResults;

	var dim = m.components[0].dimension;
	var dimIn = m.components[0].dimension_input;
	var dimOut = dim - dimIn;

	mRes.output_values = new Array(dimOut);
	for (var i = 0; i < dimOut; i++) {
		mRes.output_values[i] = 0.0;
	}

	var outCovarSize = void 0;
	//--------------------------------------------------------------------- full
	if (m.parameters.covariance_mode === 0) {
		outCovarSize = dimOut * dimOut;
		//----------------------------------------------------------------- diagonal
	} else {
		outCovarSize = dimOut;
	}
	mRes.output_covariance = new Array(outCovarSize);
	for (var _i = 0; _i < outCovarSize; _i++) {
		mRes.output_covariance[_i] = 0.0;
	}

	var tmpPredictedOutput = new Array(dimOut);
	for (var _i2 = 0; _i2 < dimOut; _i2++) {
		tmpPredictedOutput[_i2] = 0.0;
	}

	for (var c = 0; c < m.components.length; c++) {
		gmmComponentRegression(obsIn, tmpPredictedOutput, m.components[c]);
		var sqbeta = mRes.beta[c] * mRes.beta[c];
		for (var d = 0; d < dimOut; d++) {
			mRes.output_values[d] += mRes.beta[c] * tmpPredictedOutput[d];
			//------------------------------------------------------------- full
			if (m.parameters.covariance_mode === 0) {
				for (var d2 = 0; d2 < dimOut; d2++) {
					var index = d * dimOut + d2;
					mRes.output_covariance[index] += sqbeta * m.components[c].output_covariance[index];
				}
				//--------------------------------------------------------- diagonal
			} else {
				mRes.output_covariance[d] += sqbeta * m.components[c].output_covariance[d];
			}
		}
	}
};

var gmmObsProb = exports.gmmObsProb = function gmmObsProb(obIn, singleGmm) {
	var component = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

	var coeffs = singleGmm.mixture_coeffs;
	//console.log(coeffs);
	//if(coeffs === undefined) coeffs = [1];
	var components = singleGmm.components;
	var p = 0.0;

	if (component < 0) {
		for (var c = 0; c < components.length; c++) {
			p += gmmObsProb(obsIn, singleGmm, c);
		}
	} else {
		p = coeffs[componenr] * gmmComponentLikelihood(obsIn, components[component]);
	}
	return p;
};

var gmmObsProbInput = exports.gmmObsProbInput = function gmmObsProbInput(obsIn, singleGmm) {
	var component = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

	var coeffs = singleGmm.mixture_coeffs;
	var components = singleGmm.components;
	var p = 0.0;

	if (component < 0) {
		for (var c = 0; c < components.length; c++) {
			p += gmmObsProbInput(obsIn, singleGmm, c);
		}
	} else {
		p = coeffs[component] * gmmComponentLikelihoodInput(obsIn, components[component]);
	}
	return p;
};

var gmmObsProbBimodal = exports.gmmObsProbBimodal = function gmmObsProbBimodal(obsIn, obsOut, singleGmm) {
	var component = arguments.length <= 3 || arguments[3] === undefined ? -1 : arguments[3];

	var coeffs = singleGmm.mixture_coeffs;
	var components = singleGmm.components;
	var p = 0.0;

	if (component < 0) {
		for (var c = 0; c < components.length; c++) {
			p += gmmObsProbBimodal(obsIn, obsOut, singleGmm, c);
		}
	} else {
		p = coeffs[component] * gmmComponentLikelihoodBimodal(obsIn, obsOut, components[component]);
	}
	return p;
};

var gmmLikelihood = exports.gmmLikelihood = function gmmLikelihood(obsIn, singleGmm, singleGmmRes) {
	var obsOut = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

	var coeffs = singleGmm.mixture_coeffs;
	var components = singleGmm.components;
	var mRes = singleGmmRes;
	var likelihood = 0.0;

	for (var c = 0; c < components.length; c++) {
		//-------------------------------------------------------------- bimodal
		if (singleClassGmmModel.components[c].bimodal) {
			if (obsOut.length === 0) {
				mRes.beta[c] = gmmObsProbInput(obsIn, singleGmm, c);
			} else {
				mRes.beta[c] = gmmObsProbBimodal(obsIn, obsOut, singleGmm, c);
			}
			//------------------------------------------------------------- unimodal
		} else {
			mRes.beta[c] = gmmObsProb(obsIn, singleGmm, c);
		}
		likelihood += mRes.beta[c];
	}
	for (var _c = 0; _c < coeffs.length; _c++) {
		mRes.beta[_c] /= likelihood;
	}

	mRes.instant_likelihood = likelihood;

	// as in xmm::SingleClassGMM::updateResults :
	// ------------------------------------------
	//res.likelihood_buffer.unshift(likelihood);
	//res.likelihood_buffer.length--;
	// THIS IS BETTER (circular buffer)
	mRes.likelihood_buffer[mRes.likelihood_buffer_index] = likelihood;
	mRes.likelihood_buffer_index = (mRes.likelihood_buffer_index + 1) % mRes.likelihood_buffer.length;
	// sum all array values :
	mRes.log_likelihood = mRes.likelihood_buffer.reduce(function (a, b) {
		return a + b;
	}, 0);
	mRes.log_likelihood /= mRes.likelihood_buffer.length;

	return likelihood;
};

// ================================= //
//          as in xmmGmm.cpp         //
// ================================= //

var gmmFilter = exports.gmmFilter = function gmmFilter(obsIn, gmm, gmmRes) {
	var likelihoods = [];
	var models = gmm.models;
	var mRes = gmmRes;

	var maxLogLikelihood = 0;
	var normConstInstant = 0;
	var normConstSmoothed = 0;

	for (var i = 0; i < models.length; i++) {
		var singleRes = mRes.singleClassGmmModelResults[i];
		mRes.instant_likelihoods[i] = gmmLikelihood(obsIn, models[i], singleRes);

		// as in xmm::GMM::updateResults :
		// -------------------------------
		mRes.smoothed_log_likelihoods[i] = singleRes.log_likelihood;
		mRes.smoothed_likelihoods[i] = Math.exp(mRes.smoothed_log_likelihoods[i]);
		mRes.instant_normalized_likelihoods[i] = mRes.instant_likelihoods[i];
		mRes.smoothed_normalized_likelihoods[i] = mRes.smoothed_likelihoods[i];

		normConstInstant += mRes.instant_normalized_likelihoods[i];
		normConstSmoothed += mRes.smoothed_normalized_likelihoods[i];

		if (i == 0 || mRes.smoothed_log_likelihoods[i] > maxLogLikelihood) {
			maxLogLikelihood = mRes.smoothed_log_likelihoods[i];
			mRes.likeliest = i;
		}
	}

	for (var _i3 = 0; _i3 < models.length; _i3++) {
		mRes.instant_normalized_likelihoods[_i3] /= normConstInstant;
		mRes.smoothed_normalized_likelihoods[_i3] /= normConstSmoothed;
	}

	// if model is bimodal :
	// ---------------------
	var params = gmm.shared_parameters;
	var config = gmm.configuration;

	if (params.bimodal) {
		var dim = params.dimension;
		var dimIn = params.dimension_input;
		var dimOut = dim - dimIn;

		//------------------------------------------------------------ likeliest
		if (config.multiClass_regression_estimator === 0) {
			mRes.output_values = mRes.singleClassModelResults[mRes.likeliest].output_values;
			mRes.output_covariance = mRes.singleClassModelResults[mRes.likeliest].output_covariance;
			//-------------------------------------------------------------- mixture
		} else {
			// zero-fill output_values and output_covariance
			mRes.output_values = new Array(dimOut);
			for (var _i4 = 0; _i4 < dimOut; _i4++) {
				mRes.output_values[_i4] = 0.0;
			}

			var outCovarSize = void 0;
			//------------------------------------------------------------- full
			if (config.default_parameters.covariance_mode == 0) {
				outCovarSize = dimOut * dimOut;
				//--------------------------------------------------------- diagonal
			} else {
				outCovarSize = dimOut;
			}
			mRes.output_covariance = new Array(outCovarSize);
			for (var _i5 = 0; _i5 < outCovarSize; _i5++) {
				mRes.output_covariance[_i5] = 0.0;
			}

			// compute the actual values :
			for (var _i6 = 0; _i6 < models.length; _i6++) {
				var smoothNormLikelihood = mRes.smoothed_normalized_likelihoods[_i6];
				var _singleRes = mRes.singleClassGmmModelResults[_i6];
				for (var d = 0; d < dimOut; _i6++) {
					mRes.output_values[d] += smoothNormLikelihood * _singleRes.output_values[d];
					//----------------------------------------------------- full
					if (config.default_parameters.covariance_mode === 0) {
						for (var d2 = 0; d2 < dimOut; d2++) {
							var index = d * dimOut + d2;
							mRes.output_covariance[index] += smoothNormLikelihood * _singleRes.output_covariance[index];
						}
						//------------------------------------------------- diagonal
					} else {
						mRes.output_covariance[d] += smoothNormLikelihood * _singleRes.output_covariance[d];
					}
				}
			}
		}
	} /* end if(params.bimodal) */
};
//# sourceMappingURL=data:application/json;base64,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RFA7QUFFQTtBQUNBLFNBQUksT0FBTyxrQkFBUCxDQUEwQixlQUExQixLQUE4QyxDQUFsRCxFQUFxRDtBQUNwRCxXQUFLLElBQUksS0FBSyxDQUFkLEVBQWlCLEtBQUssTUFBdEIsRUFBOEIsSUFBOUIsRUFBb0M7QUFDbkMsV0FBSSxRQUFRLElBQUksTUFBSixHQUFhLEVBQXpCO0FBQ0EsWUFBSyxpQkFBTCxDQUF1QixLQUF2QixLQUNJLHVCQUNBLFdBQVUsaUJBQVYsQ0FBNEIsS0FBNUIsQ0FGSjtBQUdBO0FBQ0Y7QUFDQyxNQVJELE1BUU87QUFDTixXQUFLLGlCQUFMLENBQXVCLENBQXZCLEtBQ0ksdUJBQ0EsV0FBVSxpQkFBVixDQUE0QixDQUE1QixDQUZKO0FBR0E7QUFDRDtBQUNEO0FBQ1Y7QUFDRCxFQXBHK0MsQ0FvRzlDO0FBQ0YsQ0FyR00iLCJmaWxlIjoiZ21tLXV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlx0ZnVuY3Rpb25zIHRyYW5zbGF0ZWQgZnJvbSB0aGUgZGVjb2RpbmcgcGFydCBvZiBYTU1cbiAqL1xuXG4vLyBUT0RPIDogd3JpdGUgbWV0aG9kcyBmb3IgZ2VuZXJhdGluZyBtb2RlbFJlc3VsdHMgb2JqZWN0XG5cbi8vIGdldCB0aGUgaW52ZXJzZV9jb3ZhcmlhbmNlcyBtYXRyaXggb2YgZWFjaCBvZiB0aGUgR01NIGNsYXNzZXNcbi8vIGZvciBlYWNoIGlucHV0IGRhdGEsIGNvbXB1dGUgdGhlIGRpc3RhbmNlIG9mIHRoZSBmcmFtZSB0byBlYWNoIG9mIHRoZSBHTU1zXG4vLyB3aXRoIHRoZSBmb2xsb3dpbmcgZXF1YXRpb25zIDpcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyBhcyBpbiB4bW1HYXVzc2lhbkRpc3RyaWJ1dGlvbi5jcHAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5cbi8vIGZyb20geG1tR2F1c3NpYW5EaXN0cmlidXRpb246OnJlZ3Jlc3Npb25cbmV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRSZWdyZXNzaW9uID0gKG9ic0luLCBwcmVkaWN0T3V0LCBjb21wb25lbnQpID0+IHtcblx0bGV0IGMgPSBjb21wb25lbnQ7XG5cdGxldCBkaW0gPSBjLmRpbWVuc2lvbjtcblx0bGV0IGRpbUluID0gYy5kaW1lbnNpb25faW5wdXQ7XG5cdGxldCBkaW1PdXQgPSBkaW0gLSBkaW1Jbjtcblx0Ly9sZXQgcHJlZGljdGVkT3V0ID0gW107XG5cdHByZWRpY3RPdXQgPSBuZXcgQXJyYXkoZGltT3V0KTtcblxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG5cdGlmIChjLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuXHRcdGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcblx0XHRcdHByZWRpY3RPdXRbZF0gPSBjLm1lYW5bZGltSW4gKyBkXTtcblx0XHRcdGZvciAobGV0IGUgPSAwOyBlIDwgZGltSW47IGUrKykge1xuXHRcdFx0XHRsZXQgdG1wID0gMC4wO1xuXHRcdFx0XHRmb3IgKGxldCBmID0gMDsgZiA8IGRpbUluOyBmKyspIHtcblx0XHRcdFx0XHR0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VfaW5wdXRbZSAqIGRpbUluICsgZl0gKlxuXHRcdFx0XHRcdFx0ICAgKG9ic0luW2ZdIC0gYy5tZWFuW2ZdKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRwcmVkaWN0T3V0W2RdICs9IGMuY292YXJpYW5jZVsoZCArIGRpbUluKSAqIGRpbSArIGVdICogdG1wO1xuXHRcdFx0fVxuXHRcdH1cblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuXHR9IGVsc2Uge1xuXHRcdGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcblx0XHRcdHByZWRpY3RPdXRbZF0gPSBjLmNvdmFyaWFuY2VbZCArIGRpbUluXTtcblx0XHR9XG5cdH1cblx0Ly9yZXR1cm4gcHJlZGljdGlvbk91dDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2QgPSAob2JzSW4sIGNvbXBvbmVudCkgPT4ge1xuXHRsZXQgYyA9IGNvbXBvbmVudDtcblx0Ly8gaWYoYy5jb3ZhcmlhbmNlX2RldGVybWluYW50ID09PSAwKSB7XG5cdC8vIFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0Ly8gfVxuXHRsZXQgZXVjbGlkaWFuRGlzdGFuY2UgPSAwLjA7XG5cblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuXHRpZiAoYy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcblx0XHRmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uOyBsKyspIHtcblx0XHRcdGxldCB0bXAgPSAwLjA7XG5cdFx0XHRmb3IgKGxldCBrID0gMDsgayA8IGMuZGltZW5zaW9uOyBrKyspIHtcblx0XHRcdFx0dG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2wgKiBjLmRpbWVuc2lvbiArIGtdXG5cdFx0XHRcdFx0KiAob2JzSW5ba10gLSBjLm1lYW5ba10pO1xuXHRcdFx0fVxuXHRcdFx0ZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqIHRtcDtcblx0XHR9XG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcblx0fSBlbHNlIHtcblx0XHRmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uOyBsKyspIHtcblx0XHRcdGV1Y2xpZGlhbkRpc3RhbmNlICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2xdICpcblx0XHRcdFx0XHRcdFx0ICBcdCAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICpcblx0XHRcdFx0XHRcdFx0XHQgKG9ic0luW2xdIC0gYy5tZWFuW2xdKTtcblx0XHR9XG5cdH1cblxuXHRsZXQgcCA9IE1hdGguZXhwKC0wLjUgKiBldWNsaWRpYW5EaXN0YW5jZSkgL1xuXHRcdFx0TWF0aC5zcXJ0KFxuXHRcdFx0XHRjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgKlxuXHRcdFx0XHRNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb24pXG5cdFx0XHQpO1xuXG5cdGlmIChwIDwgMWUtMTgwIHx8IGlzTmFOKHApIHx8IGlzTmFOKE1hdGguYWJzKHApKSkge1xuXHRcdHAgPSAxZS0xODA7XG5cdH1cblx0cmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRMaWtlbGlob29kSW5wdXQgPSAob2JzSW4sIGNvbXBvbmVudCkgPT4ge1xuXHRsZXQgYyA9IGNvbXBvbmVudDtcblx0Ly8gaWYoYy5jb3ZhcmlhbmNlX2RldGVybWluYW50ID09PSAwKSB7XG5cdC8vIFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0Ly8gfVxuXHRsZXQgZXVjbGlkaWFuRGlzdGFuY2UgPSAwLjA7XG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcblx0aWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG5cdFx0Zm9yIChsZXQgbCA9IDA7IGwgPCBjLmRpbWVuc2lvbl9pbnB1dDsgbCsrKSB7XG5cdFx0XHRsZXQgdG1wID0gMC4wO1xuXHRcdFx0Zm9yIChsZXQgayA9IDA7IGsgPCBjLmRpbWVuc2lvbl9pbnB1dDsgaysrKSB7XG5cdFx0XHRcdHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtsICogYy5kaW1lbnNpb25faW5wdXQgKyBrXSAqXG5cdFx0XHRcdFx0ICAgKG9ic0luW2tdIC0gYy5tZWFuW2tdKTtcblx0XHRcdH1cblx0XHRcdGV1Y2xpZGlhbkRpc3RhbmNlICs9IChvYnNJbltsXSAtIGMubWVhbltsXSkgKiB0bXA7XG5cdFx0fVxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG5cdH0gZWxzZSB7XG5cdFx0Zm9yIChsZXQgbCA9IDA7IGwgPCBjLmRpbWVuc2lvbl9pbnB1dDsgbCsrKSB7XG5cdFx0XHQvLyBvciB3b3VsZCBpdCBiZSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtsXSA/XG5cdFx0XHQvLyBzb3VuZHMgbG9naWMgLi4uIGJ1dCwgYWNjb3JkaW5nIHRvIEp1bGVzIChjZiBlLW1haWwpLFxuXHRcdFx0Ly8gbm90IHJlYWxseSBpbXBvcnRhbnQuXG5cdFx0XHRldWNsaWRpYW5EaXN0YW5jZSArPSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtsXSAqXG5cdFx0XHRcdFx0XHRcdCAgXHQgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG5cdFx0XHRcdFx0XHRcdCAgXHQgKG9ic0luW2xdIC0gYy5tZWFuW2xdKTtcblx0XHR9XG5cdH1cblxuXHRsZXQgcCA9IE1hdGguZXhwKC0wLjUgKiBldWNsaWRpYW5EaXN0YW5jZSkgL1xuXHRcdFx0TWF0aC5zcXJ0KFxuXHRcdFx0XHRjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnRfaW5wdXQgKlxuXHRcdFx0XHRNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb25faW5wdXQpXG5cdFx0XHQpO1xuXG5cdGlmIChwIDwgMWUtMTgwIHx8aXNOYU4ocCkgfHwgaXNOYU4oTWF0aC5hYnMocCkpKSB7XG5cdFx0cCA9IDFlLTE4MDtcblx0fVxuXHRyZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2RCaW1vZGFsID0gKG9ic0luLCBvYnNPdXQsIGNvbXBvbmVudCkgPT4ge1xuXHRsZXQgYyA9IGdhdXNzaWFuQ29tcG9uZW50O1xuXHQvLyBpZihjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgPT09IDApIHtcblx0Ly8gXHRyZXR1cm4gdW5kZWZpbmVkO1xuXHQvLyB9XG5cdGxldCBkaW0gPSBjLmRpbWVuc2lvbjtcblx0bGV0IGRpbUluID0gYy5kaW1lbnNpb25faW5wdXQ7XG5cdGxldCBkaW1PdXQgPSBkaW0gLSBkaW1Jbjtcblx0bGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuXG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcblx0aWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG5cdFx0Zm9yIChsZXQgbCA9IDA7IGwgPCBkaW07IGwrKykge1xuXHRcdFx0bGV0IHRtcCA9IDAuMDtcblx0XHRcdGZvciAobGV0IGsgPSAwOyBrIDwgYy5kaW1lbnNpb25faW5wdXQ7IGsrKykge1xuXHRcdFx0XHR0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbCAqIGRpbSArIGtdICpcblx0XHRcdFx0XHQgICAob2JzSW5ba10gLSBjLm1lYW5ba10pO1xuXHRcdFx0fVxuXHRcdFx0Zm9yIChsZXQgayA9ICAwOyBrIDwgZGltT3V0OyBrKyspIHtcblx0XHRcdFx0dG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2wgKiBkaW0gKyBkaW1JbiArIGtdICpcblx0XHRcdFx0XHQgICAob2JzT3V0W2tdIC0gYy5tZWFuW2RpbUluICtrXSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAobCA8IGRpbUluKSB7XG5cdFx0XHRcdGV1Y2xpZGlhbkRpc3RhbmNlICs9IChvYnNJbltsXSAtIGMubWVhbltsXSkgKiB0bXA7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRldWNsaWRpYW5EaXN0YW5jZSArPSAob2JzT3V0W2wgLSBkaW1Jbl0gLSBjLm1lYW5bbF0pICpcblx0XHRcdFx0XHRcdFx0XHRcdCB0bXA7XG5cdFx0XHR9XG5cdFx0fVxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG5cdH0gZWxzZSB7XG5cdFx0Zm9yIChsZXQgbCA9IDA7IGwgPCBkaW1JbjsgbCsrKSB7XG5cdFx0XHRldWNsaWRpYW5EaXN0YW5jZSArPSBjLmludmVyc2VfY292YXJpYW5jZVtsXSAqXG5cdFx0XHRcdFx0XHRcdCAgXHQgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG5cdFx0XHRcdFx0XHRcdCAgXHQgKG9ic0luW2xdIC0gYy5tZWFuW2xdKTtcblx0XHR9XG5cdFx0Zm9yIChsZXQgbCA9IGMuZGltZW5zaW9uX2lucHV0OyBsIDwgYy5kaW1lbnNpb247IGwrKykge1xuXHRcdFx0bGV0IHNxID0gKG9ic091dFtsIC0gZGltSW5dIC0gYy5tZWFuW2xdKSAqXG5cdFx0XHRcdCAgIFx0IChvYnNPdXRbbCAtIGRpbUluXSAtIGMubWVhbltsXSk7XG5cdFx0XHRldWNsaWRpYW5EaXN0YW5jZSArPSBjLmludmVyc2VfY292YXJpYW5jZVtsXSAqIHNxO1xuXHRcdH1cblx0fVxuXG5cdGxldCBwID0gTWF0aC5leHAoLTAuNSAqIGV1Y2xpZGlhbkRpc3RhbmNlKSAvXG5cdFx0XHRNYXRoLnNxcnQoXG5cdFx0XHRcdGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCAqXG5cdFx0XHRcdE1hdGgucG93KDIgKiBNYXRoLlBJLCBjLmRpbWVuc2lvbilcblx0XHRcdCk7XG5cblx0aWYgKHAgPCAxZS0xODAgfHwgaXNOYU4ocCkgfHwgaXNOYU4oTWF0aC5hYnMocCkpKSB7XG5cdFx0cCA9IDFlLTE4MDtcblx0fVxuXHRyZXR1cm4gcDtcbn07XG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyAgICBhcyBpbiB4bW1HbW1TaW5nbGVDbGFzcy5jcHAgICAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5leHBvcnQgY29uc3QgZ21tUmVncmVzc2lvbiA9IChvYnNJbiwgc2luZ2xlR21tLCBzaW5nbGVHbW1SZXMpID0+IHtcblx0bGV0IG0gPSBzaW5nbGVHbW07XG5cdGxldCBtUmVzID0gc2luZ2xlR21tUmVzdWx0cztcblxuXHRsZXQgZGltID0gbS5jb21wb25lbnRzWzBdLmRpbWVuc2lvbjtcblx0bGV0IGRpbUluID0gbS5jb21wb25lbnRzWzBdLmRpbWVuc2lvbl9pbnB1dDtcblx0bGV0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG5cdG1SZXMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG5cdFx0bVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuXHR9XG5cblx0bGV0IG91dENvdmFyU2l6ZTtcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuXHRpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuXHRcdG91dENvdmFyU2l6ZSA9IGRpbU91dCAqIGRpbU91dDtcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuXHR9IGVsc2Uge1xuXHRcdG91dENvdmFyU2l6ZSA9IGRpbU91dDtcblx0fVxuXHRtUmVzLm91dHB1dF9jb3ZhcmlhbmNlID0gbmV3IEFycmF5KG91dENvdmFyU2l6ZSk7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgb3V0Q292YXJTaXplOyBpKyspIHtcblx0XHRtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuXHR9XG5cblx0bGV0IHRtcFByZWRpY3RlZE91dHB1dCA9IG5ldyBBcnJheShkaW1PdXQpO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG5cdFx0dG1wUHJlZGljdGVkT3V0cHV0W2ldID0gMC4wO1xuXHR9XG5cblx0Zm9yIChsZXQgYyA9IDA7IGMgPCBtLmNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcblx0XHRnbW1Db21wb25lbnRSZWdyZXNzaW9uKFxuXHRcdFx0b2JzSW4sIHRtcFByZWRpY3RlZE91dHB1dCwgbS5jb21wb25lbnRzW2NdXG5cdFx0KTtcblx0XHRsZXQgc3FiZXRhID0gbVJlcy5iZXRhW2NdICogbVJlcy5iZXRhW2NdO1xuXHRcdGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcblx0XHRcdG1SZXMub3V0cHV0X3ZhbHVlc1tkXSArPSBtUmVzLmJldGFbY10gKiB0bXBQcmVkaWN0ZWRPdXRwdXRbZF07XG5cdFx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuXHRcdFx0aWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcblx0XHRcdFx0Zm9yIChsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIrKykge1xuXHRcdFx0XHRcdGxldCBpbmRleCA9IGQgKiBkaW1PdXQgKyBkMjtcblx0XHRcdFx0XHRtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XVxuXHRcdFx0XHRcdFx0Kz0gc3FiZXRhICogbS5jb21wb25lbnRzW2NdLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XTtcblx0XHRcdFx0fVxuXHRcdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF1cblx0XHRcdFx0XHQrPSBzcWJldGEgKiBtLmNvbXBvbmVudHNbY10ub3V0cHV0X2NvdmFyaWFuY2VbZF07XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1PYnNQcm9iID0gKG9iSW4sIHNpbmdsZUdtbSwgY29tcG9uZW50ID0gLTEpID0+IHtcblx0bGV0IGNvZWZmcyA9IHNpbmdsZUdtbS5taXh0dXJlX2NvZWZmcztcblx0Ly9jb25zb2xlLmxvZyhjb2VmZnMpO1xuXHQvL2lmKGNvZWZmcyA9PT0gdW5kZWZpbmVkKSBjb2VmZnMgPSBbMV07XG5cdGxldCBjb21wb25lbnRzID0gc2luZ2xlR21tLmNvbXBvbmVudHM7XG5cdGxldCBwID0gMC4wO1xuXG5cdGlmIChjb21wb25lbnQgPCAwKSB7XG5cdFx0Zm9yIChsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG5cdFx0XHRwICs9IGdtbU9ic1Byb2Iob2JzSW4sIHNpbmdsZUdtbSwgYyk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHAgPSBjb2VmZnNbY29tcG9uZW5yXSAqXG5cdFx0XHRnbW1Db21wb25lbnRMaWtlbGlob29kKG9ic0luLCBjb21wb25lbnRzW2NvbXBvbmVudF0pO1x0XHRcblx0fVxuXHRyZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbU9ic1Byb2JJbnB1dCA9IChvYnNJbiwgc2luZ2xlR21tLCBjb21wb25lbnQgPSAtMSkgPT4ge1xuXHRsZXQgY29lZmZzID0gc2luZ2xlR21tLm1peHR1cmVfY29lZmZzO1xuXHRsZXQgY29tcG9uZW50cyA9IHNpbmdsZUdtbS5jb21wb25lbnRzO1xuXHRsZXQgcCA9IDAuMDtcblxuXHRpZiAoY29tcG9uZW50IDwgMCkge1xuXHRcdGZvcihsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG5cdFx0XHRwICs9IGdtbU9ic1Byb2JJbnB1dChvYnNJbiwgc2luZ2xlR21tLCBjKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cCA9IGNvZWZmc1tjb21wb25lbnRdICpcblx0XHRcdGdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dChvYnNJbiwgY29tcG9uZW50c1tjb21wb25lbnRdKTtcdFx0XG5cdH1cblx0cmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1PYnNQcm9iQmltb2RhbCA9IChvYnNJbiwgb2JzT3V0LCBzaW5nbGVHbW0sIGNvbXBvbmVudCA9IC0xKSA9PiB7XG5cdGxldCBjb2VmZnMgPSBzaW5nbGVHbW0ubWl4dHVyZV9jb2VmZnM7XG5cdGxldCBjb21wb25lbnRzID0gc2luZ2xlR21tLmNvbXBvbmVudHM7XG5cdGxldCBwID0gMC4wO1xuXG5cdGlmIChjb21wb25lbnQgPCAwKSB7XG5cdFx0Zm9yIChsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG5cdFx0XHRwICs9IGdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLCBvYnNPdXQsIHNpbmdsZUdtbSwgYyk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHAgPSBjb2VmZnNbY29tcG9uZW50XSAqXG5cdFx0XHRnbW1Db21wb25lbnRMaWtlbGlob29kQmltb2RhbChvYnNJbiwgb2JzT3V0LCBjb21wb25lbnRzW2NvbXBvbmVudF0pO1xuXHR9XG5cdHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tTGlrZWxpaG9vZCA9IChvYnNJbiwgc2luZ2xlR21tLCBzaW5nbGVHbW1SZXMsIG9ic091dCA9IFtdKSA9PiB7XG5cdGxldCBjb2VmZnMgPSBzaW5nbGVHbW0ubWl4dHVyZV9jb2VmZnM7XG5cdGxldCBjb21wb25lbnRzID0gc2luZ2xlR21tLmNvbXBvbmVudHM7XG5cdGxldCBtUmVzID0gc2luZ2xlR21tUmVzO1xuXHRsZXQgbGlrZWxpaG9vZCA9IDAuMDtcblx0XG5cdGZvciAobGV0IGMgPSAwOyBjIDwgY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuXHRcdGlmIChzaW5nbGVDbGFzc0dtbU1vZGVsLmNvbXBvbmVudHNbY10uYmltb2RhbCkge1xuXHRcdFx0aWYgKG9ic091dC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0bVJlcy5iZXRhW2NdXG5cdFx0XHRcdFx0PSBnbW1PYnNQcm9iSW5wdXQob2JzSW4sIHNpbmdsZUdtbSwgYyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRtUmVzLmJldGFbY11cblx0XHRcdFx0XHQ9IGdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLCBvYnNPdXQsIHNpbmdsZUdtbSwgYyk7XG5cdFx0XHR9XG5cdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG5cdFx0fSBlbHNlIHtcblx0XHRcdG1SZXMuYmV0YVtjXSA9IGdtbU9ic1Byb2Iob2JzSW4sIHNpbmdsZUdtbSwgYyk7XG5cdFx0fVxuXHRcdGxpa2VsaWhvb2QgKz0gbVJlcy5iZXRhW2NdO1xuXHR9XG5cdGZvciAobGV0IGMgPSAwOyBjIDwgY29lZmZzLmxlbmd0aDsgYysrKSB7XG5cdFx0bVJlcy5iZXRhW2NdIC89IGxpa2VsaWhvb2Q7XG5cdH1cblxuXHRtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCA9IGxpa2VsaWhvb2Q7XG5cblx0Ly8gYXMgaW4geG1tOjpTaW5nbGVDbGFzc0dNTTo6dXBkYXRlUmVzdWx0cyA6XG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQvL3Jlcy5saWtlbGlob29kX2J1ZmZlci51bnNoaWZ0KGxpa2VsaWhvb2QpO1xuXHQvL3Jlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGgtLTtcblx0Ly8gVEhJUyBJUyBCRVRURVIgKGNpcmN1bGFyIGJ1ZmZlcilcblx0bVJlcy5saWtlbGlob29kX2J1ZmZlclttUmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4XSA9IGxpa2VsaWhvb2Q7XG5cdG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhcblx0XHQ9IChtUmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4ICsgMSkgJSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDtcblx0Ly8gc3VtIGFsbCBhcnJheSB2YWx1ZXMgOlxuXHRtUmVzLmxvZ19saWtlbGlob29kID0gbVJlcy5saWtlbGlob29kX2J1ZmZlci5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcblx0bVJlcy5sb2dfbGlrZWxpaG9vZCAvPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDtcblxuXHRyZXR1cm4gbGlrZWxpaG9vZDtcbn07XG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyAgICAgICAgICBhcyBpbiB4bW1HbW0uY3BwICAgICAgICAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5leHBvcnQgY29uc3QgZ21tRmlsdGVyID0gKG9ic0luLCBnbW0sIGdtbVJlcykgPT4ge1xuXHRsZXQgbGlrZWxpaG9vZHMgPSBbXTtcblx0bGV0IG1vZGVscyA9IGdtbS5tb2RlbHM7XG5cdGxldCBtUmVzID0gZ21tUmVzO1xuXG5cdGxldCBtYXhMb2dMaWtlbGlob29kID0gMDtcblx0bGV0IG5vcm1Db25zdEluc3RhbnQgPSAwO1xuXHRsZXQgbm9ybUNvbnN0U21vb3RoZWQgPSAwO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgbW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV0IHNpbmdsZVJlcyA9IG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV07XG5cdFx0bVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldXG5cdFx0XHQ9IGdtbUxpa2VsaWhvb2Qob2JzSW4sIG1vZGVsc1tpXSwgc2luZ2xlUmVzKTtcblxuXHRcdC8vIGFzIGluIHhtbTo6R01NOjp1cGRhdGVSZXN1bHRzIDpcblx0XHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0bVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSBzaW5nbGVSZXMubG9nX2xpa2VsaWhvb2Q7XG5cdFx0bVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXVxuXHRcdFx0PSBNYXRoLmV4cChtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSk7XG5cdFx0bVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV07XG5cdFx0bVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gbVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXTtcblxuXHRcdG5vcm1Db25zdEluc3RhbnQgKz0gbVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG5cdFx0bm9ybUNvbnN0U21vb3RoZWQgKz0gbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXG5cdFx0aWYgKGkgPT0gMCB8fCBtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA+IG1heExvZ0xpa2VsaWhvb2QpIHtcblx0XHRcdG1heExvZ0xpa2VsaWhvb2QgPSBtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXTtcblx0XHRcdG1SZXMubGlrZWxpZXN0ID0gaTtcblx0XHR9XG5cdH1cblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IG1vZGVscy5sZW5ndGg7IGkrKykge1xuXHRcdG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1Db25zdEluc3RhbnQ7XG5cdFx0bVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1Db25zdFNtb290aGVkO1xuXHR9XG5cblx0Ly8gaWYgbW9kZWwgaXMgYmltb2RhbCA6XG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRsZXQgcGFyYW1zID0gZ21tLnNoYXJlZF9wYXJhbWV0ZXJzO1xuXHRsZXQgY29uZmlnID0gZ21tLmNvbmZpZ3VyYXRpb247XG5cblx0aWYgKHBhcmFtcy5iaW1vZGFsKSB7XG5cdFx0bGV0IGRpbSA9IHBhcmFtcy5kaW1lbnNpb247XG5cdFx0bGV0IGRpbUluID0gcGFyYW1zLmRpbWVuc2lvbl9pbnB1dDtcblx0XHRsZXQgZGltT3V0ID0gZGltIC0gZGltSW47XG5cblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsaWtlbGllc3Rcblx0XHRpZiAoY29uZmlnLm11bHRpQ2xhc3NfcmVncmVzc2lvbl9lc3RpbWF0b3IgPT09IDApIHtcblx0XHRcdG1SZXMub3V0cHV0X3ZhbHVlc1xuXHRcdFx0XHQ9IG1SZXMuc2luZ2xlQ2xhc3NNb2RlbFJlc3VsdHNbbVJlcy5saWtlbGllc3RdXG5cdFx0XHRcdFx0ICAub3V0cHV0X3ZhbHVlcztcblx0XHRcdG1SZXMub3V0cHV0X2NvdmFyaWFuY2Vcblx0XHRcdFx0PSBtUmVzLnNpbmdsZUNsYXNzTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0XVxuXHRcdFx0XHRcdCAgLm91dHB1dF9jb3ZhcmlhbmNlO1x0XHRcdFxuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbWl4dHVyZVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyB6ZXJvLWZpbGwgb3V0cHV0X3ZhbHVlcyBhbmQgb3V0cHV0X2NvdmFyaWFuY2Vcblx0XHRcdG1SZXMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuXHRcdFx0XHRtUmVzLm91dHB1dF92YWx1ZXNbaV0gPSAwLjA7XG5cdFx0XHR9XG5cbiAgICAgICAgICAgIGxldCBvdXRDb3ZhclNpemU7XG4gICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICAgICAgaWYgKGNvbmZpZy5kZWZhdWx0X3BhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09IDApIHtcbiAgICAgICAgICAgICAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlID0gbmV3IEFycmF5KG91dENvdmFyU2l6ZSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG91dENvdmFyU2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICBcdG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNvbXB1dGUgdGhlIGFjdHVhbCB2YWx1ZXMgOlxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIFx0bGV0IHNtb290aE5vcm1MaWtlbGlob29kXG4gICAgICAgICAgICBcdFx0PSBtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG4gICAgICAgICAgICBcdGxldCBzaW5nbGVSZXMgPSBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldO1xuICAgICAgICAgICAgXHRmb3IgKGxldCBkID0gMDsgZCA8IGRpbU91dDsgaSsrKSB7XG4gICAgICAgICAgICBcdFx0bVJlcy5vdXRwdXRfdmFsdWVzW2RdICs9IHNtb290aE5vcm1MaWtlbGlob29kICpcbiAgICAgICAgICAgIFx0XHRcdFx0XHRcdFx0XHQgc2luZ2xlUmVzLm91dHB1dF92YWx1ZXNbZF07XG4gICAgICAgIFx0XHQgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgICBcdFx0aWYgKGNvbmZpZy5kZWZhdWx0X3BhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgICAgICBcdFx0XHRmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG4gICAgICAgICAgICBcdFx0XHRcdGxldCBpbmRleCA9IGQgKiBkaW1PdXQgKyBkMjtcbiAgICAgICAgICAgIFx0XHRcdFx0bVJlcy5vdXRwdXRfY292YXJpYW5jZVtpbmRleF1cbiAgICAgICAgICAgIFx0XHRcdFx0XHQrPSBzbW9vdGhOb3JtTGlrZWxpaG9vZCAqXG4gICAgICAgICAgICBcdFx0XHRcdFx0ICAgc2luZ2xlUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XTtcbiAgICAgICAgICAgIFx0XHRcdH1cbiAgICAgICAgXHRcdCAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgICAgIFx0XHR9IGVsc2Uge1xuICAgICAgICAgICAgXHRcdFx0bVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICAgXHRcdFx0XHQrPSBzbW9vdGhOb3JtTGlrZWxpaG9vZCAqXG4gICAgICAgICAgICBcdFx0XHRcdCAgIHNpbmdsZVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXTtcbiAgICAgICAgICAgIFx0XHR9XG4gICAgICAgICAgICBcdH1cbiAgICAgICAgICAgIH1cblx0XHR9XG5cdH0gLyogZW5kIGlmKHBhcmFtcy5iaW1vZGFsKSAqL1xufTtcbiJdfQ==