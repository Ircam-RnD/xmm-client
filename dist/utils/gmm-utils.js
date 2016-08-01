"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
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
var gmmComponentRegression = exports.gmmComponentRegression = function gmmComponentRegression(obsIn, predictOut, c) {
  // export const gmmComponentRegression = (obsIn, predictOut, component) => {
  //   const c = component;
  var dim = c.dimension;
  var dimIn = c.dimension_input;
  var dimOut = dim - dimIn;
  //let predictedOut = [];
  predictOut = new Array(dimOut);

  //----------------------------------------------------------------------- full
  if (c.covariance_mode === 0) {
    for (var d = 0; d < dimOut; d++) {
      predictOut[d] = c.mean[dimIn + d];
      for (var e = 0; e < dimIn; e++) {
        var tmp = 0.0;
        for (var f = 0; f < dimIn; f++) {
          tmp += c.inverse_covariance_input[e * dimIn + f] * (obsIn[f] - c.mean[f]);
        }
        predictOut[d] += c.covariance[(d + dimIn) * dim + e] * tmp;
      }
    }
    //------------------------------------------------------------------- diagonal
  } else {
    for (var _d = 0; _d < dimOut; _d++) {
      predictOut[_d] = c.covariance[_d + dimIn];
    }
  }
  //return predictionOut;
};

var gmmComponentLikelihood = exports.gmmComponentLikelihood = function gmmComponentLikelihood(obsIn, c) {
  // export const gmmComponentLikelihood = (obsIn, component) => {
  //   const c = component;
  // if(c.covariance_determinant === 0) {
  //  return undefined;
  // }
  var euclidianDistance = 0.0;

  //----------------------------------------------------------------------- full
  if (c.covariance_mode === 0) {
    for (var l = 0; l < c.dimension; l++) {
      var tmp = 0.0;
      for (var k = 0; k < c.dimension; k++) {
        tmp += c.inverse_covariance[l * c.dimension + k] * (obsIn[k] - c.mean[k]);
      }
      euclidianDistance += (obsIn[l] - c.mean[l]) * tmp;
    }
    //------------------------------------------------------------------- diagonal
  } else {
    for (var _l = 0; _l < c.dimension; _l++) {
      euclidianDistance += c.inverse_covariance[_l] * (obsIn[_l] - c.mean[_l]) * (obsIn[_l] - c.mean[_l]);
    }
  }

  var p = Math.exp(-0.5 * euclidianDistance) / Math.sqrt(c.covariance_determinant * Math.pow(2 * Math.PI, c.dimension));

  if (p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
    p = 1e-180;
  }
  return p;
};

var gmmComponentLikelihoodInput = exports.gmmComponentLikelihoodInput = function gmmComponentLikelihoodInput(obsIn, c) {
  // export const gmmComponentLikelihoodInput = (obsIn, component) => {
  //   const c = component;
  // if(c.covariance_determinant === 0) {
  //  return undefined;
  // }
  var euclidianDistance = 0.0;
  //----------------------------------------------------------------------- full
  if (c.covariance_mode === 0) {
    for (var l = 0; l < c.dimension_input; l++) {
      var tmp = 0.0;
      for (var k = 0; k < c.dimension_input; k++) {
        tmp += c.inverse_covariance_input[l * c.dimension_input + k] * (obsIn[k] - c.mean[k]);
      }
      euclidianDistance += (obsIn[l] - c.mean[l]) * tmp;
    }
    //------------------------------------------------------------------- diagonal
  } else {
    for (var _l2 = 0; _l2 < c.dimension_input; _l2++) {
      // or would it be c.inverse_covariance_input[l] ?
      // sounds logic ... but, according to Jules (cf e-mail),
      // not really important.
      euclidianDistance += c.inverse_covariance_input[_l2] * (obsIn[_l2] - c.mean[_l2]) * (obsIn[_l2] - c.mean[_l2]);
    }
  }

  var p = Math.exp(-0.5 * euclidianDistance) / Math.sqrt(c.covariance_determinant_input * Math.pow(2 * Math.PI, c.dimension_input));

  if (p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
    p = 1e-180;
  }
  return p;
};

var gmmComponentLikelihoodBimodal = exports.gmmComponentLikelihoodBimodal = function gmmComponentLikelihoodBimodal(obsIn, obsOut, c) {
  // export const gmmComponentLikelihoodBimodal = (obsIn, obsOut, component) => {
  //   const c = component;
  // if(c.covariance_determinant === 0) {
  //  return undefined;
  // }
  var dim = c.dimension;
  var dimIn = c.dimension_input;
  var dimOut = dim - dimIn;
  var euclidianDistance = 0.0;

  //----------------------------------------------------------------------- full
  if (c.covariance_mode === 0) {
    for (var l = 0; l < dim; l++) {
      var tmp = 0.0;
      for (var k = 0; k < c.dimension_input; k++) {
        tmp += c.inverse_covariance[l * dim + k] * (obsIn[k] - c.mean[k]);
      }
      for (var _k = 0; _k < dimOut; _k++) {
        tmp += c.inverse_covariance[l * dim + dimIn + _k] * (obsOut[_k] - c.mean[dimIn + _k]);
      }
      if (l < dimIn) {
        euclidianDistance += (obsIn[l] - c.mean[l]) * tmp;
      } else {
        euclidianDistance += (obsOut[l - dimIn] - c.mean[l]) * tmp;
      }
    }
    //------------------------------------------------------------------- diagonal
  } else {
    for (var _l3 = 0; _l3 < dimIn; _l3++) {
      euclidianDistance += c.inverse_covariance[_l3] * (obsIn[_l3] - c.mean[_l3]) * (obsIn[_l3] - c.mean[_l3]);
    }
    for (var _l4 = c.dimension_input; _l4 < c.dimension; _l4++) {
      var sq = (obsOut[_l4 - dimIn] - c.mean[_l4]) * (obsOut[_l4 - dimIn] - c.mean[_l4]);
      euclidianDistance += c.inverse_covariance[_l4] * sq;
    }
  }

  var p = Math.exp(-0.5 * euclidianDistance) / Math.sqrt(c.covariance_determinant * Math.pow(2 * Math.PI, c.dimension));

  if (p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
    p = 1e-180;
  }
  return p;
};

// ================================= //
//    as in xmmGmmSingleClass.cpp    //
// ================================= //

var gmmRegression = exports.gmmRegression = function gmmRegression(obsIn, m, mRes) {
  // export const gmmRegression = (obsIn, singleGmm, singleGmmRes) => {
  //   const m = singleGmm;
  //   const mRes = singleGmmResults;

  var dim = m.components[0].dimension;
  var dimIn = m.components[0].dimension_input;
  var dimOut = dim - dimIn;

  mRes.output_values = new Array(dimOut);
  for (var i = 0; i < dimOut; i++) {
    mRes.output_values[i] = 0.0;
  }

  var outCovarSize = void 0;
  //----------------------------------------------------------------------- full
  if (m.parameters.covariance_mode === 0) {
    outCovarSize = dimOut * dimOut;
    //------------------------------------------------------------------- diagonal
  } else {
    outCovarSize = dimOut;
  }
  mRes.output_covariance = new Array(outCovarSize);
  for (var _i = 0; _i < outCovarSize; _i++) {
    mRes.output_covariance[_i] = 0.0;
  }

  /*
  // useless : reinstanciated in gmmComponentRegression
  let tmpPredictedOutput = new Array(dimOut);
  for (let i = 0; i < dimOut; i++) {
    tmpPredictedOutput[i] = 0.0;
  }
  */
  var tmpPredictedOutput = void 0;

  for (var c = 0; c < m.components.length; c++) {
    gmmComponentRegression(obsIn, tmpPredictedOutput, m.components[c]);
    var sqbeta = mRes.beta[c] * mRes.beta[c];
    for (var d = 0; d < dimOut; d++) {
      mRes.output_values[d] += mRes.beta[c] * tmpPredictedOutput[d];
      //------------------------------------------------------------------- full
      if (m.parameters.covariance_mode === 0) {
        for (var d2 = 0; d2 < dimOut; d2++) {
          var index = d * dimOut + d2;
          mRes.output_covariance[index] += sqbeta * m.components[c].output_covariance[index];
        }
        //--------------------------------------------------------------- diagonal
      } else {
        mRes.output_covariance[d] += sqbeta * m.components[c].output_covariance[d];
      }
    }
  }
};

var gmmObsProb = exports.gmmObsProb = function gmmObsProb(obIn, singleGmm) {
  var component = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

  var coeffs = singleGmm.mixture_coeffs;
  //console.log(coeffs);
  //if(coeffs === undefined) coeffs = [1];
  var components = singleGmm.components;
  var p = 0.0;

  if (component < 0) {
    for (var c = 0; c < components.length; c++) {
      p += gmmObsProb(obsIn, singleGmm, c);
    }
  } else {
    p = coeffs[componenr] * gmmComponentLikelihood(obsIn, components[component]);
  }
  return p;
};

var gmmObsProbInput = exports.gmmObsProbInput = function gmmObsProbInput(obsIn, singleGmm) {
  var component = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

  var coeffs = singleGmm.mixture_coeffs;
  var components = singleGmm.components;
  var p = 0.0;

  if (component < 0) {
    for (var c = 0; c < components.length; c++) {
      p += gmmObsProbInput(obsIn, singleGmm, c);
    }
  } else {
    p = coeffs[component] * gmmComponentLikelihoodInput(obsIn, components[component]);
  }
  return p;
};

var gmmObsProbBimodal = exports.gmmObsProbBimodal = function gmmObsProbBimodal(obsIn, obsOut, singleGmm) {
  var component = arguments.length <= 3 || arguments[3] === undefined ? -1 : arguments[3];

  var coeffs = singleGmm.mixture_coeffs;
  var components = singleGmm.components;
  var p = 0.0;

  if (component < 0) {
    for (var c = 0; c < components.length; c++) {
      p += gmmObsProbBimodal(obsIn, obsOut, singleGmm, c);
    }
  } else {
    p = coeffs[component] * gmmComponentLikelihoodBimodal(obsIn, obsOut, components[component]);
  }
  return p;
};

var gmmLikelihood = exports.gmmLikelihood = function gmmLikelihood(obsIn, singleGmm, singleGmmRes) {
  var obsOut = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

  var coeffs = singleGmm.mixture_coeffs;
  var components = singleGmm.components;
  var mRes = singleGmmRes;
  var likelihood = 0.0;

  for (var c = 0; c < components.length; c++) {
    //------------------------------------------------------------------ bimodal
    if (singleClassGmmModel.components[c].bimodal) {
      if (obsOut.length === 0) {
        mRes.beta[c] = gmmObsProbInput(obsIn, singleGmm, c);
      } else {
        mRes.beta[c] = gmmObsProbBimodal(obsIn, obsOut, singleGmm, c);
      }
      //----------------------------------------------------------------- unimodal
    } else {
      mRes.beta[c] = gmmObsProb(obsIn, singleGmm, c);
    }
    likelihood += mRes.beta[c];
  }
  for (var _c = 0; _c < coeffs.length; _c++) {
    mRes.beta[_c] /= likelihood;
  }

  mRes.instant_likelihood = likelihood;

  // as in xmm::SingleClassGMM::updateResults :
  // ------------------------------------------
  //res.likelihood_buffer.unshift(likelihood);
  //res.likelihood_buffer.length--;
  // THIS IS BETTER (circular buffer)
  mRes.likelihood_buffer[mRes.likelihood_buffer_index] = likelihood;
  mRes.likelihood_buffer_index = (mRes.likelihood_buffer_index + 1) % mRes.likelihood_buffer.length;
  // sum all array values :
  mRes.log_likelihood = mRes.likelihood_buffer.reduce(function (a, b) {
    return a + b;
  }, 0);
  mRes.log_likelihood /= mRes.likelihood_buffer.length;

  return likelihood;
};

// ================================= //
//          as in xmmGmm.cpp         //
// ================================= //

var gmmFilter = exports.gmmFilter = function gmmFilter(obsIn, gmm, gmmRes) {
  var likelihoods = [];
  var models = gmm.models;
  var mRes = gmmRes;

  var maxLogLikelihood = 0;
  var normConstInstant = 0;
  var normConstSmoothed = 0;

  for (var i = 0; i < models.length; i++) {
    var singleRes = mRes.singleClassGmmModelResults[i];
    mRes.instant_likelihoods[i] = gmmLikelihood(obsIn, models[i], singleRes);

    // as in xmm::GMM::updateResults :
    // -------------------------------
    mRes.smoothed_log_likelihoods[i] = singleRes.log_likelihood;
    mRes.smoothed_likelihoods[i] = Math.exp(mRes.smoothed_log_likelihoods[i]);
    mRes.instant_normalized_likelihoods[i] = mRes.instant_likelihoods[i];
    mRes.smoothed_normalized_likelihoods[i] = mRes.smoothed_likelihoods[i];

    normConstInstant += mRes.instant_normalized_likelihoods[i];
    normConstSmoothed += mRes.smoothed_normalized_likelihoods[i];

    if (i == 0 || mRes.smoothed_log_likelihoods[i] > maxLogLikelihood) {
      maxLogLikelihood = mRes.smoothed_log_likelihoods[i];
      mRes.likeliest = i;
    }
  }

  for (var _i2 = 0; _i2 < models.length; _i2++) {
    mRes.instant_normalized_likelihoods[_i2] /= normConstInstant;
    mRes.smoothed_normalized_likelihoods[_i2] /= normConstSmoothed;
  }

  // if model is bimodal :
  // ---------------------
  var params = gmm.shared_parameters;
  var config = gmm.configuration;

  if (params.bimodal) {
    var dim = params.dimension;
    var dimIn = params.dimension_input;
    var dimOut = dim - dimIn;

    //---------------------------------------------------------------- likeliest
    if (config.multiClass_regression_estimator === 0) {
      mRes.output_values = mRes.singleClassModelResults[mRes.likeliest].output_values;
      mRes.output_covariance = mRes.singleClassModelResults[mRes.likeliest].output_covariance;
      //------------------------------------------------------------------ mixture
    } else {
      // zero-fill output_values and output_covariance
      mRes.output_values = new Array(dimOut);
      for (var _i3 = 0; _i3 < dimOut; _i3++) {
        mRes.output_values[_i3] = 0.0;
      }

      var outCovarSize = void 0;
      //------------------------------------------------------------------- full
      if (config.default_parameters.covariance_mode == 0) {
        outCovarSize = dimOut * dimOut;
        //--------------------------------------------------------------- diagonal
      } else {
        outCovarSize = dimOut;
      }
      mRes.output_covariance = new Array(outCovarSize);
      for (var _i4 = 0; _i4 < outCovarSize; _i4++) {
        mRes.output_covariance[_i4] = 0.0;
      }

      // compute the actual values :
      for (var _i5 = 0; _i5 < models.length; _i5++) {
        var smoothNormLikelihood = mRes.smoothed_normalized_likelihoods[_i5];
        var _singleRes = mRes.singleClassGmmModelResults[_i5];
        for (var d = 0; d < dimOut; _i5++) {
          mRes.output_values[d] += smoothNormLikelihood * _singleRes.output_values[d];
          //--------------------------------------------------------------- full
          if (config.default_parameters.covariance_mode === 0) {
            for (var d2 = 0; d2 < dimOut; d2++) {
              var index = d * dimOut + d2;
              mRes.output_covariance[index] += smoothNormLikelihood * _singleRes.output_covariance[index];
            }
            //----------------------------------------------------------- diagonal
          } else {
            mRes.output_covariance[d] += smoothNormLikelihood * _singleRes.output_covariance[d];
          }
        }
      }
    }
  } /* end if(params.bimodal) */
};
//# sourceMappingURL=data:application/json;base64,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QXVCLEtBQXZCLEtBQ0ssdUJBQ0EsV0FBVSxpQkFBVixDQUE0QixLQUE1QixDQUZMO0FBR0Q7QUFDSDtBQUNDLFdBUkQsTUFRTztBQUNMLGlCQUFLLGlCQUFMLENBQXVCLENBQXZCLEtBQ0ssdUJBQ0EsV0FBVSxpQkFBVixDQUE0QixDQUE1QixDQUZMO0FBR0Q7QUFDRjtBQUNGO0FBQ0Y7QUFDRixHQXBHOEMsQ0FvRzdDO0FBQ0gsQ0FyR00iLCJmaWxlIjoiZ21tLXV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAgZnVuY3Rpb25zIHVzZWQgZm9yIGRlY29kaW5nLCB0cmFuc2xhdGVkIGZyb20gWE1NXG4gKi9cblxuLy8gVE9ETyA6IHdyaXRlIG1ldGhvZHMgZm9yIGdlbmVyYXRpbmcgbW9kZWxSZXN1bHRzIG9iamVjdFxuXG4vLyBnZXQgdGhlIGludmVyc2VfY292YXJpYW5jZXMgbWF0cml4IG9mIGVhY2ggb2YgdGhlIEdNTSBjbGFzc2VzXG4vLyBmb3IgZWFjaCBpbnB1dCBkYXRhLCBjb21wdXRlIHRoZSBkaXN0YW5jZSBvZiB0aGUgZnJhbWUgdG8gZWFjaCBvZiB0aGUgR01Nc1xuLy8gd2l0aCB0aGUgZm9sbG93aW5nIGVxdWF0aW9ucyA6XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gYXMgaW4geG1tR2F1c3NpYW5EaXN0cmlidXRpb24uY3BwIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuXG4vLyBmcm9tIHhtbUdhdXNzaWFuRGlzdHJpYnV0aW9uOjpyZWdyZXNzaW9uXG5leHBvcnQgY29uc3QgZ21tQ29tcG9uZW50UmVncmVzc2lvbiA9IChvYnNJbiwgcHJlZGljdE91dCwgYykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudFJlZ3Jlc3Npb24gPSAob2JzSW4sIHByZWRpY3RPdXQsIGNvbXBvbmVudCkgPT4ge1xuLy8gICBjb25zdCBjID0gY29tcG9uZW50O1xuICBjb25zdCBkaW0gPSBjLmRpbWVuc2lvbjtcbiAgY29uc3QgZGltSW4gPSBjLmRpbWVuc2lvbl9pbnB1dDtcbiAgY29uc3QgZGltT3V0ID0gZGltIC0gZGltSW47XG4gIC8vbGV0IHByZWRpY3RlZE91dCA9IFtdO1xuICBwcmVkaWN0T3V0ID0gbmV3IEFycmF5KGRpbU91dCk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gIGlmIChjLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgIHByZWRpY3RPdXRbZF0gPSBjLm1lYW5bZGltSW4gKyBkXTtcbiAgICAgIGZvciAobGV0IGUgPSAwOyBlIDwgZGltSW47IGUrKykge1xuICAgICAgICBsZXQgdG1wID0gMC4wO1xuICAgICAgICBmb3IgKGxldCBmID0gMDsgZiA8IGRpbUluOyBmKyspIHtcbiAgICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VfaW5wdXRbZSAqIGRpbUluICsgZl0gKlxuICAgICAgICAgICAgICAgKG9ic0luW2ZdIC0gYy5tZWFuW2ZdKTtcbiAgICAgICAgfVxuICAgICAgICBwcmVkaWN0T3V0W2RdICs9IGMuY292YXJpYW5jZVsoZCArIGRpbUluKSAqIGRpbSArIGVdICogdG1wO1xuICAgICAgfVxuICAgIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgcHJlZGljdE91dFtkXSA9IGMuY292YXJpYW5jZVtkICsgZGltSW5dO1xuICAgIH1cbiAgfVxuICAvL3JldHVybiBwcmVkaWN0aW9uT3V0O1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tQ29tcG9uZW50TGlrZWxpaG9vZCA9IChvYnNJbiwgYykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2QgPSAob2JzSW4sIGNvbXBvbmVudCkgPT4ge1xuLy8gICBjb25zdCBjID0gY29tcG9uZW50O1xuICAvLyBpZihjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgPT09IDApIHtcbiAgLy8gIHJldHVybiB1bmRlZmluZWQ7XG4gIC8vIH1cbiAgbGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAoYy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uOyBsKyspIHtcbiAgICAgIGxldCB0bXAgPSAwLjA7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGMuZGltZW5zaW9uOyBrKyspIHtcbiAgICAgICAgdG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2wgKiBjLmRpbWVuc2lvbiArIGtdXG4gICAgICAgICAgKiAob2JzSW5ba10gLSBjLm1lYW5ba10pO1xuICAgICAgfVxuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqIHRtcDtcbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb247IGwrKykge1xuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbF0gKlxuICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKTtcbiAgICB9XG4gIH1cblxuICBsZXQgcCA9IE1hdGguZXhwKC0wLjUgKiBldWNsaWRpYW5EaXN0YW5jZSkgL1xuICAgICAgTWF0aC5zcXJ0KFxuICAgICAgICBjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgKlxuICAgICAgICBNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb24pXG4gICAgICApO1xuXG4gIGlmIChwIDwgMWUtMTgwIHx8IGlzTmFOKHApIHx8IGlzTmFOKE1hdGguYWJzKHApKSkge1xuICAgIHAgPSAxZS0xODA7XG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRMaWtlbGlob29kSW5wdXQgPSAob2JzSW4sIGMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRMaWtlbGlob29kSW5wdXQgPSAob2JzSW4sIGNvbXBvbmVudCkgPT4ge1xuLy8gICBjb25zdCBjID0gY29tcG9uZW50O1xuICAvLyBpZihjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgPT09IDApIHtcbiAgLy8gIHJldHVybiB1bmRlZmluZWQ7XG4gIC8vIH1cbiAgbGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBjLmRpbWVuc2lvbl9pbnB1dDsgbCsrKSB7XG4gICAgICBsZXQgdG1wID0gMC4wO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBjLmRpbWVuc2lvbl9pbnB1dDsgaysrKSB7XG4gICAgICAgIHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtsICogYy5kaW1lbnNpb25faW5wdXQgKyBrXSAqXG4gICAgICAgICAgICAgKG9ic0luW2tdIC0gYy5tZWFuW2tdKTtcbiAgICAgIH1cbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IChvYnNJbltsXSAtIGMubWVhbltsXSkgKiB0bXA7XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uX2lucHV0OyBsKyspIHtcbiAgICAgIC8vIG9yIHdvdWxkIGl0IGJlIGMuaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0W2xdID9cbiAgICAgIC8vIHNvdW5kcyBsb2dpYyAuLi4gYnV0LCBhY2NvcmRpbmcgdG8gSnVsZXMgKGNmIGUtbWFpbCksXG4gICAgICAvLyBub3QgcmVhbGx5IGltcG9ydGFudC5cbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0W2xdICpcbiAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgIChvYnNJbltsXSAtIGMubWVhbltsXSk7XG4gICAgfVxuICB9XG5cbiAgbGV0IHAgPSBNYXRoLmV4cCgtMC41ICogZXVjbGlkaWFuRGlzdGFuY2UpIC9cbiAgICAgIE1hdGguc3FydChcbiAgICAgICAgYy5jb3ZhcmlhbmNlX2RldGVybWluYW50X2lucHV0ICpcbiAgICAgICAgTWF0aC5wb3coMiAqIE1hdGguUEksIGMuZGltZW5zaW9uX2lucHV0KVxuICAgICAgKTtcblxuICBpZiAocCA8IDFlLTE4MCB8fGlzTmFOKHApIHx8IGlzTmFOKE1hdGguYWJzKHApKSkge1xuICAgIHAgPSAxZS0xODA7XG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRMaWtlbGlob29kQmltb2RhbCA9IChvYnNJbiwgb2JzT3V0LCBjKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgZ21tQ29tcG9uZW50TGlrZWxpaG9vZEJpbW9kYWwgPSAob2JzSW4sIG9ic091dCwgY29tcG9uZW50KSA9PiB7XG4vLyAgIGNvbnN0IGMgPSBjb21wb25lbnQ7XG4gIC8vIGlmKGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCA9PT0gMCkge1xuICAvLyAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgLy8gfVxuICBjb25zdCBkaW0gPSBjLmRpbWVuc2lvbjtcbiAgY29uc3QgZGltSW4gPSBjLmRpbWVuc2lvbl9pbnB1dDtcbiAgY29uc3QgZGltT3V0ID0gZGltIC0gZGltSW47XG4gIGxldCBldWNsaWRpYW5EaXN0YW5jZSA9IDAuMDtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBkaW07IGwrKykge1xuICAgICAgbGV0IHRtcCA9IDAuMDtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgYy5kaW1lbnNpb25faW5wdXQ7IGsrKykge1xuICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbCAqIGRpbSArIGtdICpcbiAgICAgICAgICAgICAob2JzSW5ba10gLSBjLm1lYW5ba10pO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgayA9ICAwOyBrIDwgZGltT3V0OyBrKyspIHtcbiAgICAgICAgdG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2wgKiBkaW0gKyBkaW1JbiArIGtdICpcbiAgICAgICAgICAgICAob2JzT3V0W2tdIC0gYy5tZWFuW2RpbUluICtrXSk7XG4gICAgICB9XG4gICAgICBpZiAobCA8IGRpbUluKSB7XG4gICAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IChvYnNJbltsXSAtIGMubWVhbltsXSkgKiB0bXA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSAob2JzT3V0W2wgLSBkaW1Jbl0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgICB0bXA7XG4gICAgICB9XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGRpbUluOyBsKyspIHtcbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2xdICpcbiAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgIChvYnNJbltsXSAtIGMubWVhbltsXSk7XG4gICAgfVxuICAgIGZvciAobGV0IGwgPSBjLmRpbWVuc2lvbl9pbnB1dDsgbCA8IGMuZGltZW5zaW9uOyBsKyspIHtcbiAgICAgIGxldCBzcSA9IChvYnNPdXRbbCAtIGRpbUluXSAtIGMubWVhbltsXSkgKlxuICAgICAgICAgICAob2JzT3V0W2wgLSBkaW1Jbl0gLSBjLm1lYW5bbF0pO1xuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbF0gKiBzcTtcbiAgICB9XG4gIH1cblxuICBsZXQgcCA9IE1hdGguZXhwKC0wLjUgKiBldWNsaWRpYW5EaXN0YW5jZSkgL1xuICAgICAgTWF0aC5zcXJ0KFxuICAgICAgICBjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgKlxuICAgICAgICBNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb24pXG4gICAgICApO1xuXG4gIGlmIChwIDwgMWUtMTgwIHx8IGlzTmFOKHApIHx8IGlzTmFOKE1hdGguYWJzKHApKSkge1xuICAgIHAgPSAxZS0xODA7XG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICAgYXMgaW4geG1tR21tU2luZ2xlQ2xhc3MuY3BwICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGdtbVJlZ3Jlc3Npb24gPSAob2JzSW4sIG0sIG1SZXMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBnbW1SZWdyZXNzaW9uID0gKG9ic0luLCBzaW5nbGVHbW0sIHNpbmdsZUdtbVJlcykgPT4ge1xuLy8gICBjb25zdCBtID0gc2luZ2xlR21tO1xuLy8gICBjb25zdCBtUmVzID0gc2luZ2xlR21tUmVzdWx0cztcblxuICBjb25zdCBkaW0gPSBtLmNvbXBvbmVudHNbMF0uZGltZW5zaW9uO1xuICBjb25zdCBkaW1JbiA9IG0uY29tcG9uZW50c1swXS5kaW1lbnNpb25faW5wdXQ7XG4gIGNvbnN0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG4gIG1SZXMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgbVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICB9XG5cbiAgbGV0IG91dENvdmFyU2l6ZTtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gIGlmIChtLnBhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgb3V0Q292YXJTaXplID0gZGltT3V0ICogZGltT3V0O1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQ7XG4gIH1cbiAgbVJlcy5vdXRwdXRfY292YXJpYW5jZSA9IG5ldyBBcnJheShvdXRDb3ZhclNpemUpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG91dENvdmFyU2l6ZTsgaSsrKSB7XG4gICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtpXSA9IDAuMDtcbiAgfVxuXG4gIC8qXG4gIC8vIHVzZWxlc3MgOiByZWluc3RhbmNpYXRlZCBpbiBnbW1Db21wb25lbnRSZWdyZXNzaW9uXG4gIGxldCB0bXBQcmVkaWN0ZWRPdXRwdXQgPSBuZXcgQXJyYXkoZGltT3V0KTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgIHRtcFByZWRpY3RlZE91dHB1dFtpXSA9IDAuMDtcbiAgfVxuICAqL1xuICBsZXQgdG1wUHJlZGljdGVkT3V0cHV0O1xuXG4gIGZvciAobGV0IGMgPSAwOyBjIDwgbS5jb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgZ21tQ29tcG9uZW50UmVncmVzc2lvbihcbiAgICAgIG9ic0luLCB0bXBQcmVkaWN0ZWRPdXRwdXQsIG0uY29tcG9uZW50c1tjXVxuICAgICk7XG4gICAgbGV0IHNxYmV0YSA9IG1SZXMuYmV0YVtjXSAqIG1SZXMuYmV0YVtjXTtcbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IGRpbU91dDsgZCsrKSB7XG4gICAgICBtUmVzLm91dHB1dF92YWx1ZXNbZF0gKz0gbVJlcy5iZXRhW2NdICogdG1wUHJlZGljdGVkT3V0cHV0W2RdO1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgIGlmIChtLnBhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyKyspIHtcbiAgICAgICAgICBsZXQgaW5kZXggPSBkICogZGltT3V0ICsgZDI7XG4gICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtpbmRleF1cbiAgICAgICAgICAgICs9IHNxYmV0YSAqIG0uY29tcG9uZW50c1tjXS5vdXRwdXRfY292YXJpYW5jZVtpbmRleF07XG4gICAgICAgIH1cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdXG4gICAgICAgICAgKz0gc3FiZXRhICogbS5jb21wb25lbnRzW2NdLm91dHB1dF9jb3ZhcmlhbmNlW2RdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG5leHBvcnQgY29uc3QgZ21tT2JzUHJvYiA9IChvYkluLCBzaW5nbGVHbW0sIGNvbXBvbmVudCA9IC0xKSA9PiB7XG4gIGNvbnN0IGNvZWZmcyA9IHNpbmdsZUdtbS5taXh0dXJlX2NvZWZmcztcbiAgLy9jb25zb2xlLmxvZyhjb2VmZnMpO1xuICAvL2lmKGNvZWZmcyA9PT0gdW5kZWZpbmVkKSBjb2VmZnMgPSBbMV07XG4gIGNvbnN0IGNvbXBvbmVudHMgPSBzaW5nbGVHbW0uY29tcG9uZW50cztcbiAgbGV0IHAgPSAwLjA7XG5cbiAgaWYgKGNvbXBvbmVudCA8IDApIHtcbiAgICBmb3IgKGxldCBjID0gMDsgYyA8IGNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcbiAgICAgIHAgKz0gZ21tT2JzUHJvYihvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcCA9IGNvZWZmc1tjb21wb25lbnJdICpcbiAgICAgIGdtbUNvbXBvbmVudExpa2VsaWhvb2Qob2JzSW4sIGNvbXBvbmVudHNbY29tcG9uZW50XSk7ICAgICAgIFxuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tT2JzUHJvYklucHV0ID0gKG9ic0luLCBzaW5nbGVHbW0sIGNvbXBvbmVudCA9IC0xKSA9PiB7XG4gIGNvbnN0IGNvZWZmcyA9IHNpbmdsZUdtbS5taXh0dXJlX2NvZWZmcztcbiAgY29uc3QgY29tcG9uZW50cyA9IHNpbmdsZUdtbS5jb21wb25lbnRzO1xuICBsZXQgcCA9IDAuMDtcblxuICBpZiAoY29tcG9uZW50IDwgMCkge1xuICAgIGZvcihsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgICBwICs9IGdtbU9ic1Byb2JJbnB1dChvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcCA9IGNvZWZmc1tjb21wb25lbnRdICpcbiAgICAgIGdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dChvYnNJbiwgY29tcG9uZW50c1tjb21wb25lbnRdKTsgICAgICBcbiAgfVxuICByZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbU9ic1Byb2JCaW1vZGFsID0gKG9ic0luLCBvYnNPdXQsIHNpbmdsZUdtbSwgY29tcG9uZW50ID0gLTEpID0+IHtcbiAgY29uc3QgY29lZmZzID0gc2luZ2xlR21tLm1peHR1cmVfY29lZmZzO1xuICBjb25zdCBjb21wb25lbnRzID0gc2luZ2xlR21tLmNvbXBvbmVudHM7XG4gIGxldCBwID0gMC4wO1xuXG4gIGlmIChjb21wb25lbnQgPCAwKSB7XG4gICAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgICBwICs9IGdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLCBvYnNPdXQsIHNpbmdsZUdtbSwgYyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHAgPSBjb2VmZnNbY29tcG9uZW50XSAqXG4gICAgICBnbW1Db21wb25lbnRMaWtlbGlob29kQmltb2RhbChvYnNJbiwgb2JzT3V0LCBjb21wb25lbnRzW2NvbXBvbmVudF0pO1xuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tTGlrZWxpaG9vZCA9IChvYnNJbiwgc2luZ2xlR21tLCBzaW5nbGVHbW1SZXMsIG9ic091dCA9IFtdKSA9PiB7XG4gIGNvbnN0IGNvZWZmcyA9IHNpbmdsZUdtbS5taXh0dXJlX2NvZWZmcztcbiAgY29uc3QgY29tcG9uZW50cyA9IHNpbmdsZUdtbS5jb21wb25lbnRzO1xuICBjb25zdCBtUmVzID0gc2luZ2xlR21tUmVzO1xuICBsZXQgbGlrZWxpaG9vZCA9IDAuMDtcbiAgXG4gIGZvciAobGV0IGMgPSAwOyBjIDwgY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWxcbiAgICBpZiAoc2luZ2xlQ2xhc3NHbW1Nb2RlbC5jb21wb25lbnRzW2NdLmJpbW9kYWwpIHtcbiAgICAgIGlmIChvYnNPdXQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIG1SZXMuYmV0YVtjXVxuICAgICAgICAgID0gZ21tT2JzUHJvYklucHV0KG9ic0luLCBzaW5nbGVHbW0sIGMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5iZXRhW2NdXG4gICAgICAgICAgPSBnbW1PYnNQcm9iQmltb2RhbChvYnNJbiwgb2JzT3V0LCBzaW5nbGVHbW0sIGMpO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWxcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5iZXRhW2NdID0gZ21tT2JzUHJvYihvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG4gICAgbGlrZWxpaG9vZCArPSBtUmVzLmJldGFbY107XG4gIH1cbiAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb2VmZnMubGVuZ3RoOyBjKyspIHtcbiAgICBtUmVzLmJldGFbY10gLz0gbGlrZWxpaG9vZDtcbiAgfVxuXG4gIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gbGlrZWxpaG9vZDtcblxuICAvLyBhcyBpbiB4bW06OlNpbmdsZUNsYXNzR01NOjp1cGRhdGVSZXN1bHRzIDpcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLnVuc2hpZnQobGlrZWxpaG9vZCk7XG4gIC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aC0tO1xuICAvLyBUSElTIElTIEJFVFRFUiAoY2lyY3VsYXIgYnVmZmVyKVxuICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW21SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhdID0gbGlrZWxpaG9vZDtcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleFxuICAgID0gKG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXggKyAxKSAlIG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuICAvLyBzdW0gYWxsIGFycmF5IHZhbHVlcyA6XG4gIG1SZXMubG9nX2xpa2VsaWhvb2QgPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApO1xuICBtUmVzLmxvZ19saWtlbGlob29kIC89IG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuXG4gIHJldHVybiBsaWtlbGlob29kO1xufTtcblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgICAgICAgIGFzIGluIHhtbUdtbS5jcHAgICAgICAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBnbW1GaWx0ZXIgPSAob2JzSW4sIGdtbSwgZ21tUmVzKSA9PiB7XG4gIGxldCBsaWtlbGlob29kcyA9IFtdO1xuICBjb25zdCBtb2RlbHMgPSBnbW0ubW9kZWxzO1xuICBjb25zdCBtUmVzID0gZ21tUmVzO1xuXG4gIGxldCBtYXhMb2dMaWtlbGlob29kID0gMDtcbiAgbGV0IG5vcm1Db25zdEluc3RhbnQgPSAwO1xuICBsZXQgbm9ybUNvbnN0U21vb3RoZWQgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHNpbmdsZVJlcyA9IG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV07XG4gICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldXG4gICAgICA9IGdtbUxpa2VsaWhvb2Qob2JzSW4sIG1vZGVsc1tpXSwgc2luZ2xlUmVzKTtcblxuICAgIC8vIGFzIGluIHhtbTo6R01NOjp1cGRhdGVSZXN1bHRzIDpcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSBzaW5nbGVSZXMubG9nX2xpa2VsaWhvb2Q7XG4gICAgbVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXVxuICAgICAgPSBNYXRoLmV4cChtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSk7XG4gICAgbVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV07XG4gICAgbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gbVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXTtcblxuICAgIG5vcm1Db25zdEluc3RhbnQgKz0gbVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG4gICAgbm9ybUNvbnN0U21vb3RoZWQgKz0gbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgaWYgKGkgPT0gMCB8fCBtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA+IG1heExvZ0xpa2VsaWhvb2QpIHtcbiAgICAgIG1heExvZ0xpa2VsaWhvb2QgPSBtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXTtcbiAgICAgIG1SZXMubGlrZWxpZXN0ID0gaTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgIG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1Db25zdEluc3RhbnQ7XG4gICAgbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1Db25zdFNtb290aGVkO1xuICB9XG5cbiAgLy8gaWYgbW9kZWwgaXMgYmltb2RhbCA6XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdCBwYXJhbXMgPSBnbW0uc2hhcmVkX3BhcmFtZXRlcnM7XG4gIGNvbnN0IGNvbmZpZyA9IGdtbS5jb25maWd1cmF0aW9uO1xuXG4gIGlmIChwYXJhbXMuYmltb2RhbCkge1xuICAgIGxldCBkaW0gPSBwYXJhbXMuZGltZW5zaW9uO1xuICAgIGxldCBkaW1JbiA9IHBhcmFtcy5kaW1lbnNpb25faW5wdXQ7XG4gICAgbGV0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxpa2VsaWVzdFxuICAgIGlmIChjb25maWcubXVsdGlDbGFzc19yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMCkge1xuICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzXG4gICAgICAgID0gbVJlcy5zaW5nbGVDbGFzc01vZGVsUmVzdWx0c1ttUmVzLmxpa2VsaWVzdF1cbiAgICAgICAgICAgIC5vdXRwdXRfdmFsdWVzO1xuICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVxuICAgICAgICA9IG1SZXMuc2luZ2xlQ2xhc3NNb2RlbFJlc3VsdHNbbVJlcy5saWtlbGllc3RdXG4gICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2U7ICAgICAgICAgICBcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtaXh0dXJlXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHplcm8tZmlsbCBvdXRwdXRfdmFsdWVzIGFuZCBvdXRwdXRfY292YXJpYW5jZVxuICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzID0gbmV3IEFycmF5KGRpbU91dCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgICAgIH1cblxuICAgICAgbGV0IG91dENvdmFyU2l6ZTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICBpZiAoY29uZmlnLmRlZmF1bHRfcGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT0gMCkge1xuICAgICAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0O1xuICAgICAgfVxuICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZSA9IG5ldyBBcnJheShvdXRDb3ZhclNpemUpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuICAgICAgfVxuXG4gICAgICAvLyBjb21wdXRlIHRoZSBhY3R1YWwgdmFsdWVzIDpcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBzbW9vdGhOb3JtTGlrZWxpaG9vZFxuICAgICAgICAgID0gbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuICAgICAgICBsZXQgc2luZ2xlUmVzID0gbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXTtcbiAgICAgICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGkrKykge1xuICAgICAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tkXSArPSBzbW9vdGhOb3JtTGlrZWxpaG9vZCAqXG4gICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVJlcy5vdXRwdXRfdmFsdWVzW2RdO1xuICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICBpZiAoY29uZmlnLmRlZmF1bHRfcGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyKyspIHtcbiAgICAgICAgICAgICAgbGV0IGluZGV4ID0gZCAqIGRpbU91dCArIGQyO1xuICAgICAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XVxuICAgICAgICAgICAgICAgICs9IHNtb290aE5vcm1MaWtlbGlob29kICpcbiAgICAgICAgICAgICAgICAgICBzaW5nbGVSZXMub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICAgICArPSBzbW9vdGhOb3JtTGlrZWxpaG9vZCAqXG4gICAgICAgICAgICAgICAgIHNpbmdsZVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gLyogZW5kIGlmKHBhcmFtcy5iaW1vZGFsKSAqL1xufTtcbiJdfQ==