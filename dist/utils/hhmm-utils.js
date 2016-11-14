'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hhmmFilter = exports.hhmmUpdateResults = exports.hhmmForwardUpdate = exports.hhmmForwardInit = exports.hhmmLikelihoodAlpha = exports.hmmFilter = exports.hmmUpdateResults = exports.hmmUpdateAlphaWindow = exports.hmmForwardUpdate = exports.hmmForwardInit = exports.hmmRegression = undefined;

var _gmmUtils = require('./gmm-utils');

var gmmUtils = _interopRequireWildcard(_gmmUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 *  functions used for decoding, translated from XMM
 */

// ================================= //
//    as in xmmHmmSingleClass.cpp    //
// ================================= //

var hmmRegression = exports.hmmRegression = function hmmRegression(obsIn, m, mRes) {
  // export const hmmRegression = (obsIn, hmm, hmmRes) => {
  //   const m = hmm;
  //   const mRes = hmmRes;
  var dim = m.states[0].components[0].dimension;
  var dimIn = m.states[0].components[0].dimension_input;
  var dimOut = dim - dimIn;

  var outCovarSize = void 0;
  //----------------------------------------------------------------------- full
  if (m.states[0].components[0].covariance_mode === 0) {
    outCovarSize = dimOut * dimOut;
    //------------------------------------------------------------------- diagonal
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

  //------------------------------------------------------------------ likeliest
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
      //----------------------------------------------------------- hierarchical
      if (mRes.hierarchical) {
        mRes.output_values[d] += (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * tmpPredictedOutput[d] / normConstant;
        //----------------------------------------------------------------- full
        if (m.parameters.covariance_mode === 0) {
          for (var d2 = 0; d2 < dimOut; d2++) {
            mRes.output_covariance[d * dimOut + d2] += (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * mRes.singleClassGmmModelResults[_i2].output_covariance[d * dimOut + d2] / normConstant;
          }
          //------------------------------------------------------------- diagonal
        } else {
          mRes.output_covariance[d] += (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * (mRes.alpha_h[0][_i2] + mRes.alpha_h[1][_i2]) * mRes.singleClassGmmModelResults[_i2].output_covariance[d] / normConstant;
        }
        //------------------------------------------------------- non-hierarchical
      } else {
        mRes.output_values[d] += mRes.alpha[_i2] * tmpPredictedOutput[d] / normConstant;
        //----------------------------------------------------------------- full
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

var hmmForwardInit = exports.hmmForwardInit = function hmmForwardInit(obsIn, m, mRes) {
  var obsOut = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

  // export const hmmForwardInit = (obsIn, hmm, hmmRes, obsOut = []) => {
  //   const m = hmm;
  //   const mRes = hmmRes;
  var nstates = m.parameters.states;
  var normConst = 0.0;

  //-------------------------------------------------------------------- ergodic        
  if (m.parameters.transition_mode === 0) {
    for (var i = 0; i < nstates; i++) {
      //---------------------------------------------------------------- bimodal        
      if (m.states[i].components[0].bimodal) {
        if (obsOut.length > 0) {
          mRes.alpha[i] = m.prior[i] * gmmUtils.gmmObsProbBimodal(obsIn, obsOut, m.states[i]);
        } else {
          mRes.alpha[i] = m.prior[i] * gmmUtils.gmmObsProbInput(obsIn, m.states[i]);
        }
        //--------------------------------------------------------------- unimodal        
      } else {
        mRes.alpha[i] = m.prior[i] * gmmUtils.gmmObsProb(obsIn, m.states[i]);
      }
      normConst += mRes.alpha[i];
    }
    //----------------------------------------------------------------- left-right        
  } else {
    for (var _i3 = 0; _i3 < mRes.alpha.length; _i3++) {
      mRes.alpha[_i3] = 0.0;
    }
    //------------------------------------------------------------------ bimodal        
    if (m.states[0].components[0].bimodal) {
      if (obsOut.length > 0) {
        mRes.alpha[0] = gmmUtils.gmmObsProbBimodal(obsIn, obsOut, m.states[0]);
      } else {
        mRes.alpha[0] = gmmUtils.gmmObsProbInput(obsIn, m.states[0]);
      }
      //----------------------------------------------------------------- unimodal        
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

var hmmForwardUpdate = exports.hmmForwardUpdate = function hmmForwardUpdate(obsIn, m, mRes) {
  var obsOut = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

  // export const hmmForwardUpdate = (obsIn, hmm, hmmRes, obsOut = []) => {
  //   const m = hmm;
  //   const mRes = hmmRes;
  var nstates = m.parameters.states;
  var normConst = 0.0;

  mRes.previous_alpha = mRes.alpha.slice(0);
  for (var i = 0; i < nstates; i++) {
    mRes.alpha[i] = 0;
    //------------------------------------------------------------------ ergodic
    if (m.parameters.transition_mode === 0) {
      for (var j = 0; j < nstates; j++) {
        mRes.alpha[i] += mRes.previous_alpha[j] * mRes.transition[j * nstates + i];
      }
      //--------------------------------------------------------------- left-right
    } else {
      mRes.alpha[i] += mRes.previous_alpha[i] * mRes.transition[i * 2];
      if (i > 0) {
        mRes.alpha[i] += mRes.previous_alpha[i - 1] * mRes.transition[(i - 1) * 2 + 1];
      } else {
        mRes.alpha[0] += mRes.previous_alpha[nstates - 1] * mRes.transition[nstates * 2 - 1];
      }
    }

    //------------------------------------------------------------------ bimodal        
    if (m.states[i].components[0].bimodal) {
      if (obsOut.length > 0) {
        mRes.alpha[i] *= gmmUtils.gmmObsProbBimodal(obsIn, obsOut, m.states[i]);
      } else {
        mRes.alpha[i] *= gmmUtils.gmmObsProbInput(obsIn, m.states[i]);
      }
      //----------------------------------------------------------------- unimodal        
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

var hmmUpdateAlphaWindow = exports.hmmUpdateAlphaWindow = function hmmUpdateAlphaWindow(m, mRes) {
  // export const hmmUpdateAlphaWindow = (hmm, hmmRes) => {
  //   const m = hmm;
  //   const mRes = hmmRes;
  var nstates = m.parameters.states;

  mRes.likeliest_state = 0;

  var best_alpha = void 0;
  //--------------------------------------------------------------- hierarchical
  if (m.parameters.hierarchical) {
    best_alpha = mRes.alpha_h[0][0] + mRes.alpha_h[1][0];
    //----------------------------------------------------------- non-hierarchical
  } else {
    best_alpha = mRes.alpha[0];
  }

  for (var i = 1; i < nstates; i++) {
    //------------------------------------------------------------- hierarchical
    if (m.parameters.hierarchical) {
      if (mRes.alpha_h[0][i] + mRes.alpha_h[1][i] > best_alpha) {
        best_alpha = mRes.alpha_h[0][i] + mRes.alpha_h[1][i];
        mRes.likeliest_state = i;
      }
      //--------------------------------------------------------- non-hierarchical        
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

var hmmUpdateResults = exports.hmmUpdateResults = function hmmUpdateResults(m, mRes) {
  // export const hmmUpdateResults = (hmm, hmmRes) => {
  //   const m = hmm;
  //   const mRes = hmmRes;

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

var hmmFilter = exports.hmmFilter = function hmmFilter(obsIn, m, mRes) {
  // export const hmmFilter = (obsIn, hmm, hmmRes) => {
  //   const m = hmm;
  //   const mRes = hmmRes;
  var ct = 0.0;
  if (mRes.forward_initialized) {
    ct = hmmForwardUpdate(obsIn, m, mRes);
  } else {
    for (var j = 0; j < mRes.likelihood_buffer.length; j++) {
      mRes.likelihood_buffer[j] = 0.0;
    }
    ct = hmmForwardInit(obsIn, m, mRes);
    mRes.forward_initialized = true;
  }

  mRes.instant_likelihood = 1.0 / ct;
  hmmUpdateAlphaWindow(m, mRes);
  hmmUpdateResults(m, mRes);

  if (m.states[0].components[0].bimodal) {
    hmmRegression(obsIn, m, mRes);
  }

  return mRes.instant_likelihood;
};

// ================================= //
//   as in xmmHierarchicalHmm.cpp    //
// ================================= //

var hhmmLikelihoodAlpha = exports.hhmmLikelihoodAlpha = function hhmmLikelihoodAlpha(exitNum, likelihoodVec, hm, hmRes) {
  // export const hhmmLikelihoodAlpha = (exitNum, likelihoodVec, hhmm, hhmmRes) => {
  //   const m = hhmm;
  //   const mRes = hhmmRes;

  if (exitNum < 0) {
    for (var i = 0; i < hm.models.length; i++) {
      likelihoodVec[i] = 0;
      for (var exit = 0; exit < 3; exit++) {
        for (var k = 0; k < hm.models[i].parameters.states; k++) {
          likelihoodVec[i] += hmRes.singleClassHmmModelResults[i].alpha_h[exit][k];
        }
      }
    }
  } else {
    for (var _i9 = 0; _i9 < hm.models.length; _i9++) {
      likelihoodVec[_i9] = 0;
      for (var _k = 0; _k < hm.models[_i9].parameters.states; _k++) {
        likelihoodVec[_i9] += hmRes.singleClassHmmModelResults[_i9].alpha_h[exitNum][_k];
      }
    }
  }
};

//============================================ FORWARD INIT

var hhmmForwardInit = exports.hhmmForwardInit = function hhmmForwardInit(obsIn, hm, hmRes) {
  // export const hhmmForwardInit = (obsIn, hhmm, hhmmRes) => {
  //   const hm = hhmm;
  //   const hmRes = hhmmRes;
  var norm_const = 0;

  //=================================== initialize alphas
  for (var i = 0; i < hm.models.length; i++) {

    var m = hm.models[i];
    var nstates = m.parameters.states;
    var mRes = hmRes.singleClassHmmModelResults[i];

    for (var j = 0; j < 3; j++) {
      mRes.alpha_h[j] = new Array(nstates);
      for (var k = 0; k < nstates; k++) {
        mRes.alpha_h[j][k] = 0;
      }
    }

    //------------------------------------------------------------------ ergodic
    if (m.parameters.transition_mode == 0) {
      for (var _k2 = 0; _k2 < nstates; _k2++) {
        //-------------------------------------------------------------- bimodal
        if (hm.shared_parameters.bimodal) {
          mRes.alpha_h[0][_k2] = m.prior[_k2] * gmmUtils.gmmObsProbInput(obsIn, m.states[_k2]);
          //------------------------------------------------------------- unimodal
        } else {
          mRes.alpha_h[0][_k2] = m.prior[_k2] * gmmUtils.gmmObsProb(obsIn, m.states[_k2]);
        }
        mRes.instant_likelihood += mRes.alpha_h[0][_k2];
      }
      //--------------------------------------------------------------- left-right
    } else {
      mRes.alpha_h[0][0] = hm.prior[i];
      //---------------------------------------------------------------- bimodal
      if (hm.shared_parameters.bimodal) {
        mRes.alpha_h[0][0] *= gmmUtils.gmmObsProbInput(obsIn, m.states[0]);
        //--------------------------------------------------------------- unimodal
      } else {
        mRes.alpha_h[0][0] *= gmmUtils.gmmObsProb(obsIn, m.states[0]);
      }
      mRes.instant_likelihood = mRes.alpha_h[0][0];
    }
    norm_const += mRes.instant_likelihood;
  }

  //==================================== normalize alphas
  for (var _i10 = 0; _i10 < hm.models.length; _i10++) {

    var _nstates = hm.models[_i10].parameters.states;
    for (var e = 0; e < 3; e++) {
      for (var _k3 = 0; _k3 < _nstates; _k3++) {
        hmRes.singleClassHmmModelResults[_i10].alpha_h[e][_k3] /= norm_const;
      }
    }
  }

  hmRes.forward_initialized = true;
};

//========================================== FORWARD UPDATE

var hhmmForwardUpdate = exports.hhmmForwardUpdate = function hhmmForwardUpdate(obsIn, hm, hmRes) {
  // export const hhmmForwardUpdate = (obsIn, hhmm, hhmmRes) => {
  //   const hm = hhmm;
  //   const hmRes = hhmmRes;
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

    //------------------------------------------------------------------ ergodic
    if (m.parameters.transition_mode == 0) {
      // ergodic
      for (var k = 0; k < nstates; k++) {
        for (var _j = 0; _j < nstates; _j++) {
          front[k] += m.transition[_j * nstates + k] / (1 - m.exitProbabilities[_j]) * mRes.alpha_h[0][_j];
        }
        for (var srci = 0; srci < nmodels; srci++) {
          front[k] += m.prior[k] * (hmRes.frontier_v1[srci] * hm.transition[srci][i] + hmRes.frontier_v2[srci] * hm.prior[i]);
        }
      }
      //--------------------------------------------------------------- left-right
    } else {
      // k == 0 : first state of the primitive
      front[0] = m.transition[0] * mRes.alpha_h[0][0];

      for (var _srci = 0; _srci < nmodels; _srci++) {
        front[0] += hmRes.frontier_v1[_srci] * hm.transition[_srci][i] + hmRes.frontier_v2[_srci] * hm.prior[i];
      }

      // k > 0 : rest of the primitive
      for (var _k4 = 1; _k4 < nstates; _k4++) {
        front[_k4] += m.transition[_k4 * 2] / (1 - m.exitProbabilities[_k4]) * mRes.alpha_h[0][_k4];
        front[_k4] += m.transition[(_k4 - 1) * 2 + 1] / (1 - m.exitProbabilities[_k4 - 1]) * mRes.alpha_h[0][_k4 - 1];
      }

      for (var _j2 = 0; _j2 < 3; _j2++) {
        for (var _k5 = 0; _k5 < nstates; _k5++) {
          mRes.alpha_h[_j2][_k5] = 0;
        }
      }
    }
    //console.log(front);

    //========================= update forward variable
    mRes.exit_likelihood = 0;
    mRes.instant_likelihood = 0;

    for (var _k6 = 0; _k6 < nstates; _k6++) {
      if (hm.shared_parameters.bimodal) {
        tmp = gmmUtils.gmmObsProbInput(obsIn, m.states[_k6]) * front[_k6];
      } else {
        tmp = gmmUtils.gmmObsProb(obsIn, m.states[_k6]) * front[_k6];
      }

      mRes.alpha_h[2][_k6] = hm.exit_transition[i] * m.exitProbabilities[_k6] * tmp;
      mRes.alpha_h[1][_k6] = (1 - hm.exit_transition[i]) * m.exitProbabilities[_k6] * tmp;
      mRes.alpha_h[0][_k6] = (1 - m.exitProbabilities[_k6]) * tmp;

      mRes.exit_likelihood += mRes.alpha_h[1][_k6] + mRes.alpha_h[2][_k6];
      mRes.instant_likelihood += mRes.alpha_h[0][_k6] + mRes.alpha_h[1][_k6] + mRes.alpha_h[2][_k6];

      norm_const += tmp;
    }

    mRes.exit_ratio = mRes.exit_likelihood / mRes.instant_likelihood;
  }

  //==================================== normalize alphas
  for (var _i11 = 0; _i11 < nmodels; _i11++) {
    for (var e = 0; e < 3; e++) {
      for (var _k7 = 0; _k7 < hm.models[_i11].parameters.states; _k7++) {
        hmRes.singleClassHmmModelResults[_i11].alpha_h[e][_k7] /= norm_const;
      }
    }
  }
};

var hhmmUpdateResults = exports.hhmmUpdateResults = function hhmmUpdateResults(hm, hmRes) {
  // export const hhmmUpdateResults = (hhmm, hhmmRes) => {
  //   const hm = hhmm;
  //   const hmRes = hhmmRes;

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

var hhmmFilter = exports.hhmmFilter = function hhmmFilter(obsIn, hm, hmRes) {
  // export const hhmmFilter = (obsIn, hhmm, hhmmRes) => {
  //   const hm = hhmm;
  //   const hmRes = hhmmRes;

  //--------------------------------------------------------------- hierarchical
  if (hm.configuration.default_parameters.hierarchical) {
    if (hmRes.forward_initialized) {
      hhmmForwardUpdate(obsIn, hm, hmRes);
    } else {
      hhmmForwardInit(obsIn, hm, hmRes);
    }
    //----------------------------------------------------------- non-hierarchical
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

  //-------------------------------------------------------------------- bimodal
  if (hm.shared_parameters.bimodal) {
    var dim = hm.shared_parameters.dimension;
    var dimIn = hm.shared_parameters.dimension_input;
    var dimOut = dim - dimIn;

    for (var _i14 = 0; _i14 < hm.models.length; _i14++) {
      hmmRegression(obsIn, hm.models[_i14], hmRes.singleClassHmmModelResults[_i14]);
    }

    //---------------------------------------------------------------- likeliest
    if (hm.configuration.multiClass_regression_estimator === 0) {
      hmRes.output_values = hmRes.singleClassHmmModelResults[hmRes.likeliest].output_values.slice(0);
      hmRes.output_covariance = hmRes.singleClassHmmModelResults[hmRes.likeliest].output_covariance.slice(0);
      //------------------------------------------------------------------ mixture
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

          //--------------------------------------------------------------- full
          if (hm.configuration.covariance_mode === 0) {
            for (var d2 = 0; d2 < dimOut; d2++) {
              hmRes.output_covariance[d * dimOut + d2] += hmRes.smoothed_normalized_likelihoods[_i17] * hmRes.singleClassHmmModelResults[_i17].output_covariance[d * dimOut + d2];
            }
            //----------------------------------------------------------- diagonal
          } else {
            hmRes.output_covariance[d] += hmRes.smoothed_normalized_likelihoods[_i17] * hmRes.singleClassHmmModelResults[_i17].output_covariance[d];
          }
        }
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhobW0tdXRpbHMuanMiXSwibmFtZXMiOlsiZ21tVXRpbHMiLCJobW1SZWdyZXNzaW9uIiwib2JzSW4iLCJtIiwibVJlcyIsImRpbSIsInN0YXRlcyIsImNvbXBvbmVudHMiLCJkaW1lbnNpb24iLCJkaW1JbiIsImRpbWVuc2lvbl9pbnB1dCIsImRpbU91dCIsIm91dENvdmFyU2l6ZSIsImNvdmFyaWFuY2VfbW9kZSIsIm91dHB1dF92YWx1ZXMiLCJBcnJheSIsImkiLCJvdXRwdXRfY292YXJpYW5jZSIsInBhcmFtZXRlcnMiLCJyZWdyZXNzaW9uX2VzdGltYXRvciIsImdtbUxpa2VsaWhvb2QiLCJsaWtlbGllc3Rfc3RhdGUiLCJzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cyIsImdtbVJlZ3Jlc3Npb24iLCJzbGljZSIsImNsaXBNaW5TdGF0ZSIsIndpbmRvd19taW5pbmRleCIsImNsaXBNYXhTdGF0ZSIsImxlbmd0aCIsIndpbmRvd19tYXhpbmRleCIsIm5vcm1Db25zdGFudCIsIndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50IiwidG1wUHJlZGljdGVkT3V0cHV0IiwiZCIsImhpZXJhcmNoaWNhbCIsImFscGhhX2giLCJkMiIsImFscGhhIiwiaG1tRm9yd2FyZEluaXQiLCJvYnNPdXQiLCJuc3RhdGVzIiwibm9ybUNvbnN0IiwidHJhbnNpdGlvbl9tb2RlIiwiYmltb2RhbCIsInByaW9yIiwiZ21tT2JzUHJvYkJpbW9kYWwiLCJnbW1PYnNQcm9iSW5wdXQiLCJnbW1PYnNQcm9iIiwiaG1tRm9yd2FyZFVwZGF0ZSIsInByZXZpb3VzX2FscGhhIiwiaiIsInRyYW5zaXRpb24iLCJobW1VcGRhdGVBbHBoYVdpbmRvdyIsImJlc3RfYWxwaGEiLCJobW1VcGRhdGVSZXN1bHRzIiwibGlrZWxpaG9vZF9idWZmZXIiLCJsaWtlbGlob29kX2J1ZmZlcl9pbmRleCIsIk1hdGgiLCJsb2ciLCJpbnN0YW50X2xpa2VsaWhvb2QiLCJsb2dfbGlrZWxpaG9vZCIsImJ1ZlNpemUiLCJwcm9ncmVzcyIsImhtbUZpbHRlciIsImN0IiwiZm9yd2FyZF9pbml0aWFsaXplZCIsImhobW1MaWtlbGlob29kQWxwaGEiLCJleGl0TnVtIiwibGlrZWxpaG9vZFZlYyIsImhtIiwiaG1SZXMiLCJtb2RlbHMiLCJleGl0IiwiayIsInNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzIiwiaGhtbUZvcndhcmRJbml0Iiwibm9ybV9jb25zdCIsInNoYXJlZF9wYXJhbWV0ZXJzIiwiZSIsImhobW1Gb3J3YXJkVXBkYXRlIiwibm1vZGVscyIsInRtcCIsImZyb250IiwiZnJvbnRpZXJfdjEiLCJmcm9udGllcl92MiIsImV4aXRQcm9iYWJpbGl0aWVzIiwic3JjaSIsImV4aXRfbGlrZWxpaG9vZCIsImV4aXRfdHJhbnNpdGlvbiIsImV4aXRfcmF0aW8iLCJoaG1tVXBkYXRlUmVzdWx0cyIsIm1heGxvZ19saWtlbGlob29kIiwibm9ybWNvbnN0X2luc3RhbnQiLCJub3JtY29uc3Rfc21vb3RoZWQiLCJpbnN0YW50X2xpa2VsaWhvb2RzIiwic21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzIiwic21vb3RoZWRfbGlrZWxpaG9vZHMiLCJleHAiLCJpbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzIiwibGlrZWxpZXN0IiwiaGhtbUZpbHRlciIsImNvbmZpZ3VyYXRpb24iLCJkZWZhdWx0X3BhcmFtZXRlcnMiLCJtdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0lBQVlBLFE7Ozs7QUFFWjs7OztBQUlBO0FBQ0E7QUFDQTs7QUFFTyxJQUFNQyx3Q0FBZ0IsU0FBaEJBLGFBQWdCLENBQUNDLEtBQUQsRUFBUUMsQ0FBUixFQUFXQyxJQUFYLEVBQW9CO0FBQ2pEO0FBQ0E7QUFDQTtBQUNFLE1BQU1DLE1BQU1GLEVBQUVHLE1BQUYsQ0FBUyxDQUFULEVBQVlDLFVBQVosQ0FBdUIsQ0FB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RDtBQUNIO0FBQ0MsV0FSRCxNQVFPO0FBQ0xrQyxrQkFBTXJELGlCQUFOLENBQXdCZ0IsQ0FBeEIsS0FDS3FDLE1BQU02QiwrQkFBTixDQUFzQ25GLElBQXRDLElBQ0FzRCxNQUFNSSwwQkFBTixDQUFpQzFELElBQWpDLEVBQ0VDLGlCQURGLENBQ29CZ0IsQ0FEcEIsQ0FGTDtBQUlEO0FBQ0Y7QUFDRjtBQUNGO0FBQ0Y7QUFDRixDQXJGTSIsImZpbGUiOiJoaG1tLXV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZ21tVXRpbHMgZnJvbSAnLi9nbW0tdXRpbHMnO1xuXG4vKipcbiAqICBmdW5jdGlvbnMgdXNlZCBmb3IgZGVjb2RpbmcsIHRyYW5zbGF0ZWQgZnJvbSBYTU1cbiAqL1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgIGFzIGluIHhtbUhtbVNpbmdsZUNsYXNzLmNwcCAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBobW1SZWdyZXNzaW9uID0gKG9ic0luLCBtLCBtUmVzKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgaG1tUmVncmVzc2lvbiA9IChvYnNJbiwgaG1tLCBobW1SZXMpID0+IHtcbi8vICAgY29uc3QgbSA9IGhtbTtcbi8vICAgY29uc3QgbVJlcyA9IGhtbVJlcztcbiAgY29uc3QgZGltID0gbS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5kaW1lbnNpb247XG4gIGNvbnN0IGRpbUluID0gbS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5kaW1lbnNpb25faW5wdXQ7XG4gIGNvbnN0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG4gIGxldCBvdXRDb3ZhclNpemU7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAobS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dDtcbiAgfVxuXG4gIG1SZXMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgbVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICB9XG4gIG1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gIH1cblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsaWtlbGllc3RcbiAgaWYgKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMikge1xuICAgIGdtbVV0aWxzLmdtbUxpa2VsaWhvb2QoXG4gICAgICBvYnNJbixcbiAgICAgIG0uc3RhdGVzW21SZXMubGlrZWxpZXN0X3N0YXRlXSxcbiAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbbVJlcy5saWtlbGllc3Rfc3RhdGVdXG4gICAgKTtcbiAgICBnbW1VdGlscy5nbW1SZWdyZXNzaW9uKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0X3N0YXRlXVxuICAgICk7XG4gICAgbVJlcy5vdXRwdXRfdmFsdWVzXG4gICAgICA9IG0uc3RhdGVzW21SZXMubGlrZWxpZXN0X3N0YXRlXS5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGNsaXBNaW5TdGF0ZSA9IChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT0gMClcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gd2luZG93ZWRcbiAgICAgICAgICAgICAgICAgICAgOiBtUmVzLndpbmRvd19taW5pbmRleDtcblxuICBjb25zdCBjbGlwTWF4U3RhdGUgPSAobS5wYXJhbWV0ZXJzLnJlZ3Jlc3Npb25fZXN0aW1hdG9yID09IDApXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICAgICAgICAgICAgICA/IG0uc3RhdGVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gd2luZG93ZWRcbiAgICAgICAgICAgICAgICAgICAgOiBtUmVzLndpbmRvd19tYXhpbmRleDtcblxuICBsZXQgbm9ybUNvbnN0YW50ID0gKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PSAwKVxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICAgICAgICAgICAgPyAxLjBcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHdpbmRvd2VkXG4gICAgICAgICAgICAgICAgICAgIDogbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcblxuICBpZiAobm9ybUNvbnN0YW50IDw9IDAuMCkge1xuICAgIG5vcm1Db25zdGFudCA9IDEuO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IGNsaXBNaW5TdGF0ZTsgaSA8IGNsaXBNYXhTdGF0ZTsgaSsrKSB7XG4gICAgZ21tVXRpbHMuZ21tTGlrZWxpaG9vZChcbiAgICAgIG9ic0luLFxuICAgICAgbS5zdGF0ZXNbaV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgKTtcbiAgICBnbW1VdGlscy5nbW1SZWdyZXNzaW9uKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1tpXSxcbiAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICApO1xuICAgIGNvbnN0IHRtcFByZWRpY3RlZE91dHB1dFxuICAgICAgPSBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG5cbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IGRpbU91dDsgZCsrKSB7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICAgICAgaWYgKG1SZXMuaGllcmFyY2hpY2FsKSB7XG4gICAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tkXVxuICAgICAgICAgICs9IChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICB0bXBQcmVkaWN0ZWRPdXRwdXRbZF0gLyBub3JtQ29uc3RhbnQ7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICBpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyKyspIHtcbiAgICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXVxuICAgICAgICAgICAgICArPSAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG4gICAgICAgICAgICAgICAgIChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXSAvXG4gICAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICAgIH1cbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICAgKz0gKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgICAgKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2RdIC9cbiAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICB9XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2RdICs9IG1SZXMuYWxwaGFbaV0gKiBcbiAgICAgICAgICAgICAgICAgICAgIHRtcFByZWRpY3RlZE91dHB1dFtkXSAvIG5vcm1Db25zdGFudDtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgIGlmIChtLnBhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgICAgZm9yIChsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIrKykge1xuICAgICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdXG4gICAgICAgICAgICAgICs9ICBtUmVzLmFscGhhW2ldICogbVJlcy5hbHBoYVtpXSAqXG4gICAgICAgICAgICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl0gL1xuICAgICAgICAgICAgICAgIG5vcm1Db25zdGFudDtcbiAgICAgICAgICB9XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdICs9IG1SZXMuYWxwaGFbaV0gKiBtUmVzLmFscGhhW2ldICpcbiAgICAgICAgICAgICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZF0gL1xuICAgICAgICAgICAgICAgICAgICAgICAgIG5vcm1Db25zdGFudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaG1tRm9yd2FyZEluaXQgPSAob2JzSW4sIG0sIG1SZXMsIG9ic091dCA9IFtdKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgaG1tRm9yd2FyZEluaXQgPSAob2JzSW4sIGhtbSwgaG1tUmVzLCBvYnNPdXQgPSBbXSkgPT4ge1xuLy8gICBjb25zdCBtID0gaG1tO1xuLy8gICBjb25zdCBtUmVzID0gaG1tUmVzO1xuICBjb25zdCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgbGV0IG5vcm1Db25zdCA9IDAuMDtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVyZ29kaWMgICAgICAgIFxuICBpZiAobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PT0gMCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbCAgICAgICAgXG4gICAgICBpZiAobS5zdGF0ZXNbaV0uY29tcG9uZW50c1swXS5iaW1vZGFsKSB7XG4gICAgICAgIGlmIChvYnNPdXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIG1SZXMuYWxwaGFbaV0gPSBtLnByaW9yW2ldICpcbiAgICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JzT3V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbaV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1SZXMuYWxwaGFbaV0gPSBtLnByaW9yW2ldICpcbiAgICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsICAgICAgICBcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gPSBtLnByaW9yW2ldICpcbiAgICAgICAgICAgICAgICBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1tpXSk7XG4gICAgICB9XG4gICAgICBub3JtQ29uc3QgKz0gbVJlcy5hbHBoYVtpXTtcbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGVmdC1yaWdodCAgICAgICAgXG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtUmVzLmFscGhhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBtUmVzLmFscGhhW2ldID0gMC4wO1xuICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsICAgICAgICBcbiAgICBpZiAobS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5iaW1vZGFsKSB7XG4gICAgICBpZiAob2JzT3V0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgbVJlcy5hbHBoYVswXSA9IGdtbVV0aWxzLmdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ic091dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1swXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhWzBdID0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1swXSk7XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB1bmltb2RhbCAgICAgICAgXG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMuYWxwaGFbMF0gPSBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1swXSk7XG4gICAgfVxuICAgIG5vcm1Db25zdCArPSBtUmVzLmFscGhhWzBdO1xuICB9XG5cbiAgaWYgKG5vcm1Db25zdCA+IDApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgICAgbVJlcy5hbHBoYVtpXSAvPSBub3JtQ29uc3Q7XG4gICAgfVxuICAgIHJldHVybiAoMS4wIC8gbm9ybUNvbnN0KTtcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgICAgbVJlcy5hbHBoYVtpXSA9IDEuMCAvIG5zdGF0ZXM7XG4gICAgfVxuICAgIHJldHVybiAxLjA7XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbUZvcndhcmRVcGRhdGUgPSAob2JzSW4sIG0sIG1SZXMsIG9ic091dCA9IFtdKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgaG1tRm9yd2FyZFVwZGF0ZSA9IChvYnNJbiwgaG1tLCBobW1SZXMsIG9ic091dCA9IFtdKSA9PiB7XG4vLyAgIGNvbnN0IG0gPSBobW07XG4vLyAgIGNvbnN0IG1SZXMgPSBobW1SZXM7XG4gIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICBsZXQgbm9ybUNvbnN0ID0gMC4wO1xuXG4gIG1SZXMucHJldmlvdXNfYWxwaGEgPSBtUmVzLmFscGhhLnNsaWNlKDApO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgIG1SZXMuYWxwaGFbaV0gPSAwO1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVyZ29kaWNcbiAgICBpZiAobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PT0gMCkge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcbiAgICAgICAgbVJlcy5hbHBoYVtpXSArPSBtUmVzLnByZXZpb3VzX2FscGhhW2pdICpcbiAgICAgICAgICAgICAgICAgbVJlcy50cmFuc2l0aW9uW2ogKiBuc3RhdGVzKyBpXTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsZWZ0LXJpZ2h0XG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtpXSAqIG1SZXMudHJhbnNpdGlvbltpICogMl07XG4gICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgbVJlcy5hbHBoYVtpXSArPSBtUmVzLnByZXZpb3VzX2FscGhhW2kgLSAxXSAqXG4gICAgICAgICAgICAgICAgIG1SZXMudHJhbnNpdGlvblsoaSAtIDEpICogMiArIDFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5hbHBoYVswXSArPSBtUmVzLnByZXZpb3VzX2FscGhhW25zdGF0ZXMgLSAxXSAqXG4gICAgICAgICAgICAgICAgIG1SZXMudHJhbnNpdGlvbltuc3RhdGVzICogMiAtIDFdO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWwgICAgICAgIFxuICAgIGlmIChtLnN0YXRlc1tpXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcbiAgICAgIGlmIChvYnNPdXQubGVuZ3RoID4gMCkge1xuICAgICAgICBtUmVzLmFscGhhW2ldICo9IGdtbVV0aWxzLmdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JzT3V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbaV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5hbHBoYVtpXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1tpXSk7XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB1bmltb2RhbCAgICAgICAgXG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbaV0pO1xuICAgIH1cbiAgICBub3JtQ29uc3QgKz0gbVJlcy5hbHBoYVtpXTtcbiAgfVxuXG4gIGlmIChub3JtQ29uc3QgPiAxZS0zMDApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgICAgbVJlcy5hbHBoYVtpXSAvPSBub3JtQ29uc3Q7XG4gICAgfVxuICAgIHJldHVybiAoMS4wIC8gbm9ybUNvbnN0KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gMC4wO1xuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1VcGRhdGVBbHBoYVdpbmRvdyA9IChtLCBtUmVzKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgaG1tVXBkYXRlQWxwaGFXaW5kb3cgPSAoaG1tLCBobW1SZXMpID0+IHtcbi8vICAgY29uc3QgbSA9IGhtbTtcbi8vICAgY29uc3QgbVJlcyA9IGhtbVJlcztcbiAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gIFxuICBtUmVzLmxpa2VsaWVzdF9zdGF0ZSA9IDA7XG5cbiAgbGV0IGJlc3RfYWxwaGE7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICBpZiAobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkge1xuICAgIGJlc3RfYWxwaGEgPSBtUmVzLmFscGhhX2hbMF1bMF0gKyBtUmVzLmFscGhhX2hbMV1bMF07XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICB9IGVsc2Uge1xuICAgIGJlc3RfYWxwaGEgPSBtUmVzLmFscGhhWzBdOyBcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICAgIGlmIChtLnBhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgICBpZiAoKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgPiBiZXN0X2FscGhhKSB7XG4gICAgICAgIGJlc3RfYWxwaGEgPSBtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV07XG4gICAgICAgIG1SZXMubGlrZWxpZXN0X3N0YXRlID0gaTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBub24taGllcmFyY2hpY2FsICAgICAgICBcbiAgICB9IGVsc2Uge1xuICAgICAgaWYobVJlcy5hbHBoYVtpXSA+IGJlc3RfYWxwaGEpIHtcbiAgICAgICAgYmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFbMF07XG4gICAgICAgIG1SZXMubGlrZWxpZXN0X3N0YXRlID0gaTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBtUmVzLndpbmRvd19taW5pbmRleCA9IG1SZXMubGlrZWxpZXN0X3N0YXRlIC0gbnN0YXRlcyAvIDI7XG4gIG1SZXMud2luZG93X21heGluZGV4ID0gbVJlcy5saWtlbGllc3Rfc3RhdGUgKyBuc3RhdGVzIC8gMjtcbiAgbVJlcy53aW5kb3dfbWluaW5kZXggPSAobVJlcy53aW5kb3dfbWluaW5kZXggPj0gMClcbiAgICAgICAgICAgICA/IG1SZXMud2luZG93X21pbmluZGV4XG4gICAgICAgICAgICAgOiAwO1xuICBtUmVzLndpbmRvd19tYXhpbmRleCA9IChtUmVzLndpbmRvd19tYXhpbmRleCA8PSBuc3RhdGVzKVxuICAgICAgICAgICAgID8gbVJlcy53aW5kb3dfbWF4aW5kZXhcbiAgICAgICAgICAgICA6IG5zdGF0ZXM7XG4gIG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQgPSAwO1xuICBmb3IgKGxldCBpID0gbVJlcy53aW5kb3dfbWluaW5kZXg7IGkgPCBtUmVzLndpbmRvd19tYXhpbmRleDsgaSsrKSB7XG4gICAgbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudFxuICAgICAgKz0gKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSk7XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbVVwZGF0ZVJlc3VsdHMgPSAobSwgbVJlcykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGhtbVVwZGF0ZVJlc3VsdHMgPSAoaG1tLCBobW1SZXMpID0+IHtcbi8vICAgY29uc3QgbSA9IGhtbTtcbi8vICAgY29uc3QgbVJlcyA9IGhtbVJlcztcblxuICAvLyBJUyBUSElTIENPUlJFQ1QgID8gVE9ETyA6IENIRUNLIEFHQUlOIChzZWVtcyB0byBoYXZlIHByZWNpc2lvbiBpc3N1ZXMpXG4gIC8vIEFIQSAhIDogTk9STUFMTFkgTElLRUxJSE9PRF9CVUZGRVIgSVMgQ0lSQ1VMQVIgOiBJUyBJVCBUSEUgQ0FTRSBIRVJFID9cbiAgLy8gU0hPVUxEIEkgXCJQT1BfRlJPTlRcIiA/IChzZWVtcyB0aGF0IHllcylcblxuICAvL3Jlcy5saWtlbGlob29kX2J1ZmZlci5wdXNoKE1hdGgubG9nKHJlcy5pbnN0YW50X2xpa2VsaWhvb2QpKTtcblxuICAvLyBOT1cgVEhJUyBJUyBCRVRURVIgKFNIT1VMRCBXT1JLIEFTIElOVEVOREVEKVxuICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW21SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhdXG4gICAgPSBNYXRoLmxvZyhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCk7XG4gIG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhcbiAgICA9IChtUmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4ICsgMSkgJSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDtcblxuICBtUmVzLmxvZ19saWtlbGlob29kID0gMDtcbiAgY29uc3QgYnVmU2l6ZSA9IG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGJ1ZlNpemU7IGkrKykge1xuICAgIG1SZXMubG9nX2xpa2VsaWhvb2QgKz0gbVJlcy5saWtlbGlob29kX2J1ZmZlcltpXTtcbiAgfVxuICBtUmVzLmxvZ19saWtlbGlob29kIC89IGJ1ZlNpemU7XG5cbiAgbVJlcy5wcm9ncmVzcyA9IDA7XG4gIGZvciAobGV0IGkgPSBtUmVzLndpbmRvd19taW5pbmRleDsgaSA8IG1SZXMud2luZG93X21heGluZGV4OyBpKyspIHtcbiAgICBpZiAobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkgeyAvLyBoaWVyYXJjaGljYWxcbiAgICAgIG1SZXMucHJvZ3Jlc3NcbiAgICAgICAgKz0gKFxuICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2ldICtcbiAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsxXVtpXSArXG4gICAgICAgICAgICBtUmVzLmFscGhhX2hbMl1baV1cbiAgICAgICAgICApICpcbiAgICAgICAgICBpIC8gbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcbiAgICB9IGVsc2UgeyAvLyBub24gaGllcmFyY2hpY2FsXG4gICAgICBtUmVzLnByb2dyZXNzICs9IG1SZXMuYWxwaGFbaV0gKlxuICAgICAgICAgICAgICAgaSAvIG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQ7XG4gICAgfVxuICB9XG4gIG1SZXMucHJvZ3Jlc3MgLz0gKG0ucGFyYW1ldGVycy5zdGF0ZXMgLSAxKTtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbUZpbHRlciA9IChvYnNJbiwgbSwgbVJlcykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGhtbUZpbHRlciA9IChvYnNJbiwgaG1tLCBobW1SZXMpID0+IHtcbi8vICAgY29uc3QgbSA9IGhtbTtcbi8vICAgY29uc3QgbVJlcyA9IGhtbVJlcztcbiAgbGV0IGN0ID0gMC4wO1xuICBpZiAobVJlcy5mb3J3YXJkX2luaXRpYWxpemVkKSB7XG4gICAgY3QgPSBobW1Gb3J3YXJkVXBkYXRlKG9ic0luLCBtLCBtUmVzKTtcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoOyBqKyspIHtcbiAgICAgIG1SZXMubGlrZWxpaG9vZF9idWZmZXJbal0gPSAwLjA7XG4gICAgfVxuICAgIGN0ID0gaG1tRm9yd2FyZEluaXQob2JzSW4sIG0sIG1SZXMpO1xuICAgIG1SZXMuZm9yd2FyZF9pbml0aWFsaXplZCA9IHRydWU7XG4gIH1cblxuICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCA9IDEuMCAvIGN0O1xuICBobW1VcGRhdGVBbHBoYVdpbmRvdyhtLCBtUmVzKTtcbiAgaG1tVXBkYXRlUmVzdWx0cyhtLCBtUmVzKTtcblxuICBpZiAobS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5iaW1vZGFsKSB7XG4gICAgaG1tUmVncmVzc2lvbihvYnNJbiwgbSwgbVJlcyk7XG4gIH1cblxuICByZXR1cm4gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG59O1xuXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICBhcyBpbiB4bW1IaWVyYXJjaGljYWxIbW0uY3BwICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGhobW1MaWtlbGlob29kQWxwaGEgPSAoZXhpdE51bSwgbGlrZWxpaG9vZFZlYywgaG0sIGhtUmVzKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgaGhtbUxpa2VsaWhvb2RBbHBoYSA9IChleGl0TnVtLCBsaWtlbGlob29kVmVjLCBoaG1tLCBoaG1tUmVzKSA9PiB7XG4vLyAgIGNvbnN0IG0gPSBoaG1tO1xuLy8gICBjb25zdCBtUmVzID0gaGhtbVJlcztcblxuICBpZiAoZXhpdE51bSA8IDApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgbGlrZWxpaG9vZFZlY1tpXSA9IDA7XG4gICAgICBmb3IgKGxldCBleGl0ID0gMDsgZXhpdCA8IDM7IGV4aXQrKykge1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlczsgaysrKSB7XG4gICAgICAgICAgbGlrZWxpaG9vZFZlY1tpXVxuICAgICAgICAgICAgKz0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtleGl0XVtrXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgbGlrZWxpaG9vZFZlY1tpXSA9IDA7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlczsgaysrKSB7XG4gICAgICAgIGxpa2VsaWhvb2RWZWNbaV1cbiAgICAgICAgICArPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oW2V4aXROdW1dW2tdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IEZPUldBUkQgSU5JVFxuXG5leHBvcnQgY29uc3QgaGhtbUZvcndhcmRJbml0ID0gKG9ic0luLCBobSwgaG1SZXMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBoaG1tRm9yd2FyZEluaXQgPSAob2JzSW4sIGhobW0sIGhobW1SZXMpID0+IHtcbi8vICAgY29uc3QgaG0gPSBoaG1tO1xuLy8gICBjb25zdCBobVJlcyA9IGhobW1SZXM7XG4gIGxldCBub3JtX2NvbnN0ID0gMDtcblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IGluaXRpYWxpemUgYWxwaGFzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICBjb25zdCBtID0gaG0ubW9kZWxzW2ldO1xuICAgIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICAgIGNvbnN0IG1SZXMgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICBtUmVzLmFscGhhX2hbal0gPSBuZXcgQXJyYXkobnN0YXRlcyk7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICBtUmVzLmFscGhhX2hbal1ba10gPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVyZ29kaWNcbiAgICBpZiAobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PSAwKSB7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWxcbiAgICAgICAgaWYgKGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcbiAgICAgICAgICBtUmVzLmFscGhhX2hbMF1ba10gPSBtLnByaW9yW2tdICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sIG0uc3RhdGVzW2tdKTtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2tdID0gbS5wcmlvcltrXSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNba10pO1xuICAgICAgICB9XG4gICAgICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kICs9IG1SZXMuYWxwaGFfaFswXVtrXTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsZWZ0LXJpZ2h0XG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMuYWxwaGFfaFswXVswXSA9IGhtLnByaW9yW2ldO1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWxcbiAgICAgIGlmIChobS5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG4gICAgICAgIG1SZXMuYWxwaGFfaFswXVswXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sIG0uc3RhdGVzWzBdKTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhX2hbMF1bMF0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbMF0pO1xuICAgICAgfVxuICAgICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSBtUmVzLmFscGhhX2hbMF1bMF07XG4gICAgfVxuICAgIG5vcm1fY29uc3QgKz0gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBub3JtYWxpemUgYWxwaGFzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICBjb25zdCBuc3RhdGVzID0gaG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzO1xuICAgIGZvciAobGV0IGUgPSAwOyBlIDwgMzsgZSsrKSB7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oW2VdW2tdIC89IG5vcm1fY29uc3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaG1SZXMuZm9yd2FyZF9pbml0aWFsaXplZCA9IHRydWU7XG59O1xuXG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IEZPUldBUkQgVVBEQVRFXG5cbmV4cG9ydCBjb25zdCBoaG1tRm9yd2FyZFVwZGF0ZSA9IChvYnNJbiwgaG0sIGhtUmVzKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgaGhtbUZvcndhcmRVcGRhdGUgPSAob2JzSW4sIGhobW0sIGhobW1SZXMpID0+IHtcbi8vICAgY29uc3QgaG0gPSBoaG1tO1xuLy8gICBjb25zdCBobVJlcyA9IGhobW1SZXM7XG4gIGNvbnN0IG5tb2RlbHMgPSBobS5tb2RlbHMubGVuZ3RoO1xuXG4gIGxldCBub3JtX2NvbnN0ID0gMDtcbiAgbGV0IHRtcCA9IDA7XG4gIGxldCBmcm9udDsgLy8gYXJyYXlcblxuICBoaG1tTGlrZWxpaG9vZEFscGhhKDEsIGhtUmVzLmZyb250aWVyX3YxLCBobSwgaG1SZXMpO1xuICBoaG1tTGlrZWxpaG9vZEFscGhhKDIsIGhtUmVzLmZyb250aWVyX3YyLCBobSwgaG1SZXMpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm1vZGVsczsgaSsrKSB7XG5cbiAgICBjb25zdCBtID0gaG0ubW9kZWxzW2ldO1xuICAgIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICAgIGNvbnN0IG1SZXMgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXTtcbiAgICBcbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09IGNvbXB1dGUgZnJvbnRpZXIgdmFyaWFibGVcbiAgICBmcm9udCA9IG5ldyBBcnJheShuc3RhdGVzKTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5zdGF0ZXM7IGorKykge1xuICAgICAgZnJvbnRbal0gPSAwO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVyZ29kaWNcbiAgICBpZiAobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PSAwKSB7IC8vIGVyZ29kaWNcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnN0YXRlczsgaisrKSB7XG4gICAgICAgICAgZnJvbnRba10gKz0gbS50cmFuc2l0aW9uW2ogKiBuc3RhdGVzICsga10gL1xuICAgICAgICAgICAgICAgICgxIC0gbS5leGl0UHJvYmFiaWxpdGllc1tqXSkgKlxuICAgICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtqXTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBzcmNpID0gMDsgc3JjaSA8IG5tb2RlbHM7IHNyY2krKykge1xuICAgICAgICAgIGZyb250W2tdICs9IG0ucHJpb3Jba10gKlxuICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgIGhtUmVzLmZyb250aWVyX3YxW3NyY2ldICpcbiAgICAgICAgICAgICAgICAgIGhtLnRyYW5zaXRpb25bc3JjaV1baV1cbiAgICAgICAgICAgICAgICAgICsgaG1SZXMuZnJvbnRpZXJfdjJbc3JjaV0gKlxuICAgICAgICAgICAgICAgICAgaG0ucHJpb3JbaV1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGVmdC1yaWdodFxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBrID09IDAgOiBmaXJzdCBzdGF0ZSBvZiB0aGUgcHJpbWl0aXZlXG4gICAgICBmcm9udFswXSA9IG0udHJhbnNpdGlvblswXSAqIG1SZXMuYWxwaGFfaFswXVswXTtcblxuICAgICAgZm9yIChsZXQgc3JjaSA9IDA7IHNyY2kgPCBubW9kZWxzOyBzcmNpKyspIHtcbiAgICAgICAgZnJvbnRbMF0gKz0gaG1SZXMuZnJvbnRpZXJfdjFbc3JjaV0gKlxuICAgICAgICAgICAgICBobS50cmFuc2l0aW9uW3NyY2ldW2ldXG4gICAgICAgICAgICAgICsgaG1SZXMuZnJvbnRpZXJfdjJbc3JjaV0gKlxuICAgICAgICAgICAgICBobS5wcmlvcltpXTtcbiAgICAgIH1cblxuICAgICAgLy8gayA+IDAgOiByZXN0IG9mIHRoZSBwcmltaXRpdmVcbiAgICAgIGZvciAobGV0IGsgPSAxOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgIGZyb250W2tdICs9IG0udHJhbnNpdGlvbltrICogMl0gL1xuICAgICAgICAgICAgICAoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNba10pICpcbiAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2tdO1xuICAgICAgICBmcm9udFtrXSArPSBtLnRyYW5zaXRpb25bKGsgLSAxKSAqIDIgKyAxXSAvXG4gICAgICAgICAgICAgICgxIC0gbS5leGl0UHJvYmFiaWxpdGllc1trIC0gMV0pICpcbiAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2sgLSAxXTtcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgICBtUmVzLmFscGhhX2hbal1ba10gPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vY29uc29sZS5sb2coZnJvbnQpO1xuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09IHVwZGF0ZSBmb3J3YXJkIHZhcmlhYmxlXG4gICAgbVJlcy5leGl0X2xpa2VsaWhvb2QgPSAwO1xuICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gMDtcblxuICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgICAgICB0bXAgPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sIG0uc3RhdGVzW2tdKSAqXG4gICAgICAgICAgICBmcm9udFtrXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRtcCA9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2tdKSAqIGZyb250W2tdO1xuICAgICAgfVxuXG4gICAgICBtUmVzLmFscGhhX2hbMl1ba10gPSBobS5leGl0X3RyYW5zaXRpb25baV0gKlxuICAgICAgICAgICAgICAgICBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdICogdG1wO1xuICAgICAgbVJlcy5hbHBoYV9oWzFdW2tdID0gKDEgLSBobS5leGl0X3RyYW5zaXRpb25baV0pICpcbiAgICAgICAgICAgICAgICAgbS5leGl0UHJvYmFiaWxpdGllc1trXSAqIHRtcDtcbiAgICAgIG1SZXMuYWxwaGFfaFswXVtrXSA9ICgxIC0gbS5leGl0UHJvYmFiaWxpdGllc1trXSkgKiB0bXA7XG5cbiAgICAgIG1SZXMuZXhpdF9saWtlbGlob29kICs9IG1SZXMuYWxwaGFfaFsxXVtrXSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMl1ba107XG4gICAgICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCArPSBtUmVzLmFscGhhX2hbMF1ba10gK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzFdW2tdICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsyXVtrXTtcblxuICAgICAgbm9ybV9jb25zdCArPSB0bXA7XG4gICAgfVxuXG4gICAgbVJlcy5leGl0X3JhdGlvID0gbVJlcy5leGl0X2xpa2VsaWhvb2QgLyBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IG5vcm1hbGl6ZSBhbHBoYXNcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBubW9kZWxzOyBpKyspIHtcbiAgICBmb3IgKGxldCBlID0gMDsgZSA8IDM7IGUrKykge1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBobS5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7IGsrKykge1xuICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oW2VdW2tdIC89IG5vcm1fY29uc3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBoaG1tVXBkYXRlUmVzdWx0cyA9IChobSwgaG1SZXMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBoaG1tVXBkYXRlUmVzdWx0cyA9IChoaG1tLCBoaG1tUmVzKSA9PiB7XG4vLyAgIGNvbnN0IGhtID0gaGhtbTtcbi8vICAgY29uc3QgaG1SZXMgPSBoaG1tUmVzO1xuXG4gIGxldCBtYXhsb2dfbGlrZWxpaG9vZCA9IDA7XG4gIGxldCBub3JtY29uc3RfaW5zdGFudCA9IDA7XG4gIGxldCBub3JtY29uc3Rfc21vb3RoZWQgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICBsZXQgbVJlcyA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldO1xuXG4gICAgaG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXSA9IG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xuICAgIGhtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA9IG1SZXMubG9nX2xpa2VsaWhvb2Q7XG4gICAgaG1SZXMuc21vb3RoZWRfbGlrZWxpaG9vZHNbaV0gPSBNYXRoLmV4cChobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0pO1xuXG4gICAgaG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gaG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXTtcbiAgICBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gaG1SZXMuc21vb3RoZWRfbGlrZWxpaG9vZHNbaV07XG5cbiAgICBub3JtY29uc3RfaW5zdGFudCAgICs9IGhtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcbiAgICBub3JtY29uc3Rfc21vb3RoZWQgICs9IGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG5cbiAgICBpZiAoaSA9PSAwIHx8IGhtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA+IG1heGxvZ19saWtlbGlob29kKSB7XG4gICAgICBtYXhsb2dfbGlrZWxpaG9vZCA9IGhtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXTtcbiAgICAgIGhtUmVzLmxpa2VsaWVzdCA9IGk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICBobVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gLz0gbm9ybWNvbnN0X2luc3RhbnQ7XG4gICAgaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAvPSBub3JtY29uc3Rfc21vb3RoZWQ7XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhobW1GaWx0ZXIgPSAob2JzSW4sIGhtLCBobVJlcykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGhobW1GaWx0ZXIgPSAob2JzSW4sIGhobW0sIGhobW1SZXMpID0+IHtcbi8vICAgY29uc3QgaG0gPSBoaG1tO1xuLy8gICBjb25zdCBobVJlcyA9IGhobW1SZXM7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gIGlmIChobS5jb25maWd1cmF0aW9uLmRlZmF1bHRfcGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHtcbiAgICBpZiAoaG1SZXMuZm9yd2FyZF9pbml0aWFsaXplZCkge1xuICAgICAgaGhtbUZvcndhcmRVcGRhdGUob2JzSW4sIGhtLCBobVJlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhobW1Gb3J3YXJkSW5pdChvYnNJbiwgaG0sIGhtUmVzKTtcbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBobVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldID0gaG1tRmlsdGVyKG9ic0luLCBobSwgaG1SZXMpO1xuICAgIH1cbiAgfVxuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0gY29tcHV0ZSB0aW1lIHByb2dyZXNzaW9uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgaG1tVXBkYXRlQWxwaGFXaW5kb3coXG4gICAgICBobS5tb2RlbHNbaV0sXG4gICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuICAgICk7XG4gICAgaG1tVXBkYXRlUmVzdWx0cyhcbiAgICAgIGhtLm1vZGVsc1tpXSxcbiAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldXG4gICAgKTtcbiAgfVxuXG4gIGhobW1VcGRhdGVSZXN1bHRzKGhtLCBobVJlcyk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG4gIGlmIChobS5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG4gICAgY29uc3QgZGltID0gaG0uc2hhcmVkX3BhcmFtZXRlcnMuZGltZW5zaW9uO1xuICAgIGNvbnN0IGRpbUluID0gaG0uc2hhcmVkX3BhcmFtZXRlcnMuZGltZW5zaW9uX2lucHV0O1xuICAgIGNvbnN0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGhtbVJlZ3Jlc3Npb24ob2JzSW4sIGhtLm1vZGVsc1tpXSwgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsaWtlbGllc3RcbiAgICBpZiAoaG0uY29uZmlndXJhdGlvbi5tdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yID09PSAwKSB7XG4gICAgICBobVJlcy5vdXRwdXRfdmFsdWVzXG4gICAgICAgID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaG1SZXMubGlrZWxpZXN0XVxuICAgICAgICAgICAgICAgLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG4gICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVxuICAgICAgICA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2htUmVzLmxpa2VsaWVzdF1cbiAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZS5zbGljZSgwKTtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtaXh0dXJlXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG1SZXMub3V0cHV0X3ZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBobVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobVJlcy5vdXRwdXRfY292YXJpYW5jZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVtpXSA9IDAuMDtcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgICAgIGhtUmVzLm91dHB1dF92YWx1ZXNbZF1cbiAgICAgICAgICAgICs9IGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gKlxuICAgICAgICAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0ub3V0cHV0X3ZhbHVlc1tkXTtcblxuICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICBpZiAoaG0uY29uZmlndXJhdGlvbi5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyICsrKSB7XG4gICAgICAgICAgICAgIGhtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl1cbiAgICAgICAgICAgICAgICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcbiAgICAgICAgICAgICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGhtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdXG4gICAgICAgICAgICAgICs9IGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gKlxuICAgICAgICAgICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2RdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbiJdfQ==