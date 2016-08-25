/**
 *  functions used for decoding, translated from XMM
 */

// TODO : write methods for generating modelResults object

// get the inverse_covariances matrix of each of the GMM classes
// for each input data, compute the distance of the frame to each of the GMMs
// with the following equations :

// ================================= //
// as in xmmGaussianDistribution.cpp //
// ================================= //


// from xmmGaussianDistribution::regression
export const gmmComponentRegression = (obsIn, predictOut, c) => {
// export const gmmComponentRegression = (obsIn, predictOut, component) => {
//   const c = component;
  const dim = c.dimension;
  const dimIn = c.dimension_input;
  const dimOut = dim - dimIn;
  //let predictedOut = [];
  predictOut = new Array(dimOut);

  //----------------------------------------------------------------------- full
  if (c.covariance_mode === 0) {
    for (let d = 0; d < dimOut; d++) {
      predictOut[d] = c.mean[dimIn + d];
      for (let e = 0; e < dimIn; e++) {
        let tmp = 0.0;
        for (let f = 0; f < dimIn; f++) {
          tmp += c.inverse_covariance_input[e * dimIn + f] *
               (obsIn[f] - c.mean[f]);
        }
        predictOut[d] += c.covariance[(d + dimIn) * dim + e] * tmp;
      }
    }
  //------------------------------------------------------------------- diagonal
  } else {
    for (let d = 0; d < dimOut; d++) {
      predictOut[d] = c.covariance[d + dimIn];
    }
  }
  //return predictionOut;
};


export const gmmComponentLikelihood = (obsIn, c) => {
// export const gmmComponentLikelihood = (obsIn, component) => {
//   const c = component;
  // if(c.covariance_determinant === 0) {
  //  return undefined;
  // }
  let euclidianDistance = 0.0;

  //----------------------------------------------------------------------- full
  if (c.covariance_mode === 0) {
    for (let l = 0; l < c.dimension; l++) {
      let tmp = 0.0;
      for (let k = 0; k < c.dimension; k++) {
        tmp += c.inverse_covariance[l * c.dimension + k]
          * (obsIn[k] - c.mean[k]);
      }
      euclidianDistance += (obsIn[l] - c.mean[l]) * tmp;
    }
  //------------------------------------------------------------------- diagonal
  } else {
    for (let l = 0; l < c.dimension; l++) {
      euclidianDistance += c.inverse_covariance[l] *
                 (obsIn[l] - c.mean[l]) *
                 (obsIn[l] - c.mean[l]);
    }
  }

  let p = Math.exp(-0.5 * euclidianDistance) /
      Math.sqrt(
        c.covariance_determinant *
        Math.pow(2 * Math.PI, c.dimension)
      );

  if (p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
    p = 1e-180;
  }
  return p;
};


export const gmmComponentLikelihoodInput = (obsIn, c) => {
// export const gmmComponentLikelihoodInput = (obsIn, component) => {
//   const c = component;
  // if(c.covariance_determinant === 0) {
  //  return undefined;
  // }
  let euclidianDistance = 0.0;
  //----------------------------------------------------------------------- full
  if (c.covariance_mode === 0) {
    for (let l = 0; l < c.dimension_input; l++) {
      let tmp = 0.0;
      for (let k = 0; k < c.dimension_input; k++) {
        tmp += c.inverse_covariance_input[l * c.dimension_input + k] *
             (obsIn[k] - c.mean[k]);
      }
      euclidianDistance += (obsIn[l] - c.mean[l]) * tmp;
    }
  //------------------------------------------------------------------- diagonal
  } else {
    for (let l = 0; l < c.dimension_input; l++) {
      // or would it be c.inverse_covariance_input[l] ?
      // sounds logic ... but, according to Jules (cf e-mail),
      // not really important.
      euclidianDistance += c.inverse_covariance_input[l] *
                 (obsIn[l] - c.mean[l]) *
                 (obsIn[l] - c.mean[l]);
    }
  }

  let p = Math.exp(-0.5 * euclidianDistance) /
      Math.sqrt(
        c.covariance_determinant_input *
        Math.pow(2 * Math.PI, c.dimension_input)
      );

  if (p < 1e-180 ||isNaN(p) || isNaN(Math.abs(p))) {
    p = 1e-180;
  }
  return p;
};


export const gmmComponentLikelihoodBimodal = (obsIn, obsOut, c) => {
// export const gmmComponentLikelihoodBimodal = (obsIn, obsOut, component) => {
//   const c = component;
  // if(c.covariance_determinant === 0) {
  //  return undefined;
  // }
  const dim = c.dimension;
  const dimIn = c.dimension_input;
  const dimOut = dim - dimIn;
  let euclidianDistance = 0.0;

  //----------------------------------------------------------------------- full
  if (c.covariance_mode === 0) {
    for (let l = 0; l < dim; l++) {
      let tmp = 0.0;
      for (let k = 0; k < c.dimension_input; k++) {
        tmp += c.inverse_covariance[l * dim + k] *
             (obsIn[k] - c.mean[k]);
      }
      for (let k =  0; k < dimOut; k++) {
        tmp += c.inverse_covariance[l * dim + dimIn + k] *
             (obsOut[k] - c.mean[dimIn +k]);
      }
      if (l < dimIn) {
        euclidianDistance += (obsIn[l] - c.mean[l]) * tmp;
      } else {
        euclidianDistance += (obsOut[l - dimIn] - c.mean[l]) *
                   tmp;
      }
    }
  //------------------------------------------------------------------- diagonal
  } else {
    for (let l = 0; l < dimIn; l++) {
      euclidianDistance += c.inverse_covariance[l] *
                 (obsIn[l] - c.mean[l]) *
                 (obsIn[l] - c.mean[l]);
    }
    for (let l = c.dimension_input; l < c.dimension; l++) {
      let sq = (obsOut[l - dimIn] - c.mean[l]) *
           (obsOut[l - dimIn] - c.mean[l]);
      euclidianDistance += c.inverse_covariance[l] * sq;
    }
  }

  let p = Math.exp(-0.5 * euclidianDistance) /
      Math.sqrt(
        c.covariance_determinant *
        Math.pow(2 * Math.PI, c.dimension)
      );

  if (p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
    p = 1e-180;
  }
  return p;
};


// ================================= //
//    as in xmmGmmSingleClass.cpp    //
// ================================= //

export const gmmRegression = (obsIn, m, mRes) => {
// export const gmmRegression = (obsIn, singleGmm, singleGmmRes) => {
//   const m = singleGmm;
//   const mRes = singleGmmResults;

  const dim = m.components[0].dimension;
  const dimIn = m.components[0].dimension_input;
  const dimOut = dim - dimIn;

  mRes.output_values = new Array(dimOut);
  for (let i = 0; i < dimOut; i++) {
    mRes.output_values[i] = 0.0;
  }

  let outCovarSize;
  //----------------------------------------------------------------------- full
  if (m.parameters.covariance_mode === 0) {
    outCovarSize = dimOut * dimOut;
  //------------------------------------------------------------------- diagonal
  } else {
    outCovarSize = dimOut;
  }
  mRes.output_covariance = new Array(outCovarSize);
  for (let i = 0; i < outCovarSize; i++) {
    mRes.output_covariance[i] = 0.0;
  }

  /*
  // useless : reinstanciated in gmmComponentRegression
  let tmpPredictedOutput = new Array(dimOut);
  for (let i = 0; i < dimOut; i++) {
    tmpPredictedOutput[i] = 0.0;
  }
  */
  let tmpPredictedOutput;

  for (let c = 0; c < m.components.length; c++) {
    gmmComponentRegression(
      obsIn, tmpPredictedOutput, m.components[c]
    );
    let sqbeta = mRes.beta[c] * mRes.beta[c];
    for (let d = 0; d < dimOut; d++) {
      mRes.output_values[d] += mRes.beta[c] * tmpPredictedOutput[d];
      //------------------------------------------------------------------- full
      if (m.parameters.covariance_mode === 0) {
        for (let d2 = 0; d2 < dimOut; d2++) {
          let index = d * dimOut + d2;
          mRes.output_covariance[index]
            += sqbeta * m.components[c].output_covariance[index];
        }
      //--------------------------------------------------------------- diagonal
      } else {
        mRes.output_covariance[d]
          += sqbeta * m.components[c].output_covariance[d];
      }
    }
  }
};


export const gmmObsProb = (obsIn, singleGmm, component = -1) => {
  const coeffs = singleGmm.mixture_coeffs;
  //console.log(coeffs);
  //if(coeffs === undefined) coeffs = [1];
  const components = singleGmm.components;
  let p = 0.0;

  if (component < 0) {
    for (let c = 0; c < components.length; c++) {
      p += gmmObsProb(obsIn, singleGmm, c);
    }
  } else {
    p = coeffs[component] *
      gmmComponentLikelihood(obsIn, components[component]);       
  }
  return p;
};


export const gmmObsProbInput = (obsIn, singleGmm, component = -1) => {
  const coeffs = singleGmm.mixture_coeffs;
  const components = singleGmm.components;
  let p = 0.0;

  if (component < 0) {
    for(let c = 0; c < components.length; c++) {
      p += gmmObsProbInput(obsIn, singleGmm, c);
    }
  } else {
    p = coeffs[component] *
      gmmComponentLikelihoodInput(obsIn, components[component]);      
  }
  return p;
};


export const gmmObsProbBimodal = (obsIn, obsOut, singleGmm, component = -1) => {
  const coeffs = singleGmm.mixture_coeffs;
  const components = singleGmm.components;
  let p = 0.0;

  if (component < 0) {
    for (let c = 0; c < components.length; c++) {
      p += gmmObsProbBimodal(obsIn, obsOut, singleGmm, c);
    }
  } else {
    p = coeffs[component] *
      gmmComponentLikelihoodBimodal(obsIn, obsOut, components[component]);
  }
  return p;
};


export const gmmLikelihood = (obsIn, singleGmm, singleGmmRes, obsOut = []) => {
  const coeffs = singleGmm.mixture_coeffs;
  const components = singleGmm.components;
  const mRes = singleGmmRes;
  let likelihood = 0.0;
  
  for (let c = 0; c < components.length; c++) {
    //------------------------------------------------------------------ bimodal
    if (singleClassGmmModel.components[c].bimodal) {
      if (obsOut.length === 0) {
        mRes.beta[c]
          = gmmObsProbInput(obsIn, singleGmm, c);
      } else {
        mRes.beta[c]
          = gmmObsProbBimodal(obsIn, obsOut, singleGmm, c);
      }
    //----------------------------------------------------------------- unimodal
    } else {
      mRes.beta[c] = gmmObsProb(obsIn, singleGmm, c);
    }
    likelihood += mRes.beta[c];
  }
  for (let c = 0; c < coeffs.length; c++) {
    mRes.beta[c] /= likelihood;
  }

  mRes.instant_likelihood = likelihood;

  // as in xmm::SingleClassGMM::updateResults :
  // ------------------------------------------
  //res.likelihood_buffer.unshift(likelihood);
  //res.likelihood_buffer.length--;
  // THIS IS BETTER (circular buffer)
  mRes.likelihood_buffer[mRes.likelihood_buffer_index] = likelihood;
  mRes.likelihood_buffer_index
    = (mRes.likelihood_buffer_index + 1) % mRes.likelihood_buffer.length;
  // sum all array values :
  mRes.log_likelihood = mRes.likelihood_buffer.reduce((a, b) => a + b, 0);
  mRes.log_likelihood /= mRes.likelihood_buffer.length;

  return likelihood;
};


// ================================= //
//          as in xmmGmm.cpp         //
// ================================= //

export const gmmFilter = (obsIn, gmm, gmmRes) => {
  let likelihoods = [];
  const models = gmm.models;
  const mRes = gmmRes;

  let maxLogLikelihood = 0;
  let normConstInstant = 0;
  let normConstSmoothed = 0;

  for (let i = 0; i < models.length; i++) {
    let singleRes = mRes.singleClassGmmModelResults[i];
    mRes.instant_likelihoods[i]
      = gmmLikelihood(obsIn, models[i], singleRes);

    // as in xmm::GMM::updateResults :
    // -------------------------------
    mRes.smoothed_log_likelihoods[i] = singleRes.log_likelihood;
    mRes.smoothed_likelihoods[i]
      = Math.exp(mRes.smoothed_log_likelihoods[i]);
    mRes.instant_normalized_likelihoods[i] = mRes.instant_likelihoods[i];
    mRes.smoothed_normalized_likelihoods[i] = mRes.smoothed_likelihoods[i];

    normConstInstant += mRes.instant_normalized_likelihoods[i];
    normConstSmoothed += mRes.smoothed_normalized_likelihoods[i];

    if (i == 0 || mRes.smoothed_log_likelihoods[i] > maxLogLikelihood) {
      maxLogLikelihood = mRes.smoothed_log_likelihoods[i];
      mRes.likeliest = i;
    }
  }

  for (let i = 0; i < models.length; i++) {
    mRes.instant_normalized_likelihoods[i] /= normConstInstant;
    mRes.smoothed_normalized_likelihoods[i] /= normConstSmoothed;
  }

  // if model is bimodal :
  // ---------------------
  const params = gmm.shared_parameters;
  const config = gmm.configuration;

  if (params.bimodal) {
    let dim = params.dimension;
    let dimIn = params.dimension_input;
    let dimOut = dim - dimIn;

    //---------------------------------------------------------------- likeliest
    if (config.multiClass_regression_estimator === 0) {
      mRes.output_values
        = mRes.singleClassModelResults[mRes.likeliest]
            .output_values;
      mRes.output_covariance
        = mRes.singleClassModelResults[mRes.likeliest]
            .output_covariance;           
    //------------------------------------------------------------------ mixture
    } else {
      // zero-fill output_values and output_covariance
      mRes.output_values = new Array(dimOut);
      for (let i = 0; i < dimOut; i++) {
        mRes.output_values[i] = 0.0;
      }

      let outCovarSize;
      //------------------------------------------------------------------- full
      if (config.default_parameters.covariance_mode == 0) {
        outCovarSize = dimOut * dimOut;
      //--------------------------------------------------------------- diagonal
      } else {
        outCovarSize = dimOut;
      }
      mRes.output_covariance = new Array(outCovarSize);
      for (let i = 0; i < outCovarSize; i++) {
        mRes.output_covariance[i] = 0.0;
      }

      // compute the actual values :
      for (let i = 0; i < models.length; i++) {
        let smoothNormLikelihood
          = mRes.smoothed_normalized_likelihoods[i];
        let singleRes = mRes.singleClassGmmModelResults[i];
        for (let d = 0; d < dimOut; i++) {
          mRes.output_values[d] += smoothNormLikelihood *
                       singleRes.output_values[d];
          //--------------------------------------------------------------- full
          if (config.default_parameters.covariance_mode === 0) {
            for (let d2 = 0; d2 < dimOut; d2++) {
              let index = d * dimOut + d2;
              mRes.output_covariance[index]
                += smoothNormLikelihood *
                   singleRes.output_covariance[index];
            }
          //----------------------------------------------------------- diagonal
          } else {
            mRes.output_covariance[d]
              += smoothNormLikelihood *
                 singleRes.output_covariance[d];
          }
        }
      }
    }
  } /* end if(params.bimodal) */
};
