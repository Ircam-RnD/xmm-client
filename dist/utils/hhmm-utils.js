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

  // console.log(mRes.window_minindex + ' '  + mRes.window_maxindex + ' ' + mRes.window_normalization_constant);
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
        if (norm_const === 0) {
          console.log('alpha[' + e + '][' + _k7 + '] : ' + alpha[e][_k7]);
        }
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

  if (normconst_instant === 0 || normconst_smoothed === 0) {
    for (var _i11 = 0; _i11 < hm.models.length; _i11++) {
      var _mRes = hmRes.singleClassHmmModelResults[_i11];
      console.log(_mRes.log_likelihood + ' ' + _mRes.instant_likelihood);
    }
  }

  var totalLikelihood = 0;
  for (var _i12 = 0; _i12 < hm.models.length; _i12++) {
    hmRes.instant_normalized_likelihoods[_i12] /= normconst_instant;
    hmRes.smoothed_normalized_likelihoods[_i12] /= normconst_smoothed;
    totalLikelihood += hmRes.smoothed_normalized_likelihoods[_i12];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhobW0tdXRpbHMuanMiXSwibmFtZXMiOlsiZ21tVXRpbHMiLCJobW1SZWdyZXNzaW9uIiwib2JzSW4iLCJtIiwibVJlcyIsImRpbSIsInN0YXRlcyIsImNvbXBvbmVudHMiLCJkaW1lbnNpb24iLCJkaW1JbiIsImRpbWVuc2lvbl9pbnB1dCIsImRpbU91dCIsIm91dENvdmFyU2l6ZSIsImNvdmFyaWFuY2VfbW9kZSIsIm91dHB1dF92YWx1ZXMiLCJBcnJheSIsImkiLCJvdXRwdXRfY292YXJpYW5jZSIsInBhcmFtZXRlcnMiLCJyZWdyZXNzaW9uX2VzdGltYXRvciIsImdtbUxpa2VsaWhvb2QiLCJsaWtlbGllc3Rfc3RhdGUiLCJzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cyIsImdtbVJlZ3Jlc3Npb24iLCJzbGljZSIsImNsaXBNaW5TdGF0ZSIsIndpbmRvd19taW5pbmRleCIsImNsaXBNYXhTdGF0ZSIsImxlbmd0aCIsIndpbmRvd19tYXhpbmRleCIsIm5vcm1Db25zdGFudCIsIndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50IiwidG1wUHJlZGljdGVkT3V0cHV0IiwiZCIsImhpZXJhcmNoaWNhbCIsImFscGhhX2giLCJkMiIsImFscGhhIiwiaG1tRm9yd2FyZEluaXQiLCJvYnNPdXQiLCJuc3RhdGVzIiwibm9ybUNvbnN0IiwidHJhbnNpdGlvbl9tb2RlIiwiYmltb2RhbCIsInByaW9yIiwiZ21tT2JzUHJvYkJpbW9kYWwiLCJnbW1PYnNQcm9iSW5wdXQiLCJnbW1PYnNQcm9iIiwiaG1tRm9yd2FyZFVwZGF0ZSIsInByZXZpb3VzX2FscGhhIiwiaiIsInRyYW5zaXRpb24iLCJobW1VcGRhdGVBbHBoYVdpbmRvdyIsImJlc3RfYWxwaGEiLCJNYXRoIiwiZmxvb3IiLCJobW1VcGRhdGVSZXN1bHRzIiwiYnVmTGVuZ3RoIiwibGlrZWxpaG9vZF9idWZmZXIiLCJsaWtlbGlob29kX2J1ZmZlcl9pbmRleCIsImxvZyIsImluc3RhbnRfbGlrZWxpaG9vZCIsImxvZ19saWtlbGlob29kIiwicmVkdWNlIiwiYSIsImIiLCJwcm9ncmVzcyIsImhtbUZpbHRlciIsImN0IiwiZm9yd2FyZF9pbml0aWFsaXplZCIsImhobW1MaWtlbGlob29kQWxwaGEiLCJleGl0TnVtIiwibGlrZWxpaG9vZFZlYyIsImhtIiwiaG1SZXMiLCJtb2RlbHMiLCJleGl0IiwiayIsInNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzIiwiaGhtbUZvcndhcmRJbml0Iiwibm9ybV9jb25zdCIsInNoYXJlZF9wYXJhbWV0ZXJzIiwiZSIsImhobW1Gb3J3YXJkVXBkYXRlIiwibm1vZGVscyIsInRtcCIsImZyb250IiwiZnJvbnRpZXJfdjEiLCJmcm9udGllcl92MiIsImV4aXRQcm9iYWJpbGl0aWVzIiwic3JjaSIsImV4aXRfbGlrZWxpaG9vZCIsImV4aXRfdHJhbnNpdGlvbiIsImV4aXRfcmF0aW8iLCJjb25zb2xlIiwiaGhtbVVwZGF0ZVJlc3VsdHMiLCJtYXhsb2dfbGlrZWxpaG9vZCIsIm5vcm1jb25zdF9pbnN0YW50Iiwibm9ybWNvbnN0X3Ntb290aGVkIiwiaW5zdGFudF9saWtlbGlob29kcyIsInNtb290aGVkX2xvZ19saWtlbGlob29kcyIsInNtb290aGVkX2xpa2VsaWhvb2RzIiwiZXhwIiwiaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzIiwic21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kcyIsImxpa2VsaWVzdCIsInRvdGFsTGlrZWxpaG9vZCIsImhobW1GaWx0ZXIiLCJjb25maWd1cmF0aW9uIiwiZGVmYXVsdF9wYXJhbWV0ZXJzIiwibXVsdGlDbGFzc19yZWdyZXNzaW9uX2VzdGltYXRvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztJQUFZQSxROzs7O0FBRVo7Ozs7QUFJQTtBQUNBO0FBQ0E7O0FBRU8sSUFBTUMsd0NBQWdCLFNBQWhCQSxhQUFnQixDQUFDQyxLQUFELEVBQVFDLENBQVIsRUFBV0MsSUFBWCxFQUFvQjtBQUMvQyxNQUFNQyxNQUFNRixF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RDBELGNBQU16RCxpQkFBTixDQUF3QkQsSUFBeEIsSUFBNkIsR0FBN0I7QUFDRDs7QUFFRCxXQUFLLElBQUlBLE9BQUksQ0FBYixFQUFnQkEsT0FBSXlELEdBQUdFLE1BQUgsQ0FBVS9DLE1BQTlCLEVBQXNDWixNQUF0QyxFQUEyQztBQUN6QyxhQUFLLElBQUlpQixJQUFJLENBQWIsRUFBZ0JBLElBQUl0QixNQUFwQixFQUE0QnNCLEdBQTVCLEVBQWlDO0FBQy9CeUMsZ0JBQU01RCxhQUFOLENBQW9CbUIsQ0FBcEIsS0FDS3lDLE1BQU04QiwrQkFBTixDQUFzQ3hGLElBQXRDLElBQ0EwRCxNQUFNSSwwQkFBTixDQUFpQzlELElBQWpDLEVBQW9DRixhQUFwQyxDQUFrRG1CLENBQWxELENBRkw7O0FBSUE7QUFDQSxjQUFJd0MsR0FBR21DLGFBQUgsQ0FBaUIvRixlQUFqQixLQUFxQyxDQUF6QyxFQUE0QztBQUMxQyxpQkFBSyxJQUFJdUIsS0FBSyxDQUFkLEVBQWlCQSxLQUFLekIsTUFBdEIsRUFBOEJ5QixJQUE5QixFQUFxQztBQUNuQ3NDLG9CQUFNekQsaUJBQU4sQ0FBd0JnQixJQUFJdEIsTUFBSixHQUFheUIsRUFBckMsS0FDS3NDLE1BQU04QiwrQkFBTixDQUFzQ3hGLElBQXRDLElBQ0EwRCxNQUFNSSwwQkFBTixDQUFpQzlELElBQWpDLEVBQ0VDLGlCQURGLENBQ29CZ0IsSUFBSXRCLE1BQUosR0FBYXlCLEVBRGpDLENBRkw7QUFJRDtBQUNIO0FBQ0MsV0FSRCxNQVFPO0FBQ0xzQyxrQkFBTXpELGlCQUFOLENBQXdCZ0IsQ0FBeEIsS0FDS3lDLE1BQU04QiwrQkFBTixDQUFzQ3hGLElBQXRDLElBQ0EwRCxNQUFNSSwwQkFBTixDQUFpQzlELElBQWpDLEVBQ0VDLGlCQURGLENBQ29CZ0IsQ0FEcEIsQ0FGTDtBQUlEO0FBQ0Y7QUFDRjtBQUNGO0FBQ0Y7QUFDRixDQW5GTSIsImZpbGUiOiJoaG1tLXV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZ21tVXRpbHMgZnJvbSAnLi9nbW0tdXRpbHMnO1xuXG4vKipcbiAqICBmdW5jdGlvbnMgdXNlZCBmb3IgZGVjb2RpbmcsIHRyYW5zbGF0ZWQgZnJvbSBYTU1cbiAqL1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgIGFzIGluIHhtbUhtbVNpbmdsZUNsYXNzLmNwcCAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBobW1SZWdyZXNzaW9uID0gKG9ic0luLCBtLCBtUmVzKSA9PiB7XG4gIGNvbnN0IGRpbSA9IG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uZGltZW5zaW9uO1xuICBjb25zdCBkaW1JbiA9IG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uZGltZW5zaW9uX2lucHV0O1xuICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICBsZXQgb3V0Q292YXJTaXplO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgb3V0Q292YXJTaXplID0gZGltT3V0ICogZGltT3V0O1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQ7XG4gIH1cblxuICBtUmVzLm91dHB1dF92YWx1ZXMgPSBuZXcgQXJyYXkoZGltT3V0KTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgfVxuICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlID0gbmV3IEFycmF5KG91dENvdmFyU2l6ZSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0Q292YXJTaXplOyBpKyspIHtcbiAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuICB9XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGlrZWxpZXN0XG4gIGlmIChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT09IDIpIHtcbiAgICBnbW1VdGlscy5nbW1MaWtlbGlob29kKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0X3N0YXRlXVxuICAgICk7XG4gICAgZ21tVXRpbHMuZ21tUmVncmVzc2lvbihcbiAgICAgIG9ic0luLFxuICAgICAgbS5zdGF0ZXNbbVJlcy5saWtlbGllc3Rfc3RhdGVdLFxuICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV1cbiAgICApO1xuICAgIG1SZXMub3V0cHV0X3ZhbHVlc1xuICAgICAgPSBtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0ub3V0cHV0X3ZhbHVlcy5zbGljZSgwKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjbGlwTWluU3RhdGUgPSAobS5wYXJhbWV0ZXJzLnJlZ3Jlc3Npb25fZXN0aW1hdG9yID09IDApXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHdpbmRvd2VkXG4gICAgICAgICAgICAgICAgICAgIDogbVJlcy53aW5kb3dfbWluaW5kZXg7XG5cbiAgY29uc3QgY2xpcE1heFN0YXRlID0gKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PSAwKVxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICAgICAgICAgICAgPyBtLnN0YXRlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHdpbmRvd2VkXG4gICAgICAgICAgICAgICAgICAgIDogbVJlcy53aW5kb3dfbWF4aW5kZXg7XG5cbiAgbGV0IG5vcm1Db25zdGFudCA9IChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT0gMClcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgICAgICAgICAgID8gMS4wXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB3aW5kb3dlZFxuICAgICAgICAgICAgICAgICAgICA6IG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQ7XG5cbiAgaWYgKG5vcm1Db25zdGFudCA8PSAwLjApIHtcbiAgICBub3JtQ29uc3RhbnQgPSAxLjtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSBjbGlwTWluU3RhdGU7IGkgPCBjbGlwTWF4U3RhdGU7IGkrKykge1xuICAgIGdtbVV0aWxzLmdtbUxpa2VsaWhvb2QoXG4gICAgICBvYnNJbixcbiAgICAgIG0uc3RhdGVzW2ldLFxuICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuICAgICk7XG4gICAgZ21tVXRpbHMuZ21tUmVncmVzc2lvbihcbiAgICAgIG9ic0luLFxuICAgICAgbS5zdGF0ZXNbaV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgKTtcbiAgICBjb25zdCB0bXBQcmVkaWN0ZWRPdXRwdXRcbiAgICAgID0gbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXS5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuXG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcbiAgICAgIGlmIChtUmVzLmhpZXJhcmNoaWNhbCkge1xuICAgICAgICBtUmVzLm91dHB1dF92YWx1ZXNbZF1cbiAgICAgICAgICArPSAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG4gICAgICAgICAgICAgdG1wUHJlZGljdGVkT3V0cHV0W2RdIC8gbm9ybUNvbnN0YW50O1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgaWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG4gICAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl1cbiAgICAgICAgICAgICAgKz0gKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgICAgICAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG4gICAgICAgICAgICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl0gL1xuICAgICAgICAgICAgICAgIG5vcm1Db25zdGFudDtcbiAgICAgICAgICB9XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF1cbiAgICAgICAgICAgICs9IChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICAgIChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkXSAvXG4gICAgICAgICAgICAgIG5vcm1Db25zdGFudDtcbiAgICAgICAgfVxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWxcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tkXSArPSBtUmVzLmFscGhhW2ldICogXG4gICAgICAgICAgICAgICAgICAgICB0bXBQcmVkaWN0ZWRPdXRwdXRbZF0gLyBub3JtQ29uc3RhbnQ7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICBpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyKyspIHtcbiAgICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXVxuICAgICAgICAgICAgICArPSAgbVJlcy5hbHBoYVtpXSAqIG1SZXMuYWxwaGFbaV0gKlxuICAgICAgICAgICAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdIC9cbiAgICAgICAgICAgICAgICBub3JtQ29uc3RhbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXSArPSBtUmVzLmFscGhhW2ldICogbVJlcy5hbHBoYVtpXSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2RdIC9cbiAgICAgICAgICAgICAgICAgICAgICAgICBub3JtQ29uc3RhbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbUZvcndhcmRJbml0ID0gKG9ic0luLCBtLCBtUmVzLCBvYnNPdXQgPSBbXSkgPT4ge1xuICBjb25zdCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgbGV0IG5vcm1Db25zdCA9IDAuMDtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVyZ29kaWMgICAgICAgIFxuICBpZiAobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PT0gMCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbCAgICAgICAgXG4gICAgICBpZiAobS5zdGF0ZXNbaV0uY29tcG9uZW50c1swXS5iaW1vZGFsKSB7XG4gICAgICAgIGlmIChvYnNPdXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIG1SZXMuYWxwaGFbaV0gPSBtLnByaW9yW2ldICpcbiAgICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JzT3V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbaV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1SZXMuYWxwaGFbaV0gPSBtLnByaW9yW2ldICpcbiAgICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsICAgICAgICBcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gPSBtLnByaW9yW2ldICpcbiAgICAgICAgICAgICAgICBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1tpXSk7XG4gICAgICB9XG4gICAgICBub3JtQ29uc3QgKz0gbVJlcy5hbHBoYVtpXTtcbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGVmdC1yaWdodCAgICAgICAgXG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtUmVzLmFscGhhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBtUmVzLmFscGhhW2ldID0gMC4wO1xuICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsICAgICAgICBcbiAgICBpZiAobS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5iaW1vZGFsKSB7XG4gICAgICBpZiAob2JzT3V0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgbVJlcy5hbHBoYVswXSA9IGdtbVV0aWxzLmdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ic091dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1swXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhWzBdID0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1swXSk7XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB1bmltb2RhbCAgICAgICAgXG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMuYWxwaGFbMF0gPSBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1swXSk7XG4gICAgfVxuICAgIG5vcm1Db25zdCArPSBtUmVzLmFscGhhWzBdO1xuICB9XG5cbiAgaWYgKG5vcm1Db25zdCA+IDApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgICAgbVJlcy5hbHBoYVtpXSAvPSBub3JtQ29uc3Q7XG4gICAgfVxuICAgIHJldHVybiAoMS4wIC8gbm9ybUNvbnN0KTtcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgICAgbVJlcy5hbHBoYVtpXSA9IDEuMCAvIG5zdGF0ZXM7XG4gICAgfVxuICAgIHJldHVybiAxLjA7XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbUZvcndhcmRVcGRhdGUgPSAob2JzSW4sIG0sIG1SZXMsIG9ic091dCA9IFtdKSA9PiB7XG4gIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICBsZXQgbm9ybUNvbnN0ID0gMC4wO1xuXG4gIG1SZXMucHJldmlvdXNfYWxwaGEgPSBtUmVzLmFscGhhLnNsaWNlKDApO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgIG1SZXMuYWxwaGFbaV0gPSAwO1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVyZ29kaWNcbiAgICBpZiAobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PT0gMCkge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcbiAgICAgICAgbVJlcy5hbHBoYVtpXSArPSBtUmVzLnByZXZpb3VzX2FscGhhW2pdICpcbiAgICAgICAgICAgICAgICAgbVJlcy50cmFuc2l0aW9uW2ogKiBuc3RhdGVzKyBpXTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsZWZ0LXJpZ2h0XG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gKz0gbVJlcy5wcmV2aW91c19hbHBoYVtpXSAqIG1SZXMudHJhbnNpdGlvbltpICogMl07XG4gICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgbVJlcy5hbHBoYVtpXSArPSBtUmVzLnByZXZpb3VzX2FscGhhW2kgLSAxXSAqXG4gICAgICAgICAgICAgICAgIG1SZXMudHJhbnNpdGlvblsoaSAtIDEpICogMiArIDFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5hbHBoYVswXSArPSBtUmVzLnByZXZpb3VzX2FscGhhW25zdGF0ZXMgLSAxXSAqXG4gICAgICAgICAgICAgICAgIG1SZXMudHJhbnNpdGlvbltuc3RhdGVzICogMiAtIDFdO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWwgICAgICAgIFxuICAgIGlmIChtLnN0YXRlc1tpXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcbiAgICAgIGlmIChvYnNPdXQubGVuZ3RoID4gMCkge1xuICAgICAgICBtUmVzLmFscGhhW2ldICo9IGdtbVV0aWxzLmdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JzT3V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zdGF0ZXNbaV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5hbHBoYVtpXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1tpXSk7XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB1bmltb2RhbCAgICAgICAgXG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbaV0pO1xuICAgIH1cbiAgICBub3JtQ29uc3QgKz0gbVJlcy5hbHBoYVtpXTtcbiAgfVxuXG4gIGlmIChub3JtQ29uc3QgPiAxZS0zMDApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgICAgbVJlcy5hbHBoYVtpXSAvPSBub3JtQ29uc3Q7XG4gICAgfVxuICAgIHJldHVybiAoMS4wIC8gbm9ybUNvbnN0KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gMC4wO1xuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1VcGRhdGVBbHBoYVdpbmRvdyA9IChtLCBtUmVzKSA9PiB7XG4gIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICBcbiAgbVJlcy5saWtlbGllc3Rfc3RhdGUgPSAwO1xuXG4gIGxldCBiZXN0X2FscGhhO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcbiAgaWYgKG0ucGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHtcbiAgICBiZXN0X2FscGhhID0gbVJlcy5hbHBoYV9oWzBdWzBdICsgbVJlcy5hbHBoYV9oWzFdWzBdO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWxcbiAgfSBlbHNlIHtcbiAgICBiZXN0X2FscGhhID0gbVJlcy5hbHBoYVswXTsgXG4gIH1cblxuICBmb3IgKGxldCBpID0gMTsgaSA8IG5zdGF0ZXM7IGkrKykge1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcbiAgICBpZiAobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkge1xuICAgICAgaWYgKChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pID4gYmVzdF9hbHBoYSkge1xuICAgICAgICBiZXN0X2FscGhhID0gbVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldO1xuICAgICAgICBtUmVzLmxpa2VsaWVzdF9zdGF0ZSA9IGk7XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbCAgICAgICAgXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKG1SZXMuYWxwaGFbaV0gPiBiZXN0X2FscGhhKSB7XG4gICAgICAgIGJlc3RfYWxwaGEgPSBtUmVzLmFscGhhW2ldO1xuICAgICAgICBtUmVzLmxpa2VsaWVzdF9zdGF0ZSA9IGk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbVJlcy53aW5kb3dfbWluaW5kZXggPSBtUmVzLmxpa2VsaWVzdF9zdGF0ZSAtIE1hdGguZmxvb3IobnN0YXRlcyAvIDIpO1xuICBtUmVzLndpbmRvd19tYXhpbmRleCA9IG1SZXMubGlrZWxpZXN0X3N0YXRlICsgTWF0aC5mbG9vcihuc3RhdGVzIC8gMik7XG4gIG1SZXMud2luZG93X21pbmluZGV4ID0gKG1SZXMud2luZG93X21pbmluZGV4ID49IDApXG4gICAgICAgICAgICAgICAgICAgICAgID8gbVJlcy53aW5kb3dfbWluaW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgOiAwO1xuICBtUmVzLndpbmRvd19tYXhpbmRleCA9IChtUmVzLndpbmRvd19tYXhpbmRleCA8PSBuc3RhdGVzKVxuICAgICAgICAgICAgICAgICAgICAgICA/IG1SZXMud2luZG93X21heGluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgIDogbnN0YXRlcztcbiAgbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudCA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IG1SZXMud2luZG93X21pbmluZGV4OyBpIDwgbVJlcy53aW5kb3dfbWF4aW5kZXg7IGkrKykge1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcbiAgICBpZiAobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkge1xuICAgICAgbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudCArPVxuICAgICAgICBtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV07XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50ICs9XG4gICAgICAgIG1SZXMuYWxwaGFbaV07XG4gICAgfVxuICB9XG5cbiAgLy8gY29uc29sZS5sb2cobVJlcy53aW5kb3dfbWluaW5kZXggKyAnICcgICsgbVJlcy53aW5kb3dfbWF4aW5kZXggKyAnICcgKyBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50KTtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbVVwZGF0ZVJlc3VsdHMgPSAobSwgbVJlcykgPT4ge1xuICBjb25zdCBidWZMZW5ndGggPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDtcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlclttUmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4XVxuICAgID0gTWF0aC5sb2cobVJlcy5pbnN0YW50X2xpa2VsaWhvb2QpO1xuICAvLyBpbmNyZW1lbnQgY2lyY3VsYXIgYnVmZmVyIGluZGV4XG4gIG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhcbiAgICA9IChtUmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4ICsgMSkgJSBidWZMZW5ndGg7XG5cbiAgbVJlcy5sb2dfbGlrZWxpaG9vZCA9IG1SZXMubGlrZWxpaG9vZF9idWZmZXIucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCk7XG4gIC8vIG1SZXMubG9nX2xpa2VsaWhvb2QgPSAwO1xuICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IGJ1ZlNpemU7IGkrKykge1xuICAvLyAgIG1SZXMubG9nX2xpa2VsaWhvb2QgKz0gbVJlcy5saWtlbGlob29kX2J1ZmZlcltpXTtcbiAgLy8gfVxuICBtUmVzLmxvZ19saWtlbGlob29kIC89IGJ1Zkxlbmd0aDtcblxuICBtUmVzLnByb2dyZXNzID0gMDtcbiAgZm9yIChsZXQgaSA9IG1SZXMud2luZG93X21pbmluZGV4OyBpIDwgbVJlcy53aW5kb3dfbWF4aW5kZXg7IGkrKykge1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcbiAgICBpZiAobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkge1xuICAgICAgbVJlcy5wcm9ncmVzc1xuICAgICAgICArPSAoXG4gICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1baV0gK1xuICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzFdW2ldICtcbiAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsyXVtpXVxuICAgICAgICAgICkgKlxuICAgICAgICAgIGkgLyBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50O1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbiBoaWVyYXJjaGljYWxcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5wcm9ncmVzcyArPSBtUmVzLmFscGhhW2ldICpcbiAgICAgICAgICAgICAgIGkgLyBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50O1xuICAgIH1cbiAgfVxuXG4gIG1SZXMucHJvZ3Jlc3MgLz0gKG0ucGFyYW1ldGVycy5zdGF0ZXMgLSAxKTtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbUZpbHRlciA9IChvYnNJbiwgbSwgbVJlcykgPT4ge1xuICBsZXQgY3QgPSAwLjA7XG4gIGlmIChtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQpIHtcbiAgICBjdCA9IGhtbUZvcndhcmRVcGRhdGUob2JzSW4sIG0sIG1SZXMpO1xuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbVJlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGg7IGorKykge1xuICAgICAgbVJlcy5saWtlbGlob29kX2J1ZmZlcltqXSA9IDAuMDtcbiAgICB9XG4gICAgY3QgPSBobW1Gb3J3YXJkSW5pdChvYnNJbiwgbSwgbVJlcyk7XG4gICAgbVJlcy5mb3J3YXJkX2luaXRpYWxpemVkID0gdHJ1ZTtcbiAgfVxuXG4gIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gMS4wIC8gY3Q7XG5cbiAgaG1tVXBkYXRlQWxwaGFXaW5kb3cobSwgbVJlcyk7XG4gIGhtbVVwZGF0ZVJlc3VsdHMobSwgbVJlcyk7XG5cbiAgaWYgKG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uYmltb2RhbCkge1xuICAgIGhtbVJlZ3Jlc3Npb24ob2JzSW4sIG0sIG1SZXMpO1xuICB9XG5cbiAgcmV0dXJuIG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xufTtcblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgYXMgaW4geG1tSGllcmFyY2hpY2FsSG1tLmNwcCAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBoaG1tTGlrZWxpaG9vZEFscGhhID0gKGV4aXROdW0sIGxpa2VsaWhvb2RWZWMsIGhtLCBobVJlcykgPT4ge1xuICBpZiAoZXhpdE51bSA8IDApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgbGlrZWxpaG9vZFZlY1tpXSA9IDA7XG4gICAgICBmb3IgKGxldCBleGl0ID0gMDsgZXhpdCA8IDM7IGV4aXQrKykge1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlczsgaysrKSB7XG4gICAgICAgICAgbGlrZWxpaG9vZFZlY1tpXVxuICAgICAgICAgICAgKz0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtleGl0XVtrXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgbGlrZWxpaG9vZFZlY1tpXSA9IDA7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlczsgaysrKSB7XG4gICAgICAgIGxpa2VsaWhvb2RWZWNbaV1cbiAgICAgICAgICArPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oW2V4aXROdW1dW2tdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IEZPUldBUkQgSU5JVFxuXG5leHBvcnQgY29uc3QgaGhtbUZvcndhcmRJbml0ID0gKG9ic0luLCBobSwgaG1SZXMpID0+IHtcbiAgbGV0IG5vcm1fY29uc3QgPSAwO1xuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gaW5pdGlhbGl6ZSBhbHBoYXNcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblxuICAgIGNvbnN0IG0gPSBobS5tb2RlbHNbaV07XG4gICAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gICAgY29uc3QgbVJlcyA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgIG1SZXMuYWxwaGFfaFtqXSA9IG5ldyBBcnJheShuc3RhdGVzKTtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgIG1SZXMuYWxwaGFfaFtqXVtrXSA9IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXJnb2RpY1xuICAgIGlmIChtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09IDApIHtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICAgICAgICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtrXSA9IG0ucHJpb3Jba10gKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbiwgbS5zdGF0ZXNba10pO1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtUmVzLmFscGhhX2hbMF1ba10gPSBtLnByaW9yW2tdICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1trXSk7XG4gICAgICAgIH1cbiAgICAgICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgKz0gbVJlcy5hbHBoYV9oWzBdW2tdO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxlZnQtcmlnaHRcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5hbHBoYV9oWzBdWzBdID0gaG0ucHJpb3JbaV07XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICAgICAgaWYgKGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcbiAgICAgICAgbVJlcy5hbHBoYV9oWzBdWzBdICo9IGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbiwgbS5zdGF0ZXNbMF0pO1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWxcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYWxwaGFfaFswXVswXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1swXSk7XG4gICAgICB9XG4gICAgICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCA9IG1SZXMuYWxwaGFfaFswXVswXTtcbiAgICB9XG5cbiAgICBub3JtX2NvbnN0ICs9IG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gbm9ybWFsaXplIGFscGhhc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXG4gICAgY29uc3QgbnN0YXRlcyA9IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgICBmb3IgKGxldCBlID0gMDsgZSA8IDM7IGUrKykge1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtlXVtrXSAvPSBub3JtX2NvbnN0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQgPSB0cnVlO1xufTtcblxuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBGT1JXQVJEIFVQREFURVxuXG5leHBvcnQgY29uc3QgaGhtbUZvcndhcmRVcGRhdGUgPSAob2JzSW4sIGhtLCBobVJlcykgPT4ge1xuICBjb25zdCBubW9kZWxzID0gaG0ubW9kZWxzLmxlbmd0aDtcblxuICBsZXQgbm9ybV9jb25zdCA9IDA7XG4gIGxldCB0bXAgPSAwO1xuICBsZXQgZnJvbnQ7IC8vIGFycmF5XG5cbiAgaGhtbUxpa2VsaWhvb2RBbHBoYSgxLCBobVJlcy5mcm9udGllcl92MSwgaG0sIGhtUmVzKTtcbiAgaGhtbUxpa2VsaWhvb2RBbHBoYSgyLCBobVJlcy5mcm9udGllcl92MiwgaG0sIGhtUmVzKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG5tb2RlbHM7IGkrKykge1xuXG4gICAgY29uc3QgbSA9IGhtLm1vZGVsc1tpXTtcbiAgICBjb25zdCBuc3RhdGVzID0gbS5wYXJhbWV0ZXJzLnN0YXRlcztcbiAgICBjb25zdCBtUmVzID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV07XG4gICAgXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PSBjb21wdXRlIGZyb250aWVyIHZhcmlhYmxlXG4gICAgZnJvbnQgPSBuZXcgQXJyYXkobnN0YXRlcyk7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcbiAgICAgIGZyb250W2pdID0gMDtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBlcmdvZGljXG4gICAgaWYgKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT09IDApIHsgLy8gZXJnb2RpY1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcbiAgICAgICAgICBmcm9udFtrXSArPSBtLnRyYW5zaXRpb25baiAqIG5zdGF0ZXMgKyBrXSAvXG4gICAgICAgICAgICAgICAgKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2pdKSAqXG4gICAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2pdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IHNyY2kgPSAwOyBzcmNpIDwgbm1vZGVsczsgc3JjaSsrKSB7XG4gICAgICAgICAgZnJvbnRba10gKz0gbS5wcmlvcltrXSAqXG4gICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgaG1SZXMuZnJvbnRpZXJfdjFbc3JjaV0gKlxuICAgICAgICAgICAgICAgICAgaG0udHJhbnNpdGlvbltzcmNpXVtpXVxuICAgICAgICAgICAgICAgICAgKyBobVJlcy5mcm9udGllcl92MltzcmNpXSAqXG4gICAgICAgICAgICAgICAgICBobS5wcmlvcltpXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsZWZ0LXJpZ2h0XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGsgPT0gMCA6IGZpcnN0IHN0YXRlIG9mIHRoZSBwcmltaXRpdmVcbiAgICAgIGZyb250WzBdID0gbS50cmFuc2l0aW9uWzBdICogbVJlcy5hbHBoYV9oWzBdWzBdO1xuXG4gICAgICBmb3IgKGxldCBzcmNpID0gMDsgc3JjaSA8IG5tb2RlbHM7IHNyY2krKykge1xuICAgICAgICBmcm9udFswXSArPSBobVJlcy5mcm9udGllcl92MVtzcmNpXSAqXG4gICAgICAgICAgICAgICAgICAgIGhtLnRyYW5zaXRpb25bc3JjaV1baV0gK1xuICAgICAgICAgICAgICAgICAgICBobVJlcy5mcm9udGllcl92MltzcmNpXSAqXG4gICAgICAgICAgICAgICAgICAgIGhtLnByaW9yW2ldO1xuICAgICAgfVxuXG4gICAgICAvLyBrID4gMCA6IHJlc3Qgb2YgdGhlIHByaW1pdGl2ZVxuICAgICAgZm9yIChsZXQgayA9IDE7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgZnJvbnRba10gKz0gbS50cmFuc2l0aW9uW2sgKiAyXSAvXG4gICAgICAgICAgICAgICAgICAgICgxIC0gbS5leGl0UHJvYmFiaWxpdGllc1trXSkgKlxuICAgICAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1ba107XG4gICAgICAgIGZyb250W2tdICs9IG0udHJhbnNpdGlvblsoayAtIDEpICogMiArIDFdIC9cbiAgICAgICAgICAgICAgICAgICAgKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2sgLSAxXSkgKlxuICAgICAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1bayAtIDFdO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICAgIG1SZXMuYWxwaGFfaFtqXVtrXSA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT0gdXBkYXRlIGZvcndhcmQgdmFyaWFibGVcbiAgICBtUmVzLmV4aXRfbGlrZWxpaG9vZCA9IDA7XG4gICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSAwO1xuXG4gICAgLy8gZW5kIG9mIHRoZSBwcmltaXRpdmUgOiBoYW5kbGUgZXhpdCBzdGF0ZXNcbiAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgaWYgKGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcbiAgICAgICAgdG1wID0gZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLCBtLnN0YXRlc1trXSkgKiBmcm9udFtrXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRtcCA9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2tdKSAqIGZyb250W2tdO1xuICAgICAgfVxuXG4gICAgICBtUmVzLmFscGhhX2hbMl1ba10gPSBobS5leGl0X3RyYW5zaXRpb25baV0gKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5leGl0UHJvYmFiaWxpdGllc1trXSAqIHRtcDtcbiAgICAgIG1SZXMuYWxwaGFfaFsxXVtrXSA9ICgxIC0gaG0uZXhpdF90cmFuc2l0aW9uW2ldKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdICogdG1wO1xuICAgICAgbVJlcy5hbHBoYV9oWzBdW2tdID0gKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdKSAqIHRtcDtcblxuICAgICAgbVJlcy5leGl0X2xpa2VsaWhvb2QgKz0gbVJlcy5hbHBoYV9oWzFdW2tdICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsyXVtrXTtcbiAgICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kICs9IG1SZXMuYWxwaGFfaFswXVtrXSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMV1ba10gK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzJdW2tdO1xuXG4gICAgICBub3JtX2NvbnN0ICs9IHRtcDtcblxuICAgIH1cblxuICAgIC8vIHRoaXMgY2xpcHBpbmcgaXMgbm90IGluIHRoZSBvcmlnaW5hbCBjb2RlLCBidXQgcHJldmVudHMgY2FzZXMgb2YgLUluZmluaXR5XG4gICAgLy8gaW4gbG9nX2xpa2VsaWhvb2RzIGFuZCBOYU5zIGluIHNtb290aGVkX2xvZ19saWtlbGlob29kc1xuICAgIC8vIChiZWNhdXNlIG9mIGFsbCBcImZyb250XCIgdmFsdWVzIGJlaW5nIG51bGwgZnJvbSB0aW1lIHRvIHRpbWUpIC4uLlxuICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPiAxZS0xODBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IG1SZXMuaW5zdGFudF9saWtlbGlob29kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAxZS0xODA7XG5cbiAgICBtUmVzLmV4aXRfcmF0aW8gPSBtUmVzLmV4aXRfbGlrZWxpaG9vZCAvIG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gbm9ybWFsaXplIGFscGhhc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5tb2RlbHM7IGkrKykge1xuICAgIGZvciAobGV0IGUgPSAwOyBlIDwgMzsgZSsrKSB7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlczsgaysrKSB7XG4gICAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZV1ba10gLz0gbm9ybV9jb25zdDtcbiAgICAgICAgaWYgKG5vcm1fY29uc3QgPT09IDApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgYWxwaGFbJHtlfV1bJHtrfV0gOiAke2FscGhhW2VdW2tdfWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBoaG1tVXBkYXRlUmVzdWx0cyA9IChobSwgaG1SZXMpID0+IHtcbiAgbGV0IG1heGxvZ19saWtlbGlob29kID0gMDtcbiAgbGV0IG5vcm1jb25zdF9pbnN0YW50ID0gMDtcbiAgbGV0IG5vcm1jb25zdF9zbW9vdGhlZCA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblxuICAgIGxldCBtUmVzID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV07XG5cbiAgICBobVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldID0gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG4gICAgaG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldID0gbVJlcy5sb2dfbGlrZWxpaG9vZDtcbiAgICBobVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXSA9IE1hdGguZXhwKGhtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSk7XG5cbiAgICBobVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSBobVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldO1xuICAgIGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSBobVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXTtcblxuICAgIG5vcm1jb25zdF9pbnN0YW50ICAgKz0gaG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuICAgIG5vcm1jb25zdF9zbW9vdGhlZCAgKz0gaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcblxuICAgIGlmIChpID09IDAgfHwgaG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldID4gbWF4bG9nX2xpa2VsaWhvb2QpIHtcbiAgICAgIG1heGxvZ19saWtlbGlob29kID0gaG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldO1xuICAgICAgaG1SZXMubGlrZWxpZXN0ID0gaTtcbiAgICB9XG4gIH1cblxuICBpZiAobm9ybWNvbnN0X2luc3RhbnQgPT09IDAgfHwgbm9ybWNvbnN0X3Ntb290aGVkID09PSAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBtUmVzID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV07XG4gICAgICBjb25zb2xlLmxvZyhtUmVzLmxvZ19saWtlbGlob29kICsgJyAnICsgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QpO1xuICAgIH1cbiAgfVxuXG4gIGxldCB0b3RhbExpa2VsaWhvb2QgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgIGhtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAvPSBub3JtY29uc3RfaW5zdGFudDtcbiAgICBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1jb25zdF9zbW9vdGhlZDtcbiAgICB0b3RhbExpa2VsaWhvb2QgKz0gaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaGhtbUZpbHRlciA9IChvYnNJbiwgaG0sIGhtUmVzKSA9PiB7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICBpZiAoaG0uY29uZmlndXJhdGlvbi5kZWZhdWx0X3BhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgaWYgKGhtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQpIHtcbiAgICAgIGhobW1Gb3J3YXJkVXBkYXRlKG9ic0luLCBobSwgaG1SZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaG1tRm9yd2FyZEluaXQob2JzSW4sIGhtLCBobVJlcyk7XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgaG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXVxuICAgICAgICA9IGhtbUZpbHRlcihvYnNJbiwgaG0ubW9kZWxzW2ldLCBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXSk7XG4gICAgfVxuICB9XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLSBjb21wdXRlIHRpbWUgcHJvZ3Jlc3Npb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICBobW1VcGRhdGVBbHBoYVdpbmRvdyhcbiAgICAgIGhtLm1vZGVsc1tpXSxcbiAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldXG4gICAgKTtcbiAgICBobW1VcGRhdGVSZXN1bHRzKFxuICAgICAgaG0ubW9kZWxzW2ldLFxuICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICApO1xuICB9XG5cblxuICBoaG1tVXBkYXRlUmVzdWx0cyhobSwgaG1SZXMpO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgIGNvbnN0IGRpbSA9IGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmRpbWVuc2lvbjtcbiAgICBjb25zdCBkaW1JbiA9IGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmRpbWVuc2lvbl9pbnB1dDtcbiAgICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBobW1SZWdyZXNzaW9uKG9ic0luLCBobS5tb2RlbHNbaV0sIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGlrZWxpZXN0XG4gICAgaWYgKGhtLmNvbmZpZ3VyYXRpb24ubXVsdGlDbGFzc19yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMCkge1xuICAgICAgaG1SZXMub3V0cHV0X3ZhbHVlc1xuICAgICAgICA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2htUmVzLmxpa2VsaWVzdF1cbiAgICAgICAgICAgICAgIC5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuICAgICAgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2VcbiAgICAgICAgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tobVJlcy5saWtlbGllc3RdXG4gICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2Uuc2xpY2UoMCk7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbWl4dHVyZVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtUmVzLm91dHB1dF92YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgICAgICBobVJlcy5vdXRwdXRfdmFsdWVzW2RdXG4gICAgICAgICAgICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcbiAgICAgICAgICAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLm91dHB1dF92YWx1ZXNbZF07XG5cbiAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgaWYgKGhtLmNvbmZpZ3VyYXRpb24uY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMiArKykge1xuICAgICAgICAgICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdXG4gICAgICAgICAgICAgICAgKz0gaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAqXG4gICAgICAgICAgICAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICAgICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcbiAgICAgICAgICAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG4iXX0=