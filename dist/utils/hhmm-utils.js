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
    mRes.window_normalization_constant += m.parameters.hierarchical
    //----------------------------------------------------------- hierarchical
    ? mRes.alpha_h[0][_i7] + mRes.alpha_h[1][_i7]
    //------------------------------------------------------- non-hierarchical        
    : mRes.alpha[_i7];
  }
};

var hmmUpdateResults = exports.hmmUpdateResults = function hmmUpdateResults(m, mRes) {
  // IS THIS CORRECT  ? TODO : CHECK AGAIN (seems to have precision issues)
  // AHA ! : NORMALLY LIKELIHOOD_BUFFER IS CIRCULAR : IS IT THE CASE HERE ?
  // SHOULD I "POP_FRONT" ? (seems that yes)

  //res.likelihood_buffer.push(Math.log(res.instant_likelihood));

  // NOW THIS IS BETTER (SHOULD WORK AS INTENDED)
  var bufSize = mRes.likelihood_buffer.length;
  mRes.likelihood_buffer[mRes.likelihood_buffer_index] = Math.log(mRes.instant_likelihood);
  // increment circular buffer index
  mRes.likelihood_buffer_index = (mRes.likelihood_buffer_index + 1) % bufSize;

  mRes.log_likelihood = 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhobW0tdXRpbHMuanMiXSwibmFtZXMiOlsiZ21tVXRpbHMiLCJobW1SZWdyZXNzaW9uIiwib2JzSW4iLCJtIiwibVJlcyIsImRpbSIsInN0YXRlcyIsImNvbXBvbmVudHMiLCJkaW1lbnNpb24iLCJkaW1JbiIsImRpbWVuc2lvbl9pbnB1dCIsImRpbU91dCIsIm91dENvdmFyU2l6ZSIsImNvdmFyaWFuY2VfbW9kZSIsIm91dHB1dF92YWx1ZXMiLCJBcnJheSIsImkiLCJvdXRwdXRfY292YXJpYW5jZSIsInBhcmFtZXRlcnMiLCJyZWdyZXNzaW9uX2VzdGltYXRvciIsImdtbUxpa2VsaWhvb2QiLCJsaWtlbGllc3Rfc3RhdGUiLCJzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cyIsImdtbVJlZ3Jlc3Npb24iLCJzbGljZSIsImNsaXBNaW5TdGF0ZSIsIndpbmRvd19taW5pbmRleCIsImNsaXBNYXhTdGF0ZSIsImxlbmd0aCIsIndpbmRvd19tYXhpbmRleCIsIm5vcm1Db25zdGFudCIsIndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50IiwidG1wUHJlZGljdGVkT3V0cHV0IiwiZCIsImhpZXJhcmNoaWNhbCIsImFscGhhX2giLCJkMiIsImFscGhhIiwiaG1tRm9yd2FyZEluaXQiLCJvYnNPdXQiLCJuc3RhdGVzIiwibm9ybUNvbnN0IiwidHJhbnNpdGlvbl9tb2RlIiwiYmltb2RhbCIsInByaW9yIiwiZ21tT2JzUHJvYkJpbW9kYWwiLCJnbW1PYnNQcm9iSW5wdXQiLCJnbW1PYnNQcm9iIiwiaG1tRm9yd2FyZFVwZGF0ZSIsInByZXZpb3VzX2FscGhhIiwiaiIsInRyYW5zaXRpb24iLCJobW1VcGRhdGVBbHBoYVdpbmRvdyIsImJlc3RfYWxwaGEiLCJobW1VcGRhdGVSZXN1bHRzIiwiYnVmU2l6ZSIsImxpa2VsaWhvb2RfYnVmZmVyIiwibGlrZWxpaG9vZF9idWZmZXJfaW5kZXgiLCJNYXRoIiwibG9nIiwiaW5zdGFudF9saWtlbGlob29kIiwibG9nX2xpa2VsaWhvb2QiLCJwcm9ncmVzcyIsImhtbUZpbHRlciIsImN0IiwiZm9yd2FyZF9pbml0aWFsaXplZCIsImhobW1MaWtlbGlob29kQWxwaGEiLCJleGl0TnVtIiwibGlrZWxpaG9vZFZlYyIsImhtIiwiaG1SZXMiLCJtb2RlbHMiLCJleGl0IiwiayIsInNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzIiwiaGhtbUZvcndhcmRJbml0Iiwibm9ybV9jb25zdCIsInNoYXJlZF9wYXJhbWV0ZXJzIiwiZSIsImhobW1Gb3J3YXJkVXBkYXRlIiwibm1vZGVscyIsInRtcCIsImZyb250IiwiZnJvbnRpZXJfdjEiLCJmcm9udGllcl92MiIsImV4aXRQcm9iYWJpbGl0aWVzIiwic3JjaSIsImV4aXRfbGlrZWxpaG9vZCIsImV4aXRfdHJhbnNpdGlvbiIsImV4aXRfcmF0aW8iLCJoaG1tVXBkYXRlUmVzdWx0cyIsIm1heGxvZ19saWtlbGlob29kIiwibm9ybWNvbnN0X2luc3RhbnQiLCJub3JtY29uc3Rfc21vb3RoZWQiLCJpbnN0YW50X2xpa2VsaWhvb2RzIiwic21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzIiwic21vb3RoZWRfbGlrZWxpaG9vZHMiLCJleHAiLCJpbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzIiwibGlrZWxpZXN0IiwiaGhtbUZpbHRlciIsImNvbmZpZ3VyYXRpb24iLCJkZWZhdWx0X3BhcmFtZXRlcnMiLCJtdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0lBQVlBLFE7Ozs7QUFFWjs7OztBQUlBO0FBQ0E7QUFDQTs7QUFFTyxJQUFNQyx3Q0FBZ0IsU0FBaEJBLGFBQWdCLENBQUNDLEtBQUQsRUFBUUMsQ0FBUixFQUFXQyxJQUFYLEVBQW9CO0FBQy9DLE1BQU1DLE1BQU1GLEVBQUVHLE1BQUYsQ0FBUyxDQUFULEVBQVlDLFVBQVosQ0FBdUIsQ0FBdkIsRUFBMEJDLFNBQXRD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QUFOLENBQWlDMUQsSUFBakMsRUFDRUMsaUJBREYsQ0FDb0JnQixDQURwQixDQUZMO0FBSUQ7QUFDRjtBQUNGO0FBQ0Y7QUFDRjtBQUNGLENBakZNIiwiZmlsZSI6ImhobW0tdXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBnbW1VdGlscyBmcm9tICcuL2dtbS11dGlscyc7XG5cbi8qKlxuICogIGZ1bmN0aW9ucyB1c2VkIGZvciBkZWNvZGluZywgdHJhbnNsYXRlZCBmcm9tIFhNTVxuICovXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICAgYXMgaW4geG1tSG1tU2luZ2xlQ2xhc3MuY3BwICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGhtbVJlZ3Jlc3Npb24gPSAob2JzSW4sIG0sIG1SZXMpID0+IHtcbiAgY29uc3QgZGltID0gbS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5kaW1lbnNpb247XG4gIGNvbnN0IGRpbUluID0gbS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5kaW1lbnNpb25faW5wdXQ7XG4gIGNvbnN0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG4gIGxldCBvdXRDb3ZhclNpemU7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAobS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dDtcbiAgfVxuXG4gIG1SZXMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgbVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICB9XG4gIG1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gIH1cblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsaWtlbGllc3RcbiAgaWYgKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMikge1xuICAgIGdtbVV0aWxzLmdtbUxpa2VsaWhvb2QoXG4gICAgICBvYnNJbixcbiAgICAgIG0uc3RhdGVzW21SZXMubGlrZWxpZXN0X3N0YXRlXSxcbiAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbbVJlcy5saWtlbGllc3Rfc3RhdGVdXG4gICAgKTtcbiAgICBnbW1VdGlscy5nbW1SZWdyZXNzaW9uKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0X3N0YXRlXVxuICAgICk7XG4gICAgbVJlcy5vdXRwdXRfdmFsdWVzXG4gICAgICA9IG0uc3RhdGVzW21SZXMubGlrZWxpZXN0X3N0YXRlXS5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGNsaXBNaW5TdGF0ZSA9IChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT0gMClcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gd2luZG93ZWRcbiAgICAgICAgICAgICAgICAgICAgOiBtUmVzLndpbmRvd19taW5pbmRleDtcblxuICBjb25zdCBjbGlwTWF4U3RhdGUgPSAobS5wYXJhbWV0ZXJzLnJlZ3Jlc3Npb25fZXN0aW1hdG9yID09IDApXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICAgICAgICAgICAgICA/IG0uc3RhdGVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gd2luZG93ZWRcbiAgICAgICAgICAgICAgICAgICAgOiBtUmVzLndpbmRvd19tYXhpbmRleDtcblxuICBsZXQgbm9ybUNvbnN0YW50ID0gKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PSAwKVxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICAgICAgICAgICAgPyAxLjBcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHdpbmRvd2VkXG4gICAgICAgICAgICAgICAgICAgIDogbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcblxuICBpZiAobm9ybUNvbnN0YW50IDw9IDAuMCkge1xuICAgIG5vcm1Db25zdGFudCA9IDEuO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IGNsaXBNaW5TdGF0ZTsgaSA8IGNsaXBNYXhTdGF0ZTsgaSsrKSB7XG4gICAgZ21tVXRpbHMuZ21tTGlrZWxpaG9vZChcbiAgICAgIG9ic0luLFxuICAgICAgbS5zdGF0ZXNbaV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgKTtcbiAgICBnbW1VdGlscy5nbW1SZWdyZXNzaW9uKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1tpXSxcbiAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICApO1xuICAgIGNvbnN0IHRtcFByZWRpY3RlZE91dHB1dFxuICAgICAgPSBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG5cbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IGRpbU91dDsgZCsrKSB7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICAgICAgaWYgKG1SZXMuaGllcmFyY2hpY2FsKSB7XG4gICAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tkXVxuICAgICAgICAgICs9IChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICB0bXBQcmVkaWN0ZWRPdXRwdXRbZF0gLyBub3JtQ29uc3RhbnQ7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICBpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyKyspIHtcbiAgICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXVxuICAgICAgICAgICAgICArPSAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG4gICAgICAgICAgICAgICAgIChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXSAvXG4gICAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICAgIH1cbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICAgKz0gKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgICAgKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2RdIC9cbiAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICB9XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2RdICs9IG1SZXMuYWxwaGFbaV0gKiBcbiAgICAgICAgICAgICAgICAgICAgIHRtcFByZWRpY3RlZE91dHB1dFtkXSAvIG5vcm1Db25zdGFudDtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgIGlmIChtLnBhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgICAgZm9yIChsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIrKykge1xuICAgICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdXG4gICAgICAgICAgICAgICs9ICBtUmVzLmFscGhhW2ldICogbVJlcy5hbHBoYVtpXSAqXG4gICAgICAgICAgICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl0gL1xuICAgICAgICAgICAgICAgIG5vcm1Db25zdGFudDtcbiAgICAgICAgICB9XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdICs9IG1SZXMuYWxwaGFbaV0gKiBtUmVzLmFscGhhW2ldICpcbiAgICAgICAgICAgICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZF0gL1xuICAgICAgICAgICAgICAgICAgICAgICAgIG5vcm1Db25zdGFudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaG1tRm9yd2FyZEluaXQgPSAob2JzSW4sIG0sIG1SZXMsIG9ic091dCA9IFtdKSA9PiB7XG4gIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICBsZXQgbm9ybUNvbnN0ID0gMC4wO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXJnb2RpYyAgICAgICAgXG4gIGlmIChtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsICAgICAgICBcbiAgICAgIGlmIChtLnN0YXRlc1tpXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcbiAgICAgICAgaWYgKG9ic091dC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgbVJlcy5hbHBoYVtpXSA9IG0ucHJpb3JbaV0gKlxuICAgICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNPdXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1tpXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5hbHBoYVtpXSA9IG0ucHJpb3JbaV0gKlxuICAgICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2ldKTtcbiAgICAgICAgfVxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWwgICAgICAgIFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5hbHBoYVtpXSA9IG0ucHJpb3JbaV0gKlxuICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2ldKTtcbiAgICAgIH1cbiAgICAgIG5vcm1Db25zdCArPSBtUmVzLmFscGhhW2ldO1xuICAgIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsZWZ0LXJpZ2h0ICAgICAgICBcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1SZXMuYWxwaGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gPSAwLjA7XG4gICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWwgICAgICAgIFxuICAgIGlmIChtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcbiAgICAgIGlmIChvYnNPdXQubGVuZ3RoID4gMCkge1xuICAgICAgICBtUmVzLmFscGhhWzBdID0gZ21tVXRpbHMuZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JzT3V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzWzBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYWxwaGFbMF0gPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzWzBdKTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsICAgICAgICBcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5hbHBoYVswXSA9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzWzBdKTtcbiAgICB9XG4gICAgbm9ybUNvbnN0ICs9IG1SZXMuYWxwaGFbMF07XG4gIH1cblxuICBpZiAobm9ybUNvbnN0ID4gMCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgICBtUmVzLmFscGhhW2ldIC89IG5vcm1Db25zdDtcbiAgICB9XG4gICAgcmV0dXJuICgxLjAgLyBub3JtQ29uc3QpO1xuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgICBtUmVzLmFscGhhW2ldID0gMS4wIC8gbnN0YXRlcztcbiAgICB9XG4gICAgcmV0dXJuIDEuMDtcbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaG1tRm9yd2FyZFVwZGF0ZSA9IChvYnNJbiwgbSwgbVJlcywgb2JzT3V0ID0gW10pID0+IHtcbiAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gIGxldCBub3JtQ29uc3QgPSAwLjA7XG5cbiAgbVJlcy5wcmV2aW91c19hbHBoYSA9IG1SZXMuYWxwaGEuc2xpY2UoMCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgbVJlcy5hbHBoYVtpXSA9IDA7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXJnb2RpY1xuICAgIGlmIChtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09PSAwKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5zdGF0ZXM7IGorKykge1xuICAgICAgICBtUmVzLmFscGhhW2ldICs9IG1SZXMucHJldmlvdXNfYWxwaGFbal0gKlxuICAgICAgICAgICAgICAgICBtUmVzLnRyYW5zaXRpb25baiAqIG5zdGF0ZXMrIGldO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxlZnQtcmlnaHRcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5hbHBoYVtpXSArPSBtUmVzLnByZXZpb3VzX2FscGhhW2ldICogbVJlcy50cmFuc2l0aW9uW2kgKiAyXTtcbiAgICAgIGlmIChpID4gMCkge1xuICAgICAgICBtUmVzLmFscGhhW2ldICs9IG1SZXMucHJldmlvdXNfYWxwaGFbaSAtIDFdICpcbiAgICAgICAgICAgICAgICAgbVJlcy50cmFuc2l0aW9uWyhpIC0gMSkgKiAyICsgMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhWzBdICs9IG1SZXMucHJldmlvdXNfYWxwaGFbbnN0YXRlcyAtIDFdICpcbiAgICAgICAgICAgICAgICAgbVJlcy50cmFuc2l0aW9uW25zdGF0ZXMgKiAyIC0gMV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbCAgICAgICAgXG4gICAgaWYgKG0uc3RhdGVzW2ldLmNvbXBvbmVudHNbMF0uYmltb2RhbCkge1xuICAgICAgaWYgKG9ic091dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNPdXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1tpXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhW2ldICo9IGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2ldKTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsICAgICAgICBcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5hbHBoYVtpXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1tpXSk7XG4gICAgfVxuICAgIG5vcm1Db25zdCArPSBtUmVzLmFscGhhW2ldO1xuICB9XG5cbiAgaWYgKG5vcm1Db25zdCA+IDFlLTMwMCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgICBtUmVzLmFscGhhW2ldIC89IG5vcm1Db25zdDtcbiAgICB9XG4gICAgcmV0dXJuICgxLjAgLyBub3JtQ29uc3QpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAwLjA7XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbVVwZGF0ZUFscGhhV2luZG93ID0gKG0sIG1SZXMpID0+IHtcbiAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gIFxuICBtUmVzLmxpa2VsaWVzdF9zdGF0ZSA9IDA7XG5cbiAgbGV0IGJlc3RfYWxwaGE7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICBpZiAobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkge1xuICAgIGJlc3RfYWxwaGEgPSBtUmVzLmFscGhhX2hbMF1bMF0gKyBtUmVzLmFscGhhX2hbMV1bMF07XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICB9IGVsc2Uge1xuICAgIGJlc3RfYWxwaGEgPSBtUmVzLmFscGhhWzBdOyBcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICAgIGlmIChtLnBhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgICBpZiAoKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgPiBiZXN0X2FscGhhKSB7XG4gICAgICAgIGJlc3RfYWxwaGEgPSBtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV07XG4gICAgICAgIG1SZXMubGlrZWxpZXN0X3N0YXRlID0gaTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBub24taGllcmFyY2hpY2FsICAgICAgICBcbiAgICB9IGVsc2Uge1xuICAgICAgaWYobVJlcy5hbHBoYVtpXSA+IGJlc3RfYWxwaGEpIHtcbiAgICAgICAgYmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFbMF07XG4gICAgICAgIG1SZXMubGlrZWxpZXN0X3N0YXRlID0gaTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBtUmVzLndpbmRvd19taW5pbmRleCA9IG1SZXMubGlrZWxpZXN0X3N0YXRlIC0gbnN0YXRlcyAvIDI7XG4gIG1SZXMud2luZG93X21heGluZGV4ID0gbVJlcy5saWtlbGllc3Rfc3RhdGUgKyBuc3RhdGVzIC8gMjtcbiAgbVJlcy53aW5kb3dfbWluaW5kZXggPSAobVJlcy53aW5kb3dfbWluaW5kZXggPj0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgPyBtUmVzLndpbmRvd19taW5pbmRleFxuICAgICAgICAgICAgICAgICAgICAgICA6IDA7XG4gIG1SZXMud2luZG93X21heGluZGV4ID0gKG1SZXMud2luZG93X21heGluZGV4IDw9IG5zdGF0ZXMpXG4gICAgICAgICAgICAgICAgICAgICAgID8gbVJlcy53aW5kb3dfbWF4aW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgOiBuc3RhdGVzO1xuICBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50ID0gMDtcbiAgZm9yIChsZXQgaSA9IG1SZXMud2luZG93X21pbmluZGV4OyBpIDwgbVJlcy53aW5kb3dfbWF4aW5kZXg7IGkrKykge1xuICAgIG1SZXMud2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQgKz0gXG4gICAgICAgIG0ucGFyYW1ldGVycy5oaWVyYXJjaGljYWxcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gICAgICA/IG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXVxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWwgICAgICAgIFxuICAgICAgOiBtUmVzLmFscGhhW2ldO1xuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1VcGRhdGVSZXN1bHRzID0gKG0sIG1SZXMpID0+IHtcbiAgLy8gSVMgVEhJUyBDT1JSRUNUICA/IFRPRE8gOiBDSEVDSyBBR0FJTiAoc2VlbXMgdG8gaGF2ZSBwcmVjaXNpb24gaXNzdWVzKVxuICAvLyBBSEEgISA6IE5PUk1BTExZIExJS0VMSUhPT0RfQlVGRkVSIElTIENJUkNVTEFSIDogSVMgSVQgVEhFIENBU0UgSEVSRSA/XG4gIC8vIFNIT1VMRCBJIFwiUE9QX0ZST05UXCIgPyAoc2VlbXMgdGhhdCB5ZXMpXG5cbiAgLy9yZXMubGlrZWxpaG9vZF9idWZmZXIucHVzaChNYXRoLmxvZyhyZXMuaW5zdGFudF9saWtlbGlob29kKSk7XG5cbiAgLy8gTk9XIFRISVMgSVMgQkVUVEVSIChTSE9VTEQgV09SSyBBUyBJTlRFTkRFRClcbiAgY29uc3QgYnVmU2l6ZSA9IG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW21SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhdXG4gICAgPSBNYXRoLmxvZyhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCk7XG4gIC8vIGluY3JlbWVudCBjaXJjdWxhciBidWZmZXIgaW5kZXhcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleFxuICAgID0gKG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXggKyAxKSAlIGJ1ZlNpemU7XG5cbiAgbVJlcy5sb2dfbGlrZWxpaG9vZCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmU2l6ZTsgaSsrKSB7XG4gICAgbVJlcy5sb2dfbGlrZWxpaG9vZCArPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW2ldO1xuICB9XG4gIG1SZXMubG9nX2xpa2VsaWhvb2QgLz0gYnVmU2l6ZTtcblxuICBtUmVzLnByb2dyZXNzID0gMDtcbiAgZm9yIChsZXQgaSA9IG1SZXMud2luZG93X21pbmluZGV4OyBpIDwgbVJlcy53aW5kb3dfbWF4aW5kZXg7IGkrKykge1xuICAgIGlmIChtLnBhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7IC8vIGhpZXJhcmNoaWNhbFxuICAgICAgbVJlcy5wcm9ncmVzc1xuICAgICAgICArPSAoXG4gICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1baV0gK1xuICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzFdW2ldICtcbiAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsyXVtpXVxuICAgICAgICAgICkgKlxuICAgICAgICAgIGkgLyBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50O1xuICAgIH0gZWxzZSB7IC8vIG5vbiBoaWVyYXJjaGljYWxcbiAgICAgIG1SZXMucHJvZ3Jlc3MgKz0gbVJlcy5hbHBoYVtpXSAqXG4gICAgICAgICAgICAgICBpIC8gbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcbiAgICB9XG4gIH1cbiAgbVJlcy5wcm9ncmVzcyAvPSAobS5wYXJhbWV0ZXJzLnN0YXRlcyAtIDEpO1xufTtcblxuXG5leHBvcnQgY29uc3QgaG1tRmlsdGVyID0gKG9ic0luLCBtLCBtUmVzKSA9PiB7XG4gIGxldCBjdCA9IDAuMDtcbiAgaWYgKG1SZXMuZm9yd2FyZF9pbml0aWFsaXplZCkge1xuICAgIGN0ID0gaG1tRm9yd2FyZFVwZGF0ZShvYnNJbiwgbSwgbVJlcyk7XG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDsgaisrKSB7XG4gICAgICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMC4wO1xuICAgIH1cbiAgICBjdCA9IGhtbUZvcndhcmRJbml0KG9ic0luLCBtLCBtUmVzKTtcbiAgICBtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSAxLjAgLyBjdDtcbiAgaG1tVXBkYXRlQWxwaGFXaW5kb3cobSwgbVJlcyk7XG4gIGhtbVVwZGF0ZVJlc3VsdHMobSwgbVJlcyk7XG5cbiAgaWYgKG0uc3RhdGVzWzBdLmNvbXBvbmVudHNbMF0uYmltb2RhbCkge1xuICAgIGhtbVJlZ3Jlc3Npb24ob2JzSW4sIG0sIG1SZXMpO1xuICB9XG5cbiAgcmV0dXJuIG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xufTtcblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgYXMgaW4geG1tSGllcmFyY2hpY2FsSG1tLmNwcCAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBoaG1tTGlrZWxpaG9vZEFscGhhID0gKGV4aXROdW0sIGxpa2VsaWhvb2RWZWMsIGhtLCBobVJlcykgPT4ge1xuICBpZiAoZXhpdE51bSA8IDApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgbGlrZWxpaG9vZFZlY1tpXSA9IDA7XG4gICAgICBmb3IgKGxldCBleGl0ID0gMDsgZXhpdCA8IDM7IGV4aXQrKykge1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlczsgaysrKSB7XG4gICAgICAgICAgbGlrZWxpaG9vZFZlY1tpXVxuICAgICAgICAgICAgKz0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtleGl0XVtrXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgbGlrZWxpaG9vZFZlY1tpXSA9IDA7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlczsgaysrKSB7XG4gICAgICAgIGxpa2VsaWhvb2RWZWNbaV1cbiAgICAgICAgICArPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oW2V4aXROdW1dW2tdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IEZPUldBUkQgSU5JVFxuXG5leHBvcnQgY29uc3QgaGhtbUZvcndhcmRJbml0ID0gKG9ic0luLCBobSwgaG1SZXMpID0+IHtcbiAgbGV0IG5vcm1fY29uc3QgPSAwO1xuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gaW5pdGlhbGl6ZSBhbHBoYXNcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblxuICAgIGNvbnN0IG0gPSBobS5tb2RlbHNbaV07XG4gICAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gICAgY29uc3QgbVJlcyA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgIG1SZXMuYWxwaGFfaFtqXSA9IG5ldyBBcnJheShuc3RhdGVzKTtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgIG1SZXMuYWxwaGFfaFtqXVtrXSA9IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXJnb2RpY1xuICAgIGlmIChtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09IDApIHtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICAgICAgICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtrXSA9IG0ucHJpb3Jba10gKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbiwgbS5zdGF0ZXNba10pO1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtUmVzLmFscGhhX2hbMF1ba10gPSBtLnByaW9yW2tdICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1trXSk7XG4gICAgICAgIH1cbiAgICAgICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgKz0gbVJlcy5hbHBoYV9oWzBdW2tdO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxlZnQtcmlnaHRcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5hbHBoYV9oWzBdWzBdID0gaG0ucHJpb3JbaV07XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICAgICAgaWYgKGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcbiAgICAgICAgbVJlcy5hbHBoYV9oWzBdWzBdICo9IGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbiwgbS5zdGF0ZXNbMF0pO1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWxcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYWxwaGFfaFswXVswXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1swXSk7XG4gICAgICB9XG4gICAgICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCA9IG1SZXMuYWxwaGFfaFswXVswXTtcbiAgICB9XG4gICAgbm9ybV9jb25zdCArPSBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IG5vcm1hbGl6ZSBhbHBoYXNcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblxuICAgIGNvbnN0IG5zdGF0ZXMgPSBobS5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gICAgZm9yIChsZXQgZSA9IDA7IGUgPCAzOyBlKyspIHtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZV1ba10gLz0gbm9ybV9jb25zdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBobVJlcy5mb3J3YXJkX2luaXRpYWxpemVkID0gdHJ1ZTtcbn07XG5cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gRk9SV0FSRCBVUERBVEVcblxuZXhwb3J0IGNvbnN0IGhobW1Gb3J3YXJkVXBkYXRlID0gKG9ic0luLCBobSwgaG1SZXMpID0+IHtcbiAgY29uc3Qgbm1vZGVscyA9IGhtLm1vZGVscy5sZW5ndGg7XG5cbiAgbGV0IG5vcm1fY29uc3QgPSAwO1xuICBsZXQgdG1wID0gMDtcbiAgbGV0IGZyb250OyAvLyBhcnJheVxuXG4gIGhobW1MaWtlbGlob29kQWxwaGEoMSwgaG1SZXMuZnJvbnRpZXJfdjEsIGhtLCBobVJlcyk7XG4gIGhobW1MaWtlbGlob29kQWxwaGEoMiwgaG1SZXMuZnJvbnRpZXJfdjIsIGhtLCBobVJlcyk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBubW9kZWxzOyBpKyspIHtcblxuICAgIGNvbnN0IG0gPSBobS5tb2RlbHNbaV07XG4gICAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gICAgY29uc3QgbVJlcyA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldO1xuICAgIFxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT0gY29tcHV0ZSBmcm9udGllciB2YXJpYWJsZVxuICAgIGZyb250ID0gbmV3IEFycmF5KG5zdGF0ZXMpO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnN0YXRlczsgaisrKSB7XG4gICAgICBmcm9udFtqXSA9IDA7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXJnb2RpY1xuICAgIGlmIChtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09IDApIHsgLy8gZXJnb2RpY1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcbiAgICAgICAgICBmcm9udFtrXSArPSBtLnRyYW5zaXRpb25baiAqIG5zdGF0ZXMgKyBrXSAvXG4gICAgICAgICAgICAgICAgKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2pdKSAqXG4gICAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2pdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IHNyY2kgPSAwOyBzcmNpIDwgbm1vZGVsczsgc3JjaSsrKSB7XG4gICAgICAgICAgZnJvbnRba10gKz0gbS5wcmlvcltrXSAqXG4gICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgaG1SZXMuZnJvbnRpZXJfdjFbc3JjaV0gKlxuICAgICAgICAgICAgICAgICAgaG0udHJhbnNpdGlvbltzcmNpXVtpXVxuICAgICAgICAgICAgICAgICAgKyBobVJlcy5mcm9udGllcl92MltzcmNpXSAqXG4gICAgICAgICAgICAgICAgICBobS5wcmlvcltpXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsZWZ0LXJpZ2h0XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGsgPT0gMCA6IGZpcnN0IHN0YXRlIG9mIHRoZSBwcmltaXRpdmVcbiAgICAgIGZyb250WzBdID0gbS50cmFuc2l0aW9uWzBdICogbVJlcy5hbHBoYV9oWzBdWzBdO1xuXG4gICAgICBmb3IgKGxldCBzcmNpID0gMDsgc3JjaSA8IG5tb2RlbHM7IHNyY2krKykge1xuICAgICAgICBmcm9udFswXSArPSBobVJlcy5mcm9udGllcl92MVtzcmNpXSAqXG4gICAgICAgICAgICAgIGhtLnRyYW5zaXRpb25bc3JjaV1baV1cbiAgICAgICAgICAgICAgKyBobVJlcy5mcm9udGllcl92MltzcmNpXSAqXG4gICAgICAgICAgICAgIGhtLnByaW9yW2ldO1xuICAgICAgfVxuXG4gICAgICAvLyBrID4gMCA6IHJlc3Qgb2YgdGhlIHByaW1pdGl2ZVxuICAgICAgZm9yIChsZXQgayA9IDE7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgZnJvbnRba10gKz0gbS50cmFuc2l0aW9uW2sgKiAyXSAvXG4gICAgICAgICAgICAgICgxIC0gbS5leGl0UHJvYmFiaWxpdGllc1trXSkgKlxuICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1ba107XG4gICAgICAgIGZyb250W2tdICs9IG0udHJhbnNpdGlvblsoayAtIDEpICogMiArIDFdIC9cbiAgICAgICAgICAgICAgKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2sgLSAxXSkgKlxuICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1bayAtIDFdO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICAgIG1SZXMuYWxwaGFfaFtqXVtrXSA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy9jb25zb2xlLmxvZyhmcm9udCk7XG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT0gdXBkYXRlIGZvcndhcmQgdmFyaWFibGVcbiAgICBtUmVzLmV4aXRfbGlrZWxpaG9vZCA9IDA7XG4gICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSAwO1xuXG4gICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgIGlmIChobS5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG4gICAgICAgIHRtcCA9IGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbiwgbS5zdGF0ZXNba10pICpcbiAgICAgICAgICAgIGZyb250W2tdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdG1wID0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNba10pICogZnJvbnRba107XG4gICAgICB9XG5cbiAgICAgIG1SZXMuYWxwaGFfaFsyXVtrXSA9IGhtLmV4aXRfdHJhbnNpdGlvbltpXSAqXG4gICAgICAgICAgICAgICAgIG0uZXhpdFByb2JhYmlsaXRpZXNba10gKiB0bXA7XG4gICAgICBtUmVzLmFscGhhX2hbMV1ba10gPSAoMSAtIGhtLmV4aXRfdHJhbnNpdGlvbltpXSkgKlxuICAgICAgICAgICAgICAgICBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdICogdG1wO1xuICAgICAgbVJlcy5hbHBoYV9oWzBdW2tdID0gKDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdKSAqIHRtcDtcblxuICAgICAgbVJlcy5leGl0X2xpa2VsaWhvb2QgKz0gbVJlcy5hbHBoYV9oWzFdW2tdICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsyXVtrXTtcbiAgICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kICs9IG1SZXMuYWxwaGFfaFswXVtrXSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMV1ba10gK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzJdW2tdO1xuXG4gICAgICBub3JtX2NvbnN0ICs9IHRtcDtcbiAgICB9XG5cbiAgICBtUmVzLmV4aXRfcmF0aW8gPSBtUmVzLmV4aXRfbGlrZWxpaG9vZCAvIG1SZXMuaW5zdGFudF9saWtlbGlob29kO1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gbm9ybWFsaXplIGFscGhhc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5tb2RlbHM7IGkrKykge1xuICAgIGZvciAobGV0IGUgPSAwOyBlIDwgMzsgZSsrKSB7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGhtLm1vZGVsc1tpXS5wYXJhbWV0ZXJzLnN0YXRlczsgaysrKSB7XG4gICAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZV1ba10gLz0gbm9ybV9jb25zdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhobW1VcGRhdGVSZXN1bHRzID0gKGhtLCBobVJlcykgPT4ge1xuICBsZXQgbWF4bG9nX2xpa2VsaWhvb2QgPSAwO1xuICBsZXQgbm9ybWNvbnN0X2luc3RhbnQgPSAwO1xuICBsZXQgbm9ybWNvbnN0X3Ntb290aGVkID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXG4gICAgbGV0IG1SZXMgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXTtcblxuICAgIGhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcbiAgICBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmxvZ19saWtlbGlob29kO1xuICAgIGhtUmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldID0gTWF0aC5leHAoaG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldKTtcblxuICAgIGhtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IGhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV07XG4gICAgaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IGhtUmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgbm9ybWNvbnN0X2luc3RhbnQgICArPSBobVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG4gICAgbm9ybWNvbnN0X3Ntb290aGVkICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgaWYgKGkgPT0gMCB8fCBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPiBtYXhsb2dfbGlrZWxpaG9vZCkge1xuICAgICAgbWF4bG9nX2xpa2VsaWhvb2QgPSBobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV07XG4gICAgICBobVJlcy5saWtlbGllc3QgPSBpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgaG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1jb25zdF9pbnN0YW50O1xuICAgIGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gLz0gbm9ybWNvbnN0X3Ntb290aGVkO1xuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBoaG1tRmlsdGVyID0gKG9ic0luLCBobSwgaG1SZXMpID0+IHtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGllcmFyY2hpY2FsXG4gIGlmIChobS5jb25maWd1cmF0aW9uLmRlZmF1bHRfcGFyYW1ldGVycy5oaWVyYXJjaGljYWwpIHtcbiAgICBpZiAoaG1SZXMuZm9yd2FyZF9pbml0aWFsaXplZCkge1xuICAgICAgaGhtbUZvcndhcmRVcGRhdGUob2JzSW4sIGhtLCBobVJlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhobW1Gb3J3YXJkSW5pdChvYnNJbiwgaG0sIGhtUmVzKTtcbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBobVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldID0gaG1tRmlsdGVyKG9ic0luLCBobSwgaG1SZXMpO1xuICAgIH1cbiAgfVxuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0gY29tcHV0ZSB0aW1lIHByb2dyZXNzaW9uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgaG1tVXBkYXRlQWxwaGFXaW5kb3coXG4gICAgICBobS5tb2RlbHNbaV0sXG4gICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuICAgICk7XG4gICAgaG1tVXBkYXRlUmVzdWx0cyhcbiAgICAgIGhtLm1vZGVsc1tpXSxcbiAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldXG4gICAgKTtcbiAgfVxuXG4gIGhobW1VcGRhdGVSZXN1bHRzKGhtLCBobVJlcyk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG4gIGlmIChobS5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG4gICAgY29uc3QgZGltID0gaG0uc2hhcmVkX3BhcmFtZXRlcnMuZGltZW5zaW9uO1xuICAgIGNvbnN0IGRpbUluID0gaG0uc2hhcmVkX3BhcmFtZXRlcnMuZGltZW5zaW9uX2lucHV0O1xuICAgIGNvbnN0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGhtbVJlZ3Jlc3Npb24ob2JzSW4sIGhtLm1vZGVsc1tpXSwgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsaWtlbGllc3RcbiAgICBpZiAoaG0uY29uZmlndXJhdGlvbi5tdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yID09PSAwKSB7XG4gICAgICBobVJlcy5vdXRwdXRfdmFsdWVzXG4gICAgICAgID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaG1SZXMubGlrZWxpZXN0XVxuICAgICAgICAgICAgICAgLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG4gICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVxuICAgICAgICA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2htUmVzLmxpa2VsaWVzdF1cbiAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZS5zbGljZSgwKTtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtaXh0dXJlXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG1SZXMub3V0cHV0X3ZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBobVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobVJlcy5vdXRwdXRfY292YXJpYW5jZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVtpXSA9IDAuMDtcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgICAgIGhtUmVzLm91dHB1dF92YWx1ZXNbZF1cbiAgICAgICAgICAgICs9IGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gKlxuICAgICAgICAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0ub3V0cHV0X3ZhbHVlc1tkXTtcblxuICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICBpZiAoaG0uY29uZmlndXJhdGlvbi5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyICsrKSB7XG4gICAgICAgICAgICAgIGhtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl1cbiAgICAgICAgICAgICAgICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcbiAgICAgICAgICAgICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGhtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdXG4gICAgICAgICAgICAgICs9IGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gKlxuICAgICAgICAgICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2RdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbiJdfQ==