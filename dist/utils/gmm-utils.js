'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.gmmFilter = exports.gmmLikelihood = exports.gmmObsProbBimodal = exports.gmmObsProbInput = exports.gmmObsProb = exports.gmmRegression = exports.gmmComponentLikelihoodBimodal = exports.gmmComponentLikelihoodInput = exports.gmmComponentLikelihood = exports.gmmComponentRegression = undefined;

var _isFinite = require('babel-runtime/core-js/number/is-finite');

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
        for (var d = 0; d < dimOut; d++) {
          mRes.output_values[d] += smoothNormLikelihood * _singleRes.output_values[d];
          //--------------------------------------------------------------- full
          if (config.default_parameters.covariance_mode === 0) {
            console.log('full covariance');
            for (var d2 = 0; d2 < dimOut; d2++) {
              var index = d * dimOut + d2;
              mRes.output_covariance[index] += smoothNormLikelihood * _singleRes.output_covariance[index];
            }
            //----------------------------------------------------------- diagonal
          } else {
            console.log('diagonal covariance');
            mRes.output_covariance[d] += smoothNormLikelihood * _singleRes.output_covariance[d];
          }
        }
      }
    }
  } /* end if(params.bimodal) */
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdtbS11dGlscy5qcyJdLCJuYW1lcyI6WyJnbW1Db21wb25lbnRSZWdyZXNzaW9uIiwib2JzSW4iLCJjIiwiZGltIiwiZGltZW5zaW9uIiwiZGltSW4iLCJkaW1lbnNpb25faW5wdXQiLCJkaW1PdXQiLCJwcmVkaWN0T3V0IiwiQXJyYXkiLCJjb3ZhcmlhbmNlX21vZGUiLCJkIiwibWVhbiIsImUiLCJ0bXAiLCJmIiwiaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0IiwiY292YXJpYW5jZSIsImdtbUNvbXBvbmVudExpa2VsaWhvb2QiLCJldWNsaWRpYW5EaXN0YW5jZSIsImwiLCJrIiwiaW52ZXJzZV9jb3ZhcmlhbmNlIiwid2VpZ2h0cyIsInAiLCJNYXRoIiwiZXhwIiwic3FydCIsImNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQiLCJwb3ciLCJQSSIsImdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dCIsImNvdmFyaWFuY2VfZGV0ZXJtaW5hbnRfaW5wdXQiLCJpc05hTiIsImFicyIsImdtbUNvbXBvbmVudExpa2VsaWhvb2RCaW1vZGFsIiwib2JzT3V0Iiwic3EiLCJnbW1SZWdyZXNzaW9uIiwibSIsIm1SZXMiLCJjb21wb25lbnRzIiwib3V0cHV0X3ZhbHVlcyIsImkiLCJvdXRDb3ZhclNpemUiLCJwYXJhbWV0ZXJzIiwib3V0cHV0X2NvdmFyaWFuY2UiLCJ0bXBQcmVkaWN0ZWRPdXRwdXQiLCJsZW5ndGgiLCJzcWJldGEiLCJiZXRhIiwiZDIiLCJpbmRleCIsImdtbU9ic1Byb2IiLCJzaW5nbGVHbW0iLCJjb21wb25lbnQiLCJjb2VmZnMiLCJtaXh0dXJlX2NvZWZmcyIsImdtbU9ic1Byb2JJbnB1dCIsImdtbU9ic1Byb2JCaW1vZGFsIiwiZ21tTGlrZWxpaG9vZCIsInNpbmdsZUdtbVJlcyIsImxpa2VsaWhvb2QiLCJiaW1vZGFsIiwiaW5zdGFudF9saWtlbGlob29kIiwiYnVmTGVuZ3RoIiwibGlrZWxpaG9vZF9idWZmZXIiLCJsaWtlbGlob29kX2J1ZmZlcl9pbmRleCIsImxvZyIsImxvZ19saWtlbGlob29kIiwicmVkdWNlIiwiYSIsImIiLCJnbW1GaWx0ZXIiLCJnbW0iLCJnbW1SZXMiLCJsaWtlbGlob29kcyIsIm1vZGVscyIsInBhcmFtcyIsInNoYXJlZF9wYXJhbWV0ZXJzIiwiY29uZmlnIiwiY29uZmlndXJhdGlvbiIsIm1heExvZ0xpa2VsaWhvb2QiLCJub3JtQ29uc3RJbnN0YW50Iiwibm9ybUNvbnN0U21vb3RoZWQiLCJzaW5nbGVSZXMiLCJzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cyIsImluc3RhbnRfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHMiLCJzbW9vdGhlZF9saWtlbGlob29kcyIsImluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kcyIsInNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMiLCJsaWtlbGllc3QiLCJtdWx0aUNsYXNzX3JlZ3Jlc3Npb25fZXN0aW1hdG9yIiwiZGVmYXVsdF9wYXJhbWV0ZXJzIiwic21vb3RoTm9ybUxpa2VsaWhvb2QiLCJjb25zb2xlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFJQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNPLElBQU1BLDBEQUF5QixTQUF6QkEsc0JBQXlCLENBQUNDLEtBQUQsRUFBUUMsQ0FBUixFQUFjO0FBQ2xELE1BQU1DLE1BQU1ELEVBQUVFLFNBQWQ7QUFDQSxNQUFNQyxRQUFRSCxFQUFFSSxlQUFoQjtBQUNBLE1BQU1DLFNBQVNKLE1BQU1FLEtBQXJCO0FBQ0EsTUFBSUcsYUFBYSxJQUFJQyxLQUFKLENBQVVGLE1BQVYsQ0FBakI7O0FBRUE7QUFDQSxNQUFJTCxFQUFFUSxlQUFGLEtBQXNCLENBQTFCLEVBQTZCO0FBQzNCLFNBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJSixNQUFwQixFQUE0QkksR0FBNUIsRUFBaUM7QUFDL0JILGlCQUFXRyxDQUFYLElBQWdCVCxFQUFF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LGFBQUwsQ0FBbUIvQixDQUFuQixLQUF5Qm9GLHVCQUNaVixXQUFVM0MsYUFBVixDQUF3Qi9CLENBQXhCLENBRGI7QUFFQTtBQUNBLGNBQUlxRSxPQUFPYyxrQkFBUCxDQUEwQnBGLGVBQTFCLEtBQThDLENBQWxELEVBQXFEO0FBQ3JEc0Ysb0JBQVE1QixHQUFSLENBQVksaUJBQVo7QUFDRSxpQkFBSyxJQUFJakIsS0FBSyxDQUFkLEVBQWlCQSxLQUFLNUMsTUFBdEIsRUFBOEI0QyxJQUE5QixFQUFvQztBQUNsQyxrQkFBSUMsUUFBUXpDLElBQUlKLE1BQUosR0FBYTRDLEVBQXpCO0FBQ0FYLG1CQUFLTSxpQkFBTCxDQUF1Qk0sS0FBdkIsS0FDSzJDLHVCQUNBVixXQUFVdkMsaUJBQVYsQ0FBNEJNLEtBQTVCLENBRkw7QUFHRDtBQUNIO0FBQ0MsV0FURCxNQVNPO0FBQ1A0QyxvQkFBUTVCLEdBQVIsQ0FBWSxxQkFBWjtBQUNFNUIsaUJBQUtNLGlCQUFMLENBQXVCbkMsQ0FBdkIsS0FDS29GLHVCQUNBVixXQUFVdkMsaUJBQVYsQ0FBNEJuQyxDQUE1QixDQUZMO0FBR0Q7QUFDRjtBQUNGO0FBQ0Y7QUFDRixHQTFHOEMsQ0EwRzdDO0FBQ0gsQ0EzR00iLCJmaWxlIjoiZ21tLXV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAgZnVuY3Rpb25zIHVzZWQgZm9yIGRlY29kaW5nLCB0cmFuc2xhdGVkIGZyb20gWE1NXG4gKi9cblxuLy8gVE9ETyA6IHdyaXRlIG1ldGhvZHMgZm9yIGdlbmVyYXRpbmcgbW9kZWxSZXN1bHRzIG9iamVjdFxuXG4vLyBnZXQgdGhlIGludmVyc2VfY292YXJpYW5jZXMgbWF0cml4IG9mIGVhY2ggb2YgdGhlIEdNTSBjbGFzc2VzXG4vLyBmb3IgZWFjaCBpbnB1dCBkYXRhLCBjb21wdXRlIHRoZSBkaXN0YW5jZSBvZiB0aGUgZnJhbWUgdG8gZWFjaCBvZiB0aGUgR01Nc1xuLy8gd2l0aCB0aGUgZm9sbG93aW5nIGVxdWF0aW9ucyA6XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gYXMgaW4geG1tR2F1c3NpYW5EaXN0cmlidXRpb24uY3BwIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuXG4vLyBmcm9tIHhtbUdhdXNzaWFuRGlzdHJpYnV0aW9uOjpyZWdyZXNzaW9uXG5leHBvcnQgY29uc3QgZ21tQ29tcG9uZW50UmVncmVzc2lvbiA9IChvYnNJbiwgYykgPT4ge1xuICBjb25zdCBkaW0gPSBjLmRpbWVuc2lvbjtcbiAgY29uc3QgZGltSW4gPSBjLmRpbWVuc2lvbl9pbnB1dDtcbiAgY29uc3QgZGltT3V0ID0gZGltIC0gZGltSW47XG4gIGxldCBwcmVkaWN0T3V0ID0gbmV3IEFycmF5KGRpbU91dCk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gIGlmIChjLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgIHByZWRpY3RPdXRbZF0gPSBjLm1lYW5bZGltSW4gKyBkXTtcbiAgICAgIGZvciAobGV0IGUgPSAwOyBlIDwgZGltSW47IGUrKykge1xuICAgICAgICBsZXQgdG1wID0gMC4wO1xuICAgICAgICBmb3IgKGxldCBmID0gMDsgZiA8IGRpbUluOyBmKyspIHtcbiAgICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VfaW5wdXRbZSAqIGRpbUluICsgZl0gKlxuICAgICAgICAgICAgICAgKG9ic0luW2ZdIC0gYy5tZWFuW2ZdKTtcbiAgICAgICAgfVxuICAgICAgICBwcmVkaWN0T3V0W2RdICs9IGMuY292YXJpYW5jZVsoZCArIGRpbUluKSAqIGRpbSArIGVdICogdG1wO1xuICAgICAgfVxuICAgIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gIH0gZWxzZSB7XG4gICAgZm9yIChsZXQgZCA9IDA7IGQgPCBkaW1PdXQ7IGQrKykge1xuICAgICAgcHJlZGljdE91dFtkXSA9IGMuY292YXJpYW5jZVtkICsgZGltSW5dO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwcmVkaWN0T3V0O1xufTtcblxuXG5leHBvcnQgY29uc3QgZ21tQ29tcG9uZW50TGlrZWxpaG9vZCA9IChvYnNJbiwgYykgPT4ge1xuICAvLyBpZihjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgPT09IDApIHtcbiAgLy8gIHJldHVybiB1bmRlZmluZWQ7XG4gIC8vIH1cbiAgbGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICBpZiAoYy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uOyBsKyspIHtcbiAgICAgIGxldCB0bXAgPSAwLjA7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGMuZGltZW5zaW9uOyBrKyspIHtcbiAgICAgICAgdG1wICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2wgKiBjLmRpbWVuc2lvbiArIGtdICpcbiAgICAgICAgICAgICAgIChvYnNJbltrXSAtIGMubWVhbltrXSkgKlxuICAgICAgICAgICAgICAgYy53ZWlnaHRzW2tdO1xuICAgICAgfVxuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqIHRtcCAqIGMud2VpZ2h0c1tsXTtcbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgYy5kaW1lbnNpb247IGwrKykge1xuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbF0gKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGMud2VpZ2h0c1tsXSAqIGMud2VpZ2h0c1tsXTtcbiAgICB9XG4gIH1cblxuICBsZXQgcCA9IE1hdGguZXhwKC0wLjUgKiBldWNsaWRpYW5EaXN0YW5jZSkgL1xuICAgICAgTWF0aC5zcXJ0KFxuICAgICAgICBjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgKlxuICAgICAgICBNYXRoLnBvdygyICogTWF0aC5QSSwgYy5kaW1lbnNpb24pXG4gICAgICApO1xuXG4gIC8vaWYgKHAgPCAxZS0xODAgfHwgaXNOYU4ocCkgfHwgIU51bWJlci5pc0Zpbml0ZShNYXRoLmFicyhwKSkpIHtcbiAgaWYgKHAgPCAxZS0xODAgfHwgIU51bWJlci5pc0Zpbml0ZShwKSkge1xuICAgIHAgPSAxZS0xODA7XG4gIH1cblxuICByZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbUNvbXBvbmVudExpa2VsaWhvb2RJbnB1dCA9IChvYnNJbiwgYykgPT4ge1xuICAvLyBpZihjLmNvdmFyaWFuY2VfZGV0ZXJtaW5hbnQgPT09IDApIHtcbiAgLy8gIHJldHVybiB1bmRlZmluZWQ7XG4gIC8vIH1cbiAgbGV0IGV1Y2xpZGlhbkRpc3RhbmNlID0gMC4wO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBjLmRpbWVuc2lvbl9pbnB1dDsgbCsrKSB7XG4gICAgICBsZXQgdG1wID0gMC4wO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBjLmRpbWVuc2lvbl9pbnB1dDsgaysrKSB7XG4gICAgICAgIHRtcCArPSBjLmludmVyc2VfY292YXJpYW5jZV9pbnB1dFtsICogYy5kaW1lbnNpb25faW5wdXQgKyBrXSAqXG4gICAgICAgICAgICAgICAob2JzSW5ba10gLSBjLm1lYW5ba10pICpcbiAgICAgICAgICAgICAgIGMud2VpZ2h0c1trXTtcbiAgICAgIH1cbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IChvYnNJbltsXSAtIGMubWVhbltsXSkgKiB0bXAgKiBjLndlaWdodHNbbF07XG4gICAgfVxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGMuZGltZW5zaW9uX2lucHV0OyBsKyspIHtcbiAgICAgIC8vIG9yIHdvdWxkIGl0IGJlIGMuaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0W2xdID9cbiAgICAgIC8vIHNvdW5kcyBsb2dpYyAuLi4gYnV0LCBhY2NvcmRpbmcgdG8gSnVsZXMgKGNmIGUtbWFpbCksXG4gICAgICAvLyBub3QgcmVhbGx5IGltcG9ydGFudC5cbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlX2lucHV0W2xdICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIChvYnNJbltsXSAtIGMubWVhbltsXSkgKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjLndlaWdodHNbbF0gKiBjLndlaWdodHNbbF07XG4gICAgfVxuICB9XG5cbiAgbGV0IHAgPSBNYXRoLmV4cCgtMC41ICogZXVjbGlkaWFuRGlzdGFuY2UpIC9cbiAgICAgIE1hdGguc3FydChcbiAgICAgICAgYy5jb3ZhcmlhbmNlX2RldGVybWluYW50X2lucHV0ICpcbiAgICAgICAgTWF0aC5wb3coMiAqIE1hdGguUEksIGMuZGltZW5zaW9uX2lucHV0KVxuICAgICAgKTtcblxuICBpZiAocCA8IDFlLTE4MCB8fGlzTmFOKHApIHx8IGlzTmFOKE1hdGguYWJzKHApKSkge1xuICAgIHAgPSAxZS0xODA7XG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1Db21wb25lbnRMaWtlbGlob29kQmltb2RhbCA9IChvYnNJbiwgb2JzT3V0LCBjKSA9PiB7XG4gIC8vIGlmKGMuY292YXJpYW5jZV9kZXRlcm1pbmFudCA9PT0gMCkge1xuICAvLyAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgLy8gfVxuICBjb25zdCBkaW0gPSBjLmRpbWVuc2lvbjtcbiAgY29uc3QgZGltSW4gPSBjLmRpbWVuc2lvbl9pbnB1dDtcbiAgY29uc3QgZGltT3V0ID0gZGltIC0gZGltSW47XG4gIGxldCBldWNsaWRpYW5EaXN0YW5jZSA9IDAuMDtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKGMuY292YXJpYW5jZV9tb2RlID09PSAwKSB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBkaW07IGwrKykge1xuICAgICAgbGV0IHRtcCA9IDAuMDtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgZGltSW47IGsrKykge1xuICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbCAqIGRpbSArIGtdICpcbiAgICAgICAgICAgICAgIChvYnNJbltrXSAtIGMubWVhbltrXSkgKlxuICAgICAgICAgICAgICAgYy53ZWlnaHRzW2tdO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBkaW1PdXQ7IGsrKykge1xuICAgICAgICB0bXAgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbCAqIGRpbSArIGRpbUluICsga10gKlxuICAgICAgICAgICAgICAgKG9ic091dFtrXSAtIGMubWVhbltkaW1JbiAra10pO1xuICAgICAgfVxuICAgICAgaWYgKGwgPCBkaW1Jbikge1xuICAgICAgICBldWNsaWRpYW5EaXN0YW5jZSArPSAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICogdG1wICogYy53ZWlnaHRzW2xdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gKG9ic091dFtsIC0gZGltSW5dIC0gYy5tZWFuW2xdKSAqIHRtcDtcbiAgICAgIH1cbiAgICB9XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgZGltSW47IGwrKykge1xuICAgICAgZXVjbGlkaWFuRGlzdGFuY2UgKz0gYy5pbnZlcnNlX2NvdmFyaWFuY2VbbF0gKlxuICAgICAgICAgICAgICAgICAob2JzSW5bbF0gLSBjLm1lYW5bbF0pICpcbiAgICAgICAgICAgICAgICAgKG9ic0luW2xdIC0gYy5tZWFuW2xdKSAqXG4gICAgICAgICAgICAgICAgIGMud2VpZ2h0c1tsXSAqIGMud2VpZ2h0c1tsXTtcbiAgICB9XG4gICAgZm9yIChsZXQgbCA9IGRpbUluOyBsIDwgZGltOyBsKyspIHtcbiAgICAgIGxldCBzcSA9IChvYnNPdXRbbCAtIGRpbUluXSAtIGMubWVhbltsXSkgKlxuICAgICAgICAgICAgICAgKG9ic091dFtsIC0gZGltSW5dIC0gYy5tZWFuW2xdKTtcbiAgICAgIGV1Y2xpZGlhbkRpc3RhbmNlICs9IGMuaW52ZXJzZV9jb3ZhcmlhbmNlW2xdICogc3E7XG4gICAgfVxuICB9XG5cbiAgbGV0IHAgPSBNYXRoLmV4cCgtMC41ICogZXVjbGlkaWFuRGlzdGFuY2UpIC9cbiAgICAgIE1hdGguc3FydChcbiAgICAgICAgYy5jb3ZhcmlhbmNlX2RldGVybWluYW50ICpcbiAgICAgICAgTWF0aC5wb3coMiAqIE1hdGguUEksIGMuZGltZW5zaW9uKVxuICAgICAgKTtcblxuICBpZiAocCA8IDFlLTE4MCB8fCBpc05hTihwKSB8fCBpc05hTihNYXRoLmFicyhwKSkpIHtcbiAgICBwID0gMWUtMTgwO1xuICB9XG4gIHJldHVybiBwO1xufTtcblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cbi8vICAgIGFzIGluIHhtbUdtbVNpbmdsZUNsYXNzLmNwcCAgICAvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbmV4cG9ydCBjb25zdCBnbW1SZWdyZXNzaW9uID0gKG9ic0luLCBtLCBtUmVzKSA9PiB7XG4gIGNvbnN0IGRpbSA9IG0uY29tcG9uZW50c1swXS5kaW1lbnNpb247XG4gIGNvbnN0IGRpbUluID0gbS5jb21wb25lbnRzWzBdLmRpbWVuc2lvbl9pbnB1dDtcbiAgY29uc3QgZGltT3V0ID0gZGltIC0gZGltSW47XG5cbiAgbVJlcy5vdXRwdXRfdmFsdWVzID0gbmV3IEFycmF5KGRpbU91dCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcbiAgICBtUmVzLm91dHB1dF92YWx1ZXNbaV0gPSAwLjA7XG4gIH1cblxuICBsZXQgb3V0Q292YXJTaXplO1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgaWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICB9IGVsc2Uge1xuICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dDtcbiAgfVxuXG4gIG1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRDb3ZhclNpemU7IGkrKykge1xuICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gIH1cblxuICAvKlxuICAvLyB1c2VsZXNzIDogcmVpbnN0YW5jaWF0ZWQgaW4gZ21tQ29tcG9uZW50UmVncmVzc2lvblxuICBsZXQgdG1wUHJlZGljdGVkT3V0cHV0ID0gbmV3IEFycmF5KGRpbU91dCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcbiAgICB0bXBQcmVkaWN0ZWRPdXRwdXRbaV0gPSAwLjA7XG4gIH1cbiAgKi9cbiAgbGV0IHRtcFByZWRpY3RlZE91dHB1dDtcblxuICBmb3IgKGxldCBjID0gMDsgYyA8IG0uY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgIHRtcFByZWRpY3RlZE91dHB1dCA9IGdtbUNvbXBvbmVudFJlZ3Jlc3Npb24ob2JzSW4sIG0uY29tcG9uZW50c1tjXSk7XG4gICAgbGV0IHNxYmV0YSA9IG1SZXMuYmV0YVtjXSAqIG1SZXMuYmV0YVtjXTtcblxuICAgIGZvciAobGV0IGQgPSAwOyBkIDwgZGltT3V0OyBkKyspIHtcbiAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1tkXSArPSBtUmVzLmJldGFbY10gKiB0bXBQcmVkaWN0ZWRPdXRwdXRbZF07XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgaWYgKG0ucGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT09IDApIHtcbiAgICAgICAgZm9yIChsZXQgZDIgPSAwOyBkMiA8IGRpbU91dDsgZDIrKykge1xuICAgICAgICAgIGxldCBpbmRleCA9IGQgKiBkaW1PdXQgKyBkMjtcbiAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XVxuICAgICAgICAgICAgKz0gc3FiZXRhICogbS5jb21wb25lbnRzW2NdLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XTtcbiAgICAgICAgfVxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbZF1cbiAgICAgICAgICArPSBzcWJldGEgKiBtLmNvbXBvbmVudHNbY10ub3V0cHV0X2NvdmFyaWFuY2VbZF07XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1PYnNQcm9iID0gKG9ic0luLCBzaW5nbGVHbW0sIGNvbXBvbmVudCA9IC0xKSA9PiB7XG4gIGNvbnN0IGNvZWZmcyA9IHNpbmdsZUdtbS5taXh0dXJlX2NvZWZmcztcbiAgY29uc3QgY29tcG9uZW50cyA9IHNpbmdsZUdtbS5jb21wb25lbnRzO1xuICBsZXQgcCA9IDAuMDtcblxuICBpZiAoY29tcG9uZW50IDwgMCkge1xuICAgIGZvciAobGV0IGMgPSAwOyBjIDwgY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgICAgcCArPSBnbW1PYnNQcm9iKG9ic0luLCBzaW5nbGVHbW0sIGMpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwID0gY29lZmZzW2NvbXBvbmVudF0gKlxuICAgICAgZ21tQ29tcG9uZW50TGlrZWxpaG9vZChvYnNJbiwgY29tcG9uZW50c1tjb21wb25lbnRdKTtcbiAgfVxuICByZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbU9ic1Byb2JJbnB1dCA9IChvYnNJbiwgc2luZ2xlR21tLCBjb21wb25lbnQgPSAtMSkgPT4ge1xuICBjb25zdCBjb2VmZnMgPSBzaW5nbGVHbW0ubWl4dHVyZV9jb2VmZnM7XG4gIGNvbnN0IGNvbXBvbmVudHMgPSBzaW5nbGVHbW0uY29tcG9uZW50cztcbiAgbGV0IHAgPSAwLjA7XG5cbiAgaWYgKGNvbXBvbmVudCA8IDApIHtcbiAgICBmb3IobGV0IGMgPSAwOyBjIDwgY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgICAgcCArPSBnbW1PYnNQcm9iSW5wdXQob2JzSW4sIHNpbmdsZUdtbSwgYyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHAgPSBjb2VmZnNbY29tcG9uZW50XSAqXG4gICAgICBnbW1Db21wb25lbnRMaWtlbGlob29kSW5wdXQob2JzSW4sIGNvbXBvbmVudHNbY29tcG9uZW50XSk7XG4gIH1cbiAgcmV0dXJuIHA7XG59O1xuXG5cbmV4cG9ydCBjb25zdCBnbW1PYnNQcm9iQmltb2RhbCA9IChvYnNJbiwgb2JzT3V0LCBzaW5nbGVHbW0sIGNvbXBvbmVudCA9IC0xKSA9PiB7XG4gIGNvbnN0IGNvZWZmcyA9IHNpbmdsZUdtbS5taXh0dXJlX2NvZWZmcztcbiAgY29uc3QgY29tcG9uZW50cyA9IHNpbmdsZUdtbS5jb21wb25lbnRzO1xuICBsZXQgcCA9IDAuMDtcblxuICBpZiAoY29tcG9uZW50IDwgMCkge1xuICAgIGZvciAobGV0IGMgPSAwOyBjIDwgY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgICAgcCArPSBnbW1PYnNQcm9iQmltb2RhbChvYnNJbiwgb2JzT3V0LCBzaW5nbGVHbW0sIGMpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwID0gY29lZmZzW2NvbXBvbmVudF0gKlxuICAgICAgZ21tQ29tcG9uZW50TGlrZWxpaG9vZEJpbW9kYWwob2JzSW4sIG9ic091dCwgY29tcG9uZW50c1tjb21wb25lbnRdKTtcbiAgfVxuICByZXR1cm4gcDtcbn07XG5cblxuZXhwb3J0IGNvbnN0IGdtbUxpa2VsaWhvb2QgPSAob2JzSW4sIHNpbmdsZUdtbSwgc2luZ2xlR21tUmVzLCBvYnNPdXQgPSBbXSkgPT4ge1xuICBjb25zdCBjb21wb25lbnRzID0gc2luZ2xlR21tLmNvbXBvbmVudHM7XG4gIGNvbnN0IG1SZXMgPSBzaW5nbGVHbW1SZXM7XG4gIGxldCBsaWtlbGlob29kID0gMC4wO1xuXG4gIGZvciAobGV0IGMgPSAwOyBjIDwgY29tcG9uZW50cy5sZW5ndGg7IGMrKykge1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJpbW9kYWxcbiAgICBpZiAoY29tcG9uZW50c1tjXS5iaW1vZGFsKSB7XG4gICAgICBpZiAob2JzT3V0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBtUmVzLmJldGFbY11cbiAgICAgICAgICA9IGdtbU9ic1Byb2JJbnB1dChvYnNJbiwgc2luZ2xlR21tLCBjKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1SZXMuYmV0YVtjXVxuICAgICAgICAgID0gZ21tT2JzUHJvYkJpbW9kYWwob2JzSW4sIG9ic091dCwgc2luZ2xlR21tLCBjKTtcbiAgICAgIH1cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHVuaW1vZGFsXG4gICAgfSBlbHNlIHtcbiAgICAgIG1SZXMuYmV0YVtjXSA9IGdtbU9ic1Byb2Iob2JzSW4sIHNpbmdsZUdtbSwgYyk7XG4gICAgfVxuXG4gICAgbGlrZWxpaG9vZCArPSBtUmVzLmJldGFbY107XG4gIH1cblxuICBmb3IgKGxldCBjID0gMDsgYyA8IGNvbXBvbmVudHMubGVuZ3RoOyBjKyspIHtcbiAgICBtUmVzLmJldGFbY10gLz0gbGlrZWxpaG9vZDtcbiAgfVxuXG4gIG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gbGlrZWxpaG9vZDtcblxuICAvLyBhcyBpbiB4bW06OlNpbmdsZUNsYXNzR01NOjp1cGRhdGVSZXN1bHRzIDpcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLnVuc2hpZnQobGlrZWxpaG9vZCk7XG4gIC8vcmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aC0tO1xuICAvLyBUSElTIElTIEJFVFRFUiAoY2lyY3VsYXIgYnVmZmVyKVxuICBjb25zdCBidWZMZW5ndGggPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDtcbiAgbVJlcy5saWtlbGlob29kX2J1ZmZlclttUmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4XSA9IE1hdGgubG9nKGxpa2VsaWhvb2QpO1xuICBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4XG4gICAgPSAobVJlcy5saWtlbGlob29kX2J1ZmZlcl9pbmRleCArIDEpICUgYnVmTGVuZ3RoO1xuICAvLyBzdW0gYWxsIGFycmF5IHZhbHVlcyA6XG4gIG1SZXMubG9nX2xpa2VsaWhvb2QgPSBtUmVzLmxpa2VsaWhvb2RfYnVmZmVyLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApO1xuICAvLyBtUmVzLmxvZ19saWtlbGlob29kID0gMDtcbiAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCBidWZMZW5ndGg7IGkrKykge1xuICAvLyAgIG1SZXMubG9nX2xpa2VsaWhvb2QgKz0gbVJlcy5saWtlbGlob29kX2J1ZmZlcltpXTtcbiAgLy8gfVxuICBtUmVzLmxvZ19saWtlbGlob29kIC89IGJ1Zkxlbmd0aDtcblxuICByZXR1cm4gbGlrZWxpaG9vZDtcbn07XG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyAgICAgICAgICBhcyBpbiB4bW1HbW0uY3BwICAgICAgICAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5leHBvcnQgY29uc3QgZ21tRmlsdGVyID0gKG9ic0luLCBnbW0sIGdtbVJlcykgPT4ge1xuICBsZXQgbGlrZWxpaG9vZHMgPSBbXTtcbiAgY29uc3QgbW9kZWxzID0gZ21tLm1vZGVscztcbiAgY29uc3QgbVJlcyA9IGdtbVJlcztcblxuICBjb25zdCBwYXJhbXMgPSBnbW0uc2hhcmVkX3BhcmFtZXRlcnM7XG4gIGNvbnN0IGNvbmZpZyA9IGdtbS5jb25maWd1cmF0aW9uO1xuXG4gIGxldCBtYXhMb2dMaWtlbGlob29kID0gMDtcbiAgbGV0IG5vcm1Db25zdEluc3RhbnQgPSAwO1xuICBsZXQgbm9ybUNvbnN0U21vb3RoZWQgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHNpbmdsZVJlcyA9IG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbaV07XG4gICAgbVJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldXG4gICAgICA9IGdtbUxpa2VsaWhvb2Qob2JzSW4sIG1vZGVsc1tpXSwgc2luZ2xlUmVzKTtcblxuICAgIGlmIChwYXJhbXMuYmltb2RhbCkge1xuICAgICAgZ21tUmVncmVzc2lvbihvYnNJbiwgbW9kZWxzW2ldLCBzaW5nbGVSZXMpO1xuICAgIH1cblxuICAgIC8vIGFzIGluIHhtbTo6R01NOjp1cGRhdGVSZXN1bHRzIDpcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbVJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSBzaW5nbGVSZXMubG9nX2xpa2VsaWhvb2Q7XG4gICAgbVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXVxuICAgICAgPSBNYXRoLmV4cChtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSk7XG4gICAgbVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSBtUmVzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV07XG4gICAgbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gbVJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXTtcblxuICAgIG5vcm1Db25zdEluc3RhbnQgKz0gbVJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG4gICAgbm9ybUNvbnN0U21vb3RoZWQgKz0gbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXG4gICAgaWYgKGkgPT0gMCB8fCBtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA+IG1heExvZ0xpa2VsaWhvb2QpIHtcbiAgICAgIG1heExvZ0xpa2VsaWhvb2QgPSBtUmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXTtcbiAgICAgIG1SZXMubGlrZWxpZXN0ID0gaTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgIG1SZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1Db25zdEluc3RhbnQ7XG4gICAgbVJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIC89IG5vcm1Db25zdFNtb290aGVkO1xuICB9XG5cbiAgLy8gaWYgbW9kZWwgaXMgYmltb2RhbCA6XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpZiAocGFyYW1zLmJpbW9kYWwpIHtcbiAgICBsZXQgZGltID0gcGFyYW1zLmRpbWVuc2lvbjtcbiAgICBsZXQgZGltSW4gPSBwYXJhbXMuZGltZW5zaW9uX2lucHV0O1xuICAgIGxldCBkaW1PdXQgPSBkaW0gLSBkaW1JbjtcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsaWtlbGllc3RcbiAgICBpZiAoY29uZmlnLm11bHRpQ2xhc3NfcmVncmVzc2lvbl9lc3RpbWF0b3IgPT09IDApIHtcbiAgICAgIG1SZXMub3V0cHV0X3ZhbHVlc1xuICAgICAgICA9IG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbbVJlcy5saWtlbGllc3RdXG4gICAgICAgICAgICAub3V0cHV0X3ZhbHVlcztcbiAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VcbiAgICAgICAgPSBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW21SZXMubGlrZWxpZXN0XVxuICAgICAgICAgICAgLm91dHB1dF9jb3ZhcmlhbmNlO1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG1peHR1cmVcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gemVyby1maWxsIG91dHB1dF92YWx1ZXMgYW5kIG91dHB1dF9jb3ZhcmlhbmNlXG4gICAgICBtUmVzLm91dHB1dF92YWx1ZXMgPSBuZXcgQXJyYXkoZGltT3V0KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcbiAgICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICAgICAgfVxuXG4gICAgICBsZXQgb3V0Q292YXJTaXplO1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgIGlmIChjb25maWcuZGVmYXVsdF9wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PSAwKSB7XG4gICAgICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dCAqIGRpbU91dDtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRpYWdvbmFsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQ7XG4gICAgICB9XG4gICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlID0gbmV3IEFycmF5KG91dENvdmFyU2l6ZSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG91dENvdmFyU2l6ZTsgaSsrKSB7XG4gICAgICAgIG1SZXMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gICAgICB9XG5cbiAgICAgIC8vIGNvbXB1dGUgdGhlIGFjdHVhbCB2YWx1ZXMgOlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHNtb290aE5vcm1MaWtlbGlob29kXG4gICAgICAgICAgPSBtUmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG4gICAgICAgIGxldCBzaW5nbGVSZXMgPSBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2ldO1xuICAgICAgICBmb3IgKGxldCBkID0gMDsgZCA8IGRpbU91dDsgZCsrKSB7XG4gICAgICAgICAgbVJlcy5vdXRwdXRfdmFsdWVzW2RdICs9IHNtb290aE5vcm1MaWtlbGlob29kICpcbiAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlUmVzLm91dHB1dF92YWx1ZXNbZF07XG4gICAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZnVsbFxuICAgICAgICAgIGlmIChjb25maWcuZGVmYXVsdF9wYXJhbWV0ZXJzLmNvdmFyaWFuY2VfbW9kZSA9PT0gMCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdmdWxsIGNvdmFyaWFuY2UnKTtcbiAgICAgICAgICAgIGZvciAobGV0IGQyID0gMDsgZDIgPCBkaW1PdXQ7IGQyKyspIHtcbiAgICAgICAgICAgICAgbGV0IGluZGV4ID0gZCAqIGRpbU91dCArIGQyO1xuICAgICAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2luZGV4XVxuICAgICAgICAgICAgICAgICs9IHNtb290aE5vcm1MaWtlbGlob29kICpcbiAgICAgICAgICAgICAgICAgICBzaW5nbGVSZXMub3V0cHV0X2NvdmFyaWFuY2VbaW5kZXhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdkaWFnb25hbCBjb3ZhcmlhbmNlJyk7XG4gICAgICAgICAgICBtUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdXG4gICAgICAgICAgICAgICs9IHNtb290aE5vcm1MaWtlbGlob29kICpcbiAgICAgICAgICAgICAgICAgc2luZ2xlUmVzLm91dHB1dF9jb3ZhcmlhbmNlW2RdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSAvKiBlbmQgaWYocGFyYW1zLmJpbW9kYWwpICovXG59O1xuIl19