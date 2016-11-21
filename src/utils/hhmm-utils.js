import * as gmmUtils from './gmm-utils';

/**
 *  functions used for decoding, translated from XMM
 */

// ================================= //
//    as in xmmHmmSingleClass.cpp    //
// ================================= //

export const hmmRegression = (obsIn, m, mRes) => {
  const dim = m.states[0].components[0].dimension;
  const dimIn = m.states[0].components[0].dimension_input;
  const dimOut = dim - dimIn;

  let outCovarSize;
  //----------------------------------------------------------------------- full
  if (m.states[0].components[0].covariance_mode === 0) {
    outCovarSize = dimOut * dimOut;
  //------------------------------------------------------------------- diagonal
  } else {
    outCovarSize = dimOut;
  }

  mRes.output_values = new Array(dimOut);
  for (let i = 0; i < dimOut; i++) {
    mRes.output_values[i] = 0.0;
  }
  mRes.output_covariance = new Array(outCovarSize);
  for (let i = 0; i < outCovarSize; i++) {
    mRes.output_covariance[i] = 0.0;
  }

  //------------------------------------------------------------------ likeliest
  if (m.parameters.regression_estimator === 2) {
    gmmUtils.gmmLikelihood(
      obsIn,
      m.states[mRes.likeliest_state],
      mRes.singleClassGmmModelResults[mRes.likeliest_state]
    );
    gmmUtils.gmmRegression(
      obsIn,
      m.states[mRes.likeliest_state],
      mRes.singleClassGmmModelResults[mRes.likeliest_state]
    );
    mRes.output_values
      = m.states[mRes.likeliest_state].output_values.slice(0);
    return;
  }

  const clipMinState = (m.parameters.regression_estimator == 0)
                    //----------------------------------------------------- full
                    ? 0
                    //------------------------------------------------- windowed
                    : mRes.window_minindex;

  const clipMaxState = (m.parameters.regression_estimator == 0)
                    //----------------------------------------------------- full
                    ? m.states.length
                    //------------------------------------------------- windowed
                    : mRes.window_maxindex;

  let normConstant = (m.parameters.regression_estimator == 0)
                    //----------------------------------------------------- full
                    ? 1.0
                    //------------------------------------------------- windowed
                    : mRes.window_normalization_constant;

  if (normConstant <= 0.0) {
    normConstant = 1.;
  }

  for (let i = clipMinState; i < clipMaxState; i++) {
    gmmUtils.gmmLikelihood(
      obsIn,
      m.states[i],
      mRes.singleClassGmmModelResults[i]
    );
    gmmUtils.gmmRegression(
      obsIn,
      m.states[i],
      mRes.singleClassGmmModelResults[i]
    );
    const tmpPredictedOutput
      = mRes.singleClassGmmModelResults[i].output_values.slice(0);

    for (let d = 0; d < dimOut; d++) {
      //----------------------------------------------------------- hierarchical
      if (mRes.hierarchical) {
        mRes.output_values[d]
          += (mRes.alpha_h[0][i] + mRes.alpha_h[1][i]) *
             tmpPredictedOutput[d] / normConstant;
        //----------------------------------------------------------------- full
        if (m.parameters.covariance_mode === 0) {
          for (let d2 = 0; d2 < dimOut; d2++) {
            mRes.output_covariance[d * dimOut + d2]
              += (mRes.alpha_h[0][i] + mRes.alpha_h[1][i]) *
                 (mRes.alpha_h[0][i] + mRes.alpha_h[1][i]) *
                mRes.singleClassGmmModelResults[i]
                  .output_covariance[d * dimOut + d2] /
                normConstant;
          }
        //------------------------------------------------------------- diagonal
        } else {
          mRes.output_covariance[d]
            += (mRes.alpha_h[0][i] + mRes.alpha_h[1][i]) *
               (mRes.alpha_h[0][i] + mRes.alpha_h[1][i]) *
              mRes.singleClassGmmModelResults[i]
                .output_covariance[d] /
              normConstant;
        }
      //------------------------------------------------------- non-hierarchical
      } else {
        mRes.output_values[d] += mRes.alpha[i] * 
                     tmpPredictedOutput[d] / normConstant;
        //----------------------------------------------------------------- full
        if (m.parameters.covariance_mode === 0) {
          for (let d2 = 0; d2 < dimOut; d2++) {
            mRes.output_covariance[d * dimOut + d2]
              +=  mRes.alpha[i] * mRes.alpha[i] *
                mRes.singleClassGmmModelResults[i]
                  .output_covariance[d * dimOut + d2] /
                normConstant;
          }
        //----------------------------------------------------- diagonal
        } else {
          mRes.output_covariance[d] += mRes.alpha[i] * mRes.alpha[i] *
                         mRes.singleClassGmmModelResults
                           .output_covariance[d] /
                         normConstant;
        }
      }
    }
  }
};


export const hmmForwardInit = (obsIn, m, mRes, obsOut = []) => {
  const nstates = m.parameters.states;
  let normConst = 0.0;

  //-------------------------------------------------------------------- ergodic        
  if (m.parameters.transition_mode === 0) {
    for (let i = 0; i < nstates; i++) {
      //---------------------------------------------------------------- bimodal        
      if (m.states[i].components[0].bimodal) {
        if (obsOut.length > 0) {
          mRes.alpha[i] = m.prior[i] *
                  gmmUtils.gmmObsProbBimodal(obsIn,
                                 obsOut,
                                 m.states[i]);
        } else {
          mRes.alpha[i] = m.prior[i] *
                  gmmUtils.gmmObsProbInput(obsIn,
                               m.states[i]);
        }
      //--------------------------------------------------------------- unimodal        
      } else {
        mRes.alpha[i] = m.prior[i] *
                gmmUtils.gmmObsProb(obsIn, m.states[i]);
      }
      normConst += mRes.alpha[i];
    }
  //----------------------------------------------------------------- left-right        
  } else {
    for (let i = 0; i < mRes.alpha.length; i++) {
      mRes.alpha[i] = 0.0;
    }
    //------------------------------------------------------------------ bimodal        
    if (m.states[0].components[0].bimodal) {
      if (obsOut.length > 0) {
        mRes.alpha[0] = gmmUtils.gmmObsProbBimodal(obsIn,
                               obsOut,
                               m.states[0]);
      } else {
        mRes.alpha[0] = gmmUtils.gmmObsProbInput(obsIn,
                             m.states[0]);
      }
    //----------------------------------------------------------------- unimodal        
    } else {
      mRes.alpha[0] = gmmUtils.gmmObsProb(obsIn, m.states[0]);
    }
    normConst += mRes.alpha[0];
  }

  if (normConst > 0) {
    for (let i = 0; i < nstates; i++) {
      mRes.alpha[i] /= normConst;
    }
    return (1.0 / normConst);
  } else {
    for (let i = 0; i < nstates; i++) {
      mRes.alpha[i] = 1.0 / nstates;
    }
    return 1.0;
  }
};


export const hmmForwardUpdate = (obsIn, m, mRes, obsOut = []) => {
  const nstates = m.parameters.states;
  let normConst = 0.0;

  mRes.previous_alpha = mRes.alpha.slice(0);
  for (let i = 0; i < nstates; i++) {
    mRes.alpha[i] = 0;
    //------------------------------------------------------------------ ergodic
    if (m.parameters.transition_mode === 0) {
      for (let j = 0; j < nstates; j++) {
        mRes.alpha[i] += mRes.previous_alpha[j] *
                 mRes.transition[j * nstates+ i];
      }
    //--------------------------------------------------------------- left-right
    } else {
      mRes.alpha[i] += mRes.previous_alpha[i] * mRes.transition[i * 2];
      if (i > 0) {
        mRes.alpha[i] += mRes.previous_alpha[i - 1] *
                 mRes.transition[(i - 1) * 2 + 1];
      } else {
        mRes.alpha[0] += mRes.previous_alpha[nstates - 1] *
                 mRes.transition[nstates * 2 - 1];
      }
    }

    //------------------------------------------------------------------ bimodal        
    if (m.states[i].components[0].bimodal) {
      if (obsOut.length > 0) {
        mRes.alpha[i] *= gmmUtils.gmmObsProbBimodal(obsIn,
                              obsOut,
                              m.states[i]);
      } else {
        mRes.alpha[i] *= gmmUtils.gmmObsProbInput(obsIn,
                              m.states[i]);
      }
    //----------------------------------------------------------------- unimodal        
    } else {
      mRes.alpha[i] *= gmmUtils.gmmObsProb(obsIn, m.states[i]);
    }
    normConst += mRes.alpha[i];
  }

  if (normConst > 1e-300) {
    for (let i = 0; i < nstates; i++) {
      mRes.alpha[i] /= normConst;
    }
    return (1.0 / normConst);
  } else {
    return 0.0;
  }
};


export const hmmUpdateAlphaWindow = (m, mRes) => {
  const nstates = m.parameters.states;
  
  mRes.likeliest_state = 0;

  let best_alpha;
  //--------------------------------------------------------------- hierarchical
  if (m.parameters.hierarchical) {
    best_alpha = mRes.alpha_h[0][0] + mRes.alpha_h[1][0];
  //----------------------------------------------------------- non-hierarchical
  } else {
    best_alpha = mRes.alpha[0]; 
  }

  for (let i = 1; i < nstates; i++) {
    //------------------------------------------------------------- hierarchical
    if (m.parameters.hierarchical) {
      if ((mRes.alpha_h[0][i] + mRes.alpha_h[1][i]) > best_alpha) {
        best_alpha = mRes.alpha_h[0][i] + mRes.alpha_h[1][i];
        mRes.likeliest_state = i;
      }
    //--------------------------------------------------------- non-hierarchical        
    } else {
      if(mRes.alpha[i] > best_alpha) {
        best_alpha = mRes.alpha[0];
        mRes.likeliest_state = i;
      }
    }
  }

  mRes.window_minindex = mRes.likeliest_state - Math.floor(nstates / 2);
  mRes.window_maxindex = mRes.likeliest_state + Math.floor(nstates / 2);
  mRes.window_minindex = (mRes.window_minindex >= 0)
                       ? mRes.window_minindex
                       : 0;
  mRes.window_maxindex = (mRes.window_maxindex <= nstates)
                       ? mRes.window_maxindex
                       : nstates;
  mRes.window_normalization_constant = 0;
  for (let i = mRes.window_minindex; i < mRes.window_maxindex; i++) {
    //------------------------------------------------------------- hierarchical
    if (m.parameters.hierarchical) {
      mRes.window_normalization_constant +=
        mRes.alpha_h[0][i] + mRes.alpha_h[1][i];
    //--------------------------------------------------------- non-hierarchical
    } else {
      mRes.window_normalization_constant +=
        mRes.alpha[i];
    }
  }
};


export const hmmUpdateResults = (m, mRes) => {
  // IS THIS CORRECT  ? TODO : CHECK AGAIN (seems to have precision issues)
  // AHA ! : NORMALLY LIKELIHOOD_BUFFER IS CIRCULAR : IS IT THE CASE HERE ?
  // SHOULD I "POP_FRONT" ? (seems that yes)

  //res.likelihood_buffer.push(Math.log(res.instant_likelihood));

  // NOW THIS IS BETTER (SHOULD WORK AS INTENDED)
  const bufSize = mRes.likelihood_buffer.length;
  mRes.likelihood_buffer[mRes.likelihood_buffer_index]
    = Math.log(mRes.instant_likelihood);
  // increment circular buffer index
  mRes.likelihood_buffer_index
    = (mRes.likelihood_buffer_index + 1) % bufSize;

  mRes.log_likelihood = 0;
  for (let i = 0; i < bufSize; i++) {
    mRes.log_likelihood += mRes.likelihood_buffer[i];
  }
  mRes.log_likelihood /= bufSize;

  mRes.progress = 0;
  for (let i = mRes.window_minindex; i < mRes.window_maxindex; i++) {
    //------------------------------------------------------------- hierarchical
    if (m.parameters.hierarchical) {
      mRes.progress
        += (
            mRes.alpha_h[0][i] +
            mRes.alpha_h[1][i] +
            mRes.alpha_h[2][i]
          ) *
          i / mRes.window_normalization_constant;
    //--------------------------------------------------------- non hierarchical
    } else {
      mRes.progress += mRes.alpha[i] *
               i / mRes.window_normalization_constant;
    }
  }

  mRes.progress /= (m.parameters.states - 1);
};


export const hmmFilter = (obsIn, m, mRes) => {
  let ct = 0.0;
  if (mRes.forward_initialized) {
    ct = hmmForwardUpdate(obsIn, m, mRes);
  } else {
    for (let j = 0; j < mRes.likelihood_buffer.length; j++) {
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

export const hhmmLikelihoodAlpha = (exitNum, likelihoodVec, hm, hmRes) => {
  if (exitNum < 0) {
    for (let i = 0; i < hm.models.length; i++) {
      likelihoodVec[i] = 0;
      for (let exit = 0; exit < 3; exit++) {
        for (let k = 0; k < hm.models[i].parameters.states; k++) {
          likelihoodVec[i]
            += hmRes.singleClassHmmModelResults[i].alpha_h[exit][k];
        }
      }
    }
  } else {
    for (let i = 0; i < hm.models.length; i++) {
      likelihoodVec[i] = 0;
      for (let k = 0; k < hm.models[i].parameters.states; k++) {
        likelihoodVec[i]
          += hmRes.singleClassHmmModelResults[i].alpha_h[exitNum][k];
      }
    }
  }
};


//============================================ FORWARD INIT

export const hhmmForwardInit = (obsIn, hm, hmRes) => {
  let norm_const = 0;

  //=================================== initialize alphas
  for (let i = 0; i < hm.models.length; i++) {

    const m = hm.models[i];
    const nstates = m.parameters.states;
    const mRes = hmRes.singleClassHmmModelResults[i];

    for (let j = 0; j < 3; j++) {
      mRes.alpha_h[j] = new Array(nstates);
      for (let k = 0; k < nstates; k++) {
        mRes.alpha_h[j][k] = 0;
      }
    }

    //------------------------------------------------------------------ ergodic
    if (m.parameters.transition_mode == 0) {
      for (let k = 0; k < nstates; k++) {
        //-------------------------------------------------------------- bimodal
        if (hm.shared_parameters.bimodal) {
          mRes.alpha_h[0][k] = m.prior[k] *
                               gmmUtils.gmmObsProbInput(obsIn, m.states[k]);
        //------------------------------------------------------------- unimodal
        } else {
          mRes.alpha_h[0][k] = m.prior[k] *
                               gmmUtils.gmmObsProb(obsIn, m.states[k]);
        }
        mRes.instant_likelihood += mRes.alpha_h[0][k];
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
  for (let i = 0; i < hm.models.length; i++) {

    const nstates = hm.models[i].parameters.states;
    for (let e = 0; e < 3; e++) {
      for (let k = 0; k < nstates; k++) {
        hmRes.singleClassHmmModelResults[i].alpha_h[e][k] /= norm_const;
      }
    }
  }

  hmRes.forward_initialized = true;
};


//========================================== FORWARD UPDATE

export const hhmmForwardUpdate = (obsIn, hm, hmRes) => {
  const nmodels = hm.models.length;

  let norm_const = 0;
  let tmp = 0;
  let front; // array

  hhmmLikelihoodAlpha(1, hmRes.frontier_v1, hm, hmRes);
  hhmmLikelihoodAlpha(2, hmRes.frontier_v2, hm, hmRes);

  for (let i = 0; i < nmodels; i++) {

    const m = hm.models[i];
    const nstates = m.parameters.states;
    const mRes = hmRes.singleClassHmmModelResults[i];
    
    //======================= compute frontier variable
    front = new Array(nstates);
    for (let j = 0; j < nstates; j++) {
      front[j] = 0;
    }

    //------------------------------------------------------------------ ergodic
    if (m.parameters.transition_mode == 0) { // ergodic
      for (let k = 0; k < nstates; k++) {
        for (let j = 0; j < nstates; j++) {
          front[k] += m.transition[j * nstates + k] /
                (1 - m.exitProbabilities[j]) *
                mRes.alpha_h[0][j];
        }
        for (let srci = 0; srci < nmodels; srci++) {
          front[k] += m.prior[k] *
                (
                  hmRes.frontier_v1[srci] *
                  hm.transition[srci][i]
                  + hmRes.frontier_v2[srci] *
                  hm.prior[i]
                );
        }
      }
    //--------------------------------------------------------------- left-right
    } else {
      // k == 0 : first state of the primitive
      front[0] = m.transition[0] * mRes.alpha_h[0][0];

      for (let srci = 0; srci < nmodels; srci++) {
        front[0] += hmRes.frontier_v1[srci] *
              hm.transition[srci][i]
              + hmRes.frontier_v2[srci] *
              hm.prior[i];
      }

      // k > 0 : rest of the primitive
      for (let k = 1; k < nstates; k++) {
        front[k] += m.transition[k * 2] /
              (1 - m.exitProbabilities[k]) *
              mRes.alpha_h[0][k];
        front[k] += m.transition[(k - 1) * 2 + 1] /
              (1 - m.exitProbabilities[k - 1]) *
              mRes.alpha_h[0][k - 1];
      }

      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < nstates; k++) {
          mRes.alpha_h[j][k] = 0;
        }
      }
    }
    //console.log(front);

    //========================= update forward variable
    mRes.exit_likelihood = 0;
    mRes.instant_likelihood = 0;

    for (let k = 0; k < nstates; k++) {
      if (hm.shared_parameters.bimodal) {
        tmp = gmmUtils.gmmObsProbInput(obsIn, m.states[k]) *
            front[k];
      } else {
        tmp = gmmUtils.gmmObsProb(obsIn, m.states[k]) * front[k];
      }

      mRes.alpha_h[2][k] = hm.exit_transition[i] *
                 m.exitProbabilities[k] * tmp;
      mRes.alpha_h[1][k] = (1 - hm.exit_transition[i]) *
                 m.exitProbabilities[k] * tmp;
      mRes.alpha_h[0][k] = (1 - m.exitProbabilities[k]) * tmp;

      mRes.exit_likelihood += mRes.alpha_h[1][k] +
                              mRes.alpha_h[2][k];
      mRes.instant_likelihood += mRes.alpha_h[0][k] +
                                 mRes.alpha_h[1][k] +
                                 mRes.alpha_h[2][k];

      norm_const += tmp;
    }

    mRes.exit_ratio = mRes.exit_likelihood / mRes.instant_likelihood;
  }

  //==================================== normalize alphas
  for (let i = 0; i < nmodels; i++) {
    for (let e = 0; e < 3; e++) {
      for (let k = 0; k < hm.models[i].parameters.states; k++) {
        hmRes.singleClassHmmModelResults[i].alpha_h[e][k] /= norm_const;
      }
    }
  }
};


export const hhmmUpdateResults = (hm, hmRes) => {
  let maxlog_likelihood = 0;
  let normconst_instant = 0;
  let normconst_smoothed = 0;

  for (let i = 0; i < hm.models.length; i++) {

    let mRes = hmRes.singleClassHmmModelResults[i];

    hmRes.instant_likelihoods[i] = mRes.instant_likelihood;
    hmRes.smoothed_log_likelihoods[i] = mRes.log_likelihood;
    hmRes.smoothed_likelihoods[i] = Math.exp(hmRes.smoothed_log_likelihoods[i]);

    hmRes.instant_normalized_likelihoods[i] = hmRes.instant_likelihoods[i];
    hmRes.smoothed_normalized_likelihoods[i] = hmRes.smoothed_likelihoods[i];

    normconst_instant   += hmRes.instant_normalized_likelihoods[i];
    normconst_smoothed  += hmRes.smoothed_normalized_likelihoods[i];

    if (i == 0 || hmRes.smoothed_log_likelihoods[i] > maxlog_likelihood) {
      maxlog_likelihood = hmRes.smoothed_log_likelihoods[i];
      hmRes.likeliest = i;
    }
  }

  for (let i = 0; i < hm.models.length; i++) {
    hmRes.instant_normalized_likelihoods[i] /= normconst_instant;
    hmRes.smoothed_normalized_likelihoods[i] /= normconst_smoothed;
  }
};


export const hhmmFilter = (obsIn, hm, hmRes) => {
  //--------------------------------------------------------------- hierarchical
  if (hm.configuration.default_parameters.hierarchical) {
    if (hmRes.forward_initialized) {
      hhmmForwardUpdate(obsIn, hm, hmRes);
    } else {
      hhmmForwardInit(obsIn, hm, hmRes);
    }
  //----------------------------------------------------------- non-hierarchical
  } else {
    for (let i = 0; i < hm.models.length; i++) {
      hmRes.instant_likelihoods[i] = hmmFilter(obsIn, hm, hmRes);
    }
  }

  //----------------- compute time progression
  for (let i = 0; i < hm.models.length; i++) {
    hmmUpdateAlphaWindow(
      hm.models[i],
      hmRes.singleClassHmmModelResults[i]
    );
    hmmUpdateResults(
      hm.models[i],
      hmRes.singleClassHmmModelResults[i]
    );
  }

  hhmmUpdateResults(hm, hmRes);

  //-------------------------------------------------------------------- bimodal
  if (hm.shared_parameters.bimodal) {
    const dim = hm.shared_parameters.dimension;
    const dimIn = hm.shared_parameters.dimension_input;
    const dimOut = dim - dimIn;

    for (let i = 0; i < hm.models.length; i++) {
      hmmRegression(obsIn, hm.models[i], hmRes.singleClassHmmModelResults[i]);
    }

    //---------------------------------------------------------------- likeliest
    if (hm.configuration.multiClass_regression_estimator === 0) {
      hmRes.output_values
        = hmRes.singleClassHmmModelResults[hmRes.likeliest]
               .output_values.slice(0);
      hmRes.output_covariance
        = hmRes.singleClassHmmModelResults[hmRes.likeliest]
               .output_covariance.slice(0);
    //------------------------------------------------------------------ mixture
    } else {
      for (let i = 0; i < hmRes.output_values.length; i++) {
        hmRes.output_values[i] = 0.0;
      }
      for (let i = 0; i < hmRes.output_covariance.length; i++) {
        hmRes.output_covariance[i] = 0.0;
      }

      for (let i = 0; i < hm.models.length; i++) {
        for (let d = 0; d < dimOut; d++) {
          hmRes.output_values[d]
            += hmRes.smoothed_normalized_likelihoods[i] *
               hmRes.singleClassHmmModelResults[i].output_values[d];

          //--------------------------------------------------------------- full
          if (hm.configuration.covariance_mode === 0) {
            for (let d2 = 0; d2 < dimOut; d2 ++) {
              hmRes.output_covariance[d * dimOut + d2]
                += hmRes.smoothed_normalized_likelihoods[i] *
                   hmRes.singleClassHmmModelResults[i]
                    .output_covariance[d * dimOut + d2];
            }
          //----------------------------------------------------------- diagonal
          } else {
            hmRes.output_covariance[d]
              += hmRes.smoothed_normalized_likelihoods[i] *
                 hmRes.singleClassHmmModelResults[i]
                  .output_covariance[d];
          }
        }
      }
    }
  }
};
