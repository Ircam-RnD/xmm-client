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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdtbS11dGlscy5qcyJdLCJuYW1lcyI6WyJnbW1Db21wb25lbnRSZWdyZXNzaW9uIiwib2JzSW4iLCJwcmVkaWN0T3V0IiwiYyIsImRpbSIsImRpbWVuc2lvbiIsImRpbUluIiwiZGltZW5zaW9uX2lucHV0IiwiZGltT3V0IiwiQXJyYXkiLCJjb3ZhcmlhbmNlX21vZGUiLCJkIiwibWVhbiIsImUiLCJ0bXAiLCJmIiwiaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0IiwiY292YXJpYW5jZSIsImdtbUNvbXBvbmVudExpa2VsaWhvb2QiLCJldWNsaWRpYW5EaXN0YW5jZSIsImwiLCJrIiwiaW52ZXJzZV9jb3ZhcmlhbmNlIiwicCIsIk1hdGgiLCJleHAiLCJzcXJ0IiwiY292YXJpYW5jZV9kZXRlcm1pbmFudCIsInBvdyIsIlBJIiwiaXNOYU4iLCJhYnMiLCJnbW1Db21wb25lbnRMaWtlbGlob29kSW5wdXQiLCJjb3ZhcmlhbmNlX2RldGVybWluYW50X2lucHV0IiwiZ21tQ29tcG9uZW50TGlrZWxpaG9vZEJpbW9kYWwiLCJvYnNPdXQiLCJzcSIsImdtbVJlZ3Jlc3Npb24iLCJtIiwibVJlcyIsImNvbXBvbmVudHMiLCJvdXRwdXRfdmFsdWVzIiwiaSIsIm91dENvdmFyU2l6ZSIsInBhcmFtZXRlcnMiLCJvdXRwdXRfY292YXJpYW5jZSIsInRtcFByZWRpY3RlZE91dHB1dCIsImxlbmd0aCIsInNxYmV0YSIsImJldGEiLCJkMiIsImluZGV4IiwiZ21tT2JzUHJvYiIsInNpbmdsZUdtbSIsImNvbXBvbmVudCIsImNvZWZmcyIsIm1peHR1cmVfY29lZmZzIiwiZ21tT2JzUHJvYklucHV0IiwiZ21tT2JzUHJvYkJpbW9kYWwiLCJnbW1MaWtlbGlob29kIiwic2luZ2xlR21tUmVzIiwibGlrZWxpaG9vZCIsInNpbmdsZUNsYXNzR21tTW9kZWwiLCJiaW1vZGFsIiwiaW5zdGFudF9saWtlbGlob29kIiwibGlrZWxpaG9vZF9idWZmZXIiLCJsaWtlbGlob29kX2J1ZmZlcl9pbmRleCIsImxvZ19saWtlbGlob29kIiwicmVkdWNlIiwiYSIsImIiLCJnbW1GaWx0ZXIiLCJnbW0iLCJnbW1SZXMiLCJsaWtlbGlob29kcyIsIm1vZGVscyIsIm1heExvZ0xpa2VsaWhvb2QiLCJub3JtQ29uc3RJbnN0YW50Iiwibm9ybUNvbnN0U21vb3RoZWQiLCJzaW5nbGVSZXMiLCJzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cyIsImluc3RhbnRfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9saWtlbGlob29kcyIsImluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kcyIsInNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMiLCJsaWtlbGllc3QiLCJwYXJhbXMiLCJzaGFyZWRfcGFyYW1ldGVycyIsImNvbmZpZyIsImNvbmZpZ3VyYXRpb24iLCJtdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yIiwic2luZ2xlQ2xhc3NNb2RlbFJlc3VsdHMiLCJkZWZhdWx0X3BhcmFtZXRlcnMiLCJzbW9vdGhOb3JtTGlrZWxpaG9vZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQTs7OztBQUlBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ08sSUFBTUEsMERBQXlCLFNBQXpCQSxzQkFBeUIsQ0FBQ0MsS0FBRCxFQUFRQyxVQUFSLEVBQW9CQyxDQUFwQixFQUEwQjtBQUNoRTtBQUNBO0FBQ0UsTUFBTUMsTUFBTUQsRUFBRUUsU0FBZDtBQUNBLE1BQU1DLFFBQVFILEVBQUVJLGVBQWhCO0FBQ0EsTUFBTUMsU0FBU0osTUFBTUUsS0FBckI7QUFDQTtBQUNBSixlQUFhLElBQUlPLEtBQUosQ0FBVUQsTUFBVixDQUFiOztBQUVBO0FBQ0EsTUFBSUwsRUFBRU8sZUFBRixLQUFzQixDQUExQixFQUE2QjtBQUMzQixTQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSUgsTUFBcEIsRUFBNEJHLEdBQTVCLEVBQWlDO0FBQy9C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dUJBQ0FmLFdBQVVsQyxpQkFBVixDQUE0QmxDLENBQTVCLENBRkw7QUFHRDtBQUNGO0FBQ0Y7QUFDRjtBQUNGLEdBcEc4QyxDQW9HN0M7QUFDSCxDQXJHTSIsImZpbGUiOiJnbW0tdXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqICBmdW5jdGlvbnMgdXNlZCBmb3IgZGVjb2RpbmcsIHRyYW5zbGF0ZWQgZnJvbSBYTU1cbiAqL1xuXG4vLyBUT0RPIDogd3JpdGUgbWV0aG9kcyBmb3IgZ2VuZXJhdGluZyBtb2RlbFJlc3VsdHMgb2JqZWN0XG5cbi8vIGdldCB0aGUgaW52ZXJzZV9jb3ZhcmlhbmNlcyBtYXRyaXggb2YgZWFjaCBvZiB0aGUgR01NIGNsYXNzZXNcbi8vIGZvciBlYWNoIGlucHV0IGRhdGEsIGNvbXB1dGUgdGhlIGRpc3RhbmNlIG9mIHRoZSBmcmFtZSB0byBlYWNoIG9mIHRoZSBHTU1zXG4vLyB3aXRoIHRoZSBmb2xsb3dpbmcgZXF1YXRpb25zIDpcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyBhcyBpbiB4bW1HYXVzc2lhbkRpc3RyaWJ1dGlvbi5jcHAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5cbi8vIGZyb20geG1tR2F1c3NpYW5EaXN0cmlidXRpb246OnJlZ3Jlc3Npb25cbmV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRSZWdyZXNzaW9uID0gKG9ic0luLCBwcmVkaWN0T3V0LCBjKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgZ21tQ29tcG9uZW50UmVncmVzc2lvbiA9IChvYnNJbiwgcHJlZGljdE91dCwgY29tcG9uZW50KSA9PiB7XG4vLyAgIGNvbnN0IGMgPSBjb21wb25lbnQ7XG4gIGNvbnN0IGRpbSA9IGMuZGltZW5zaW9uO1xuICBjb25zdCBkaW1JbiA9IGMuZGltZW5zaW9uX2lucHV0O1xuICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcbiAgLy9sZXQgcHJlZGljdGVkT3V0ID0gW107XG4gIHByZWRpY3RPdXQgPSBuZXcgQXJyYXkoZGltT3V0KTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgcHJlZGljdE91dFtkXSA9IGMubWVhbltkaW1JbiArIGRdO1xuICAgICAgZm9yIChsZXQgZSA9IDA7IGUgPCBkaW1JbjsgZSsrKSB7XG4gICAgICAgIGxldCB0bXAgPSAwLjA7XG4gICAgICAgIGZvciAobGV0IGYgPSAwOyBmIDwgZGltSW47IGYrKykge1xuICAgICAgICAgIHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtlICogZGltSW4gKyBmXSAqXG4gICAgICAgICAgICAgICAob2JzSW5bZl0gLSBjLm1lYW5bZl0pO1xuICAgICAgICB9XG4gICAgICAgIHByZWRpY3RPdXRbZF0gKz0gYy5jb3ZhcmlhbmNlWyhkICsgZGltSW4pICogZGltICsgZV0gKiB0bXA7XG4gICAgICB9XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IGRpbU91dDsgZCsrKSB7XG4gICAgICBwcmVkaWN0T3V0W2RdID0gYy5jb3ZhcmlhbmNlW2QgKyBkaW1Jbl07XG4gICAgfVxuICB9XG4gIC8vcmV0dXJuIHByZWRpY3Rpb25PdXQ7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRMaWtlbGlob29kID0gKG9ic0luLCBjKSA9PiB7XG4vLyBleHBvcnQgY29uc3QgZ21tQ29tcG9uZW50TGlrZWxpaG9vZCA9IChvYnNJbiwgY29tcG9uZW50KSA9PiB7XG4vLyAgIGNvbnN0IGMgPSBjb21wb25lbnQ7XG4gIC8vIGlmKGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCA9PT0gMCkge1xuICAvLyAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgLy8gfVxuICBsZXQgZXVjbGlkaWFuRGlzdGFuY2UgPSAwLjA7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gIGlmIChjLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb247IGwrKykge1xuICAgICAgbGV0IHRtcCA9IDAuMDtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgYy5kaW1lbnNpb247IGsrKykge1xuICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbCAqIGMuZGltZW5zaW9uICsga11cbiAgICAgICAgICAqIChvYnNJbltrXSAtIGMubWVhbltrXSk7XG4gICAgICB9XG4gICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICogdG1wO1xuICAgIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBjLmRpbWVuc2lvbjsgbCsrKSB7XG4gICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSBjLmludmVyc2VfY292YXJpYW5jZVtsXSAqXG4gICAgICAgICAgICAgICAgIChvYnNJbltsXSAtIGMubWVhbltsXSkgKlxuICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pO1xuICAgIH1cbiAgfVxuXG4gIGxldCBwID0gTWF0aC5leHAoLTAuNSAqIGV1Y2xpZGlhbkRpc3RhbmNlKSAvXG4gICAgICBNYXRoLnNxcnQoXG4gICAgICAgIGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCAqXG4gICAgICAgIE1hdGgucG93KDIgKiBNYXRoLlBJLCBjLmRpbWVuc2lvbilcbiAgICAgICk7XG5cbiAgaWYgKHAgPCAxZS0xODAgfHwgaXNOYU4ocCkgfHwgaXNOYU4oTWF0aC5hYnMocCkpKSB7XG4gICAgcCA9IDFlLTE4MDtcbiAgfVxuICByZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dCA9IChvYnNJbiwgYykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dCA9IChvYnNJbiwgY29tcG9uZW50KSA9PiB7XG4vLyAgIGNvbnN0IGMgPSBjb21wb25lbnQ7XG4gIC8vIGlmKGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCA9PT0gMCkge1xuICAvLyAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgLy8gfVxuICBsZXQgZXVjbGlkaWFuRGlzdGFuY2UgPSAwLjA7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAoYy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uX2lucHV0OyBsKyspIHtcbiAgICAgIGxldCB0bXAgPSAwLjA7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGMuZGltZW5zaW9uX2lucHV0OyBrKyspIHtcbiAgICAgICAgdG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0W2wgKiBjLmRpbWVuc2lvbl9pbnB1dCArIGtdICpcbiAgICAgICAgICAgICAob2JzSW5ba10gLSBjLm1lYW5ba10pO1xuICAgICAgfVxuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqIHRtcDtcbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb25faW5wdXQ7IGwrKykge1xuICAgICAgLy8gb3Igd291bGQgaXQgYmUgYy5pbnZlcnNlX2NvdmFyaWFuY2VfaW5wdXRbbF0gP1xuICAgICAgLy8gc291bmRzIGxvZ2ljIC4uLiBidXQsIGFjY29yZGluZyB0byBKdWxlcyAoY2YgZS1tYWlsKSxcbiAgICAgIC8vIG5vdCByZWFsbHkgaW1wb3J0YW50LlxuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VfaW5wdXRbbF0gKlxuICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKTtcbiAgICB9XG4gIH1cblxuICBsZXQgcCA9IE1hdGguZXhwKC0wLjUgKiBldWNsaWRpYW5EaXN0YW5jZSkgL1xuICAgICAgTWF0aC5zcXJ0KFxuICAgICAgICBjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnRfaW5wdXQgKlxuICAgICAgICBNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb25faW5wdXQpXG4gICAgICApO1xuXG4gIGlmIChwIDwgMWUtMTgwIHx8aXNOYU4ocCkgfHwgaXNOYU4oTWF0aC5hYnMocCkpKSB7XG4gICAgcCA9IDFlLTE4MDtcbiAgfVxuICByZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2RCaW1vZGFsID0gKG9ic0luLCBvYnNPdXQsIGMpID0+IHtcbi8vIGV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRMaWtlbGlob29kQmltb2RhbCA9IChvYnNJbiwgb2JzT3V0LCBjb21wb25lbnQpID0+IHtcbi8vICAgY29uc3QgYyA9IGNvbXBvbmVudDtcbiAgLy8gaWYoYy5jb3ZhcmlhbmNlX2RldGVybWluYW50ID09PSAwKSB7XG4gIC8vICByZXR1cm4gdW5kZWZpbmVkO1xuICAvLyB9XG4gIGNvbnN0IGRpbSA9IGMuZGltZW5zaW9uO1xuICBjb25zdCBkaW1JbiA9IGMuZGltZW5zaW9uX2lucHV0O1xuICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcbiAgbGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAoYy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGRpbTsgbCsrKSB7XG4gICAgICBsZXQgdG1wID0gMC4wO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBjLmRpbWVuc2lvbl9pbnB1dDsgaysrKSB7XG4gICAgICAgIHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZVtsICogZGltICsga10gKlxuICAgICAgICAgICAgIChvYnNJbltrXSAtIGMubWVhbltrXSk7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBrID0gIDA7IGsgPCBkaW1PdXQ7IGsrKykge1xuICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbCAqIGRpbSArIGRpbUluICsga10gKlxuICAgICAgICAgICAgIChvYnNPdXRba10gLSBjLm1lYW5bZGltSW4gK2tdKTtcbiAgICAgIH1cbiAgICAgIGlmIChsIDwgZGltSW4pIHtcbiAgICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqIHRtcDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IChvYnNPdXRbbCAtIGRpbUluXSAtIGMubWVhbltsXSkgKlxuICAgICAgICAgICAgICAgICAgIHRtcDtcbiAgICAgIH1cbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgZGltSW47IGwrKykge1xuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbF0gKlxuICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKTtcbiAgICB9XG4gICAgZm9yIChsZXQgbCA9IGMuZGltZW5zaW9uX2lucHV0OyBsIDwgYy5kaW1lbnNpb247IGwrKykge1xuICAgICAgbGV0IHNxID0gKG9ic091dFtsIC0gZGltSW5dIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgIChvYnNPdXRbbCAtIGRpbUluXSAtIGMubWVhbltsXSk7XG4gICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSBjLmludmVyc2VfY292YXJpYW5jZVtsXSAqIHNxO1xuICAgIH1cbiAgfVxuXG4gIGxldCBwID0gTWF0aC5leHAoLTAuNSAqIGV1Y2xpZGlhbkRpc3RhbmNlKSAvXG4gICAgICBNYXRoLnNxcnQoXG4gICAgICAgIGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCAqXG4gICAgICAgIE1hdGgucG93KDIgKiBNYXRoLlBJLCBjLmRpbWVuc2lvbilcbiAgICAgICk7XG5cbiAgaWYgKHAgPCAxZS0xODAgfHwgaXNOYU4ocCkgfHwgaXNOYU4oTWF0aC5hYnMocCkpKSB7XG4gICAgcCA9IDFlLTE4MDtcbiAgfVxuICByZXR1cm4gcDtcbn07XG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyAgICBhcyBpbiB4bW1HbW1TaW5nbGVDbGFzcy5jcHAgICAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5leHBvcnQgY29uc3QgZ21tUmVncmVzc2lvbiA9IChvYnNJbiwgbSwgbVJlcykgPT4ge1xuLy8gZXhwb3J0IGNvbnN0IGdtbVJlZ3Jlc3Npb24gPSAob2JzSW4sIHNpbmdsZUdtbSwgc2luZ2xlR21tUmVzKSA9PiB7XG4vLyAgIGNvbnN0IG0gPSBzaW5nbGVHbW07XG4vLyAgIGNvbnN0IG1SZXMgPSBzaW5nbGVHbW1SZXN1bHRzO1xuXG4gIGNvbnN0IGRpbSA9IG0uY29tcG9uZW50c1swXS5kaW1lbnNpb247XG4gIGNvbnN0IGRpbUluID0gbS5jb21wb25lbnRzWzBdLmRpbWVuc2lvbl9pbnB1dDtcbiAgY29uc3QgZGltT3V0ID0gZGltIC0gZGltSW47XG5cbiAgbVJlcy5vdXRwdXRfdmFsdWVzID0gbmV3IEFycmF5KGRpbU91dCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcbiAgICBtUmVzLm91dHB1dF92YWx1ZXNbaV0gPSAwLjA7XG4gIH1cblxuICBsZXQgb3V0Q292YXJTaXplO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dDtcbiAgfVxuICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlID0gbmV3IEFycmF5KG91dENvdmFyU2l6ZSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0Q292YXJTaXplOyBpKyspIHtcbiAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuICB9XG5cbiAgLypcbiAgLy8gdXNlbGVzcyA6IHJlaW5zdGFuY2lhdGVkIGluIGdtbUNvbXBvbmVudFJlZ3Jlc3Npb25cbiAgbGV0IHRtcFByZWRpY3RlZE91dHB1dCA9IG5ldyBBcnJheShkaW1PdXQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgdG1wUHJlZGljdGVkT3V0cHV0W2ldID0gMC4wO1xuICB9XG4gICovXG4gIGxldCB0bXBQcmVkaWN0ZWRPdXRwdXQ7XG5cbiAgZm9yIChsZXQgYyA9IDA7IGMgPCBtLmNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcbiAgICBnbW1Db21wb25lbnRSZWdyZXNzaW9uKFxuICAgICAgb2JzSW4sIHRtcFByZWRpY3RlZE91dHB1dCwgbS5jb21wb25lbnRzW2NdXG4gICAgKTtcbiAgICBsZXQgc3FiZXRhID0gbVJlcy5iZXRhW2NdICogbVJlcy5iZXRhW2NdO1xuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tkXSArPSBtUmVzLmJldGFbY10gKiB0bXBQcmVkaWN0ZWRPdXRwdXRbZF07XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgaWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgZm9yIChsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIrKykge1xuICAgICAgICAgIGxldCBpbmRleCA9IGQgKiBkaW1PdXQgKyBkMjtcbiAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XVxuICAgICAgICAgICAgKz0gc3FiZXRhICogbS5jb21wb25lbnRzW2NdLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XTtcbiAgICAgICAgfVxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF1cbiAgICAgICAgICArPSBzcWJldGEgKiBtLmNvbXBvbmVudHNbY10ub3V0cHV0X2NvdmFyaWFuY2VbZF07XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1PYnNQcm9iID0gKG9ic0luLCBzaW5nbGVHbW0sIGNvbXBvbmVudCA9IC0xKSA9PiB7XG4gIGNvbnN0IGNvZWZmcyA9IHNpbmdsZUdtbS5taXh0dXJlX2NvZWZmcztcbiAgLy9jb25zb2xlLmxvZyhjb2VmZnMpO1xuICAvL2lmKGNvZWZmcyA9PT0gdW5kZWZpbmVkKSBjb2VmZnMgPSBbMV07XG4gIGNvbnN0IGNvbXBvbmVudHMgPSBzaW5nbGVHbW0uY29tcG9uZW50cztcbiAgbGV0IHAgPSAwLjA7XG5cbiAgaWYgKGNvbXBvbmVudCA8IDApIHtcbiAgICBmb3IgKGxldCBjID0gMDsgYyA8IGNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcbiAgICAgIHAgKz0gZ21tT2JzUHJvYihvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcCA9IGNvZWZmc1tjb21wb25lbnRdICpcbiAgICAgIGdtbUNvbXBvbmVudExpa2VsaWhvb2Qob2JzSW4sIGNvbXBvbmVudHNbY29tcG9uZW50XSk7ICAgICAgIFxuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tT2JzUHJvYklucHV0ID0gKG9ic0luLCBzaW5nbGVHbW0sIGNvbXBvbmVudCA9IC0xKSA9PiB7XG4gIGNvbnN0IGNvZWZmcyA9IHNpbmdsZUdtbS5taXh0dXJlX2NvZWZmcztcbiAgY29uc3QgY29tcG9uZW50cyA9IHNpbmdsZUdtbS5jb21wb25lbnRzO1xuICBsZXQgcCA9IDAuMDtcblxuICBpZiAoY29tcG9uZW50IDwgMCkge1xuICAgIGZvcihsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgICBwICs9IGdtbU9ic1Byb2JJbnB1dChvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcCA9IGNvZWZmc1tjb21wb25lbnRdICpcbiAgICAgIGdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dChvYnNJbiwgY29tcG9uZW50c1tjb21wb25lbnRdKTsgICAgICBcbiAgfVxuICByZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbU9ic1Byb2JCaW1vZGFsID0gKG9ic0luLCBvYnNPdXQsIHNpbmdsZUdtbSwgY29tcG9uZW50ID0gLTEpID0+IHtcbiAgY29uc3QgY29lZmZzID0gc2luZ2xlR21tLm1peHR1cmVfY29lZmZzO1xuICBjb25zdCBjb21wb25lbnRzID0gc2luZ2xlR21tLmNvbXBvbmVudHM7XG4gIGxldCBwID0gMC4wO1xuXG4gIGlmIChjb21wb25lbnQgPCAwKSB7XG4gICAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgICBwICs9IGdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLCBvYnNPdXQsIHNpbmdsZUdtbSwgYyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHAgPSBjb2VmZnNbY29tcG9uZW50XSAqXG4gICAgICBnbW1Db21wb25lbnRMaWtlbGlob29kQmltb2RhbChvYnNJbiwgb2JzT3V0LCBjb21wb25lbnRzW2NvbXBvbmVudF0pO1xuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tTGlrZWxpaG9vZCA9IChvYnNJbiwgc2luZ2xlR21tLCBzaW5nbGVHbW1SZXMsIG9ic091dCA9IFtdKSA9PiB7XG4gIGNvbnN0IGNvZWZmcyA9IHNpbmdsZUdtbS5taXh0dXJlX2NvZWZmcztcbiAgY29uc3QgY29tcG9uZW50cyA9IHNpbmdsZUdtbS5jb21wb25lbnRzO1xuICBjb25zdCBtUmVzID0gc2luZ2xlR21tUmVzO1xuICBsZXQgbGlrZWxpaG9vZCA9IDAuMDtcbiAgXG4gIGZvciAobGV0IGMgPSAwOyBjIDwgY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWxcbiAgICBpZiAoc2luZ2xlQ2xhc3NHbW1Nb2RlbC5jb21wb25lbnRzW2NdLmJpbW9kYWwpIHtcbiAgICAgIGlmIChvYnNPdXQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIG1SZXMuYmV0YVtjXVxuICAgICAgICAgID0gZ21tT2JzUHJvYklucHV0KG9ic0luLCBzaW5nbGVHbW0sIGMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5iZXRhW2NdXG4gICAgICAgICAgPSBnbW1PYnNQcm9iQmltb2RhbChvYnNJbiwgb2JzT3V0LCBzaW5nbGVHbW0sIGMpO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWxcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5iZXRhW2NdID0gZ21tT2JzUHJvYihvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG4gICAgbGlrZWxpaG9vZCArPSBtUmVzLmJldGFbY107XG4gIH1cbiAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb2VmZnMubGVuZ3RoOyBjKyspIHtcbiAgICBtUmVzLmJldGFbY10gLz0gbGlrZWxpaG9vZDtcbiAgfVxuXG4gIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gbGlrZWxpaG9vZDtcblxuICAvLyBhcyBpbiB4bW06OlNpbmdsZUNsYXNzR01NOjp1cGRhdGVSZXN1bHRzIDpcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLnVuc2hpZnQobGlrZWxpaG9vZCk7XG4gIC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aC0tO1xuICAvLyBUSElTIElTIEJFVFRFUiAoY2lyY3VsYXIgYnVmZmVyKVxuICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW21SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhdID0gbGlrZWxpaG9vZDtcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleFxuICAgID0gKG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXggKyAxKSAlIG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuICAvLyBzdW0gYWxsIGFycmF5IHZhbHVlcyA6XG4gIG1SZXMubG9nX2xpa2VsaWhvb2QgPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApO1xuICBtUmVzLmxvZ19saWtlbGlob29kIC89IG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuXG4gIHJldHVybiBsaWtlbGlob29kO1xufTtcblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgICAgICAgIGFzIGluIHhtbUdtbS5jcHAgICAgICAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBnbW1GaWx0ZXIgPSAob2JzSW4sIGdtbSwgZ21tUmVzKSA9PiB7XG4gIGxldCBsaWtlbGlob29kcyA9IFtdO1xuICBjb25zdCBtb2RlbHMgPSBnbW0ubW9kZWxzO1xuICBjb25zdCBtUmVzID0gZ21tUmVzO1xuXG4gIGxldCBtYXhMb2dMaWtlbGlob29kID0gMDtcbiAgbGV0IG5vcm1Db25zdEluc3RhbnQgPSAwO1xuICBsZXQgbm9ybUNvbnN0U21vb3RoZWQgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHNpbmdsZVJlcyA9IG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV07XG4gICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldXG4gICAgICA9IGdtbUxpa2VsaWhvb2Qob2JzSW4sIG1vZGVsc1tpXSwgc2luZ2xlUmVzKTtcblxuICAgIC8vIGFzIGluIHhtbTo6R01NOjp1cGRhdGVSZXN1bHRzIDpcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSBzaW5nbGVSZXMubG9nX2xpa2VsaWhvb2Q7XG4gICAgbVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXVxuICAgICAgPSBNYXRoLmV4cChtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSk7XG4gICAgbVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV07XG4gICAgbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gbVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXTtcblxuICAgIG5vcm1Db25zdEluc3RhbnQgKz0gbVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG4gICAgbm9ybUNvbnN0U21vb3RoZWQgKz0gbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgaWYgKGkgPT0gMCB8fCBtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA+IG1heExvZ0xpa2VsaWhvb2QpIHtcbiAgICAgIG1heExvZ0xpa2VsaWhvb2QgPSBtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXTtcbiAgICAgIG1SZXMubGlrZWxpZXN0ID0gaTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgIG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1Db25zdEluc3RhbnQ7XG4gICAgbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1Db25zdFNtb290aGVkO1xuICB9XG5cbiAgLy8gaWYgbW9kZWwgaXMgYmltb2RhbCA6XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdCBwYXJhbXMgPSBnbW0uc2hhcmVkX3BhcmFtZXRlcnM7XG4gIGNvbnN0IGNvbmZpZyA9IGdtbS5jb25maWd1cmF0aW9uO1xuXG4gIGlmIChwYXJhbXMuYmltb2RhbCkge1xuICAgIGxldCBkaW0gPSBwYXJhbXMuZGltZW5zaW9uO1xuICAgIGxldCBkaW1JbiA9IHBhcmFtcy5kaW1lbnNpb25faW5wdXQ7XG4gICAgbGV0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxpa2VsaWVzdFxuICAgIGlmIChjb25maWcubXVsdGlDbGFzc19yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMCkge1xuICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzXG4gICAgICAgID0gbVJlcy5zaW5nbGVDbGFzc01vZGVsUmVzdWx0c1ttUmVzLmxpa2VsaWVzdF1cbiAgICAgICAgICAgIC5vdXRwdXRfdmFsdWVzO1xuICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVxuICAgICAgICA9IG1SZXMuc2luZ2xlQ2xhc3NNb2RlbFJlc3VsdHNbbVJlcy5saWtlbGllc3RdXG4gICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2U7ICAgICAgICAgICBcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtaXh0dXJlXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHplcm8tZmlsbCBvdXRwdXRfdmFsdWVzIGFuZCBvdXRwdXRfY292YXJpYW5jZVxuICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzID0gbmV3IEFycmF5KGRpbU91dCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgICAgIH1cblxuICAgICAgbGV0IG91dENvdmFyU2l6ZTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICBpZiAoY29uZmlnLmRlZmF1bHRfcGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT0gMCkge1xuICAgICAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0O1xuICAgICAgfVxuICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZSA9IG5ldyBBcnJheShvdXRDb3ZhclNpemUpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuICAgICAgfVxuXG4gICAgICAvLyBjb21wdXRlIHRoZSBhY3R1YWwgdmFsdWVzIDpcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBzbW9vdGhOb3JtTGlrZWxpaG9vZFxuICAgICAgICAgID0gbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuICAgICAgICBsZXQgc2luZ2xlUmVzID0gbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXTtcbiAgICAgICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGkrKykge1xuICAgICAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tkXSArPSBzbW9vdGhOb3JtTGlrZWxpaG9vZCAqXG4gICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZVJlcy5vdXRwdXRfdmFsdWVzW2RdO1xuICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgICAgICBpZiAoY29uZmlnLmRlZmF1bHRfcGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyKyspIHtcbiAgICAgICAgICAgICAgbGV0IGluZGV4ID0gZCAqIGRpbU91dCArIGQyO1xuICAgICAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XVxuICAgICAgICAgICAgICAgICs9IHNtb290aE5vcm1MaWtlbGlob29kICpcbiAgICAgICAgICAgICAgICAgICBzaW5nbGVSZXMub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICAgICArPSBzbW9vdGhOb3JtTGlrZWxpaG9vZCAqXG4gICAgICAgICAgICAgICAgIHNpbmdsZVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gLyogZW5kIGlmKHBhcmFtcy5iaW1vZGFsKSAqL1xufTtcbiJdfQ==