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
  var obsOut = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

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
  var obsOut = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

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
        for (var _k = 0; _k < hm.models[i].parameters.states; _k++) {
          likelihoodVec[i] += hmRes.singleClassHmmModelResults[i].alpha_h[exit][_k];
        }
      }
    }
  } else {
    for (var _i9 = 0; _i9 < hm.models.length; _i9++) {
      likelihoodVec[_i9] = 0;
      for (var _k2 = 0; _k2 < hm.models[_i9].parameters.states; _k2++) {
        likelihoodVec[_i9] += hmRes.singleClassHmmModelResults[_i9].alpha_h[exitNum][_k2];
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
      for (var _k3 = 0; _k3 < nstates; _k3++) {
        mRes.alpha_h[j][_k3] = 0;
      }
    }

    //------------------------------------------------------------------ ergodic
    if (m.parameters.transition_mode == 0) {
      for (var _k4 = 0; _k4 < nstates; _k4++) {
        //-------------------------------------------------------------- bimodal
        if (hm.shared_parameters.bimodal) {
          mRes.alpha_h[0][_k4] = m.prior[_k4] * gmmUtils.gmmObsProbInput(obsIn, m.states[_k4]);
          //------------------------------------------------------------- unimodal
        } else {
          mRes.alpha_h[0][_k4] = m.prior[_k4] * gmmUtils.gmmObsProb(obsIn, m.states[_k4]);
        }
        mRes.instant_likelihood += mRes.alpha_h[0][_k4];
      }
      //--------------------------------------------------------------- left-right
    } else {
      mRes.alpha_h[0][0] = hm.prior[i];
      //---------------------------------------------------------------- bimodal
      if (hm.shared_parameters.bimodal) {
        mRes.alpha_h[0][0] *= gmmUtils.gmmObsProbInput(obsIn, m.states[k]);
        //--------------------------------------------------------------- unimodal
      } else {
        mRes.alpha_h[0][0] *= gmmUtils.gmmObsProb(obsIn, m.states[k]);
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
      for (var _k6 = 0; _k6 < nstates; _k6++) {
        for (var _j = 0; _j < nstates; _j++) {
          front[_k6] += m.transition[_j * nstates + _k6] / (1 - m.exitProbabilities[_j]) * mRes.alpha_h[0][_j];
        }
        for (var srci = 0; srci < nmodels; srci++) {
          front[_k6] += m.prior[_k6] * (hmRes.frontier_v1[srci] * hm.transition[srci][i] + hmRes.frontier_v2[srci] * hm.prior[i]);
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
        tmp = gmmUtils.gmmObsProbInput(obsIn, m.states[_k9]) * front[_k9];
      } else {
        tmp = gmmUtils.gmmObsProb(obsIn, m.states[_k9]) * front[_k9];
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
//# sourceMappingURL=data:application/json;base64,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bS11dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGdtbVV0aWxzIGZyb20gJy4vZ21tLXV0aWxzJztcblxuLyoqXG4gKiAgZnVuY3Rpb25zIHVzZWQgZm9yIGRlY29kaW5nLCB0cmFuc2xhdGVkIGZyb20gWE1NXG4gKi9cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyAgICBhcyBpbiB4bW1IbW1TaW5nbGVDbGFzcy5jcHAgICAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5leHBvcnQgY29uc3QgaG1tUmVncmVzc2lvbiA9IChvYnNJbiwgbSwgbVJlcykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGhtbVJlZ3Jlc3Npb24gPSAob2JzSW4sIGhtbSwgaG1tUmVzKSA9PiB7XG4vLyAgIGNvbnN0IG0gPSBobW07XG4vLyAgIGNvbnN0IG1SZXMgPSBobW1SZXM7XG4gIGNvbnN0IGRpbSA9IG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uZGltZW5zaW9uO1xuICBjb25zdCBkaW1JbiA9IG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uZGltZW5zaW9uX2lucHV0O1xuICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICBsZXQgb3V0Q292YXJTaXplO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgb3V0Q292YXJTaXplID0gZGltT3V0ICogZGltT3V0O1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQ7XG4gIH1cblxuICBtUmVzLm91dHB1dF92YWx1ZXMgPSBuZXcgQXJyYXkoZGltT3V0KTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgfVxuICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlID0gbmV3IEFycmF5KG91dENvdmFyU2l6ZSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0Q292YXJTaXplOyBpKyspIHtcbiAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuICB9XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGlrZWxpZXN0XG4gIGlmIChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT09IDIpIHtcbiAgICBnbW1VdGlscy5nbW1MaWtlbGlob29kKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0X3N0YXRlXVxuICAgICk7XG4gICAgZ21tVXRpbHMuZ21tUmVncmVzc2lvbihcbiAgICAgIG9ic0luLFxuICAgICAgbS5zdGF0ZXNbbVJlcy5saWtlbGllc3Rfc3RhdGVdLFxuICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV1cbiAgICApO1xuICAgIG1SZXMub3V0cHV0X3ZhbHVlc1xuICAgICAgPSBtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0ub3V0cHV0X3ZhbHVlcy5zbGljZSgwKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjbGlwTWluU3RhdGUgPSAobS5wYXJhbWV0ZXJzLnJlZ3Jlc3Npb25fZXN0aW1hdG9yID09IDApXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHdpbmRvd2VkXG4gICAgICAgICAgICAgICAgICAgIDogbVJlcy53aW5kb3dfbWluaW5kZXg7XG5cbiAgY29uc3QgY2xpcE1heFN0YXRlID0gKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PSAwKVxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICAgICAgICAgICAgPyBtLnN0YXRlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHdpbmRvd2VkXG4gICAgICAgICAgICAgICAgICAgIDogbVJlcy53aW5kb3dfbWF4aW5kZXg7XG5cbiAgbGV0IG5vcm1Db25zdGFudCA9IChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT0gMClcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgICAgICAgICAgID8gMS4wXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB3aW5kb3dlZFxuICAgICAgICAgICAgICAgICAgICA6IG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQ7XG5cbiAgaWYgKG5vcm1Db25zdGFudCA8PSAwLjApIHtcbiAgICBub3JtQ29uc3RhbnQgPSAxLjtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSBjbGlwTWluU3RhdGU7IGkgPCBjbGlwTWF4U3RhdGU7IGkrKykge1xuICAgIGdtbVV0aWxzLmdtbUxpa2VsaWhvb2QoXG4gICAgICBvYnNJbixcbiAgICAgIG0uc3RhdGVzW2ldLFxuICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuICAgICk7XG4gICAgZ21tVXRpbHMuZ21tUmVncmVzc2lvbihcbiAgICAgIG9ic0luLFxuICAgICAgbS5zdGF0ZXNbaV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgKTtcbiAgICBjb25zdCB0bXBQcmVkaWN0ZWRPdXRwdXRcbiAgICAgID0gbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXS5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuXG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcbiAgICAgIGlmIChtUmVzLmhpZXJhcmNoaWNhbCkge1xuICAgICAgICBtUmVzLm91dHB1dF92YWx1ZXNbZF1cbiAgICAgICAgICArPSAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG4gICAgICAgICAgICAgdG1wUHJlZGljdGVkT3V0cHV0W2RdIC8gbm9ybUNvbnN0YW50O1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgaWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG4gICAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl1cbiAgICAgICAgICAgICAgKz0gKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgICAgICAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG4gICAgICAgICAgICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl0gL1xuICAgICAgICAgICAgICAgIG5vcm1Db25zdGFudDtcbiAgICAgICAgICB9XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF1cbiAgICAgICAgICAgICs9IChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICAgIChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkXSAvXG4gICAgICAgICAgICAgIG5vcm1Db25zdGFudDtcbiAgICAgICAgfVxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWxcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tkXSArPSBtUmVzLmFscGhhW2ldICogXG4gICAgICAgICAgICAgICAgICAgICB0bXBQcmVkaWN0ZWRPdXRwdXRbZF0gLyBub3JtQ29uc3RhbnQ7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICBpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyKyspIHtcbiAgICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXVxuICAgICAgICAgICAgICArPSAgbVJlcy5hbHBoYVtpXSAqIG1SZXMuYWxwaGFbaV0gKlxuICAgICAgICAgICAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdIC9cbiAgICAgICAgICAgICAgICBub3JtQ29uc3RhbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXSArPSBtUmVzLmFscGhhW2ldICogbVJlcy5hbHBoYVtpXSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2RdIC9cbiAgICAgICAgICAgICAgICAgICAgICAgICBub3JtQ29uc3RhbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbUZvcndhcmRJbml0ID0gKG9ic0luLCBtLCBtUmVzLCBvYnNPdXQgPSBbXSkgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGhtbUZvcndhcmRJbml0ID0gKG9ic0luLCBobW0sIGhtbVJlcywgb2JzT3V0ID0gW10pID0+IHtcbi8vICAgY29uc3QgbSA9IGhtbTtcbi8vICAgY29uc3QgbVJlcyA9IGhtbVJlcztcbiAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gIGxldCBub3JtQ29uc3QgPSAwLjA7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBlcmdvZGljICAgICAgICBcbiAgaWYgKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT09IDApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWwgICAgICAgIFxuICAgICAgaWYgKG0uc3RhdGVzW2ldLmNvbXBvbmVudHNbMF0uYmltb2RhbCkge1xuICAgICAgICBpZiAob2JzT3V0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBtUmVzLmFscGhhW2ldID0gbS5wcmlvcltpXSAqXG4gICAgICAgICAgICAgICAgICBnbW1VdGlscy5nbW1PYnNQcm9iQmltb2RhbChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ic091dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2ldKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtUmVzLmFscGhhW2ldID0gbS5wcmlvcltpXSAqXG4gICAgICAgICAgICAgICAgICBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbaV0pO1xuICAgICAgICB9XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB1bmltb2RhbCAgICAgICAgXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhW2ldID0gbS5wcmlvcltpXSAqXG4gICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbaV0pO1xuICAgICAgfVxuICAgICAgbm9ybUNvbnN0ICs9IG1SZXMuYWxwaGFbaV07XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxlZnQtcmlnaHQgICAgICAgIFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbVJlcy5hbHBoYS5sZW5ndGg7IGkrKykge1xuICAgICAgbVJlcy5hbHBoYVtpXSA9IDAuMDtcbiAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbCAgICAgICAgXG4gICAgaWYgKG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uYmltb2RhbCkge1xuICAgICAgaWYgKG9ic091dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIG1SZXMuYWxwaGFbMF0gPSBnbW1VdGlscy5nbW1PYnNQcm9iQmltb2RhbChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNPdXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbMF0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5hbHBoYVswXSA9IGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbMF0pO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWwgICAgICAgIFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLmFscGhhWzBdID0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbMF0pO1xuICAgIH1cbiAgICBub3JtQ29uc3QgKz0gbVJlcy5hbHBoYVswXTtcbiAgfVxuXG4gIGlmIChub3JtQ29uc3QgPiAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gLz0gbm9ybUNvbnN0O1xuICAgIH1cbiAgICByZXR1cm4gKDEuMCAvIG5vcm1Db25zdCk7XG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gPSAxLjAgLyBuc3RhdGVzO1xuICAgIH1cbiAgICByZXR1cm4gMS4wO1xuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1Gb3J3YXJkVXBkYXRlID0gKG9ic0luLCBtLCBtUmVzLCBvYnNPdXQgPSBbXSkgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGhtbUZvcndhcmRVcGRhdGUgPSAob2JzSW4sIGhtbSwgaG1tUmVzLCBvYnNPdXQgPSBbXSkgPT4ge1xuLy8gICBjb25zdCBtID0gaG1tO1xuLy8gICBjb25zdCBtUmVzID0gaG1tUmVzO1xuICBjb25zdCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgbGV0IG5vcm1Db25zdCA9IDAuMDtcblxuICBtUmVzLnByZXZpb3VzX2FscGhhID0gbVJlcy5hbHBoYS5zbGljZSgwKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICBtUmVzLmFscGhhW2ldID0gMDtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBlcmdvZGljXG4gICAgaWYgKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT09IDApIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnN0YXRlczsgaisrKSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtqXSAqXG4gICAgICAgICAgICAgICAgIG1SZXMudHJhbnNpdGlvbltqICogbnN0YXRlcysgaV07XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGVmdC1yaWdodFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLmFscGhhW2ldICs9IG1SZXMucHJldmlvdXNfYWxwaGFbaV0gKiBtUmVzLnRyYW5zaXRpb25baSAqIDJdO1xuICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtpIC0gMV0gKlxuICAgICAgICAgICAgICAgICBtUmVzLnRyYW5zaXRpb25bKGkgLSAxKSAqIDIgKyAxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYWxwaGFbMF0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtuc3RhdGVzIC0gMV0gKlxuICAgICAgICAgICAgICAgICBtUmVzLnRyYW5zaXRpb25bbnN0YXRlcyAqIDIgLSAxXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsICAgICAgICBcbiAgICBpZiAobS5zdGF0ZXNbaV0uY29tcG9uZW50c1swXS5iaW1vZGFsKSB7XG4gICAgICBpZiAob2JzT3V0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgbVJlcy5hbHBoYVtpXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iQmltb2RhbChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ic091dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2ldKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbaV0pO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWwgICAgICAgIFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLmFscGhhW2ldICo9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2ldKTtcbiAgICB9XG4gICAgbm9ybUNvbnN0ICs9IG1SZXMuYWxwaGFbaV07XG4gIH1cblxuICBpZiAobm9ybUNvbnN0ID4gMWUtMzAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gLz0gbm9ybUNvbnN0O1xuICAgIH1cbiAgICByZXR1cm4gKDEuMCAvIG5vcm1Db25zdCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIDAuMDtcbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaG1tVXBkYXRlQWxwaGFXaW5kb3cgPSAobSwgbVJlcykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGhtbVVwZGF0ZUFscGhhV2luZG93ID0gKGhtbSwgaG1tUmVzKSA9PiB7XG4vLyAgIGNvbnN0IG0gPSBobW07XG4vLyAgIGNvbnN0IG1SZXMgPSBobW1SZXM7XG4gIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICBcbiAgbVJlcy5saWtlbGllc3Rfc3RhdGUgPSAwO1xuXG4gIGxldCBiZXN0X2FscGhhO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcbiAgaWYgKG0ucGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHtcbiAgICBiZXN0X2FscGhhID0gbVJlcy5hbHBoYV9oWzBdWzBdICsgbVJlcy5hbHBoYV9oWzFdWzBdO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWxcbiAgfSBlbHNlIHtcbiAgICBiZXN0X2FscGhhID0gbVJlcy5hbHBoYVswXTsgXG4gIH1cblxuICBmb3IgKGxldCBpID0gMTsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcbiAgICBpZiAobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkge1xuICAgICAgaWYgKChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pID4gYmVzdF9hbHBoYSkge1xuICAgICAgICBiZXN0X2FscGhhID0gbVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldO1xuICAgICAgICBtUmVzLmxpa2VsaWVzdF9zdGF0ZSA9IGk7XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbCAgICAgICAgXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKG1SZXMuYWxwaGFbaV0gPiBiZXN0X2FscGhhKSB7XG4gICAgICAgIGJlc3RfYWxwaGEgPSBtUmVzLmFscGhhWzBdO1xuICAgICAgICBtUmVzLmxpa2VsaWVzdF9zdGF0ZSA9IGk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbVJlcy53aW5kb3dfbWluaW5kZXggPSBtUmVzLmxpa2VsaWVzdF9zdGF0ZSAtIG5zdGF0ZXMgLyAyO1xuICBtUmVzLndpbmRvd19tYXhpbmRleCA9IG1SZXMubGlrZWxpZXN0X3N0YXRlICsgbnN0YXRlcyAvIDI7XG4gIG1SZXMud2luZG93X21pbmluZGV4ID0gKG1SZXMud2luZG93X21pbmluZGV4ID49IDApXG4gICAgICAgICAgICAgPyBtUmVzLndpbmRvd19taW5pbmRleFxuICAgICAgICAgICAgIDogMDtcbiAgbVJlcy53aW5kb3dfbWF4aW5kZXggPSAobVJlcy53aW5kb3dfbWF4aW5kZXggPD0gbnN0YXRlcylcbiAgICAgICAgICAgICA/IG1SZXMud2luZG93X21heGluZGV4XG4gICAgICAgICAgICAgOiBuc3RhdGVzO1xuICBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50ID0gMDtcbiAgZm9yIChsZXQgaSA9IG1SZXMud2luZG93X21pbmluZGV4OyBpIDwgbVJlcy53aW5kb3dfbWF4aW5kZXg7IGkrKykge1xuICAgIG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnRcbiAgICAgICs9IChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pO1xuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1VcGRhdGVSZXN1bHRzID0gKG0sIG1SZXMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBobW1VcGRhdGVSZXN1bHRzID0gKGhtbSwgaG1tUmVzKSA9PiB7XG4vLyAgIGNvbnN0IG0gPSBobW07XG4vLyAgIGNvbnN0IG1SZXMgPSBobW1SZXM7XG5cbiAgLy8gSVMgVEhJUyBDT1JSRUNUICA/IFRPRE8gOiBDSEVDSyBBR0FJTiAoc2VlbXMgdG8gaGF2ZSBwcmVjaXNpb24gaXNzdWVzKVxuICAvLyBBSEEgISA6IE5PUk1BTExZIExJS0VMSUhPT0RfQlVGRkVSIElTIENJUkNVTEFSIDogSVMgSVQgVEhFIENBU0UgSEVSRSA/XG4gIC8vIFNIT1VMRCBJIFwiUE9QX0ZST05UXCIgPyAoc2VlbXMgdGhhdCB5ZXMpXG5cbiAgLy9yZXMubGlrZWxpaG9vZF9idWZmZXIucHVzaChNYXRoLmxvZyhyZXMuaW5zdGFudF9saWtlbGlob29kKSk7XG5cbiAgLy8gTk9XIFRISVMgSVMgQkVUVEVSIChTSE9VTEQgV09SSyBBUyBJTlRFTkRFRClcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlclttUmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4XVxuICAgID0gTWF0aC5sb2cobVJlcy5pbnN0YW50X2xpa2VsaWhvb2QpO1xuICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4XG4gICAgPSAobVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleCArIDEpICUgbVJlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGg7XG5cbiAgbVJlcy5sb2dfbGlrZWxpaG9vZCA9IDA7XG4gIGNvbnN0IGJ1ZlNpemUgPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBidWZTaXplOyBpKyspIHtcbiAgICBtUmVzLmxvZ19saWtlbGlob29kICs9IG1SZXMubGlrZWxpaG9vZF9idWZmZXJbaV07XG4gIH1cbiAgbVJlcy5sb2dfbGlrZWxpaG9vZCAvPSBidWZTaXplO1xuXG4gIG1SZXMucHJvZ3Jlc3MgPSAwO1xuICBmb3IgKGxldCBpID0gbVJlcy53aW5kb3dfbWluaW5kZXg7IGkgPCBtUmVzLndpbmRvd19tYXhpbmRleDsgaSsrKSB7XG4gICAgaWYgKG0ucGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHsgLy8gaGllcmFyY2hpY2FsXG4gICAgICBtUmVzLnByb2dyZXNzXG4gICAgICAgICs9IChcbiAgICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtpXSArXG4gICAgICAgICAgICBtUmVzLmFscGhhX2hbMV1baV0gK1xuICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzJdW2ldXG4gICAgICAgICAgKSAqXG4gICAgICAgICAgaSAvIG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQ7XG4gICAgfSBlbHNlIHsgLy8gbm9uIGhpZXJhcmNoaWNhbFxuICAgICAgbVJlcy5wcm9ncmVzcyArPSBtUmVzLmFscGhhW2ldICpcbiAgICAgICAgICAgICAgIGkgLyBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50O1xuICAgIH1cbiAgfVxuICBtUmVzLnByb2dyZXNzIC89IChtLnBhcmFtZXRlcnMuc3RhdGVzIC0gMSk7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1GaWx0ZXIgPSAob2JzSW4sIG0sIG1SZXMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBobW1GaWx0ZXIgPSAob2JzSW4sIGhtbSwgaG1tUmVzKSA9PiB7XG4vLyAgIGNvbnN0IG0gPSBobW07XG4vLyAgIGNvbnN0IG1SZXMgPSBobW1SZXM7XG4gIGxldCBjdCA9IDAuMDtcbiAgaWYgKG1SZXMuZm9yd2FyZF9pbml0aWFsaXplZCkge1xuICAgIGN0ID0gaG1tRm9yd2FyZFVwZGF0ZShvYnNJbiwgbSwgbVJlcyk7XG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDsgaisrKSB7XG4gICAgICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMC4wO1xuICAgIH1cbiAgICBjdCA9IGhtbUZvcndhcmRJbml0KG9ic0luLCBtLCBtUmVzKTtcbiAgICBtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSAxLjAgLyBjdDtcbiAgaG1tVXBkYXRlQWxwaGFXaW5kb3cobSwgbVJlcyk7XG4gIGhtbVVwZGF0ZVJlc3VsdHMobSwgbVJlcyk7XG5cbiAgaWYgKG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uYmltb2RhbCkge1xuICAgIGhtbVJlZ3Jlc3Npb24ob2JzSW4sIG0sIG1SZXMpO1xuICB9XG5cbiAgcmV0dXJuIG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xufTtcblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgYXMgaW4geG1tSGllcmFyY2hpY2FsSG1tLmNwcCAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBoaG1tTGlrZWxpaG9vZEFscGhhID0gKGV4aXROdW0sIGxpa2VsaWhvb2RWZWMsIGhtLCBobVJlcykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGhobW1MaWtlbGlob29kQWxwaGEgPSAoZXhpdE51bSwgbGlrZWxpaG9vZFZlYywgaGhtbSwgaGhtbVJlcykgPT4ge1xuLy8gICBjb25zdCBtID0gaGhtbTtcbi8vICAgY29uc3QgbVJlcyA9IGhobW1SZXM7XG5cbiAgaWYgKGV4aXROdW0gPCAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxpa2VsaWhvb2RWZWNbaV0gPSAwO1xuICAgICAgZm9yIChsZXQgZXhpdCA9IDA7IGV4aXQgPCAzOyBleGl0KyspIHtcbiAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBobS5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7IGsrKykge1xuICAgICAgICAgIGxpa2VsaWhvb2RWZWNbaV1cbiAgICAgICAgICAgICs9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZXhpdF1ba107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxpa2VsaWhvb2RWZWNbaV0gPSAwO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBobS5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7IGsrKykge1xuICAgICAgICBsaWtlbGlob29kVmVjW2ldXG4gICAgICAgICAgKz0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtleGl0TnVtXVtrXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBGT1JXQVJEIElOSVRcblxuZXhwb3J0IGNvbnN0IGhobW1Gb3J3YXJkSW5pdCA9IChvYnNJbiwgaG0sIGhtUmVzKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgaGhtbUZvcndhcmRJbml0ID0gKG9ic0luLCBoaG1tLCBoaG1tUmVzKSA9PiB7XG4vLyAgIGNvbnN0IGhtID0gaGhtbTtcbi8vICAgY29uc3QgaG1SZXMgPSBoaG1tUmVzO1xuICBsZXQgbm9ybV9jb25zdCA9IDA7XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBpbml0aWFsaXplIGFscGhhc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXG4gICAgY29uc3QgbSA9IGhtLm1vZGVsc1tpXTtcbiAgICBjb25zdCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgICBjb25zdCBtUmVzID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV07XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgbVJlcy5hbHBoYV9oW2pdID0gbmV3IEFycmF5KG5zdGF0ZXMpO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgbVJlcy5hbHBoYV9oW2pdW2tdID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBlcmdvZGljXG4gICAgaWYgKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT0gMCkge1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG4gICAgICAgIGlmIChobS5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG4gICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2tdID0gbS5wcmlvcltrXSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLCBtLnN0YXRlc1trXSk7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB1bmltb2RhbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtrXSA9IG0ucHJpb3Jba10gKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2tdKTtcbiAgICAgICAgfVxuICAgICAgICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCArPSBtUmVzLmFscGhhX2hbMF1ba107XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGVmdC1yaWdodFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLmFscGhhX2hbMF1bMF0gPSBobS5wcmlvcltpXTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG4gICAgICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgICAgICBtUmVzLmFscGhhX2hbMF1bMF0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLCBtLnN0YXRlc1trXSk7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB1bmltb2RhbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5hbHBoYV9oWzBdWzBdICo9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2tdKTtcbiAgICAgIH1cbiAgICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gbVJlcy5hbHBoYV9oWzBdWzBdO1xuICAgIH1cbiAgICBub3JtX2NvbnN0ICs9IG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gbm9ybWFsaXplIGFscGhhc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXG4gICAgY29uc3QgbnN0YXRlcyA9IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgICBmb3IgKGxldCBlID0gMDsgZSA8IDM7IGUrKykge1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtlXVtrXSAvPSBub3JtX2NvbnN0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQgPSB0cnVlO1xufTtcblxuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBGT1JXQVJEIFVQREFURVxuXG5leHBvcnQgY29uc3QgaGhtbUZvcndhcmRVcGRhdGUgPSAob2JzSW4sIGhtLCBobVJlcykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGhobW1Gb3J3YXJkVXBkYXRlID0gKG9ic0luLCBoaG1tLCBoaG1tUmVzKSA9PiB7XG4vLyAgIGNvbnN0IGhtID0gaGhtbTtcbi8vICAgY29uc3QgaG1SZXMgPSBoaG1tUmVzO1xuICBjb25zdCBubW9kZWxzID0gaG0ubW9kZWxzLmxlbmd0aDtcblxuICBsZXQgbm9ybV9jb25zdCA9IDA7XG4gIGxldCB0bXAgPSAwO1xuICBsZXQgZnJvbnQ7IC8vIGFycmF5XG5cbiAgaGhtbUxpa2VsaWhvb2RBbHBoYSgxLCBobVJlcy5mcm9udGllcl92MSwgaG0sIGhtUmVzKTtcbiAgaGhtbUxpa2VsaWhvb2RBbHBoYSgyLCBobVJlcy5mcm9udGllcl92MiwgaG0sIGhtUmVzKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG5tb2RlbHM7IGkrKykge1xuXG4gICAgY29uc3QgbSA9IGhtLm1vZGVsc1tpXTtcbiAgICBjb25zdCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgICBjb25zdCBtUmVzID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV07XG4gICAgXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PSBjb21wdXRlIGZyb250aWVyIHZhcmlhYmxlXG4gICAgZnJvbnQgPSBuZXcgQXJyYXkobnN0YXRlcyk7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcbiAgICAgIGZyb250W2pdID0gMDtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBlcmdvZGljXG4gICAgaWYgKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT0gMCkgeyAvLyBlcmdvZGljXG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5zdGF0ZXM7IGorKykge1xuICAgICAgICAgIGZyb250W2tdICs9IG0udHJhbnNpdGlvbltqICogbnN0YXRlcyArIGtdIC9cbiAgICAgICAgICAgICAgICAoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNbal0pICpcbiAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1bal07XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgc3JjaSA9IDA7IHNyY2kgPCBubW9kZWxzOyBzcmNpKyspIHtcbiAgICAgICAgICBmcm9udFtrXSArPSBtLnByaW9yW2tdICpcbiAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICBobVJlcy5mcm9udGllcl92MVtzcmNpXSAqXG4gICAgICAgICAgICAgICAgICBobS50cmFuc2l0aW9uW3NyY2ldW2ldXG4gICAgICAgICAgICAgICAgICArIGhtUmVzLmZyb250aWVyX3YyW3NyY2ldICpcbiAgICAgICAgICAgICAgICAgIGhtLnByaW9yW2ldXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxlZnQtcmlnaHRcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gayA9PSAwIDogZmlyc3Qgc3RhdGUgb2YgdGhlIHByaW1pdGl2ZVxuICAgICAgZnJvbnRbMF0gPSBtLnRyYW5zaXRpb25bMF0gKiBtUmVzLmFscGhhX2hbMF1bMF07XG5cbiAgICAgIGZvciAobGV0IHNyY2kgPSAwOyBzcmNpIDwgbm1vZGVsczsgc3JjaSsrKSB7XG4gICAgICAgIGZyb250WzBdICs9IGhtUmVzLmZyb250aWVyX3YxW3NyY2ldICpcbiAgICAgICAgICAgICAgaG0udHJhbnNpdGlvbltzcmNpXVtpXVxuICAgICAgICAgICAgICArIGhtUmVzLmZyb250aWVyX3YyW3NyY2ldICpcbiAgICAgICAgICAgICAgaG0ucHJpb3JbaV07XG4gICAgICB9XG5cbiAgICAgIC8vIGsgPiAwIDogcmVzdCBvZiB0aGUgcHJpbWl0aXZlXG4gICAgICBmb3IgKGxldCBrID0gMTsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICBmcm9udFtrXSArPSBtLnRyYW5zaXRpb25bayAqIDJdIC9cbiAgICAgICAgICAgICAgKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdKSAqXG4gICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtrXTtcbiAgICAgICAgZnJvbnRba10gKz0gbS50cmFuc2l0aW9uWyhrIC0gMSkgKiAyICsgMV0gL1xuICAgICAgICAgICAgICAoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNbayAtIDFdKSAqXG4gICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtrIC0gMV07XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgICAgbVJlcy5hbHBoYV9oW2pdW2tdID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvL2NvbnNvbGUubG9nKGZyb250KTtcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PSB1cGRhdGUgZm9yd2FyZCB2YXJpYWJsZVxuICAgIG1SZXMuZXhpdF9saWtlbGlob29kID0gMDtcbiAgICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCA9IDA7XG5cbiAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgaWYgKGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcbiAgICAgICAgdG1wID0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLCBtLnN0YXRlc1trXSkgKlxuICAgICAgICAgICAgZnJvbnRba107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0bXAgPSBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1trXSkgKiBmcm9udFtrXTtcbiAgICAgIH1cblxuICAgICAgbVJlcy5hbHBoYV9oWzJdW2tdID0gaG0uZXhpdF90cmFuc2l0aW9uW2ldICpcbiAgICAgICAgICAgICAgICAgbS5leGl0UHJvYmFiaWxpdGllc1trXSAqIHRtcDtcbiAgICAgIG1SZXMuYWxwaGFfaFsxXVtrXSA9ICgxIC0gaG0uZXhpdF90cmFuc2l0aW9uW2ldKSAqXG4gICAgICAgICAgICAgICAgIG0uZXhpdFByb2JhYmlsaXRpZXNba10gKiB0bXA7XG4gICAgICBtUmVzLmFscGhhX2hbMF1ba10gPSAoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNba10pICogdG1wO1xuXG4gICAgICBtUmVzLmV4aXRfbGlrZWxpaG9vZCArPSBtUmVzLmFscGhhX2hbMV1ba10gK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzJdW2tdO1xuICAgICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgKz0gbVJlcy5hbHBoYV9oWzBdW2tdICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsxXVtrXSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMl1ba107XG5cbiAgICAgIG5vcm1fY29uc3QgKz0gdG1wO1xuICAgIH1cblxuICAgIG1SZXMuZXhpdF9yYXRpbyA9IG1SZXMuZXhpdF9saWtlbGlob29kIC8gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBub3JtYWxpemUgYWxwaGFzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm1vZGVsczsgaSsrKSB7XG4gICAgZm9yIChsZXQgZSA9IDA7IGUgPCAzOyBlKyspIHtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgaG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtlXVtrXSAvPSBub3JtX2NvbnN0O1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaGhtbVVwZGF0ZVJlc3VsdHMgPSAoaG0sIGhtUmVzKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgaGhtbVVwZGF0ZVJlc3VsdHMgPSAoaGhtbSwgaGhtbVJlcykgPT4ge1xuLy8gICBjb25zdCBobSA9IGhobW07XG4vLyAgIGNvbnN0IGhtUmVzID0gaGhtbVJlcztcblxuICBsZXQgbWF4bG9nX2xpa2VsaWhvb2QgPSAwO1xuICBsZXQgbm9ybWNvbnN0X2luc3RhbnQgPSAwO1xuICBsZXQgbm9ybWNvbnN0X3Ntb290aGVkID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXG4gICAgbGV0IG1SZXMgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXTtcblxuICAgIGhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcbiAgICBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmxvZ19saWtlbGlob29kO1xuICAgIGhtUmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldID0gTWF0aC5leHAoaG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldKTtcblxuICAgIGhtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IGhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV07XG4gICAgaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IGhtUmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgbm9ybWNvbnN0X2luc3RhbnQgICArPSBobVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG4gICAgbm9ybWNvbnN0X3Ntb290aGVkICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgaWYgKGkgPT0gMCB8fCBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPiBtYXhsb2dfbGlrZWxpaG9vZCkge1xuICAgICAgbWF4bG9nX2xpa2VsaWhvb2QgPSBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV07XG4gICAgICBobVJlcy5saWtlbGllc3QgPSBpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgaG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1jb25zdF9pbnN0YW50O1xuICAgIGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gLz0gbm9ybWNvbnN0X3Ntb290aGVkO1xuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBoaG1tRmlsdGVyID0gKG9ic0luLCBobSwgaG1SZXMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBoaG1tRmlsdGVyID0gKG9ic0luLCBoaG1tLCBoaG1tUmVzKSA9PiB7XG4vLyAgIGNvbnN0IGhtID0gaGhtbTtcbi8vICAgY29uc3QgaG1SZXMgPSBoaG1tUmVzO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICBpZiAoaG0uY29uZmlndXJhdGlvbi5kZWZhdWx0X3BhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgaWYgKGhtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQpIHtcbiAgICAgIGhobW1Gb3J3YXJkVXBkYXRlKG9ic0luLCBobSwgaG1SZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaG1tRm9yd2FyZEluaXQob2JzSW4sIGhtLCBobVJlcyk7XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgaG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXSA9IGhtbUZpbHRlcihvYnNJbiwgaG0sIGhtUmVzKTtcbiAgICB9XG4gIH1cblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tIGNvbXB1dGUgdGltZSBwcm9ncmVzc2lvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgIGhtbVVwZGF0ZUFscGhhV2luZG93KFxuICAgICAgaG0ubW9kZWxzW2ldLFxuICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICApO1xuICAgIGhtbVVwZGF0ZVJlc3VsdHMoXG4gICAgICBobS5tb2RlbHNbaV0sXG4gICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuICAgICk7XG4gIH1cblxuICBoaG1tVXBkYXRlUmVzdWx0cyhobSwgaG1SZXMpO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgIGNvbnN0IGRpbSA9IGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmRpbWVuc2lvbjtcbiAgICBjb25zdCBkaW1JbiA9IGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmRpbWVuc2lvbl9pbnB1dDtcbiAgICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBobW1SZWdyZXNzaW9uKG9ic0luLCBobS5tb2RlbHNbaV0sIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGlrZWxpZXN0XG4gICAgaWYgKGhtLmNvbmZpZ3VyYXRpb24ubXVsdGlDbGFzc19yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMCkge1xuICAgICAgaG1SZXMub3V0cHV0X3ZhbHVlc1xuICAgICAgICA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2htUmVzLmxpa2VsaWVzdF1cbiAgICAgICAgICAgICAgIC5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuICAgICAgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2VcbiAgICAgICAgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tobVJlcy5saWtlbGllc3RdXG4gICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2Uuc2xpY2UoMCk7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbWl4dHVyZVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtUmVzLm91dHB1dF92YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgICAgICBobVJlcy5vdXRwdXRfdmFsdWVzW2RdXG4gICAgICAgICAgICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcbiAgICAgICAgICAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLm91dHB1dF92YWx1ZXNbZF07XG5cbiAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgaWYgKGhtLmNvbmZpZ3VyYXRpb24uY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMiArKykge1xuICAgICAgICAgICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdXG4gICAgICAgICAgICAgICAgKz0gaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAqXG4gICAgICAgICAgICAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICAgICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcbiAgICAgICAgICAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG4iXX0=