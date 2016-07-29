'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.updateResults = exports.forwardUpdate = exports.forwardInit = exports.likelihoodAlpha = exports.hmmUpdateResults = exports.hmmUpdateAlphaWindow = exports.hmmForwardUpdate = exports.hmmForwardInit = exports.hmmRegression = undefined;

var _gmmUtils = require('./gmm-utils');

var gmmUtils = _interopRequireWildcard(_gmmUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 *	functions translated from the decoding part of XMM
 */

// ================================= //
//    as in xmmHmmSingleClass.cpp    //
// ================================= //

var hmmRegression = exports.hmmRegression = function hmmRegression(observationIn, singleClassHmmModel, singleClassHmmModelResults) {
	var m = singleClassHmmModel;
	var mRes = singleClassHmmModelResults;
	var dim = m.states[0].components[0].dimension;
	var dimIn = m.states[0].components[0].dimension_input;
	var dimOut = dim - dimIn;

	var outCovarSize = void 0;
	if (m.states[0].components[0].covariance_mode === 0) {
		// full
		outCovarSize = dimOut * dimOut;
	} else {
		// diagonal
		outCovarSize = dimOut;
	}

	mRes.output_values = new Array(dimOut);
	for (var i = 0; i < dimOut; i++) {
		mRes.output_values[i] = 0.0;
	}
	mRes.output_covariance = new Array(outCovarSize);
	for (var _i = 0; _i < outCovarSize; _i++) {
		mRes.output_covariance[_i] = 0.0;
	}

	if (m.parameters.regression_estimator === 2) {
		// likeliest
		gmmUtils.gmmLikelihood(observationIn, m.states[mRes.likeliest_state], mRes.singleClassGmmModelResults[mRes.likeliest_state]);
		gmmUtils.gmmRegression(observationIn, m.states[mRes.likeliest_state], mRes.singleClassGmmModelResults[mRes.likeliest_state]);
		mRes.output_values = m.states[mRes.likeliest_state].output_values.slice(0);
		return;
	}

	var clipMinState = m.parameters.regression_estimator == 0 ? // full
	0 : mRes.window_minindex;
	var clipMaxState = m.parameters.regression_estimator == 0 ? // full
	m.states.length : mRes.window_maxindex;
	var normConstant = m.parameters.regression_estimator == 0 ? // full
	1.0 : mRes.window_normalization_constant;

	if (normConstant <= 0.0) {
		normConstant = 1.;
	}

	for (var _i2 = clipMinState; _i2 < clipMaxState; _i2++) {
		gmmUtils.gmmLikelihood(observationIn, m.states[_i2], mRes.singleClassGmmModelResults[_i2]);
		gmmUtils.gmmRegression(observationIn, m.states[_i2], mRes.singleClassGmmModelResults[_i2]);
		var tmpPredictedOutput = mRes.singleClassGmmModelResults[_i2].output_values.slice(0);

		for (var d = 0; d < dimOut; d++) {
			if (mRes.hierarchical) {
				// hierarchical
				mRes.output_values[d] += (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * tmpPredictedOutput[d] / normConstant;
				if (m.parameters.covariance_mode === 0) {
					// full
					for (var d2 = 0; d2 < dimOut; d2++) {
						mRes.output_covariance[d * dimOut + d2] += (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * mRes.singleClassGmmModelResults[_i2].output_covariance[d * dimOut + d2] / normConstant;
					}
				} else {
					// diagonal
					mRes.output_covariance[d] += (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * mRes.singleClassGmmModelResults[_i2].output_covariance[d] / normConstant;
				}
			} else {
				// non-hierarchical
				mRes.output_values[d] += mRes.alpha[_i2] * tmpPredictedOutput[d] / normConstant;
				if (m.parameters.covariance_mode === 0) {
					// full
					for (var _d = 0; _d < dimOut; _d++) {
						mRes.output_covariance[d * dimOut + _d] += mRes.alpha[_i2] * mRes.alpha[_i2] * mRes.singleClassGmmModelResults[_i2].output_covariance[d * dimOut + _d] / normConstant;
					}
				} else {
					// diagonal
					mRes.output_covariance[d] += mRes.alpha[_i2] * mRes.alpha[_i2] * mRes.singleClassGmmModelResults.output_covariance[d] / normConstant;
				}
			}
		}
	}
};

var hmmForwardInit = exports.hmmForwardInit = function hmmForwardInit(onservationIn, singleClassHmmModel, singleClassHmmModelResults) {
	var observationOut = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

	var m = singleClassHmmModel;
	var mRes = singleClassHmmModelResults;
	var nstates = m.parameters.states;
	var normConst = 0.0;

	if (m.parameters.transition_mode === 0) {
		// ergodic
		for (var i = 0; i < nstates; i++) {
			if (m.states[i].components[0].bimodal) {
				// bimodal
				if (observationOut.length > 0) {
					mRes.alpha[i] = m.prior[i] * gmmUtils.gmmObsProbBimodal(observationIn, observationOut, m.states[i]);
				} else {
					mRes.alpha[i] = m.prior[i] * gmmUtils.gmmObsProbInput(observationIn, m.states[i]);
				}
			} else {
				// not bimodal
				mRes.alpha[i] = m.prior[i] * gmmUtils.gmmObsProb(observationIn, m.states[i]);
			}
			normConst += mRes.alpha[i];
		}
	} else {
		// left-right
		for (var _i3 = 0; _i3 < mRes.alpha.length; _i3++) {
			mRes.alpha[_i3] = 0.0;
		}
		if (m.states[0].components[0].bimodal) {
			//bimodal
			if (observationOut.length > 0) {
				mRes.alpha[0] = gmmUtils.gmmObsProbBimodal(observationIn, observationOut, m.states[0]);
			} else {
				mRes.alpha[0] = gmmUtils.gmmObsProbInput(observationIn, m.states[0]);
			}
		} else {
			mRes.alpha[0] = gmmUtils.gmmObsProb(observationIn, m.states[0]);
		}
		normConst += mRes.alpha[0];
	}

	if (normConst > 0) {
		for (var _i4 = 0; _i4 < nstates; _i4++) {
			mRes.alpha[_i4] /= normConst;
		}
		return 1.0 / normConst;
	} else {
		for (var _i5 = 0; _i5 < nstates; _i5++) {
			mRes.alpha[_i5] = 1.0 / nstates;
		}
		return 1.0;
	}
};

var hmmForwardUpdate = exports.hmmForwardUpdate = function hmmForwardUpdate(observationIn, singleClassHmmModel, singleClassHmmModelResults) {
	var observationOut = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

	var m = singleClassHmmModel;
	var mRes = singleClassHmmModelResults;
	var nstates = m.parameters.states;
	var normConst = 0.0;

	mRes.previous_alpha = mRes.alpha.slice(0);
	for (var i = 0; i < nstates; i++) {
		mRes.alpha[i] = 0;
		if (m.parameters.transition_mode === 0) {
			// ergodic
			for (var j = 0; j < nstates; j++) {
				mRes.alpha[i] += mRes.previous_alpha[j] * mRes.transition[j * nstates + i];
			}
		} else {
			// left-right
			mRes.alpha[i] += mRes.previous_alpha[i] * mRes.transition[i * 2];
			if (i > 0) {
				mRes.alpha[i] += mRes.previous_alpha[i - 1] * mRes.transition[(i - 1) * 2 + 1];
			} else {
				mRes.alpha[0] += mRes.previous_alpha[nstates - 1] * mRes.transition[nstates * 2 - 1];
			}
		}

		if (m.states[i].components[0].bimodal) {
			if (observationOut.length > 0) {
				mRes.alpha[i] *= gmmUtils.gmmObsProbBimodal(observationIn, observationOut, m.states[i]);
			} else {
				mRes.alpha[i] *= gmmUtils.gmmObsProbInput(observationIn, m.states[i]);
			}
		} else {
			mRes.alpha[i] *= gmmUtils.gmmObsProb(observationIn, m.states[i]);
		}
		normConst += mRes.alpha[i];
	}

	if (normConst > 1e-300) {
		for (var _i6 = 0; _i6 < nstates; _i6++) {
			mRes.alpha[_i6] /= normConst;
		}
		return 1.0 / normConst;
	} else {
		return 0.0;
	}
};

var hmmUpdateAlphaWindow = exports.hmmUpdateAlphaWindow = function hmmUpdateAlphaWindow(singleClassHmmModel, singleClassHmmModelResults) {
	var m = singleClassHmmModel;
	var res = singleClassHmmModelResults;

	var nstates = m.parameters.states;

	res.likeliest_state = 0;
	var best_alpha = void 0;
	if (m.parameters.hierarchical) {
		best_alpha = res.alpha_h[0][0] + res.alpha_h[1][0];
	} else {
		best_alpha = res.alpha[0];
	}

	for (var i = 1; i < nstates; i++) {
		if (m.parameters.hierarchical) {
			if (res.alpha_h[0][i] + res.alpha_h[1][i] > best_alpha) {
				best_alpha = res.alpha_h[0][i] + res.alpha_h[1][i];
				res.likeliest_state = i;
			}
		} else {
			if (res.alpha[i] > best_alpha) {
				best_alpha = res.alpha[0];
				res.likeliest_state = i;
			}
		}
	}

	res.window_minindex = res.likeliest_state - nstates / 2;
	res.window_maxindex = res.likeliest_state + nstates / 2;
	res.window_minindex = res.window_minindex >= 0 ? res.window_minindex : 0;
	res.window_maxindex = res.window_maxindex <= nstates ? res.window_maxindex : nstates;
	res.window_normalization_constant = 0;
	for (var _i7 = res.window_minindex; _i7 < res.window_maxindex; _i7++) {
		res.window_normalization_constant += res.alpha_h[0][_i7] + res.alpha_h[1][_i7];
	}
};

var hmmUpdateResults = exports.hmmUpdateResults = function hmmUpdateResults(singleClassHmmModel, singleClassHmmModelResults) {
	var m = singleClassHmmModel;
	var res = singleClassHmmModelResults;

	// IS THIS CORRECT  ? TODO : CHECK AGAIN (seems to have precision issues)
	// NORMALLY LIKELIHOOD_BUFFER IS CIRCULAR : IS IT THE CASE HERE ?
	// SHOULD I "POP_FRONT" ? (seems that yes)

	//res.likelihood_buffer.push(Math.log(res.instant_likelihood));

	// NOW THIS IS BETTER (SHOULDWORK AS INTENDED)
	res.likelihood_buffer[res.likelihood_buffer_index] = Math.log(res.instant_likelihood);
	res.likelihood_buffer_index = (res.likelihood_buffer_index + 1) % res.likelihood_buffer.length;

	res.log_likelihood = 0;
	var bufSize = res.likelihood_buffer.length;
	for (var i = 0; i < bufSize; i++) {
		res.log_likelihood += res.likelihood_buffer[i];
	}
	res.log_likelihood /= bufSize;

	res.progress = 0;
	for (var _i8 = res.window_minindex; _i8 < res.window_maxindex; _i8++) {
		if (m.parameters.hierarchical) {
			// hierarchical
			res.progress += (res.alpha_h[0][_i8] + res.alpha_h[1][_i8] + res.alpha_h[2][_i8]) * _i8 / res.window_normalization_constant;
		} else {
			// non hierarchical
			res.progress += res.alpha[_i8] * _i8 / res.window_normalization_constant;
		}
	}
	res.progress /= m.parameters.states - 1;
};

// ================================= //
//   as in xmmHierarchicalHmm.cpp    //
// ================================= //

var likelihoodAlpha = exports.likelihoodAlpha = function likelihoodAlpha(exitNum, likelihoodVector, hhmmModel, hhmmModelResults) {
	var m = hhmmModel;
	var res = hhmmModelResults;

	if (exitNum < 0) {
		//let l = 0;
		for (var i = 0; i < m.models.length; i++) {
			likelihoodVector[i] = 0;
			for (var exit = 0; exit < 3; exit++) {
				for (var _k = 0; _k < m.models[i].parameters.states; _k++) {
					likelihoodVector[i] += res.singleClassHmmModelResults[i].alpha_h[exit][_k];
				}
			}
		}
	} else {
		for (var _i9 = 0; _i9 < m.models.length; _i9++) {
			likelihoodVector[_i9] = 0;
			for (var _k2 = 0; _k2 < m.models[_i9].parameters.states; _k2++) {
				likelihoodVector[_i9] += res.singleClassHmmModelResults[_i9].alpha_h[exitNum][_k2];
			}
		}
	}
};

var forwardInit = exports.forwardInit = function forwardInit(observation, hhmmModel, hhmmModelResults) {
	var norm_const = 0;

	//================= INITIALIZE ALPHA VARIABLES =================//

	for (var i = 0; i < hhmmModel.models.length; i++) {

		var m = hhmmModel.models[i];
		var nstates = m.parameters.states;
		var mRes = hhmmModelResults.singleClassHmmModelResults[i];

		for (var j = 0; j < 3; j++) {
			mRes.alpha_h[j] = new Array(nstates);
			for (var _k3 = 0; _k3 < nstates; _k3++) {
				mRes.alpha_h[j][_k3] = 0;
			}
		}

		if (m.parameters.transition_mode == 0) {
			// ergodic
			for (var _k4 = 0; _k4 < nstates; _k4++) {
				if (hhmmModel.shared_parameters.bimodal) {
					// bimodal
					mRes.alpha_h[0][_k4] = m.prior[_k4] * gmmUtils.gmmObsProbInput(observation, m.states[_k4]);
				} else {
					// not bimodal
					// see how obsProb is implemented
					mRes.alpha_h[0][_k4] = m.prior[_k4] * gmmUtils.gmmObsProb(observation, m.states[_k4]);
				}
				mRes.instant_likelihood += mRes.alpha[0][_k4];
			}
		} else {
			// left-right
			mRes.alpha_h[0][0] = hhmmModel.prior[i];
			if (hhmmModel.shared_parameters.bimodal) {
				// bimodal
				mRes.alpha_h[0][0] *= gmmUtils.gmmObsProbInput(observation, m.states[k]);
			} else {
				// not bimodal
				mRes.alpha_h[0][0] *= gmmUtils.gmmObsProb(observation, m.states[k]);
			}
			mRes.instant_likelihood = mRes.alpha_h[0][0];
		}
		norm_const += mRes.instant_likelihood;
	}

	//================== NORMALIZE ALPHA VARIABLES =================//

	for (var _i10 = 0; _i10 < hhmmModel.models.length; _i10++) {

		var _nstates = hhmmModel.models[_i10].parameters.states;
		for (var e = 0; e < 3; e++) {
			for (var _k5 = 0; _k5 < _nstates; _k5++) {
				hhmmModelResults.singleClassHmmModelResults[_i10].alpha_h[e][_k5] /= norm_const;
			}
		}
	}

	hhmmModelResults.forward_initialized = true;
};

//==================================================================//
//======================== FORWARD UPDATE ==========================//
//==================================================================//

var forwardUpdate = exports.forwardUpdate = function forwardUpdate(observation, hhmmModel, hhmmModelResults) {
	var norm_const = 0;
	var tmp = 0;
	var front = void 0; // array

	var nmodels = hhmmModel.models.length;

	likelihoodAlpha(1, hhmmModelResults.frontier_v1, hhmmModel, hhmmModelResults);
	likelihoodAlpha(2, hhmmModelResults.frontier_v2, hhmmModel, hhmmModelResults);

	// let num_classes = 
	// let dstModelIndex = 0;

	for (var i = 0; i < nmodels; i++) {

		var m = hhmmModel.models[i];
		var nstates = m.parameters.states;
		var mRes = hhmmModelResults.singleClassHmmModelResults[i];

		//============= COMPUTE FRONTIER VARIABLE ============//

		front = new Array(nstates);
		for (var j = 0; j < nstates; j++) {
			front[j] = 0;
		}

		if (m.parameters.transition_mode == 0) {
			// ergodic
			for (var _k6 = 0; _k6 < nstates; _k6++) {
				for (var _j = 0; _j < nstates; _j++) {
					front[_k6] += m.transition[_j * nstates + _k6] / (1 - m.exitProbabilities[_j]) * mRes.alpha_h[0][_j];
				}
				for (var srci = 0; srci < nmodels; srci++) {
					front[_k6] += m.prior[_k6] * (hhmmModelResults.frontier_v1[srci] * hhmmModel.transition[srci][i] + hhmmModelResults.frontier_v2[srci] * hhmmModel.prior[i]);
				}
			}
		} else {
			// left-right

			// k == 0 : first state of the primitive
			front[0] = m.transition[0] * mRes.alpha_h[0][0];

			for (var _srci = 0; _srci < hhmmModel.models.length; _srci++) {
				front[0] += hhmmModelResults.frontier_v1[_srci] * hhmmModel.transition[_srci][i] + hhmmModelResults.frontier_v2[_srci] * hhmmModel.prior[i];
			}

			// k > 0 : rest of the primitive
			for (var _k7 = 1; _k7 < nstates; _k7++) {
				front[_k7] += m.transition[_k7 * 2] / (1 - m.exitProbabilities[_k7]) * mRes.alpha_h[0][_k7];
				front[_k7] += m.transition[(_k7 - 1) * 2 + 1] / (1 - m.exitProbabilities[_k7 - 1]) * mRes.alpha_h[0][_k7 - 1];
			}

			for (var _j2 = 0; _j2 < 3; _j2++) {
				for (var _k8 = 0; _k8 < nstates; _k8++) {
					mRes.alpha_h[_j2][_k8] = 0;
				}
			}
		}

		//console.log(front);

		//============== UPDATE FORWARD VARIABLE =============//

		mRes.exit_likelihood = 0;
		mRes.instant_likelihood = 0;

		for (var _k9 = 0; _k9 < nstates; _k9++) {
			if (hhmmModel.shared_parameters.bimodal) {
				tmp = gmmUtils.gmmObsProbInput(observation, m.states[_k9]) * front[_k9];
			} else {
				tmp = gmmUtils.gmmObsProb(observation, m.states[_k9]) * front[_k9];
			}

			mRes.alpha_h[2][_k9] = hhmmModel.exit_transition[i] * m.exitProbabilities[_k9] * tmp;
			mRes.alpha_h[1][_k9] = (1 - hhmmModel.exit_transition[i]) * m.exitProbabilities[_k9] * tmp;
			mRes.alpha_h[0][_k9] = (1 - m.exitProbabilities[_k9]) * tmp;

			mRes.exit_likelihood += mRes.alpha_h[1][_k9] + mRes.alpha_h[2][_k9];
			mRes.instant_likelihood += mRes.alpha_h[0][_k9] + mRes.alpha_h[1][_k9] + mRes.alpha_h[2][_k9];

			norm_const += tmp;
		}

		mRes.exit_ratio = mRes.exit_likelihood / mRes.instant_likelihood;
	}

	//============== NORMALIZE ALPHA VARIABLES =============//

	for (var _i11 = 0; _i11 < nmodels; _i11++) {
		for (var e = 0; e < 3; e++) {
			for (var _k10 = 0; _k10 < hhmmModel.models[_i11].parameters.states; _k10++) {
				hhmmModelResults.singleClassHmmModelResults[_i11].alpha_h[e][_k10] /= norm_const;
			}
		}
	}
};

//====================== UPDATE RESULTS ====================//

var updateResults = exports.updateResults = function updateResults(hhmmModel, hhmmModelResults) {
	var maxlog_likelihood = 0;
	var normconst_instant = 0;
	var normconst_smoothed = 0;

	var res = hhmmModelResults;

	for (var i = 0; i < hhmmModel.models.length; i++) {

		var hmmRes = res.singleClassHmmModelResults[i];

		res.instant_likelihoods[i] = hmmRes.instant_likelihood;
		res.smoothed_log_likelihoods[i] = hmmRes.log_likelihood;
		res.smoothed_likelihoods[i] = Math.exp(res.smoothed_log_likelihoods[i]);

		res.instant_normalized_likelihoods[i] = res.instant_likelihoods[i];
		res.smoothed_normalized_likelihoods[i] = res.smoothed_likelihoods[i];

		normconst_instant += res.instant_normalized_likelihoods[i];
		normconst_smoothed += res.smoothed_normalized_likelihoods[i];

		if (i == 0 || res.smoothed_log_likelihoods[i] > maxlog_likelihood) {
			maxlog_likelihood = res.smoothed_log_likelihoods[i];
			res.likeliest = i;
		}
	}

	for (var _i12 = 0; _i12 < hhmmModel.models.length; _i12++) {
		res.instant_normalized_likelihoods[_i12] /= normconst_instant;
		res.smoothed_normalized_likelihoods[_i12] /= normconst_smoothed;
	}
};
//# sourceMappingURL=data:application/json;base64,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QUNBO0FBQ0QsQ0EvQk0iLCJmaWxlIjoiaGhtbS11dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGdtbVV0aWxzIGZyb20gJy4vZ21tLXV0aWxzJztcblxuLyoqXG4gKlx0ZnVuY3Rpb25zIHRyYW5zbGF0ZWQgZnJvbSB0aGUgZGVjb2RpbmcgcGFydCBvZiBYTU1cbiAqL1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgIGFzIGluIHhtbUhtbVNpbmdsZUNsYXNzLmNwcCAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBobW1SZWdyZXNzaW9uID0gKG9ic2VydmF0aW9uSW4sIHNpbmdsZUNsYXNzSG1tTW9kZWwsIHNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzKSA9PiB7XG5cdGxldCBtID0gc2luZ2xlQ2xhc3NIbW1Nb2RlbDtcblx0bGV0IG1SZXMgPSBzaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0cztcblx0bGV0IGRpbSA9IG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uZGltZW5zaW9uO1xuXHRsZXQgZGltSW4gPSBtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmRpbWVuc2lvbl9pbnB1dDtcblx0bGV0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG5cdGxldCBvdXRDb3ZhclNpemU7XG5cdGlmKG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uY292YXJpYW5jZV9tb2RlID09PSAwKSB7IC8vIGZ1bGxcblx0XHRvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG5cdH1cblx0ZWxzZSB7IC8vIGRpYWdvbmFsXG5cdFx0b3V0Q292YXJTaXplID0gZGltT3V0O1xuXHR9XG5cblx0bVJlcy5vdXRwdXRfdmFsdWVzID0gbmV3IEFycmF5KGRpbU91dCk7XG5cdGZvcihsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuXHRcdG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcblx0fVxuXHRtUmVzLm91dHB1dF9jb3ZhcmlhbmNlID0gbmV3IEFycmF5KG91dENvdmFyU2l6ZSk7XG5cdGZvcihsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuXHRcdG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG5cdH1cblxuXHRpZihtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT09IDIpIHsgLy8gbGlrZWxpZXN0XG5cdFx0Z21tVXRpbHMuZ21tTGlrZWxpaG9vZChcblx0XHRcdG9ic2VydmF0aW9uSW4sXG5cdFx0XHRtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0sXG5cdFx0XHRtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0X3N0YXRlXVxuXHRcdCk7XG5cdFx0Z21tVXRpbHMuZ21tUmVncmVzc2lvbihcblx0XHRcdG9ic2VydmF0aW9uSW4sXG5cdFx0XHRtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0sXG5cdFx0XHRtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0X3N0YXRlXVxuXHRcdCk7XG5cdFx0bVJlcy5vdXRwdXRfdmFsdWVzXG5cdFx0XHQ9IG0uc3RhdGVzW21SZXMubGlrZWxpZXN0X3N0YXRlXS5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGxldCBjbGlwTWluU3RhdGUgPSAobS5wYXJhbWV0ZXJzLnJlZ3Jlc3Npb25fZXN0aW1hdG9yID09IDApIC8vIGZ1bGxcblx0XHRcdFx0XHQgPyAwIDogbVJlcy53aW5kb3dfbWluaW5kZXg7XG5cdGxldCBjbGlwTWF4U3RhdGUgPSAobS5wYXJhbWV0ZXJzLnJlZ3Jlc3Npb25fZXN0aW1hdG9yID09IDApIC8vIGZ1bGxcblx0XHRcdFx0XHQgPyBtLnN0YXRlcy5sZW5ndGggOiBtUmVzLndpbmRvd19tYXhpbmRleDtcblx0bGV0IG5vcm1Db25zdGFudCA9IChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT0gMCkgLy8gZnVsbFxuXHRcdFx0XHRcdCA/IDEuMCA6IG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQ7XG5cblx0aWYobm9ybUNvbnN0YW50IDw9IDAuMCkge1xuXHRcdG5vcm1Db25zdGFudCA9IDEuO1xuXHR9XG5cblx0Zm9yKGxldCBpID0gY2xpcE1pblN0YXRlOyBpIDwgY2xpcE1heFN0YXRlOyBpKyspIHtcblx0XHRnbW1VdGlscy5nbW1MaWtlbGlob29kKFxuXHRcdFx0b2JzZXJ2YXRpb25Jbixcblx0XHRcdG0uc3RhdGVzW2ldLFxuXHRcdFx0bVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuXHRcdCk7XG5cdFx0Z21tVXRpbHMuZ21tUmVncmVzc2lvbihcblx0XHRcdG9ic2VydmF0aW9uSW4sXG5cdFx0XHRtLnN0YXRlc1tpXSxcblx0XHRcdG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cblx0XHQpO1xuXHRcdGxldCB0bXBQcmVkaWN0ZWRPdXRwdXRcblx0XHRcdD0gbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXS5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuXG5cdFx0Zm9yKGxldCBkID0gMDsgZCA8IGRpbU91dDsgZCsrKSB7XG5cdFx0XHRpZihtUmVzLmhpZXJhcmNoaWNhbCkgeyAvLyBoaWVyYXJjaGljYWxcblx0XHRcdFx0bVJlcy5vdXRwdXRfdmFsdWVzW2RdXG5cdFx0XHRcdFx0Kz0gKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSlcblx0XHRcdFx0XHQqIHRtcFByZWRpY3RlZE91dHB1dFtkXSAvIG5vcm1Db25zdGFudDtcblx0XHRcdFx0aWYobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkgeyAvLyBmdWxsXG5cdFx0XHRcdFx0Zm9yKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG5cdFx0XHRcdFx0XHRtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl1cblx0XHRcdFx0XHRcdFx0Kz0gKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuXHRcdFx0XHRcdFx0XHQgICAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG5cdFx0XHRcdFx0XHRcdCAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG5cdFx0XHRcdFx0XHRcdCBcdFx0Lm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl0gL1xuXHRcdFx0XHRcdFx0XHQgXHRub3JtQ29uc3RhbnQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgeyAvLyBkaWFnb25hbFxuXHRcdFx0XHRcdG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF1cblx0XHRcdFx0XHRcdCs9IChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcblx0XHRcdFx0XHRcdCAgIChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcblx0XHRcdFx0XHRcdFx0bVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuXHRcdFx0XHRcdFx0XHRcdC5vdXRwdXRfY292YXJpYW5jZVtkXSAvXG5cdFx0XHRcdFx0XHRcdG5vcm1Db25zdGFudDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7IC8vIG5vbi1oaWVyYXJjaGljYWxcblx0XHRcdFx0bVJlcy5vdXRwdXRfdmFsdWVzW2RdICs9IG1SZXMuYWxwaGFbaV0gKiBcblx0XHRcdFx0XHRcdFx0XHRcdFx0IHRtcFByZWRpY3RlZE91dHB1dFtkXSAvIG5vcm1Db25zdGFudDtcblx0XHRcdFx0aWYobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkgeyAvLyBmdWxsXG5cdFx0XHRcdFx0Zm9yKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG5cdFx0XHRcdFx0XHRtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl1cblx0XHRcdFx0XHRcdFx0Kz0gbVJlcy5hbHBoYVtpXSAqIG1SZXMuYWxwaGFbaV0gKlxuXHRcdFx0XHRcdFx0XHQgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG5cdFx0XHRcdFx0XHRcdFx0XHQub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXSAvXG5cdFx0XHRcdFx0XHRcdCAgIG5vcm1Db25zdGFudDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7IC8vIGRpYWdvbmFsXG5cdFx0XHRcdFx0bVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXSArPSBtUmVzLmFscGhhW2ldICogbVJlcy5hbHBoYVtpXSAqXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0IFx0Lm91dHB1dF9jb3ZhcmlhbmNlW2RdIC9cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCBub3JtQ29uc3RhbnQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cbn07XG5cbmV4cG9ydCBjb25zdCBobW1Gb3J3YXJkSW5pdCA9IChvbnNlcnZhdGlvbkluLCBzaW5nbGVDbGFzc0htbU1vZGVsLCBzaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0cywgb2JzZXJ2YXRpb25PdXQgPSBbXSkgPT4ge1xuXHRsZXQgbSA9IHNpbmdsZUNsYXNzSG1tTW9kZWw7XG5cdGxldCBtUmVzID0gc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHM7XG5cdGxldCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcblx0bGV0IG5vcm1Db25zdCA9IDAuMDtcblxuXHRpZihtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09PSAwKSB7IC8vIGVyZ29kaWNcblx0XHRmb3IobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG5cdFx0XHRpZihtLnN0YXRlc1tpXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHsgLy8gYmltb2RhbFxuXHRcdFx0XHRpZihvYnNlcnZhdGlvbk91dC5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0bVJlcy5hbHBoYVtpXSA9IG0ucHJpb3JbaV1cblx0XHRcdFx0XHRcdFx0XHQgICogZ21tVXRpbHMuZ21tT2JzUHJvYkJpbW9kYWwob2JzZXJ2YXRpb25Jbixcblx0XHRcdFx0XHRcdFx0XHQgIFx0XHRcdFx0XHRcdFx0ICAgb2JzZXJ2YXRpb25PdXQsXG5cdFx0XHRcdFx0XHRcdFx0ICBcdFx0XHRcdFx0XHRcdCAgIG0uc3RhdGVzW2ldKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRtUmVzLmFscGhhW2ldID0gbS5wcmlvcltpXVxuXHRcdFx0XHRcdFx0XHRcdCAgKiBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzZXJ2YXRpb25Jbixcblx0XHRcdFx0XHRcdFx0XHQgIFx0XHRcdFx0XHRcdFx0IG0uc3RhdGVzW2ldKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7IC8vIG5vdCBiaW1vZGFsXG5cdFx0XHRcdG1SZXMuYWxwaGFbaV0gPSBtLnByaW9yW2ldXG5cdFx0XHRcdFx0XHRcdCAgKiBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic2VydmF0aW9uSW4sIG0uc3RhdGVzW2ldKTtcblx0XHRcdH1cblx0XHRcdG5vcm1Db25zdCArPSBtUmVzLmFscGhhW2ldO1xuXHRcdH1cblx0fVxuXHRlbHNlIHsgLy8gbGVmdC1yaWdodFxuXHRcdGZvcihsZXQgaSA9IDA7IGkgPCBtUmVzLmFscGhhLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRtUmVzLmFscGhhW2ldID0gMC4wO1xuXHRcdH1cblx0XHRpZihtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHsgLy9iaW1vZGFsXG5cdFx0XHRpZihvYnNlcnZhdGlvbk91dC5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdG1SZXMuYWxwaGFbMF0gPSBnbW1VdGlscy5nbW1PYnNQcm9iQmltb2RhbChvYnNlcnZhdGlvbkluLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCAgIG9ic2VydmF0aW9uT3V0LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCAgIG0uc3RhdGVzWzBdKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRtUmVzLmFscGhhWzBdID0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic2VydmF0aW9uSW4sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0IG0uc3RhdGVzWzBdKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRtUmVzLmFscGhhWzBdID0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNlcnZhdGlvbkluLCBtLnN0YXRlc1swXSk7XG5cdFx0fVxuXHRcdG5vcm1Db25zdCArPSBtUmVzLmFscGhhWzBdO1xuXHR9XG5cblx0aWYobm9ybUNvbnN0ID4gMCkge1xuXHRcdGZvcihsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcblx0XHRcdG1SZXMuYWxwaGFbaV0gLz0gbm9ybUNvbnN0O1xuXHRcdH1cblx0XHRyZXR1cm4gKDEuMCAvIG5vcm1Db25zdCk7XG5cdH1cblx0ZWxzZSB7XG5cdFx0Zm9yKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuXHRcdFx0bVJlcy5hbHBoYVtpXSA9IDEuMCAvIG5zdGF0ZXM7XG5cdFx0fVxuXHRcdHJldHVybiAxLjA7XG5cdH1cbn07XG5cbmV4cG9ydCBjb25zdCBobW1Gb3J3YXJkVXBkYXRlID0gKG9ic2VydmF0aW9uSW4sIHNpbmdsZUNsYXNzSG1tTW9kZWwsIHNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzLCBvYnNlcnZhdGlvbk91dCA9IFtdKSA9PiB7XG5cdGxldCBtID0gc2luZ2xlQ2xhc3NIbW1Nb2RlbDtcblx0bGV0IG1SZXMgPSBzaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0cztcblx0bGV0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuXHRsZXQgbm9ybUNvbnN0ID0gMC4wO1xuXG5cdG1SZXMucHJldmlvdXNfYWxwaGEgPSBtUmVzLmFscGhhLnNsaWNlKDApO1xuXHRmb3IobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG5cdFx0bVJlcy5hbHBoYVtpXSA9IDA7XG5cdFx0aWYobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PT0gMCkgeyAvLyBlcmdvZGljXG5cdFx0XHRmb3IobGV0IGogPSAwOyBqIDwgbnN0YXRlczsgaisrKSB7XG5cdFx0XHRcdG1SZXMuYWxwaGFbaV0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtqXVxuXHRcdFx0XHRcdFx0XHQgICogbVJlcy50cmFuc2l0aW9uW2ogKiBuc3RhdGVzKyBpXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7IC8vIGxlZnQtcmlnaHRcblx0XHRcdG1SZXMuYWxwaGFbaV0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtpXSAqIG1SZXMudHJhbnNpdGlvbltpICogMl07XG5cdFx0XHRpZihpID4gMCkge1xuXHRcdFx0XHRtUmVzLmFscGhhW2ldICs9IG1SZXMucHJldmlvdXNfYWxwaGFbaSAtIDFdXG5cdFx0XHRcdFx0XHRcdCAgKiBtUmVzLnRyYW5zaXRpb25bKGkgLSAxKSAqIDIgKyAxXTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRtUmVzLmFscGhhWzBdICs9IG1SZXMucHJldmlvdXNfYWxwaGFbbnN0YXRlcyAtIDFdXG5cdFx0XHRcdFx0XHRcdCAgKiBtUmVzLnRyYW5zaXRpb25bbnN0YXRlcyAqIDIgLSAxXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZihtLnN0YXRlc1tpXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcblx0XHRcdGlmKG9ic2VydmF0aW9uT3V0Lmxlbmd0aCA+IDApIHtcblx0XHRcdFx0bVJlcy5hbHBoYVtpXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iQmltb2RhbChvYnNlcnZhdGlvbkluLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0b2JzZXJ2YXRpb25PdXQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtLnN0YXRlc1tpXSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0bVJlcy5hbHBoYVtpXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzZXJ2YXRpb25Jbixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgIG0uc3RhdGVzW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRtUmVzLmFscGhhW2ldICo9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzZXJ2YXRpb25Jbixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCBtLnN0YXRlc1tpXSk7XG5cdFx0fVxuXHRcdG5vcm1Db25zdCArPSBtUmVzLmFscGhhW2ldO1xuXHR9XG5cblx0aWYobm9ybUNvbnN0ID4gMWUtMzAwKSB7XG5cdFx0Zm9yKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuXHRcdFx0bVJlcy5hbHBoYVtpXSAvPSBub3JtQ29uc3Q7XG5cdFx0fVxuXHRcdHJldHVybiAoMS4wIC8gbm9ybUNvbnN0KTtcblx0fVxuXHRlbHNlIHtcblx0XHRyZXR1cm4gMC4wO1xuXHR9XG59O1xuXG5leHBvcnQgY29uc3QgaG1tVXBkYXRlQWxwaGFXaW5kb3cgPSAoc2luZ2xlQ2xhc3NIbW1Nb2RlbCwgc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHMpID0+IHtcblx0bGV0IG0gPSBzaW5nbGVDbGFzc0htbU1vZGVsO1xuXHRsZXQgcmVzID0gc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHM7XG5cblx0bGV0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuXHRcblx0cmVzLmxpa2VsaWVzdF9zdGF0ZSA9IDA7XG5cdGxldCBiZXN0X2FscGhhO1xuXHRpZihtLnBhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG5cdFx0YmVzdF9hbHBoYSA9IHJlcy5hbHBoYV9oWzBdWzBdICsgcmVzLmFscGhhX2hbMV1bMF07XHRcblx0fVxuXHRlbHNlIHtcblx0XHRiZXN0X2FscGhhID0gcmVzLmFscGhhWzBdO1x0XG5cdH1cblxuXHRmb3IobGV0IGkgPSAxOyBpIDwgbnN0YXRlczsgaSsrKSB7XG5cdFx0aWYobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkge1xuXHRcdFx0aWYoKHJlcy5hbHBoYV9oWzBdW2ldICsgcmVzLmFscGhhX2hbMV1baV0pID4gYmVzdF9hbHBoYSkge1xuXHRcdFx0XHRiZXN0X2FscGhhID0gcmVzLmFscGhhX2hbMF1baV0gKyByZXMuYWxwaGFfaFsxXVtpXTtcblx0XHRcdFx0cmVzLmxpa2VsaWVzdF9zdGF0ZSA9IGk7XG5cdFx0XHR9XHRcdFx0XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYocmVzLmFscGhhW2ldID4gYmVzdF9hbHBoYSkge1xuXHRcdFx0XHRiZXN0X2FscGhhID0gcmVzLmFscGhhWzBdO1xuXHRcdFx0XHRyZXMubGlrZWxpZXN0X3N0YXRlID0gaTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXMud2luZG93X21pbmluZGV4ID0gcmVzLmxpa2VsaWVzdF9zdGF0ZSAtIG5zdGF0ZXMgLyAyO1xuXHRyZXMud2luZG93X21heGluZGV4ID0gcmVzLmxpa2VsaWVzdF9zdGF0ZSArIG5zdGF0ZXMgLyAyO1xuXHRyZXMud2luZG93X21pbmluZGV4ID0gKHJlcy53aW5kb3dfbWluaW5kZXggPj0gMClcblx0XHRcdFx0XHRcdD8gcmVzLndpbmRvd19taW5pbmRleFxuXHRcdFx0XHRcdFx0OiAwO1xuXHRyZXMud2luZG93X21heGluZGV4ID0gKHJlcy53aW5kb3dfbWF4aW5kZXggPD0gbnN0YXRlcylcblx0XHRcdFx0XHRcdD8gcmVzLndpbmRvd19tYXhpbmRleFxuXHRcdFx0XHRcdFx0OiBuc3RhdGVzO1xuXHRyZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQgPSAwO1xuXHRmb3IobGV0IGkgPSByZXMud2luZG93X21pbmluZGV4OyBpIDwgcmVzLndpbmRvd19tYXhpbmRleDsgaSsrKSB7XG5cdFx0cmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50XG5cdFx0XHQrPSAocmVzLmFscGhhX2hbMF1baV0gKyByZXMuYWxwaGFfaFsxXVtpXSk7XG5cdH1cbn1cblxuZXhwb3J0IGNvbnN0IGhtbVVwZGF0ZVJlc3VsdHMgPSAoc2luZ2xlQ2xhc3NIbW1Nb2RlbCwgc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHMpID0+IHtcblx0bGV0IG0gPSBzaW5nbGVDbGFzc0htbU1vZGVsO1xuXHRsZXQgcmVzID0gc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHM7XG5cblx0Ly8gSVMgVEhJUyBDT1JSRUNUICA/IFRPRE8gOiBDSEVDSyBBR0FJTiAoc2VlbXMgdG8gaGF2ZSBwcmVjaXNpb24gaXNzdWVzKVxuXHQvLyBOT1JNQUxMWSBMSUtFTElIT09EX0JVRkZFUiBJUyBDSVJDVUxBUiA6IElTIElUIFRIRSBDQVNFIEhFUkUgP1xuXHQvLyBTSE9VTEQgSSBcIlBPUF9GUk9OVFwiID8gKHNlZW1zIHRoYXQgeWVzKVxuXG5cdC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLnB1c2goTWF0aC5sb2cocmVzLmluc3RhbnRfbGlrZWxpaG9vZCkpO1xuXG5cdC8vIE5PVyBUSElTIElTIEJFVFRFUiAoU0hPVUxEV09SSyBBUyBJTlRFTkRFRClcblx0cmVzLmxpa2VsaWhvb2RfYnVmZmVyW3Jlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleF1cblx0XHQ9IE1hdGgubG9nKHJlcy5pbnN0YW50X2xpa2VsaWhvb2QpO1xuXHRyZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhcblx0XHQ9IChyZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXggKyAxKSAlIHJlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGg7XG5cblx0cmVzLmxvZ19saWtlbGlob29kID0gMDtcblx0bGV0IGJ1ZlNpemUgPSByZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuXHRmb3IobGV0IGkgPSAwOyBpIDwgYnVmU2l6ZTsgaSsrKSB7XG5cdFx0cmVzLmxvZ19saWtlbGlob29kICs9IHJlcy5saWtlbGlob29kX2J1ZmZlcltpXTtcblx0fVxuXHRyZXMubG9nX2xpa2VsaWhvb2QgLz0gYnVmU2l6ZTtcblxuXHRyZXMucHJvZ3Jlc3MgPSAwO1xuXHRmb3IobGV0IGkgPSByZXMud2luZG93X21pbmluZGV4OyBpIDwgcmVzLndpbmRvd19tYXhpbmRleDsgaSsrKSB7XG5cdFx0aWYobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkgeyAvLyBoaWVyYXJjaGljYWxcblx0XHRcdHJlcy5wcm9ncmVzc1xuXHRcdFx0XHQrPSAocmVzLmFscGhhX2hbMF1baV0gKyByZXMuYWxwaGFfaFsxXVtpXSArIHJlcy5hbHBoYV9oWzJdW2ldKVxuXHRcdFx0XHQqIGkgLyByZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQ7XG5cdFx0fVxuXHRcdGVsc2UgeyAvLyBub24gaGllcmFyY2hpY2FsXG5cdFx0XHRyZXMucHJvZ3Jlc3MgKz0gcmVzLmFscGhhW2ldICogaSAvIHJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcblx0XHR9XG5cdH1cblx0cmVzLnByb2dyZXNzIC89IChtLnBhcmFtZXRlcnMuc3RhdGVzIC0gMSk7XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICBhcyBpbiB4bW1IaWVyYXJjaGljYWxIbW0uY3BwICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGxpa2VsaWhvb2RBbHBoYSA9IChleGl0TnVtLCBsaWtlbGlob29kVmVjdG9yLCBoaG1tTW9kZWwsIGhobW1Nb2RlbFJlc3VsdHMpID0+IHtcblx0bGV0IG0gPSBoaG1tTW9kZWw7XG5cdGxldCByZXMgPSBoaG1tTW9kZWxSZXN1bHRzO1xuXG5cdGlmKGV4aXROdW0gPCAwKSB7XG5cdFx0Ly9sZXQgbCA9IDA7XG5cdFx0Zm9yKGxldCBpID0gMDsgaSA8IG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsaWtlbGlob29kVmVjdG9yW2ldID0gMDtcblx0XHRcdGZvcihsZXQgZXhpdCA9IDA7IGV4aXQgPCAzOyBleGl0KyspIHtcblx0XHRcdFx0Zm9yKGxldCBrID0gMDsgayA8IG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0XHRsaWtlbGlob29kVmVjdG9yW2ldXG5cdFx0XHRcdFx0XHQrPSByZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtleGl0XVtrXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRlbHNlIHtcblx0XHRmb3IobGV0IGkgPSAwOyBpIDwgbS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxpa2VsaWhvb2RWZWN0b3JbaV0gPSAwO1xuXHRcdFx0Zm9yKGxldCBrID0gMDsgayA8IG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0bGlrZWxpaG9vZFZlY3RvcltpXVxuXHRcdFx0XHRcdCs9IHJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oW2V4aXROdW1dW2tdO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufTtcblxuZXhwb3J0IGNvbnN0IGZvcndhcmRJbml0ID0gKG9ic2VydmF0aW9uLCBoaG1tTW9kZWwsIGhobW1Nb2RlbFJlc3VsdHMpID0+IHtcblx0bGV0IG5vcm1fY29uc3QgPSAwO1xuXG5cdC8vPT09PT09PT09PT09PT09PT0gSU5JVElBTElaRSBBTFBIQSBWQVJJQUJMRVMgPT09PT09PT09PT09PT09PT0vL1xuXG5cdGZvcihsZXQgaSA9IDA7IGkgPCBoaG1tTW9kZWwubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cblx0XHRsZXQgbSA9IGhobW1Nb2RlbC5tb2RlbHNbaV07XG5cdFx0bGV0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuXHRcdGxldCBtUmVzID0gaGhtbU1vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXTtcblxuXHRcdGZvcihsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcblx0XHRcdG1SZXMuYWxwaGFfaFtqXSA9IG5ldyBBcnJheShuc3RhdGVzKTtcblx0XHRcdGZvcihsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0bVJlcy5hbHBoYV9oW2pdW2tdID0gMDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZihtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09IDApIHsgLy8gZXJnb2RpY1xuXHRcdFx0Zm9yKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuXHRcdFx0XHRpZihoaG1tTW9kZWwuc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkgeyAvLyBiaW1vZGFsXG5cdFx0XHRcdFx0bVJlcy5hbHBoYV9oWzBdW2tdID0gbS5wcmlvcltrXVxuXHRcdFx0XHRcdFx0XHRcdFx0ICAgKiBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzZXJ2YXRpb24sXG5cdFx0XHRcdFx0XHRcdFx0XHQgICBcdFx0XHRcdFx0XHRcdCAgbS5zdGF0ZXNba10pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgeyAvLyBub3QgYmltb2RhbFxuXHRcdFx0XHRcdC8vIHNlZSBob3cgb2JzUHJvYiBpcyBpbXBsZW1lbnRlZFxuXHRcdFx0XHRcdG1SZXMuYWxwaGFfaFswXVtrXSA9IG0ucHJpb3Jba11cblx0XHRcdFx0XHRcdFx0XHRcdCAgICogZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNlcnZhdGlvbixcblx0XHRcdFx0XHRcdFx0XHRcdCAgIFx0XHRcdFx0XHRcdCBtLnN0YXRlc1trXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0bVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgKz0gbVJlcy5hbHBoYVswXVtrXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7IC8vIGxlZnQtcmlnaHRcblx0XHRcdG1SZXMuYWxwaGFfaFswXVswXSA9IGhobW1Nb2RlbC5wcmlvcltpXTtcblx0XHRcdGlmKGhobW1Nb2RlbC5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7IC8vIGJpbW9kYWxcblx0XHRcdFx0bVJlcy5hbHBoYV9oWzBdWzBdICo9IGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNlcnZhdGlvbixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCAgIG0uc3RhdGVzW2tdKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgeyAvLyBub3QgYmltb2RhbFxuXHRcdFx0XHRtUmVzLmFscGhhX2hbMF1bMF0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNlcnZhdGlvbixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgIG0uc3RhdGVzW2tdKTtcblx0XHRcdH1cblx0XHRcdG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gbVJlcy5hbHBoYV9oWzBdWzBdO1xuXHRcdH1cblx0XHRub3JtX2NvbnN0ICs9IG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xuXHR9XG5cblx0Ly89PT09PT09PT09PT09PT09PT0gTk9STUFMSVpFIEFMUEhBIFZBUklBQkxFUyA9PT09PT09PT09PT09PT09PS8vXG5cblx0Zm9yKGxldCBpID0gMDsgaSA8IGhobW1Nb2RlbC5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblxuXHRcdGxldCBuc3RhdGVzID0gaGhtbU1vZGVsLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlcztcblx0XHRmb3IobGV0IGUgPSAwOyBlIDwgMzsgZSsrKSB7XG5cdFx0XHRmb3IobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG5cdFx0XHRcdGhobW1Nb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtlXVtrXSAvPSBub3JtX2NvbnN0O1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGhobW1Nb2RlbFJlc3VsdHMuZm9yd2FyZF9pbml0aWFsaXplZCA9IHRydWU7XG59O1xuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG4vLz09PT09PT09PT09PT09PT09PT09PT09PSBGT1JXQVJEIFVQREFURSA9PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG5cbmV4cG9ydCBjb25zdCBmb3J3YXJkVXBkYXRlID0gKG9ic2VydmF0aW9uLCBoaG1tTW9kZWwsIGhobW1Nb2RlbFJlc3VsdHMpID0+IHtcblx0bGV0IG5vcm1fY29uc3QgPSAwO1xuXHRsZXQgdG1wID0gMDtcblx0bGV0IGZyb250OyAvLyBhcnJheVxuXG5cdGxldCBubW9kZWxzID0gaGhtbU1vZGVsLm1vZGVscy5sZW5ndGg7XG5cblx0bGlrZWxpaG9vZEFscGhhKDEsIGhobW1Nb2RlbFJlc3VsdHMuZnJvbnRpZXJfdjEsIGhobW1Nb2RlbCwgaGhtbU1vZGVsUmVzdWx0cyk7XG5cdGxpa2VsaWhvb2RBbHBoYSgyLCBoaG1tTW9kZWxSZXN1bHRzLmZyb250aWVyX3YyLCBoaG1tTW9kZWwsIGhobW1Nb2RlbFJlc3VsdHMpO1xuXG5cdC8vIGxldCBudW1fY2xhc3NlcyA9IFxuXHQvLyBsZXQgZHN0TW9kZWxJbmRleCA9IDA7XG5cblx0Zm9yKGxldCBpID0gMDsgaSA8IG5tb2RlbHM7IGkrKykge1xuXG5cdFx0bGV0IG0gPSBoaG1tTW9kZWwubW9kZWxzW2ldO1xuXHRcdGxldCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcblx0XHRsZXQgbVJlcyA9IGhobW1Nb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV07XG5cdFx0XG5cdFx0Ly89PT09PT09PT09PT09IENPTVBVVEUgRlJPTlRJRVIgVkFSSUFCTEUgPT09PT09PT09PT09Ly9cblxuXHRcdGZyb250ID0gbmV3IEFycmF5KG5zdGF0ZXMpO1xuXHRcdGZvcihsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcblx0XHRcdGZyb250W2pdID0gMDtcblx0XHR9XG5cblx0XHRpZihtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09IDApIHsgLy8gZXJnb2RpY1xuXHRcdFx0Zm9yKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuXHRcdFx0XHRmb3IobGV0IGogPSAwOyBqIDwgbnN0YXRlczsgaisrKSB7XG5cdFx0XHRcdFx0ZnJvbnRba10gKz0gbS50cmFuc2l0aW9uW2ogKiBuc3RhdGVzICsga10gL1xuXHRcdFx0XHRcdFx0XHRcdCgxIC0gbS5leGl0UHJvYmFiaWxpdGllc1tqXSkgKlxuXHRcdFx0XHRcdFx0XHRcdG1SZXMuYWxwaGFfaFswXVtqXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRmb3IobGV0IHNyY2kgPSAwOyBzcmNpIDwgbm1vZGVsczsgc3JjaSsrKSB7XG5cdFx0XHRcdFx0ZnJvbnRba10gKz0gbS5wcmlvcltrXSAqXG5cdFx0XHRcdFx0XHRcdFx0KFxuXHRcdFx0XHRcdFx0XHRcdFx0aGhtbU1vZGVsUmVzdWx0cy5mcm9udGllcl92MVtzcmNpXVxuXHRcdFx0XHRcdFx0XHRcdFx0KiBoaG1tTW9kZWwudHJhbnNpdGlvbltzcmNpXVtpXVxuXHRcdFx0XHRcdFx0XHRcdCAgKyBoaG1tTW9kZWxSZXN1bHRzLmZyb250aWVyX3YyW3NyY2ldXG5cdFx0XHRcdFx0XHRcdFx0ICBcdCogaGhtbU1vZGVsLnByaW9yW2ldXG5cdFx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHsgLy8gbGVmdC1yaWdodFxuXG5cdFx0XHQvLyBrID09IDAgOiBmaXJzdCBzdGF0ZSBvZiB0aGUgcHJpbWl0aXZlXG5cdFx0XHRmcm9udFswXSA9IG0udHJhbnNpdGlvblswXSAqIG1SZXMuYWxwaGFfaFswXVswXTtcblxuXHRcdFx0Zm9yKGxldCBzcmNpID0gMDsgc3JjaSA8IGhobW1Nb2RlbC5tb2RlbHMubGVuZ3RoOyBzcmNpKyspIHtcblx0XHRcdFx0ZnJvbnRbMF0gKz0gaGhtbU1vZGVsUmVzdWx0cy5mcm9udGllcl92MVtzcmNpXVxuXHRcdFx0XHRcdFx0XHQqIGhobW1Nb2RlbC50cmFuc2l0aW9uW3NyY2ldW2ldXG5cdFx0XHRcdFx0XHQgICsgaGhtbU1vZGVsUmVzdWx0cy5mcm9udGllcl92MltzcmNpXVxuXHRcdFx0XHRcdFx0ICAgICogaGhtbU1vZGVsLnByaW9yW2ldO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBrID4gMCA6IHJlc3Qgb2YgdGhlIHByaW1pdGl2ZVxuXHRcdFx0Zm9yKGxldCBrID0gMTsgayA8IG5zdGF0ZXM7IGsrKykge1xuXHRcdFx0XHRmcm9udFtrXSArPSBtLnRyYW5zaXRpb25bayAqIDJdIC9cblx0XHRcdFx0XHRcdFx0KDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdKSAqXG5cdFx0XHRcdFx0XHRcdG1SZXMuYWxwaGFfaFswXVtrXTtcblx0XHRcdFx0ZnJvbnRba10gKz0gbS50cmFuc2l0aW9uWyhrIC0gMSkgKiAyICsgMV0gL1xuXHRcdFx0XHRcdFx0XHQoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNbayAtIDFdKSAqXG5cdFx0XHRcdFx0XHRcdG1SZXMuYWxwaGFfaFswXVtrIC0gMV07XG5cdFx0XHR9XG5cblx0XHRcdGZvcihsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcblx0XHRcdFx0Zm9yKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuXHRcdFx0XHRcdG1SZXMuYWxwaGFfaFtqXVtrXSA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvL2NvbnNvbGUubG9nKGZyb250KTtcblxuXHRcdC8vPT09PT09PT09PT09PT0gVVBEQVRFIEZPUldBUkQgVkFSSUFCTEUgPT09PT09PT09PT09PS8vXG5cblx0XHRtUmVzLmV4aXRfbGlrZWxpaG9vZCA9IDA7XG5cdFx0bVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSAwO1xuXG5cdFx0Zm9yKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuXHRcdFx0aWYoaGhtbU1vZGVsLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcblx0XHRcdFx0dG1wID0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic2VydmF0aW9uLCBtLnN0YXRlc1trXSkgKiBmcm9udFtrXTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0bXAgPSBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic2VydmF0aW9uLCBtLnN0YXRlc1trXSkgKiBmcm9udFtrXTtcblx0XHRcdH1cblxuXHRcdFx0bVJlcy5hbHBoYV9oWzJdW2tdID0gaGhtbU1vZGVsLmV4aXRfdHJhbnNpdGlvbltpXSAqIG0uZXhpdFByb2JhYmlsaXRpZXNba10gKiB0bXA7XG5cdFx0XHRtUmVzLmFscGhhX2hbMV1ba10gPSAoMSAtIGhobW1Nb2RlbC5leGl0X3RyYW5zaXRpb25baV0pICogbS5leGl0UHJvYmFiaWxpdGllc1trXSAqIHRtcDtcblx0XHRcdG1SZXMuYWxwaGFfaFswXVtrXSA9ICgxIC0gbS5leGl0UHJvYmFiaWxpdGllc1trXSkgKiB0bXA7XG5cblx0XHRcdG1SZXMuZXhpdF9saWtlbGlob29kIFx0Kz0gbVJlcy5hbHBoYV9oWzFdW2tdICsgbVJlcy5hbHBoYV9oWzJdW2tdO1xuXHRcdFx0bVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgKz0gbVJlcy5hbHBoYV9oWzBdW2tdICsgbVJlcy5hbHBoYV9oWzFdW2tdICsgbVJlcy5hbHBoYV9oWzJdW2tdO1xuXG5cdFx0XHRub3JtX2NvbnN0ICs9IHRtcDtcblx0XHR9XG5cblx0XHRtUmVzLmV4aXRfcmF0aW8gPSBtUmVzLmV4aXRfbGlrZWxpaG9vZCAvIG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xuXHR9XG5cblx0Ly89PT09PT09PT09PT09PSBOT1JNQUxJWkUgQUxQSEEgVkFSSUFCTEVTID09PT09PT09PT09PT0vL1xuXG5cdGZvcihsZXQgaSA9IDA7IGkgPCBubW9kZWxzOyBpKyspIHtcblx0XHRmb3IobGV0IGUgPSAwOyBlIDwgMzsgZSsrKSB7XG5cdFx0XHRmb3IobGV0IGsgPSAwOyBrIDwgaGhtbU1vZGVsLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlczsgaysrKSB7XG5cdFx0XHRcdGhobW1Nb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtlXVtrXSAvPSBub3JtX2NvbnN0O1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufTtcblxuLy89PT09PT09PT09PT09PT09PT09PT09IFVQREFURSBSRVNVTFRTID09PT09PT09PT09PT09PT09PT09Ly9cblxuZXhwb3J0IGNvbnN0IHVwZGF0ZVJlc3VsdHMgPSAoaGhtbU1vZGVsLCBoaG1tTW9kZWxSZXN1bHRzKSA9PiB7XG5cdGxldCBtYXhsb2dfbGlrZWxpaG9vZCA9IDA7XG5cdGxldCBub3JtY29uc3RfaW5zdGFudCA9IDA7XG5cdGxldCBub3JtY29uc3Rfc21vb3RoZWQgPSAwO1xuXG5cdGxldCByZXMgPSBoaG1tTW9kZWxSZXN1bHRzO1xuXG5cdGZvcihsZXQgaSA9IDA7IGkgPCBoaG1tTW9kZWwubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cblx0XHRsZXQgaG1tUmVzID0gcmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldO1xuXG5cdFx0cmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV0gXHRcdD0gaG1tUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcblx0XHRyZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldID0gaG1tUmVzLmxvZ19saWtlbGlob29kO1xuXHRcdHJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXSBcdD0gTWF0aC5leHAocmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSk7XG5cblx0XHRyZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIFx0PSByZXMuaW5zdGFudF9saWtlbGlob29kc1tpXTtcblx0XHRyZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSBcdD0gcmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldO1xuXG5cdFx0bm9ybWNvbnN0X2luc3RhbnQgXHQrPSByZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXHRcdG5vcm1jb25zdF9zbW9vdGhlZCBcdCs9IHJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXG5cdFx0aWYoaSA9PSAwIHx8IHJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPiBtYXhsb2dfbGlrZWxpaG9vZCkge1xuXHRcdFx0bWF4bG9nX2xpa2VsaWhvb2QgPSByZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldO1xuXHRcdFx0cmVzLmxpa2VsaWVzdCA9IGk7XG5cdFx0fVxuXHR9XG5cblx0Zm9yKGxldCBpID0gMDsgaSA8IGhobW1Nb2RlbC5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRyZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIFx0Lz0gbm9ybWNvbnN0X2luc3RhbnQ7XG5cdFx0cmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gXHQvPSBub3JtY29uc3Rfc21vb3RoZWQ7XG5cdH1cbn07XG4iXX0=