'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.hhmmFilter = exports.hhmmUpdateResults = exports.hhmmForwardUpdate = exports.hhmmForwardInit = exports.hhmmLikelihoodAlpha = exports.hmmFilter = exports.hmmUpdateResults = exports.hmmUpdateAlphaWindow = exports.hmmForwardUpdate = exports.hmmForwardInit = exports.hmmRegression = undefined;

var _gmmUtils = require('./gmm-utils');

var gmmUtils = _interopRequireWildcard(_gmmUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 *	functions translated from the decoding part of XMM
 */

// ================================= //
//    as in xmmHmmSingleClass.cpp    //
// ================================= //

var hmmRegression = exports.hmmRegression = function hmmRegression(obsIn, hmm, hmmRes) {
	var m = hmm;
	var mRes = hmmRes;
	var dim = m.states[0].components[0].dimension;
	var dimIn = m.states[0].components[0].dimension_input;
	var dimOut = dim - dimIn;

	var outCovarSize = void 0;
	//--------------------------------------------------------------------- full
	if (m.states[0].components[0].covariance_mode === 0) {
		outCovarSize = dimOut * dimOut;
		//----------------------------------------------------------------- diagonal
	} else {
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

	//---------------------------------------------------------------- likeliest
	if (m.parameters.regression_estimator === 2) {
		gmmUtils.gmmLikelihood(obsIn, m.states[mRes.likeliest_state], mRes.singleClassGmmModelResults[mRes.likeliest_state]);
		gmmUtils.gmmRegression(obsIn, m.states[mRes.likeliest_state], mRes.singleClassGmmModelResults[mRes.likeliest_state]);
		mRes.output_values = m.states[mRes.likeliest_state].output_values.slice(0);
		return;
	}

	var clipMinState = m.parameters.regression_estimator == 0 ?
	//----------------------------------------------------- full
	0
	//------------------------------------------------- windowed
	: mRes.window_minindex;

	var clipMaxState = m.parameters.regression_estimator == 0 ?
	//----------------------------------------------------- full
	m.states.length
	//------------------------------------------------- windowed
	: mRes.window_maxindex;

	var normConstant = m.parameters.regression_estimator == 0 ?
	//----------------------------------------------------- full
	1.0
	//------------------------------------------------- windowed
	: mRes.window_normalization_constant;

	if (normConstant <= 0.0) {
		normConstant = 1.;
	}

	for (var _i2 = clipMinState; _i2 < clipMaxState; _i2++) {
		gmmUtils.gmmLikelihood(obsIn, m.states[_i2], mRes.singleClassGmmModelResults[_i2]);
		gmmUtils.gmmRegression(obsIn, m.states[_i2], mRes.singleClassGmmModelResults[_i2]);
		var tmpPredictedOutput = mRes.singleClassGmmModelResults[_i2].output_values.slice(0);

		for (var d = 0; d < dimOut; d++) {
			//----------------------------------------------------- hierarchical
			if (mRes.hierarchical) {
				mRes.output_values[d] += (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * tmpPredictedOutput[d] / normConstant;
				//--------------------------------------------------------- full
				if (m.parameters.covariance_mode === 0) {
					for (var d2 = 0; d2 < dimOut; d2++) {
						mRes.output_covariance[d * dimOut + d2] += (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * mRes.singleClassGmmModelResults[_i2].output_covariance[d * dimOut + d2] / normConstant;
					}
					//----------------------------------------------------- diagonal
				} else {
					mRes.output_covariance[d] += (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * mRes.singleClassGmmModelResults[_i2].output_covariance[d] / normConstant;
				}
				//------------------------------------------------- non-hierarchical
			} else {
				mRes.output_values[d] += mRes.alpha[_i2] * tmpPredictedOutput[d] / normConstant;
				//--------------------------------------------------------- full
				if (m.parameters.covariance_mode === 0) {
					for (var _d = 0; _d < dimOut; _d++) {
						mRes.output_covariance[d * dimOut + _d] += mRes.alpha[_i2] * mRes.alpha[_i2] * mRes.singleClassGmmModelResults[_i2].output_covariance[d * dimOut + _d] / normConstant;
					}
					//----------------------------------------------------- diagonal
				} else {
					mRes.output_covariance[d] += mRes.alpha[_i2] * mRes.alpha[_i2] * mRes.singleClassGmmModelResults.output_covariance[d] / normConstant;
				}
			}
		}
	}
};

var hmmForwardInit = exports.hmmForwardInit = function hmmForwardInit(obsIn, hmm, hmmRes) {
	var obsOut = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

	var m = hmm;
	var mRes = hmmRes;
	var nstates = m.parameters.states;
	var normConst = 0.0;

	//------------------------------------------------------------------ ergodic		
	if (m.parameters.transition_mode === 0) {
		for (var i = 0; i < nstates; i++) {
			//---------------------------------------------------------- bimodal		
			if (m.states[i].components[0].bimodal) {
				if (obsOut.length > 0) {
					mRes.alpha[i] = m.prior[i] * gmmUtils.gmmObsProbBimodal(obsIn, obsOut, m.states[i]);
				} else {
					mRes.alpha[i] = m.prior[i] * gmmUtils.gmmObsProbInput(obsIn, m.states[i]);
				}
				//--------------------------------------------------------- unimodal		
			} else {
				mRes.alpha[i] = m.prior[i] * gmmUtils.gmmObsProb(obsIn, m.states[i]);
			}
			normConst += mRes.alpha[i];
		}
		//--------------------------------------------------------------- left-right		
	} else {
		for (var _i3 = 0; _i3 < mRes.alpha.length; _i3++) {
			mRes.alpha[_i3] = 0.0;
		}
		//-------------------------------------------------------------- bimodal		
		if (m.states[0].components[0].bimodal) {
			if (obsOut.length > 0) {
				mRes.alpha[0] = gmmUtils.gmmObsProbBimodal(obsIn, obsOut, m.states[0]);
			} else {
				mRes.alpha[0] = gmmUtils.gmmObsProbInput(obsIn, m.states[0]);
			}
			//------------------------------------------------------------- unimodal		
		} else {
			mRes.alpha[0] = gmmUtils.gmmObsProb(obsIn, m.states[0]);
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

var hmmForwardUpdate = exports.hmmForwardUpdate = function hmmForwardUpdate(obsIn, hmm, hmmRes) {
	var obsOut = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

	var m = hmm;
	var mRes = hmmRes;
	var nstates = m.parameters.states;
	var normConst = 0.0;

	mRes.previous_alpha = mRes.alpha.slice(0);
	for (var i = 0; i < nstates; i++) {
		mRes.alpha[i] = 0;
		//-------------------------------------------------------------- ergodic
		if (m.parameters.transition_mode === 0) {
			for (var j = 0; j < nstates; j++) {
				mRes.alpha[i] += mRes.previous_alpha[j] * mRes.transition[j * nstates + i];
			}
			//----------------------------------------------------------- left-right
		} else {
			mRes.alpha[i] += mRes.previous_alpha[i] * mRes.transition[i * 2];
			if (i > 0) {
				mRes.alpha[i] += mRes.previous_alpha[i - 1] * mRes.transition[(i - 1) * 2 + 1];
			} else {
				mRes.alpha[0] += mRes.previous_alpha[nstates - 1] * mRes.transition[nstates * 2 - 1];
			}
		}

		//-------------------------------------------------------------- bimodal		
		if (m.states[i].components[0].bimodal) {
			if (obsOut.length > 0) {
				mRes.alpha[i] *= gmmUtils.gmmObsProbBimodal(obsIn, obsOut, m.states[i]);
			} else {
				mRes.alpha[i] *= gmmUtils.gmmObsProbInput(obsIn, m.states[i]);
			}
			//------------------------------------------------------------- unimodal		
		} else {
			mRes.alpha[i] *= gmmUtils.gmmObsProb(obsIn, m.states[i]);
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

var hmmUpdateAlphaWindow = exports.hmmUpdateAlphaWindow = function hmmUpdateAlphaWindow(hmm, hmmRes) {
	var m = hmm;
	var mRes = hmmRes;
	var nstates = m.parameters.states;

	mRes.likeliest_state = 0;

	var best_alpha = void 0;
	//------------------------------------------------------------- hierarchical
	if (m.parameters.hierarchical) {
		best_alpha = mRes.alpha_h[0][0] + mRes.alpha_h[1][0];
		//--------------------------------------------------------- non-hierarchical
	} else {
		best_alpha = mRes.alpha[0];
	}

	for (var i = 1; i < nstates; i++) {
		//--------------------------------------------------------- hierarchical
		if (m.parameters.hierarchical) {
			if (mRes.alpha_h[0][i] + mRes.alpha_h[1][i] > best_alpha) {
				best_alpha = mRes.alpha_h[0][i] + mRes.alpha_h[1][i];
				mRes.likeliest_state = i;
			}
			//----------------------------------------------------- non-hierarchical		
		} else {
			if (mRes.alpha[i] > best_alpha) {
				best_alpha = mRes.alpha[0];
				mRes.likeliest_state = i;
			}
		}
	}

	mRes.window_minindex = mRes.likeliest_state - nstates / 2;
	mRes.window_maxindex = mRes.likeliest_state + nstates / 2;
	mRes.window_minindex = mRes.window_minindex >= 0 ? mRes.window_minindex : 0;
	mRes.window_maxindex = mRes.window_maxindex <= nstates ? mRes.window_maxindex : nstates;
	mRes.window_normalization_constant = 0;
	for (var _i7 = mRes.window_minindex; _i7 < mRes.window_maxindex; _i7++) {
		mRes.window_normalization_constant += mRes.alpha_h[0][_i7] + mRes.alpha_h[1][_i7];
	}
};

var hmmUpdateResults = exports.hmmUpdateResults = function hmmUpdateResults(hmm, hmmRes) {
	var m = hmm;
	var mRes = hmmRes;

	// IS THIS CORRECT  ? TODO : CHECK AGAIN (seems to have precision issues)
	// AHA ! : NORMALLY LIKELIHOOD_BUFFER IS CIRCULAR : IS IT THE CASE HERE ?
	// SHOULD I "POP_FRONT" ? (seems that yes)

	//res.likelihood_buffer.push(Math.log(res.instant_likelihood));

	// NOW THIS IS BETTER (SHOULD WORK AS INTENDED)
	mRes.likelihood_buffer[mRes.likelihood_buffer_index] = Math.log(mRes.instant_likelihood);
	mRes.likelihood_buffer_index = (mRes.likelihood_buffer_index + 1) % mRes.likelihood_buffer.length;

	mRes.log_likelihood = 0;
	var bufSize = mRes.likelihood_buffer.length;
	for (var i = 0; i < bufSize; i++) {
		mRes.log_likelihood += mRes.likelihood_buffer[i];
	}
	mRes.log_likelihood /= bufSize;

	mRes.progress = 0;
	for (var _i8 = mRes.window_minindex; _i8 < mRes.window_maxindex; _i8++) {
		if (m.parameters.hierarchical) {
			// hierarchical
			mRes.progress += (mRes.alpha_h[0][_i8] + mRes.alpha_h[1][_i8] + mRes.alpha_h[2][_i8]) * _i8 / mRes.window_normalization_constant;
		} else {
			// non hierarchical
			mRes.progress += mRes.alpha[_i8] * _i8 / mRes.window_normalization_constant;
		}
	}
	mRes.progress /= m.parameters.states - 1;
};

var hmmFilter = exports.hmmFilter = function hmmFilter(obsIn, hmm, hmmRes) {
	var m = hmm;
	var mRes = hmmRes;
	var ct = 0.0;
	if (mRes.forward_initialized) {
		ct = hmmForwardUpdate(observation, m, mRes);
	} else {
		for (var j = 0; j < mRes.likelihood_buffer.length; j++) {
			mRes.likelihood_buffer[j] = 0.0;
		}
		ct = hmmForwardInit(observation, m, mRes);
		mRes.forward_initialized = true;
	}

	mRes.instant_likelihood = 1.0 / ct;
	hmmUpdateAlphaWindow(m, mRes);
	hmmUpdateResults(m, mRes);

	if (m.states[0].components[0].bimodal) {
		hmmRegression(observation, m, mRes);
	}

	return mRes.instant_likelihood;
};

// ================================= //
//   as in xmmHierarchicalHmm.cpp    //
// ================================= //

var hhmmLikelihoodAlpha = exports.hhmmLikelihoodAlpha = function hhmmLikelihoodAlpha(exitNum, likelihoodVec, hhmm, hhmmRes) {
	var m = hhmm;
	var mRes = hhmmRes;

	if (exitNum < 0) {
		for (var i = 0; i < m.models.length; i++) {
			likelihoodVec[i] = 0;
			for (var exit = 0; exit < 3; exit++) {
				for (var _k = 0; _k < m.models[i].parameters.states; _k++) {
					likelihoodVec[i] += mRes.singleClassHmmModelResults[i].alpha_h[exit][_k];
				}
			}
		}
	} else {
		for (var _i9 = 0; _i9 < m.models.length; _i9++) {
			likelihoodVec[_i9] = 0;
			for (var _k2 = 0; _k2 < m.models[_i9].parameters.states; _k2++) {
				likelihoodVec[_i9] += mRes.singleClassHmmModelResults[_i9].alpha_h[exitNum][_k2];
			}
		}
	}
};

//============================================ FORWARD INIT

var hhmmForwardInit = exports.hhmmForwardInit = function hhmmForwardInit(obsIn, hhmm, hhmmRes) {
	var hm = hhmm;
	var hmRes = hhmmRes;
	var norm_const = 0;

	//=================================== initialize alphas
	for (var i = 0; i < hm.models.length; i++) {

		var m = hm.models[i];
		var nstates = m.parameters.states;
		var mRes = hmRes.singleClassHmmModelResults[i];

		for (var j = 0; j < 3; j++) {
			mRes.alpha_h[j] = new Array(nstates);
			for (var _k3 = 0; _k3 < nstates; _k3++) {
				mRes.alpha_h[j][_k3] = 0;
			}
		}

		//-------------------------------------------------------------- ergodic
		if (m.parameters.transition_mode == 0) {
			for (var _k4 = 0; _k4 < nstates; _k4++) {
				//------------------------------------------------------ bimodal
				if (hm.shared_parameters.bimodal) {
					mRes.alpha_h[0][_k4] = m.prior[_k4] * gmmUtils.gmmObsProbInput(observation, m.states[_k4]);
					//----------------------------------------------------- unimodal
				} else {
					mRes.alpha_h[0][_k4] = m.prior[_k4] * gmmUtils.gmmObsProb(observation, m.states[_k4]);
				}
				mRes.instant_likelihood += mRes.alpha[0][_k4];
			}
			//----------------------------------------------------------- left-right
		} else {
			mRes.alpha_h[0][0] = hm.prior[i];
			//---------------------------------------------------------- bimodal
			if (hm.shared_parameters.bimodal) {
				mRes.alpha_h[0][0] *= gmmUtils.gmmObsProbInput(observation, m.states[k]);
				//--------------------------------------------------------- unimodal
			} else {
				mRes.alpha_h[0][0] *= gmmUtils.gmmObsProb(observation, m.states[k]);
			}
			mRes.instant_likelihood = mRes.alpha_h[0][0];
		}
		norm_const += mRes.instant_likelihood;
	}

	//==================================== normalize alphas
	for (var _i10 = 0; _i10 < hm.models.length; _i10++) {

		var _nstates = hm.models[_i10].parameters.states;
		for (var e = 0; e < 3; e++) {
			for (var _k5 = 0; _k5 < _nstates; _k5++) {
				hmRes.singleClassHmmModelResults[_i10].alpha_h[e][_k5] /= norm_const;
			}
		}
	}

	hmRes.forward_initialized = true;
};

//========================================== FORWARD UPDATE

var hhmmForwardUpdate = exports.hhmmForwardUpdate = function hhmmForwardUpdate(obsIn, hhmm, hhmmRes) {
	var hm = hhmm;
	var hmRes = hhmmRes;
	var nmodels = hm.models.length;

	var norm_const = 0;
	var tmp = 0;
	var front = void 0; // array

	hhmmLikelihoodAlpha(1, hmRes.frontier_v1, hm, hmRes);
	hhmmLikelihoodAlpha(2, hmRes.frontier_v2, hm, hmRes);

	for (var i = 0; i < nmodels; i++) {

		var m = hm.models[i];
		var nstates = m.parameters.states;
		var mRes = hmRes.singleClassHmmModelResults[i];

		//======================= compute frontier variable
		front = new Array(nstates);
		for (var j = 0; j < nstates; j++) {
			front[j] = 0;
		}

		//-------------------------------------------------------------- ergodic
		if (m.parameters.transition_mode == 0) {
			// ergodic
			for (var _k6 = 0; _k6 < nstates; _k6++) {
				for (var _j = 0; _j < nstates; _j++) {
					front[_k6] += m.transition[_j * nstates + _k6] / (1 - m.exitProbabilities[_j]) * mRes.alpha_h[0][_j];
				}
				for (var srci = 0; srci < nmodels; srci++) {
					front[_k6] += m.prior[_k6] * (hmRes.frontier_v1[srci] * hm.transition[srci][i] + hmRes.frontier_v2[srci] * hm.prior[i]);
				}
			}
			//----------------------------------------------------------- left-right
		} else {
			// k == 0 : first state of the primitive
			front[0] = m.transition[0] * mRes.alpha_h[0][0];

			for (var _srci = 0; _srci < nmodels; _srci++) {
				front[0] += hmRes.frontier_v1[_srci] * hm.transition[_srci][i] + hmRes.frontier_v2[_srci] * hm.prior[i];
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

		//========================= update forward variable
		mRes.exit_likelihood = 0;
		mRes.instant_likelihood = 0;

		for (var _k9 = 0; _k9 < nstates; _k9++) {
			if (hm.shared_parameters.bimodal) {
				tmp = gmmUtils.gmmObsProbInput(observation, m.states[_k9]) * front[_k9];
			} else {
				tmp = gmmUtils.gmmObsProb(observation, m.states[_k9]) * front[_k9];
			}

			mRes.alpha_h[2][_k9] = hm.exit_transition[i] * m.exitProbabilities[_k9] * tmp;
			mRes.alpha_h[1][_k9] = (1 - hm.exit_transition[i]) * m.exitProbabilities[_k9] * tmp;
			mRes.alpha_h[0][_k9] = (1 - m.exitProbabilities[_k9]) * tmp;

			mRes.exit_likelihood += mRes.alpha_h[1][_k9] + mRes.alpha_h[2][_k9];
			mRes.instant_likelihood += mRes.alpha_h[0][_k9] + mRes.alpha_h[1][_k9] + mRes.alpha_h[2][_k9];

			norm_const += tmp;
		}

		mRes.exit_ratio = mRes.exit_likelihood / mRes.instant_likelihood;
	}

	//==================================== normalize alphas
	for (var _i11 = 0; _i11 < nmodels; _i11++) {
		for (var e = 0; e < 3; e++) {
			for (var _k10 = 0; _k10 < hm.models[_i11].parameters.states; _k10++) {
				hmRes.singleClassHmmModelResults[_i11].alpha_h[e][_k10] /= norm_const;
			}
		}
	}
};

var hhmmUpdateResults = exports.hhmmUpdateResults = function hhmmUpdateResults(hhmm, hhmmRes) {
	var hm = hhmm;
	var hmRes = hhmmRes;

	var maxlog_likelihood = 0;
	var normconst_instant = 0;
	var normconst_smoothed = 0;

	for (var i = 0; i < hm.models.length; i++) {

		var mRes = hmRes.singleClassHmmModelResults[i];

		hmRes.instant_likelihoods[i] = mRes.instant_likelihood;
		hmRes.smoothed_log_likelihoods[i] = mRes.log_likelihood;
		hmRes.smoothed_likelihoods[i] = Math.exp(hmRes.smoothed_log_likelihoods[i]);

		hmRes.instant_normalized_likelihoods[i] = hmRes.instant_likelihoods[i];
		hmRes.smoothed_normalized_likelihoods[i] = hmRes.smoothed_likelihoods[i];

		normconst_instant += hmRes.instant_normalized_likelihoods[i];
		normconst_smoothed += hmRes.smoothed_normalized_likelihoods[i];

		if (i == 0 || hmRes.smoothed_log_likelihoods[i] > maxlog_likelihood) {
			maxlog_likelihood = hmRes.smoothed_log_likelihoods[i];
			hmRes.likeliest = i;
		}
	}

	for (var _i12 = 0; _i12 < hm.models.length; _i12++) {
		hmRes.instant_normalized_likelihoods[_i12] /= normconst_instant;
		hmRes.smoothed_normalized_likelihoods[_i12] /= normconst_smoothed;
	}
};

var hhmmFilter = exports.hhmmFilter = function hhmmFilter(obsIn, hhmm, hhmmRes) {
	var hm = hhmm;
	var hmRes = hhmmRes;

	//------------------------------------------------------------- hierarchical
	if (hm.configuration.default_parameters.hierarchical) {
		if (hmRes.forward_initialized) {
			hhmmForwardUpdate(obsIn, hm, hmRes);
		} else {
			hhmmForwardInit(obsIn, hm, hmRes);
		}
		//--------------------------------------------------------- non-hierarchical
	} else {
		for (var i = 0; i < hm.models.length; i++) {
			hmRes.instant_likelihoods[i] = hmmFilter(obsIn, hm, hmRes);
		}
	}

	//----------------- compute time progression
	for (var _i13 = 0; _i13 < hm.models.length; _i13++) {
		hmmUpdateAlphaWindow(hm.models[_i13], hmRes.singleClassHmmModelResults[_i13]);
		hmmUpdateResults(hm.models[_i13], hmRes.singleClassHmmModelResults[_i13]);
	}

	hhmmUpdateResults(hm, hmRes);

	//------------------------------------------------------------------ bimodal
	if (hm.shared_parameters.bimodal) {
		var dim = hm.shared_parameters.dimension;
		var dimIn = hm.shared_parameters.dimension_input;
		var dimOut = dim - dimIn;

		for (var _i14 = 0; _i14 < hm.models.length; _i14++) {
			hmmRegression(obsIn, hm.models[_i14], hmRes.singleClassHmmModelResults[_i14]);
		}

		//------------------------------------------------------------ likeliest
		if (hm.configuration.multiClass_regression_estimator === 0) {
			hmRes.output_values = hmRes.singleClassHmmModelResults[hmRes.likeliest].output_values.slice(0);
			hmRes.output_covariance = hmRes.singleClassHmmModelResults[hmRes.likeliest].output_covariance.slice(0);
			//-------------------------------------------------------------- mixture
		} else {
			for (var _i15 = 0; _i15 < hmRes.output_values.length; _i15++) {
				hmRes.output_values[_i15] = 0.0;
			}
			for (var _i16 = 0; _i16 < hmRes.output_covariance.length; _i16++) {
				hmRes.output_covariance[_i16] = 0.0;
			}

			for (var _i17 = 0; _i17 < hm.models.length; _i17++) {
				for (var d = 0; d < dimOut; d++) {
					hmRes.output_values[d] += hmRes.smoothed_normalized_likelihoods[_i17] * hmRes.singleClassHmmModelResults[_i17].output_values[d];

					//----------------------------------------------------- full
					if (hm.configuration.covariance_mode === 0) {
						for (var d2 = 0; d2 < dimOut; d2++) {
							hmRes.output_covariance[d * dimOut + d2] += hmRes.smoothed_normalized_likelihoods[_i17] * hmRes.singleClassHmmModelResults[_i17].output_covariance[d * dimOut + d2];
						}
						//------------------------------------------------- diagonal
					} else {
						hmRes.output_covariance[d] += hmRes.smoothed_normalized_likelihoods[_i17] * hmRes.singleClassHmmModelResults[_i17].output_covariance[d];
					}
				}
			}
		}
	}
};
//# sourceMappingURL=data:application/json;base64,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LE1BQU0sMEJBQU4sQ0FBaUMsSUFBakMsRUFDRyxpQkFESCxDQUNxQixJQUFJLE1BQUosR0FBYSxFQURsQyxDQUZKO0FBSUE7QUFDRjtBQUNDLE1BUkQsTUFRTztBQUNOLFlBQU0saUJBQU4sQ0FBd0IsQ0FBeEIsS0FDSSxNQUFNLCtCQUFOLENBQXNDLElBQXRDLElBQ0EsTUFBTSwwQkFBTixDQUFpQyxJQUFqQyxFQUNHLGlCQURILENBQ3FCLENBRHJCLENBRko7QUFJQTtBQUNEO0FBQ0Q7QUFDRDtBQUNEO0FBQ0QsQ0FyRk0iLCJmaWxlIjoiaGhtbS11dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGdtbVV0aWxzIGZyb20gJy4vZ21tLXV0aWxzJztcblxuLyoqXG4gKlx0ZnVuY3Rpb25zIHRyYW5zbGF0ZWQgZnJvbSB0aGUgZGVjb2RpbmcgcGFydCBvZiBYTU1cbiAqL1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgIGFzIGluIHhtbUhtbVNpbmdsZUNsYXNzLmNwcCAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBobW1SZWdyZXNzaW9uID0gKG9ic0luLCBobW0sIGhtbVJlcykgPT4ge1xuXHRsZXQgbSA9IGhtbTtcblx0bGV0IG1SZXMgPSBobW1SZXM7XG5cdGxldCBkaW0gPSBtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmRpbWVuc2lvbjtcblx0bGV0IGRpbUluID0gbS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5kaW1lbnNpb25faW5wdXQ7XG5cdGxldCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuXHRsZXQgb3V0Q292YXJTaXplO1xuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG5cdGlmIChtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuXHRcdG91dENvdmFyU2l6ZSA9IGRpbU91dCAqIGRpbU91dDtcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuXHR9IGVsc2Uge1xuXHRcdG91dENvdmFyU2l6ZSA9IGRpbU91dDtcblx0fVxuXG5cdG1SZXMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG5cdFx0bVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuXHR9XG5cdG1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuXHRcdG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG5cdH1cblxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGlrZWxpZXN0XG5cdGlmIChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT09IDIpIHtcblx0XHRnbW1VdGlscy5nbW1MaWtlbGlob29kKFxuXHRcdFx0b2JzSW4sXG5cdFx0XHRtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0sXG5cdFx0XHRtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0X3N0YXRlXVxuXHRcdCk7XG5cdFx0Z21tVXRpbHMuZ21tUmVncmVzc2lvbihcblx0XHRcdG9ic0luLFxuXHRcdFx0bS5zdGF0ZXNbbVJlcy5saWtlbGllc3Rfc3RhdGVdLFxuXHRcdFx0bVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV1cblx0XHQpO1xuXHRcdG1SZXMub3V0cHV0X3ZhbHVlc1xuXHRcdFx0PSBtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0ub3V0cHV0X3ZhbHVlcy5zbGljZSgwKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRsZXQgY2xpcE1pblN0YXRlID0gKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PSAwKVxuXHRcdFx0XHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuXHRcdFx0XHRcdCA/IDBcblx0XHRcdFx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gd2luZG93ZWRcblx0XHRcdFx0XHQgOiBtUmVzLndpbmRvd19taW5pbmRleDtcblxuXHRsZXQgY2xpcE1heFN0YXRlID0gKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PSAwKVxuXHRcdFx0XHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuXHRcdFx0XHRcdCA/IG0uc3RhdGVzLmxlbmd0aFxuXHRcdFx0XHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB3aW5kb3dlZFxuXHRcdFx0XHRcdCA6IG1SZXMud2luZG93X21heGluZGV4O1xuXG5cdGxldCBub3JtQ29uc3RhbnQgPSAobS5wYXJhbWV0ZXJzLnJlZ3Jlc3Npb25fZXN0aW1hdG9yID09IDApXG5cdFx0XHRcdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG5cdFx0XHRcdFx0ID8gMS4wXG5cdFx0XHRcdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHdpbmRvd2VkXG5cdFx0XHRcdFx0IDogbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcblxuXHRpZiAobm9ybUNvbnN0YW50IDw9IDAuMCkge1xuXHRcdG5vcm1Db25zdGFudCA9IDEuO1xuXHR9XG5cblx0Zm9yIChsZXQgaSA9IGNsaXBNaW5TdGF0ZTsgaSA8IGNsaXBNYXhTdGF0ZTsgaSsrKSB7XG5cdFx0Z21tVXRpbHMuZ21tTGlrZWxpaG9vZChcblx0XHRcdG9ic0luLFxuXHRcdFx0bS5zdGF0ZXNbaV0sXG5cdFx0XHRtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG5cdFx0KTtcblx0XHRnbW1VdGlscy5nbW1SZWdyZXNzaW9uKFxuXHRcdFx0b2JzSW4sXG5cdFx0XHRtLnN0YXRlc1tpXSxcblx0XHRcdG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cblx0XHQpO1xuXHRcdGxldCB0bXBQcmVkaWN0ZWRPdXRwdXRcblx0XHRcdD0gbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXS5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuXG5cdFx0Zm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuXHRcdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcblx0XHRcdGlmIChtUmVzLmhpZXJhcmNoaWNhbCkge1xuXHRcdFx0XHRtUmVzLm91dHB1dF92YWx1ZXNbZF1cblx0XHRcdFx0XHQrPSAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG5cdFx0XHRcdFx0ICAgdG1wUHJlZGljdGVkT3V0cHV0W2RdIC8gbm9ybUNvbnN0YW50O1xuXHRcdFx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG5cdFx0XHRcdGlmIChtLnBhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG5cdFx0XHRcdFx0Zm9yIChsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIrKykge1xuXHRcdFx0XHRcdFx0bVJlcy5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdXG5cdFx0XHRcdFx0XHRcdCs9IChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcblx0XHRcdFx0XHRcdFx0ICAgKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuXHRcdFx0XHRcdFx0XHQgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuXHRcdFx0XHRcdFx0XHQgXHRcdC5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdIC9cblx0XHRcdFx0XHRcdFx0IFx0bm9ybUNvbnN0YW50O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF1cblx0XHRcdFx0XHRcdCs9IChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcblx0XHRcdFx0XHRcdCAgIChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcblx0XHRcdFx0XHRcdFx0bVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuXHRcdFx0XHRcdFx0XHRcdC5vdXRwdXRfY292YXJpYW5jZVtkXSAvXG5cdFx0XHRcdFx0XHRcdG5vcm1Db25zdGFudDtcblx0XHRcdFx0fVxuXHRcdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWxcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1SZXMub3V0cHV0X3ZhbHVlc1tkXSArPSBtUmVzLmFscGhhW2ldICogXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCB0bXBQcmVkaWN0ZWRPdXRwdXRbZF0gLyBub3JtQ29uc3RhbnQ7XG5cdFx0XHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcblx0XHRcdFx0aWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcblx0XHRcdFx0XHRmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG5cdFx0XHRcdFx0XHRtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl1cblx0XHRcdFx0XHRcdFx0Kz0gXHRtUmVzLmFscGhhW2ldICogbVJlcy5hbHBoYVtpXSAqXG5cdFx0XHRcdFx0XHRcdCAgIFx0bVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuXHRcdFx0XHRcdFx0XHRcdFx0Lm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl0gL1xuXHRcdFx0XHRcdFx0XHQgICBcdG5vcm1Db25zdGFudDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdICs9IG1SZXMuYWxwaGFbaV0gKiBtUmVzLmFscGhhW2ldICpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgXHQgLm91dHB1dF9jb3ZhcmlhbmNlW2RdIC9cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCBub3JtQ29uc3RhbnQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbUZvcndhcmRJbml0ID0gKG9ic0luLCBobW0sIGhtbVJlcywgb2JzT3V0ID0gW10pID0+IHtcblx0bGV0IG0gPSBobW07XG5cdGxldCBtUmVzID0gaG1tUmVzO1xuXHRsZXQgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG5cdGxldCBub3JtQ29uc3QgPSAwLjA7XG5cblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXJnb2RpY1x0XHRcblx0aWYgKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT09IDApIHtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuXHRcdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWxcdFx0XG5cdFx0XHRpZiAobS5zdGF0ZXNbaV0uY29tcG9uZW50c1swXS5iaW1vZGFsKSB7XG5cdFx0XHRcdGlmIChvYnNPdXQubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdG1SZXMuYWxwaGFbaV0gPSBtLnByaW9yW2ldICpcblx0XHRcdFx0XHRcdFx0XHQgXHRnbW1VdGlscy5nbW1PYnNQcm9iQmltb2RhbChvYnNJbixcblx0XHRcdFx0XHRcdFx0XHQgIFx0XHRcdFx0XHRcdFx0ICAgb2JzT3V0LFxuXHRcdFx0XHRcdFx0XHRcdCAgXHRcdFx0XHRcdFx0XHQgICBtLnN0YXRlc1tpXSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bVJlcy5hbHBoYVtpXSA9IG0ucHJpb3JbaV0gKlxuXHRcdFx0XHRcdFx0XHRcdCAgXHRnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sXG5cdFx0XHRcdFx0XHRcdFx0ICBcdFx0XHRcdFx0XHRcdCBtLnN0YXRlc1tpXSk7XG5cdFx0XHRcdH1cblx0XHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXHRcdFxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bVJlcy5hbHBoYVtpXSA9IG0ucHJpb3JbaV0gKlxuXHRcdFx0XHRcdFx0XHQgIFx0Z21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbaV0pO1xuXHRcdFx0fVxuXHRcdFx0bm9ybUNvbnN0ICs9IG1SZXMuYWxwaGFbaV07XG5cdFx0fVxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsZWZ0LXJpZ2h0XHRcdFxuXHR9IGVsc2Uge1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbVJlcy5hbHBoYS5sZW5ndGg7IGkrKykge1xuXHRcdFx0bVJlcy5hbHBoYVtpXSA9IDAuMDtcblx0XHR9XG5cdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXHRcdFxuXHRcdGlmIChtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcblx0XHRcdGlmIChvYnNPdXQubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRtUmVzLmFscGhhWzBdID0gZ21tVXRpbHMuZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ICAgb2JzT3V0LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCAgIG0uc3RhdGVzWzBdKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1SZXMuYWxwaGFbMF0gPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0IG0uc3RhdGVzWzBdKTtcblx0XHRcdH1cblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWxcdFx0XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1SZXMuYWxwaGFbMF0gPSBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1swXSk7XG5cdFx0fVxuXHRcdG5vcm1Db25zdCArPSBtUmVzLmFscGhhWzBdO1xuXHR9XG5cblx0aWYgKG5vcm1Db25zdCA+IDApIHtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuXHRcdFx0bVJlcy5hbHBoYVtpXSAvPSBub3JtQ29uc3Q7XG5cdFx0fVxuXHRcdHJldHVybiAoMS4wIC8gbm9ybUNvbnN0KTtcblx0fSBlbHNlIHtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuXHRcdFx0bVJlcy5hbHBoYVtpXSA9IDEuMCAvIG5zdGF0ZXM7XG5cdFx0fVxuXHRcdHJldHVybiAxLjA7XG5cdH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbUZvcndhcmRVcGRhdGUgPSAob2JzSW4sIGhtbSwgaG1tUmVzLCBvYnNPdXQgPSBbXSkgPT4ge1xuXHRsZXQgbSA9IGhtbTtcblx0bGV0IG1SZXMgPSBobW1SZXM7XG5cdGxldCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcblx0bGV0IG5vcm1Db25zdCA9IDAuMDtcblxuXHRtUmVzLnByZXZpb3VzX2FscGhhID0gbVJlcy5hbHBoYS5zbGljZSgwKTtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcblx0XHRtUmVzLmFscGhhW2ldID0gMDtcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVyZ29kaWNcblx0XHRpZiAobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PT0gMCkge1xuXHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcblx0XHRcdFx0bVJlcy5hbHBoYVtpXSArPSBtUmVzLnByZXZpb3VzX2FscGhhW2pdICpcblx0XHRcdFx0XHRcdFx0ICBcdCBtUmVzLnRyYW5zaXRpb25baiAqIG5zdGF0ZXMrIGldO1xuXHRcdFx0fVxuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGVmdC1yaWdodFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRtUmVzLmFscGhhW2ldICs9IG1SZXMucHJldmlvdXNfYWxwaGFbaV0gKiBtUmVzLnRyYW5zaXRpb25baSAqIDJdO1xuXHRcdFx0aWYgKGkgPiAwKSB7XG5cdFx0XHRcdG1SZXMuYWxwaGFbaV0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtpIC0gMV0gKlxuXHRcdFx0XHRcdFx0XHQgIFx0IG1SZXMudHJhbnNpdGlvblsoaSAtIDEpICogMiArIDFdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bVJlcy5hbHBoYVswXSArPSBtUmVzLnByZXZpb3VzX2FscGhhW25zdGF0ZXMgLSAxXSAqXG5cdFx0XHRcdFx0XHRcdCAgXHQgbVJlcy50cmFuc2l0aW9uW25zdGF0ZXMgKiAyIC0gMV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXHRcdFxuXHRcdGlmIChtLnN0YXRlc1tpXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcblx0XHRcdGlmIChvYnNPdXQubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRtUmVzLmFscGhhW2ldICo9IGdtbVV0aWxzLmdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0b2JzT3V0LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bS5zdGF0ZXNbaV0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bVJlcy5hbHBoYVtpXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ICBtLnN0YXRlc1tpXSk7XG5cdFx0XHR9XG5cdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXHRcdFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRtUmVzLmFscGhhW2ldICo9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2ldKTtcblx0XHR9XG5cdFx0bm9ybUNvbnN0ICs9IG1SZXMuYWxwaGFbaV07XG5cdH1cblxuXHRpZiAobm9ybUNvbnN0ID4gMWUtMzAwKSB7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcblx0XHRcdG1SZXMuYWxwaGFbaV0gLz0gbm9ybUNvbnN0O1xuXHRcdH1cblx0XHRyZXR1cm4gKDEuMCAvIG5vcm1Db25zdCk7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIDAuMDtcblx0fVxufTtcblxuXG5leHBvcnQgY29uc3QgaG1tVXBkYXRlQWxwaGFXaW5kb3cgPSAoaG1tLCBobW1SZXMpID0+IHtcblx0bGV0IG0gPSBobW07XG5cdGxldCBtUmVzID0gaG1tUmVzO1xuXHRsZXQgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG5cdFxuXHRtUmVzLmxpa2VsaWVzdF9zdGF0ZSA9IDA7XG5cblx0bGV0IGJlc3RfYWxwaGE7XG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcblx0aWYgKG0ucGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHtcblx0XHRiZXN0X2FscGhhID0gbVJlcy5hbHBoYV9oWzBdWzBdICsgbVJlcy5hbHBoYV9oWzFdWzBdO1xuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBub24taGllcmFyY2hpY2FsXG5cdH0gZWxzZSB7XG5cdFx0YmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFbMF07XHRcblx0fVxuXG5cdGZvciAobGV0IGkgPSAxOyBpIDwgbnN0YXRlczsgaSsrKSB7XG5cdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG5cdFx0aWYgKG0ucGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHtcblx0XHRcdGlmICgobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSA+IGJlc3RfYWxwaGEpIHtcblx0XHRcdFx0YmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXTtcblx0XHRcdFx0bVJlcy5saWtlbGllc3Rfc3RhdGUgPSBpO1xuXHRcdFx0fVxuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFx0XHRcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYobVJlcy5hbHBoYVtpXSA+IGJlc3RfYWxwaGEpIHtcblx0XHRcdFx0YmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFbMF07XG5cdFx0XHRcdG1SZXMubGlrZWxpZXN0X3N0YXRlID0gaTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRtUmVzLndpbmRvd19taW5pbmRleCA9IG1SZXMubGlrZWxpZXN0X3N0YXRlIC0gbnN0YXRlcyAvIDI7XG5cdG1SZXMud2luZG93X21heGluZGV4ID0gbVJlcy5saWtlbGllc3Rfc3RhdGUgKyBuc3RhdGVzIC8gMjtcblx0bVJlcy53aW5kb3dfbWluaW5kZXggPSAobVJlcy53aW5kb3dfbWluaW5kZXggPj0gMClcblx0XHRcdFx0XHRcdCA/IG1SZXMud2luZG93X21pbmluZGV4XG5cdFx0XHRcdFx0XHQgOiAwO1xuXHRtUmVzLndpbmRvd19tYXhpbmRleCA9IChtUmVzLndpbmRvd19tYXhpbmRleCA8PSBuc3RhdGVzKVxuXHRcdFx0XHRcdFx0ID8gbVJlcy53aW5kb3dfbWF4aW5kZXhcblx0XHRcdFx0XHRcdCA6IG5zdGF0ZXM7XG5cdG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQgPSAwO1xuXHRmb3IgKGxldCBpID0gbVJlcy53aW5kb3dfbWluaW5kZXg7IGkgPCBtUmVzLndpbmRvd19tYXhpbmRleDsgaSsrKSB7XG5cdFx0bVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudFxuXHRcdFx0Kz0gKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSk7XG5cdH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbVVwZGF0ZVJlc3VsdHMgPSAoaG1tLCBobW1SZXMpID0+IHtcblx0bGV0IG0gPSBobW07XG5cdGxldCBtUmVzID0gaG1tUmVzO1xuXG5cdC8vIElTIFRISVMgQ09SUkVDVCAgPyBUT0RPIDogQ0hFQ0sgQUdBSU4gKHNlZW1zIHRvIGhhdmUgcHJlY2lzaW9uIGlzc3Vlcylcblx0Ly8gQUhBICEgOiBOT1JNQUxMWSBMSUtFTElIT09EX0JVRkZFUiBJUyBDSVJDVUxBUiA6IElTIElUIFRIRSBDQVNFIEhFUkUgP1xuXHQvLyBTSE9VTEQgSSBcIlBPUF9GUk9OVFwiID8gKHNlZW1zIHRoYXQgeWVzKVxuXG5cdC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLnB1c2goTWF0aC5sb2cocmVzLmluc3RhbnRfbGlrZWxpaG9vZCkpO1xuXG5cdC8vIE5PVyBUSElTIElTIEJFVFRFUiAoU0hPVUxEIFdPUksgQVMgSU5URU5ERUQpXG5cdG1SZXMubGlrZWxpaG9vZF9idWZmZXJbbVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleF1cblx0XHQ9IE1hdGgubG9nKG1SZXMuaW5zdGFudF9saWtlbGlob29kKTtcblx0bVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleFxuXHRcdD0gKG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXggKyAxKSAlIG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuXG5cdG1SZXMubG9nX2xpa2VsaWhvb2QgPSAwO1xuXHRsZXQgYnVmU2l6ZSA9IG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGJ1ZlNpemU7IGkrKykge1xuXHRcdG1SZXMubG9nX2xpa2VsaWhvb2QgKz0gbVJlcy5saWtlbGlob29kX2J1ZmZlcltpXTtcblx0fVxuXHRtUmVzLmxvZ19saWtlbGlob29kIC89IGJ1ZlNpemU7XG5cblx0bVJlcy5wcm9ncmVzcyA9IDA7XG5cdGZvciAobGV0IGkgPSBtUmVzLndpbmRvd19taW5pbmRleDsgaSA8IG1SZXMud2luZG93X21heGluZGV4OyBpKyspIHtcblx0XHRpZiAobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkgeyAvLyBoaWVyYXJjaGljYWxcblx0XHRcdG1SZXMucHJvZ3Jlc3Ncblx0XHRcdFx0Kz0gKFxuXHRcdFx0XHRcdFx0bVJlcy5hbHBoYV9oWzBdW2ldICtcblx0XHRcdFx0XHRcdG1SZXMuYWxwaGFfaFsxXVtpXSArXG5cdFx0XHRcdFx0XHRtUmVzLmFscGhhX2hbMl1baV1cblx0XHRcdFx0XHQpICpcblx0XHRcdFx0ICAgIGkgLyBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50O1xuXHRcdH0gZWxzZSB7IC8vIG5vbiBoaWVyYXJjaGljYWxcblx0XHRcdG1SZXMucHJvZ3Jlc3MgKz0gbVJlcy5hbHBoYVtpXSAqXG5cdFx0XHRcdFx0XHRcdCBpIC8gbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcblx0XHR9XG5cdH1cblx0bVJlcy5wcm9ncmVzcyAvPSAobS5wYXJhbWV0ZXJzLnN0YXRlcyAtIDEpO1xufTtcblxuXG5leHBvcnQgY29uc3QgaG1tRmlsdGVyID0gKG9ic0luLCBobW0sIGhtbVJlcykgPT4ge1xuXHRsZXQgbSA9IGhtbTtcblx0bGV0IG1SZXMgPSBobW1SZXM7XG5cdGxldCBjdCA9IDAuMDtcblx0aWYgKG1SZXMuZm9yd2FyZF9pbml0aWFsaXplZCkge1xuXHRcdGN0ID0gaG1tRm9yd2FyZFVwZGF0ZShvYnNlcnZhdGlvbiwgbSwgbVJlcyk7XG5cdH0gZWxzZSB7XG5cdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMC4wO1xuXHRcdH1cblx0XHRjdCA9IGhtbUZvcndhcmRJbml0KG9ic2VydmF0aW9uLCBtLCBtUmVzKTtcblx0XHRtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQgPSB0cnVlO1xuXHR9XG5cblx0bVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSAxLjAgLyBjdDtcblx0aG1tVXBkYXRlQWxwaGFXaW5kb3cobSwgbVJlcyk7XG5cdGhtbVVwZGF0ZVJlc3VsdHMobSwgbVJlcyk7XG5cblx0aWYgKG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uYmltb2RhbCkge1xuXHRcdGhtbVJlZ3Jlc3Npb24ob2JzZXJ2YXRpb24sIG0sIG1SZXMpO1xuXHR9XG5cblx0cmV0dXJuIG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xufTtcblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgYXMgaW4geG1tSGllcmFyY2hpY2FsSG1tLmNwcCAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBoaG1tTGlrZWxpaG9vZEFscGhhID0gKGV4aXROdW0sIGxpa2VsaWhvb2RWZWMsIGhobW0sIGhobW1SZXMpID0+IHtcblx0bGV0IG0gPSBoaG1tO1xuXHRsZXQgbVJlcyA9IGhobW1SZXM7XG5cblx0aWYgKGV4aXROdW0gPCAwKSB7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bGlrZWxpaG9vZFZlY1tpXSA9IDA7XG5cdFx0XHRmb3IgKGxldCBleGl0ID0gMDsgZXhpdCA8IDM7IGV4aXQrKykge1xuXHRcdFx0XHRmb3IgKGxldCBrID0gMDsgayA8IG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0XHRsaWtlbGlob29kVmVjW2ldXG5cdFx0XHRcdFx0XHQrPSBtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZXhpdF1ba107XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bGlrZWxpaG9vZFZlY1tpXSA9IDA7XG5cdFx0XHRmb3IgKGxldCBrID0gMDsgayA8IG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0bGlrZWxpaG9vZFZlY1tpXVxuXHRcdFx0XHRcdCs9IG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtleGl0TnVtXVtrXTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn07XG5cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBGT1JXQVJEIElOSVRcblxuZXhwb3J0IGNvbnN0IGhobW1Gb3J3YXJkSW5pdCA9IChvYnNJbiwgaGhtbSwgaGhtbVJlcykgPT4ge1xuXHRsZXQgaG0gPSBoaG1tO1xuXHRsZXQgaG1SZXMgPSBoaG1tUmVzO1xuXHRsZXQgbm9ybV9jb25zdCA9IDA7XG5cblx0Ly89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBpbml0aWFsaXplIGFscGhhc1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXG5cdFx0bGV0IG0gPSBobS5tb2RlbHNbaV07XG5cdFx0bGV0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuXHRcdGxldCBtUmVzID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV07XG5cblx0XHRmb3IgKGxldCBqID0gMDsgaiA8IDM7IGorKykge1xuXHRcdFx0bVJlcy5hbHBoYV9oW2pdID0gbmV3IEFycmF5KG5zdGF0ZXMpO1xuXHRcdFx0Zm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0bVJlcy5hbHBoYV9oW2pdW2tdID0gMDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVyZ29kaWNcblx0XHRpZiAobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PSAwKSB7XG5cdFx0XHRmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuXHRcdFx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG5cdFx0XHRcdGlmIChobS5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG5cdFx0XHRcdFx0bVJlcy5hbHBoYV9oWzBdW2tdID0gbS5wcmlvcltrXVxuXHRcdFx0XHRcdFx0XHRcdFx0ICAgKiBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzZXJ2YXRpb24sXG5cdFx0XHRcdFx0XHRcdFx0XHQgICBcdFx0XHRcdFx0XHRcdCAgbS5zdGF0ZXNba10pO1xuXHRcdFx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bVJlcy5hbHBoYV9oWzBdW2tdID0gbS5wcmlvcltrXVxuXHRcdFx0XHRcdFx0XHRcdFx0ICAgKiBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic2VydmF0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICAgXHRcdFx0XHRcdFx0IG0uc3RhdGVzW2tdKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCArPSBtUmVzLmFscGhhWzBdW2tdO1xuXHRcdFx0fVxuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGVmdC1yaWdodFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRtUmVzLmFscGhhX2hbMF1bMF0gPSBobS5wcmlvcltpXTtcblx0XHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG5cdFx0XHRpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuXHRcdFx0XHRtUmVzLmFscGhhX2hbMF1bMF0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic2VydmF0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ICAgbS5zdGF0ZXNba10pO1xuXHRcdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWxcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1SZXMuYWxwaGFfaFswXVswXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic2VydmF0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCAgbS5zdGF0ZXNba10pO1xuXHRcdFx0fVxuXHRcdFx0bVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSBtUmVzLmFscGhhX2hbMF1bMF07XG5cdFx0fVxuXHRcdG5vcm1fY29uc3QgKz0gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG5cdH1cblxuXHQvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBub3JtYWxpemUgYWxwaGFzXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cblx0XHRsZXQgbnN0YXRlcyA9IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlcztcblx0XHRmb3IgKGxldCBlID0gMDsgZSA8IDM7IGUrKykge1xuXHRcdFx0Zm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0aG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtlXVtrXSAvPSBub3JtX2NvbnN0O1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGhtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQgPSB0cnVlO1xufTtcblxuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBGT1JXQVJEIFVQREFURVxuXG5leHBvcnQgY29uc3QgaGhtbUZvcndhcmRVcGRhdGUgPSAob2JzSW4sIGhobW0sIGhobW1SZXMpID0+IHtcblx0bGV0IGhtID0gaGhtbTtcblx0bGV0IGhtUmVzID0gaGhtbVJlcztcblx0bGV0IG5tb2RlbHMgPSBobS5tb2RlbHMubGVuZ3RoO1xuXG5cdGxldCBub3JtX2NvbnN0ID0gMDtcblx0bGV0IHRtcCA9IDA7XG5cdGxldCBmcm9udDsgLy8gYXJyYXlcblxuXHRoaG1tTGlrZWxpaG9vZEFscGhhKDEsIGhtUmVzLmZyb250aWVyX3YxLCBobSwgaG1SZXMpO1xuXHRoaG1tTGlrZWxpaG9vZEFscGhhKDIsIGhtUmVzLmZyb250aWVyX3YyLCBobSwgaG1SZXMpO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgbm1vZGVsczsgaSsrKSB7XG5cblx0XHRsZXQgbSA9IGhtLm1vZGVsc1tpXTtcblx0XHRsZXQgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG5cdFx0bGV0IG1SZXMgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXTtcblx0XHRcblx0XHQvLz09PT09PT09PT09PT09PT09PT09PT09IGNvbXB1dGUgZnJvbnRpZXIgdmFyaWFibGVcblx0XHRmcm9udCA9IG5ldyBBcnJheShuc3RhdGVzKTtcblx0XHRmb3IgKGxldCBqID0gMDsgaiA8IG5zdGF0ZXM7IGorKykge1xuXHRcdFx0ZnJvbnRbal0gPSAwO1xuXHRcdH1cblxuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXJnb2RpY1xuXHRcdGlmIChtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09IDApIHsgLy8gZXJnb2RpY1xuXHRcdFx0Zm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcblx0XHRcdFx0XHRmcm9udFtrXSArPSBtLnRyYW5zaXRpb25baiAqIG5zdGF0ZXMgKyBrXSAvXG5cdFx0XHRcdFx0XHRcdFx0KDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2pdKSAqXG5cdFx0XHRcdFx0XHRcdFx0bVJlcy5hbHBoYV9oWzBdW2pdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGZvciAobGV0IHNyY2kgPSAwOyBzcmNpIDwgbm1vZGVsczsgc3JjaSsrKSB7XG5cdFx0XHRcdFx0ZnJvbnRba10gKz0gbS5wcmlvcltrXSAqXG5cdFx0XHRcdFx0XHRcdFx0KFxuXHRcdFx0XHRcdFx0XHRcdFx0aG1SZXMuZnJvbnRpZXJfdjFbc3JjaV0gKlxuXHRcdFx0XHRcdFx0XHRcdFx0aG0udHJhbnNpdGlvbltzcmNpXVtpXVxuXHRcdFx0XHRcdFx0XHRcdCAgKyBobVJlcy5mcm9udGllcl92MltzcmNpXSAqXG5cdFx0XHRcdFx0XHRcdFx0ICBcdGhtLnByaW9yW2ldXG5cdFx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGVmdC1yaWdodFxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBrID09IDAgOiBmaXJzdCBzdGF0ZSBvZiB0aGUgcHJpbWl0aXZlXG5cdFx0XHRmcm9udFswXSA9IG0udHJhbnNpdGlvblswXSAqIG1SZXMuYWxwaGFfaFswXVswXTtcblxuXHRcdFx0Zm9yIChsZXQgc3JjaSA9IDA7IHNyY2kgPCBubW9kZWxzOyBzcmNpKyspIHtcblx0XHRcdFx0ZnJvbnRbMF0gKz0gaG1SZXMuZnJvbnRpZXJfdjFbc3JjaV0gKlxuXHRcdFx0XHRcdFx0XHRobS50cmFuc2l0aW9uW3NyY2ldW2ldXG5cdFx0XHRcdFx0XHQgICsgaG1SZXMuZnJvbnRpZXJfdjJbc3JjaV0gKlxuXHRcdFx0XHRcdFx0ICAgIGhtLnByaW9yW2ldO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBrID4gMCA6IHJlc3Qgb2YgdGhlIHByaW1pdGl2ZVxuXHRcdFx0Zm9yIChsZXQgayA9IDE7IGsgPCBuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0ZnJvbnRba10gKz0gbS50cmFuc2l0aW9uW2sgKiAyXSAvXG5cdFx0XHRcdFx0XHRcdCgxIC0gbS5leGl0UHJvYmFiaWxpdGllc1trXSkgKlxuXHRcdFx0XHRcdFx0XHRtUmVzLmFscGhhX2hbMF1ba107XG5cdFx0XHRcdGZyb250W2tdICs9IG0udHJhbnNpdGlvblsoayAtIDEpICogMiArIDFdIC9cblx0XHRcdFx0XHRcdFx0KDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2sgLSAxXSkgKlxuXHRcdFx0XHRcdFx0XHRtUmVzLmFscGhhX2hbMF1bayAtIDFdO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8IDM7IGorKykge1xuXHRcdFx0XHRmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuXHRcdFx0XHRcdG1SZXMuYWxwaGFfaFtqXVtrXSA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0Ly9jb25zb2xlLmxvZyhmcm9udCk7XG5cblx0XHQvLz09PT09PT09PT09PT09PT09PT09PT09PT0gdXBkYXRlIGZvcndhcmQgdmFyaWFibGVcblx0XHRtUmVzLmV4aXRfbGlrZWxpaG9vZCA9IDA7XG5cdFx0bVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSAwO1xuXG5cdFx0Zm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcblx0XHRcdGlmIChobS5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG5cdFx0XHRcdHRtcCA9IGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNlcnZhdGlvbiwgbS5zdGF0ZXNba10pICpcblx0XHRcdFx0XHQgIGZyb250W2tdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dG1wID0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNlcnZhdGlvbiwgbS5zdGF0ZXNba10pICogZnJvbnRba107XG5cdFx0XHR9XG5cblx0XHRcdG1SZXMuYWxwaGFfaFsyXVtrXSA9IGhtLmV4aXRfdHJhbnNpdGlvbltpXSAqXG5cdFx0XHRcdFx0XHRcdFx0IG0uZXhpdFByb2JhYmlsaXRpZXNba10gKiB0bXA7XG5cdFx0XHRtUmVzLmFscGhhX2hbMV1ba10gPSAoMSAtIGhtLmV4aXRfdHJhbnNpdGlvbltpXSkgKlxuXHRcdFx0XHRcdFx0XHRcdCBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdICogdG1wO1xuXHRcdFx0bVJlcy5hbHBoYV9oWzBdW2tdID0gKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdKSAqIHRtcDtcblxuXHRcdFx0bVJlcy5leGl0X2xpa2VsaWhvb2QgXHQrPSBtUmVzLmFscGhhX2hbMV1ba10gK1xuXHRcdFx0XHRcdFx0XHRcdFx0ICAgbVJlcy5hbHBoYV9oWzJdW2tdO1xuXHRcdFx0bVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgKz0gbVJlcy5hbHBoYV9oWzBdW2tdICtcblx0XHRcdFx0XHRcdFx0XHRcdCAgIG1SZXMuYWxwaGFfaFsxXVtrXSArXG5cdFx0XHRcdFx0XHRcdFx0XHQgICBtUmVzLmFscGhhX2hbMl1ba107XG5cblx0XHRcdG5vcm1fY29uc3QgKz0gdG1wO1xuXHRcdH1cblxuXHRcdG1SZXMuZXhpdF9yYXRpbyA9IG1SZXMuZXhpdF9saWtlbGlob29kIC8gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG5cdH1cblxuXHQvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBub3JtYWxpemUgYWxwaGFzXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgbm1vZGVsczsgaSsrKSB7XG5cdFx0Zm9yIChsZXQgZSA9IDA7IGUgPCAzOyBlKyspIHtcblx0XHRcdGZvciAobGV0IGsgPSAwOyBrIDwgaG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0aG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtlXVtrXSAvPSBub3JtX2NvbnN0O1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufTtcblxuXG5leHBvcnQgY29uc3QgaGhtbVVwZGF0ZVJlc3VsdHMgPSAoaGhtbSwgaGhtbVJlcykgPT4ge1xuXHRsZXQgaG0gPSBoaG1tO1xuXHRsZXQgaG1SZXMgPSBoaG1tUmVzO1xuXG5cdGxldCBtYXhsb2dfbGlrZWxpaG9vZCA9IDA7XG5cdGxldCBub3JtY29uc3RfaW5zdGFudCA9IDA7XG5cdGxldCBub3JtY29uc3Rfc21vb3RoZWQgPSAwO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cblx0XHRsZXQgbVJlcyA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldO1xuXG5cdFx0aG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXSA9IG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xuXHRcdGhtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA9IG1SZXMubG9nX2xpa2VsaWhvb2Q7XG5cdFx0aG1SZXMuc21vb3RoZWRfbGlrZWxpaG9vZHNbaV1cblx0XHRcdD0gTWF0aC5leHAoaG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldKTtcblxuXHRcdGhtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXVxuXHRcdFx0PSBobVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldO1xuXHRcdGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV1cblx0XHRcdD0gaG1SZXMuc21vb3RoZWRfbGlrZWxpaG9vZHNbaV07XG5cblx0XHRub3JtY29uc3RfaW5zdGFudCBcdCs9IGhtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcblx0XHRub3JtY29uc3Rfc21vb3RoZWQgXHQrPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXG5cdFx0aWYgKGkgPT0gMCB8fCBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPiBtYXhsb2dfbGlrZWxpaG9vZCkge1xuXHRcdFx0bWF4bG9nX2xpa2VsaWhvb2QgPSBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV07XG5cdFx0XHRobVJlcy5saWtlbGllc3QgPSBpO1xuXHRcdH1cblx0fVxuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1jb25zdF9pbnN0YW50O1xuXHRcdGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gLz0gbm9ybWNvbnN0X3Ntb290aGVkO1xuXHR9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBoaG1tRmlsdGVyID0gKG9ic0luLCBoaG1tLCBoaG1tUmVzKSA9PiB7XG5cdGxldCBobSA9IGhobW07XG5cdGxldCBobVJlcyA9IGhobW1SZXM7XG5cblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuXHRpZiAoaG0uY29uZmlndXJhdGlvbi5kZWZhdWx0X3BhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG5cdFx0aWYgKGhtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQpIHtcblx0XHRcdGhobW1Gb3J3YXJkVXBkYXRlKG9ic0luLCBobSwgaG1SZXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRoaG1tRm9yd2FyZEluaXQob2JzSW4sIGhtLCBobVJlcyk7XG5cdFx0fVxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBub24taGllcmFyY2hpY2FsXG5cdH0gZWxzZSB7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV0gPSBobW1GaWx0ZXIob2JzSW4sIGhtLCBobVJlcyk7XG5cdFx0fVxuXHR9XG5cblx0Ly8tLS0tLS0tLS0tLS0tLS0tLSBjb21wdXRlIHRpbWUgcHJvZ3Jlc3Npb25cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRobW1VcGRhdGVBbHBoYVdpbmRvdyhcblx0XHRcdGhtLm1vZGVsc1tpXSxcblx0XHRcdGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldXG5cdFx0KTtcblx0XHRobW1VcGRhdGVSZXN1bHRzKFxuXHRcdFx0aG0ubW9kZWxzW2ldLFxuXHRcdFx0aG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cblx0XHQpO1xuXHR9XG5cblx0aGhtbVVwZGF0ZVJlc3VsdHMoaG0sIGhtUmVzKTtcblxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG5cdGlmIChobS5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG5cdFx0bGV0IGRpbSA9IGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmRpbWVuc2lvbjtcblx0XHRsZXQgZGltSW4gPSBobS5zaGFyZWRfcGFyYW1ldGVycy5kaW1lbnNpb25faW5wdXQ7XG5cdFx0bGV0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGhtbVJlZ3Jlc3Npb24ob2JzSW4saG0ubW9kZWxzW2ldLFxuXHRcdFx0XHRcdFx0IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldKTtcblx0XHR9XG5cblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsaWtlbGllc3Rcblx0XHRpZiAoaG0uY29uZmlndXJhdGlvbi5tdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yID09PSAwKSB7XG5cdFx0XHRobVJlcy5vdXRwdXRfdmFsdWVzXG5cdFx0XHRcdD0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaG1SZXMubGlrZWxpZXN0XVxuXHRcdFx0XHRcdCAgIC5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuXHRcdFx0aG1SZXMub3V0cHV0X2NvdmFyaWFuY2Vcblx0XHRcdFx0PSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tobVJlcy5saWtlbGllc3RdXG5cdFx0XHRcdFx0ICAgLm91dHB1dF9jb3ZhcmlhbmNlLnNsaWNlKDApO1xuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbWl4dHVyZVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGhtUmVzLm91dHB1dF92YWx1ZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcblx0XHRcdH1cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2UubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcblx0XHRcdFx0XHRobVJlcy5vdXRwdXRfdmFsdWVzW2RdXG5cdFx0XHRcdFx0XHQrPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcblx0XHRcdFx0XHRcdCAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLm91dHB1dF92YWx1ZXNbZF07XG5cblx0XHRcdFx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcblx0XHRcdFx0XHRpZiAoaG0uY29uZmlndXJhdGlvbi5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcblx0XHRcdFx0XHRcdGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyICsrKSB7XG5cdFx0XHRcdFx0XHRcdGhtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl1cblx0XHRcdFx0XHRcdFx0XHQrPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcblx0XHRcdFx0XHRcdFx0XHQgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuXHRcdFx0XHRcdFx0XHRcdCAgIFx0XHQub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0aG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF1cblx0XHRcdFx0XHRcdFx0Kz0gaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAqXG5cdFx0XHRcdFx0XHRcdCAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldXG5cdFx0XHRcdFx0XHRcdCAgIFx0XHQub3V0cHV0X2NvdmFyaWFuY2VbZF07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuIl19