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
    //------------------------------------------------------------- hierarchical
    if (m.parameters.hierarchical) {
      mRes.progress += (mRes.alpha_h[0][_i8] + mRes.alpha_h[1][_i8] + mRes.alpha_h[2][_i8]) * _i8 / mRes.window_normalization_constant;
      //--------------------------------------------------------- non hierarchical
    } else {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhobW0tdXRpbHMuanMiXSwibmFtZXMiOlsiZ21tVXRpbHMiLCJobW1SZWdyZXNzaW9uIiwib2JzSW4iLCJtIiwibVJlcyIsImRpbSIsInN0YXRlcyIsImNvbXBvbmVudHMiLCJkaW1lbnNpb24iLCJkaW1JbiIsImRpbWVuc2lvbl9pbnB1dCIsImRpbU91dCIsIm91dENvdmFyU2l6ZSIsImNvdmFyaWFuY2VfbW9kZSIsIm91dHB1dF92YWx1ZXMiLCJBcnJheSIsImkiLCJvdXRwdXRfY292YXJpYW5jZSIsInBhcmFtZXRlcnMiLCJyZWdyZXNzaW9uX2VzdGltYXRvciIsImdtbUxpa2VsaWhvb2QiLCJsaWtlbGllc3Rfc3RhdGUiLCJzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cyIsImdtbVJlZ3Jlc3Npb24iLCJzbGljZSIsImNsaXBNaW5TdGF0ZSIsIndpbmRvd19taW5pbmRleCIsImNsaXBNYXhTdGF0ZSIsImxlbmd0aCIsIndpbmRvd19tYXhpbmRleCIsIm5vcm1Db25zdGFudCIsIndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50IiwidG1wUHJlZGljdGVkT3V0cHV0IiwiZCIsImhpZXJhcmNoaWNhbCIsImFscGhhX2giLCJkMiIsImFscGhhIiwiaG1tRm9yd2FyZEluaXQiLCJvYnNPdXQiLCJuc3RhdGVzIiwibm9ybUNvbnN0IiwidHJhbnNpdGlvbl9tb2RlIiwiYmltb2RhbCIsInByaW9yIiwiZ21tT2JzUHJvYkJpbW9kYWwiLCJnbW1PYnNQcm9iSW5wdXQiLCJnbW1PYnNQcm9iIiwiaG1tRm9yd2FyZFVwZGF0ZSIsInByZXZpb3VzX2FscGhhIiwiaiIsInRyYW5zaXRpb24iLCJobW1VcGRhdGVBbHBoYVdpbmRvdyIsImJlc3RfYWxwaGEiLCJNYXRoIiwiZmxvb3IiLCJobW1VcGRhdGVSZXN1bHRzIiwiYnVmU2l6ZSIsImxpa2VsaWhvb2RfYnVmZmVyIiwibGlrZWxpaG9vZF9idWZmZXJfaW5kZXgiLCJsb2ciLCJpbnN0YW50X2xpa2VsaWhvb2QiLCJsb2dfbGlrZWxpaG9vZCIsInByb2dyZXNzIiwiaG1tRmlsdGVyIiwiY3QiLCJmb3J3YXJkX2luaXRpYWxpemVkIiwiaGhtbUxpa2VsaWhvb2RBbHBoYSIsImV4aXROdW0iLCJsaWtlbGlob29kVmVjIiwiaG0iLCJobVJlcyIsIm1vZGVscyIsImV4aXQiLCJrIiwic2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHMiLCJoaG1tRm9yd2FyZEluaXQiLCJub3JtX2NvbnN0Iiwic2hhcmVkX3BhcmFtZXRlcnMiLCJlIiwiaGhtbUZvcndhcmRVcGRhdGUiLCJubW9kZWxzIiwidG1wIiwiZnJvbnQiLCJmcm9udGllcl92MSIsImZyb250aWVyX3YyIiwiZXhpdFByb2JhYmlsaXRpZXMiLCJzcmNpIiwiZXhpdF9saWtlbGlob29kIiwiZXhpdF90cmFuc2l0aW9uIiwiZXhpdF9yYXRpbyIsImhobW1VcGRhdGVSZXN1bHRzIiwibWF4bG9nX2xpa2VsaWhvb2QiLCJub3JtY29uc3RfaW5zdGFudCIsIm5vcm1jb25zdF9zbW9vdGhlZCIsImluc3RhbnRfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9saWtlbGlob29kcyIsImV4cCIsImluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kcyIsInNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMiLCJsaWtlbGllc3QiLCJoaG1tRmlsdGVyIiwiY29uZmlndXJhdGlvbiIsImRlZmF1bHRfcGFyYW1ldGVycyIsIm11bHRpQ2xhc3NfcmVncmVzc2lvbl9lc3RpbWF0b3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7SUFBWUEsUTs7OztBQUVaOzs7O0FBSUE7QUFDQTtBQUNBOztBQUVPLElBQU1DLHdDQUFnQixTQUFoQkEsYUFBZ0IsQ0FBQ0MsS0FBRCxFQUFRQyxDQUFSLEVBQVdDLElBQVgsRUFBb0I7QUFDL0MsTUFBTUMsTUFBTUYsRUFBRUcsTUFBRixDQUFTLENBQVQsRUFBWUMsVUFBWixDQUF1QixDQUF2QixFQUEw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QUlEO0FBQ0g7QUFDQyxXQVJELE1BUU87QUFDTG1DLGtCQUFNdEQsaUJBQU4sQ0FBd0JnQixDQUF4QixLQUNLc0MsTUFBTTZCLCtCQUFOLENBQXNDcEYsSUFBdEMsSUFDQXVELE1BQU1JLDBCQUFOLENBQWlDM0QsSUFBakMsRUFDRUMsaUJBREYsQ0FDb0JnQixDQURwQixDQUZMO0FBSUQ7QUFDRjtBQUNGO0FBQ0Y7QUFDRjtBQUNGLENBakZNIiwiZmlsZSI6ImhobW0tdXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBnbW1VdGlscyBmcm9tICcuL2dtbS11dGlscyc7XG5cbi8qKlxuICogIGZ1bmN0aW9ucyB1c2VkIGZvciBkZWNvZGluZywgdHJhbnNsYXRlZCBmcm9tIFhNTVxuICovXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICAgYXMgaW4geG1tSG1tU2luZ2xlQ2xhc3MuY3BwICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGhtbVJlZ3Jlc3Npb24gPSAob2JzSW4sIG0sIG1SZXMpID0+IHtcbiAgY29uc3QgZGltID0gbS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5kaW1lbnNpb247XG4gIGNvbnN0IGRpbUluID0gbS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5kaW1lbnNpb25faW5wdXQ7XG4gIGNvbnN0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG4gIGxldCBvdXRDb3ZhclNpemU7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAobS5zdGF0ZXNbMF0uY29tcG9uZW50c1swXS5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dDtcbiAgfVxuXG4gIG1SZXMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgbVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICB9XG4gIG1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gIH1cblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsaWtlbGllc3RcbiAgaWYgKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMikge1xuICAgIGdtbVV0aWxzLmdtbUxpa2VsaWhvb2QoXG4gICAgICBvYnNJbixcbiAgICAgIG0uc3RhdGVzW21SZXMubGlrZWxpZXN0X3N0YXRlXSxcbiAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbbVJlcy5saWtlbGllc3Rfc3RhdGVdXG4gICAgKTtcbiAgICBnbW1VdGlscy5nbW1SZWdyZXNzaW9uKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1ttUmVzLmxpa2VsaWVzdF9zdGF0ZV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0X3N0YXRlXVxuICAgICk7XG4gICAgbVJlcy5vdXRwdXRfdmFsdWVzXG4gICAgICA9IG0uc3RhdGVzW21SZXMubGlrZWxpZXN0X3N0YXRlXS5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGNsaXBNaW5TdGF0ZSA9IChtLnBhcmFtZXRlcnMucmVncmVzc2lvbl9lc3RpbWF0b3IgPT0gMClcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gd2luZG93ZWRcbiAgICAgICAgICAgICAgICAgICAgOiBtUmVzLndpbmRvd19taW5pbmRleDtcblxuICBjb25zdCBjbGlwTWF4U3RhdGUgPSAobS5wYXJhbWV0ZXJzLnJlZ3Jlc3Npb25fZXN0aW1hdG9yID09IDApXG4gICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICAgICAgICAgICAgICA/IG0uc3RhdGVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gd2luZG93ZWRcbiAgICAgICAgICAgICAgICAgICAgOiBtUmVzLndpbmRvd19tYXhpbmRleDtcblxuICBsZXQgbm9ybUNvbnN0YW50ID0gKG0ucGFyYW1ldGVycy5yZWdyZXNzaW9uX2VzdGltYXRvciA9PSAwKVxuICAgICAgICAgICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICAgICAgICAgICAgPyAxLjBcbiAgICAgICAgICAgICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHdpbmRvd2VkXG4gICAgICAgICAgICAgICAgICAgIDogbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcblxuICBpZiAobm9ybUNvbnN0YW50IDw9IDAuMCkge1xuICAgIG5vcm1Db25zdGFudCA9IDEuO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IGNsaXBNaW5TdGF0ZTsgaSA8IGNsaXBNYXhTdGF0ZTsgaSsrKSB7XG4gICAgZ21tVXRpbHMuZ21tTGlrZWxpaG9vZChcbiAgICAgIG9ic0luLFxuICAgICAgbS5zdGF0ZXNbaV0sXG4gICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgKTtcbiAgICBnbW1VdGlscy5nbW1SZWdyZXNzaW9uKFxuICAgICAgb2JzSW4sXG4gICAgICBtLnN0YXRlc1tpXSxcbiAgICAgIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICApO1xuICAgIGNvbnN0IHRtcFByZWRpY3RlZE91dHB1dFxuICAgICAgPSBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG5cbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IGRpbU91dDsgZCsrKSB7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICAgICAgaWYgKG1SZXMuaGllcmFyY2hpY2FsKSB7XG4gICAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tkXVxuICAgICAgICAgICs9IChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICB0bXBQcmVkaWN0ZWRPdXRwdXRbZF0gLyBub3JtQ29uc3RhbnQ7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICBpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyKyspIHtcbiAgICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXVxuICAgICAgICAgICAgICArPSAobVJlcy5hbHBoYV9oWzBdW2ldICsgbVJlcy5hbHBoYV9oWzFdW2ldKSAqXG4gICAgICAgICAgICAgICAgIChtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV0pICpcbiAgICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZCAqIGRpbU91dCArIGQyXSAvXG4gICAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICAgIH1cbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICAgKz0gKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgICAgKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgKlxuICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldXG4gICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2RdIC9cbiAgICAgICAgICAgICAgbm9ybUNvbnN0YW50O1xuICAgICAgICB9XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2RdICs9IG1SZXMuYWxwaGFbaV0gKiBcbiAgICAgICAgICAgICAgICAgICAgIHRtcFByZWRpY3RlZE91dHB1dFtkXSAvIG5vcm1Db25zdGFudDtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgIGlmIChtLnBhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgICAgZm9yIChsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIrKykge1xuICAgICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdXG4gICAgICAgICAgICAgICs9ICBtUmVzLmFscGhhW2ldICogbVJlcy5hbHBoYVtpXSAqXG4gICAgICAgICAgICAgICAgbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXVxuICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl0gL1xuICAgICAgICAgICAgICAgIG5vcm1Db25zdGFudDtcbiAgICAgICAgICB9XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdICs9IG1SZXMuYWxwaGFbaV0gKiBtUmVzLmFscGhhW2ldICpcbiAgICAgICAgICAgICAgICAgICAgICAgICBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2VbZF0gL1xuICAgICAgICAgICAgICAgICAgICAgICAgIG5vcm1Db25zdGFudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaG1tRm9yd2FyZEluaXQgPSAob2JzSW4sIG0sIG1SZXMsIG9ic091dCA9IFtdKSA9PiB7XG4gIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICBsZXQgbm9ybUNvbnN0ID0gMC4wO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXJnb2RpYyAgICAgICAgXG4gIGlmIChtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuc3RhdGVzOyBpKyspIHtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsICAgICAgICBcbiAgICAgIGlmIChtLnN0YXRlc1tpXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcbiAgICAgICAgaWYgKG9ic091dC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgbVJlcy5hbHBoYVtpXSA9IG0ucHJpb3JbaV0gKlxuICAgICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNPdXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1tpXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5hbHBoYVtpXSA9IG0ucHJpb3JbaV0gKlxuICAgICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYklucHV0KG9ic0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2ldKTtcbiAgICAgICAgfVxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWwgICAgICAgIFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5hbHBoYVtpXSA9IG0ucHJpb3JbaV0gKlxuICAgICAgICAgICAgICAgIGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2ldKTtcbiAgICAgIH1cbiAgICAgIG5vcm1Db25zdCArPSBtUmVzLmFscGhhW2ldO1xuICAgIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsZWZ0LXJpZ2h0ICAgICAgICBcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1SZXMuYWxwaGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIG1SZXMuYWxwaGFbaV0gPSAwLjA7XG4gICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWwgICAgICAgIFxuICAgIGlmIChtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcbiAgICAgIGlmIChvYnNPdXQubGVuZ3RoID4gMCkge1xuICAgICAgICBtUmVzLmFscGhhWzBdID0gZ21tVXRpbHMuZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JzT3V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzWzBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYWxwaGFbMF0gPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzWzBdKTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsICAgICAgICBcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5hbHBoYVswXSA9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzWzBdKTtcbiAgICB9XG4gICAgbm9ybUNvbnN0ICs9IG1SZXMuYWxwaGFbMF07XG4gIH1cblxuICBpZiAobm9ybUNvbnN0ID4gMCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgICBtUmVzLmFscGhhW2ldIC89IG5vcm1Db25zdDtcbiAgICB9XG4gICAgcmV0dXJuICgxLjAgLyBub3JtQ29uc3QpO1xuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgICBtUmVzLmFscGhhW2ldID0gMS4wIC8gbnN0YXRlcztcbiAgICB9XG4gICAgcmV0dXJuIDEuMDtcbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaG1tRm9yd2FyZFVwZGF0ZSA9IChvYnNJbiwgbSwgbVJlcywgb2JzT3V0ID0gW10pID0+IHtcbiAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gIGxldCBub3JtQ29uc3QgPSAwLjA7XG5cbiAgbVJlcy5wcmV2aW91c19hbHBoYSA9IG1SZXMuYWxwaGEuc2xpY2UoMCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgbVJlcy5hbHBoYVtpXSA9IDA7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXJnb2RpY1xuICAgIGlmIChtLnBhcmFtZXRlcnMudHJhbnNpdGlvbl9tb2RlID09PSAwKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5zdGF0ZXM7IGorKykge1xuICAgICAgICBtUmVzLmFscGhhW2ldICs9IG1SZXMucHJldmlvdXNfYWxwaGFbal0gKlxuICAgICAgICAgICAgICAgICBtUmVzLnRyYW5zaXRpb25baiAqIG5zdGF0ZXMrIGldO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxlZnQtcmlnaHRcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5hbHBoYVtpXSArPSBtUmVzLnByZXZpb3VzX2FscGhhW2ldICogbVJlcy50cmFuc2l0aW9uW2kgKiAyXTtcbiAgICAgIGlmIChpID4gMCkge1xuICAgICAgICBtUmVzLmFscGhhW2ldICs9IG1SZXMucHJldmlvdXNfYWxwaGFbaSAtIDFdICpcbiAgICAgICAgICAgICAgICAgbVJlcy50cmFuc2l0aW9uWyhpIC0gMSkgKiAyICsgMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhWzBdICs9IG1SZXMucHJldmlvdXNfYWxwaGFbbnN0YXRlcyAtIDFdICpcbiAgICAgICAgICAgICAgICAgbVJlcy50cmFuc2l0aW9uW25zdGF0ZXMgKiAyIC0gMV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbCAgICAgICAgXG4gICAgaWYgKG0uc3RhdGVzW2ldLmNvbXBvbmVudHNbMF0uYmltb2RhbCkge1xuICAgICAgaWYgKG9ic091dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIG1SZXMuYWxwaGFbaV0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNPdXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnN0YXRlc1tpXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhW2ldICo9IGdtbVV0aWxzLmdtbU9ic1Byb2JJbnB1dChvYnNJbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc3RhdGVzW2ldKTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsICAgICAgICBcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5hbHBoYVtpXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iKG9ic0luLCBtLnN0YXRlc1tpXSk7XG4gICAgfVxuICAgIG5vcm1Db25zdCArPSBtUmVzLmFscGhhW2ldO1xuICB9XG5cbiAgaWYgKG5vcm1Db25zdCA+IDFlLTMwMCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgICBtUmVzLmFscGhhW2ldIC89IG5vcm1Db25zdDtcbiAgICB9XG4gICAgcmV0dXJuICgxLjAgLyBub3JtQ29uc3QpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAwLjA7XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbVVwZGF0ZUFscGhhV2luZG93ID0gKG0sIG1SZXMpID0+IHtcbiAgY29uc3QgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG4gIFxuICBtUmVzLmxpa2VsaWVzdF9zdGF0ZSA9IDA7XG5cbiAgbGV0IGJlc3RfYWxwaGE7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICBpZiAobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkge1xuICAgIGJlc3RfYWxwaGEgPSBtUmVzLmFscGhhX2hbMF1bMF0gKyBtUmVzLmFscGhhX2hbMV1bMF07XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICB9IGVsc2Uge1xuICAgIGJlc3RfYWxwaGEgPSBtUmVzLmFscGhhWzBdOyBcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgbnN0YXRlczsgaSsrKSB7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICAgIGlmIChtLnBhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgICBpZiAoKG1SZXMuYWxwaGFfaFswXVtpXSArIG1SZXMuYWxwaGFfaFsxXVtpXSkgPiBiZXN0X2FscGhhKSB7XG4gICAgICAgIGJlc3RfYWxwaGEgPSBtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV07XG4gICAgICAgIG1SZXMubGlrZWxpZXN0X3N0YXRlID0gaTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBub24taGllcmFyY2hpY2FsICAgICAgICBcbiAgICB9IGVsc2Uge1xuICAgICAgaWYobVJlcy5hbHBoYVtpXSA+IGJlc3RfYWxwaGEpIHtcbiAgICAgICAgYmVzdF9hbHBoYSA9IG1SZXMuYWxwaGFbMF07XG4gICAgICAgIG1SZXMubGlrZWxpZXN0X3N0YXRlID0gaTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBtUmVzLndpbmRvd19taW5pbmRleCA9IG1SZXMubGlrZWxpZXN0X3N0YXRlIC0gTWF0aC5mbG9vcihuc3RhdGVzIC8gMik7XG4gIG1SZXMud2luZG93X21heGluZGV4ID0gbVJlcy5saWtlbGllc3Rfc3RhdGUgKyBNYXRoLmZsb29yKG5zdGF0ZXMgLyAyKTtcbiAgbVJlcy53aW5kb3dfbWluaW5kZXggPSAobVJlcy53aW5kb3dfbWluaW5kZXggPj0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgPyBtUmVzLndpbmRvd19taW5pbmRleFxuICAgICAgICAgICAgICAgICAgICAgICA6IDA7XG4gIG1SZXMud2luZG93X21heGluZGV4ID0gKG1SZXMud2luZG93X21heGluZGV4IDw9IG5zdGF0ZXMpXG4gICAgICAgICAgICAgICAgICAgICAgID8gbVJlcy53aW5kb3dfbWF4aW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgOiBuc3RhdGVzO1xuICBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50ID0gMDtcbiAgZm9yIChsZXQgaSA9IG1SZXMud2luZG93X21pbmluZGV4OyBpIDwgbVJlcy53aW5kb3dfbWF4aW5kZXg7IGkrKykge1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcbiAgICBpZiAobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkge1xuICAgICAgbVJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudCArPVxuICAgICAgICBtUmVzLmFscGhhX2hbMF1baV0gKyBtUmVzLmFscGhhX2hbMV1baV07XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbm9uLWhpZXJhcmNoaWNhbFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50ICs9XG4gICAgICAgIG1SZXMuYWxwaGFbaV07XG4gICAgfVxuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBobW1VcGRhdGVSZXN1bHRzID0gKG0sIG1SZXMpID0+IHtcbiAgLy8gSVMgVEhJUyBDT1JSRUNUICA/IFRPRE8gOiBDSEVDSyBBR0FJTiAoc2VlbXMgdG8gaGF2ZSBwcmVjaXNpb24gaXNzdWVzKVxuICAvLyBBSEEgISA6IE5PUk1BTExZIExJS0VMSUhPT0RfQlVGRkVSIElTIENJUkNVTEFSIDogSVMgSVQgVEhFIENBU0UgSEVSRSA/XG4gIC8vIFNIT1VMRCBJIFwiUE9QX0ZST05UXCIgPyAoc2VlbXMgdGhhdCB5ZXMpXG5cbiAgLy9yZXMubGlrZWxpaG9vZF9idWZmZXIucHVzaChNYXRoLmxvZyhyZXMuaW5zdGFudF9saWtlbGlob29kKSk7XG5cbiAgLy8gTk9XIFRISVMgSVMgQkVUVEVSIChTSE9VTEQgV09SSyBBUyBJTlRFTkRFRClcbiAgY29uc3QgYnVmU2l6ZSA9IG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW21SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhdXG4gICAgPSBNYXRoLmxvZyhtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCk7XG4gIC8vIGluY3JlbWVudCBjaXJjdWxhciBidWZmZXIgaW5kZXhcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleFxuICAgID0gKG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXggKyAxKSAlIGJ1ZlNpemU7XG5cbiAgbVJlcy5sb2dfbGlrZWxpaG9vZCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmU2l6ZTsgaSsrKSB7XG4gICAgbVJlcy5sb2dfbGlrZWxpaG9vZCArPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW2ldO1xuICB9XG4gIG1SZXMubG9nX2xpa2VsaWhvb2QgLz0gYnVmU2l6ZTtcblxuICBtUmVzLnByb2dyZXNzID0gMDtcbiAgZm9yIChsZXQgaSA9IG1SZXMud2luZG93X21pbmluZGV4OyBpIDwgbVJlcy53aW5kb3dfbWF4aW5kZXg7IGkrKykge1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoaWVyYXJjaGljYWxcbiAgICBpZiAobS5wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCkge1xuICAgICAgbVJlcy5wcm9ncmVzc1xuICAgICAgICArPSAoXG4gICAgICAgICAgICBtUmVzLmFscGhhX2hbMF1baV0gK1xuICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzFdW2ldICtcbiAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsyXVtpXVxuICAgICAgICAgICkgKlxuICAgICAgICAgIGkgLyBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50O1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbiBoaWVyYXJjaGljYWxcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5wcm9ncmVzcyArPSBtUmVzLmFscGhhW2ldICpcbiAgICAgICAgICAgICAgIGkgLyBtUmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50O1xuICAgIH1cbiAgfVxuXG4gIG1SZXMucHJvZ3Jlc3MgLz0gKG0ucGFyYW1ldGVycy5zdGF0ZXMgLSAxKTtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGhtbUZpbHRlciA9IChvYnNJbiwgbSwgbVJlcykgPT4ge1xuICBsZXQgY3QgPSAwLjA7XG4gIGlmIChtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQpIHtcbiAgICBjdCA9IGhtbUZvcndhcmRVcGRhdGUob2JzSW4sIG0sIG1SZXMpO1xuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbVJlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGg7IGorKykge1xuICAgICAgbVJlcy5saWtlbGlob29kX2J1ZmZlcltqXSA9IDAuMDtcbiAgICB9XG4gICAgY3QgPSBobW1Gb3J3YXJkSW5pdChvYnNJbiwgbSwgbVJlcyk7XG4gICAgbVJlcy5mb3J3YXJkX2luaXRpYWxpemVkID0gdHJ1ZTtcbiAgfVxuXG4gIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gMS4wIC8gY3Q7XG4gIGhtbVVwZGF0ZUFscGhhV2luZG93KG0sIG1SZXMpO1xuICBobW1VcGRhdGVSZXN1bHRzKG0sIG1SZXMpO1xuXG4gIGlmIChtLnN0YXRlc1swXS5jb21wb25lbnRzWzBdLmJpbW9kYWwpIHtcbiAgICBobW1SZWdyZXNzaW9uKG9ic0luLCBtLCBtUmVzKTtcbiAgfVxuXG4gIHJldHVybiBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcbn07XG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyAgIGFzIGluIHhtbUhpZXJhcmNoaWNhbEhtbS5jcHAgICAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5leHBvcnQgY29uc3QgaGhtbUxpa2VsaWhvb2RBbHBoYSA9IChleGl0TnVtLCBsaWtlbGlob29kVmVjLCBobSwgaG1SZXMpID0+IHtcbiAgaWYgKGV4aXROdW0gPCAwKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxpa2VsaWhvb2RWZWNbaV0gPSAwO1xuICAgICAgZm9yIChsZXQgZXhpdCA9IDA7IGV4aXQgPCAzOyBleGl0KyspIHtcbiAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBobS5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7IGsrKykge1xuICAgICAgICAgIGxpa2VsaWhvb2RWZWNbaV1cbiAgICAgICAgICAgICs9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZXhpdF1ba107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxpa2VsaWhvb2RWZWNbaV0gPSAwO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBobS5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7IGsrKykge1xuICAgICAgICBsaWtlbGlob29kVmVjW2ldXG4gICAgICAgICAgKz0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtleGl0TnVtXVtrXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBGT1JXQVJEIElOSVRcblxuZXhwb3J0IGNvbnN0IGhobW1Gb3J3YXJkSW5pdCA9IChvYnNJbiwgaG0sIGhtUmVzKSA9PiB7XG4gIGxldCBub3JtX2NvbnN0ID0gMDtcblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IGluaXRpYWxpemUgYWxwaGFzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICBjb25zdCBtID0gaG0ubW9kZWxzW2ldO1xuICAgIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICAgIGNvbnN0IG1SZXMgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICBtUmVzLmFscGhhX2hbal0gPSBuZXcgQXJyYXkobnN0YXRlcyk7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICBtUmVzLmFscGhhX2hbal1ba10gPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVyZ29kaWNcbiAgICBpZiAobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PSAwKSB7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWxcbiAgICAgICAgaWYgKGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcbiAgICAgICAgICBtUmVzLmFscGhhX2hbMF1ba10gPSBtLnByaW9yW2tdICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sIG0uc3RhdGVzW2tdKTtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2tdID0gbS5wcmlvcltrXSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNba10pO1xuICAgICAgICB9XG4gICAgICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kICs9IG1SZXMuYWxwaGFfaFswXVtrXTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsZWZ0LXJpZ2h0XG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMuYWxwaGFfaFswXVswXSA9IGhtLnByaW9yW2ldO1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWxcbiAgICAgIGlmIChobS5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG4gICAgICAgIG1SZXMuYWxwaGFfaFswXVswXSAqPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sIG0uc3RhdGVzWzBdKTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmFscGhhX2hbMF1bMF0gKj0gZ21tVXRpbHMuZ21tT2JzUHJvYihvYnNJbiwgbS5zdGF0ZXNbMF0pO1xuICAgICAgfVxuICAgICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSBtUmVzLmFscGhhX2hbMF1bMF07XG4gICAgfVxuICAgIG5vcm1fY29uc3QgKz0gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBub3JtYWxpemUgYWxwaGFzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICBjb25zdCBuc3RhdGVzID0gaG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzO1xuICAgIGZvciAobGV0IGUgPSAwOyBlIDwgMzsgZSsrKSB7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5zdGF0ZXM7IGsrKykge1xuICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oW2VdW2tdIC89IG5vcm1fY29uc3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaG1SZXMuZm9yd2FyZF9pbml0aWFsaXplZCA9IHRydWU7XG59O1xuXG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IEZPUldBUkQgVVBEQVRFXG5cbmV4cG9ydCBjb25zdCBoaG1tRm9yd2FyZFVwZGF0ZSA9IChvYnNJbiwgaG0sIGhtUmVzKSA9PiB7XG4gIGNvbnN0IG5tb2RlbHMgPSBobS5tb2RlbHMubGVuZ3RoO1xuXG4gIGxldCBub3JtX2NvbnN0ID0gMDtcbiAgbGV0IHRtcCA9IDA7XG4gIGxldCBmcm9udDsgLy8gYXJyYXlcblxuICBoaG1tTGlrZWxpaG9vZEFscGhhKDEsIGhtUmVzLmZyb250aWVyX3YxLCBobSwgaG1SZXMpO1xuICBoaG1tTGlrZWxpaG9vZEFscGhhKDIsIGhtUmVzLmZyb250aWVyX3YyLCBobSwgaG1SZXMpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm1vZGVsczsgaSsrKSB7XG5cbiAgICBjb25zdCBtID0gaG0ubW9kZWxzW2ldO1xuICAgIGNvbnN0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuICAgIGNvbnN0IG1SZXMgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXTtcbiAgICBcbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09IGNvbXB1dGUgZnJvbnRpZXIgdmFyaWFibGVcbiAgICBmcm9udCA9IG5ldyBBcnJheShuc3RhdGVzKTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5zdGF0ZXM7IGorKykge1xuICAgICAgZnJvbnRbal0gPSAwO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVyZ29kaWNcbiAgICBpZiAobS5wYXJhbWV0ZXJzLnRyYW5zaXRpb25fbW9kZSA9PSAwKSB7IC8vIGVyZ29kaWNcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnN0YXRlczsgaisrKSB7XG4gICAgICAgICAgZnJvbnRba10gKz0gbS50cmFuc2l0aW9uW2ogKiBuc3RhdGVzICsga10gL1xuICAgICAgICAgICAgICAgICgxIC0gbS5leGl0UHJvYmFiaWxpdGllc1tqXSkgKlxuICAgICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFswXVtqXTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBzcmNpID0gMDsgc3JjaSA8IG5tb2RlbHM7IHNyY2krKykge1xuICAgICAgICAgIGZyb250W2tdICs9IG0ucHJpb3Jba10gKlxuICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgIGhtUmVzLmZyb250aWVyX3YxW3NyY2ldICpcbiAgICAgICAgICAgICAgICAgIGhtLnRyYW5zaXRpb25bc3JjaV1baV1cbiAgICAgICAgICAgICAgICAgICsgaG1SZXMuZnJvbnRpZXJfdjJbc3JjaV0gKlxuICAgICAgICAgICAgICAgICAgaG0ucHJpb3JbaV1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGVmdC1yaWdodFxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBrID09IDAgOiBmaXJzdCBzdGF0ZSBvZiB0aGUgcHJpbWl0aXZlXG4gICAgICBmcm9udFswXSA9IG0udHJhbnNpdGlvblswXSAqIG1SZXMuYWxwaGFfaFswXVswXTtcblxuICAgICAgZm9yIChsZXQgc3JjaSA9IDA7IHNyY2kgPCBubW9kZWxzOyBzcmNpKyspIHtcbiAgICAgICAgZnJvbnRbMF0gKz0gaG1SZXMuZnJvbnRpZXJfdjFbc3JjaV0gKlxuICAgICAgICAgICAgICBobS50cmFuc2l0aW9uW3NyY2ldW2ldXG4gICAgICAgICAgICAgICsgaG1SZXMuZnJvbnRpZXJfdjJbc3JjaV0gKlxuICAgICAgICAgICAgICBobS5wcmlvcltpXTtcbiAgICAgIH1cblxuICAgICAgLy8gayA+IDAgOiByZXN0IG9mIHRoZSBwcmltaXRpdmVcbiAgICAgIGZvciAobGV0IGsgPSAxOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICAgIGZyb250W2tdICs9IG0udHJhbnNpdGlvbltrICogMl0gL1xuICAgICAgICAgICAgICAoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNba10pICpcbiAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2tdO1xuICAgICAgICBmcm9udFtrXSArPSBtLnRyYW5zaXRpb25bKGsgLSAxKSAqIDIgKyAxXSAvXG4gICAgICAgICAgICAgICgxIC0gbS5leGl0UHJvYmFiaWxpdGllc1trIC0gMV0pICpcbiAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzBdW2sgLSAxXTtcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgICBtUmVzLmFscGhhX2hbal1ba10gPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vY29uc29sZS5sb2coZnJvbnQpO1xuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09IHVwZGF0ZSBmb3J3YXJkIHZhcmlhYmxlXG4gICAgbVJlcy5leGl0X2xpa2VsaWhvb2QgPSAwO1xuICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gMDtcblxuICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbnN0YXRlczsgaysrKSB7XG4gICAgICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgICAgICB0bXAgPSBnbW1VdGlscy5nbW1PYnNQcm9iSW5wdXQob2JzSW4sIG0uc3RhdGVzW2tdKSAqXG4gICAgICAgICAgICBmcm9udFtrXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRtcCA9IGdtbVV0aWxzLmdtbU9ic1Byb2Iob2JzSW4sIG0uc3RhdGVzW2tdKSAqIGZyb250W2tdO1xuICAgICAgfVxuXG4gICAgICBtUmVzLmFscGhhX2hbMl1ba10gPSBobS5leGl0X3RyYW5zaXRpb25baV0gKlxuICAgICAgICAgICAgICAgICBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdICogdG1wO1xuICAgICAgbVJlcy5hbHBoYV9oWzFdW2tdID0gKDEgLSBobS5leGl0X3RyYW5zaXRpb25baV0pICpcbiAgICAgICAgICAgICAgICAgbS5leGl0UHJvYmFiaWxpdGllc1trXSAqIHRtcDtcbiAgICAgIG1SZXMuYWxwaGFfaFswXVtrXSA9ICgxIC0gbS5leGl0UHJvYmFiaWxpdGllc1trXSkgKiB0bXA7XG5cbiAgICAgIG1SZXMuZXhpdF9saWtlbGlob29kICs9IG1SZXMuYWxwaGFfaFsxXVtrXSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtUmVzLmFscGhhX2hbMl1ba107XG4gICAgICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCArPSBtUmVzLmFscGhhX2hbMF1ba10gK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbVJlcy5hbHBoYV9oWzFdW2tdICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1SZXMuYWxwaGFfaFsyXVtrXTtcblxuICAgICAgbm9ybV9jb25zdCArPSB0bXA7XG4gICAgfVxuXG4gICAgbVJlcy5leGl0X3JhdGlvID0gbVJlcy5leGl0X2xpa2VsaWhvb2QgLyBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IG5vcm1hbGl6ZSBhbHBoYXNcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBubW9kZWxzOyBpKyspIHtcbiAgICBmb3IgKGxldCBlID0gMDsgZSA8IDM7IGUrKykge1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBobS5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7IGsrKykge1xuICAgICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oW2VdW2tdIC89IG5vcm1fY29uc3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBoaG1tVXBkYXRlUmVzdWx0cyA9IChobSwgaG1SZXMpID0+IHtcbiAgbGV0IG1heGxvZ19saWtlbGlob29kID0gMDtcbiAgbGV0IG5vcm1jb25zdF9pbnN0YW50ID0gMDtcbiAgbGV0IG5vcm1jb25zdF9zbW9vdGhlZCA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBobS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblxuICAgIGxldCBtUmVzID0gaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV07XG5cbiAgICBobVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldID0gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG4gICAgaG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldID0gbVJlcy5sb2dfbGlrZWxpaG9vZDtcbiAgICBobVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXSA9IE1hdGguZXhwKGhtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSk7XG5cbiAgICBobVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSBobVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldO1xuICAgIGhtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSBobVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXTtcblxuICAgIG5vcm1jb25zdF9pbnN0YW50ICAgKz0gaG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuICAgIG5vcm1jb25zdF9zbW9vdGhlZCAgKz0gaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcblxuICAgIGlmIChpID09IDAgfHwgaG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldID4gbWF4bG9nX2xpa2VsaWhvb2QpIHtcbiAgICAgIG1heGxvZ19saWtlbGlob29kID0gaG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldO1xuICAgICAgaG1SZXMubGlrZWxpZXN0ID0gaTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgIGhtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAvPSBub3JtY29uc3RfaW5zdGFudDtcbiAgICBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1jb25zdF9zbW9vdGhlZDtcbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgaGhtbUZpbHRlciA9IChvYnNJbiwgaG0sIGhtUmVzKSA9PiB7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhpZXJhcmNoaWNhbFxuICBpZiAoaG0uY29uZmlndXJhdGlvbi5kZWZhdWx0X3BhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgaWYgKGhtUmVzLmZvcndhcmRfaW5pdGlhbGl6ZWQpIHtcbiAgICAgIGhobW1Gb3J3YXJkVXBkYXRlKG9ic0luLCBobSwgaG1SZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaG1tRm9yd2FyZEluaXQob2JzSW4sIGhtLCBobVJlcyk7XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG5vbi1oaWVyYXJjaGljYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgaG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXSA9IGhtbUZpbHRlcihvYnNJbiwgaG0sIGhtUmVzKTtcbiAgICB9XG4gIH1cblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tIGNvbXB1dGUgdGltZSBwcm9ncmVzc2lvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGhtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgIGhtbVVwZGF0ZUFscGhhV2luZG93KFxuICAgICAgaG0ubW9kZWxzW2ldLFxuICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICApO1xuICAgIGhtbVVwZGF0ZVJlc3VsdHMoXG4gICAgICBobS5tb2RlbHNbaV0sXG4gICAgICBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXVxuICAgICk7XG4gIH1cblxuICBoaG1tVXBkYXRlUmVzdWx0cyhobSwgaG1SZXMpO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICBpZiAoaG0uc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgIGNvbnN0IGRpbSA9IGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmRpbWVuc2lvbjtcbiAgICBjb25zdCBkaW1JbiA9IGhtLnNoYXJlZF9wYXJhbWV0ZXJzLmRpbWVuc2lvbl9pbnB1dDtcbiAgICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBobW1SZWdyZXNzaW9uKG9ic0luLCBobS5tb2RlbHNbaV0sIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGlrZWxpZXN0XG4gICAgaWYgKGhtLmNvbmZpZ3VyYXRpb24ubXVsdGlDbGFzc19yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMCkge1xuICAgICAgaG1SZXMub3V0cHV0X3ZhbHVlc1xuICAgICAgICA9IGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2htUmVzLmxpa2VsaWVzdF1cbiAgICAgICAgICAgICAgIC5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuICAgICAgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2VcbiAgICAgICAgPSBobVJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tobVJlcy5saWtlbGllc3RdXG4gICAgICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2Uuc2xpY2UoMCk7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbWl4dHVyZVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhtUmVzLm91dHB1dF92YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgICAgICBobVJlcy5vdXRwdXRfdmFsdWVzW2RdXG4gICAgICAgICAgICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcbiAgICAgICAgICAgICAgIGhtUmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLm91dHB1dF92YWx1ZXNbZF07XG5cbiAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgaWYgKGhtLmNvbmZpZ3VyYXRpb24uY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMiArKykge1xuICAgICAgICAgICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVtkICogZGltT3V0ICsgZDJdXG4gICAgICAgICAgICAgICAgKz0gaG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAqXG4gICAgICAgICAgICAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlW2QgKiBkaW1PdXQgKyBkMl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBobVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICAgICArPSBobVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldICpcbiAgICAgICAgICAgICAgICAgaG1SZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV1cbiAgICAgICAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZVtkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG4iXX0=