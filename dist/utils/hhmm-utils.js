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
    mRes.output_values = m.states[mRes.likeliest_state].output_values.slice();
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
        best_alpha = mRes.alpha[i];
        mRes.likeliest_state = i;
      }
    }
  }

  mRes.window_minindex = mRes.likeliest_state - Math.floor(nstates / 2);
  mRes.window_maxindex = mRes.likeliest_state + Math.floor(nstates / 2);
  mRes.window_minindex = mRes.window_minindex >= 0 ? mRes.window_minindex : 0;
  mRes.window_maxindex = mRes.window_maxindex <= nstates ? mRes.window_maxindex : nstates;
  mRes.window_normalization_constant = 0;

  for (var _i7 = mRes.window_minindex; _i7 < mRes.window_maxindex; _i7++) {
    //------------------------------------------------------------- hierarchical
    if (m.parameters.hierarchical) {
      mRes.window_normalization_constant += mRes.alpha_h[0][_i7] + mRes.alpha_h[1][_i7];
      //--------------------------------------------------------- non-hierarchical
    } else {
      mRes.window_normalization_constant += mRes.alpha[_i7];
    }
  }
};

var hmmUpdateResults = exports.hmmUpdateResults = function hmmUpdateResults(m, mRes) {
  var bufLength = mRes.likelihood_buffer.length;
  mRes.likelihood_buffer[mRes.likelihood_buffer_index] = Math.log(mRes.instant_likelihood);
  // increment circular buffer index
  mRes.likelihood_buffer_index = (mRes.likelihood_buffer_index + 1) % bufLength;

  mRes.log_likelihood = mRes.likelihood_buffer.reduce(function (a, b) {
    return a + b;
  }, 0);
  mRes.log_likelihood /= bufLength;

  mRes.progress = 0;
  for (var i = mRes.window_minindex; i < mRes.window_maxindex; i++) {
    //------------------------------------------------------------- hierarchical
    if (m.parameters.hierarchical) {
      mRes.progress += (mRes.alpha_h[0][i] + mRes.alpha_h[1][i] + mRes.alpha_h[2][i]) * i / mRes.window_normalization_constant;
      //--------------------------------------------------------- non hierarchical
    } else {
      mRes.progress += mRes.alpha[i] * i / mRes.window_normalization_constant;
    }
  }

  mRes.progress /= Math.max(m.parameters.states, 2) - 1;
  mRes.progress = Math.min(mRes.progress, 1);
};

var hmmFilter = exports.hmmFilter = function hmmFilter(obsIn, m, mRes) {
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
    for (var _i8 = 0; _i8 < hm.models.length; _i8++) {
      likelihoodVec[_i8] = 0;
      for (var _k = 0; _k < hm.models[_i8].parameters.states; _k++) {
        likelihoodVec[_i8] += hmRes.singleClassHmmModelResults[_i8].alpha_h[exitNum][_k];
      }
    }
  }
};

//============================================ FORWARD INIT

var hhmmForwardInit = exports.hhmmForwardInit = function hhmmForwardInit(obsIn, hm, hmRes) {
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
  for (var _i9 = 0; _i9 < hm.models.length; _i9++) {

    var _nstates = hm.models[_i9].parameters.states;
    for (var e = 0; e < 3; e++) {
      for (var _k3 = 0; _k3 < _nstates; _k3++) {
        hmRes.singleClassHmmModelResults[_i9].alpha_h[e][_k3] /= norm_const;
      }
    }
  }

  hmRes.forward_initialized = true;
};

//========================================== FORWARD UPDATE

var hhmmForwardUpdate = exports.hhmmForwardUpdate = function hhmmForwardUpdate(obsIn, hm, hmRes) {
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
    if (m.parameters.transition_mode === 0) {
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

    //========================= update forward variable
    mRes.exit_likelihood = 0;
    mRes.instant_likelihood = 0;

    // end of the primitive : handle exit states
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

    // this clipping is not in the original code, but prevents cases of -Infinity
    // in log_likelihoods and NaNs in smoothed_log_likelihoods
    // (because of all "front" values being null from time to time) ...
    mRes.instant_likelihood = mRes.instant_likelihood > 1e-180 ? mRes.instant_likelihood : 1e-180;

    mRes.exit_ratio = mRes.exit_likelihood / mRes.instant_likelihood;
  }

  //==================================== normalize alphas
  for (var _i10 = 0; _i10 < nmodels; _i10++) {
    for (var e = 0; e < 3; e++) {
      for (var _k7 = 0; _k7 < hm.models[_i10].parameters.states; _k7++) {
        hmRes.singleClassHmmModelResults[_i10].alpha_h[e][_k7] /= norm_const;
      }
    }
  }
};

var hhmmUpdateResults = exports.hhmmUpdateResults = function hhmmUpdateResults(hm, hmRes) {
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

  var totalLikelihood = 0;
  for (var _i11 = 0; _i11 < hm.models.length; _i11++) {
    hmRes.instant_normalized_likelihoods[_i11] /= normconst_instant;
    hmRes.smoothed_normalized_likelihoods[_i11] /= normconst_smoothed;
    totalLikelihood += hmRes.smoothed_normalized_likelihoods[_i11];
  }
};

var hhmmFilter = exports.hhmmFilter = function hhmmFilter(obsIn, hm, hmRes) {
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
      hmRes.instant_likelihoods[i] = hmmFilter(obsIn, hm.models[i], hmRes.singleClassHmmModelResults[i]);
    }
  }

  //----------------- compute time progression
  for (var _i12 = 0; _i12 < hm.models.length; _i12++) {
    hmmUpdateAlphaWindow(hm.models[_i12], hmRes.singleClassHmmModelResults[_i12]);
    hmmUpdateResults(hm.models[_i12], hmRes.singleClassHmmModelResults[_i12]);
  }

  hhmmUpdateResults(hm, hmRes);

  //-------------------------------------------------------------------- bimodal
  if (hm.shared_parameters.bimodal) {
    var dim = hm.shared_parameters.dimension;
    var dimIn = hm.shared_parameters.dimension_input;
    var dimOut = dim - dimIn;

    for (var _i13 = 0; _i13 < hm.models.length; _i13++) {
      hmmRegression(obsIn, hm.models[_i13], hmRes.singleClassHmmModelResults[_i13]);
    }

    //---------------------------------------------------------------- likeliest
    if (hm.configuration.multiClass_regression_estimator === 0) {
      hmRes.output_values = hmRes.singleClassHmmModelResults[hmRes.likeliest].output_values.slice(0);
      hmRes.output_covariance = hmRes.singleClassHmmModelResults[hmRes.likeliest].output_covariance.slice(0);
      //------------------------------------------------------------------ mixture
    } else {
      for (var _i14 = 0; _i14 < hmRes.output_values.length; _i14++) {
        hmRes.output_values[_i14] = 0.0;
      }
      for (var _i15 = 0; _i15 < hmRes.output_covariance.length; _i15++) {
        hmRes.output_covariance[_i15] = 0.0;
      }

      for (var _i16 = 0; _i16 < hm.models.length; _i16++) {
        for (var d = 0; d < dimOut; d++) {
          hmRes.output_values[d] += hmRes.smoothed_normalized_likelihoods[_i16] * hmRes.singleClassHmmModelResults[_i16].output_values[d];

          //--------------------------------------------------------------- full
          if (hm.configuration.covariance_mode === 0) {
            for (var d2 = 0; d2 < dimOut; d2++) {
              hmRes.output_covariance[d * dimOut + d2] += hmRes.smoothed_normalized_likelihoods[_i16] * hmRes.singleClassHmmModelResults[_i16].output_covariance[d * dimOut + d2];
            }
            //----------------------------------------------------------- diagonal
          } else {
            hmRes.output_covariance[d] += hmRes.smoothed_normalized_likelihoods[_i16] * hmRes.singleClassHmmModelResults[_i16].output_covariance[d];
          }
        }
      }
    }
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhobW0tdXRpbHMuanMiXSwibmFtZXMiOlsiZ21tVXRpbHMiLCJobW1SZWdyZXNzaW9uIiwib2JzSW4iLCJtIiwibVJlcyIsImRpbSIsInN0YXRlcyIsImNvbXBvbmVudHMiLCJkaW1lbnNpb24iLCJkaW1JbiIsImRpbWVuc2lvbl9pbnB1dCIsImRpbU91dCIsIm91dENvdmFyU2l6ZSIsImNvdmFyaWFuY2VfbW9kZSIsIm91dHB1dF92YWx1ZXMiLCJBcnJheSIsImkiLCJvdXRwdXRfY292YXJpYW5jZSIsInBhcmFtZXRlcnMiLCJyZWdyZXNzaW9uX2VzdGltYXRvciIsImdtbUxpa2VsaWhvb2QiLCJsaWtlbGllc3Rfc3RhdGUiLCJzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cyIsImdtbVJlZ3Jlc3Npb24iLCJzbGljZSIsImNsaXBNaW5TdGF0ZSIsIndpbmRvd19taW5pbmRleCIsImNsaXBNYXhTdGF0ZSIsImxlbmd0aCIsIndpbmRvd19tYXhpbmRleCIsIm5vcm1Db25zdGFudCIsIndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50IiwidG1wUHJlZGljdGVkT3V0cHV0IiwiZCIsImhpZXJhcmNoaWNhbCIsImFscGhhX2giLCJkMiIsImFscGhhIiwiaG1tRm9yd2FyZEluaXQiLCJvYnNPdXQiLCJuc3RhdGVzIiwibm9ybUNvbnN0IiwidHJhbnNpdGlvbl9tb2RlIiwiYmltb2RhbCIsInByaW9yIiwiZ21tT2JzUHJvYkJpbW9kYWwiLCJnbW1PYnNQcm9iSW5wdXQiLCJnbW1PYnNQcm9iIiwiaG1tRm9yd2FyZFVwZGF0ZSIsInByZXZpb3VzX2FscGhhIiwiaiIsInRyYW5zaXRpb24iLCJobW1VcGRhdGVBbHBoYVdpbmRvdyIsImJlc3RfYWxwaGEiLCJNYXRoIiwiZmxvb3IiLCJobW1VcGRhdGVSZXN1bHRzIiwiYnVmTGVuZ3RoIiwibGlrZWxpaG9vZF9idWZmZXIiLCJsaWtlbGlob29kX2J1ZmZlcl9pbmRleCIsImxvZyIsImluc3RhbnRfbGlrZWxpaG9vZCIsImxvZ19saWtlbGlob29kIiwicmVkdWNlIiwiYSIsImIiLCJwcm9ncmVzcyIsIm1heCIsIm1pbiIsImhtbUZpbHRlciIsImN0IiwiZm9yd2FyZF9pbml0aWFsaXplZCIsImhobW1MaWtlbGlob29kQWxwaGEiLCJleGl0TnVtIiwibGlrZWxpaG9vZFZlYyIsImhtIiwiaG1SZXMiLCJtb2RlbHMiLCJleGl0IiwiayIsInNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzIiwiaGhtbUZvcndhcmRJbml0Iiwibm9ybV9jb25zdCIsInNoYXJlZF9wYXJhbWV0ZXJzIiwiZSIsImhobW1Gb3J3YXJkVXBkYXRlIiwibm1vZGVscyIsInRtcCIsImZyb250IiwiZnJvbnRpZXJfdjEiLCJmcm9udGllcl92MiIsImV4aXRQcm9iYWJpbGl0aWVzIiwic3JjaSIsImV4aXRfbGlrZWxpaG9vZCIsImV4aXRfdHJhbnNpdGlvbiIsImV4aXRfcmF0aW8iLCJoaG1tVXBkYXRlUmVzdWx0cyIsIm1heGxvZ19saWtlbGlob29kIiwibm9ybWNvbnN0X2luc3RhbnQiLCJub3JtY29uc3Rfc21vb3RoZWQiLCJpbnN0YW50X2xpa2VsaWhvb2RzIiwic21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzIiwic21vb3RoZWRfbGlrZWxpaG9vZHMiLCJleHAiLCJpbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzIiwibGlrZWxpZXN0IiwidG90YWxMaWtlbGlob29kIiwiaGhtbUZpbHRlciIsImNvbmZpZ3VyYXRpb24iLCJkZWZhdWx0X3BhcmFtZXRlcnMiLCJtdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0lBQVlBLFE7Ozs7QUFFWjs7OztBQUlBO0FBQ0E7QUFDQTs7QUFFTyxJQUFNQyx3Q0FBZ0IsU0FBaEJBLGFBQWdCLENBQUNDLEtBQUQsRUFBUUMsQ0FBUixFQUFXQyxJQUFYLEVBQW9CO0FBQy9DLE1BQU1DLE1BQU1G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LENBQWxELENBRkw7O0FBSUE7QUFDQSxjQUFJMEMsR0FBR2tDLGFBQUgsQ0FBaUJoRyxlQUFqQixLQUFxQyxDQUF6QyxFQUE0QztBQUMxQyxpQkFBSyxJQUFJdUIsS0FBSyxDQUFkLEVBQWlCQSxLQUFLekIsTUFBdEIsRUFBOEJ5QixJQUE5QixFQUFxQztBQUNuQ3dDLG9CQUFNM0QsaUJBQU4sQ0FBd0JnQixJQUFJdEIsTUFBSixHQUFheUIsRUFBckMsS0FDS3dDLE1BQU02QiwrQkFBTixDQUFzQ3pGLElBQXRDLElBQ0E0RCxNQUFNSSwwQkFBTixDQUFpQ2hFLElBQWpDLEVBQ0VDLGlCQURGLENBQ29CZ0IsSUFBSXRCLE1BQUosR0FBYXlCLEVBRGpDLENBRkw7QUFJRDtBQUNIO0FBQ0MsV0FSRCxNQVFPO0FBQ0x3QyxrQkFBTTNELGlCQUFOLENBQXdCZ0IsQ0FBeEIsS0FDSzJDLE1BQU02QiwrQkFBTixDQUFzQ3pGLElBQXRDLElBQ0E0RCxNQUFNSSwwQkFBTixDQUFpQ2hFLElBQWpDLEVBQ0VDLGlCQURGLENBQ29CZ0IsQ0FEcEIsQ0FGTDtBQUlEO0FBQ0Y7QUFDRjtBQUNGO0FBQ0Y7QUFDRixDQW5GTSIsImZpbGUiOiJoaG1tLXV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZ21tVXRpbHMgZnJvbSAnLi9nbW0tdXRpbHMnO1xuXG4vKipcbiAqICBmdW5jdGlvbnMgdXNlZCBmb3IgZGVjb2RpbmcsIHRyYW5zbGF0ZWQgZnJvbSBYTU1cbiAqL1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgIGFzIGluIHhtbUhtbVNpbmdsZUNsYXNzLmNwcCAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBobW1SZWdyZXNzaW9uID0gKG9ic0luLCBtLCBtUmVzKSA9PiB7XG4gIGNvbnN0IGRpbSA9IG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uZGltZW5zaW9uO1xuICBjb25zdCBkaW1JbiA9IG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uZGltZW5zaW9uX2lucHV0O1xuICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICBsZXQgb3V0Q292YXJTaXplO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgb3V0Q292YXJTaXplID0gZGltT3V0ICogZGltT3V0O1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQ7XG4gIH1cblxuICBtUmVzLm91dHB1dF92YWx1ZXMgPSBuZXcgQXJyYXkoZGltT3V0KTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgfVxuICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlID0gbmV3IEFycmF5KG91dENvdmFyU2l6ZSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0Q292YXJTaXplOyBpKyspIHtcbiAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuICB9XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGlrZWxpZXN0XG4gIGlmIChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT09IDIpIHtcbiAgICBnbW1VdGlscy5nbW1MaWtlbGlob29kKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0X3N0YXRlXVxuICAgICk7XG4gICAgZ21tVXRpbHMuZ21tUmVncmVzc2lvbihcbiAgICAgIG9ic0luLFxuICAgICAgbS5zdGF0ZXNbbVJlcy5saWtlbGllc3Rfc3RhdGVdLFxuICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV1cbiAgICApO1xuICAgIG1SZXMub3V0cHV0X3ZhbHVlc1xuICAgICAgPSBtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0ub3V0cHV0X3ZhbHVlcy5zbGljZSgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGNsaXBNaW5TdGF0ZSA9IChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT0gMClcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gd2luZG93ZWRcbiAgICAgICAgICAgICAgICAgICAgOiBtUmVzLndpbmRvd19taW5pbmRleDtcblxuICBjb25zdCBjbGlwTWF4U3RhdGUgPSAobS5wYXJhbWV0ZXJzLnJlZ3Jlc3Npb25fZXN0aW1hdG9yID09IDApXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICAgICAgICAgICAgICA/IG0uc3RhdGVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gd2luZG93ZWRcbiAgICAgICAgICAgICAgICAgICAgOiBtUmVzLndpbmRvd19tYXhpbmRleDtcblxuICBsZXQgbm9ybUNvbnN0YW50ID0gKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PSAwKVxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICAgICAgICAgICAgPyAxLjBcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHdpbmRvd2VkXG4gICAgICAgICAgICAgICAgICAgIDogbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcblxuICBpZiAobm9ybUNvbnN0YW50IDw9IDAuMCkge1xuICAgIG5vcm1Db25zdGFudCA9IDEuO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IGNsaXBNaW5TdGF0ZTsgaSA8IGNsaXBNYXhTdGF0ZTsgaSsrKSB7XG4gICAgZ21tVXRpbHMuZ21tTGlrZWxpaG9vZChcbiAgICAgIG9ic0luLFxuICAgICAgbS5zdGF0ZXNbaV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgKTtcbiAgICBnbW1VdGlscy5nbW1SZWdyZXNzaW9uKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1tpXSxcbiAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICApO1xuICAgIGNvbnN0IHRtcFByZWRpY3RlZE91dHB1dFxuICAgICAgPSBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG5cbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IGRpbU91dDsgZCsrKSB7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICAgICAgaWYgKG1SZXMuaGllcmFyY2hpY2FsKSB7XG4gICAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tkXVxuICAgICAgICAgICs9IChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICB0bXBQcmVkaWN0ZWRPdXRwdXRbZF0gLyBub3JtQ29uc3RhbnQ7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICBpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyKyspIHtcbiAgICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXVxuICAgICAgICAgICAgICArPSAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG4gICAgICAgICAgICAgICAgIChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXSAvXG4gICAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICAgIH1cbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICAgKz0gKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgICAgKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2RdIC9cbiAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICB9XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2RdICs9IG1SZXMuYWxwaGFbaV0gKlxuICAgICAgICAgICAgICAgICAgICAgdG1wUHJlZGljdGVkT3V0cHV0W2RdIC8gbm9ybUNvbnN0YW50O1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgaWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG4gICAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl1cbiAgICAgICAgICAgICAgKz0gIG1SZXMuYWxwaGFbaV0gKiBtUmVzLmFscGhhW2ldICpcbiAgICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXSAvXG4gICAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICAgIH1cbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF0gKz0gbVJlcy5hbHBoYVtpXSAqIG1SZXMuYWxwaGFbaV0gKlxuICAgICAgICAgICAgICAgICAgICAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkXSAvXG4gICAgICAgICAgICAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1Gb3J3YXJkSW5pdCA9IChvYnNJbiwgbSwgbVJlcywgb2JzT3V0ID0gW10pID0+IHtcbiAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gIGxldCBub3JtQ29uc3QgPSAwLjA7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBlcmdvZGljXG4gIGlmIChtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG4gICAgICBpZiAobS5zdGF0ZXNbaV0uY29tcG9uZW50c1swXS5iaW1vZGFsKSB7XG4gICAgICAgIGlmIChvYnNPdXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIG1SZXMuYWxwaGFbaV0gPSBtLnByaW9yW2ldICpcbiAgICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JzT3V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbaV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1SZXMuYWxwaGFbaV0gPSBtLnByaW9yW2ldICpcbiAgICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhW2ldID0gbS5wcmlvcltpXSAqXG4gICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbaV0pO1xuICAgICAgfVxuICAgICAgbm9ybUNvbnN0ICs9IG1SZXMuYWxwaGFbaV07XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxlZnQtcmlnaHRcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1SZXMuYWxwaGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gPSAwLjA7XG4gICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWxcbiAgICBpZiAobS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5iaW1vZGFsKSB7XG4gICAgICBpZiAob2JzT3V0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgbVJlcy5hbHBoYVswXSA9IGdtbVV0aWxzLmdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ic091dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1swXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhWzBdID0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1swXSk7XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB1bmltb2RhbFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLmFscGhhWzBdID0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbMF0pO1xuICAgIH1cbiAgICBub3JtQ29uc3QgKz0gbVJlcy5hbHBoYVswXTtcbiAgfVxuXG4gIGlmIChub3JtQ29uc3QgPiAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gLz0gbm9ybUNvbnN0O1xuICAgIH1cbiAgICByZXR1cm4gKDEuMCAvIG5vcm1Db25zdCk7XG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gPSAxLjAgLyBuc3RhdGVzO1xuICAgIH1cbiAgICByZXR1cm4gMS4wO1xuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1Gb3J3YXJkVXBkYXRlID0gKG9ic0luLCBtLCBtUmVzLCBvYnNPdXQgPSBbXSkgPT4ge1xuICBjb25zdCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgbGV0IG5vcm1Db25zdCA9IDAuMDtcblxuICBtUmVzLnByZXZpb3VzX2FscGhhID0gbVJlcy5hbHBoYS5zbGljZSgwKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICBtUmVzLmFscGhhW2ldID0gMDtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBlcmdvZGljXG4gICAgaWYgKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT09IDApIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnN0YXRlczsgaisrKSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtqXSAqXG4gICAgICAgICAgICAgICAgIG1SZXMudHJhbnNpdGlvbltqICogbnN0YXRlcysgaV07XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGVmdC1yaWdodFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLmFscGhhW2ldICs9IG1SZXMucHJldmlvdXNfYWxwaGFbaV0gKiBtUmVzLnRyYW5zaXRpb25baSAqIDJdO1xuICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtpIC0gMV0gKlxuICAgICAgICAgICAgICAgICBtUmVzLnRyYW5zaXRpb25bKGkgLSAxKSAqIDIgKyAxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYWxwaGFbMF0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtuc3RhdGVzIC0gMV0gKlxuICAgICAgICAgICAgICAgICBtUmVzLnRyYW5zaXRpb25bbnN0YXRlcyAqIDIgLSAxXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG4gICAgaWYgKG0uc3RhdGVzW2ldLmNvbXBvbmVudHNbMF0uYmltb2RhbCkge1xuICAgICAgaWYgKG9ic091dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNPdXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1tpXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhW2ldICo9IGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2ldKTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbaV0pO1xuICAgIH1cbiAgICBub3JtQ29uc3QgKz0gbVJlcy5hbHBoYVtpXTtcbiAgfVxuXG4gIGlmIChub3JtQ29uc3QgPiAxZS0zMDApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgICAgbVJlcy5hbHBoYVtpXSAvPSBub3JtQ29uc3Q7XG4gICAgfVxuICAgIHJldHVybiAoMS4wIC8gbm9ybUNvbnN0KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gMC4wO1xuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1VcGRhdGVBbHBoYVdpbmRvdyA9IChtLCBtUmVzKSA9PiB7XG4gIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuXG4gIG1SZXMubGlrZWxpZXN0X3N0YXRlID0gMDtcblxuICBsZXQgYmVzdF9hbHBoYTtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gIGlmIChtLnBhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgYmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFfaFswXVswXSArIG1SZXMuYWxwaGFfaFsxXVswXTtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBub24taGllcmFyY2hpY2FsXG4gIH0gZWxzZSB7XG4gICAgYmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFbMF07XG4gIH1cblxuICBmb3IgKGxldCBpID0gMTsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcbiAgICBpZiAobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkge1xuICAgICAgaWYgKChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pID4gYmVzdF9hbHBoYSkge1xuICAgICAgICBiZXN0X2FscGhhID0gbVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldO1xuICAgICAgICBtUmVzLmxpa2VsaWVzdF9zdGF0ZSA9IGk7XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICAgIH0gZWxzZSB7XG4gICAgICBpZihtUmVzLmFscGhhW2ldID4gYmVzdF9hbHBoYSkge1xuICAgICAgICBiZXN0X2FscGhhID0gbVJlcy5hbHBoYVtpXTtcbiAgICAgICAgbVJlcy5saWtlbGllc3Rfc3RhdGUgPSBpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG1SZXMud2luZG93X21pbmluZGV4ID0gbVJlcy5saWtlbGllc3Rfc3RhdGUgLSBNYXRoLmZsb29yKG5zdGF0ZXMgLyAyKTtcbiAgbVJlcy53aW5kb3dfbWF4aW5kZXggPSBtUmVzLmxpa2VsaWVzdF9zdGF0ZSArIE1hdGguZmxvb3IobnN0YXRlcyAvIDIpO1xuICBtUmVzLndpbmRvd19taW5pbmRleCA9IChtUmVzLndpbmRvd19taW5pbmRleCA+PSAwKVxuICAgICAgICAgICAgICAgICAgICAgICA/IG1SZXMud2luZG93X21pbmluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgIDogMDtcbiAgbVJlcy53aW5kb3dfbWF4aW5kZXggPSAobVJlcy53aW5kb3dfbWF4aW5kZXggPD0gbnN0YXRlcylcbiAgICAgICAgICAgICAgICAgICAgICAgPyBtUmVzLndpbmRvd19tYXhpbmRleFxuICAgICAgICAgICAgICAgICAgICAgICA6IG5zdGF0ZXM7XG4gIG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQgPSAwO1xuXG4gIGZvciAobGV0IGkgPSBtUmVzLndpbmRvd19taW5pbmRleDsgaSA8IG1SZXMud2luZG93X21heGluZGV4OyBpKyspIHtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gICAgaWYgKG0ucGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHtcbiAgICAgIG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQgKz1cbiAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldO1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWxcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudCArPVxuICAgICAgICBtUmVzLmFscGhhW2ldO1xuICAgIH1cbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaG1tVXBkYXRlUmVzdWx0cyA9IChtLCBtUmVzKSA9PiB7XG4gIGNvbnN0IGJ1Zkxlbmd0aCA9IG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW21SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhdXG4gICAgPSBNYXRoLmxvZyhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCk7XG4gIC8vIGluY3JlbWVudCBjaXJjdWxhciBidWZmZXIgaW5kZXhcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleFxuICAgID0gKG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXggKyAxKSAlIGJ1Zkxlbmd0aDtcblxuICBtUmVzLmxvZ19saWtlbGlob29kID0gbVJlcy5saWtlbGlob29kX2J1ZmZlci5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcbiAgbVJlcy5sb2dfbGlrZWxpaG9vZCAvPSBidWZMZW5ndGg7XG5cbiAgbVJlcy5wcm9ncmVzcyA9IDA7XG4gIGZvciAobGV0IGkgPSBtUmVzLndpbmRvd19taW5pbmRleDsgaSA8IG1SZXMud2luZG93X21heGluZGV4OyBpKyspIHtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gICAgaWYgKG0ucGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHtcbiAgICAgIG1SZXMucHJvZ3Jlc3NcbiAgICAgICAgKz0gKFxuICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2ldICtcbiAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsxXVtpXSArXG4gICAgICAgICAgICBtUmVzLmFscGhhX2hbMl1baV1cbiAgICAgICAgICApICpcbiAgICAgICAgICBpIC8gbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBub24gaGllcmFyY2hpY2FsXG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMucHJvZ3Jlc3MgKz0gbVJlcy5hbHBoYVtpXSAqXG4gICAgICAgICAgICAgICBpIC8gbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcbiAgICB9XG4gIH1cblxuICBtUmVzLnByb2dyZXNzIC89IChNYXRoLm1heChtLnBhcmFtZXRlcnMuc3RhdGVzLCAyKSAtIDEpO1xuICBtUmVzLnByb2dyZXNzID0gTWF0aC5taW4obVJlcy5wcm9ncmVzcywgMSk7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1GaWx0ZXIgPSAob2JzSW4sIG0sIG1SZXMpID0+IHtcbiAgbGV0IGN0ID0gMC4wO1xuICBpZiAobVJlcy5mb3J3YXJkX2luaXRpYWxpemVkKSB7XG4gICAgY3QgPSBobW1Gb3J3YXJkVXBkYXRlKG9ic0luLCBtLCBtUmVzKTtcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoOyBqKyspIHtcbiAgICAgIG1SZXMubGlrZWxpaG9vZF9idWZmZXJbal0gPSAwLjA7XG4gICAgfVxuICAgIGN0ID0gaG1tRm9yd2FyZEluaXQob2JzSW4sIG0sIG1SZXMpO1xuICAgIG1SZXMuZm9yd2FyZF9pbml0aWFsaXplZCA9IHRydWU7XG4gIH1cblxuICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCA9IDEuMCAvIGN0O1xuXG4gIGhtbVVwZGF0ZUFscGhhV2luZG93KG0sIG1SZXMpO1xuICBobW1VcGRhdGVSZXN1bHRzKG0sIG1SZXMpO1xuXG4gIGlmIChtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcbiAgICBobW1SZWdyZXNzaW9uKG9ic0luLCBtLCBtUmVzKTtcbiAgfVxuXG4gIHJldHVybiBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcbn07XG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyAgIGFzIGluIHhtbUhpZXJhcmNoaWNhbEhtbS5jcHAgICAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5leHBvcnQgY29uc3QgaGhtbUxpa2VsaWhvb2RBbHBoYSA9IChleGl0TnVtLCBsaWtlbGlob29kVmVjLCBobSwgaG1SZXMpID0+IHtcbiAgaWYgKGV4aXROdW0gPCAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxpa2VsaWhvb2RWZWNbaV0gPSAwO1xuICAgICAgZm9yIChsZXQgZXhpdCA9IDA7IGV4aXQgPCAzOyBleGl0KyspIHtcbiAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBobS5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7IGsrKykge1xuICAgICAgICAgIGxpa2VsaWhvb2RWZWNbaV1cbiAgICAgICAgICAgICs9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZXhpdF1ba107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxpa2VsaWhvb2RWZWNbaV0gPSAwO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBobS5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7IGsrKykge1xuICAgICAgICBsaWtlbGlob29kVmVjW2ldXG4gICAgICAgICAgKz0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtleGl0TnVtXVtrXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBGT1JXQVJEIElOSVRcblxuZXhwb3J0IGNvbnN0IGhobW1Gb3J3YXJkSW5pdCA9IChvYnNJbiwgaG0sIGhtUmVzKSA9PiB7XG4gIGxldCBub3JtX2NvbnN0ID0gMDtcblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IGluaXRpYWxpemUgYWxwaGFzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICBjb25zdCBtID0gaG0ubW9kZWxzW2ldO1xuICAgIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICAgIGNvbnN0IG1SZXMgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICBtUmVzLmFscGhhX2hbal0gPSBuZXcgQXJyYXkobnN0YXRlcyk7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICBtUmVzLmFscGhhX2hbal1ba10gPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVyZ29kaWNcbiAgICBpZiAobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PSAwKSB7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWxcbiAgICAgICAgaWYgKGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcbiAgICAgICAgICBtUmVzLmFscGhhX2hbMF1ba10gPSBtLnByaW9yW2tdICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sIG0uc3RhdGVzW2tdKTtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2tdID0gbS5wcmlvcltrXSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNba10pO1xuICAgICAgICB9XG4gICAgICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kICs9IG1SZXMuYWxwaGFfaFswXVtrXTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsZWZ0LXJpZ2h0XG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMuYWxwaGFfaFswXVswXSA9IGhtLnByaW9yW2ldO1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWxcbiAgICAgIGlmIChobS5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG4gICAgICAgIG1SZXMuYWxwaGFfaFswXVswXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sIG0uc3RhdGVzWzBdKTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhX2hbMF1bMF0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbMF0pO1xuICAgICAgfVxuICAgICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSBtUmVzLmFscGhhX2hbMF1bMF07XG4gICAgfVxuXG4gICAgbm9ybV9jb25zdCArPSBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IG5vcm1hbGl6ZSBhbHBoYXNcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblxuICAgIGNvbnN0IG5zdGF0ZXMgPSBobS5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gICAgZm9yIChsZXQgZSA9IDA7IGUgPCAzOyBlKyspIHtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZV1ba10gLz0gbm9ybV9jb25zdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBobVJlcy5mb3J3YXJkX2luaXRpYWxpemVkID0gdHJ1ZTtcbn07XG5cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gRk9SV0FSRCBVUERBVEVcblxuZXhwb3J0IGNvbnN0IGhobW1Gb3J3YXJkVXBkYXRlID0gKG9ic0luLCBobSwgaG1SZXMpID0+IHtcbiAgY29uc3Qgbm1vZGVscyA9IGhtLm1vZGVscy5sZW5ndGg7XG5cbiAgbGV0IG5vcm1fY29uc3QgPSAwO1xuICBsZXQgdG1wID0gMDtcbiAgbGV0IGZyb250OyAvLyBhcnJheVxuXG4gIGhobW1MaWtlbGlob29kQWxwaGEoMSwgaG1SZXMuZnJvbnRpZXJfdjEsIGhtLCBobVJlcyk7XG4gIGhobW1MaWtlbGlob29kQWxwaGEoMiwgaG1SZXMuZnJvbnRpZXJfdjIsIGhtLCBobVJlcyk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBubW9kZWxzOyBpKyspIHtcblxuICAgIGNvbnN0IG0gPSBobS5tb2RlbHNbaV07XG4gICAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gICAgY29uc3QgbVJlcyA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldO1xuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PSBjb21wdXRlIGZyb250aWVyIHZhcmlhYmxlXG4gICAgZnJvbnQgPSBuZXcgQXJyYXkobnN0YXRlcyk7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcbiAgICAgIGZyb250W2pdID0gMDtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBlcmdvZGljXG4gICAgaWYgKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT09IDApIHsgLy8gZXJnb2RpY1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcbiAgICAgICAgICBmcm9udFtrXSArPSBtLnRyYW5zaXRpb25baiAqIG5zdGF0ZXMgKyBrXSAvXG4gICAgICAgICAgICAgICAgKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2pdKSAqXG4gICAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2pdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IHNyY2kgPSAwOyBzcmNpIDwgbm1vZGVsczsgc3JjaSsrKSB7XG4gICAgICAgICAgZnJvbnRba10gKz0gbS5wcmlvcltrXSAqXG4gICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgaG1SZXMuZnJvbnRpZXJfdjFbc3JjaV0gKlxuICAgICAgICAgICAgICAgICAgaG0udHJhbnNpdGlvbltzcmNpXVtpXVxuICAgICAgICAgICAgICAgICAgKyBobVJlcy5mcm9udGllcl92MltzcmNpXSAqXG4gICAgICAgICAgICAgICAgICBobS5wcmlvcltpXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsZWZ0LXJpZ2h0XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGsgPT0gMCA6IGZpcnN0IHN0YXRlIG9mIHRoZSBwcmltaXRpdmVcbiAgICAgIGZyb250WzBdID0gbS50cmFuc2l0aW9uWzBdICogbVJlcy5hbHBoYV9oWzBdWzBdO1xuXG4gICAgICBmb3IgKGxldCBzcmNpID0gMDsgc3JjaSA8IG5tb2RlbHM7IHNyY2krKykge1xuICAgICAgICBmcm9udFswXSArPSBobVJlcy5mcm9udGllcl92MVtzcmNpXSAqXG4gICAgICAgICAgICAgICAgICAgIGhtLnRyYW5zaXRpb25bc3JjaV1baV0gK1xuICAgICAgICAgICAgICAgICAgICBobVJlcy5mcm9udGllcl92MltzcmNpXSAqXG4gICAgICAgICAgICAgICAgICAgIGhtLnByaW9yW2ldO1xuICAgICAgfVxuXG4gICAgICAvLyBrID4gMCA6IHJlc3Qgb2YgdGhlIHByaW1pdGl2ZVxuICAgICAgZm9yIChsZXQgayA9IDE7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgZnJvbnRba10gKz0gbS50cmFuc2l0aW9uW2sgKiAyXSAvXG4gICAgICAgICAgICAgICAgICAgICgxIC0gbS5leGl0UHJvYmFiaWxpdGllc1trXSkgKlxuICAgICAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1ba107XG4gICAgICAgIGZyb250W2tdICs9IG0udHJhbnNpdGlvblsoayAtIDEpICogMiArIDFdIC9cbiAgICAgICAgICAgICAgICAgICAgKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2sgLSAxXSkgKlxuICAgICAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1bayAtIDFdO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICAgIG1SZXMuYWxwaGFfaFtqXVtrXSA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT0gdXBkYXRlIGZvcndhcmQgdmFyaWFibGVcbiAgICBtUmVzLmV4aXRfbGlrZWxpaG9vZCA9IDA7XG4gICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSAwO1xuXG4gICAgLy8gZW5kIG9mIHRoZSBwcmltaXRpdmUgOiBoYW5kbGUgZXhpdCBzdGF0ZXNcbiAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgaWYgKGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcbiAgICAgICAgdG1wID0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLCBtLnN0YXRlc1trXSkgKiBmcm9udFtrXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRtcCA9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2tdKSAqIGZyb250W2tdO1xuICAgICAgfVxuXG4gICAgICBtUmVzLmFscGhhX2hbMl1ba10gPSBobS5leGl0X3RyYW5zaXRpb25baV0gKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5leGl0UHJvYmFiaWxpdGllc1trXSAqIHRtcDtcbiAgICAgIG1SZXMuYWxwaGFfaFsxXVtrXSA9ICgxIC0gaG0uZXhpdF90cmFuc2l0aW9uW2ldKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdICogdG1wO1xuICAgICAgbVJlcy5hbHBoYV9oWzBdW2tdID0gKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdKSAqIHRtcDtcblxuICAgICAgbVJlcy5leGl0X2xpa2VsaWhvb2QgKz0gbVJlcy5hbHBoYV9oWzFdW2tdICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsyXVtrXTtcbiAgICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kICs9IG1SZXMuYWxwaGFfaFswXVtrXSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMV1ba10gK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzJdW2tdO1xuXG4gICAgICBub3JtX2NvbnN0ICs9IHRtcDtcblxuICAgIH1cblxuICAgIC8vIHRoaXMgY2xpcHBpbmcgaXMgbm90IGluIHRoZSBvcmlnaW5hbCBjb2RlLCBidXQgcHJldmVudHMgY2FzZXMgb2YgLUluZmluaXR5XG4gICAgLy8gaW4gbG9nX2xpa2VsaWhvb2RzIGFuZCBOYU5zIGluIHNtb290aGVkX2xvZ19saWtlbGlob29kc1xuICAgIC8vIChiZWNhdXNlIG9mIGFsbCBcImZyb250XCIgdmFsdWVzIGJlaW5nIG51bGwgZnJvbSB0aW1lIHRvIHRpbWUpIC4uLlxuICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPiAxZS0xODBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IG1SZXMuaW5zdGFudF9saWtlbGlob29kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAxZS0xODA7XG5cbiAgICBtUmVzLmV4aXRfcmF0aW8gPSBtUmVzLmV4aXRfbGlrZWxpaG9vZCAvIG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gbm9ybWFsaXplIGFscGhhc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5tb2RlbHM7IGkrKykge1xuICAgIGZvciAobGV0IGUgPSAwOyBlIDwgMzsgZSsrKSB7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlczsgaysrKSB7XG4gICAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZV1ba10gLz0gbm9ybV9jb25zdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhobW1VcGRhdGVSZXN1bHRzID0gKGhtLCBobVJlcykgPT4ge1xuICBsZXQgbWF4bG9nX2xpa2VsaWhvb2QgPSAwO1xuICBsZXQgbm9ybWNvbnN0X2luc3RhbnQgPSAwO1xuICBsZXQgbm9ybWNvbnN0X3Ntb290aGVkID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXG4gICAgbGV0IG1SZXMgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXTtcblxuICAgIGhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcbiAgICBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmxvZ19saWtlbGlob29kO1xuICAgIGhtUmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldID0gTWF0aC5leHAoaG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldKTtcblxuICAgIGhtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IGhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV07XG4gICAgaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IGhtUmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgbm9ybWNvbnN0X2luc3RhbnQgICArPSBobVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG4gICAgbm9ybWNvbnN0X3Ntb290aGVkICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgaWYgKGkgPT0gMCB8fCBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPiBtYXhsb2dfbGlrZWxpaG9vZCkge1xuICAgICAgbWF4bG9nX2xpa2VsaWhvb2QgPSBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV07XG4gICAgICBobVJlcy5saWtlbGllc3QgPSBpO1xuICAgIH1cbiAgfVxuXG4gIGxldCB0b3RhbExpa2VsaWhvb2QgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgIGhtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAvPSBub3JtY29uc3RfaW5zdGFudDtcbiAgICBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1jb25zdF9zbW9vdGhlZDtcbiAgICB0b3RhbExpa2VsaWhvb2QgKz0gaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaGhtbUZpbHRlciA9IChvYnNJbiwgaG0sIGhtUmVzKSA9PiB7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICBpZiAoaG0uY29uZmlndXJhdGlvbi5kZWZhdWx0X3BhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgaWYgKGhtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQpIHtcbiAgICAgIGhobW1Gb3J3YXJkVXBkYXRlKG9ic0luLCBobSwgaG1SZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaG1tRm9yd2FyZEluaXQob2JzSW4sIGhtLCBobVJlcyk7XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgaG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXVxuICAgICAgICA9IGhtbUZpbHRlcihvYnNJbiwgaG0ubW9kZWxzW2ldLCBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXSk7XG4gICAgfVxuICB9XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLSBjb21wdXRlIHRpbWUgcHJvZ3Jlc3Npb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICBobW1VcGRhdGVBbHBoYVdpbmRvdyhcbiAgICAgIGhtLm1vZGVsc1tpXSxcbiAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldXG4gICAgKTtcbiAgICBobW1VcGRhdGVSZXN1bHRzKFxuICAgICAgaG0ubW9kZWxzW2ldLFxuICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICApO1xuICB9XG5cblxuICBoaG1tVXBkYXRlUmVzdWx0cyhobSwgaG1SZXMpO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgIGNvbnN0IGRpbSA9IGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmRpbWVuc2lvbjtcbiAgICBjb25zdCBkaW1JbiA9IGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmRpbWVuc2lvbl9pbnB1dDtcbiAgICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBobW1SZWdyZXNzaW9uKG9ic0luLCBobS5tb2RlbHNbaV0sIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGlrZWxpZXN0XG4gICAgaWYgKGhtLmNvbmZpZ3VyYXRpb24ubXVsdGlDbGFzc19yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMCkge1xuICAgICAgaG1SZXMub3V0cHV0X3ZhbHVlc1xuICAgICAgICA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2htUmVzLmxpa2VsaWVzdF1cbiAgICAgICAgICAgICAgIC5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuICAgICAgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2VcbiAgICAgICAgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tobVJlcy5saWtlbGllc3RdXG4gICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2Uuc2xpY2UoMCk7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbWl4dHVyZVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtUmVzLm91dHB1dF92YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgICAgICBobVJlcy5vdXRwdXRfdmFsdWVzW2RdXG4gICAgICAgICAgICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcbiAgICAgICAgICAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLm91dHB1dF92YWx1ZXNbZF07XG5cbiAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgaWYgKGhtLmNvbmZpZ3VyYXRpb24uY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMiArKykge1xuICAgICAgICAgICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdXG4gICAgICAgICAgICAgICAgKz0gaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAqXG4gICAgICAgICAgICAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICAgICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcbiAgICAgICAgICAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG4iXX0=