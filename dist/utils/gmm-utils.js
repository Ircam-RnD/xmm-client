"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.gmmFilter = exports.gmmLikelihood = exports.gmmObsProbBimodal = exports.gmmObsProbInput = exports.gmmObsProb = exports.gmmRegression = exports.gmmComponentLikelihoodBimodal = exports.gmmComponentLikelihoodInput = exports.gmmComponentLikelihood = exports.gmmComponentRegression = undefined;

var _isFinite = require("babel-runtime/core-js/number/is-finite");

var _isFinite2 = _interopRequireDefault(_isFinite);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

  //if (p < 1e-180 || isNaN(p) || !Number.isFinite(Math.abs(p))) {
  if (p < 1e-180 || !(0, _isFinite2.default)(p)) {
    p = 1e-180;
  }

  return p;
};

var gmmComponentLikelihoodInput = exports.gmmComponentLikelihoodInput = function gmmComponentLikelihoodInput(obsIn, c) {
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

  for (var _c = 0; _c < components.length; _c++) {
    mRes.beta[_c] /= likelihood;
  }

  mRes.instant_likelihood = likelihood;

  // as in xmm::SingleClassGMM::updateResults :
  // ------------------------------------------
  //res.likelihood_buffer.unshift(likelihood);
  //res.likelihood_buffer.length--;
  // THIS IS BETTER (circular buffer)
  var bufLength = mRes.likelihood_buffer.length;
  mRes.likelihood_buffer[mRes.likelihood_buffer_index] = Math.log(likelihood);
  mRes.likelihood_buffer_index = (mRes.likelihood_buffer_index + 1) % bufLength;
  // sum all array values :
  mRes.log_likelihood = mRes.likelihood_buffer.reduce(function (a, b) {
    return a + b;
  }, 0);
  // mRes.log_likelihood = 0;
  // for (let i = 0; i < bufLength; i++) {
  //   mRes.log_likelihood += mRes.likelihood_buffer[i];
  // }
  mRes.log_likelihood /= bufLength;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdtbS11dGlscy5qcyJdLCJuYW1lcyI6WyJnbW1Db21wb25lbnRSZWdyZXNzaW9uIiwib2JzSW4iLCJwcmVkaWN0T3V0IiwiYyIsImRpbSIsImRpbWVuc2lvbiIsImRpbUluIiwiZGltZW5zaW9uX2lucHV0IiwiZGltT3V0IiwiQXJyYXkiLCJjb3ZhcmlhbmNlX21vZGUiLCJkIiwibWVhbiIsImUiLCJ0bXAiLCJmIiwiaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0IiwiY292YXJpYW5jZSIsImdtbUNvbXBvbmVudExpa2VsaWhvb2QiLCJldWNsaWRpYW5EaXN0YW5jZSIsImwiLCJrIiwiaW52ZXJzZV9jb3ZhcmlhbmNlIiwicCIsIk1hdGgiLCJleHAiLCJzcXJ0IiwiY292YXJpYW5jZV9kZXRlcm1pbmFudCIsInBvdyIsIlBJIiwiZ21tQ29tcG9uZW50TGlrZWxpaG9vZElucHV0IiwiY292YXJpYW5jZV9kZXRlcm1pbmFudF9pbnB1dCIsImlzTmFOIiwiYWJzIiwiZ21tQ29tcG9uZW50TGlrZWxpaG9vZEJpbW9kYWwiLCJvYnNPdXQiLCJzcSIsImdtbVJlZ3Jlc3Npb24iLCJtIiwibVJlcyIsImNvbXBvbmVudHMiLCJvdXRwdXRfdmFsdWVzIiwiaSIsIm91dENvdmFyU2l6ZSIsInBhcmFtZXRlcnMiLCJvdXRwdXRfY292YXJpYW5jZSIsInRtcFByZWRpY3RlZE91dHB1dCIsImxlbmd0aCIsInNxYmV0YSIsImJldGEiLCJkMiIsImluZGV4IiwiZ21tT2JzUHJvYiIsInNpbmdsZUdtbSIsImNvbXBvbmVudCIsImNvZWZmcyIsIm1peHR1cmVfY29lZmZzIiwiZ21tT2JzUHJvYklucHV0IiwiZ21tT2JzUHJvYkJpbW9kYWwiLCJnbW1MaWtlbGlob29kIiwic2luZ2xlR21tUmVzIiwibGlrZWxpaG9vZCIsImJpbW9kYWwiLCJpbnN0YW50X2xpa2VsaWhvb2QiLCJidWZMZW5ndGgiLCJsaWtlbGlob29kX2J1ZmZlciIsImxpa2VsaWhvb2RfYnVmZmVyX2luZGV4IiwibG9nIiwibG9nX2xpa2VsaWhvb2QiLCJyZWR1Y2UiLCJhIiwiYiIsImdtbUZpbHRlciIsImdtbSIsImdtbVJlcyIsImxpa2VsaWhvb2RzIiwibW9kZWxzIiwibWF4TG9nTGlrZWxpaG9vZCIsIm5vcm1Db25zdEluc3RhbnQiLCJub3JtQ29uc3RTbW9vdGhlZCIsInNpbmdsZVJlcyIsInNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzIiwiaW5zdGFudF9saWtlbGlob29kcyIsInNtb290aGVkX2xvZ19saWtlbGlob29kcyIsInNtb290aGVkX2xpa2VsaWhvb2RzIiwiaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzIiwic21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kcyIsImxpa2VsaWVzdCIsInBhcmFtcyIsInNoYXJlZF9wYXJhbWV0ZXJzIiwiY29uZmlnIiwiY29uZmlndXJhdGlvbiIsIm11bHRpQ2xhc3NfcmVncmVzc2lvbl9lc3RpbWF0b3IiLCJzaW5nbGVDbGFzc01vZGVsUmVzdWx0cyIsImRlZmF1bHRfcGFyYW1ldGVycyIsInNtb290aE5vcm1MaWtlbGlob29kIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFJQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNPLElBQU1BLDBEQUF5QixTQUF6QkEsc0JBQXlCLENBQUNDLEtBQUQsRUFBUUMsVUFBUixFQUFvQkMsQ0FBcEIsRUFBMEI7QUFDOUQsTUFBTUMsTUFBTUQsRUFBRUUsU0FBZDtBQUNBLE1BQU1DLFFBQVFILEVBQUVJLGVBQWhCO0FBQ0EsTUFBTUMsU0FBU0osTUFBTUUsS0FBckI7QUFDQTtBQUNBSixlQUFhLElBQUlPLEtBQUosQ0FBVUQsTUFBVixDQUFiOztBQUVBO0FBQ0EsTUFBSUwsRUFBRU8sZUFBRixLQUFzQixDQUExQixFQUE2QjtBQUMzQixTQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSUgsTUFBcEIsRUFBNEJHLEdBQTVCLEVBQWlDO0FBQy9CVCxpQkFB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R00iLCJmaWxlIjoiZ21tLXV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAgZnVuY3Rpb25zIHVzZWQgZm9yIGRlY29kaW5nLCB0cmFuc2xhdGVkIGZyb20gWE1NXG4gKi9cblxuLy8gVE9ETyA6IHdyaXRlIG1ldGhvZHMgZm9yIGdlbmVyYXRpbmcgbW9kZWxSZXN1bHRzIG9iamVjdFxuXG4vLyBnZXQgdGhlIGludmVyc2VfY292YXJpYW5jZXMgbWF0cml4IG9mIGVhY2ggb2YgdGhlIEdNTSBjbGFzc2VzXG4vLyBmb3IgZWFjaCBpbnB1dCBkYXRhLCBjb21wdXRlIHRoZSBkaXN0YW5jZSBvZiB0aGUgZnJhbWUgdG8gZWFjaCBvZiB0aGUgR01Nc1xuLy8gd2l0aCB0aGUgZm9sbG93aW5nIGVxdWF0aW9ucyA6XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gYXMgaW4geG1tR2F1c3NpYW5EaXN0cmlidXRpb24uY3BwIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuXG4vLyBmcm9tIHhtbUdhdXNzaWFuRGlzdHJpYnV0aW9uOjpyZWdyZXNzaW9uXG5leHBvcnQgY29uc3QgZ21tQ29tcG9uZW50UmVncmVzc2lvbiA9IChvYnNJbiwgcHJlZGljdE91dCwgYykgPT4ge1xuICBjb25zdCBkaW0gPSBjLmRpbWVuc2lvbjtcbiAgY29uc3QgZGltSW4gPSBjLmRpbWVuc2lvbl9pbnB1dDtcbiAgY29uc3QgZGltT3V0ID0gZGltIC0gZGltSW47XG4gIC8vbGV0IHByZWRpY3RlZE91dCA9IFtdO1xuICBwcmVkaWN0T3V0ID0gbmV3IEFycmF5KGRpbU91dCk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gIGlmIChjLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgIHByZWRpY3RPdXRbZF0gPSBjLm1lYW5bZGltSW4gKyBkXTtcbiAgICAgIGZvciAobGV0IGUgPSAwOyBlIDwgZGltSW47IGUrKykge1xuICAgICAgICBsZXQgdG1wID0gMC4wO1xuICAgICAgICBmb3IgKGxldCBmID0gMDsgZiA8IGRpbUluOyBmKyspIHtcbiAgICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VfaW5wdXRbZSAqIGRpbUluICsgZl0gKlxuICAgICAgICAgICAgICAgKG9ic0luW2ZdIC0gYy5tZWFuW2ZdKTtcbiAgICAgICAgfVxuICAgICAgICBwcmVkaWN0T3V0W2RdICs9IGMuY292YXJpYW5jZVsoZCArIGRpbUluKSAqIGRpbSArIGVdICogdG1wO1xuICAgICAgfVxuICAgIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgcHJlZGljdE91dFtkXSA9IGMuY292YXJpYW5jZVtkICsgZGltSW5dO1xuICAgIH1cbiAgfVxuICAvL3JldHVybiBwcmVkaWN0aW9uT3V0O1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tQ29tcG9uZW50TGlrZWxpaG9vZCA9IChvYnNJbiwgYykgPT4ge1xuICAvLyBpZihjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgPT09IDApIHtcbiAgLy8gIHJldHVybiB1bmRlZmluZWQ7XG4gIC8vIH1cbiAgbGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAoYy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uOyBsKyspIHtcbiAgICAgIGxldCB0bXAgPSAwLjA7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGMuZGltZW5zaW9uOyBrKyspIHtcbiAgICAgICAgdG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2wgKiBjLmRpbWVuc2lvbiArIGtdXG4gICAgICAgICAgKiAob2JzSW5ba10gLSBjLm1lYW5ba10pO1xuICAgICAgfVxuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqIHRtcDtcbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb247IGwrKykge1xuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbF0gKlxuICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKTtcbiAgICB9XG4gIH1cblxuICBsZXQgcCA9IE1hdGguZXhwKC0wLjUgKiBldWNsaWRpYW5EaXN0YW5jZSkgL1xuICAgICAgTWF0aC5zcXJ0KFxuICAgICAgICBjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgKlxuICAgICAgICBNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb24pXG4gICAgICApO1xuXG4gIC8vaWYgKHAgPCAxZS0xODAgfHwgaXNOYU4ocCkgfHwgIU51bWJlci5pc0Zpbml0ZShNYXRoLmFicyhwKSkpIHtcbiAgaWYgKHAgPCAxZS0xODAgfHwgIU51bWJlci5pc0Zpbml0ZShwKSkge1xuICAgIHAgPSAxZS0xODA7XG4gIH1cblxuICByZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dCA9IChvYnNJbiwgYykgPT4ge1xuICAvLyBpZihjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgPT09IDApIHtcbiAgLy8gIHJldHVybiB1bmRlZmluZWQ7XG4gIC8vIH1cbiAgbGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBjLmRpbWVuc2lvbl9pbnB1dDsgbCsrKSB7XG4gICAgICBsZXQgdG1wID0gMC4wO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBjLmRpbWVuc2lvbl9pbnB1dDsgaysrKSB7XG4gICAgICAgIHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtsICogYy5kaW1lbnNpb25faW5wdXQgKyBrXSAqXG4gICAgICAgICAgICAgKG9ic0luW2tdIC0gYy5tZWFuW2tdKTtcbiAgICAgIH1cbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IChvYnNJbltsXSAtIGMubWVhbltsXSkgKiB0bXA7XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uX2lucHV0OyBsKyspIHtcbiAgICAgIC8vIG9yIHdvdWxkIGl0IGJlIGMuaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0W2xdID9cbiAgICAgIC8vIHNvdW5kcyBsb2dpYyAuLi4gYnV0LCBhY2NvcmRpbmcgdG8gSnVsZXMgKGNmIGUtbWFpbCksXG4gICAgICAvLyBub3QgcmVhbGx5IGltcG9ydGFudC5cbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0W2xdICpcbiAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgIChvYnNJbltsXSAtIGMubWVhbltsXSk7XG4gICAgfVxuICB9XG5cbiAgbGV0IHAgPSBNYXRoLmV4cCgtMC41ICogZXVjbGlkaWFuRGlzdGFuY2UpIC9cbiAgICAgIE1hdGguc3FydChcbiAgICAgICAgYy5jb3ZhcmlhbmNlX2RldGVybWluYW50X2lucHV0ICpcbiAgICAgICAgTWF0aC5wb3coMiAqIE1hdGguUEksIGMuZGltZW5zaW9uX2lucHV0KVxuICAgICAgKTtcblxuICBpZiAocCA8IDFlLTE4MCB8fGlzTmFOKHApIHx8IGlzTmFOKE1hdGguYWJzKHApKSkge1xuICAgIHAgPSAxZS0xODA7XG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRMaWtlbGlob29kQmltb2RhbCA9IChvYnNJbiwgb2JzT3V0LCBjKSA9PiB7XG4gIC8vIGlmKGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCA9PT0gMCkge1xuICAvLyAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgLy8gfVxuICBjb25zdCBkaW0gPSBjLmRpbWVuc2lvbjtcbiAgY29uc3QgZGltSW4gPSBjLmRpbWVuc2lvbl9pbnB1dDtcbiAgY29uc3QgZGltT3V0ID0gZGltIC0gZGltSW47XG4gIGxldCBldWNsaWRpYW5EaXN0YW5jZSA9IDAuMDtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBkaW07IGwrKykge1xuICAgICAgbGV0IHRtcCA9IDAuMDtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgYy5kaW1lbnNpb25faW5wdXQ7IGsrKykge1xuICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbCAqIGRpbSArIGtdICpcbiAgICAgICAgICAgICAob2JzSW5ba10gLSBjLm1lYW5ba10pO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgayA9ICAwOyBrIDwgZGltT3V0OyBrKyspIHtcbiAgICAgICAgdG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2wgKiBkaW0gKyBkaW1JbiArIGtdICpcbiAgICAgICAgICAgICAob2JzT3V0W2tdIC0gYy5tZWFuW2RpbUluICtrXSk7XG4gICAgICB9XG4gICAgICBpZiAobCA8IGRpbUluKSB7XG4gICAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IChvYnNJbltsXSAtIGMubWVhbltsXSkgKiB0bXA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSAob2JzT3V0W2wgLSBkaW1Jbl0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgICB0bXA7XG4gICAgICB9XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGRpbUluOyBsKyspIHtcbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2xdICpcbiAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgIChvYnNJbltsXSAtIGMubWVhbltsXSk7XG4gICAgfVxuICAgIGZvciAobGV0IGwgPSBjLmRpbWVuc2lvbl9pbnB1dDsgbCA8IGMuZGltZW5zaW9uOyBsKyspIHtcbiAgICAgIGxldCBzcSA9IChvYnNPdXRbbCAtIGRpbUluXSAtIGMubWVhbltsXSkgKlxuICAgICAgICAgICAob2JzT3V0W2wgLSBkaW1Jbl0gLSBjLm1lYW5bbF0pO1xuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbF0gKiBzcTtcbiAgICB9XG4gIH1cblxuICBsZXQgcCA9IE1hdGguZXhwKC0wLjUgKiBldWNsaWRpYW5EaXN0YW5jZSkgL1xuICAgICAgTWF0aC5zcXJ0KFxuICAgICAgICBjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgKlxuICAgICAgICBNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb24pXG4gICAgICApO1xuXG4gIGlmIChwIDwgMWUtMTgwIHx8IGlzTmFOKHApIHx8IGlzTmFOKE1hdGguYWJzKHApKSkge1xuICAgIHAgPSAxZS0xODA7XG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICAgYXMgaW4geG1tR21tU2luZ2xlQ2xhc3MuY3BwICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGdtbVJlZ3Jlc3Npb24gPSAob2JzSW4sIG0sIG1SZXMpID0+IHtcbiAgY29uc3QgZGltID0gbS5jb21wb25lbnRzWzBdLmRpbWVuc2lvbjtcbiAgY29uc3QgZGltSW4gPSBtLmNvbXBvbmVudHNbMF0uZGltZW5zaW9uX2lucHV0O1xuICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICBtUmVzLm91dHB1dF92YWx1ZXMgPSBuZXcgQXJyYXkoZGltT3V0KTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgfVxuXG4gIGxldCBvdXRDb3ZhclNpemU7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dCAqIGRpbU91dDtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgb3V0Q292YXJTaXplID0gZGltT3V0O1xuICB9XG4gIG1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gIH1cblxuICAvKlxuICAvLyB1c2VsZXNzIDogcmVpbnN0YW5jaWF0ZWQgaW4gZ21tQ29tcG9uZW50UmVncmVzc2lvblxuICBsZXQgdG1wUHJlZGljdGVkT3V0cHV0ID0gbmV3IEFycmF5KGRpbU91dCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcbiAgICB0bXBQcmVkaWN0ZWRPdXRwdXRbaV0gPSAwLjA7XG4gIH1cbiAgKi9cbiAgbGV0IHRtcFByZWRpY3RlZE91dHB1dDtcblxuICBmb3IgKGxldCBjID0gMDsgYyA8IG0uY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgIGdtbUNvbXBvbmVudFJlZ3Jlc3Npb24oXG4gICAgICBvYnNJbiwgdG1wUHJlZGljdGVkT3V0cHV0LCBtLmNvbXBvbmVudHNbY11cbiAgICApO1xuICAgIGxldCBzcWJldGEgPSBtUmVzLmJldGFbY10gKiBtUmVzLmJldGFbY107XG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2RdICs9IG1SZXMuYmV0YVtjXSAqIHRtcFByZWRpY3RlZE91dHB1dFtkXTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICBpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG4gICAgICAgICAgbGV0IGluZGV4ID0gZCAqIGRpbU91dCArIGQyO1xuICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdXG4gICAgICAgICAgICArPSBzcWJldGEgKiBtLmNvbXBvbmVudHNbY10ub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdO1xuICAgICAgICB9XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICs9IHNxYmV0YSAqIG0uY29tcG9uZW50c1tjXS5vdXRwdXRfY292YXJpYW5jZVtkXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbU9ic1Byb2IgPSAob2JzSW4sIHNpbmdsZUdtbSwgY29tcG9uZW50ID0gLTEpID0+IHtcbiAgY29uc3QgY29lZmZzID0gc2luZ2xlR21tLm1peHR1cmVfY29lZmZzO1xuICAvL2NvbnNvbGUubG9nKGNvZWZmcyk7XG4gIC8vaWYoY29lZmZzID09PSB1bmRlZmluZWQpIGNvZWZmcyA9IFsxXTtcbiAgY29uc3QgY29tcG9uZW50cyA9IHNpbmdsZUdtbS5jb21wb25lbnRzO1xuICBsZXQgcCA9IDAuMDtcblxuICBpZiAoY29tcG9uZW50IDwgMCkge1xuICAgIGZvciAobGV0IGMgPSAwOyBjIDwgY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgICAgcCArPSBnbW1PYnNQcm9iKG9ic0luLCBzaW5nbGVHbW0sIGMpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwID0gY29lZmZzW2NvbXBvbmVudF0gKlxuICAgICAgZ21tQ29tcG9uZW50TGlrZWxpaG9vZChvYnNJbiwgY29tcG9uZW50c1tjb21wb25lbnRdKTsgICAgICAgXG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1PYnNQcm9iSW5wdXQgPSAob2JzSW4sIHNpbmdsZUdtbSwgY29tcG9uZW50ID0gLTEpID0+IHtcbiAgY29uc3QgY29lZmZzID0gc2luZ2xlR21tLm1peHR1cmVfY29lZmZzO1xuICBjb25zdCBjb21wb25lbnRzID0gc2luZ2xlR21tLmNvbXBvbmVudHM7XG4gIGxldCBwID0gMC4wO1xuXG4gIGlmIChjb21wb25lbnQgPCAwKSB7XG4gICAgZm9yKGxldCBjID0gMDsgYyA8IGNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcbiAgICAgIHAgKz0gZ21tT2JzUHJvYklucHV0KG9ic0luLCBzaW5nbGVHbW0sIGMpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwID0gY29lZmZzW2NvbXBvbmVudF0gKlxuICAgICAgZ21tQ29tcG9uZW50TGlrZWxpaG9vZElucHV0KG9ic0luLCBjb21wb25lbnRzW2NvbXBvbmVudF0pOyAgICAgIFxuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tT2JzUHJvYkJpbW9kYWwgPSAob2JzSW4sIG9ic091dCwgc2luZ2xlR21tLCBjb21wb25lbnQgPSAtMSkgPT4ge1xuICBjb25zdCBjb2VmZnMgPSBzaW5nbGVHbW0ubWl4dHVyZV9jb2VmZnM7XG4gIGNvbnN0IGNvbXBvbmVudHMgPSBzaW5nbGVHbW0uY29tcG9uZW50cztcbiAgbGV0IHAgPSAwLjA7XG5cbiAgaWYgKGNvbXBvbmVudCA8IDApIHtcbiAgICBmb3IgKGxldCBjID0gMDsgYyA8IGNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcbiAgICAgIHAgKz0gZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sIG9ic091dCwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcCA9IGNvZWZmc1tjb21wb25lbnRdICpcbiAgICAgIGdtbUNvbXBvbmVudExpa2VsaWhvb2RCaW1vZGFsKG9ic0luLCBvYnNPdXQsIGNvbXBvbmVudHNbY29tcG9uZW50XSk7XG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1MaWtlbGlob29kID0gKG9ic0luLCBzaW5nbGVHbW0sIHNpbmdsZUdtbVJlcywgb2JzT3V0ID0gW10pID0+IHtcbiAgY29uc3QgY29tcG9uZW50cyA9IHNpbmdsZUdtbS5jb21wb25lbnRzO1xuICBjb25zdCBtUmVzID0gc2luZ2xlR21tUmVzO1xuICBsZXQgbGlrZWxpaG9vZCA9IDAuMDtcbiAgXG4gIGZvciAobGV0IGMgPSAwOyBjIDwgY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWxcbiAgICBpZiAoY29tcG9uZW50c1tjXS5iaW1vZGFsKSB7XG4gICAgICBpZiAob2JzT3V0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBtUmVzLmJldGFbY11cbiAgICAgICAgICA9IGdtbU9ic1Byb2JJbnB1dChvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYmV0YVtjXVxuICAgICAgICAgID0gZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sIG9ic091dCwgc2luZ2xlR21tLCBjKTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMuYmV0YVtjXSA9IGdtbU9ic1Byb2Iob2JzSW4sIHNpbmdsZUdtbSwgYyk7XG4gICAgfVxuXG4gICAgbGlrZWxpaG9vZCArPSBtUmVzLmJldGFbY107XG4gIH1cblxuICBmb3IgKGxldCBjID0gMDsgYyA8IGNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcbiAgICBtUmVzLmJldGFbY10gLz0gbGlrZWxpaG9vZDtcbiAgfVxuXG4gIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gbGlrZWxpaG9vZDtcblxuICAvLyBhcyBpbiB4bW06OlNpbmdsZUNsYXNzR01NOjp1cGRhdGVSZXN1bHRzIDpcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLnVuc2hpZnQobGlrZWxpaG9vZCk7XG4gIC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aC0tO1xuICAvLyBUSElTIElTIEJFVFRFUiAoY2lyY3VsYXIgYnVmZmVyKVxuICBjb25zdCBidWZMZW5ndGggPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDtcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlclttUmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4XSA9IE1hdGgubG9nKGxpa2VsaWhvb2QpO1xuICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4XG4gICAgPSAobVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleCArIDEpICUgYnVmTGVuZ3RoO1xuICAvLyBzdW0gYWxsIGFycmF5IHZhbHVlcyA6XG4gIG1SZXMubG9nX2xpa2VsaWhvb2QgPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApO1xuICAvLyBtUmVzLmxvZ19saWtlbGlob29kID0gMDtcbiAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCBidWZMZW5ndGg7IGkrKykge1xuICAvLyAgIG1SZXMubG9nX2xpa2VsaWhvb2QgKz0gbVJlcy5saWtlbGlob29kX2J1ZmZlcltpXTtcbiAgLy8gfVxuICBtUmVzLmxvZ19saWtlbGlob29kIC89IGJ1Zkxlbmd0aDtcblxuICByZXR1cm4gbGlrZWxpaG9vZDtcbn07XG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyAgICAgICAgICBhcyBpbiB4bW1HbW0uY3BwICAgICAgICAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5leHBvcnQgY29uc3QgZ21tRmlsdGVyID0gKG9ic0luLCBnbW0sIGdtbVJlcykgPT4ge1xuICBsZXQgbGlrZWxpaG9vZHMgPSBbXTtcbiAgY29uc3QgbW9kZWxzID0gZ21tLm1vZGVscztcbiAgY29uc3QgbVJlcyA9IGdtbVJlcztcblxuICBsZXQgbWF4TG9nTGlrZWxpaG9vZCA9IDA7XG4gIGxldCBub3JtQ29uc3RJbnN0YW50ID0gMDtcbiAgbGV0IG5vcm1Db25zdFNtb290aGVkID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgIGxldCBzaW5nbGVSZXMgPSBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldO1xuICAgIG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXVxuICAgICAgPSBnbW1MaWtlbGlob29kKG9ic0luLCBtb2RlbHNbaV0sIHNpbmdsZVJlcyk7XG5cbiAgICAvLyBhcyBpbiB4bW06OkdNTTo6dXBkYXRlUmVzdWx0cyA6XG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldID0gc2luZ2xlUmVzLmxvZ19saWtlbGlob29kO1xuICAgIG1SZXMuc21vb3RoZWRfbGlrZWxpaG9vZHNbaV1cbiAgICAgID0gTWF0aC5leHAobVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0pO1xuICAgIG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldO1xuICAgIG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IG1SZXMuc21vb3RoZWRfbGlrZWxpaG9vZHNbaV07XG5cbiAgICBub3JtQ29uc3RJbnN0YW50ICs9IG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuICAgIG5vcm1Db25zdFNtb290aGVkICs9IG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcblxuICAgIGlmIChpID09IDAgfHwgbVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPiBtYXhMb2dMaWtlbGlob29kKSB7XG4gICAgICBtYXhMb2dMaWtlbGlob29kID0gbVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV07XG4gICAgICBtUmVzLmxpa2VsaWVzdCA9IGk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICBtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAvPSBub3JtQ29uc3RJbnN0YW50O1xuICAgIG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAvPSBub3JtQ29uc3RTbW9vdGhlZDtcbiAgfVxuXG4gIC8vIGlmIG1vZGVsIGlzIGJpbW9kYWwgOlxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3QgcGFyYW1zID0gZ21tLnNoYXJlZF9wYXJhbWV0ZXJzO1xuICBjb25zdCBjb25maWcgPSBnbW0uY29uZmlndXJhdGlvbjtcblxuICBpZiAocGFyYW1zLmJpbW9kYWwpIHtcbiAgICBsZXQgZGltID0gcGFyYW1zLmRpbWVuc2lvbjtcbiAgICBsZXQgZGltSW4gPSBwYXJhbXMuZGltZW5zaW9uX2lucHV0O1xuICAgIGxldCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsaWtlbGllc3RcbiAgICBpZiAoY29uZmlnLm11bHRpQ2xhc3NfcmVncmVzc2lvbl9lc3RpbWF0b3IgPT09IDApIHtcbiAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1xuICAgICAgICA9IG1SZXMuc2luZ2xlQ2xhc3NNb2RlbFJlc3VsdHNbbVJlcy5saWtlbGllc3RdXG4gICAgICAgICAgICAub3V0cHV0X3ZhbHVlcztcbiAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VcbiAgICAgICAgPSBtUmVzLnNpbmdsZUNsYXNzTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0XVxuICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlOyAgICAgICAgICAgXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbWl4dHVyZVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyB6ZXJvLWZpbGwgb3V0cHV0X3ZhbHVlcyBhbmQgb3V0cHV0X2NvdmFyaWFuY2VcbiAgICAgIG1SZXMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgICAgICBtUmVzLm91dHB1dF92YWx1ZXNbaV0gPSAwLjA7XG4gICAgICB9XG5cbiAgICAgIGxldCBvdXRDb3ZhclNpemU7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgaWYgKGNvbmZpZy5kZWZhdWx0X3BhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09IDApIHtcbiAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0ICogZGltT3V0O1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dDtcbiAgICAgIH1cbiAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0Q292YXJTaXplOyBpKyspIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtpXSA9IDAuMDtcbiAgICAgIH1cblxuICAgICAgLy8gY29tcHV0ZSB0aGUgYWN0dWFsIHZhbHVlcyA6XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgc21vb3RoTm9ybUxpa2VsaWhvb2RcbiAgICAgICAgICA9IG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcbiAgICAgICAgbGV0IHNpbmdsZVJlcyA9IG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV07XG4gICAgICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBpKyspIHtcbiAgICAgICAgICBtUmVzLm91dHB1dF92YWx1ZXNbZF0gKz0gc21vb3RoTm9ybUxpa2VsaWhvb2QgKlxuICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVSZXMub3V0cHV0X3ZhbHVlc1tkXTtcbiAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgaWYgKGNvbmZpZy5kZWZhdWx0X3BhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG4gICAgICAgICAgICAgIGxldCBpbmRleCA9IGQgKiBkaW1PdXQgKyBkMjtcbiAgICAgICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtpbmRleF1cbiAgICAgICAgICAgICAgICArPSBzbW9vdGhOb3JtTGlrZWxpaG9vZCAqXG4gICAgICAgICAgICAgICAgICAgc2luZ2xlUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF1cbiAgICAgICAgICAgICAgKz0gc21vb3RoTm9ybUxpa2VsaWhvb2QgKlxuICAgICAgICAgICAgICAgICBzaW5nbGVSZXMub3V0cHV0X2NvdmFyaWFuY2VbZF07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IC8qIGVuZCBpZihwYXJhbXMuYmltb2RhbCkgKi9cbn07XG4iXX0=