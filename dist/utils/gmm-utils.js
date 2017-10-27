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
var gmmComponentRegression = exports.gmmComponentRegression = function gmmComponentRegression(obsIn, c) {
  var dim = c.dimension;
  var dimIn = c.dimension_input;
  var dimOut = dim - dimIn;
  var predictOut = new Array(dimOut);

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

  return predictOut;
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
    tmpPredictedOutput = gmmComponentRegression(obsIn, m.components[c]);
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

  var params = gmm.shared_parameters;
  var config = gmm.configuration;

  var maxLogLikelihood = 0;
  var normConstInstant = 0;
  var normConstSmoothed = 0;

  for (var i = 0; i < models.length; i++) {
    var singleRes = mRes.singleClassGmmModelResults[i];
    mRes.instant_likelihoods[i] = gmmLikelihood(obsIn, models[i], singleRes);

    if (params.bimodal) {
      gmmRegression(obsIn, models[i], singleRes);
    }

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
  if (params.bimodal) {
    var dim = params.dimension;
    var dimIn = params.dimension_input;
    var dimOut = dim - dimIn;

    //---------------------------------------------------------------- likeliest
    if (config.multiClass_regression_estimator === 0) {
      mRes.output_values = mRes.singleClassGmmModelResults[mRes.likeliest].output_values;
      mRes.output_covariance = mRes.singleClassGmmModelResults[mRes.likeliest].output_covariance;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdtbS11dGlscy5qcyJdLCJuYW1lcyI6WyJnbW1Db21wb25lbnRSZWdyZXNzaW9uIiwib2JzSW4iLCJjIiwiZGltIiwiZGltZW5zaW9uIiwiZGltSW4iLCJkaW1lbnNpb25faW5wdXQiLCJkaW1PdXQiLCJwcmVkaWN0T3V0IiwiQXJyYXkiLCJjb3ZhcmlhbmNlX21vZGUiLCJkIiwibWVhbiIsImUiLCJ0bXAiLCJmIiwiaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0IiwiY292YXJpYW5jZSIsImdtbUNvbXBvbmVudExpa2VsaWhvb2QiLCJldWNsaWRpYW5EaXN0YW5jZSIsImwiLCJrIiwiaW52ZXJzZV9jb3ZhcmlhbmNlIiwid2VpZ2h0cyIsInAiLCJNYXRoIiwiZXhwIiwic3FydCIsImNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQiLCJwb3ciLCJQSSIsImdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dCIsImNvdmFyaWFuY2VfZGV0ZXJtaW5hbnRfaW5wdXQiLCJpc05hTiIsImFicyIsImdtbUNvbXBvbmVudExpa2VsaWhvb2RCaW1vZGFsIiwib2JzT3V0Iiwic3EiLCJnbW1SZWdyZXNzaW9uIiwibSIsIm1SZXMiLCJjb21wb25lbnRzIiwib3V0cHV0X3ZhbHVlcyIsImkiLCJvdXRDb3ZhclNpemUiLCJwYXJhbWV0ZXJzIiwib3V0cHV0X2NvdmFyaWFuY2UiLCJ0bXBQcmVkaWN0ZWRPdXRwdXQiLCJsZW5ndGgiLCJzcWJldGEiLCJiZXRhIiwiZDIiLCJpbmRleCIsImdtbU9ic1Byb2IiLCJzaW5nbGVHbW0iLCJjb21wb25lbnQiLCJjb2VmZnMiLCJtaXh0dXJlX2NvZWZmcyIsImdtbU9ic1Byb2JJbnB1dCIsImdtbU9ic1Byb2JCaW1vZGFsIiwiZ21tTGlrZWxpaG9vZCIsInNpbmdsZUdtbVJlcyIsImxpa2VsaWhvb2QiLCJiaW1vZGFsIiwiaW5zdGFudF9saWtlbGlob29kIiwiYnVmTGVuZ3RoIiwibGlrZWxpaG9vZF9idWZmZXIiLCJsaWtlbGlob29kX2J1ZmZlcl9pbmRleCIsImxvZyIsImxvZ19saWtlbGlob29kIiwicmVkdWNlIiwiYSIsImIiLCJnbW1GaWx0ZXIiLCJnbW0iLCJnbW1SZXMiLCJsaWtlbGlob29kcyIsIm1vZGVscyIsInBhcmFtcyIsInNoYXJlZF9wYXJhbWV0ZXJzIiwiY29uZmlnIiwiY29uZmlndXJhdGlvbiIsIm1heExvZ0xpa2VsaWhvb2QiLCJub3JtQ29uc3RJbnN0YW50Iiwibm9ybUNvbnN0U21vb3RoZWQiLCJzaW5nbGVSZXMiLCJzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cyIsImluc3RhbnRfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9saWtlbGlob29kcyIsImluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kcyIsInNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMiLCJsaWtlbGllc3QiLCJtdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yIiwiZGVmYXVsdF9wYXJhbWV0ZXJzIiwic21vb3RoTm9ybUxpa2VsaWhvb2QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUlBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ08sSUFBTUEsMERBQXlCLFNBQXpCQSxzQkFBeUIsQ0FBQ0MsS0FBRCxFQUFRQyxDQUFSLEVBQWM7QUFDbEQsTUFBTUMsTUFBTUQsRUFBRUUsU0FBZDtBQUNBLE1BQU1DLFFBQVFILEVBQUVJLGVBQWhCO0FBQ0EsTUFBTUMsU0FBU0osTUFBTUUsS0FBckI7QUFDQSxNQUFJRyxhQUFhLElBQUlDLEtBQUosQ0FBVUYsTUFBVixDQUFqQjs7QUFFQTtBQUNBLE1BQUlMLEVBQUVRLGVBQUYsS0FBc0IsQ0FBMUIsRUFBNkI7QUFDM0IsU0FBSyxJQUFJQyxJQUFJLENBQWIsRUFBZ0JBLElBQUlKLE1BQXBCLEVBQTRCSSxHQUE1QixFQUFpQztBQUMvQkgsaUJBQVdHLENBQVgsSUFBZ0JULEVBQUVVLElBQUYsQ0FBT1AsUUFBUU0sQ0FBZixDQUFoQjtBQUNBLFdBQUssSUFBSUUsSUFBSSxDQUFiLEVBQWdCQSxJQUFJUixLQUFwQixFQUEyQlEsR0FBM0IsRUFBZ0M7QUFDOUIsWUFBSUMsTUFBTSxHQUFWO0FBQ0EsYUFBSyxJQUFJQyxJQUFJLENBQWIsRUFBZ0JBLElBQUlWLEtBQXBCLEVBQTJCVSxHQUEzQixFQUFnQztBQUM5QkQsaUJBQU9aLEVBQUVjLHdCQUFGLENBQTJCSCxJQUFJUixLQUFKLEdBQVlVLENBQXZDLEtBQ0RkLE1BQU1jLENBQU4sSUFBV2IsRUFBRVUsSUFBRixDQUFPRyxDQUFQLENBRFYsQ0FBUDtBQUVEO0FBQ0RQLG1CQUFXRyxDQUFYLEtBQWlCVCxFQUFFZSxVQUFGLENBQWEsQ0FBQ04sSUFBSU4sS0FBTCxJQUFjRixHQUFkLEdBQW9CVSxDQUFqQyxJQUFzQ0MsR0FBdkQ7QUFDRDtBQUNGO0FBQ0g7QUFDQyxHQWJELE1BYU87QUFDTCxTQUFLLElBQUlILEtBQUksQ0FBYixFQUFnQkEsS0FBSUosTUFBcEIsRUFBNEJJLElBQTVCLEVBQWlDO0FBQy9CSCxpQkFBV0csRUFBWCxJQUFnQlQsRUFBRWUsVUFBRixDQUFhTixLQUFJTixLQUFqQixDQUFoQjtBQUNEO0FBQ0Y7O0FBRUQsU0FBT0csVUFBUDtBQUNELENBM0JNOztBQThCQSxJQUFNVSwwREFBeUIsU0FBekJBLHNCQUF5QixDQUFDakIsS0FBRCxFQUFRQyxDQUFSLEVBQWM7QUFDbEQ7QUFDQTtBQUNBO0FBQ0EsTUFBSWlCLG9CQUFvQixHQUF4Qjs7QUFFQTtBQUNBLE1BQUlqQixFQUFFUSxlQUFGLEtBQXNCLENBQTFCLEVBQTZCO0FBQzNCLFNBQUssSUFBSVUsSUFBSSxDQUFiLEVBQWdCQSxJQUFJbEIsRUFBRUUsU0FBdEIsRUFBaUNnQixHQUFqQyxFQUFzQztBQUNwQyxVQUFJTixNQUFNLEdBQVY7QUFDQSxXQUFLLElBQUlPLElBQUksQ0FBYixFQUFnQkEsSUFBSW5CLEVBQUVFLFNBQXRCLEVBQWlDaUIsR0FBakMsRUFBc0M7QUFDcENQLGVBQU9aLEVBQUVvQixrQkFBRixDQUFxQkYsSUFBSWxCLEVBQUVFLFNBQU4sR0FBa0JpQixDQUF2QyxLQUNDcEIsTUFBTW9CLENBQU4sSUFBV25CLEVBQUVVLElBQUYsQ0FBT1MsQ0FBUCxDQURaLElBRUFuQixFQUFFcUIsT0FBRixDQUFVRixDQUFWLENBRlA7QUFHRDtBQUNERiwyQkFBcUIsQ0FBQ2xCLE1BQU1tQixDQUFOLElBQVdsQixFQUFFVSxJQUFGLENBQU9RLENBQVAsQ0FBWixJQUF5Qk4sR0FBekIsR0FBK0JaLEVBQUVxQixPQUFGLENBQVVILENBQVYsQ0FBcEQ7QUFDRDtBQUNIO0FBQ0MsR0FYRCxNQVdPO0FBQ0wsU0FBSyxJQUFJQSxLQUFJLENBQWIsRUFBZ0JBLEtBQUlsQixFQUFFRSxTQUF0QixFQUFpQ2dCLElBQWpDLEVBQXNDO0FBQ3BDRCwyQkFBcUJqQixFQUFFb0Isa0JBQUYsQ0FBcUJGLEVBQXJCLEtBQ0NuQixNQUFNbUIsRUFBTixJQUFXbEIsRUFBRVUsSUFBRixDQUFPUSxFQUFQLENBRFosS0FFQ25CLE1BQU1tQixFQUFOLElBQVdsQixFQUFFVSxJQUFGLENBQU9RLEVBQVAsQ0FGWixJQUdBbEIsRUFBRXFCLE9BQUYsQ0FBVUgsRUFBVixDQUhBLEdBR2VsQixFQUFFcUIsT0FBRixDQUFVSCxFQUFWLENBSHBDO0FBSUQ7QUFDRjs7QUFFRCxNQUFJSSxJQUFJQyxLQUFLQyxHQUFMLENBQVMsQ0FBQyxHQUFELEdBQU9QLGlCQUFoQixJQUNKTSxLQUFLRSxJQUFMLENBQ0V6QixFQUFFMEIsc0JBQUYsR0FDQUgsS0FBS0ksR0FBTCxDQUFTLElBQUlKLEtBQUtLLEVBQWxCLEVBQXNCNUIsRUFBRUUsU0FBeEIsQ0FGRixDQURKOztBQU1BO0FBQ0EsTUFBSW9CLElBQUksTUFBSixJQUFjLENBQUMsd0JBQWdCQSxDQUFoQixDQUFuQixFQUF1QztBQUNyQ0EsUUFBSSxNQUFKO0FBQ0Q7O0FBRUQsU0FBT0EsQ0FBUDtBQUNELENBdkNNOztBQTBDQSxJQUFNTyxvRUFBOEIsU0FBOUJBLDJCQUE4QixDQUFDOUIsS0FBRCxFQUFRQyxDQUFSLEVBQWM7QUFDdkQ7QUFDQTtBQUNBO0FBQ0EsTUFBSWlCLG9CQUFvQixHQUF4QjtBQUNBO0FBQ0EsTUFBSWpCLEVBQUVRLGVBQUYsS0FBc0IsQ0FBMUIsRUFBNkI7QUFDM0IsU0FBSyxJQUFJVSxJQUFJLENBQWIsRUFBZ0JBLElBQUlsQixFQUFFSSxlQUF0QixFQUF1Q2MsR0FBdkMsRUFBNEM7QUFDMUMsVUFBSU4sTUFBTSxHQUFWO0FBQ0EsV0FBSyxJQUFJTyxJQUFJLENBQWIsRUFBZ0JBLElBQUluQixFQUFFSSxlQUF0QixFQUF1Q2UsR0FBdkMsRUFBNEM7QUFDMUNQLGVBQU9aLEVBQUVjLHdCQUFGLENBQTJCSSxJQUFJbEIsRUFBRUksZUFBTixHQUF3QmUsQ0FBbkQsS0FDQ3BCLE1BQU1vQixDQUFOLElBQVduQixFQUFFVSxJQUFGLENBQU9TLENBQVAsQ0FEWixJQUVBbkIsRUFBRXFCLE9BQUYsQ0FBVUYsQ0FBVixDQUZQO0FBR0Q7QUFDREYsMkJBQXFCLENBQUNsQixNQUFNbUIsQ0FBTixJQUFXbEIsRUFBRVUsSUFBRixDQUFPUSxDQUFQLENBQVosSUFBeUJOLEdBQXpCLEdBQStCWixFQUFFcUIsT0FBRixDQUFVSCxDQUFWLENBQXBEO0FBQ0Q7QUFDSDtBQUNDLEdBWEQsTUFXTztBQUNMLFNBQUssSUFBSUEsTUFBSSxDQUFiLEVBQWdCQSxNQUFJbEIsRUFBRUksZUFBdEIsRUFBdUNjLEtBQXZDLEVBQTRDO0FBQzFDO0FBQ0E7QUFDQTtBQUNBRCwyQkFBcUJqQixFQUFFYyx3QkFBRixDQUEyQkksR0FBM0IsS0FDQ25CLE1BQU1tQixHQUFOLElBQVdsQixFQUFFVSxJQUFGLENBQU9RLEdBQVAsQ0FEWixLQUVDbkIsTUFBTW1CLEdBQU4sSUFBV2xCLEVBQUVVLElBQUYsQ0FBT1EsR0FBUCxDQUZaLElBR0FsQixFQUFFcUIsT0FBRixDQUFVSCxHQUFWLENBSEEsR0FHZWxCLEVBQUVxQixPQUFGLENBQVVILEdBQVYsQ0FIcEM7QUFJRDtBQUNGOztBQUVELE1BQUlJLElBQUlDLEtBQUtDLEdBQUwsQ0FBUyxDQUFDLEdBQUQsR0FBT1AsaUJBQWhCLElBQ0pNLEtBQUtFLElBQUwsQ0FDRXpCLEVBQUU4Qiw0QkFBRixHQUNBUCxLQUFLSSxHQUFMLENBQVMsSUFBSUosS0FBS0ssRUFBbEIsRUFBc0I1QixFQUFFSSxlQUF4QixDQUZGLENBREo7O0FBTUEsTUFBSWtCLElBQUksTUFBSixJQUFhUyxNQUFNVCxDQUFOLENBQWIsSUFBeUJTLE1BQU1SLEtBQUtTLEdBQUwsQ0FBU1YsQ0FBVCxDQUFOLENBQTdCLEVBQWlEO0FBQy9DQSxRQUFJLE1BQUo7QUFDRDtBQUNELFNBQU9BLENBQVA7QUFDRCxDQXZDTTs7QUEwQ0EsSUFBTVcsd0VBQWdDLFNBQWhDQSw2QkFBZ0MsQ0FBQ2xDLEtBQUQsRUFBUW1DLE1BQVIsRUFBZ0JsQyxDQUFoQixFQUFzQjtBQUNqRTtBQUNBO0FBQ0E7QUFDQSxNQUFNQyxNQUFNRCxFQUFFRSxTQUFkO0FBQ0EsTUFBTUMsUUFBUUgsRUFBRUksZUFBaEI7QUFDQSxNQUFNQyxTQUFTSixNQUFNRSxLQUFyQjtBQUNBLE1BQUljLG9CQUFvQixHQUF4Qjs7QUFFQTtBQUNBLE1BQUlqQixFQUFFUSxlQUFGLEtBQXNCLENBQTFCLEVBQTZCO0FBQzNCLFNBQUssSUFBSVUsSUFBSSxDQUFiLEVBQWdCQSxJQUFJakIsR0FBcEIsRUFBeUJpQixHQUF6QixFQUE4QjtBQUM1QixVQUFJTixNQUFNLEdBQVY7QUFDQSxXQUFLLElBQUlPLElBQUksQ0FBYixFQUFnQkEsSUFBSWhCLEtBQXBCLEVBQTJCZ0IsR0FBM0IsRUFBZ0M7QUFDOUJQLGVBQU9aLEVBQUVvQixrQkFBRixDQUFxQkYsSUFBSWpCLEdBQUosR0FBVWtCLENBQS9CLEtBQ0NwQixNQUFNb0IsQ0FBTixJQUFXbkIsRUFBRVUsSUFBRixDQUFPUyxDQUFQLENBRFosSUFFQW5CLEVBQUVxQixPQUFGLENBQVVGLENBQVYsQ0FGUDtBQUdEO0FBQ0QsV0FBSyxJQUFJQSxLQUFJLENBQWIsRUFBZ0JBLEtBQUlkLE1BQXBCLEVBQTRCYyxJQUE1QixFQUFpQztBQUMvQlAsZUFBT1osRUFBRW9CLGtCQUFGLENBQXFCRixJQUFJakIsR0FBSixHQUFVRSxLQUFWLEdBQWtCZ0IsRUFBdkMsS0FDQ2UsT0FBT2YsRUFBUCxJQUFZbkIsRUFBRVUsSUFBRixDQUFPUCxRQUFPZ0IsRUFBZCxDQURiLENBQVA7QUFFRDtBQUNELFVBQUlELElBQUlmLEtBQVIsRUFBZTtBQUNiYyw2QkFBcUIsQ0FBQ2xCLE1BQU1tQixDQUFOLElBQVdsQixFQUFFVSxJQUFGLENBQU9RLENBQVAsQ0FBWixJQUF5Qk4sR0FBekIsR0FBK0JaLEVBQUVxQixPQUFGLENBQVVILENBQVYsQ0FBcEQ7QUFDRCxPQUZELE1BRU87QUFDTEQsNkJBQXFCLENBQUNpQixPQUFPaEIsSUFBSWYsS0FBWCxJQUFvQkgsRUFBRVUsSUFBRixDQUFPUSxDQUFQLENBQXJCLElBQWtDTixHQUF2RDtBQUNEO0FBQ0Y7QUFDSDtBQUNDLEdBbkJELE1BbUJPO0FBQ0wsU0FBSyxJQUFJTSxNQUFJLENBQWIsRUFBZ0JBLE1BQUlmLEtBQXBCLEVBQTJCZSxLQUEzQixFQUFnQztBQUM5QkQsMkJBQXFCakIsRUFBRW9CLGtCQUFGLENBQXFCRixHQUFyQixLQUNUbkIsTUFBTW1CLEdBQU4sSUFBV2xCLEVBQUVVLElBQUYsQ0FBT1EsR0FBUCxDQURGLEtBRVRuQixNQUFNbUIsR0FBTixJQUFXbEIsRUFBRVUsSUFBRixDQUFPUSxHQUFQLENBRkYsSUFHVmxCLEVBQUVxQixPQUFGLENBQVVILEdBQVYsQ0FIVSxHQUdLbEIsRUFBRXFCLE9BQUYsQ0FBVUgsR0FBVixDQUgxQjtBQUlEO0FBQ0QsU0FBSyxJQUFJQSxNQUFJZixLQUFiLEVBQW9CZSxNQUFJakIsR0FBeEIsRUFBNkJpQixLQUE3QixFQUFrQztBQUNoQyxVQUFJaUIsS0FBSyxDQUFDRCxPQUFPaEIsTUFBSWYsS0FBWCxJQUFvQkgsRUFBRVUsSUFBRixDQUFPUSxHQUFQLENBQXJCLEtBQ0NnQixPQUFPaEIsTUFBSWYsS0FBWCxJQUFvQkgsRUFBRVUsSUFBRixDQUFPUSxHQUFQLENBRHJCLENBQVQ7QUFFQUQsMkJBQXFCakIsRUFBRW9CLGtCQUFGLENBQXFCRixHQUFyQixJQUEwQmlCLEVBQS9DO0FBQ0Q7QUFDRjs7QUFFRCxNQUFJYixJQUFJQyxLQUFLQyxHQUFMLENBQVMsQ0FBQyxHQUFELEdBQU9QLGlCQUFoQixJQUNKTSxLQUFLRSxJQUFMLENBQ0V6QixFQUFFMEIsc0JBQUYsR0FDQUgsS0FBS0ksR0FBTCxDQUFTLElBQUlKLEtBQUtLLEVBQWxCLEVBQXNCNUIsRUFBRUUsU0FBeEIsQ0FGRixDQURKOztBQU1BLE1BQUlvQixJQUFJLE1BQUosSUFBY1MsTUFBTVQsQ0FBTixDQUFkLElBQTBCUyxNQUFNUixLQUFLUyxHQUFMLENBQVNWLENBQVQsQ0FBTixDQUE5QixFQUFrRDtBQUNoREEsUUFBSSxNQUFKO0FBQ0Q7QUFDRCxTQUFPQSxDQUFQO0FBQ0QsQ0FyRE07O0FBd0RQO0FBQ0E7QUFDQTs7QUFFTyxJQUFNYyx3Q0FBZ0IsU0FBaEJBLGFBQWdCLENBQUNyQyxLQUFELEVBQVFzQyxDQUFSLEVBQVdDLElBQVgsRUFBb0I7QUFDL0MsTUFBTXJDLE1BQU1vQyxFQUFFRSxVQUFGLENBQWEsQ0FBYixFQUFnQnJDLFNBQTVCO0FBQ0EsTUFBTUMsUUFBUWtDLEVBQUVFLFVBQUYsQ0FBYSxDQUFiLEVBQWdCbkMsZUFBOUI7QUFDQSxNQUFNQyxTQUFTSixNQUFNRSxLQUFyQjs7QUFFQW1DLE9BQUtFLGFBQUwsR0FBcUIsSUFBSWpDLEtBQUosQ0FBVUYsTUFBVixDQUFyQjtBQUNBLE9BQUssSUFBSW9DLElBQUksQ0FBYixFQUFnQkEsSUFBSXBDLE1BQXBCLEVBQTRCb0MsR0FBNUIsRUFBaUM7QUFDL0JILFNBQUtFLGFBQUwsQ0FBbUJDLENBQW5CLElBQXdCLEdBQXhCO0FBQ0Q7O0FBRUQsTUFBSUMscUJBQUo7QUFDQTtBQUNBLE1BQUlMLEVBQUVNLFVBQUYsQ0FBYW5DLGVBQWIsS0FBaUMsQ0FBckMsRUFBd0M7QUFDdENrQyxtQkFBZXJDLFNBQVNBLE1BQXhCO0FBQ0Y7QUFDQyxHQUhELE1BR087QUFDTHFDLG1CQUFlckMsTUFBZjtBQUNEOztBQUVEaUMsT0FBS00saUJBQUwsR0FBeUIsSUFBSXJDLEtBQUosQ0FBVW1DLFlBQVYsQ0FBekI7QUFDQSxPQUFLLElBQUlELEtBQUksQ0FBYixFQUFnQkEsS0FBSUMsWUFBcEIsRUFBa0NELElBQWxDLEVBQXVDO0FBQ3JDSCxTQUFLTSxpQkFBTCxDQUF1QkgsRUFBdkIsSUFBNEIsR0FBNUI7QUFDRDs7QUFFRDs7Ozs7OztBQU9BLE1BQUlJLDJCQUFKOztBQUVBLE9BQUssSUFBSTdDLElBQUksQ0FBYixFQUFnQkEsSUFBSXFDLEVBQUVFLFVBQUYsQ0FBYU8sTUFBakMsRUFBeUM5QyxHQUF6QyxFQUE4QztBQUM1QzZDLHlCQUFxQi9DLHVCQUF1QkMsS0FBdkIsRUFBOEJzQyxFQUFFRSxVQUFGLENBQWF2QyxDQUFiLENBQTlCLENBQXJCO0FBQ0EsUUFBSStDLFNBQVNULEtBQUtVLElBQUwsQ0FBVWhELENBQVYsSUFBZXNDLEtBQUtVLElBQUwsQ0FBVWhELENBQVYsQ0FBNUI7O0FBRUEsU0FBSyxJQUFJUyxJQUFJLENBQWIsRUFBZ0JBLElBQUlKLE1BQXBCLEVBQTRCSSxHQUE1QixFQUFpQztBQUMvQjZCLFdBQUtFLGFBQUwsQ0FBbUIvQixDQUFuQixLQUF5QjZCLEtBQUtVLElBQUwsQ0FBVWhELENBQVYsSUFBZTZDLG1CQUFtQnBDLENBQW5CLENBQXhDO0FBQ0E7QUFDQSxVQUFJNEIsRUFBRU0sVUFBRixDQUFhbkMsZUFBYixLQUFpQyxDQUFyQyxFQUF3QztBQUN0QyxhQUFLLElBQUl5QyxLQUFLLENBQWQsRUFBaUJBLEtBQUs1QyxNQUF0QixFQUE4QjRDLElBQTlCLEVBQW9DO0FBQ2xDLGNBQUlDLFFBQVF6QyxJQUFJSixNQUFKLEdBQWE0QyxFQUF6QjtBQUNBWCxlQUFLTSxpQkFBTCxDQUF1Qk0sS0FBdkIsS0FDS0gsU0FBU1YsRUFBRUUsVUFBRixDQUFhdkMsQ0FBYixFQUFnQjRDLGlCQUFoQixDQUFrQ00sS0FBbEMsQ0FEZDtBQUVEO0FBQ0g7QUFDQyxPQVBELE1BT087QUFDTFosYUFBS00saUJBQUwsQ0FBdUJuQyxDQUF2QixLQUNLc0MsU0FBU1YsRUFBRUUsVUFBRixDQUFhdkMsQ0FBYixFQUFnQjRDLGlCQUFoQixDQUFrQ25DLENBQWxDLENBRGQ7QUFFRDtBQUNGO0FBQ0Y7QUFDRixDQXJETTs7QUF3REEsSUFBTTBDLGtDQUFhLFNBQWJBLFVBQWEsQ0FBQ3BELEtBQUQsRUFBUXFELFNBQVIsRUFBc0M7QUFBQSxNQUFuQkMsU0FBbUIsdUVBQVAsQ0FBQyxDQUFNOztBQUM5RCxNQUFNQyxTQUFTRixVQUFVRyxjQUF6QjtBQUNBLE1BQU1oQixhQUFhYSxVQUFVYixVQUE3QjtBQUNBLE1BQUlqQixJQUFJLEdBQVI7O0FBRUEsTUFBSStCLFlBQVksQ0FBaEIsRUFBbUI7QUFDakIsU0FBSyxJQUFJckQsSUFBSSxDQUFiLEVBQWdCQSxJQUFJdUMsV0FBV08sTUFBL0IsRUFBdUM5QyxHQUF2QyxFQUE0QztBQUMxQ3NCLFdBQUs2QixXQUFXcEQsS0FBWCxFQUFrQnFELFNBQWxCLEVBQTZCcEQsQ0FBN0IsQ0FBTDtBQUNEO0FBQ0YsR0FKRCxNQUlPO0FBQ0xzQixRQUFJZ0MsT0FBT0QsU0FBUCxJQUNGckMsdUJBQXVCakIsS0FBdkIsRUFBOEJ3QyxXQUFXYyxTQUFYLENBQTlCLENBREY7QUFFRDtBQUNELFNBQU8vQixDQUFQO0FBQ0QsQ0FkTTs7QUFpQkEsSUFBTWtDLDRDQUFrQixTQUFsQkEsZUFBa0IsQ0FBQ3pELEtBQUQsRUFBUXFELFNBQVIsRUFBc0M7QUFBQSxNQUFuQkMsU0FBbUIsdUVBQVAsQ0FBQyxDQUFNOztBQUNuRSxNQUFNQyxTQUFTRixVQUFVRyxjQUF6QjtBQUNBLE1BQU1oQixhQUFhYSxVQUFVYixVQUE3QjtBQUNBLE1BQUlqQixJQUFJLEdBQVI7O0FBRUEsTUFBSStCLFlBQVksQ0FBaEIsRUFBbUI7QUFDakIsU0FBSSxJQUFJckQsSUFBSSxDQUFaLEVBQWVBLElBQUl1QyxXQUFXTyxNQUE5QixFQUFzQzlDLEdBQXRDLEVBQTJDO0FBQ3pDc0IsV0FBS2tDLGdCQUFnQnpELEtBQWhCLEVBQXVCcUQsU0FBdkIsRUFBa0NwRCxDQUFsQyxDQUFMO0FBQ0Q7QUFDRixHQUpELE1BSU87QUFDTHNCLFFBQUlnQyxPQUFPRCxTQUFQLElBQ0Z4Qiw0QkFBNEI5QixLQUE1QixFQUFtQ3dDLFdBQVdjLFNBQVgsQ0FBbkMsQ0FERjtBQUVEO0FBQ0QsU0FBTy9CLENBQVA7QUFDRCxDQWRNOztBQWlCQSxJQUFNbUMsZ0RBQW9CLFNBQXBCQSxpQkFBb0IsQ0FBQzFELEtBQUQsRUFBUW1DLE1BQVIsRUFBZ0JrQixTQUFoQixFQUE4QztBQUFBLE1BQW5CQyxTQUFtQix1RUFBUCxDQUFDLENBQU07O0FBQzdFLE1BQU1DLFNBQVNGLFVBQVVHLGNBQXpCO0FBQ0EsTUFBTWhCLGFBQWFhLFVBQVViLFVBQTdCO0FBQ0EsTUFBSWpCLElBQUksR0FBUjs7QUFFQSxNQUFJK0IsWUFBWSxDQUFoQixFQUFtQjtBQUNqQixTQUFLLElBQUlyRCxJQUFJLENBQWIsRUFBZ0JBLElBQUl1QyxXQUFXTyxNQUEvQixFQUF1QzlDLEdBQXZDLEVBQTRDO0FBQzFDc0IsV0FBS21DLGtCQUFrQjFELEtBQWxCLEVBQXlCbUMsTUFBekIsRUFBaUNrQixTQUFqQyxFQUE0Q3BELENBQTVDLENBQUw7QUFDRDtBQUNGLEdBSkQsTUFJTztBQUNMc0IsUUFBSWdDLE9BQU9ELFNBQVAsSUFDRnBCLDhCQUE4QmxDLEtBQTlCLEVBQXFDbUMsTUFBckMsRUFBNkNLLFdBQVdjLFNBQVgsQ0FBN0MsQ0FERjtBQUVEO0FBQ0QsU0FBTy9CLENBQVA7QUFDRCxDQWRNOztBQWlCQSxJQUFNb0Msd0NBQWdCLFNBQWhCQSxhQUFnQixDQUFDM0QsS0FBRCxFQUFRcUQsU0FBUixFQUFtQk8sWUFBbkIsRUFBaUQ7QUFBQSxNQUFoQnpCLE1BQWdCLHVFQUFQLEVBQU87O0FBQzVFLE1BQU1LLGFBQWFhLFVBQVViLFVBQTdCO0FBQ0EsTUFBTUQsT0FBT3FCLFlBQWI7QUFDQSxNQUFJQyxhQUFhLEdBQWpCOztBQUVBLE9BQUssSUFBSTVELElBQUksQ0FBYixFQUFnQkEsSUFBSXVDLFdBQVdPLE1BQS9CLEVBQXVDOUMsR0FBdkMsRUFBNEM7QUFDMUM7QUFDQSxRQUFJdUMsV0FBV3ZDLENBQVgsRUFBYzZELE9BQWxCLEVBQTJCO0FBQ3pCLFVBQUkzQixPQUFPWSxNQUFQLEtBQWtCLENBQXRCLEVBQXlCO0FBQ3ZCUixhQUFLVSxJQUFMLENBQVVoRCxDQUFWLElBQ0l3RCxnQkFBZ0J6RCxLQUFoQixFQUF1QnFELFNBQXZCLEVBQWtDcEQsQ0FBbEMsQ0FESjtBQUVELE9BSEQsTUFHTztBQUNMc0MsYUFBS1UsSUFBTCxDQUFVaEQsQ0FBVixJQUNJeUQsa0JBQWtCMUQsS0FBbEIsRUFBeUJtQyxNQUF6QixFQUFpQ2tCLFNBQWpDLEVBQTRDcEQsQ0FBNUMsQ0FESjtBQUVEO0FBQ0g7QUFDQyxLQVRELE1BU087QUFDTHNDLFdBQUtVLElBQUwsQ0FBVWhELENBQVYsSUFBZW1ELFdBQVdwRCxLQUFYLEVBQWtCcUQsU0FBbEIsRUFBNkJwRCxDQUE3QixDQUFmO0FBQ0Q7O0FBRUQ0RCxrQkFBY3RCLEtBQUtVLElBQUwsQ0FBVWhELENBQVYsQ0FBZDtBQUNEOztBQUVELE9BQUssSUFBSUEsS0FBSSxDQUFiLEVBQWdCQSxLQUFJdUMsV0FBV08sTUFBL0IsRUFBdUM5QyxJQUF2QyxFQUE0QztBQUMxQ3NDLFNBQUtVLElBQUwsQ0FBVWhELEVBQVYsS0FBZ0I0RCxVQUFoQjtBQUNEOztBQUVEdEIsT0FBS3dCLGtCQUFMLEdBQTBCRixVQUExQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUcsWUFBWXpCLEtBQUswQixpQkFBTCxDQUF1QmxCLE1BQXpDO0FBQ0FSLE9BQUswQixpQkFBTCxDQUF1QjFCLEtBQUsyQix1QkFBNUIsSUFBdUQxQyxLQUFLMkMsR0FBTCxDQUFTTixVQUFULENBQXZEO0FBQ0F0QixPQUFLMkIsdUJBQUwsR0FDSSxDQUFDM0IsS0FBSzJCLHVCQUFMLEdBQStCLENBQWhDLElBQXFDRixTQUR6QztBQUVBO0FBQ0F6QixPQUFLNkIsY0FBTCxHQUFzQjdCLEtBQUswQixpQkFBTCxDQUF1QkksTUFBdkIsQ0FBOEIsVUFBQ0MsQ0FBRCxFQUFJQyxDQUFKO0FBQUEsV0FBVUQsSUFBSUMsQ0FBZDtBQUFBLEdBQTlCLEVBQStDLENBQS9DLENBQXRCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQWhDLE9BQUs2QixjQUFMLElBQXVCSixTQUF2Qjs7QUFFQSxTQUFPSCxVQUFQO0FBQ0QsQ0EvQ007O0FBa0RQO0FBQ0E7QUFDQTs7QUFFTyxJQUFNVyxnQ0FBWSxTQUFaQSxTQUFZLENBQUN4RSxLQUFELEVBQVF5RSxHQUFSLEVBQWFDLE1BQWIsRUFBd0I7QUFDL0MsTUFBSUMsY0FBYyxFQUFsQjtBQUNBLE1BQU1DLFNBQVNILElBQUlHLE1BQW5CO0FBQ0EsTUFBTXJDLE9BQU9tQyxNQUFiOztBQUVBLE1BQU1HLFNBQVNKLElBQUlLLGlCQUFuQjtBQUNBLE1BQU1DLFNBQVNOLElBQUlPLGFBQW5COztBQUVBLE1BQUlDLG1CQUFtQixDQUF2QjtBQUNBLE1BQUlDLG1CQUFtQixDQUF2QjtBQUNBLE1BQUlDLG9CQUFvQixDQUF4Qjs7QUFFQSxPQUFLLElBQUl6QyxJQUFJLENBQWIsRUFBZ0JBLElBQUlrQyxPQUFPN0IsTUFBM0IsRUFBbUNMLEdBQW5DLEVBQXdDO0FBQ3RDLFFBQUkwQyxZQUFZN0MsS0FBSzhDLDBCQUFMLENBQWdDM0MsQ0FBaEMsQ0FBaEI7QUFDQUgsU0FBSytDLG1CQUFMLENBQXlCNUMsQ0FBekIsSUFDSWlCLGNBQWMzRCxLQUFkLEVBQXFCNEUsT0FBT2xDLENBQVAsQ0FBckIsRUFBZ0MwQyxTQUFoQyxDQURKOztBQUdBLFFBQUlQLE9BQU9mLE9BQVgsRUFBb0I7QUFDbEJ6QixvQkFBY3JDLEtBQWQsRUFBcUI0RSxPQUFPbEMsQ0FBUCxDQUFyQixFQUFnQzBDLFNBQWhDO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBN0MsU0FBS2dELHdCQUFMLENBQThCN0MsQ0FBOUIsSUFBbUMwQyxVQUFVaEIsY0FBN0M7QUFDQTdCLFNBQUtpRCxvQkFBTCxDQUEwQjlDLENBQTFCLElBQ0lsQixLQUFLQyxHQUFMLENBQVNjLEtBQUtnRCx3QkFBTCxDQUE4QjdDLENBQTlCLENBQVQsQ0FESjtBQUVBSCxTQUFLa0QsOEJBQUwsQ0FBb0MvQyxDQUFwQyxJQUF5Q0gsS0FBSytDLG1CQUFMLENBQXlCNUMsQ0FBekIsQ0FBekM7QUFDQUgsU0FBS21ELCtCQUFMLENBQXFDaEQsQ0FBckMsSUFBMENILEtBQUtpRCxvQkFBTCxDQUEwQjlDLENBQTFCLENBQTFDOztBQUVBd0Msd0JBQW9CM0MsS0FBS2tELDhCQUFMLENBQW9DL0MsQ0FBcEMsQ0FBcEI7QUFDQXlDLHlCQUFxQjVDLEtBQUttRCwrQkFBTCxDQUFxQ2hELENBQXJDLENBQXJCOztBQUVBLFFBQUlBLEtBQUssQ0FBTCxJQUFVSCxLQUFLZ0Qsd0JBQUwsQ0FBOEI3QyxDQUE5QixJQUFtQ3VDLGdCQUFqRCxFQUFtRTtBQUNqRUEseUJBQW1CMUMsS0FBS2dELHdCQUFMLENBQThCN0MsQ0FBOUIsQ0FBbkI7QUFDQUgsV0FBS29ELFNBQUwsR0FBaUJqRCxDQUFqQjtBQUNEO0FBQ0Y7O0FBRUQsT0FBSyxJQUFJQSxNQUFJLENBQWIsRUFBZ0JBLE1BQUlrQyxPQUFPN0IsTUFBM0IsRUFBbUNMLEtBQW5DLEVBQXdDO0FBQ3RDSCxTQUFLa0QsOEJBQUwsQ0FBb0MvQyxHQUFwQyxLQUEwQ3dDLGdCQUExQztBQUNBM0MsU0FBS21ELCtCQUFMLENBQXFDaEQsR0FBckMsS0FBMkN5QyxpQkFBM0M7QUFDRDs7QUFFRDtBQUNBO0FBQ0EsTUFBSU4sT0FBT2YsT0FBWCxFQUFvQjtBQUNsQixRQUFJNUQsTUFBTTJFLE9BQU8xRSxTQUFqQjtBQUNBLFFBQUlDLFFBQVF5RSxPQUFPeEUsZUFBbkI7QUFDQSxRQUFJQyxTQUFTSixNQUFNRSxLQUFuQjs7QUFFQTtBQUNBLFFBQUkyRSxPQUFPYSwrQkFBUCxLQUEyQyxDQUEvQyxFQUFrRDtBQUNoRHJELFdBQUtFLGFBQUwsR0FDSUYsS0FBSzhDLDBCQUFMLENBQWdDOUMsS0FBS29ELFNBQXJDLEVBQ0dsRCxhQUZQO0FBR0FGLFdBQUtNLGlCQUFMLEdBQ0lOLEtBQUs4QywwQkFBTCxDQUFnQzlDLEtBQUtvRCxTQUFyQyxFQUNHOUMsaUJBRlA7QUFHRjtBQUNDLEtBUkQsTUFRTztBQUNMO0FBQ0FOLFdBQUtFLGFBQUwsR0FBcUIsSUFBSWpDLEtBQUosQ0FBVUYsTUFBVixDQUFyQjtBQUNBLFdBQUssSUFBSW9DLE1BQUksQ0FBYixFQUFnQkEsTUFBSXBDLE1BQXBCLEVBQTRCb0MsS0FBNUIsRUFBaUM7QUFDL0JILGFBQUtFLGFBQUwsQ0FBbUJDLEdBQW5CLElBQXdCLEdBQXhCO0FBQ0Q7O0FBRUQsVUFBSUMscUJBQUo7QUFDQTtBQUNBLFVBQUlvQyxPQUFPYyxrQkFBUCxDQUEwQnBGLGVBQTFCLElBQTZDLENBQWpELEVBQW9EO0FBQ2xEa0MsdUJBQWVyQyxTQUFTQSxNQUF4QjtBQUNGO0FBQ0MsT0FIRCxNQUdPO0FBQ0xxQyx1QkFBZXJDLE1BQWY7QUFDRDtBQUNEaUMsV0FBS00saUJBQUwsR0FBeUIsSUFBSXJDLEtBQUosQ0FBVW1DLFlBQVYsQ0FBekI7QUFDQSxXQUFLLElBQUlELE1BQUksQ0FBYixFQUFnQkEsTUFBSUMsWUFBcEIsRUFBa0NELEtBQWxDLEVBQXVDO0FBQ3JDSCxhQUFLTSxpQkFBTCxDQUF1QkgsR0FBdkIsSUFBNEIsR0FBNUI7QUFDRDs7QUFFRDtBQUNBLFdBQUssSUFBSUEsTUFBSSxDQUFiLEVBQWdCQSxNQUFJa0MsT0FBTzdCLE1BQTNCLEVBQW1DTCxLQUFuQyxFQUF3QztBQUN0QyxZQUFJb0QsdUJBQ0F2RCxLQUFLbUQsK0JBQUwsQ0FBcUNoRCxHQUFyQyxDQURKO0FBRUEsWUFBSTBDLGFBQVk3QyxLQUFLOEMsMEJBQUwsQ0FBZ0MzQyxHQUFoQyxDQUFoQjtBQUNBLGFBQUssSUFBSWhDLElBQUksQ0FBYixFQUFnQkEsSUFBSUosTUFBcEIsRUFBNEJvQyxLQUE1QixFQUFpQztBQUMvQkgsZUFBS0UsYUFBTCxDQUFtQi9CLENBQW5CLEtBQXlCb0YsdUJBQ1pWLFdBQVUzQyxhQUFWLENBQXdCL0IsQ0FBeEIsQ0FEYjtBQUVBO0FBQ0EsY0FBSXFFLE9BQU9jLGtCQUFQLENBQTBCcEYsZUFBMUIsS0FBOEMsQ0FBbEQsRUFBcUQ7QUFDbkQsaUJBQUssSUFBSXlDLEtBQUssQ0FBZCxFQUFpQkEsS0FBSzVDLE1BQXRCLEVBQThCNEMsSUFBOUIsRUFBb0M7QUFDbEMsa0JBQUlDLFFBQVF6QyxJQUFJSixNQUFKLEdBQWE0QyxFQUF6QjtBQUNBWCxtQkFBS00saUJBQUwsQ0FBdUJNLEtBQXZCLEtBQ0syQyx1QkFDQVYsV0FBVXZDLGlCQUFWLENBQTRCTSxLQUE1QixDQUZMO0FBR0Q7QUFDSDtBQUNDLFdBUkQsTUFRTztBQUNMWixpQkFBS00saUJBQUwsQ0FBdUJuQyxDQUF2QixLQUNLb0YsdUJBQ0FWLFdBQVV2QyxpQkFBVixDQUE0Qm5DLENBQTVCLENBRkw7QUFHRDtBQUNGO0FBQ0Y7QUFDRjtBQUNGLEdBeEc4QyxDQXdHN0M7QUFDSCxDQXpHTSIsImZpbGUiOiJnbW0tdXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqICBmdW5jdGlvbnMgdXNlZCBmb3IgZGVjb2RpbmcsIHRyYW5zbGF0ZWQgZnJvbSBYTU1cbiAqL1xuXG4vLyBUT0RPIDogd3JpdGUgbWV0aG9kcyBmb3IgZ2VuZXJhdGluZyBtb2RlbFJlc3VsdHMgb2JqZWN0XG5cbi8vIGdldCB0aGUgaW52ZXJzZV9jb3ZhcmlhbmNlcyBtYXRyaXggb2YgZWFjaCBvZiB0aGUgR01NIGNsYXNzZXNcbi8vIGZvciBlYWNoIGlucHV0IGRhdGEsIGNvbXB1dGUgdGhlIGRpc3RhbmNlIG9mIHRoZSBmcmFtZSB0byBlYWNoIG9mIHRoZSBHTU1zXG4vLyB3aXRoIHRoZSBmb2xsb3dpbmcgZXF1YXRpb25zIDpcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyBhcyBpbiB4bW1HYXVzc2lhbkRpc3RyaWJ1dGlvbi5jcHAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5cbi8vIGZyb20geG1tR2F1c3NpYW5EaXN0cmlidXRpb246OnJlZ3Jlc3Npb25cbmV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRSZWdyZXNzaW9uID0gKG9ic0luLCBjKSA9PiB7XG4gIGNvbnN0IGRpbSA9IGMuZGltZW5zaW9uO1xuICBjb25zdCBkaW1JbiA9IGMuZGltZW5zaW9uX2lucHV0O1xuICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcbiAgbGV0IHByZWRpY3RPdXQgPSBuZXcgQXJyYXkoZGltT3V0KTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgcHJlZGljdE91dFtkXSA9IGMubWVhbltkaW1JbiArIGRdO1xuICAgICAgZm9yIChsZXQgZSA9IDA7IGUgPCBkaW1JbjsgZSsrKSB7XG4gICAgICAgIGxldCB0bXAgPSAwLjA7XG4gICAgICAgIGZvciAobGV0IGYgPSAwOyBmIDwgZGltSW47IGYrKykge1xuICAgICAgICAgIHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtlICogZGltSW4gKyBmXSAqXG4gICAgICAgICAgICAgICAob2JzSW5bZl0gLSBjLm1lYW5bZl0pO1xuICAgICAgICB9XG4gICAgICAgIHByZWRpY3RPdXRbZF0gKz0gYy5jb3ZhcmlhbmNlWyhkICsgZGltSW4pICogZGltICsgZV0gKiB0bXA7XG4gICAgICB9XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBkID0gMDsgZCA8IGRpbU91dDsgZCsrKSB7XG4gICAgICBwcmVkaWN0T3V0W2RdID0gYy5jb3ZhcmlhbmNlW2QgKyBkaW1Jbl07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHByZWRpY3RPdXQ7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRMaWtlbGlob29kID0gKG9ic0luLCBjKSA9PiB7XG4gIC8vIGlmKGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCA9PT0gMCkge1xuICAvLyAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgLy8gfVxuICBsZXQgZXVjbGlkaWFuRGlzdGFuY2UgPSAwLjA7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gIGlmIChjLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb247IGwrKykge1xuICAgICAgbGV0IHRtcCA9IDAuMDtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgYy5kaW1lbnNpb247IGsrKykge1xuICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbCAqIGMuZGltZW5zaW9uICsga10gKlxuICAgICAgICAgICAgICAgKG9ic0luW2tdIC0gYy5tZWFuW2tdKSAqXG4gICAgICAgICAgICAgICBjLndlaWdodHNba107XG4gICAgICB9XG4gICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICogdG1wICogYy53ZWlnaHRzW2xdO1xuICAgIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBjLmRpbWVuc2lvbjsgbCsrKSB7XG4gICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSBjLmludmVyc2VfY292YXJpYW5jZVtsXSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIChvYnNJbltsXSAtIGMubWVhbltsXSkgKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYy53ZWlnaHRzW2xdICogYy53ZWlnaHRzW2xdO1xuICAgIH1cbiAgfVxuXG4gIGxldCBwID0gTWF0aC5leHAoLTAuNSAqIGV1Y2xpZGlhbkRpc3RhbmNlKSAvXG4gICAgICBNYXRoLnNxcnQoXG4gICAgICAgIGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCAqXG4gICAgICAgIE1hdGgucG93KDIgKiBNYXRoLlBJLCBjLmRpbWVuc2lvbilcbiAgICAgICk7XG5cbiAgLy9pZiAocCA8IDFlLTE4MCB8fCBpc05hTihwKSB8fCAhTnVtYmVyLmlzRmluaXRlKE1hdGguYWJzKHApKSkge1xuICBpZiAocCA8IDFlLTE4MCB8fCAhTnVtYmVyLmlzRmluaXRlKHApKSB7XG4gICAgcCA9IDFlLTE4MDtcbiAgfVxuXG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tQ29tcG9uZW50TGlrZWxpaG9vZElucHV0ID0gKG9ic0luLCBjKSA9PiB7XG4gIC8vIGlmKGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCA9PT0gMCkge1xuICAvLyAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgLy8gfVxuICBsZXQgZXVjbGlkaWFuRGlzdGFuY2UgPSAwLjA7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAoYy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uX2lucHV0OyBsKyspIHtcbiAgICAgIGxldCB0bXAgPSAwLjA7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGMuZGltZW5zaW9uX2lucHV0OyBrKyspIHtcbiAgICAgICAgdG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0W2wgKiBjLmRpbWVuc2lvbl9pbnB1dCArIGtdICpcbiAgICAgICAgICAgICAgIChvYnNJbltrXSAtIGMubWVhbltrXSkgKlxuICAgICAgICAgICAgICAgYy53ZWlnaHRzW2tdO1xuICAgICAgfVxuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqIHRtcCAqIGMud2VpZ2h0c1tsXTtcbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb25faW5wdXQ7IGwrKykge1xuICAgICAgLy8gb3Igd291bGQgaXQgYmUgYy5pbnZlcnNlX2NvdmFyaWFuY2VfaW5wdXRbbF0gP1xuICAgICAgLy8gc291bmRzIGxvZ2ljIC4uLiBidXQsIGFjY29yZGluZyB0byBKdWxlcyAoY2YgZS1tYWlsKSxcbiAgICAgIC8vIG5vdCByZWFsbHkgaW1wb3J0YW50LlxuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VfaW5wdXRbbF0gKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGMud2VpZ2h0c1tsXSAqIGMud2VpZ2h0c1tsXTtcbiAgICB9XG4gIH1cblxuICBsZXQgcCA9IE1hdGguZXhwKC0wLjUgKiBldWNsaWRpYW5EaXN0YW5jZSkgL1xuICAgICAgTWF0aC5zcXJ0KFxuICAgICAgICBjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnRfaW5wdXQgKlxuICAgICAgICBNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb25faW5wdXQpXG4gICAgICApO1xuXG4gIGlmIChwIDwgMWUtMTgwIHx8aXNOYU4ocCkgfHwgaXNOYU4oTWF0aC5hYnMocCkpKSB7XG4gICAgcCA9IDFlLTE4MDtcbiAgfVxuICByZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2RCaW1vZGFsID0gKG9ic0luLCBvYnNPdXQsIGMpID0+IHtcbiAgLy8gaWYoYy5jb3ZhcmlhbmNlX2RldGVybWluYW50ID09PSAwKSB7XG4gIC8vICByZXR1cm4gdW5kZWZpbmVkO1xuICAvLyB9XG4gIGNvbnN0IGRpbSA9IGMuZGltZW5zaW9uO1xuICBjb25zdCBkaW1JbiA9IGMuZGltZW5zaW9uX2lucHV0O1xuICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcbiAgbGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAoYy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGRpbTsgbCsrKSB7XG4gICAgICBsZXQgdG1wID0gMC4wO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBkaW1JbjsgaysrKSB7XG4gICAgICAgIHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZVtsICogZGltICsga10gKlxuICAgICAgICAgICAgICAgKG9ic0luW2tdIC0gYy5tZWFuW2tdKSAqXG4gICAgICAgICAgICAgICBjLndlaWdodHNba107XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGRpbU91dDsgaysrKSB7XG4gICAgICAgIHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZVtsICogZGltICsgZGltSW4gKyBrXSAqXG4gICAgICAgICAgICAgICAob2JzT3V0W2tdIC0gYy5tZWFuW2RpbUluICtrXSk7XG4gICAgICB9XG4gICAgICBpZiAobCA8IGRpbUluKSB7XG4gICAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IChvYnNJbltsXSAtIGMubWVhbltsXSkgKiB0bXAgKiBjLndlaWdodHNbbF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSAob2JzT3V0W2wgLSBkaW1Jbl0gLSBjLm1lYW5bbF0pICogdG1wO1xuICAgICAgfVxuICAgIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBkaW1JbjsgbCsrKSB7XG4gICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSBjLmludmVyc2VfY292YXJpYW5jZVtsXSAqXG4gICAgICAgICAgICAgICAgIChvYnNJbltsXSAtIGMubWVhbltsXSkgKlxuICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgYy53ZWlnaHRzW2xdICogYy53ZWlnaHRzW2xdO1xuICAgIH1cbiAgICBmb3IgKGxldCBsID0gZGltSW47IGwgPCBkaW07IGwrKykge1xuICAgICAgbGV0IHNxID0gKG9ic091dFtsIC0gZGltSW5dIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAob2JzT3V0W2wgLSBkaW1Jbl0gLSBjLm1lYW5bbF0pO1xuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbF0gKiBzcTtcbiAgICB9XG4gIH1cblxuICBsZXQgcCA9IE1hdGguZXhwKC0wLjUgKiBldWNsaWRpYW5EaXN0YW5jZSkgL1xuICAgICAgTWF0aC5zcXJ0KFxuICAgICAgICBjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgKlxuICAgICAgICBNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb24pXG4gICAgICApO1xuXG4gIGlmIChwIDwgMWUtMTgwIHx8IGlzTmFOKHApIHx8IGlzTmFOKE1hdGguYWJzKHApKSkge1xuICAgIHAgPSAxZS0xODA7XG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICAgYXMgaW4geG1tR21tU2luZ2xlQ2xhc3MuY3BwICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGdtbVJlZ3Jlc3Npb24gPSAob2JzSW4sIG0sIG1SZXMpID0+IHtcbiAgY29uc3QgZGltID0gbS5jb21wb25lbnRzWzBdLmRpbWVuc2lvbjtcbiAgY29uc3QgZGltSW4gPSBtLmNvbXBvbmVudHNbMF0uZGltZW5zaW9uX2lucHV0O1xuICBjb25zdCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICBtUmVzLm91dHB1dF92YWx1ZXMgPSBuZXcgQXJyYXkoZGltT3V0KTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgfVxuXG4gIGxldCBvdXRDb3ZhclNpemU7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dCAqIGRpbU91dDtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgb3V0Q292YXJTaXplID0gZGltT3V0O1xuICB9XG5cbiAgbVJlcy5vdXRwdXRfY292YXJpYW5jZSA9IG5ldyBBcnJheShvdXRDb3ZhclNpemUpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG91dENvdmFyU2l6ZTsgaSsrKSB7XG4gICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtpXSA9IDAuMDtcbiAgfVxuXG4gIC8qXG4gIC8vIHVzZWxlc3MgOiByZWluc3RhbmNpYXRlZCBpbiBnbW1Db21wb25lbnRSZWdyZXNzaW9uXG4gIGxldCB0bXBQcmVkaWN0ZWRPdXRwdXQgPSBuZXcgQXJyYXkoZGltT3V0KTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgIHRtcFByZWRpY3RlZE91dHB1dFtpXSA9IDAuMDtcbiAgfVxuICAqL1xuICBsZXQgdG1wUHJlZGljdGVkT3V0cHV0O1xuXG4gIGZvciAobGV0IGMgPSAwOyBjIDwgbS5jb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgdG1wUHJlZGljdGVkT3V0cHV0ID0gZ21tQ29tcG9uZW50UmVncmVzc2lvbihvYnNJbiwgbS5jb21wb25lbnRzW2NdKTtcbiAgICBsZXQgc3FiZXRhID0gbVJlcy5iZXRhW2NdICogbVJlcy5iZXRhW2NdO1xuXG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2RdICs9IG1SZXMuYmV0YVtjXSAqIHRtcFByZWRpY3RlZE91dHB1dFtkXTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICBpZiAobS5wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG4gICAgICAgICAgbGV0IGluZGV4ID0gZCAqIGRpbU91dCArIGQyO1xuICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdXG4gICAgICAgICAgICArPSBzcWJldGEgKiBtLmNvbXBvbmVudHNbY10ub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdO1xuICAgICAgICB9XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtkXVxuICAgICAgICAgICs9IHNxYmV0YSAqIG0uY29tcG9uZW50c1tjXS5vdXRwdXRfY292YXJpYW5jZVtkXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbU9ic1Byb2IgPSAob2JzSW4sIHNpbmdsZUdtbSwgY29tcG9uZW50ID0gLTEpID0+IHtcbiAgY29uc3QgY29lZmZzID0gc2luZ2xlR21tLm1peHR1cmVfY29lZmZzO1xuICBjb25zdCBjb21wb25lbnRzID0gc2luZ2xlR21tLmNvbXBvbmVudHM7XG4gIGxldCBwID0gMC4wO1xuXG4gIGlmIChjb21wb25lbnQgPCAwKSB7XG4gICAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgICBwICs9IGdtbU9ic1Byb2Iob2JzSW4sIHNpbmdsZUdtbSwgYyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHAgPSBjb2VmZnNbY29tcG9uZW50XSAqXG4gICAgICBnbW1Db21wb25lbnRMaWtlbGlob29kKG9ic0luLCBjb21wb25lbnRzW2NvbXBvbmVudF0pO1xuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tT2JzUHJvYklucHV0ID0gKG9ic0luLCBzaW5nbGVHbW0sIGNvbXBvbmVudCA9IC0xKSA9PiB7XG4gIGNvbnN0IGNvZWZmcyA9IHNpbmdsZUdtbS5taXh0dXJlX2NvZWZmcztcbiAgY29uc3QgY29tcG9uZW50cyA9IHNpbmdsZUdtbS5jb21wb25lbnRzO1xuICBsZXQgcCA9IDAuMDtcblxuICBpZiAoY29tcG9uZW50IDwgMCkge1xuICAgIGZvcihsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgICBwICs9IGdtbU9ic1Byb2JJbnB1dChvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcCA9IGNvZWZmc1tjb21wb25lbnRdICpcbiAgICAgIGdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dChvYnNJbiwgY29tcG9uZW50c1tjb21wb25lbnRdKTtcbiAgfVxuICByZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbU9ic1Byb2JCaW1vZGFsID0gKG9ic0luLCBvYnNPdXQsIHNpbmdsZUdtbSwgY29tcG9uZW50ID0gLTEpID0+IHtcbiAgY29uc3QgY29lZmZzID0gc2luZ2xlR21tLm1peHR1cmVfY29lZmZzO1xuICBjb25zdCBjb21wb25lbnRzID0gc2luZ2xlR21tLmNvbXBvbmVudHM7XG4gIGxldCBwID0gMC4wO1xuXG4gIGlmIChjb21wb25lbnQgPCAwKSB7XG4gICAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgICBwICs9IGdtbU9ic1Byb2JCaW1vZGFsKG9ic0luLCBvYnNPdXQsIHNpbmdsZUdtbSwgYyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHAgPSBjb2VmZnNbY29tcG9uZW50XSAqXG4gICAgICBnbW1Db21wb25lbnRMaWtlbGlob29kQmltb2RhbChvYnNJbiwgb2JzT3V0LCBjb21wb25lbnRzW2NvbXBvbmVudF0pO1xuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tTGlrZWxpaG9vZCA9IChvYnNJbiwgc2luZ2xlR21tLCBzaW5nbGVHbW1SZXMsIG9ic091dCA9IFtdKSA9PiB7XG4gIGNvbnN0IGNvbXBvbmVudHMgPSBzaW5nbGVHbW0uY29tcG9uZW50cztcbiAgY29uc3QgbVJlcyA9IHNpbmdsZUdtbVJlcztcbiAgbGV0IGxpa2VsaWhvb2QgPSAwLjA7XG5cbiAgZm9yIChsZXQgYyA9IDA7IGMgPCBjb21wb25lbnRzLmxlbmd0aDsgYysrKSB7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYmltb2RhbFxuICAgIGlmIChjb21wb25lbnRzW2NdLmJpbW9kYWwpIHtcbiAgICAgIGlmIChvYnNPdXQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIG1SZXMuYmV0YVtjXVxuICAgICAgICAgID0gZ21tT2JzUHJvYklucHV0KG9ic0luLCBzaW5nbGVHbW0sIGMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbVJlcy5iZXRhW2NdXG4gICAgICAgICAgPSBnbW1PYnNQcm9iQmltb2RhbChvYnNJbiwgb2JzT3V0LCBzaW5nbGVHbW0sIGMpO1xuICAgICAgfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdW5pbW9kYWxcbiAgICB9IGVsc2Uge1xuICAgICAgbVJlcy5iZXRhW2NdID0gZ21tT2JzUHJvYihvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICB9XG5cbiAgICBsaWtlbGlob29kICs9IG1SZXMuYmV0YVtjXTtcbiAgfVxuXG4gIGZvciAobGV0IGMgPSAwOyBjIDwgY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgIG1SZXMuYmV0YVtjXSAvPSBsaWtlbGlob29kO1xuICB9XG5cbiAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgPSBsaWtlbGlob29kO1xuXG4gIC8vIGFzIGluIHhtbTo6U2luZ2xlQ2xhc3NHTU06OnVwZGF0ZVJlc3VsdHMgOlxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy9yZXMubGlrZWxpaG9vZF9idWZmZXIudW5zaGlmdChsaWtlbGlob29kKTtcbiAgLy9yZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoLS07XG4gIC8vIFRISVMgSVMgQkVUVEVSIChjaXJjdWxhciBidWZmZXIpXG4gIGNvbnN0IGJ1Zkxlbmd0aCA9IG1SZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoO1xuICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW21SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhdID0gTWF0aC5sb2cobGlrZWxpaG9vZCk7XG4gIG1SZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXhcbiAgICA9IChtUmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4ICsgMSkgJSBidWZMZW5ndGg7XG4gIC8vIHN1bSBhbGwgYXJyYXkgdmFsdWVzIDpcbiAgbVJlcy5sb2dfbGlrZWxpaG9vZCA9IG1SZXMubGlrZWxpaG9vZF9idWZmZXIucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCk7XG4gIC8vIG1SZXMubG9nX2xpa2VsaWhvb2QgPSAwO1xuICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IGJ1Zkxlbmd0aDsgaSsrKSB7XG4gIC8vICAgbVJlcy5sb2dfbGlrZWxpaG9vZCArPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyW2ldO1xuICAvLyB9XG4gIG1SZXMubG9nX2xpa2VsaWhvb2QgLz0gYnVmTGVuZ3RoO1xuXG4gIHJldHVybiBsaWtlbGlob29kO1xufTtcblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgICAgICAgIGFzIGluIHhtbUdtbS5jcHAgICAgICAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBnbW1GaWx0ZXIgPSAob2JzSW4sIGdtbSwgZ21tUmVzKSA9PiB7XG4gIGxldCBsaWtlbGlob29kcyA9IFtdO1xuICBjb25zdCBtb2RlbHMgPSBnbW0ubW9kZWxzO1xuICBjb25zdCBtUmVzID0gZ21tUmVzO1xuXG4gIGNvbnN0IHBhcmFtcyA9IGdtbS5zaGFyZWRfcGFyYW1ldGVycztcbiAgY29uc3QgY29uZmlnID0gZ21tLmNvbmZpZ3VyYXRpb247XG5cbiAgbGV0IG1heExvZ0xpa2VsaWhvb2QgPSAwO1xuICBsZXQgbm9ybUNvbnN0SW5zdGFudCA9IDA7XG4gIGxldCBub3JtQ29uc3RTbW9vdGhlZCA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgc2luZ2xlUmVzID0gbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXTtcbiAgICBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV1cbiAgICAgID0gZ21tTGlrZWxpaG9vZChvYnNJbiwgbW9kZWxzW2ldLCBzaW5nbGVSZXMpO1xuXG4gICAgaWYgKHBhcmFtcy5iaW1vZGFsKSB7XG4gICAgICBnbW1SZWdyZXNzaW9uKG9ic0luLCBtb2RlbHNbaV0sIHNpbmdsZVJlcyk7XG4gICAgfVxuXG4gICAgLy8gYXMgaW4geG1tOjpHTU06OnVwZGF0ZVJlc3VsdHMgOlxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA9IHNpbmdsZVJlcy5sb2dfbGlrZWxpaG9vZDtcbiAgICBtUmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldXG4gICAgICA9IE1hdGguZXhwKG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldKTtcbiAgICBtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IG1SZXMuaW5zdGFudF9saWtlbGlob29kc1tpXTtcbiAgICBtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgbm9ybUNvbnN0SW5zdGFudCArPSBtUmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcbiAgICBub3JtQ29uc3RTbW9vdGhlZCArPSBtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG5cbiAgICBpZiAoaSA9PSAwIHx8IG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldID4gbWF4TG9nTGlrZWxpaG9vZCkge1xuICAgICAgbWF4TG9nTGlrZWxpaG9vZCA9IG1SZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldO1xuICAgICAgbVJlcy5saWtlbGllc3QgPSBpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgbVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gLz0gbm9ybUNvbnN0SW5zdGFudDtcbiAgICBtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gLz0gbm9ybUNvbnN0U21vb3RoZWQ7XG4gIH1cblxuICAvLyBpZiBtb2RlbCBpcyBiaW1vZGFsIDpcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlmIChwYXJhbXMuYmltb2RhbCkge1xuICAgIGxldCBkaW0gPSBwYXJhbXMuZGltZW5zaW9uO1xuICAgIGxldCBkaW1JbiA9IHBhcmFtcy5kaW1lbnNpb25faW5wdXQ7XG4gICAgbGV0IGRpbU91dCA9IGRpbSAtIGRpbUluO1xuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGxpa2VsaWVzdFxuICAgIGlmIChjb25maWcubXVsdGlDbGFzc19yZWdyZXNzaW9uX2VzdGltYXRvciA9PT0gMCkge1xuICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzXG4gICAgICAgID0gbVJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1ttUmVzLmxpa2VsaWVzdF1cbiAgICAgICAgICAgIC5vdXRwdXRfdmFsdWVzO1xuICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVxuICAgICAgICA9IG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbbVJlcy5saWtlbGllc3RdXG4gICAgICAgICAgICAub3V0cHV0X2NvdmFyaWFuY2U7XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbWl4dHVyZVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyB6ZXJvLWZpbGwgb3V0cHV0X3ZhbHVlcyBhbmQgb3V0cHV0X2NvdmFyaWFuY2VcbiAgICAgIG1SZXMub3V0cHV0X3ZhbHVlcyA9IG5ldyBBcnJheShkaW1PdXQpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgICAgICBtUmVzLm91dHB1dF92YWx1ZXNbaV0gPSAwLjA7XG4gICAgICB9XG5cbiAgICAgIGxldCBvdXRDb3ZhclNpemU7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgaWYgKGNvbmZpZy5kZWZhdWx0X3BhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09IDApIHtcbiAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0ICogZGltT3V0O1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dDtcbiAgICAgIH1cbiAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0Q292YXJTaXplOyBpKyspIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtpXSA9IDAuMDtcbiAgICAgIH1cblxuICAgICAgLy8gY29tcHV0ZSB0aGUgYWN0dWFsIHZhbHVlcyA6XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgc21vb3RoTm9ybUxpa2VsaWhvb2RcbiAgICAgICAgICA9IG1SZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcbiAgICAgICAgbGV0IHNpbmdsZVJlcyA9IG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV07XG4gICAgICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBpKyspIHtcbiAgICAgICAgICBtUmVzLm91dHB1dF92YWx1ZXNbZF0gKz0gc21vb3RoTm9ybUxpa2VsaWhvb2QgKlxuICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVSZXMub3V0cHV0X3ZhbHVlc1tkXTtcbiAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICAgICAgaWYgKGNvbmZpZy5kZWZhdWx0X3BhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBkMiA9IDA7IGQyIDwgZGltT3V0OyBkMisrKSB7XG4gICAgICAgICAgICAgIGxldCBpbmRleCA9IGQgKiBkaW1PdXQgKyBkMjtcbiAgICAgICAgICAgICAgbVJlcy5vdXRwdXRfY292YXJpYW5jZVtpbmRleF1cbiAgICAgICAgICAgICAgICArPSBzbW9vdGhOb3JtTGlrZWxpaG9vZCAqXG4gICAgICAgICAgICAgICAgICAgc2luZ2xlUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF1cbiAgICAgICAgICAgICAgKz0gc21vb3RoTm9ybUxpa2VsaWhvb2QgKlxuICAgICAgICAgICAgICAgICBzaW5nbGVSZXMub3V0cHV0X2NvdmFyaWFuY2VbZF07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IC8qIGVuZCBpZihwYXJhbXMuYmltb2RhbCkgKi9cbn07XG4iXX0=