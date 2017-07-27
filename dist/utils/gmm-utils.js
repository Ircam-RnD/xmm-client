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
        tmp += c.inverse_covariance[l * c.dimension + k] * (obsIn[k] - c.mean[k]) * c.weights[k];
      }
      euclidianDistance += (obsIn[l] - c.mean[l]) * tmp * c.weights[l];
    }
    //------------------------------------------------------------------- diagonal
  } else {
    for (var _l = 0; _l < c.dimension; _l++) {
      euclidianDistance += c.inverse_covariance[_l] * (obsIn[_l] - c.mean[_l]) * (obsIn[_l] - c.mean[_l]) * c.weights[_l] * c.weights[_l];
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
        tmp += c.inverse_covariance_input[l * c.dimension_input + k] * (obsIn[k] - c.mean[k]) * c.weights[k];
      }
      euclidianDistance += (obsIn[l] - c.mean[l]) * tmp * c.weights[l];
    }
    //------------------------------------------------------------------- diagonal
  } else {
    for (var _l2 = 0; _l2 < c.dimension_input; _l2++) {
      // or would it be c.inverse_covariance_input[l] ?
      // sounds logic ... but, according to Jules (cf e-mail),
      // not really important.
      euclidianDistance += c.inverse_covariance_input[_l2] * (obsIn[_l2] - c.mean[_l2]) * (obsIn[_l2] - c.mean[_l2]) * c.weights[_l2] * c.weights[_l2];
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
      for (var k = 0; k < dimIn; k++) {
        tmp += c.inverse_covariance[l * dim + k] * (obsIn[k] - c.mean[k]) * c.weights[k];
      }
      for (var _k = 0; _k < dimOut; _k++) {
        tmp += c.inverse_covariance[l * dim + dimIn + _k] * (obsOut[_k] - c.mean[dimIn + _k]);
      }
      if (l < dimIn) {
        euclidianDistance += (obsIn[l] - c.mean[l]) * tmp * c.weights[l];
      } else {
        euclidianDistance += (obsOut[l - dimIn] - c.mean[l]) * tmp;
      }
    }
    //------------------------------------------------------------------- diagonal
  } else {
    for (var _l3 = 0; _l3 < dimIn; _l3++) {
      euclidianDistance += c.inverse_covariance[_l3] * (obsIn[_l3] - c.mean[_l3]) * (obsIn[_l3] - c.mean[_l3]) * c.weights[_l3] * c.weights[_l3];
    }
    for (var _l4 = dimIn; _l4 < dim; _l4++) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdtbS11dGlscy5qcyJdLCJuYW1lcyI6WyJnbW1Db21wb25lbnRSZWdyZXNzaW9uIiwib2JzSW4iLCJwcmVkaWN0T3V0IiwiYyIsImRpbSIsImRpbWVuc2lvbiIsImRpbUluIiwiZGltZW5zaW9uX2lucHV0IiwiZGltT3V0IiwiQXJyYXkiLCJjb3ZhcmlhbmNlX21vZGUiLCJkIiwibWVhbiIsImUiLCJ0bXAiLCJmIiwiaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0IiwiY292YXJpYW5jZSIsImdtbUNvbXBvbmVudExpa2VsaWhvb2QiLCJldWNsaWRpYW5EaXN0YW5jZSIsImwiLCJrIiwiaW52ZXJzZV9jb3ZhcmlhbmNlIiwid2VpZ2h0cyIsInAiLCJNYXRoIiwiZXhwIiwic3FydCIsImNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQiLCJwb3ciLCJQSSIsImdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dCIsImNvdmFyaWFuY2VfZGV0ZXJtaW5hbnRfaW5wdXQiLCJpc05hTiIsImFicyIsImdtbUNvbXBvbmVudExpa2VsaWhvb2RCaW1vZGFsIiwib2JzT3V0Iiwic3EiLCJnbW1SZWdyZXNzaW9uIiwibSIsIm1SZXMiLCJjb21wb25lbnRzIiwib3V0cHV0X3ZhbHVlcyIsImkiLCJvdXRDb3ZhclNpemUiLCJwYXJhbWV0ZXJzIiwib3V0cHV0X2NvdmFyaWFuY2UiLCJ0bXBQcmVkaWN0ZWRPdXRwdXQiLCJsZW5ndGgiLCJzcWJldGEiLCJiZXRhIiwiZDIiLCJpbmRleCIsImdtbU9ic1Byb2IiLCJzaW5nbGVHbW0iLCJjb21wb25lbnQiLCJjb2VmZnMiLCJtaXh0dXJlX2NvZWZmcyIsImdtbU9ic1Byb2JJbnB1dCIsImdtbU9ic1Byb2JCaW1vZGFsIiwiZ21tTGlrZWxpaG9vZCIsInNpbmdsZUdtbVJlcyIsImxpa2VsaWhvb2QiLCJiaW1vZGFsIiwiaW5zdGFudF9saWtlbGlob29kIiwiYnVmTGVuZ3RoIiwibGlrZWxpaG9vZF9idWZmZXIiLCJsaWtlbGlob29kX2J1ZmZlcl9pbmRleCIsImxvZyIsImxvZ19saWtlbGlob29kIiwicmVkdWNlIiwiYSIsImIiLCJnbW1GaWx0ZXIiLCJnbW0iLCJnbW1SZXMiLCJsaWtlbGlob29kcyIsIm1vZGVscyIsIm1heExvZ0xpa2VsaWhvb2QiLCJub3JtQ29uc3RJbnN0YW50Iiwibm9ybUNvbnN0U21vb3RoZWQiLCJzaW5nbGVSZXMiLCJzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cyIsImluc3RhbnRfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9saWtlbGlob29kcyIsImluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kcyIsInNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMiLCJsaWtlbGllc3QiLCJwYXJhbXMiLCJzaGFyZWRfcGFyYW1ldGVycyIsImNvbmZpZyIsImNvbmZpZ3VyYXRpb24iLCJtdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yIiwic2luZ2xlQ2xhc3NNb2RlbFJlc3VsdHMiLCJkZWZhdWx0X3BhcmFtZXRlcnMiLCJzbW9vdGhOb3JtTGlrZWxpaG9vZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBSUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDTyxJQUFNQSwwREFBeUIsU0FBekJBLHNCQUF5QixDQUFDQyxLQUFELEVBQVFDLFVBQVIsRUFBb0JDLENBQXBCLEVBQTBCO0FBQzlELE1BQU1DLE1BQU1ELEVBQUVFLFNBQWQ7QUFDQSxNQUFNQyxRQUFRSCxFQUFFSSxlQUFoQjtBQUNBLE1BQU1DLFNBQVNKLE1BQU1FLEtBQXJCO0FBQ0E7QUFDQUosZUFBYSxJQUFJTyxLQUFKLENBQVVELE1BQVYsQ0FBYjs7QUFFQTtBQUNBLE1BQUlMLEVBQUVPLGVBQUYsS0FBc0IsQ0FBMUIsRUFBNkI7QUFDM0IsU0FBSyxJQUFJQyxJQUFJLENBQWIsRUFBZ0JBLElBQUlILE1BQXBCLEVBQTRCRyxHQUE1QixFQUFpQztB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QUlnRixPQUFPSSxrQkFBUCxDQUEwQnJGLGVBQTFCLEtBQThDLENBQWxELEVBQXFEO0FBQ25ELGlCQUFLLElBQUl5QyxLQUFLLENBQWQsRUFBaUJBLEtBQUszQyxNQUF0QixFQUE4QjJDLElBQTlCLEVBQW9DO0FBQ2xDLGtCQUFJQyxRQUFRekMsSUFBSUgsTUFBSixHQUFhMkMsRUFBekI7QUFDQVgsbUJBQUtNLGlCQUFMLENBQXVCTSxLQUF2QixLQUNLNEMsdUJBQ0FmLFdBQVVuQyxpQkFBVixDQUE0Qk0sS0FBNUIsQ0FGTDtBQUdEO0FBQ0g7QUFDQyxXQVJELE1BUU87QUFDTFosaUJBQUtNLGlCQUFMLENBQXVCbkMsQ0FBdkIsS0FDS3FGLHVCQUNBZixXQUFVbkMsaUJBQVYsQ0FBNEJuQyxDQUE1QixDQUZMO0FBR0Q7QUFDRjtBQUNGO0FBQ0Y7QUFDRixHQXBHOEMsQ0FvRzdDO0FBQ0gsQ0FyR00iLCJmaWxlIjoiZ21tLXV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAgZnVuY3Rpb25zIHVzZWQgZm9yIGRlY29kaW5nLCB0cmFuc2xhdGVkIGZyb20gWE1NXG4gKi9cblxuLy8gVE9ETyA6IHdyaXRlIG1ldGhvZHMgZm9yIGdlbmVyYXRpbmcgbW9kZWxSZXN1bHRzIG9iamVjdFxuXG4vLyBnZXQgdGhlIGludmVyc2VfY292YXJpYW5jZXMgbWF0cml4IG9mIGVhY2ggb2YgdGhlIEdNTSBjbGFzc2VzXG4vLyBmb3IgZWFjaCBpbnB1dCBkYXRhLCBjb21wdXRlIHRoZSBkaXN0YW5jZSBvZiB0aGUgZnJhbWUgdG8gZWFjaCBvZiB0aGUgR01Nc1xuLy8gd2l0aCB0aGUgZm9sbG93aW5nIGVxdWF0aW9ucyA6XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gYXMgaW4geG1tR2F1c3NpYW5EaXN0cmlidXRpb24uY3BwIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuXG4vLyBmcm9tIHhtbUdhdXNzaWFuRGlzdHJpYnV0aW9uOjpyZWdyZXNzaW9uXG5leHBvcnQgY29uc3QgZ21tQ29tcG9uZW50UmVncmVzc2lvbiA9IChvYnNJbiwgcHJlZGljdE91dCwgYykgPT4ge1xuICBjb25zdCBkaW0gPSBjLmRpbWVuc2lvbjtcbiAgY29uc3QgZGltSW4gPSBjLmRpbWVuc2lvbl9pbnB1dDtcbiAgY29uc3QgZGltT3V0ID0gZGltIC0gZGltSW47XG4gIC8vbGV0IHByZWRpY3RlZE91dCA9IFtdO1xuICBwcmVkaWN0T3V0ID0gbmV3IEFycmF5KGRpbU91dCk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gIGlmIChjLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgIHByZWRpY3RPdXRbZF0gPSBjLm1lYW5bZGltSW4gKyBkXTtcbiAgICAgIGZvciAobGV0IGUgPSAwOyBlIDwgZGltSW47IGUrKykge1xuICAgICAgICBsZXQgdG1wID0gMC4wO1xuICAgICAgICBmb3IgKGxldCBmID0gMDsgZiA8IGRpbUluOyBmKyspIHtcbiAgICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VfaW5wdXRbZSAqIGRpbUluICsgZl0gKlxuICAgICAgICAgICAgICAgKG9ic0luW2ZdIC0gYy5tZWFuW2ZdKTtcbiAgICAgICAgfVxuICAgICAgICBwcmVkaWN0T3V0W2RdICs9IGMuY292YXJpYW5jZVsoZCArIGRpbUluKSAqIGRpbSArIGVdICogdG1wO1xuICAgICAgfVxuICAgIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgcHJlZGljdE91dFtkXSA9IGMuY292YXJpYW5jZVtkICsgZGltSW5dO1xuICAgIH1cbiAgfVxuICAvL3JldHVybiBwcmVkaWN0aW9uT3V0O1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tQ29tcG9uZW50TGlrZWxpaG9vZCA9IChvYnNJbiwgYykgPT4ge1xuICAvLyBpZihjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgPT09IDApIHtcbiAgLy8gIHJldHVybiB1bmRlZmluZWQ7XG4gIC8vIH1cbiAgbGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAoYy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uOyBsKyspIHtcbiAgICAgIGxldCB0bXAgPSAwLjA7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGMuZGltZW5zaW9uOyBrKyspIHtcbiAgICAgICAgdG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2wgKiBjLmRpbWVuc2lvbiArIGtdICpcbiAgICAgICAgICAgICAgIChvYnNJbltrXSAtIGMubWVhbltrXSkgKlxuICAgICAgICAgICAgICAgYy53ZWlnaHRzW2tdO1xuICAgICAgfVxuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqIHRtcCAqIGMud2VpZ2h0c1tsXTtcbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb247IGwrKykge1xuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbF0gKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGMud2VpZ2h0c1tsXSAqIGMud2VpZ2h0c1tsXTtcbiAgICB9XG4gIH1cblxuICBsZXQgcCA9IE1hdGguZXhwKC0wLjUgKiBldWNsaWRpYW5EaXN0YW5jZSkgL1xuICAgICAgTWF0aC5zcXJ0KFxuICAgICAgICBjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgKlxuICAgICAgICBNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb24pXG4gICAgICApO1xuXG4gIC8vaWYgKHAgPCAxZS0xODAgfHwgaXNOYU4ocCkgfHwgIU51bWJlci5pc0Zpbml0ZShNYXRoLmFicyhwKSkpIHtcbiAgaWYgKHAgPCAxZS0xODAgfHwgIU51bWJlci5pc0Zpbml0ZShwKSkge1xuICAgIHAgPSAxZS0xODA7XG4gIH1cblxuICByZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dCA9IChvYnNJbiwgYykgPT4ge1xuICAvLyBpZihjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgPT09IDApIHtcbiAgLy8gIHJldHVybiB1bmRlZmluZWQ7XG4gIC8vIH1cbiAgbGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBjLmRpbWVuc2lvbl9pbnB1dDsgbCsrKSB7XG4gICAgICBsZXQgdG1wID0gMC4wO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBjLmRpbWVuc2lvbl9pbnB1dDsgaysrKSB7XG4gICAgICAgIHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtsICogYy5kaW1lbnNpb25faW5wdXQgKyBrXSAqXG4gICAgICAgICAgICAgICAob2JzSW5ba10gLSBjLm1lYW5ba10pICpcbiAgICAgICAgICAgICAgIGMud2VpZ2h0c1trXTtcbiAgICAgIH1cbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IChvYnNJbltsXSAtIGMubWVhbltsXSkgKiB0bXAgKiBjLndlaWdodHNbbF07XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uX2lucHV0OyBsKyspIHtcbiAgICAgIC8vIG9yIHdvdWxkIGl0IGJlIGMuaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0W2xdID9cbiAgICAgIC8vIHNvdW5kcyBsb2dpYyAuLi4gYnV0LCBhY2NvcmRpbmcgdG8gSnVsZXMgKGNmIGUtbWFpbCksXG4gICAgICAvLyBub3QgcmVhbGx5IGltcG9ydGFudC5cbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0W2xdICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIChvYnNJbltsXSAtIGMubWVhbltsXSkgKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjLndlaWdodHNbbF0gKiBjLndlaWdodHNbbF07XG4gICAgfVxuICB9XG5cbiAgbGV0IHAgPSBNYXRoLmV4cCgtMC41ICogZXVjbGlkaWFuRGlzdGFuY2UpIC9cbiAgICAgIE1hdGguc3FydChcbiAgICAgICAgYy5jb3ZhcmlhbmNlX2RldGVybWluYW50X2lucHV0ICpcbiAgICAgICAgTWF0aC5wb3coMiAqIE1hdGguUEksIGMuZGltZW5zaW9uX2lucHV0KVxuICAgICAgKTtcblxuICBpZiAocCA8IDFlLTE4MCB8fGlzTmFOKHApIHx8IGlzTmFOKE1hdGguYWJzKHApKSkge1xuICAgIHAgPSAxZS0xODA7XG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRMaWtlbGlob29kQmltb2RhbCA9IChvYnNJbiwgb2JzT3V0LCBjKSA9PiB7XG4gIC8vIGlmKGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCA9PT0gMCkge1xuICAvLyAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgLy8gfVxuICBjb25zdCBkaW0gPSBjLmRpbWVuc2lvbjtcbiAgY29uc3QgZGltSW4gPSBjLmRpbWVuc2lvbl9pbnB1dDtcbiAgY29uc3QgZGltT3V0ID0gZGltIC0gZGltSW47XG4gIGxldCBldWNsaWRpYW5EaXN0YW5jZSA9IDAuMDtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBkaW07IGwrKykge1xuICAgICAgbGV0IHRtcCA9IDAuMDtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgZGltSW47IGsrKykge1xuICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbCAqIGRpbSArIGtdICpcbiAgICAgICAgICAgICAgIChvYnNJbltrXSAtIGMubWVhbltrXSkgKlxuICAgICAgICAgICAgICAgYy53ZWlnaHRzW2tdO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBkaW1PdXQ7IGsrKykge1xuICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbCAqIGRpbSArIGRpbUluICsga10gKlxuICAgICAgICAgICAgICAgKG9ic091dFtrXSAtIGMubWVhbltkaW1JbiAra10pO1xuICAgICAgfVxuICAgICAgaWYgKGwgPCBkaW1Jbikge1xuICAgICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICogdG1wICogYy53ZWlnaHRzW2xdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic091dFtsIC0gZGltSW5dIC0gYy5tZWFuW2xdKSAqIHRtcDtcbiAgICAgIH1cbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgZGltSW47IGwrKykge1xuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbF0gKlxuICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgIGMud2VpZ2h0c1tsXSAqIGMud2VpZ2h0c1tsXTtcbiAgICB9XG4gICAgZm9yIChsZXQgbCA9IGRpbUluOyBsIDwgZGltOyBsKyspIHtcbiAgICAgIGxldCBzcSA9IChvYnNPdXRbbCAtIGRpbUluXSAtIGMubWVhbltsXSkgKlxuICAgICAgICAgICAgICAgKG9ic091dFtsIC0gZGltSW5dIC0gYy5tZWFuW2xdKTtcbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2xdICogc3E7XG4gICAgfVxuICB9XG5cbiAgbGV0IHAgPSBNYXRoLmV4cCgtMC41ICogZXVjbGlkaWFuRGlzdGFuY2UpIC9cbiAgICAgIE1hdGguc3FydChcbiAgICAgICAgYy5jb3ZhcmlhbmNlX2RldGVybWluYW50ICpcbiAgICAgICAgTWF0aC5wb3coMiAqIE1hdGguUEksIGMuZGltZW5zaW9uKVxuICAgICAgKTtcblxuICBpZiAocCA8IDFlLTE4MCB8fCBpc05hTihwKSB8fCBpc05hTihNYXRoLmFicyhwKSkpIHtcbiAgICBwID0gMWUtMTgwO1xuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgIGFzIGluIHhtbUdtbVNpbmdsZUNsYXNzLmNwcCAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBnbW1SZWdyZXNzaW9uID0gKG9ic0luLCBtLCBtUmVzKSA9PiB7XG4gIGNvbnN0IGRpbSA9IG0uY29tcG9uZW50c1swXS5kaW1lbnNpb247XG4gIGNvbnN0IGRpbUluID0gbS5jb21wb25lbnRzWzBdLmRpbWVuc2lvbl9pbnB1dDtcbiAgY29uc3QgZGltT3V0ID0gZGltIC0gZGltSW47XG5cbiAgbVJlcy5vdXRwdXRfdmFsdWVzID0gbmV3IEFycmF5KGRpbU91dCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcbiAgICBtUmVzLm91dHB1dF92YWx1ZXNbaV0gPSAwLjA7XG4gIH1cblxuICBsZXQgb3V0Q292YXJTaXplO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dDtcbiAgfVxuICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlID0gbmV3IEFycmF5KG91dENvdmFyU2l6ZSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0Q292YXJTaXplOyBpKyspIHtcbiAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuICB9XG5cbiAgLypcbiAgLy8gdXNlbGVzcyA6IHJlaW5zdGFuY2lhdGVkIGluIGdtbUNvbXBvbmVudFJlZ3Jlc3Npb25cbiAgbGV0IHRtcFByZWRpY3RlZE91dHB1dCA9IG5ldyBBcnJheShkaW1PdXQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgdG1wUHJlZGljdGVkT3V0cHV0W2ldID0gMC4wO1xuICB9XG4gICovXG4gIGxldCB0bXBQcmVkaWN0ZWRPdXRwdXQ7XG5cbiAgZm9yIChsZXQgYyA9IDA7IGMgPCBtLmNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcbiAgICBnbW1Db21wb25lbnRSZWdyZXNzaW9uKFxuICAgICAgb2JzSW4sIHRtcFByZWRpY3RlZE91dHB1dCwgbS5jb21wb25lbnRzW2NdXG4gICAgKTtcbiAgICBsZXQgc3FiZXRhID0gbVJlcy5iZXRhW2NdICogbVJlcy5iZXRhW2NdO1xuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tkXSArPSBtUmVzLmJldGFbY10gKiB0bXBQcmVkaWN0ZWRPdXRwdXRbZF07XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgaWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgZm9yIChsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIrKykge1xuICAgICAgICAgIGxldCBpbmRleCA9IGQgKiBkaW1PdXQgKyBkMjtcbiAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XVxuICAgICAgICAgICAgKz0gc3FiZXRhICogbS5jb21wb25lbnRzW2NdLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XTtcbiAgICAgICAgfVxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF1cbiAgICAgICAgICArPSBzcWJldGEgKiBtLmNvbXBvbmVudHNbY10ub3V0cHV0X2NvdmFyaWFuY2VbZF07XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1PYnNQcm9iID0gKG9ic0luLCBzaW5nbGVHbW0sIGNvbXBvbmVudCA9IC0xKSA9PiB7XG4gIGNvbnN0IGNvZWZmcyA9IHNpbmdsZUdtbS5taXh0dXJlX2NvZWZmcztcbiAgLy9jb25zb2xlLmxvZyhjb2VmZnMpO1xuICAvL2lmKGNvZWZmcyA9PT0gdW5kZWZpbmVkKSBjb2VmZnMgPSBbMV07XG4gIGNvbnN0IGNvbXBvbmVudHMgPSBzaW5nbGVHbW0uY29tcG9uZW50cztcbiAgbGV0IHAgPSAwLjA7XG5cbiAgaWYgKGNvbXBvbmVudCA8IDApIHtcbiAgICBmb3IgKGxldCBjID0gMDsgYyA8IGNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcbiAgICAgIHAgKz0gZ21tT2JzUHJvYihvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcCA9IGNvZWZmc1tjb21wb25lbnRdICpcbiAgICAgIGdtbUNvbXBvbmVudExpa2VsaWhvb2Qob2JzSW4sIGNvbXBvbmVudHNbY29tcG9uZW50XSk7ICAgICAgIFxuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tT2JzUHJvYklucHV0ID0gKG9ic0luLCBzaW5nbGVHbW0sIGNvbXBvbmVudCA9IC0xKSA9PiB7XG4gIGNvbnN0IGNvZWZmcyA9IHNpbmdsZUdtbS5taXh0dXJlX2NvZWZmcztcbiAgY29uc3QgY29tcG9uZW50cyA9IHNpbmdsZUdtbS5jb21wb25lbnRzO1xuICBsZXQgcCA9IDAuMDtcblxuICBpZiAoY29tcG9uZW50IDwgMCkge1xuICAgIGZvcihsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgICBwICs9IGdtbU9ic1Byb2JJbnB1dChvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcCA9IGNvZWZmc1tjb21wb25lbnRdICpcbiAgICAgIGdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dChvYnNJbiwgY29tcG9uZW50c1tjb21wb25lbnRdKTsgICAgICBcbiAgfVxuICByZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbU9ic1Byb2JCaW1vZGFsID0gKG9ic0luLCBvYnNPdXQsIHNpbmdsZUdtbSwgY29tcG9uZW50ID0gLTEpID0+IHtcbiAgY29uc3QgY29lZmZzID0gc2luZ2xlR21tLm1peHR1cmVfY29lZmZzO1xuICBjb25zdCBjb21wb25lbnRzID0gc2luZ2xlR21tLmNvbXBvbmVudHM7XG4gIGxldCBwID0gMC4wO1xuXG4gIGlmIChjb21wb25lbnQgPCAwKSB7XG4gICAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgICBwICs9IGdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLCBvYnNPdXQsIHNpbmdsZUdtbSwgYyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHAgPSBjb2VmZnNbY29tcG9uZW50XSAqXG4gICAgICBnbW1Db21wb25lbnRMaWtlbGlob29kQmltb2RhbChvYnNJbiwgb2JzT3V0LCBjb21wb25lbnRzW2NvbXBvbmVudF0pO1xuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tTGlrZWxpaG9vZCA9IChvYnNJbiwgc2luZ2xlR21tLCBzaW5nbGVHbW1SZXMsIG9ic091dCA9IFtdKSA9PiB7XG4gIGNvbnN0IGNvbXBvbmVudHMgPSBzaW5nbGVHbW0uY29tcG9uZW50cztcbiAgY29uc3QgbVJlcyA9IHNpbmdsZUdtbVJlcztcbiAgbGV0IGxpa2VsaWhvb2QgPSAwLjA7XG4gIFxuICBmb3IgKGxldCBjID0gMDsgYyA8IGNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBiaW1vZGFsXG4gICAgaWYgKGNvbXBvbmVudHNbY10uYmltb2RhbCkge1xuICAgICAgaWYgKG9ic091dC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbVJlcy5iZXRhW2NdXG4gICAgICAgICAgPSBnbW1PYnNQcm9iSW5wdXQob2JzSW4sIHNpbmdsZUdtbSwgYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtUmVzLmJldGFbY11cbiAgICAgICAgICA9IGdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLCBvYnNPdXQsIHNpbmdsZUdtbSwgYyk7XG4gICAgICB9XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB1bmltb2RhbFxuICAgIH0gZWxzZSB7XG4gICAgICBtUmVzLmJldGFbY10gPSBnbW1PYnNQcm9iKG9ic0luLCBzaW5nbGVHbW0sIGMpO1xuICAgIH1cblxuICAgIGxpa2VsaWhvb2QgKz0gbVJlcy5iZXRhW2NdO1xuICB9XG5cbiAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgbVJlcy5iZXRhW2NdIC89IGxpa2VsaWhvb2Q7XG4gIH1cblxuICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCA9IGxpa2VsaWhvb2Q7XG5cbiAgLy8gYXMgaW4geG1tOjpTaW5nbGVDbGFzc0dNTTo6dXBkYXRlUmVzdWx0cyA6XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvL3Jlcy5saWtlbGlob29kX2J1ZmZlci51bnNoaWZ0KGxpa2VsaWhvb2QpO1xuICAvL3Jlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGgtLTtcbiAgLy8gVEhJUyBJUyBCRVRURVIgKGNpcmN1bGFyIGJ1ZmZlcilcbiAgY29uc3QgYnVmTGVuZ3RoID0gbVJlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGg7XG4gIG1SZXMubGlrZWxpaG9vZF9idWZmZXJbbVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleF0gPSBNYXRoLmxvZyhsaWtlbGlob29kKTtcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleFxuICAgID0gKG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXggKyAxKSAlIGJ1Zkxlbmd0aDtcbiAgLy8gc3VtIGFsbCBhcnJheSB2YWx1ZXMgOlxuICBtUmVzLmxvZ19saWtlbGlob29kID0gbVJlcy5saWtlbGlob29kX2J1ZmZlci5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcbiAgLy8gbVJlcy5sb2dfbGlrZWxpaG9vZCA9IDA7XG4gIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmTGVuZ3RoOyBpKyspIHtcbiAgLy8gICBtUmVzLmxvZ19saWtlbGlob29kICs9IG1SZXMubGlrZWxpaG9vZF9idWZmZXJbaV07XG4gIC8vIH1cbiAgbVJlcy5sb2dfbGlrZWxpaG9vZCAvPSBidWZMZW5ndGg7XG5cbiAgcmV0dXJuIGxpa2VsaWhvb2Q7XG59O1xuXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICAgICAgICAgYXMgaW4geG1tR21tLmNwcCAgICAgICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGdtbUZpbHRlciA9IChvYnNJbiwgZ21tLCBnbW1SZXMpID0+IHtcbiAgbGV0IGxpa2VsaWhvb2RzID0gW107XG4gIGNvbnN0IG1vZGVscyA9IGdtbS5tb2RlbHM7XG4gIGNvbnN0IG1SZXMgPSBnbW1SZXM7XG5cbiAgbGV0IG1heExvZ0xpa2VsaWhvb2QgPSAwO1xuICBsZXQgbm9ybUNvbnN0SW5zdGFudCA9IDA7XG4gIGxldCBub3JtQ29uc3RTbW9vdGhlZCA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgc2luZ2xlUmVzID0gbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXTtcbiAgICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV1cbiAgICAgID0gZ21tTGlrZWxpaG9vZChvYnNJbiwgbW9kZWxzW2ldLCBzaW5nbGVSZXMpO1xuXG4gICAgLy8gYXMgaW4geG1tOjpHTU06OnVwZGF0ZVJlc3VsdHMgOlxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA9IHNpbmdsZVJlcy5sb2dfbGlrZWxpaG9vZDtcbiAgICBtUmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldXG4gICAgICA9IE1hdGguZXhwKG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldKTtcbiAgICBtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXTtcbiAgICBtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgbm9ybUNvbnN0SW5zdGFudCArPSBtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcbiAgICBub3JtQ29uc3RTbW9vdGhlZCArPSBtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG5cbiAgICBpZiAoaSA9PSAwIHx8IG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldID4gbWF4TG9nTGlrZWxpaG9vZCkge1xuICAgICAgbWF4TG9nTGlrZWxpaG9vZCA9IG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldO1xuICAgICAgbVJlcy5saWtlbGllc3QgPSBpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgbVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gLz0gbm9ybUNvbnN0SW5zdGFudDtcbiAgICBtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gLz0gbm9ybUNvbnN0U21vb3RoZWQ7XG4gIH1cblxuICAvLyBpZiBtb2RlbCBpcyBiaW1vZGFsIDpcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0IHBhcmFtcyA9IGdtbS5zaGFyZWRfcGFyYW1ldGVycztcbiAgY29uc3QgY29uZmlnID0gZ21tLmNvbmZpZ3VyYXRpb247XG5cbiAgaWYgKHBhcmFtcy5iaW1vZGFsKSB7XG4gICAgbGV0IGRpbSA9IHBhcmFtcy5kaW1lbnNpb247XG4gICAgbGV0IGRpbUluID0gcGFyYW1zLmRpbWVuc2lvbl9pbnB1dDtcbiAgICBsZXQgZGltT3V0ID0gZGltIC0gZGltSW47XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGlrZWxpZXN0XG4gICAgaWYgKGNvbmZpZy5tdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yID09PSAwKSB7XG4gICAgICBtUmVzLm91dHB1dF92YWx1ZXNcbiAgICAgICAgPSBtUmVzLnNpbmdsZUNsYXNzTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0XVxuICAgICAgICAgICAgLm91dHB1dF92YWx1ZXM7XG4gICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlXG4gICAgICAgID0gbVJlcy5zaW5nbGVDbGFzc01vZGVsUmVzdWx0c1ttUmVzLmxpa2VsaWVzdF1cbiAgICAgICAgICAgIC5vdXRwdXRfY292YXJpYW5jZTsgICAgICAgICAgIFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG1peHR1cmVcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gemVyby1maWxsIG91dHB1dF92YWx1ZXMgYW5kIG91dHB1dF9jb3ZhcmlhbmNlXG4gICAgICBtUmVzLm91dHB1dF92YWx1ZXMgPSBuZXcgQXJyYXkoZGltT3V0KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICAgICAgfVxuXG4gICAgICBsZXQgb3V0Q292YXJTaXplO1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgIGlmIChjb25maWcuZGVmYXVsdF9wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PSAwKSB7XG4gICAgICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dCAqIGRpbU91dDtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQ7XG4gICAgICB9XG4gICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlID0gbmV3IEFycmF5KG91dENvdmFyU2l6ZSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG91dENvdmFyU2l6ZTsgaSsrKSB7XG4gICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gICAgICB9XG5cbiAgICAgIC8vIGNvbXB1dGUgdGhlIGFjdHVhbCB2YWx1ZXMgOlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHNtb290aE5vcm1MaWtlbGlob29kXG4gICAgICAgICAgPSBtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG4gICAgICAgIGxldCBzaW5nbGVSZXMgPSBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldO1xuICAgICAgICBmb3IgKGxldCBkID0gMDsgZCA8IGRpbU91dDsgaSsrKSB7XG4gICAgICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2RdICs9IHNtb290aE5vcm1MaWtlbGlob29kICpcbiAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlUmVzLm91dHB1dF92YWx1ZXNbZF07XG4gICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICAgIGlmIChjb25maWcuZGVmYXVsdF9wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgICAgICAgICAgZm9yIChsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIrKykge1xuICAgICAgICAgICAgICBsZXQgaW5kZXggPSBkICogZGltT3V0ICsgZDI7XG4gICAgICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdXG4gICAgICAgICAgICAgICAgKz0gc21vb3RoTm9ybUxpa2VsaWhvb2QgKlxuICAgICAgICAgICAgICAgICAgIHNpbmdsZVJlcy5vdXRwdXRfY292YXJpYW5jZVtpbmRleF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdXG4gICAgICAgICAgICAgICs9IHNtb290aE5vcm1MaWtlbGlob29kICpcbiAgICAgICAgICAgICAgICAgc2luZ2xlUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSAvKiBlbmQgaWYocGFyYW1zLmJpbW9kYWwpICovXG59O1xuIl19