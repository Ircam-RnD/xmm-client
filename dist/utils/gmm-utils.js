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

var gmmObsProb = exports.gmmObsProb = function gmmObsProb(obsIn, singleGmm) {
  var component = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;

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
    p = coeffs[component] * gmmComponentLikelihood(obsIn, components[component]);
  }
  return p;
};

var gmmObsProbInput = exports.gmmObsProbInput = function gmmObsProbInput(obsIn, singleGmm) {
  var component = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;

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
  var component = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : -1;

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
  var obsOut = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

  var coeffs = singleGmm.mixture_coeffs;
  var components = singleGmm.components;
  var mRes = singleGmmRes;
  var likelihood = 0.0;

  for (var c = 0; c < components.length; c++) {
    //------------------------------------------------------------------ bimodal
    if (components[c].bimodal) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdtbS11dGlscy5qcyJdLCJuYW1lcyI6WyJnbW1Db21wb25lbnRSZWdyZXNzaW9uIiwib2JzSW4iLCJwcmVkaWN0T3V0IiwiYyIsImRpbSIsImRpbWVuc2lvbiIsImRpbUluIiwiZGltZW5zaW9uX2lucHV0IiwiZGltT3V0IiwiQXJyYXkiLCJjb3ZhcmlhbmNlX21vZGUiLCJkIiwibWVhbiIsImUiLCJ0bXAiLCJmIiwiaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0IiwiY292YXJpYW5jZSIsImdtbUNvbXBvbmVudExpa2VsaWhvb2QiLCJldWNsaWRpYW5EaXN0YW5jZSIsImwiLCJrIiwiaW52ZXJzZV9jb3ZhcmlhbmNlIiwicCIsIk1hdGgiLCJleHAiLCJzcXJ0IiwiY292YXJpYW5jZV9kZXRlcm1pbmFudCIsInBvdyIsIlBJIiwiaXNOYU4iLCJhYnMiLCJnbW1Db21wb25lbnRMaWtlbGlob29kSW5wdXQiLCJjb3ZhcmlhbmNlX2RldGVybWluYW50X2lucHV0IiwiZ21tQ29tcG9uZW50TGlrZWxpaG9vZEJpbW9kYWwiLCJvYnNPdXQiLCJzcSIsImdtbVJlZ3Jlc3Npb24iLCJtIiwibVJlcyIsImNvbXBvbmVudHMiLCJvdXRwdXRfdmFsdWVzIiwiaSIsIm91dENvdmFyU2l6ZSIsInBhcmFtZXRlcnMiLCJvdXRwdXRfY292YXJpYW5jZSIsInRtcFByZWRpY3RlZE91dHB1dCIsImxlbmd0aCIsInNxYmV0YSIsImJldGEiLCJkMiIsImluZGV4IiwiZ21tT2JzUHJvYiIsInNpbmdsZUdtbSIsImNvbXBvbmVudCIsImNvZWZmcyIsIm1peHR1cmVfY29lZmZzIiwiZ21tT2JzUHJvYklucHV0IiwiZ21tT2JzUHJvYkJpbW9kYWwiLCJnbW1MaWtlbGlob29kIiwic2luZ2xlR21tUmVzIiwibGlrZWxpaG9vZCIsImJpbW9kYWwiLCJpbnN0YW50X2xpa2VsaWhvb2QiLCJsaWtlbGlob29kX2J1ZmZlciIsImxpa2VsaWhvb2RfYnVmZmVyX2luZGV4IiwibG9nX2xpa2VsaWhvb2QiLCJyZWR1Y2UiLCJhIiwiYiIsImdtbUZpbHRlciIsImdtbSIsImdtbVJlcyIsImxpa2VsaWhvb2RzIiwibW9kZWxzIiwibWF4TG9nTGlrZWxpaG9vZCIsIm5vcm1Db25zdEluc3RhbnQiLCJub3JtQ29uc3RTbW9vdGhlZCIsInNpbmdsZVJlcyIsInNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzIiwiaW5zdGFudF9saWtlbGlob29kcyIsInNtb290aGVkX2xvZ19saWtlbGlob29kcyIsInNtb290aGVkX2xpa2VsaWhvb2RzIiwiaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzIiwic21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kcyIsImxpa2VsaWVzdCIsInBhcmFtcyIsInNoYXJlZF9wYXJhbWV0ZXJzIiwiY29uZmlnIiwiY29uZmlndXJhdGlvbiIsIm11bHRpQ2xhc3NfcmVncmVzc2lvbl9lc3RpbWF0b3IiLCJzaW5nbGVDbGFzc01vZGVsUmVzdWx0cyIsImRlZmF1bHRfcGFyYW1ldGVycyIsInNtb290aE5vcm1MaWtlbGlob29kIl0sIm1hcHBpbmdzIjoiOzs7OztBQUFBOzs7O0FBSUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDTyxJQUFNQSwwREFBeUIsU0FBekJBLHNCQUF5QixDQUFDQyxLQUFELEVBQVFDLFVBQVIsRUFBb0JDLENBQXBCLEVBQTBCO0FBQ2hFO0FBQ0E7QUFDRSxNQUFNQyxNQUFNRCxFQUFFRSxTQUFkO0FBQ0EsTUFBTUMsUUFBUUgsRUFBRUksZUFBaEI7QUFDQSxNQUFNQyxTQUFTSixNQUFNRSxLQUFyQjtBQUNBO0FBQ0FKLGVBQWEsSUFBSU8sS0FBSixDQUFVRCxNQUFWLENBQWI7O0FBRUE7QUFDQSxNQUFJTCxFQUFFTyxlQUFGLEtBQXNCLENBQTFCLEVBQTZCO0FBQzNCLFNBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJSCxNQUFwQixFQUE0QkcsR0FBNUIsRUFBaUM7QUFDL0JULGlCQUFXUyxDQUFYLElBQWdCUixF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QUdEO0FBQ0Y7QUFDRjtBQUNGO0FBQ0YsR0FwRzhDLENBb0c3QztBQUNILENBckdNIiwiZmlsZSI6ImdtbS11dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogIGZ1bmN0aW9ucyB1c2VkIGZvciBkZWNvZGluZywgdHJhbnNsYXRlZCBmcm9tIFhNTVxuICovXG5cbi8vIFRPRE8gOiB3cml0ZSBtZXRob2RzIGZvciBnZW5lcmF0aW5nIG1vZGVsUmVzdWx0cyBvYmplY3RcblxuLy8gZ2V0IHRoZSBpbnZlcnNlX2NvdmFyaWFuY2VzIG1hdHJpeCBvZiBlYWNoIG9mIHRoZSBHTU0gY2xhc3Nlc1xuLy8gZm9yIGVhY2ggaW5wdXQgZGF0YSwgY29tcHV0ZSB0aGUgZGlzdGFuY2Ugb2YgdGhlIGZyYW1lIHRvIGVhY2ggb2YgdGhlIEdNTXNcbi8vIHdpdGggdGhlIGZvbGxvd2luZyBlcXVhdGlvbnMgOlxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vIGFzIGluIHhtbUdhdXNzaWFuRGlzdHJpYnV0aW9uLmNwcCAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cblxuLy8gZnJvbSB4bW1HYXVzc2lhbkRpc3RyaWJ1dGlvbjo6cmVncmVzc2lvblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudFJlZ3Jlc3Npb24gPSAob2JzSW4sIHByZWRpY3RPdXQsIGMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRSZWdyZXNzaW9uID0gKG9ic0luLCBwcmVkaWN0T3V0LCBjb21wb25lbnQpID0+IHtcbi8vICAgY29uc3QgYyA9IGNvbXBvbmVudDtcbiAgY29uc3QgZGltID0gYy5kaW1lbnNpb247XG4gIGNvbnN0IGRpbUluID0gYy5kaW1lbnNpb25faW5wdXQ7XG4gIGNvbnN0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuICAvL2xldCBwcmVkaWN0ZWRPdXQgPSBbXTtcbiAgcHJlZGljdE91dCA9IG5ldyBBcnJheShkaW1PdXQpO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAoYy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IGRpbU91dDsgZCsrKSB7XG4gICAgICBwcmVkaWN0T3V0W2RdID0gYy5tZWFuW2RpbUluICsgZF07XG4gICAgICBmb3IgKGxldCBlID0gMDsgZSA8IGRpbUluOyBlKyspIHtcbiAgICAgICAgbGV0IHRtcCA9IDAuMDtcbiAgICAgICAgZm9yIChsZXQgZiA9IDA7IGYgPCBkaW1JbjsgZisrKSB7XG4gICAgICAgICAgdG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0W2UgKiBkaW1JbiArIGZdICpcbiAgICAgICAgICAgICAgIChvYnNJbltmXSAtIGMubWVhbltmXSk7XG4gICAgICAgIH1cbiAgICAgICAgcHJlZGljdE91dFtkXSArPSBjLmNvdmFyaWFuY2VbKGQgKyBkaW1JbikgKiBkaW0gKyBlXSAqIHRtcDtcbiAgICAgIH1cbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgIHByZWRpY3RPdXRbZF0gPSBjLmNvdmFyaWFuY2VbZCArIGRpbUluXTtcbiAgICB9XG4gIH1cbiAgLy9yZXR1cm4gcHJlZGljdGlvbk91dDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2QgPSAob2JzSW4sIGMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRMaWtlbGlob29kID0gKG9ic0luLCBjb21wb25lbnQpID0+IHtcbi8vICAgY29uc3QgYyA9IGNvbXBvbmVudDtcbiAgLy8gaWYoYy5jb3ZhcmlhbmNlX2RldGVybWluYW50ID09PSAwKSB7XG4gIC8vICByZXR1cm4gdW5kZWZpbmVkO1xuICAvLyB9XG4gIGxldCBldWNsaWRpYW5EaXN0YW5jZSA9IDAuMDtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBjLmRpbWVuc2lvbjsgbCsrKSB7XG4gICAgICBsZXQgdG1wID0gMC4wO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBjLmRpbWVuc2lvbjsgaysrKSB7XG4gICAgICAgIHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZVtsICogYy5kaW1lbnNpb24gKyBrXVxuICAgICAgICAgICogKG9ic0luW2tdIC0gYy5tZWFuW2tdKTtcbiAgICAgIH1cbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IChvYnNJbltsXSAtIGMubWVhbltsXSkgKiB0bXA7XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uOyBsKyspIHtcbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2xdICpcbiAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgIChvYnNJbltsXSAtIGMubWVhbltsXSk7XG4gICAgfVxuICB9XG5cbiAgbGV0IHAgPSBNYXRoLmV4cCgtMC41ICogZXVjbGlkaWFuRGlzdGFuY2UpIC9cbiAgICAgIE1hdGguc3FydChcbiAgICAgICAgYy5jb3ZhcmlhbmNlX2RldGVybWluYW50ICpcbiAgICAgICAgTWF0aC5wb3coMiAqIE1hdGguUEksIGMuZGltZW5zaW9uKVxuICAgICAgKTtcblxuICBpZiAocCA8IDFlLTE4MCB8fCBpc05hTihwKSB8fCBpc05hTihNYXRoLmFicyhwKSkpIHtcbiAgICBwID0gMWUtMTgwO1xuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tQ29tcG9uZW50TGlrZWxpaG9vZElucHV0ID0gKG9ic0luLCBjKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgZ21tQ29tcG9uZW50TGlrZWxpaG9vZElucHV0ID0gKG9ic0luLCBjb21wb25lbnQpID0+IHtcbi8vICAgY29uc3QgYyA9IGNvbXBvbmVudDtcbiAgLy8gaWYoYy5jb3ZhcmlhbmNlX2RldGVybWluYW50ID09PSAwKSB7XG4gIC8vICByZXR1cm4gdW5kZWZpbmVkO1xuICAvLyB9XG4gIGxldCBldWNsaWRpYW5EaXN0YW5jZSA9IDAuMDtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gIGlmIChjLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb25faW5wdXQ7IGwrKykge1xuICAgICAgbGV0IHRtcCA9IDAuMDtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgYy5kaW1lbnNpb25faW5wdXQ7IGsrKykge1xuICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VfaW5wdXRbbCAqIGMuZGltZW5zaW9uX2lucHV0ICsga10gKlxuICAgICAgICAgICAgIChvYnNJbltrXSAtIGMubWVhbltrXSk7XG4gICAgICB9XG4gICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICogdG1wO1xuICAgIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBjLmRpbWVuc2lvbl9pbnB1dDsgbCsrKSB7XG4gICAgICAvLyBvciB3b3VsZCBpdCBiZSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtsXSA/XG4gICAgICAvLyBzb3VuZHMgbG9naWMgLi4uIGJ1dCwgYWNjb3JkaW5nIHRvIEp1bGVzIChjZiBlLW1haWwpLFxuICAgICAgLy8gbm90IHJlYWxseSBpbXBvcnRhbnQuXG4gICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtsXSAqXG4gICAgICAgICAgICAgICAgIChvYnNJbltsXSAtIGMubWVhbltsXSkgKlxuICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pO1xuICAgIH1cbiAgfVxuXG4gIGxldCBwID0gTWF0aC5leHAoLTAuNSAqIGV1Y2xpZGlhbkRpc3RhbmNlKSAvXG4gICAgICBNYXRoLnNxcnQoXG4gICAgICAgIGMuY292YXJpYW5jZV9kZXRlcm1pbmFudF9pbnB1dCAqXG4gICAgICAgIE1hdGgucG93KDIgKiBNYXRoLlBJLCBjLmRpbWVuc2lvbl9pbnB1dClcbiAgICAgICk7XG5cbiAgaWYgKHAgPCAxZS0xODAgfHxpc05hTihwKSB8fCBpc05hTihNYXRoLmFicyhwKSkpIHtcbiAgICBwID0gMWUtMTgwO1xuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tQ29tcG9uZW50TGlrZWxpaG9vZEJpbW9kYWwgPSAob2JzSW4sIG9ic091dCwgYykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2RCaW1vZGFsID0gKG9ic0luLCBvYnNPdXQsIGNvbXBvbmVudCkgPT4ge1xuLy8gICBjb25zdCBjID0gY29tcG9uZW50O1xuICAvLyBpZihjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgPT09IDApIHtcbiAgLy8gIHJldHVybiB1bmRlZmluZWQ7XG4gIC8vIH1cbiAgY29uc3QgZGltID0gYy5kaW1lbnNpb247XG4gIGNvbnN0IGRpbUluID0gYy5kaW1lbnNpb25faW5wdXQ7XG4gIGNvbnN0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuICBsZXQgZXVjbGlkaWFuRGlzdGFuY2UgPSAwLjA7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gIGlmIChjLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgZGltOyBsKyspIHtcbiAgICAgIGxldCB0bXAgPSAwLjA7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGMuZGltZW5zaW9uX2lucHV0OyBrKyspIHtcbiAgICAgICAgdG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2wgKiBkaW0gKyBrXSAqXG4gICAgICAgICAgICAgKG9ic0luW2tdIC0gYy5tZWFuW2tdKTtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGsgPSAgMDsgayA8IGRpbU91dDsgaysrKSB7XG4gICAgICAgIHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZVtsICogZGltICsgZGltSW4gKyBrXSAqXG4gICAgICAgICAgICAgKG9ic091dFtrXSAtIGMubWVhbltkaW1JbiAra10pO1xuICAgICAgfVxuICAgICAgaWYgKGwgPCBkaW1Jbikge1xuICAgICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICogdG1wO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic091dFtsIC0gZGltSW5dIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgICAgdG1wO1xuICAgICAgfVxuICAgIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBkaW1JbjsgbCsrKSB7XG4gICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSBjLmludmVyc2VfY292YXJpYW5jZVtsXSAqXG4gICAgICAgICAgICAgICAgIChvYnNJbltsXSAtIGMubWVhbltsXSkgKlxuICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pO1xuICAgIH1cbiAgICBmb3IgKGxldCBsID0gYy5kaW1lbnNpb25faW5wdXQ7IGwgPCBjLmRpbWVuc2lvbjsgbCsrKSB7XG4gICAgICBsZXQgc3EgPSAob2JzT3V0W2wgLSBkaW1Jbl0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgKG9ic091dFtsIC0gZGltSW5dIC0gYy5tZWFuW2xdKTtcbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2xdICogc3E7XG4gICAgfVxuICB9XG5cbiAgbGV0IHAgPSBNYXRoLmV4cCgtMC41ICogZXVjbGlkaWFuRGlzdGFuY2UpIC9cbiAgICAgIE1hdGguc3FydChcbiAgICAgICAgYy5jb3ZhcmlhbmNlX2RldGVybWluYW50ICpcbiAgICAgICAgTWF0aC5wb3coMiAqIE1hdGguUEksIGMuZGltZW5zaW9uKVxuICAgICAgKTtcblxuICBpZiAocCA8IDFlLTE4MCB8fCBpc05hTihwKSB8fCBpc05hTihNYXRoLmFicyhwKSkpIHtcbiAgICBwID0gMWUtMTgwO1xuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgIGFzIGluIHhtbUdtbVNpbmdsZUNsYXNzLmNwcCAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBnbW1SZWdyZXNzaW9uID0gKG9ic0luLCBtLCBtUmVzKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgZ21tUmVncmVzc2lvbiA9IChvYnNJbiwgc2luZ2xlR21tLCBzaW5nbGVHbW1SZXMpID0+IHtcbi8vICAgY29uc3QgbSA9IHNpbmdsZUdtbTtcbi8vICAgY29uc3QgbVJlcyA9IHNpbmdsZUdtbVJlc3VsdHM7XG5cbiAgY29uc3QgZGltID0gbS5jb21wb25lbnRzWzBdLmRpbWVuc2lvbjtcbiAgY29uc3QgZGltSW4gPSBtLmNvbXBvbmVudHNbMF0uZGltZW5zaW9uX2lucHV0O1xuICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICBtUmVzLm91dHB1dF92YWx1ZXMgPSBuZXcgQXJyYXkoZGltT3V0KTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgfVxuXG4gIGxldCBvdXRDb3ZhclNpemU7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dCAqIGRpbU91dDtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgb3V0Q292YXJTaXplID0gZGltT3V0O1xuICB9XG4gIG1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gIH1cblxuICAvKlxuICAvLyB1c2VsZXNzIDogcmVpbnN0YW5jaWF0ZWQgaW4gZ21tQ29tcG9uZW50UmVncmVzc2lvblxuICBsZXQgdG1wUHJlZGljdGVkT3V0cHV0ID0gbmV3IEFycmF5KGRpbU91dCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcbiAgICB0bXBQcmVkaWN0ZWRPdXRwdXRbaV0gPSAwLjA7XG4gIH1cbiAgKi9cbiAgbGV0IHRtcFByZWRpY3RlZE91dHB1dDtcblxuICBmb3IgKGxldCBjID0gMDsgYyA8IG0uY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgIGdtbUNvbXBvbmVudFJlZ3Jlc3Npb24oXG4gICAgICBvYnNJbiwgdG1wUHJlZGljdGVkT3V0cHV0LCBtLmNvbXBvbmVudHNbY11cbiAgICApO1xuICAgIGxldCBzcWJldGEgPSBtUmVzLmJldGFbY10gKiBtUmVzLmJldGFbY107XG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2RdICs9IG1SZXMuYmV0YVtjXSAqIHRtcFByZWRpY3RlZE91dHB1dFtkXTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICBpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG4gICAgICAgICAgbGV0IGluZGV4ID0gZCAqIGRpbU91dCArIGQyO1xuICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdXG4gICAgICAgICAgICArPSBzcWJldGEgKiBtLmNvbXBvbmVudHNbY10ub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdO1xuICAgICAgICB9XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICs9IHNxYmV0YSAqIG0uY29tcG9uZW50c1tjXS5vdXRwdXRfY292YXJpYW5jZVtkXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbU9ic1Byb2IgPSAob2JzSW4sIHNpbmdsZUdtbSwgY29tcG9uZW50ID0gLTEpID0+IHtcbiAgY29uc3QgY29lZmZzID0gc2luZ2xlR21tLm1peHR1cmVfY29lZmZzO1xuICAvL2NvbnNvbGUubG9nKGNvZWZmcyk7XG4gIC8vaWYoY29lZmZzID09PSB1bmRlZmluZWQpIGNvZWZmcyA9IFsxXTtcbiAgY29uc3QgY29tcG9uZW50cyA9IHNpbmdsZUdtbS5jb21wb25lbnRzO1xuICBsZXQgcCA9IDAuMDtcblxuICBpZiAoY29tcG9uZW50IDwgMCkge1xuICAgIGZvciAobGV0IGMgPSAwOyBjIDwgY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgICAgcCArPSBnbW1PYnNQcm9iKG9ic0luLCBzaW5nbGVHbW0sIGMpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwID0gY29lZmZzW2NvbXBvbmVudF0gKlxuICAgICAgZ21tQ29tcG9uZW50TGlrZWxpaG9vZChvYnNJbiwgY29tcG9uZW50c1tjb21wb25lbnRdKTsgICAgICAgXG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1PYnNQcm9iSW5wdXQgPSAob2JzSW4sIHNpbmdsZUdtbSwgY29tcG9uZW50ID0gLTEpID0+IHtcbiAgY29uc3QgY29lZmZzID0gc2luZ2xlR21tLm1peHR1cmVfY29lZmZzO1xuICBjb25zdCBjb21wb25lbnRzID0gc2luZ2xlR21tLmNvbXBvbmVudHM7XG4gIGxldCBwID0gMC4wO1xuXG4gIGlmIChjb21wb25lbnQgPCAwKSB7XG4gICAgZm9yKGxldCBjID0gMDsgYyA8IGNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcbiAgICAgIHAgKz0gZ21tT2JzUHJvYklucHV0KG9ic0luLCBzaW5nbGVHbW0sIGMpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwID0gY29lZmZzW2NvbXBvbmVudF0gKlxuICAgICAgZ21tQ29tcG9uZW50TGlrZWxpaG9vZElucHV0KG9ic0luLCBjb21wb25lbnRzW2NvbXBvbmVudF0pOyAgICAgIFxuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tT2JzUHJvYkJpbW9kYWwgPSAob2JzSW4sIG9ic091dCwgc2luZ2xlR21tLCBjb21wb25lbnQgPSAtMSkgPT4ge1xuICBjb25zdCBjb2VmZnMgPSBzaW5nbGVHbW0ubWl4dHVyZV9jb2VmZnM7XG4gIGNvbnN0IGNvbXBvbmVudHMgPSBzaW5nbGVHbW0uY29tcG9uZW50cztcbiAgbGV0IHAgPSAwLjA7XG5cbiAgaWYgKGNvbXBvbmVudCA8IDApIHtcbiAgICBmb3IgKGxldCBjID0gMDsgYyA8IGNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcbiAgICAgIHAgKz0gZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sIG9ic091dCwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcCA9IGNvZWZmc1tjb21wb25lbnRdICpcbiAgICAgIGdtbUNvbXBvbmVudExpa2VsaWhvb2RCaW1vZGFsKG9ic0luLCBvYnNPdXQsIGNvbXBvbmVudHNbY29tcG9uZW50XSk7XG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1MaWtlbGlob29kID0gKG9ic0luLCBzaW5nbGVHbW0sIHNpbmdsZUdtbVJlcywgb2JzT3V0ID0gW10pID0+IHtcbiAgY29uc3QgY29lZmZzID0gc2luZ2xlR21tLm1peHR1cmVfY29lZmZzO1xuICBjb25zdCBjb21wb25lbnRzID0gc2luZ2xlR21tLmNvbXBvbmVudHM7XG4gIGNvbnN0IG1SZXMgPSBzaW5nbGVHbW1SZXM7XG4gIGxldCBsaWtlbGlob29kID0gMC4wO1xuICBcbiAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICAgIGlmIChjb21wb25lbnRzW2NdLmJpbW9kYWwpIHtcbiAgICAgIGlmIChvYnNPdXQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIG1SZXMuYmV0YVtjXVxuICAgICAgICAgID0gZ21tT2JzUHJvYklucHV0KG9ic0luLCBzaW5nbGVHbW0sIGMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5iZXRhW2NdXG4gICAgICAgICAgPSBnbW1PYnNQcm9iQmltb2RhbChvYnNJbiwgb2JzT3V0LCBzaW5nbGVHbW0sIGMpO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWxcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5iZXRhW2NdID0gZ21tT2JzUHJvYihvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG4gICAgbGlrZWxpaG9vZCArPSBtUmVzLmJldGFbY107XG4gIH1cbiAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb2VmZnMubGVuZ3RoOyBjKyspIHtcbiAgICBtUmVzLmJldGFbY10gLz0gbGlrZWxpaG9vZDtcbiAgfVxuXG4gIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gbGlrZWxpaG9vZDtcblxuICAvLyBhcyBpbiB4bW06OlNpbmdsZUNsYXNzR01NOjp1cGRhdGVSZXN1bHRzIDpcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLnVuc2hpZnQobGlrZWxpaG9vZCk7XG4gIC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aC0tO1xuICAvLyBUSElTIElTIEJFVFRFUiAoY2lyY3VsYXIgYnVmZmVyKVxuICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW21SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhdID0gbGlrZWxpaG9vZDtcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleFxuICAgID0gKG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXggKyAxKSAlIG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuICAvLyBzdW0gYWxsIGFycmF5IHZhbHVlcyA6XG4gIG1SZXMubG9nX2xpa2VsaWhvb2QgPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApO1xuICBtUmVzLmxvZ19saWtlbGlob29kIC89IG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuXG4gIHJldHVybiBsaWtlbGlob29kO1xufTtcblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgICAgICAgIGFzIGluIHhtbUdtbS5jcHAgICAgICAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBnbW1GaWx0ZXIgPSAob2JzSW4sIGdtbSwgZ21tUmVzKSA9PiB7XG4gIGxldCBsaWtlbGlob29kcyA9IFtdO1xuICBjb25zdCBtb2RlbHMgPSBnbW0ubW9kZWxzO1xuICBjb25zdCBtUmVzID0gZ21tUmVzO1xuXG4gIGxldCBtYXhMb2dMaWtlbGlob29kID0gMDtcbiAgbGV0IG5vcm1Db25zdEluc3RhbnQgPSAwO1xuICBsZXQgbm9ybUNvbnN0U21vb3RoZWQgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHNpbmdsZVJlcyA9IG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV07XG4gICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldXG4gICAgICA9IGdtbUxpa2VsaWhvb2Qob2JzSW4sIG1vZGVsc1tpXSwgc2luZ2xlUmVzKTtcblxuICAgIC8vIGFzIGluIHhtbTo6R01NOjp1cGRhdGVSZXN1bHRzIDpcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSBzaW5nbGVSZXMubG9nX2xpa2VsaWhvb2Q7XG4gICAgbVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXVxuICAgICAgPSBNYXRoLmV4cChtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSk7XG4gICAgbVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV07XG4gICAgbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gbVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXTtcblxuICAgIG5vcm1Db25zdEluc3RhbnQgKz0gbVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG4gICAgbm9ybUNvbnN0U21vb3RoZWQgKz0gbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgaWYgKGkgPT0gMCB8fCBtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA+IG1heExvZ0xpa2VsaWhvb2QpIHtcbiAgICAgIG1heExvZ0xpa2VsaWhvb2QgPSBtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXTtcbiAgICAgIG1SZXMubGlrZWxpZXN0ID0gaTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgIG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1Db25zdEluc3RhbnQ7XG4gICAgbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1Db25zdFNtb290aGVkO1xuICB9XG5cbiAgLy8gaWYgbW9kZWwgaXMgYmltb2RhbCA6XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdCBwYXJhbXMgPSBnbW0uc2hhcmVkX3BhcmFtZXRlcnM7XG4gIGNvbnN0IGNvbmZpZyA9IGdtbS5jb25maWd1cmF0aW9uO1xuXG4gIGlmIChwYXJhbXMuYmltb2RhbCkge1xuICAgIGxldCBkaW0gPSBwYXJhbXMuZGltZW5zaW9uO1xuICAgIGxldCBkaW1JbiA9IHBhcmFtcy5kaW1lbnNpb25faW5wdXQ7XG4gICAgbGV0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxpa2VsaWVzdFxuICAgIGlmIChjb25maWcubXVsdGlDbGFzc19yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMCkge1xuICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzXG4gICAgICAgID0gbVJlcy5zaW5nbGVDbGFzc01vZGVsUmVzdWx0c1ttUmVzLmxpa2VsaWVzdF1cbiAgICAgICAgICAgIC5vdXRwdXRfdmFsdWVzO1xuICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVxuICAgICAgICA9IG1SZXMuc2luZ2xlQ2xhc3NNb2RlbFJlc3VsdHNbbVJlcy5saWtlbGllc3RdXG4gICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2U7ICAgICAgICAgICBcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtaXh0dXJlXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHplcm8tZmlsbCBvdXRwdXRfdmFsdWVzIGFuZCBvdXRwdXRfY292YXJpYW5jZVxuICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzID0gbmV3IEFycmF5KGRpbU91dCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgICAgIH1cblxuICAgICAgbGV0IG91dENvdmFyU2l6ZTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICBpZiAoY29uZmlnLmRlZmF1bHRfcGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT0gMCkge1xuICAgICAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0O1xuICAgICAgfVxuICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZSA9IG5ldyBBcnJheShvdXRDb3ZhclNpemUpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuICAgICAgfVxuXG4gICAgICAvLyBjb21wdXRlIHRoZSBhY3R1YWwgdmFsdWVzIDpcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBzbW9vdGhOb3JtTGlrZWxpaG9vZFxuICAgICAgICAgID0gbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuICAgICAgICBsZXQgc2luZ2xlUmVzID0gbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXTtcbiAgICAgICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGkrKykge1xuICAgICAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tkXSArPSBzbW9vdGhOb3JtTGlrZWxpaG9vZCAqXG4gICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVJlcy5vdXRwdXRfdmFsdWVzW2RdO1xuICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICBpZiAoY29uZmlnLmRlZmF1bHRfcGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyKyspIHtcbiAgICAgICAgICAgICAgbGV0IGluZGV4ID0gZCAqIGRpbU91dCArIGQyO1xuICAgICAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XVxuICAgICAgICAgICAgICAgICs9IHNtb290aE5vcm1MaWtlbGlob29kICpcbiAgICAgICAgICAgICAgICAgICBzaW5nbGVSZXMub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICAgICArPSBzbW9vdGhOb3JtTGlrZWxpaG9vZCAqXG4gICAgICAgICAgICAgICAgIHNpbmdsZVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gLyogZW5kIGlmKHBhcmFtcy5iaW1vZGFsKSAqL1xufTtcbiJdfQ==