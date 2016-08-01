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

var hhmmLikelihoodAlpha = exports.hhmmLikelihoodAlpha = function hhmmLikelihoodAlpha(exitNum, likelihoodVec, hm, hmRes) {
  // export const hhmmLikelihoodAlpha = (exitNum, likelihoodVec, hhmm, hhmmRes) => {
  //   const m = hhmm;
  //   const mRes = hhmmRes;

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

var hhmmForwardInit = exports.hhmmForwardInit = function hhmmForwardInit(obsIn, hm, hmRes) {
  // export const hhmmForwardInit = (obsIn, hhmm, hhmmRes) => {
  //   const hm = hhmm;
  //   const hmRes = hhmmRes;
  var norm_const = 0;

  //=================================== initialize alphas
  for (var i = 0; i < hm.models.length; i++) {

    var _m = hm.models[i];
    var nstates = _m.parameters.states;
    var _mRes = hmRes.singleClassHmmModelResults[i];

    for (var j = 0; j < 3; j++) {
      _mRes.alpha_h[j] = new Array(nstates);
      for (var _k3 = 0; _k3 < nstates; _k3++) {
        _mRes.alpha_h[j][_k3] = 0;
      }
    }

    //------------------------------------------------------------------ ergodic
    if (_m.parameters.transition_mode == 0) {
      for (var _k4 = 0; _k4 < nstates; _k4++) {
        //-------------------------------------------------------------- bimodal
        if (hm.shared_parameters.bimodal) {
          _mRes.alpha_h[0][_k4] = _m.prior[_k4] * gmmUtils.gmmObsProbInput(observation, _m.states[_k4]);
          //------------------------------------------------------------- unimodal
        } else {
          _mRes.alpha_h[0][_k4] = _m.prior[_k4] * gmmUtils.gmmObsProb(observation, _m.states[_k4]);
        }
        _mRes.instant_likelihood += _mRes.alpha[0][_k4];
      }
      //--------------------------------------------------------------- left-right
    } else {
      _mRes.alpha_h[0][0] = hm.prior[i];
      //---------------------------------------------------------------- bimodal
      if (hm.shared_parameters.bimodal) {
        _mRes.alpha_h[0][0] *= gmmUtils.gmmObsProbInput(observation, _m.states[k]);
        //--------------------------------------------------------------- unimodal
      } else {
        _mRes.alpha_h[0][0] *= gmmUtils.gmmObsProb(observation, _m.states[k]);
      }
      _mRes.instant_likelihood = _mRes.alpha_h[0][0];
    }
    norm_const += _mRes.instant_likelihood;
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

    var _m2 = hm.models[i];
    var nstates = _m2.parameters.states;
    var _mRes2 = hmRes.singleClassHmmModelResults[i];

    //======================= compute frontier variable
    front = new Array(nstates);
    for (var j = 0; j < nstates; j++) {
      front[j] = 0;
    }

    //------------------------------------------------------------------ ergodic
    if (_m2.parameters.transition_mode == 0) {
      // ergodic
      for (var _k6 = 0; _k6 < nstates; _k6++) {
        for (var _j = 0; _j < nstates; _j++) {
          front[_k6] += _m2.transition[_j * nstates + _k6] / (1 - _m2.exitProbabilities[_j]) * _mRes2.alpha_h[0][_j];
        }
        for (var srci = 0; srci < nmodels; srci++) {
          front[_k6] += _m2.prior[_k6] * (hmRes.frontier_v1[srci] * hm.transition[srci][i] + hmRes.frontier_v2[srci] * hm.prior[i]);
        }
      }
      //--------------------------------------------------------------- left-right
    } else {
      // k == 0 : first state of the primitive
      front[0] = _m2.transition[0] * _mRes2.alpha_h[0][0];

      for (var _srci = 0; _srci < nmodels; _srci++) {
        front[0] += hmRes.frontier_v1[_srci] * hm.transition[_srci][i] + hmRes.frontier_v2[_srci] * hm.prior[i];
      }

      // k > 0 : rest of the primitive
      for (var _k7 = 1; _k7 < nstates; _k7++) {
        front[_k7] += _m2.transition[_k7 * 2] / (1 - _m2.exitProbabilities[_k7]) * _mRes2.alpha_h[0][_k7];
        front[_k7] += _m2.transition[(_k7 - 1) * 2 + 1] / (1 - _m2.exitProbabilities[_k7 - 1]) * _mRes2.alpha_h[0][_k7 - 1];
      }

      for (var _j2 = 0; _j2 < 3; _j2++) {
        for (var _k8 = 0; _k8 < nstates; _k8++) {
          _mRes2.alpha_h[_j2][_k8] = 0;
        }
      }
    }
    //console.log(front);

    //========================= update forward variable
    _mRes2.exit_likelihood = 0;
    _mRes2.instant_likelihood = 0;

    for (var _k9 = 0; _k9 < nstates; _k9++) {
      if (hm.shared_parameters.bimodal) {
        tmp = gmmUtils.gmmObsProbInput(observation, _m2.states[_k9]) * front[_k9];
      } else {
        tmp = gmmUtils.gmmObsProb(observation, _m2.states[_k9]) * front[_k9];
      }

      _mRes2.alpha_h[2][_k9] = hm.exit_transition[i] * _m2.exitProbabilities[_k9] * tmp;
      _mRes2.alpha_h[1][_k9] = (1 - hm.exit_transition[i]) * _m2.exitProbabilities[_k9] * tmp;
      _mRes2.alpha_h[0][_k9] = (1 - _m2.exitProbabilities[_k9]) * tmp;

      _mRes2.exit_likelihood += _mRes2.alpha_h[1][_k9] + _mRes2.alpha_h[2][_k9];
      _mRes2.instant_likelihood += _mRes2.alpha_h[0][_k9] + _mRes2.alpha_h[1][_k9] + _mRes2.alpha_h[2][_k9];

      norm_const += tmp;
    }

    _mRes2.exit_ratio = _mRes2.exit_likelihood / _mRes2.instant_likelihood;
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

    var _mRes3 = hmRes.singleClassHmmModelResults[i];

    hmRes.instant_likelihoods[i] = _mRes3.instant_likelihood;
    hmRes.smoothed_log_likelihoods[i] = _mRes3.log_likelihood;
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
//# sourceMappingURL=data:application/json;base64,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LCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBnbW1VdGlscyBmcm9tICcuL2dtbS11dGlscyc7XG5cbi8qKlxuICogIGZ1bmN0aW9ucyB1c2VkIGZvciBkZWNvZGluZywgdHJhbnNsYXRlZCBmcm9tIFhNTVxuICovXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICAgYXMgaW4geG1tSG1tU2luZ2xlQ2xhc3MuY3BwICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGhtbVJlZ3Jlc3Npb24gPSAob2JzSW4sIG0sIG1SZXMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBobW1SZWdyZXNzaW9uID0gKG9ic0luLCBobW0sIGhtbVJlcykgPT4ge1xuLy8gICBjb25zdCBtID0gaG1tO1xuLy8gICBjb25zdCBtUmVzID0gaG1tUmVzO1xuICBjb25zdCBkaW0gPSBtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmRpbWVuc2lvbjtcbiAgY29uc3QgZGltSW4gPSBtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmRpbWVuc2lvbl9pbnB1dDtcbiAgY29uc3QgZGltT3V0ID0gZGltIC0gZGltSW47XG5cbiAgbGV0IG91dENvdmFyU2l6ZTtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gIGlmIChtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dCAqIGRpbU91dDtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgb3V0Q292YXJTaXplID0gZGltT3V0O1xuICB9XG5cbiAgbVJlcy5vdXRwdXRfdmFsdWVzID0gbmV3IEFycmF5KGRpbU91dCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcbiAgICBtUmVzLm91dHB1dF92YWx1ZXNbaV0gPSAwLjA7XG4gIH1cbiAgbVJlcy5vdXRwdXRfY292YXJpYW5jZSA9IG5ldyBBcnJheShvdXRDb3ZhclNpemUpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG91dENvdmFyU2l6ZTsgaSsrKSB7XG4gICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtpXSA9IDAuMDtcbiAgfVxuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxpa2VsaWVzdFxuICBpZiAobS5wYXJhbWV0ZXJzLnJlZ3Jlc3Npb25fZXN0aW1hdG9yID09PSAyKSB7XG4gICAgZ21tVXRpbHMuZ21tTGlrZWxpaG9vZChcbiAgICAgIG9ic0luLFxuICAgICAgbS5zdGF0ZXNbbVJlcy5saWtlbGllc3Rfc3RhdGVdLFxuICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV1cbiAgICApO1xuICAgIGdtbVV0aWxzLmdtbVJlZ3Jlc3Npb24oXG4gICAgICBvYnNJbixcbiAgICAgIG0uc3RhdGVzW21SZXMubGlrZWxpZXN0X3N0YXRlXSxcbiAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbbVJlcy5saWtlbGllc3Rfc3RhdGVdXG4gICAgKTtcbiAgICBtUmVzLm91dHB1dF92YWx1ZXNcbiAgICAgID0gbS5zdGF0ZXNbbVJlcy5saWtlbGllc3Rfc3RhdGVdLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgY2xpcE1pblN0YXRlID0gKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PSAwKVxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB3aW5kb3dlZFxuICAgICAgICAgICAgICAgICAgICA6IG1SZXMud2luZG93X21pbmluZGV4O1xuXG4gIGNvbnN0IGNsaXBNYXhTdGF0ZSA9IChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT0gMClcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgICAgICAgICAgID8gbS5zdGF0ZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB3aW5kb3dlZFxuICAgICAgICAgICAgICAgICAgICA6IG1SZXMud2luZG93X21heGluZGV4O1xuXG4gIGxldCBub3JtQ29uc3RhbnQgPSAobS5wYXJhbWV0ZXJzLnJlZ3Jlc3Npb25fZXN0aW1hdG9yID09IDApXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICAgICAgICAgICAgICA/IDEuMFxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gd2luZG93ZWRcbiAgICAgICAgICAgICAgICAgICAgOiBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50O1xuXG4gIGlmIChub3JtQ29uc3RhbnQgPD0gMC4wKSB7XG4gICAgbm9ybUNvbnN0YW50ID0gMS47XG4gIH1cblxuICBmb3IgKGxldCBpID0gY2xpcE1pblN0YXRlOyBpIDwgY2xpcE1heFN0YXRlOyBpKyspIHtcbiAgICBnbW1VdGlscy5nbW1MaWtlbGlob29kKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1tpXSxcbiAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICApO1xuICAgIGdtbVV0aWxzLmdtbVJlZ3Jlc3Npb24oXG4gICAgICBvYnNJbixcbiAgICAgIG0uc3RhdGVzW2ldLFxuICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuICAgICk7XG4gICAgY29uc3QgdG1wUHJlZGljdGVkT3V0cHV0XG4gICAgICA9IG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV0ub3V0cHV0X3ZhbHVlcy5zbGljZSgwKTtcblxuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gICAgICBpZiAobVJlcy5oaWVyYXJjaGljYWwpIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2RdXG4gICAgICAgICAgKz0gKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgIHRtcFByZWRpY3RlZE91dHB1dFtkXSAvIG5vcm1Db25zdGFudDtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgIGlmIChtLnBhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgICAgZm9yIChsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIrKykge1xuICAgICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdXG4gICAgICAgICAgICAgICs9IChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICAgICAgKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdIC9cbiAgICAgICAgICAgICAgICBub3JtQ29uc3RhbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdXG4gICAgICAgICAgICArPSAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG4gICAgICAgICAgICAgICAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG4gICAgICAgICAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZF0gL1xuICAgICAgICAgICAgICBub3JtQ29uc3RhbnQ7XG4gICAgICAgIH1cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBub24taGllcmFyY2hpY2FsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLm91dHB1dF92YWx1ZXNbZF0gKz0gbVJlcy5hbHBoYVtpXSAqIFxuICAgICAgICAgICAgICAgICAgICAgdG1wUHJlZGljdGVkT3V0cHV0W2RdIC8gbm9ybUNvbnN0YW50O1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgaWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG4gICAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl1cbiAgICAgICAgICAgICAgKz0gIG1SZXMuYWxwaGFbaV0gKiBtUmVzLmFscGhhW2ldICpcbiAgICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXSAvXG4gICAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICAgIH1cbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF0gKz0gbVJlcy5hbHBoYVtpXSAqIG1SZXMuYWxwaGFbaV0gKlxuICAgICAgICAgICAgICAgICAgICAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkXSAvXG4gICAgICAgICAgICAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1Gb3J3YXJkSW5pdCA9IChvYnNJbiwgbSwgbVJlcywgb2JzT3V0ID0gW10pID0+IHtcbi8vIGV4cG9ydCBjb25zdCBobW1Gb3J3YXJkSW5pdCA9IChvYnNJbiwgaG1tLCBobW1SZXMsIG9ic091dCA9IFtdKSA9PiB7XG4vLyAgIGNvbnN0IG0gPSBobW07XG4vLyAgIGNvbnN0IG1SZXMgPSBobW1SZXM7XG4gIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICBsZXQgbm9ybUNvbnN0ID0gMC4wO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXJnb2RpYyAgICAgICAgXG4gIGlmIChtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsICAgICAgICBcbiAgICAgIGlmIChtLnN0YXRlc1tpXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcbiAgICAgICAgaWYgKG9ic091dC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgbVJlcy5hbHBoYVtpXSA9IG0ucHJpb3JbaV0gKlxuICAgICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNPdXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1tpXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5hbHBoYVtpXSA9IG0ucHJpb3JbaV0gKlxuICAgICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2ldKTtcbiAgICAgICAgfVxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWwgICAgICAgIFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5hbHBoYVtpXSA9IG0ucHJpb3JbaV0gKlxuICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2ldKTtcbiAgICAgIH1cbiAgICAgIG5vcm1Db25zdCArPSBtUmVzLmFscGhhW2ldO1xuICAgIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsZWZ0LXJpZ2h0ICAgICAgICBcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1SZXMuYWxwaGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gPSAwLjA7XG4gICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWwgICAgICAgIFxuICAgIGlmIChtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcbiAgICAgIGlmIChvYnNPdXQubGVuZ3RoID4gMCkge1xuICAgICAgICBtUmVzLmFscGhhWzBdID0gZ21tVXRpbHMuZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JzT3V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzWzBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYWxwaGFbMF0gPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzWzBdKTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsICAgICAgICBcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5hbHBoYVswXSA9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzWzBdKTtcbiAgICB9XG4gICAgbm9ybUNvbnN0ICs9IG1SZXMuYWxwaGFbMF07XG4gIH1cblxuICBpZiAobm9ybUNvbnN0ID4gMCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgICBtUmVzLmFscGhhW2ldIC89IG5vcm1Db25zdDtcbiAgICB9XG4gICAgcmV0dXJuICgxLjAgLyBub3JtQ29uc3QpO1xuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgICBtUmVzLmFscGhhW2ldID0gMS4wIC8gbnN0YXRlcztcbiAgICB9XG4gICAgcmV0dXJuIDEuMDtcbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaG1tRm9yd2FyZFVwZGF0ZSA9IChvYnNJbiwgbSwgbVJlcywgb2JzT3V0ID0gW10pID0+IHtcbi8vIGV4cG9ydCBjb25zdCBobW1Gb3J3YXJkVXBkYXRlID0gKG9ic0luLCBobW0sIGhtbVJlcywgb2JzT3V0ID0gW10pID0+IHtcbi8vICAgY29uc3QgbSA9IGhtbTtcbi8vICAgY29uc3QgbVJlcyA9IGhtbVJlcztcbiAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gIGxldCBub3JtQ29uc3QgPSAwLjA7XG5cbiAgbVJlcy5wcmV2aW91c19hbHBoYSA9IG1SZXMuYWxwaGEuc2xpY2UoMCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgbVJlcy5hbHBoYVtpXSA9IDA7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXJnb2RpY1xuICAgIGlmIChtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09PSAwKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5zdGF0ZXM7IGorKykge1xuICAgICAgICBtUmVzLmFscGhhW2ldICs9IG1SZXMucHJldmlvdXNfYWxwaGFbal0gKlxuICAgICAgICAgICAgICAgICBtUmVzLnRyYW5zaXRpb25baiAqIG5zdGF0ZXMrIGldO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxlZnQtcmlnaHRcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5hbHBoYVtpXSArPSBtUmVzLnByZXZpb3VzX2FscGhhW2ldICogbVJlcy50cmFuc2l0aW9uW2kgKiAyXTtcbiAgICAgIGlmIChpID4gMCkge1xuICAgICAgICBtUmVzLmFscGhhW2ldICs9IG1SZXMucHJldmlvdXNfYWxwaGFbaSAtIDFdICpcbiAgICAgICAgICAgICAgICAgbVJlcy50cmFuc2l0aW9uWyhpIC0gMSkgKiAyICsgMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhWzBdICs9IG1SZXMucHJldmlvdXNfYWxwaGFbbnN0YXRlcyAtIDFdICpcbiAgICAgICAgICAgICAgICAgbVJlcy50cmFuc2l0aW9uW25zdGF0ZXMgKiAyIC0gMV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbCAgICAgICAgXG4gICAgaWYgKG0uc3RhdGVzW2ldLmNvbXBvbmVudHNbMF0uYmltb2RhbCkge1xuICAgICAgaWYgKG9ic091dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNPdXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1tpXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhW2ldICo9IGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2ldKTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsICAgICAgICBcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5hbHBoYVtpXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1tpXSk7XG4gICAgfVxuICAgIG5vcm1Db25zdCArPSBtUmVzLmFscGhhW2ldO1xuICB9XG5cbiAgaWYgKG5vcm1Db25zdCA+IDFlLTMwMCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgICBtUmVzLmFscGhhW2ldIC89IG5vcm1Db25zdDtcbiAgICB9XG4gICAgcmV0dXJuICgxLjAgLyBub3JtQ29uc3QpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAwLjA7XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbVVwZGF0ZUFscGhhV2luZG93ID0gKG0sIG1SZXMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBobW1VcGRhdGVBbHBoYVdpbmRvdyA9IChobW0sIGhtbVJlcykgPT4ge1xuLy8gICBjb25zdCBtID0gaG1tO1xuLy8gICBjb25zdCBtUmVzID0gaG1tUmVzO1xuICBjb25zdCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgXG4gIG1SZXMubGlrZWxpZXN0X3N0YXRlID0gMDtcblxuICBsZXQgYmVzdF9hbHBoYTtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gIGlmIChtLnBhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgYmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFfaFswXVswXSArIG1SZXMuYWxwaGFfaFsxXVswXTtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBub24taGllcmFyY2hpY2FsXG4gIH0gZWxzZSB7XG4gICAgYmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFbMF07IFxuICB9XG5cbiAgZm9yIChsZXQgaSA9IDE7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gICAgaWYgKG0ucGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHtcbiAgICAgIGlmICgobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSA+IGJlc3RfYWxwaGEpIHtcbiAgICAgICAgYmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXTtcbiAgICAgICAgbVJlcy5saWtlbGllc3Rfc3RhdGUgPSBpO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWwgICAgICAgIFxuICAgIH0gZWxzZSB7XG4gICAgICBpZihtUmVzLmFscGhhW2ldID4gYmVzdF9hbHBoYSkge1xuICAgICAgICBiZXN0X2FscGhhID0gbVJlcy5hbHBoYVswXTtcbiAgICAgICAgbVJlcy5saWtlbGllc3Rfc3RhdGUgPSBpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG1SZXMud2luZG93X21pbmluZGV4ID0gbVJlcy5saWtlbGllc3Rfc3RhdGUgLSBuc3RhdGVzIC8gMjtcbiAgbVJlcy53aW5kb3dfbWF4aW5kZXggPSBtUmVzLmxpa2VsaWVzdF9zdGF0ZSArIG5zdGF0ZXMgLyAyO1xuICBtUmVzLndpbmRvd19taW5pbmRleCA9IChtUmVzLndpbmRvd19taW5pbmRleCA+PSAwKVxuICAgICAgICAgICAgID8gbVJlcy53aW5kb3dfbWluaW5kZXhcbiAgICAgICAgICAgICA6IDA7XG4gIG1SZXMud2luZG93X21heGluZGV4ID0gKG1SZXMud2luZG93X21heGluZGV4IDw9IG5zdGF0ZXMpXG4gICAgICAgICAgICAgPyBtUmVzLndpbmRvd19tYXhpbmRleFxuICAgICAgICAgICAgIDogbnN0YXRlcztcbiAgbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudCA9IDA7XG4gIGZvciAobGV0IGkgPSBtUmVzLndpbmRvd19taW5pbmRleDsgaSA8IG1SZXMud2luZG93X21heGluZGV4OyBpKyspIHtcbiAgICBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50XG4gICAgICArPSAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKTtcbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaG1tVXBkYXRlUmVzdWx0cyA9IChtLCBtUmVzKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgaG1tVXBkYXRlUmVzdWx0cyA9IChobW0sIGhtbVJlcykgPT4ge1xuLy8gICBjb25zdCBtID0gaG1tO1xuLy8gICBjb25zdCBtUmVzID0gaG1tUmVzO1xuXG4gIC8vIElTIFRISVMgQ09SUkVDVCAgPyBUT0RPIDogQ0hFQ0sgQUdBSU4gKHNlZW1zIHRvIGhhdmUgcHJlY2lzaW9uIGlzc3VlcylcbiAgLy8gQUhBICEgOiBOT1JNQUxMWSBMSUtFTElIT09EX0JVRkZFUiBJUyBDSVJDVUxBUiA6IElTIElUIFRIRSBDQVNFIEhFUkUgP1xuICAvLyBTSE9VTEQgSSBcIlBPUF9GUk9OVFwiID8gKHNlZW1zIHRoYXQgeWVzKVxuXG4gIC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLnB1c2goTWF0aC5sb2cocmVzLmluc3RhbnRfbGlrZWxpaG9vZCkpO1xuXG4gIC8vIE5PVyBUSElTIElTIEJFVFRFUiAoU0hPVUxEIFdPUksgQVMgSU5URU5ERUQpXG4gIG1SZXMubGlrZWxpaG9vZF9idWZmZXJbbVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleF1cbiAgICA9IE1hdGgubG9nKG1SZXMuaW5zdGFudF9saWtlbGlob29kKTtcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleFxuICAgID0gKG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXggKyAxKSAlIG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuXG4gIG1SZXMubG9nX2xpa2VsaWhvb2QgPSAwO1xuICBjb25zdCBidWZTaXplID0gbVJlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGg7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmU2l6ZTsgaSsrKSB7XG4gICAgbVJlcy5sb2dfbGlrZWxpaG9vZCArPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW2ldO1xuICB9XG4gIG1SZXMubG9nX2xpa2VsaWhvb2QgLz0gYnVmU2l6ZTtcblxuICBtUmVzLnByb2dyZXNzID0gMDtcbiAgZm9yIChsZXQgaSA9IG1SZXMud2luZG93X21pbmluZGV4OyBpIDwgbVJlcy53aW5kb3dfbWF4aW5kZXg7IGkrKykge1xuICAgIGlmIChtLnBhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7IC8vIGhpZXJhcmNoaWNhbFxuICAgICAgbVJlcy5wcm9ncmVzc1xuICAgICAgICArPSAoXG4gICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1baV0gK1xuICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzFdW2ldICtcbiAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsyXVtpXVxuICAgICAgICAgICkgKlxuICAgICAgICAgIGkgLyBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50O1xuICAgIH0gZWxzZSB7IC8vIG5vbiBoaWVyYXJjaGljYWxcbiAgICAgIG1SZXMucHJvZ3Jlc3MgKz0gbVJlcy5hbHBoYVtpXSAqXG4gICAgICAgICAgICAgICBpIC8gbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcbiAgICB9XG4gIH1cbiAgbVJlcy5wcm9ncmVzcyAvPSAobS5wYXJhbWV0ZXJzLnN0YXRlcyAtIDEpO1xufTtcblxuXG5leHBvcnQgY29uc3QgaG1tRmlsdGVyID0gKG9ic0luLCBtLCBtUmVzKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgaG1tRmlsdGVyID0gKG9ic0luLCBobW0sIGhtbVJlcykgPT4ge1xuLy8gICBjb25zdCBtID0gaG1tO1xuLy8gICBjb25zdCBtUmVzID0gaG1tUmVzO1xuICBsZXQgY3QgPSAwLjA7XG4gIGlmIChtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQpIHtcbiAgICBjdCA9IGhtbUZvcndhcmRVcGRhdGUob2JzZXJ2YXRpb24sIG0sIG1SZXMpO1xuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbVJlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGg7IGorKykge1xuICAgICAgbVJlcy5saWtlbGlob29kX2J1ZmZlcltqXSA9IDAuMDtcbiAgICB9XG4gICAgY3QgPSBobW1Gb3J3YXJkSW5pdChvYnNlcnZhdGlvbiwgbSwgbVJlcyk7XG4gICAgbVJlcy5mb3J3YXJkX2luaXRpYWxpemVkID0gdHJ1ZTtcbiAgfVxuXG4gIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gMS4wIC8gY3Q7XG4gIGhtbVVwZGF0ZUFscGhhV2luZG93KG0sIG1SZXMpO1xuICBobW1VcGRhdGVSZXN1bHRzKG0sIG1SZXMpO1xuXG4gIGlmIChtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcbiAgICBobW1SZWdyZXNzaW9uKG9ic2VydmF0aW9uLCBtLCBtUmVzKTtcbiAgfVxuXG4gIHJldHVybiBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcbn07XG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyAgIGFzIGluIHhtbUhpZXJhcmNoaWNhbEhtbS5jcHAgICAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5leHBvcnQgY29uc3QgaGhtbUxpa2VsaWhvb2RBbHBoYSA9IChleGl0TnVtLCBsaWtlbGlob29kVmVjLCBobSwgaG1SZXMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBoaG1tTGlrZWxpaG9vZEFscGhhID0gKGV4aXROdW0sIGxpa2VsaWhvb2RWZWMsIGhobW0sIGhobW1SZXMpID0+IHtcbi8vICAgY29uc3QgbSA9IGhobW07XG4vLyAgIGNvbnN0IG1SZXMgPSBoaG1tUmVzO1xuXG4gIGlmIChleGl0TnVtIDwgMCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxpa2VsaWhvb2RWZWNbaV0gPSAwO1xuICAgICAgZm9yIChsZXQgZXhpdCA9IDA7IGV4aXQgPCAzOyBleGl0KyspIHtcbiAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlczsgaysrKSB7XG4gICAgICAgICAgbGlrZWxpaG9vZFZlY1tpXVxuICAgICAgICAgICAgKz0gbVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oW2V4aXRdW2tdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxpa2VsaWhvb2RWZWNbaV0gPSAwO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlczsgaysrKSB7XG4gICAgICAgIGxpa2VsaWhvb2RWZWNbaV1cbiAgICAgICAgICArPSBtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZXhpdE51bV1ba107XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gRk9SV0FSRCBJTklUXG5cbmV4cG9ydCBjb25zdCBoaG1tRm9yd2FyZEluaXQgPSAob2JzSW4sIGhtLCBobVJlcykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGhobW1Gb3J3YXJkSW5pdCA9IChvYnNJbiwgaGhtbSwgaGhtbVJlcykgPT4ge1xuLy8gICBjb25zdCBobSA9IGhobW07XG4vLyAgIGNvbnN0IGhtUmVzID0gaGhtbVJlcztcbiAgbGV0IG5vcm1fY29uc3QgPSAwO1xuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gaW5pdGlhbGl6ZSBhbHBoYXNcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblxuICAgIGNvbnN0IG0gPSBobS5tb2RlbHNbaV07XG4gICAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gICAgY29uc3QgbVJlcyA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgIG1SZXMuYWxwaGFfaFtqXSA9IG5ldyBBcnJheShuc3RhdGVzKTtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgIG1SZXMuYWxwaGFfaFtqXVtrXSA9IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXJnb2RpY1xuICAgIGlmIChtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09IDApIHtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICAgICAgICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtrXSA9IG0ucHJpb3Jba11cbiAgICAgICAgICAgICAgICAgICAgICogZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic2VydmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2tdKTtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2tdID0gbS5wcmlvcltrXVxuICAgICAgICAgICAgICAgICAgICAgKiBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic2VydmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2tdKTtcbiAgICAgICAgfVxuICAgICAgICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCArPSBtUmVzLmFscGhhWzBdW2tdO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxlZnQtcmlnaHRcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5hbHBoYV9oWzBdWzBdID0gaG0ucHJpb3JbaV07XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICAgICAgaWYgKGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcbiAgICAgICAgbVJlcy5hbHBoYV9oWzBdWzBdICo9IGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNlcnZhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2tdKTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhX2hbMF1bMF0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNlcnZhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2tdKTtcbiAgICAgIH1cbiAgICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gbVJlcy5hbHBoYV9oWzBdWzBdO1xuICAgIH1cbiAgICBub3JtX2NvbnN0ICs9IG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gbm9ybWFsaXplIGFscGhhc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXG4gICAgY29uc3QgbnN0YXRlcyA9IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgICBmb3IgKGxldCBlID0gMDsgZSA8IDM7IGUrKykge1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtlXVtrXSAvPSBub3JtX2NvbnN0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQgPSB0cnVlO1xufTtcblxuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBGT1JXQVJEIFVQREFURVxuXG5leHBvcnQgY29uc3QgaGhtbUZvcndhcmRVcGRhdGUgPSAob2JzSW4sIGhtLCBobVJlcykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGhobW1Gb3J3YXJkVXBkYXRlID0gKG9ic0luLCBoaG1tLCBoaG1tUmVzKSA9PiB7XG4vLyAgIGNvbnN0IGhtID0gaGhtbTtcbi8vICAgY29uc3QgaG1SZXMgPSBoaG1tUmVzO1xuICBjb25zdCBubW9kZWxzID0gaG0ubW9kZWxzLmxlbmd0aDtcblxuICBsZXQgbm9ybV9jb25zdCA9IDA7XG4gIGxldCB0bXAgPSAwO1xuICBsZXQgZnJvbnQ7IC8vIGFycmF5XG5cbiAgaGhtbUxpa2VsaWhvb2RBbHBoYSgxLCBobVJlcy5mcm9udGllcl92MSwgaG0sIGhtUmVzKTtcbiAgaGhtbUxpa2VsaWhvb2RBbHBoYSgyLCBobVJlcy5mcm9udGllcl92MiwgaG0sIGhtUmVzKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG5tb2RlbHM7IGkrKykge1xuXG4gICAgY29uc3QgbSA9IGhtLm1vZGVsc1tpXTtcbiAgICBjb25zdCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgICBjb25zdCBtUmVzID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV07XG4gICAgXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PSBjb21wdXRlIGZyb250aWVyIHZhcmlhYmxlXG4gICAgZnJvbnQgPSBuZXcgQXJyYXkobnN0YXRlcyk7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcbiAgICAgIGZyb250W2pdID0gMDtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBlcmdvZGljXG4gICAgaWYgKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT0gMCkgeyAvLyBlcmdvZGljXG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5zdGF0ZXM7IGorKykge1xuICAgICAgICAgIGZyb250W2tdICs9IG0udHJhbnNpdGlvbltqICogbnN0YXRlcyArIGtdIC9cbiAgICAgICAgICAgICAgICAoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNbal0pICpcbiAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1bal07XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgc3JjaSA9IDA7IHNyY2kgPCBubW9kZWxzOyBzcmNpKyspIHtcbiAgICAgICAgICBmcm9udFtrXSArPSBtLnByaW9yW2tdICpcbiAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICBobVJlcy5mcm9udGllcl92MVtzcmNpXSAqXG4gICAgICAgICAgICAgICAgICBobS50cmFuc2l0aW9uW3NyY2ldW2ldXG4gICAgICAgICAgICAgICAgICArIGhtUmVzLmZyb250aWVyX3YyW3NyY2ldICpcbiAgICAgICAgICAgICAgICAgIGhtLnByaW9yW2ldXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxlZnQtcmlnaHRcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gayA9PSAwIDogZmlyc3Qgc3RhdGUgb2YgdGhlIHByaW1pdGl2ZVxuICAgICAgZnJvbnRbMF0gPSBtLnRyYW5zaXRpb25bMF0gKiBtUmVzLmFscGhhX2hbMF1bMF07XG5cbiAgICAgIGZvciAobGV0IHNyY2kgPSAwOyBzcmNpIDwgbm1vZGVsczsgc3JjaSsrKSB7XG4gICAgICAgIGZyb250WzBdICs9IGhtUmVzLmZyb250aWVyX3YxW3NyY2ldICpcbiAgICAgICAgICAgICAgaG0udHJhbnNpdGlvbltzcmNpXVtpXVxuICAgICAgICAgICAgICArIGhtUmVzLmZyb250aWVyX3YyW3NyY2ldICpcbiAgICAgICAgICAgICAgaG0ucHJpb3JbaV07XG4gICAgICB9XG5cbiAgICAgIC8vIGsgPiAwIDogcmVzdCBvZiB0aGUgcHJpbWl0aXZlXG4gICAgICBmb3IgKGxldCBrID0gMTsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICBmcm9udFtrXSArPSBtLnRyYW5zaXRpb25bayAqIDJdIC9cbiAgICAgICAgICAgICAgKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdKSAqXG4gICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtrXTtcbiAgICAgICAgZnJvbnRba10gKz0gbS50cmFuc2l0aW9uWyhrIC0gMSkgKiAyICsgMV0gL1xuICAgICAgICAgICAgICAoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNbayAtIDFdKSAqXG4gICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtrIC0gMV07XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgICAgbVJlcy5hbHBoYV9oW2pdW2tdID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvL2NvbnNvbGUubG9nKGZyb250KTtcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PSB1cGRhdGUgZm9yd2FyZCB2YXJpYWJsZVxuICAgIG1SZXMuZXhpdF9saWtlbGlob29kID0gMDtcbiAgICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCA9IDA7XG5cbiAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgaWYgKGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcbiAgICAgICAgdG1wID0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic2VydmF0aW9uLCBtLnN0YXRlc1trXSkgKlxuICAgICAgICAgICAgZnJvbnRba107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0bXAgPSBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic2VydmF0aW9uLCBtLnN0YXRlc1trXSkgKiBmcm9udFtrXTtcbiAgICAgIH1cblxuICAgICAgbVJlcy5hbHBoYV9oWzJdW2tdID0gaG0uZXhpdF90cmFuc2l0aW9uW2ldICpcbiAgICAgICAgICAgICAgICAgbS5leGl0UHJvYmFiaWxpdGllc1trXSAqIHRtcDtcbiAgICAgIG1SZXMuYWxwaGFfaFsxXVtrXSA9ICgxIC0gaG0uZXhpdF90cmFuc2l0aW9uW2ldKSAqXG4gICAgICAgICAgICAgICAgIG0uZXhpdFByb2JhYmlsaXRpZXNba10gKiB0bXA7XG4gICAgICBtUmVzLmFscGhhX2hbMF1ba10gPSAoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNba10pICogdG1wO1xuXG4gICAgICBtUmVzLmV4aXRfbGlrZWxpaG9vZCAgICArPSBtUmVzLmFscGhhX2hbMV1ba10gK1xuICAgICAgICAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzJdW2tdO1xuICAgICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgKz0gbVJlcy5hbHBoYV9oWzBdW2tdICtcbiAgICAgICAgICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsxXVtrXSArXG4gICAgICAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMl1ba107XG5cbiAgICAgIG5vcm1fY29uc3QgKz0gdG1wO1xuICAgIH1cblxuICAgIG1SZXMuZXhpdF9yYXRpbyA9IG1SZXMuZXhpdF9saWtlbGlob29kIC8gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBub3JtYWxpemUgYWxwaGFzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm1vZGVsczsgaSsrKSB7XG4gICAgZm9yIChsZXQgZSA9IDA7IGUgPCAzOyBlKyspIHtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgaG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtlXVtrXSAvPSBub3JtX2NvbnN0O1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaGhtbVVwZGF0ZVJlc3VsdHMgPSAoaG0sIGhtUmVzKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgaGhtbVVwZGF0ZVJlc3VsdHMgPSAoaGhtbSwgaGhtbVJlcykgPT4ge1xuLy8gICBjb25zdCBobSA9IGhobW07XG4vLyAgIGNvbnN0IGhtUmVzID0gaGhtbVJlcztcblxuICBsZXQgbWF4bG9nX2xpa2VsaWhvb2QgPSAwO1xuICBsZXQgbm9ybWNvbnN0X2luc3RhbnQgPSAwO1xuICBsZXQgbm9ybWNvbnN0X3Ntb290aGVkID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXG4gICAgbGV0IG1SZXMgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXTtcblxuICAgIGhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcbiAgICBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmxvZ19saWtlbGlob29kO1xuICAgIGhtUmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldID0gTWF0aC5leHAoaG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldKTtcblxuICAgIGhtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IGhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV07XG4gICAgaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IGhtUmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgbm9ybWNvbnN0X2luc3RhbnQgICArPSBobVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG4gICAgbm9ybWNvbnN0X3Ntb290aGVkICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgaWYgKGkgPT0gMCB8fCBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPiBtYXhsb2dfbGlrZWxpaG9vZCkge1xuICAgICAgbWF4bG9nX2xpa2VsaWhvb2QgPSBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV07XG4gICAgICBobVJlcy5saWtlbGllc3QgPSBpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgaG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1jb25zdF9pbnN0YW50O1xuICAgIGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gLz0gbm9ybWNvbnN0X3Ntb290aGVkO1xuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBoaG1tRmlsdGVyID0gKG9ic0luLCBobSwgaG1SZXMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBoaG1tRmlsdGVyID0gKG9ic0luLCBoaG1tLCBoaG1tUmVzKSA9PiB7XG4vLyAgIGNvbnN0IGhtID0gaGhtbTtcbi8vICAgY29uc3QgaG1SZXMgPSBoaG1tUmVzO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICBpZiAoaG0uY29uZmlndXJhdGlvbi5kZWZhdWx0X3BhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgaWYgKGhtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQpIHtcbiAgICAgIGhobW1Gb3J3YXJkVXBkYXRlKG9ic0luLCBobSwgaG1SZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaG1tRm9yd2FyZEluaXQob2JzSW4sIGhtLCBobVJlcyk7XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgaG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXSA9IGhtbUZpbHRlcihvYnNJbiwgaG0sIGhtUmVzKTtcbiAgICB9XG4gIH1cblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tIGNvbXB1dGUgdGltZSBwcm9ncmVzc2lvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgIGhtbVVwZGF0ZUFscGhhV2luZG93KFxuICAgICAgaG0ubW9kZWxzW2ldLFxuICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICApO1xuICAgIGhtbVVwZGF0ZVJlc3VsdHMoXG4gICAgICBobS5tb2RlbHNbaV0sXG4gICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuICAgICk7XG4gIH1cblxuICBoaG1tVXBkYXRlUmVzdWx0cyhobSwgaG1SZXMpO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgIGNvbnN0IGRpbSA9IGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmRpbWVuc2lvbjtcbiAgICBjb25zdCBkaW1JbiA9IGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmRpbWVuc2lvbl9pbnB1dDtcbiAgICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBobW1SZWdyZXNzaW9uKG9ic0luLGhtLm1vZGVsc1tpXSxcbiAgICAgICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXSk7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxpa2VsaWVzdFxuICAgIGlmIChobS5jb25maWd1cmF0aW9uLm11bHRpQ2xhc3NfcmVncmVzc2lvbl9lc3RpbWF0b3IgPT09IDApIHtcbiAgICAgIGhtUmVzLm91dHB1dF92YWx1ZXNcbiAgICAgICAgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tobVJlcy5saWtlbGllc3RdXG4gICAgICAgICAgICAgICAub3V0cHV0X3ZhbHVlcy5zbGljZSgwKTtcbiAgICAgIGhtUmVzLm91dHB1dF9jb3ZhcmlhbmNlXG4gICAgICAgID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaG1SZXMubGlrZWxpZXN0XVxuICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlLnNsaWNlKDApO1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG1peHR1cmVcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobVJlcy5vdXRwdXRfdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGhtUmVzLm91dHB1dF92YWx1ZXNbaV0gPSAwLjA7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtUmVzLm91dHB1dF9jb3ZhcmlhbmNlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGhtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBmb3IgKGxldCBkID0gMDsgZCA8IGRpbU91dDsgZCsrKSB7XG4gICAgICAgICAgaG1SZXMub3V0cHV0X3ZhbHVlc1tkXVxuICAgICAgICAgICAgKz0gaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAqXG4gICAgICAgICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5vdXRwdXRfdmFsdWVzW2RdO1xuXG4gICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICAgIGlmIChobS5jb25maWd1cmF0aW9uLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgICAgICAgICAgZm9yIChsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIgKyspIHtcbiAgICAgICAgICAgICAgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXVxuICAgICAgICAgICAgICAgICs9IGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gKlxuICAgICAgICAgICAgICAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF1cbiAgICAgICAgICAgICAgKz0gaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAqXG4gICAgICAgICAgICAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZF07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuIl19