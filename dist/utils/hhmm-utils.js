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
  // mRes.log_likelihood = 0;
  // for (let i = 0; i < bufSize; i++) {
  //   mRes.log_likelihood += mRes.likelihood_buffer[i];
  // }
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

  mRes.progress /= m.parameters.states - 1;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhobW0tdXRpbHMuanMiXSwibmFtZXMiOlsiZ21tVXRpbHMiLCJobW1SZWdyZXNzaW9uIiwib2JzSW4iLCJtIiwibVJlcyIsImRpbSIsInN0YXRlcyIsImNvbXBvbmVudHMiLCJkaW1lbnNpb24iLCJkaW1JbiIsImRpbWVuc2lvbl9pbnB1dCIsImRpbU91dCIsIm91dENvdmFyU2l6ZSIsImNvdmFyaWFuY2VfbW9kZSIsIm91dHB1dF92YWx1ZXMiLCJBcnJheSIsImkiLCJvdXRwdXRfY292YXJpYW5jZSIsInBhcmFtZXRlcnMiLCJyZWdyZXNzaW9uX2VzdGltYXRvciIsImdtbUxpa2VsaWhvb2QiLCJsaWtlbGllc3Rfc3RhdGUiLCJzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cyIsImdtbVJlZ3Jlc3Npb24iLCJzbGljZSIsImNsaXBNaW5TdGF0ZSIsIndpbmRvd19taW5pbmRleCIsImNsaXBNYXhTdGF0ZSIsImxlbmd0aCIsIndpbmRvd19tYXhpbmRleCIsIm5vcm1Db25zdGFudCIsIndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50IiwidG1wUHJlZGljdGVkT3V0cHV0IiwiZCIsImhpZXJhcmNoaWNhbCIsImFscGhhX2giLCJkMiIsImFscGhhIiwiaG1tRm9yd2FyZEluaXQiLCJvYnNPdXQiLCJuc3RhdGVzIiwibm9ybUNvbnN0IiwidHJhbnNpdGlvbl9tb2RlIiwiYmltb2RhbCIsInByaW9yIiwiZ21tT2JzUHJvYkJpbW9kYWwiLCJnbW1PYnNQcm9iSW5wdXQiLCJnbW1PYnNQcm9iIiwiaG1tRm9yd2FyZFVwZGF0ZSIsInByZXZpb3VzX2FscGhhIiwiaiIsInRyYW5zaXRpb24iLCJobW1VcGRhdGVBbHBoYVdpbmRvdyIsImJlc3RfYWxwaGEiLCJNYXRoIiwiZmxvb3IiLCJobW1VcGRhdGVSZXN1bHRzIiwiYnVmTGVuZ3RoIiwibGlrZWxpaG9vZF9idWZmZXIiLCJsaWtlbGlob29kX2J1ZmZlcl9pbmRleCIsImxvZyIsImluc3RhbnRfbGlrZWxpaG9vZCIsImxvZ19saWtlbGlob29kIiwicmVkdWNlIiwiYSIsImIiLCJwcm9ncmVzcyIsImhtbUZpbHRlciIsImN0IiwiZm9yd2FyZF9pbml0aWFsaXplZCIsImhobW1MaWtlbGlob29kQWxwaGEiLCJleGl0TnVtIiwibGlrZWxpaG9vZFZlYyIsImhtIiwiaG1SZXMiLCJtb2RlbHMiLCJleGl0IiwiayIsInNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzIiwiaGhtbUZvcndhcmRJbml0Iiwibm9ybV9jb25zdCIsInNoYXJlZF9wYXJhbWV0ZXJzIiwiZSIsImhobW1Gb3J3YXJkVXBkYXRlIiwibm1vZGVscyIsInRtcCIsImZyb250IiwiZnJvbnRpZXJfdjEiLCJmcm9udGllcl92MiIsImV4aXRQcm9iYWJpbGl0aWVzIiwic3JjaSIsImV4aXRfbGlrZWxpaG9vZCIsImV4aXRfdHJhbnNpdGlvbiIsImV4aXRfcmF0aW8iLCJoaG1tVXBkYXRlUmVzdWx0cyIsIm1heGxvZ19saWtlbGlob29kIiwibm9ybWNvbnN0X2luc3RhbnQiLCJub3JtY29uc3Rfc21vb3RoZWQiLCJpbnN0YW50X2xpa2VsaWhvb2RzIiwic21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzIiwic21vb3RoZWRfbGlrZWxpaG9vZHMiLCJleHAiLCJpbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzIiwibGlrZWxpZXN0IiwidG90YWxMaWtlbGlob29kIiwiaGhtbUZpbHRlciIsImNvbmZpZ3VyYXRpb24iLCJkZWZhdWx0X3BhcmFtZXRlcnMiLCJtdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0lBQVlBLFE7Ozs7QUFFWjs7OztBQUlBO0FBQ0E7QUFDQTs7QUFFTyxJQUFNQyx3Q0FBZ0IsU0FBaEJBLGFBQWdCLENBQUNDLEtBQUQsRUFBUUMsQ0FBUixFQUFXQyxJQUFYLEVBQW9CO0FBQy9DLE1BQU1DLE1BQU1GLEVBQUVHLE1BQUYs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QUFLLENBQWQsRUFBaUJBLEtBQUt6QixNQUF0QixFQUE4QnlCLElBQTlCLEVBQXFDO0FBQ25Dc0Msb0JBQU16RCxpQkFBTixDQUF3QmdCLElBQUl0QixNQUFKLEdBQWF5QixFQUFyQyxLQUNLc0MsTUFBTTZCLCtCQUFOLENBQXNDdkYsSUFBdEMsSUFDQTBELE1BQU1JLDBCQUFOLENBQWlDOUQsSUFBakMsRUFDRUMsaUJBREYsQ0FDb0JnQixJQUFJdEIsTUFBSixHQUFheUIsRUFEakMsQ0FGTDtBQUlEO0FBQ0g7QUFDQyxXQVJELE1BUU87QUFDTHNDLGtCQUFNekQsaUJBQU4sQ0FBd0JnQixDQUF4QixLQUNLeUMsTUFBTTZCLCtCQUFOLENBQXNDdkYsSUFBdEMsSUFDQTBELE1BQU1JLDBCQUFOLENBQWlDOUQsSUFBakMsRUFDRUMsaUJBREYsQ0FDb0JnQixDQURwQixDQUZMO0FBSUQ7QUFDRjtBQUNGO0FBQ0Y7QUFDRjtBQUNGLENBbkZNIiwiZmlsZSI6ImhobW0tdXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBnbW1VdGlscyBmcm9tICcuL2dtbS11dGlscyc7XG5cbi8qKlxuICogIGZ1bmN0aW9ucyB1c2VkIGZvciBkZWNvZGluZywgdHJhbnNsYXRlZCBmcm9tIFhNTVxuICovXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICAgYXMgaW4geG1tSG1tU2luZ2xlQ2xhc3MuY3BwICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGhtbVJlZ3Jlc3Npb24gPSAob2JzSW4sIG0sIG1SZXMpID0+IHtcbiAgY29uc3QgZGltID0gbS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5kaW1lbnNpb247XG4gIGNvbnN0IGRpbUluID0gbS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5kaW1lbnNpb25faW5wdXQ7XG4gIGNvbnN0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG4gIGxldCBvdXRDb3ZhclNpemU7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAobS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dDtcbiAgfVxuXG4gIG1SZXMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgbVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICB9XG4gIG1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gIH1cblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsaWtlbGllc3RcbiAgaWYgKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMikge1xuICAgIGdtbVV0aWxzLmdtbUxpa2VsaWhvb2QoXG4gICAgICBvYnNJbixcbiAgICAgIG0uc3RhdGVzW21SZXMubGlrZWxpZXN0X3N0YXRlXSxcbiAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbbVJlcy5saWtlbGllc3Rfc3RhdGVdXG4gICAgKTtcbiAgICBnbW1VdGlscy5nbW1SZWdyZXNzaW9uKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0X3N0YXRlXVxuICAgICk7XG4gICAgbVJlcy5vdXRwdXRfdmFsdWVzXG4gICAgICA9IG0uc3RhdGVzW21SZXMubGlrZWxpZXN0X3N0YXRlXS5vdXRwdXRfdmFsdWVzLnNsaWNlKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgY2xpcE1pblN0YXRlID0gKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PSAwKVxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB3aW5kb3dlZFxuICAgICAgICAgICAgICAgICAgICA6IG1SZXMud2luZG93X21pbmluZGV4O1xuXG4gIGNvbnN0IGNsaXBNYXhTdGF0ZSA9IChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT0gMClcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgICAgICAgICAgID8gbS5zdGF0ZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB3aW5kb3dlZFxuICAgICAgICAgICAgICAgICAgICA6IG1SZXMud2luZG93X21heGluZGV4O1xuXG4gIGxldCBub3JtQ29uc3RhbnQgPSAobS5wYXJhbWV0ZXJzLnJlZ3Jlc3Npb25fZXN0aW1hdG9yID09IDApXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICAgICAgICAgICAgICA/IDEuMFxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gd2luZG93ZWRcbiAgICAgICAgICAgICAgICAgICAgOiBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50O1xuXG4gIGlmIChub3JtQ29uc3RhbnQgPD0gMC4wKSB7XG4gICAgbm9ybUNvbnN0YW50ID0gMS47XG4gIH1cblxuICBmb3IgKGxldCBpID0gY2xpcE1pblN0YXRlOyBpIDwgY2xpcE1heFN0YXRlOyBpKyspIHtcbiAgICBnbW1VdGlscy5nbW1MaWtlbGlob29kKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1tpXSxcbiAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICApO1xuICAgIGdtbVV0aWxzLmdtbVJlZ3Jlc3Npb24oXG4gICAgICBvYnNJbixcbiAgICAgIG0uc3RhdGVzW2ldLFxuICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuICAgICk7XG4gICAgY29uc3QgdG1wUHJlZGljdGVkT3V0cHV0XG4gICAgICA9IG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV0ub3V0cHV0X3ZhbHVlcy5zbGljZSgwKTtcblxuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gICAgICBpZiAobVJlcy5oaWVyYXJjaGljYWwpIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2RdXG4gICAgICAgICAgKz0gKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgIHRtcFByZWRpY3RlZE91dHB1dFtkXSAvIG5vcm1Db25zdGFudDtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgIGlmIChtLnBhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgICAgZm9yIChsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIrKykge1xuICAgICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdXG4gICAgICAgICAgICAgICs9IChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICAgICAgKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdIC9cbiAgICAgICAgICAgICAgICBub3JtQ29uc3RhbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdXG4gICAgICAgICAgICArPSAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG4gICAgICAgICAgICAgICAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG4gICAgICAgICAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZF0gL1xuICAgICAgICAgICAgICBub3JtQ29uc3RhbnQ7XG4gICAgICAgIH1cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBub24taGllcmFyY2hpY2FsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLm91dHB1dF92YWx1ZXNbZF0gKz0gbVJlcy5hbHBoYVtpXSAqIFxuICAgICAgICAgICAgICAgICAgICAgdG1wUHJlZGljdGVkT3V0cHV0W2RdIC8gbm9ybUNvbnN0YW50O1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgaWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG4gICAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl1cbiAgICAgICAgICAgICAgKz0gIG1SZXMuYWxwaGFbaV0gKiBtUmVzLmFscGhhW2ldICpcbiAgICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXSAvXG4gICAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICAgIH1cbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF0gKz0gbVJlcy5hbHBoYVtpXSAqIG1SZXMuYWxwaGFbaV0gKlxuICAgICAgICAgICAgICAgICAgICAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkXSAvXG4gICAgICAgICAgICAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1Gb3J3YXJkSW5pdCA9IChvYnNJbiwgbSwgbVJlcywgb2JzT3V0ID0gW10pID0+IHtcbiAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gIGxldCBub3JtQ29uc3QgPSAwLjA7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBlcmdvZGljICAgICAgICBcbiAgaWYgKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT09IDApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWwgICAgICAgIFxuICAgICAgaWYgKG0uc3RhdGVzW2ldLmNvbXBvbmVudHNbMF0uYmltb2RhbCkge1xuICAgICAgICBpZiAob2JzT3V0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBtUmVzLmFscGhhW2ldID0gbS5wcmlvcltpXSAqXG4gICAgICAgICAgICAgICAgICBnbW1VdGlscy5nbW1PYnNQcm9iQmltb2RhbChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ic091dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2ldKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtUmVzLmFscGhhW2ldID0gbS5wcmlvcltpXSAqXG4gICAgICAgICAgICAgICAgICBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbaV0pO1xuICAgICAgICB9XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB1bmltb2RhbCAgICAgICAgXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhW2ldID0gbS5wcmlvcltpXSAqXG4gICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbaV0pO1xuICAgICAgfVxuICAgICAgbm9ybUNvbnN0ICs9IG1SZXMuYWxwaGFbaV07XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxlZnQtcmlnaHQgICAgICAgIFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbVJlcy5hbHBoYS5sZW5ndGg7IGkrKykge1xuICAgICAgbVJlcy5hbHBoYVtpXSA9IDAuMDtcbiAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbCAgICAgICAgXG4gICAgaWYgKG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uYmltb2RhbCkge1xuICAgICAgaWYgKG9ic091dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIG1SZXMuYWxwaGFbMF0gPSBnbW1VdGlscy5nbW1PYnNQcm9iQmltb2RhbChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNPdXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbMF0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5hbHBoYVswXSA9IGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbMF0pO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWwgICAgICAgIFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLmFscGhhWzBdID0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbMF0pO1xuICAgIH1cbiAgICBub3JtQ29uc3QgKz0gbVJlcy5hbHBoYVswXTtcbiAgfVxuXG4gIGlmIChub3JtQ29uc3QgPiAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gLz0gbm9ybUNvbnN0O1xuICAgIH1cbiAgICByZXR1cm4gKDEuMCAvIG5vcm1Db25zdCk7XG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gPSAxLjAgLyBuc3RhdGVzO1xuICAgIH1cbiAgICByZXR1cm4gMS4wO1xuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1Gb3J3YXJkVXBkYXRlID0gKG9ic0luLCBtLCBtUmVzLCBvYnNPdXQgPSBbXSkgPT4ge1xuICBjb25zdCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgbGV0IG5vcm1Db25zdCA9IDAuMDtcblxuICBtUmVzLnByZXZpb3VzX2FscGhhID0gbVJlcy5hbHBoYS5zbGljZSgwKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICBtUmVzLmFscGhhW2ldID0gMDtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBlcmdvZGljXG4gICAgaWYgKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT09IDApIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnN0YXRlczsgaisrKSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtqXSAqXG4gICAgICAgICAgICAgICAgIG1SZXMudHJhbnNpdGlvbltqICogbnN0YXRlcysgaV07XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGVmdC1yaWdodFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLmFscGhhW2ldICs9IG1SZXMucHJldmlvdXNfYWxwaGFbaV0gKiBtUmVzLnRyYW5zaXRpb25baSAqIDJdO1xuICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtpIC0gMV0gKlxuICAgICAgICAgICAgICAgICBtUmVzLnRyYW5zaXRpb25bKGkgLSAxKSAqIDIgKyAxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYWxwaGFbMF0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtuc3RhdGVzIC0gMV0gKlxuICAgICAgICAgICAgICAgICBtUmVzLnRyYW5zaXRpb25bbnN0YXRlcyAqIDIgLSAxXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsICAgICAgICBcbiAgICBpZiAobS5zdGF0ZXNbaV0uY29tcG9uZW50c1swXS5iaW1vZGFsKSB7XG4gICAgICBpZiAob2JzT3V0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgbVJlcy5hbHBoYVtpXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iQmltb2RhbChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ic091dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2ldKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbaV0pO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWwgICAgICAgIFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLmFscGhhW2ldICo9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2ldKTtcbiAgICB9XG4gICAgbm9ybUNvbnN0ICs9IG1SZXMuYWxwaGFbaV07XG4gIH1cblxuICBpZiAobm9ybUNvbnN0ID4gMWUtMzAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gLz0gbm9ybUNvbnN0O1xuICAgIH1cbiAgICByZXR1cm4gKDEuMCAvIG5vcm1Db25zdCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIDAuMDtcbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaG1tVXBkYXRlQWxwaGFXaW5kb3cgPSAobSwgbVJlcykgPT4ge1xuICBjb25zdCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgXG4gIG1SZXMubGlrZWxpZXN0X3N0YXRlID0gMDtcblxuICBsZXQgYmVzdF9hbHBoYTtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gIGlmIChtLnBhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgYmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFfaFswXVswXSArIG1SZXMuYWxwaGFfaFsxXVswXTtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBub24taGllcmFyY2hpY2FsXG4gIH0gZWxzZSB7XG4gICAgYmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFbMF07IFxuICB9XG5cbiAgZm9yIChsZXQgaSA9IDE7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gICAgaWYgKG0ucGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHtcbiAgICAgIGlmICgobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSA+IGJlc3RfYWxwaGEpIHtcbiAgICAgICAgYmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXTtcbiAgICAgICAgbVJlcy5saWtlbGllc3Rfc3RhdGUgPSBpO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWwgICAgICAgIFxuICAgIH0gZWxzZSB7XG4gICAgICBpZihtUmVzLmFscGhhW2ldID4gYmVzdF9hbHBoYSkge1xuICAgICAgICBiZXN0X2FscGhhID0gbVJlcy5hbHBoYVtpXTtcbiAgICAgICAgbVJlcy5saWtlbGllc3Rfc3RhdGUgPSBpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG1SZXMud2luZG93X21pbmluZGV4ID0gbVJlcy5saWtlbGllc3Rfc3RhdGUgLSBNYXRoLmZsb29yKG5zdGF0ZXMgLyAyKTtcbiAgbVJlcy53aW5kb3dfbWF4aW5kZXggPSBtUmVzLmxpa2VsaWVzdF9zdGF0ZSArIE1hdGguZmxvb3IobnN0YXRlcyAvIDIpO1xuICBtUmVzLndpbmRvd19taW5pbmRleCA9IChtUmVzLndpbmRvd19taW5pbmRleCA+PSAwKVxuICAgICAgICAgICAgICAgICAgICAgICA/IG1SZXMud2luZG93X21pbmluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgIDogMDtcbiAgbVJlcy53aW5kb3dfbWF4aW5kZXggPSAobVJlcy53aW5kb3dfbWF4aW5kZXggPD0gbnN0YXRlcylcbiAgICAgICAgICAgICAgICAgICAgICAgPyBtUmVzLndpbmRvd19tYXhpbmRleFxuICAgICAgICAgICAgICAgICAgICAgICA6IG5zdGF0ZXM7XG4gIG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQgPSAwO1xuXG4gIGZvciAobGV0IGkgPSBtUmVzLndpbmRvd19taW5pbmRleDsgaSA8IG1SZXMud2luZG93X21heGluZGV4OyBpKyspIHtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gICAgaWYgKG0ucGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHtcbiAgICAgIG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQgKz1cbiAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldO1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWxcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudCArPVxuICAgICAgICBtUmVzLmFscGhhW2ldO1xuICAgIH1cbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaG1tVXBkYXRlUmVzdWx0cyA9IChtLCBtUmVzKSA9PiB7XG4gIGNvbnN0IGJ1Zkxlbmd0aCA9IG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW21SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhdXG4gICAgPSBNYXRoLmxvZyhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCk7XG4gIC8vIGluY3JlbWVudCBjaXJjdWxhciBidWZmZXIgaW5kZXhcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleFxuICAgID0gKG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXggKyAxKSAlIGJ1Zkxlbmd0aDtcblxuICBtUmVzLmxvZ19saWtlbGlob29kID0gbVJlcy5saWtlbGlob29kX2J1ZmZlci5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcbiAgLy8gbVJlcy5sb2dfbGlrZWxpaG9vZCA9IDA7XG4gIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmU2l6ZTsgaSsrKSB7XG4gIC8vICAgbVJlcy5sb2dfbGlrZWxpaG9vZCArPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW2ldO1xuICAvLyB9XG4gIG1SZXMubG9nX2xpa2VsaWhvb2QgLz0gYnVmTGVuZ3RoO1xuXG4gIG1SZXMucHJvZ3Jlc3MgPSAwO1xuICBmb3IgKGxldCBpID0gbVJlcy53aW5kb3dfbWluaW5kZXg7IGkgPCBtUmVzLndpbmRvd19tYXhpbmRleDsgaSsrKSB7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICAgIGlmIChtLnBhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgICBtUmVzLnByb2dyZXNzXG4gICAgICAgICs9IChcbiAgICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtpXSArXG4gICAgICAgICAgICBtUmVzLmFscGhhX2hbMV1baV0gK1xuICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzJdW2ldXG4gICAgICAgICAgKSAqXG4gICAgICAgICAgaSAvIG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQ7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uIGhpZXJhcmNoaWNhbFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLnByb2dyZXNzICs9IG1SZXMuYWxwaGFbaV0gKlxuICAgICAgICAgICAgICAgaSAvIG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQ7XG4gICAgfVxuICB9XG5cbiAgbVJlcy5wcm9ncmVzcyAvPSAobS5wYXJhbWV0ZXJzLnN0YXRlcyAtIDEpO1xufTtcblxuXG5leHBvcnQgY29uc3QgaG1tRmlsdGVyID0gKG9ic0luLCBtLCBtUmVzKSA9PiB7XG4gIGxldCBjdCA9IDAuMDtcbiAgaWYgKG1SZXMuZm9yd2FyZF9pbml0aWFsaXplZCkge1xuICAgIGN0ID0gaG1tRm9yd2FyZFVwZGF0ZShvYnNJbiwgbSwgbVJlcyk7XG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDsgaisrKSB7XG4gICAgICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMC4wO1xuICAgIH1cbiAgICBjdCA9IGhtbUZvcndhcmRJbml0KG9ic0luLCBtLCBtUmVzKTtcbiAgICBtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSAxLjAgLyBjdDtcblxuICBobW1VcGRhdGVBbHBoYVdpbmRvdyhtLCBtUmVzKTtcbiAgaG1tVXBkYXRlUmVzdWx0cyhtLCBtUmVzKTtcblxuICBpZiAobS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5iaW1vZGFsKSB7XG4gICAgaG1tUmVncmVzc2lvbihvYnNJbiwgbSwgbVJlcyk7XG4gIH1cblxuICByZXR1cm4gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG59O1xuXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICBhcyBpbiB4bW1IaWVyYXJjaGljYWxIbW0uY3BwICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGhobW1MaWtlbGlob29kQWxwaGEgPSAoZXhpdE51bSwgbGlrZWxpaG9vZFZlYywgaG0sIGhtUmVzKSA9PiB7XG4gIGlmIChleGl0TnVtIDwgMCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsaWtlbGlob29kVmVjW2ldID0gMDtcbiAgICAgIGZvciAobGV0IGV4aXQgPSAwOyBleGl0IDwgMzsgZXhpdCsrKSB7XG4gICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgaG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgICBsaWtlbGlob29kVmVjW2ldXG4gICAgICAgICAgICArPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oW2V4aXRdW2tdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsaWtlbGlob29kVmVjW2ldID0gMDtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgaG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgbGlrZWxpaG9vZFZlY1tpXVxuICAgICAgICAgICs9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZXhpdE51bV1ba107XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gRk9SV0FSRCBJTklUXG5cbmV4cG9ydCBjb25zdCBoaG1tRm9yd2FyZEluaXQgPSAob2JzSW4sIGhtLCBobVJlcykgPT4ge1xuICBsZXQgbm9ybV9jb25zdCA9IDA7XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBpbml0aWFsaXplIGFscGhhc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXG4gICAgY29uc3QgbSA9IGhtLm1vZGVsc1tpXTtcbiAgICBjb25zdCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgICBjb25zdCBtUmVzID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV07XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgbVJlcy5hbHBoYV9oW2pdID0gbmV3IEFycmF5KG5zdGF0ZXMpO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgbVJlcy5hbHBoYV9oW2pdW2tdID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBlcmdvZGljXG4gICAgaWYgKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT0gMCkge1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG4gICAgICAgIGlmIChobS5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG4gICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2tdID0gbS5wcmlvcltrXSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLCBtLnN0YXRlc1trXSk7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB1bmltb2RhbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtrXSA9IG0ucHJpb3Jba10gKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2tdKTtcbiAgICAgICAgfVxuICAgICAgICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCArPSBtUmVzLmFscGhhX2hbMF1ba107XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGVmdC1yaWdodFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLmFscGhhX2hbMF1bMF0gPSBobS5wcmlvcltpXTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG4gICAgICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgICAgICBtUmVzLmFscGhhX2hbMF1bMF0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLCBtLnN0YXRlc1swXSk7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB1bmltb2RhbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5hbHBoYV9oWzBdWzBdICo9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzWzBdKTtcbiAgICAgIH1cbiAgICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gbVJlcy5hbHBoYV9oWzBdWzBdO1xuICAgIH1cblxuICAgIG5vcm1fY29uc3QgKz0gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBub3JtYWxpemUgYWxwaGFzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICBjb25zdCBuc3RhdGVzID0gaG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzO1xuICAgIGZvciAobGV0IGUgPSAwOyBlIDwgMzsgZSsrKSB7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oW2VdW2tdIC89IG5vcm1fY29uc3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaG1SZXMuZm9yd2FyZF9pbml0aWFsaXplZCA9IHRydWU7XG59O1xuXG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IEZPUldBUkQgVVBEQVRFXG5cbmV4cG9ydCBjb25zdCBoaG1tRm9yd2FyZFVwZGF0ZSA9IChvYnNJbiwgaG0sIGhtUmVzKSA9PiB7XG4gIGNvbnN0IG5tb2RlbHMgPSBobS5tb2RlbHMubGVuZ3RoO1xuXG4gIGxldCBub3JtX2NvbnN0ID0gMDtcbiAgbGV0IHRtcCA9IDA7XG4gIGxldCBmcm9udDsgLy8gYXJyYXlcblxuICBoaG1tTGlrZWxpaG9vZEFscGhhKDEsIGhtUmVzLmZyb250aWVyX3YxLCBobSwgaG1SZXMpO1xuICBoaG1tTGlrZWxpaG9vZEFscGhhKDIsIGhtUmVzLmZyb250aWVyX3YyLCBobSwgaG1SZXMpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm1vZGVsczsgaSsrKSB7XG5cbiAgICBjb25zdCBtID0gaG0ubW9kZWxzW2ldO1xuICAgIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICAgIGNvbnN0IG1SZXMgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXTtcbiAgICBcbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09IGNvbXB1dGUgZnJvbnRpZXIgdmFyaWFibGVcbiAgICBmcm9udCA9IG5ldyBBcnJheShuc3RhdGVzKTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5zdGF0ZXM7IGorKykge1xuICAgICAgZnJvbnRbal0gPSAwO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVyZ29kaWNcbiAgICBpZiAobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PT0gMCkgeyAvLyBlcmdvZGljXG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5zdGF0ZXM7IGorKykge1xuICAgICAgICAgIGZyb250W2tdICs9IG0udHJhbnNpdGlvbltqICogbnN0YXRlcyArIGtdIC9cbiAgICAgICAgICAgICAgICAoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNbal0pICpcbiAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1bal07XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgc3JjaSA9IDA7IHNyY2kgPCBubW9kZWxzOyBzcmNpKyspIHtcbiAgICAgICAgICBmcm9udFtrXSArPSBtLnByaW9yW2tdICpcbiAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICBobVJlcy5mcm9udGllcl92MVtzcmNpXSAqXG4gICAgICAgICAgICAgICAgICBobS50cmFuc2l0aW9uW3NyY2ldW2ldXG4gICAgICAgICAgICAgICAgICArIGhtUmVzLmZyb250aWVyX3YyW3NyY2ldICpcbiAgICAgICAgICAgICAgICAgIGhtLnByaW9yW2ldXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxlZnQtcmlnaHRcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gayA9PSAwIDogZmlyc3Qgc3RhdGUgb2YgdGhlIHByaW1pdGl2ZVxuICAgICAgZnJvbnRbMF0gPSBtLnRyYW5zaXRpb25bMF0gKiBtUmVzLmFscGhhX2hbMF1bMF07XG5cbiAgICAgIGZvciAobGV0IHNyY2kgPSAwOyBzcmNpIDwgbm1vZGVsczsgc3JjaSsrKSB7XG4gICAgICAgIGZyb250WzBdICs9IGhtUmVzLmZyb250aWVyX3YxW3NyY2ldICpcbiAgICAgICAgICAgICAgICAgICAgaG0udHJhbnNpdGlvbltzcmNpXVtpXSArXG4gICAgICAgICAgICAgICAgICAgIGhtUmVzLmZyb250aWVyX3YyW3NyY2ldICpcbiAgICAgICAgICAgICAgICAgICAgaG0ucHJpb3JbaV07XG4gICAgICB9XG5cbiAgICAgIC8vIGsgPiAwIDogcmVzdCBvZiB0aGUgcHJpbWl0aXZlXG4gICAgICBmb3IgKGxldCBrID0gMTsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICBmcm9udFtrXSArPSBtLnRyYW5zaXRpb25bayAqIDJdIC9cbiAgICAgICAgICAgICAgICAgICAgKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdKSAqXG4gICAgICAgICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtrXTtcbiAgICAgICAgZnJvbnRba10gKz0gbS50cmFuc2l0aW9uWyhrIC0gMSkgKiAyICsgMV0gL1xuICAgICAgICAgICAgICAgICAgICAoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNbayAtIDFdKSAqXG4gICAgICAgICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtrIC0gMV07XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgICAgbVJlcy5hbHBoYV9oW2pdW2tdID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PSB1cGRhdGUgZm9yd2FyZCB2YXJpYWJsZVxuICAgIG1SZXMuZXhpdF9saWtlbGlob29kID0gMDtcbiAgICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCA9IDA7XG5cbiAgICAvLyBlbmQgb2YgdGhlIHByaW1pdGl2ZSA6IGhhbmRsZSBleGl0IHN0YXRlc1xuICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgICAgICB0bXAgPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sIG0uc3RhdGVzW2tdKSAqIGZyb250W2tdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdG1wID0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNba10pICogZnJvbnRba107XG4gICAgICB9XG5cbiAgICAgIG1SZXMuYWxwaGFfaFsyXVtrXSA9IGhtLmV4aXRfdHJhbnNpdGlvbltpXSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdICogdG1wO1xuICAgICAgbVJlcy5hbHBoYV9oWzFdW2tdID0gKDEgLSBobS5leGl0X3RyYW5zaXRpb25baV0pICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uZXhpdFByb2JhYmlsaXRpZXNba10gKiB0bXA7XG4gICAgICBtUmVzLmFscGhhX2hbMF1ba10gPSAoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNba10pICogdG1wO1xuXG4gICAgICBtUmVzLmV4aXRfbGlrZWxpaG9vZCArPSBtUmVzLmFscGhhX2hbMV1ba10gK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzJdW2tdO1xuICAgICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgKz0gbVJlcy5hbHBoYV9oWzBdW2tdICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsxXVtrXSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMl1ba107XG5cbiAgICAgIG5vcm1fY29uc3QgKz0gdG1wO1xuXG4gICAgfVxuXG4gICAgLy8gdGhpcyBjbGlwcGluZyBpcyBub3QgaW4gdGhlIG9yaWdpbmFsIGNvZGUsIGJ1dCBwcmV2ZW50cyBjYXNlcyBvZiAtSW5maW5pdHlcbiAgICAvLyBpbiBsb2dfbGlrZWxpaG9vZHMgYW5kIE5hTnMgaW4gc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzXG4gICAgLy8gKGJlY2F1c2Ugb2YgYWxsIFwiZnJvbnRcIiB2YWx1ZXMgYmVpbmcgbnVsbCBmcm9tIHRpbWUgdG8gdGltZSkgLi4uXG4gICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCA+IDFlLTE4MFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDFlLTE4MDtcblxuICAgIG1SZXMuZXhpdF9yYXRpbyA9IG1SZXMuZXhpdF9saWtlbGlob29kIC8gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBub3JtYWxpemUgYWxwaGFzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm1vZGVsczsgaSsrKSB7XG4gICAgZm9yIChsZXQgZSA9IDA7IGUgPCAzOyBlKyspIHtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgaG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtlXVtrXSAvPSBub3JtX2NvbnN0O1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaGhtbVVwZGF0ZVJlc3VsdHMgPSAoaG0sIGhtUmVzKSA9PiB7XG4gIGxldCBtYXhsb2dfbGlrZWxpaG9vZCA9IDA7XG4gIGxldCBub3JtY29uc3RfaW5zdGFudCA9IDA7XG4gIGxldCBub3JtY29uc3Rfc21vb3RoZWQgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICBsZXQgbVJlcyA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldO1xuXG4gICAgaG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXSA9IG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xuICAgIGhtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA9IG1SZXMubG9nX2xpa2VsaWhvb2Q7XG4gICAgaG1SZXMuc21vb3RoZWRfbGlrZWxpaG9vZHNbaV0gPSBNYXRoLmV4cChobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0pO1xuXG4gICAgaG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gaG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXTtcbiAgICBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gaG1SZXMuc21vb3RoZWRfbGlrZWxpaG9vZHNbaV07XG5cbiAgICBub3JtY29uc3RfaW5zdGFudCAgICs9IGhtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcbiAgICBub3JtY29uc3Rfc21vb3RoZWQgICs9IGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG5cbiAgICBpZiAoaSA9PSAwIHx8IGhtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA+IG1heGxvZ19saWtlbGlob29kKSB7XG4gICAgICBtYXhsb2dfbGlrZWxpaG9vZCA9IGhtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXTtcbiAgICAgIGhtUmVzLmxpa2VsaWVzdCA9IGk7XG4gICAgfVxuICB9XG5cbiAgbGV0IHRvdGFsTGlrZWxpaG9vZCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgaG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1jb25zdF9pbnN0YW50O1xuICAgIGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gLz0gbm9ybWNvbnN0X3Ntb290aGVkO1xuICAgIHRvdGFsTGlrZWxpaG9vZCArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBoaG1tRmlsdGVyID0gKG9ic0luLCBobSwgaG1SZXMpID0+IHtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gIGlmIChobS5jb25maWd1cmF0aW9uLmRlZmF1bHRfcGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHtcbiAgICBpZiAoaG1SZXMuZm9yd2FyZF9pbml0aWFsaXplZCkge1xuICAgICAgaGhtbUZvcndhcmRVcGRhdGUob2JzSW4sIGhtLCBobVJlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhobW1Gb3J3YXJkSW5pdChvYnNJbiwgaG0sIGhtUmVzKTtcbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBobVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldXG4gICAgICAgID0gaG1tRmlsdGVyKG9ic0luLCBobS5tb2RlbHNbaV0sIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldKTtcbiAgICB9XG4gIH1cblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tIGNvbXB1dGUgdGltZSBwcm9ncmVzc2lvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgIGhtbVVwZGF0ZUFscGhhV2luZG93KFxuICAgICAgaG0ubW9kZWxzW2ldLFxuICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICApO1xuICAgIGhtbVVwZGF0ZVJlc3VsdHMoXG4gICAgICBobS5tb2RlbHNbaV0sXG4gICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuICAgICk7XG4gIH1cblxuXG4gIGhobW1VcGRhdGVSZXN1bHRzKGhtLCBobVJlcyk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG4gIGlmIChobS5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG4gICAgY29uc3QgZGltID0gaG0uc2hhcmVkX3BhcmFtZXRlcnMuZGltZW5zaW9uO1xuICAgIGNvbnN0IGRpbUluID0gaG0uc2hhcmVkX3BhcmFtZXRlcnMuZGltZW5zaW9uX2lucHV0O1xuICAgIGNvbnN0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGhtbVJlZ3Jlc3Npb24ob2JzSW4sIGhtLm1vZGVsc1tpXSwgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsaWtlbGllc3RcbiAgICBpZiAoaG0uY29uZmlndXJhdGlvbi5tdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yID09PSAwKSB7XG4gICAgICBobVJlcy5vdXRwdXRfdmFsdWVzXG4gICAgICAgID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaG1SZXMubGlrZWxpZXN0XVxuICAgICAgICAgICAgICAgLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG4gICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVxuICAgICAgICA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2htUmVzLmxpa2VsaWVzdF1cbiAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZS5zbGljZSgwKTtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtaXh0dXJlXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG1SZXMub3V0cHV0X3ZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBobVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobVJlcy5vdXRwdXRfY292YXJpYW5jZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVtpXSA9IDAuMDtcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgICAgIGhtUmVzLm91dHB1dF92YWx1ZXNbZF1cbiAgICAgICAgICAgICs9IGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gKlxuICAgICAgICAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0ub3V0cHV0X3ZhbHVlc1tkXTtcblxuICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICBpZiAoaG0uY29uZmlndXJhdGlvbi5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyICsrKSB7XG4gICAgICAgICAgICAgIGhtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl1cbiAgICAgICAgICAgICAgICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcbiAgICAgICAgICAgICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGhtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdXG4gICAgICAgICAgICAgICs9IGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gKlxuICAgICAgICAgICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2RdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbiJdfQ==