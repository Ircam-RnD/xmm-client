'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _hhmmUtils = require('../utils/hhmm-utils');

var hhmmUtils = _interopRequireWildcard(_hhmmUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Hierarchical HMM decoder
 * loads a model trained by the XMM library and processes an input stream of float vectors in real-time
 * if the model was trained for regression, outputs an estimation
 * @class
 */

var HhmmDecoder = function () {

  /**
   * @param {number} windowSize - size of the likelihood smoothing window
   */
  function HhmmDecoder() {
    var windowSize = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
    (0, _classCallCheck3.default)(this, HhmmDecoder);


    /**
     * Size of the likelihood smoothing window
     * @type {number}
     */
    this.likelihoodWindow = windowSize;

    /**
     * The model, as generated by XMM from a training data set
     * @type {Object}
     */
    this.model = undefined;

    /**
     * The model results, containing intermediate results that will be passed to the callback in filter
     * @type {Object}
     */
    this.modelResults = undefined;
  }

  /**
   * @typedef HhmmResults
   * @type {Object}
   * @property {string} likeliest - the likeliest model's label
   * @property {Array.number} likelihoods - the array of all models' normalized likelihoods
   * @property {Array.number} timeProgressions - the array of all models' normalized time progressions
   * @property {Array.Array.number} alphas - the array of all models' states likelihoods array
   * @property {?Array.number} outputValues - if the model was trained with regression, the estimated float vector output
   */

  /**
   * Callback handling estimation results
   * @callback ResultsCallback
   * @param {string} err - description of a potential error
   * @param {HhmmResults} res - object holding the estimation results
   */

  /**
   * The decoding function
   * @param {Array.number} observation - an input float vector to be estimated
   * @param {ResultsCallback} resultsCallback - the callback handling the estimation results
   */


  (0, _createClass3.default)(HhmmDecoder, [{
    key: 'filter',
    value: function filter(observation, resultsCallback) {
      if (this.model === undefined) {
        console.log("no model loaded");
        return;
      }

      var err = null;
      var res = null;

      try {
        hhmmUtils.hhmmFilter(observation, this.model, this.modelResults);

        // create results object from relevant modelResults values :

        var lklst = this.modelResults.likeliest > -1 ? this.model.models[this.modelResults.likeliest].label : 'unknown';
        var lklhds = this.modelResults.smoothed_normalized_likelihoods.slice(0);
        res = {
          likeliest: lklst,
          likelihoods: lklhds,
          alphas: new Array(this.model.models.length)
        };

        for (var i = 0; i < this.model.models.length; i++) {
          if (this.model.configuration.default_parameters.hierarchical) {
            res.alphas[i] = this.modelResults.singleClassHmmModelResults[i].alpha_h[0];
          } else {
            res.alphas[i] = this.modelResults.singleClassHmmModelResults[i].alpha[0];
          }
        }

        if (this.model.shared_parameters.bimodal) {
          res.outputValues = this.modelResults.output_values.slice(0);
          // results.outputCovariance
          //     = this.modelResults.output_covariance.slice(0);
        }
      } catch (e) {
        err = 'problem occured during filtering : ' + e;
      }
      resultsCallback(err, results);
    }

    /**
     * Resets the intermediate results of the estimation
     */

  }, {
    key: 'reset',
    value: function reset() {
      /** @todo : write a real reset (see c++ version) */
      this.modelResults.forward_initialized = false;
    }

    // ==================== SETTERS ====================== //

    /**
     * The model generated by XMM
     * It is mandatory for the class to have a model in order to do its job
     * @type {Object}
     */

  }, {
    key: 'model',
    set: function set(model) {

      this.model = undefined;
      this.modelResults = undefined;

      // test if model is valid here (TODO : write a better test)
      if (model.models !== undefined) {

        //console.log(model);

        this.model = model;
        var m = this.model;
        var nmodels = m.models.length;

        // not used anymore (returns a more complex js object)
        // const nstatesGlobal = m.configuration.default_parameters.states;
        // this.params.frameSize = nstatesGlobal;

        this.modelResults = {
          instant_likelihoods: new Array(nmodels),
          smoothed_log_likelihoods: new Array(nmodels),
          smoothed_likelihoods: new Array(nmodels),
          instant_normalized_likelihoods: new Array(nmodels),
          smoothed_normalized_likelihoods: new Array(nmodels),
          likeliest: -1,
          frontier_v1: new Array(nmodels),
          frontier_v2: new Array(nmodels),
          forward_initialized: false,
          singleClassHmmModelResults: []
        };

        // move output_values / output_covariance here for regression
        // and dupe (.slice(0)) them in sub-modelResults
        var params = m.shared_parameters;
        var dimOut = params.dimension - params.dimension_input;
        this.modelResults.output_values = new Array(dimOut);
        for (var i = 0; i < dimOut; i++) {
          this.modelResults.output_values[i] = 0.0;
        }

        var outCovarSize = void 0;
        if (m.configuration.default_parameters.covariance_mode == 0) {
          // full
          outCovarSize = dimOut * dimOut;
        } else {
          // diagonal
          outCovarSize = dimOut;
        }
        this.modelResults.output_covariance = new Array(outCovarSize);
        for (var _i = 0; _i < dimOut; _i++) {
          this.modelResults.output_covariance[_i] = 0.0;
        }

        for (var _i2 = 0; _i2 < nmodels; _i2++) {

          this.modelResults.instant_likelihoods[_i2] = 0;
          this.modelResults.smoothed_log_likelihoods[_i2] = 0;
          this.modelResults.smoothed_likelihoods[_i2] = 0;
          this.modelResults.instant_normalized_likelihoods[_i2] = 0;
          this.modelResults.smoothed_normalized_likelihoods[_i2] = 0;

          var nstates = m.models[_i2].parameters.states;

          var alpha_h = new Array(3);
          for (var j = 0; j < 3; j++) {
            alpha_h[j] = new Array(nstates);
            for (var k = 0; k < nstates; k++) {
              alpha_h[j][k] = 0;
            }
          }

          var alpha = new Array(nstates);
          for (var _j = 0; _j < nstates; _j++) {
            alpha[_j] = 0;
          }

          // const winSize = m.shared_parameters.likelihood_window
          // let likelihood_buffer = new Array(winSize);
          var likelihood_buffer = new Array(this.likelihoodWindow);
          for (var _j2 = 0; _j2 < this.likelihoodWindow; _j2++) {
            likelihood_buffer[_j2] = 0.0;
          }

          var hmmRes = {
            hierarchical: m.configuration.default_parameters.hierarchical,
            instant_likelihood: 0,
            log_likelihood: 0,
            // for circular buffer implementation
            // (see hmmUpdateResults) :
            likelihood_buffer: likelihood_buffer,
            likelihood_buffer_index: 0,
            progress: 0,

            exit_likelihood: 0,
            exit_ratio: 0,

            likeliest_state: -1,

            // for non-hierarchical :
            previous_alpha: alpha.slice(0),
            alpha: alpha,
            // for hierarchical :       
            alpha_h: alpha_h,
            prior: new Array(nstates),
            transition: new Array(nstates),

            // used in hmmUpdateAlphaWindow
            window_minindex: 0,
            window_maxindex: 0,
            window_normalization_constant: 0,

            // for non-hierarchical mode
            forward_initialized: false,

            singleClassGmmModelResults: [] // states
          };

          hmmRes.output_values = this.modelResults.output_values.slice(0);
          hmmRes.output_covariance = this.modelResults.output_covariance.slice(0);

          // add HMM states (GMMs)
          for (var _j3 = 0; _j3 < nstates; _j3++) {
            var gmmRes = {
              instant_likelihood: 0,
              log_likelihood: 0
            };
            gmmRes.beta = new Array(this.model.models[_i2].parameters.gaussians);
            for (var _k = 0; _k < gmmRes.beta.length; _k++) {
              gmmRes.beta[_k] = 1 / gmmRes.beta.length;
            }
            gmmRes.output_values = hmmRes.output_values.slice(0);
            gmmRes.output_covariance = hmmRes.output_covariance.slice(0);

            hmmRes.singleClassGmmModelResults.push(gmmRes);
          }

          this.modelResults.singleClassHmmModelResults.push(hmmRes);
        }
      }
    },
    get: function get() {
      if (this.model !== undefined) {
        return JSON.fromString((0, _stringify2.default)(this.model));
      }
      return undefined;
    }
  }, {
    key: 'likelihoodWindow',
    set: function set(newWindowSize) {
      this.likelihoodWindow = newWindowSize;
      if (this.model === undefined) return;
      var res = this.modelResults.singleClassModelResults;
      for (var i = 0; i < this.model.models.length; i++) {
        res[i].likelihood_buffer = new Array(this.likelihoodWindow);
        for (var j = 0; j < this.likelihoodWindow; j++) {
          res.likelihood_buffer[j] = 1 / this.likelihoodWindow;
        }
      }
    }

    // ==================== GETTERS ====================== //

    ,
    get: function get() {
      return this.likelihoodWindow;
    }
  }, {
    key: 'likeliestLabel',
    get: function get() {
      if (this.modelResults !== undefined) {
        if (this.modelResults.likeliest > -1) {
          return this.model.models[this.modelResults.likeliest].label;
        }
      }
      return 'unknown';
      //return('no estimation available');
    }
  }, {
    key: 'nbClasses',
    get: function get() {
      if (this.model !== undefined) {
        return this.model.models.length;
      }
      return 0;
    }
  }]);
  return HhmmDecoder;
}(); //import * as gmmUtils from '../utils/gmm-utils';


exports.default = HhmmDecoder;
//# sourceMappingURL=data:application/json;base64,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QUVEOzs7d0JBMEJ1QjtBQUNyQixhQUFPLEtBQUssZ0JBQVo7QUFDRDs7O3dCQTFCb0I7QUFDbkIsVUFBRyxLQUFLLFlBQUwsS0FBc0IsU0FBekIsRUFBb0M7QUFDbEMsWUFBRyxLQUFLLFlBQUwsQ0FBa0IsU0FBbEIsR0FBOEIsQ0FBQyxDQUFsQyxFQUFxQztBQUNuQyxpQkFBTyxLQUFLLEtBQUwsQ0FBVyxNQUFYLENBQWtCLEtBQUssWUFBTCxDQUFrQixTQUFwQyxFQUErQyxLQUF0RDtBQUNEO0FBQ0Y7QUFDRCxhQUFPLFNBQVA7QUFDQTtBQUNEOzs7d0JBRWU7QUFDZCxVQUFHLEtBQUssS0FBTCxLQUFlLFNBQWxCLEVBQTZCO0FBQzNCLGVBQU8sS0FBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixNQUF6QjtBQUNEO0FBQ0QsYUFBTyxDQUFQO0FBQ0Q7OztLQS9SSDs7O2tCQVVxQixXIiwiZmlsZSI6ImhobW0tZGVjb2Rlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vaW1wb3J0ICogYXMgZ21tVXRpbHMgZnJvbSAnLi4vdXRpbHMvZ21tLXV0aWxzJztcbmltcG9ydCAqIGFzIGhobW1VdGlscyBmcm9tICcuLi91dGlscy9oaG1tLXV0aWxzJztcblxuLyoqXG4gKiBIaWVyYXJjaGljYWwgSE1NIGRlY29kZXJcbiAqIGxvYWRzIGEgbW9kZWwgdHJhaW5lZCBieSB0aGUgWE1NIGxpYnJhcnkgYW5kIHByb2Nlc3NlcyBhbiBpbnB1dCBzdHJlYW0gb2YgZmxvYXQgdmVjdG9ycyBpbiByZWFsLXRpbWVcbiAqIGlmIHRoZSBtb2RlbCB3YXMgdHJhaW5lZCBmb3IgcmVncmVzc2lvbiwgb3V0cHV0cyBhbiBlc3RpbWF0aW9uXG4gKiBAY2xhc3NcbiAqL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIaG1tRGVjb2RlciB7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB3aW5kb3dTaXplIC0gc2l6ZSBvZiB0aGUgbGlrZWxpaG9vZCBzbW9vdGhpbmcgd2luZG93XG4gICAqL1xuICBjb25zdHJ1Y3Rvcih3aW5kb3dTaXplID0gMSkge1xuXG4gICAgLyoqXG4gICAgICogU2l6ZSBvZiB0aGUgbGlrZWxpaG9vZCBzbW9vdGhpbmcgd2luZG93XG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLmxpa2VsaWhvb2RXaW5kb3cgPSB3aW5kb3dTaXplO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG1vZGVsLCBhcyBnZW5lcmF0ZWQgYnkgWE1NIGZyb20gYSB0cmFpbmluZyBkYXRhIHNldFxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdGhpcy5tb2RlbCA9IHVuZGVmaW5lZDtcblxuICAgIC8qKlxuICAgICAqIFRoZSBtb2RlbCByZXN1bHRzLCBjb250YWluaW5nIGludGVybWVkaWF0ZSByZXN1bHRzIHRoYXQgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIGNhbGxiYWNrIGluIGZpbHRlclxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdGhpcy5tb2RlbFJlc3VsdHMgPSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQHR5cGVkZWYgSGhtbVJlc3VsdHNcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGxpa2VsaWVzdCAtIHRoZSBsaWtlbGllc3QgbW9kZWwncyBsYWJlbFxuICAgKiBAcHJvcGVydHkge0FycmF5Lm51bWJlcn0gbGlrZWxpaG9vZHMgLSB0aGUgYXJyYXkgb2YgYWxsIG1vZGVscycgbm9ybWFsaXplZCBsaWtlbGlob29kc1xuICAgKiBAcHJvcGVydHkge0FycmF5Lm51bWJlcn0gdGltZVByb2dyZXNzaW9ucyAtIHRoZSBhcnJheSBvZiBhbGwgbW9kZWxzJyBub3JtYWxpemVkIHRpbWUgcHJvZ3Jlc3Npb25zXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuQXJyYXkubnVtYmVyfSBhbHBoYXMgLSB0aGUgYXJyYXkgb2YgYWxsIG1vZGVscycgc3RhdGVzIGxpa2VsaWhvb2RzIGFycmF5XG4gICAqIEBwcm9wZXJ0eSB7P0FycmF5Lm51bWJlcn0gb3V0cHV0VmFsdWVzIC0gaWYgdGhlIG1vZGVsIHdhcyB0cmFpbmVkIHdpdGggcmVncmVzc2lvbiwgdGhlIGVzdGltYXRlZCBmbG9hdCB2ZWN0b3Igb3V0cHV0XG4gICAqL1xuXG4gIC8qKlxuICAgKiBDYWxsYmFjayBoYW5kbGluZyBlc3RpbWF0aW9uIHJlc3VsdHNcbiAgICogQGNhbGxiYWNrIFJlc3VsdHNDYWxsYmFja1xuICAgKiBAcGFyYW0ge3N0cmluZ30gZXJyIC0gZGVzY3JpcHRpb24gb2YgYSBwb3RlbnRpYWwgZXJyb3JcbiAgICogQHBhcmFtIHtIaG1tUmVzdWx0c30gcmVzIC0gb2JqZWN0IGhvbGRpbmcgdGhlIGVzdGltYXRpb24gcmVzdWx0c1xuICAgKi9cblxuICAvKipcbiAgICogVGhlIGRlY29kaW5nIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7QXJyYXkubnVtYmVyfSBvYnNlcnZhdGlvbiAtIGFuIGlucHV0IGZsb2F0IHZlY3RvciB0byBiZSBlc3RpbWF0ZWRcbiAgICogQHBhcmFtIHtSZXN1bHRzQ2FsbGJhY2t9IHJlc3VsdHNDYWxsYmFjayAtIHRoZSBjYWxsYmFjayBoYW5kbGluZyB0aGUgZXN0aW1hdGlvbiByZXN1bHRzXG4gICAqL1xuICBmaWx0ZXIob2JzZXJ2YXRpb24sIHJlc3VsdHNDYWxsYmFjaykge1xuICAgIGlmKHRoaXMubW9kZWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc29sZS5sb2coXCJubyBtb2RlbCBsb2FkZWRcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGVyciA9IG51bGw7XG4gICAgbGV0IHJlcyA9IG51bGw7XG5cbiAgICB0cnkge1xuICAgICAgaGhtbVV0aWxzLmhobW1GaWx0ZXIob2JzZXJ2YXRpb24sIHRoaXMubW9kZWwsIHRoaXMubW9kZWxSZXN1bHRzKTtcblxuICAgICAgLy8gY3JlYXRlIHJlc3VsdHMgb2JqZWN0IGZyb20gcmVsZXZhbnQgbW9kZWxSZXN1bHRzIHZhbHVlcyA6XG5cbiAgICAgIGNvbnN0IGxrbHN0ID0gKHRoaXMubW9kZWxSZXN1bHRzLmxpa2VsaWVzdCA+IC0xKVxuICAgICAgICAgICAgICAgICAgPyB0aGlzLm1vZGVsLm1vZGVsc1t0aGlzLm1vZGVsUmVzdWx0cy5saWtlbGllc3RdLmxhYmVsXG4gICAgICAgICAgICAgICAgICA6ICd1bmtub3duJztcbiAgICAgIGNvbnN0IGxrbGhkcyA9IHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMuc2xpY2UoMCk7XG4gICAgICByZXMgPSB7XG4gICAgICAgIGxpa2VsaWVzdDogbGtsc3QsXG4gICAgICAgIGxpa2VsaWhvb2RzOiBsa2xoZHMsXG4gICAgICAgIGFscGhhczogbmV3IEFycmF5KHRoaXMubW9kZWwubW9kZWxzLmxlbmd0aClcbiAgICAgIH1cblxuICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRoaXMubW9kZWwubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmKHRoaXMubW9kZWwuY29uZmlndXJhdGlvbi5kZWZhdWx0X3BhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgICAgICAgcmVzLmFscGhhc1tpXVxuICAgICAgICAgICAgPSB0aGlzLm1vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcy5hbHBoYXNbaV1cbiAgICAgICAgICAgID0gdGhpcy5tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFbMF07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYodGhpcy5tb2RlbC5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG4gICAgICAgIHJlcy5vdXRwdXRWYWx1ZXMgPSB0aGlzLm1vZGVsUmVzdWx0cy5vdXRwdXRfdmFsdWVzLnNsaWNlKDApO1xuICAgICAgICAvLyByZXN1bHRzLm91dHB1dENvdmFyaWFuY2VcbiAgICAgICAgLy8gICAgID0gdGhpcy5tb2RlbFJlc3VsdHMub3V0cHV0X2NvdmFyaWFuY2Uuc2xpY2UoMCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyID0gJ3Byb2JsZW0gb2NjdXJlZCBkdXJpbmcgZmlsdGVyaW5nIDogJyArIGU7XG4gICAgfVxuICAgIHJlc3VsdHNDYWxsYmFjayhlcnIsIHJlc3VsdHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0cyB0aGUgaW50ZXJtZWRpYXRlIHJlc3VsdHMgb2YgdGhlIGVzdGltYXRpb25cbiAgICovXG4gIHJlc2V0KCkge1xuICAgIC8qKiBAdG9kbyA6IHdyaXRlIGEgcmVhbCByZXNldCAoc2VlIGMrKyB2ZXJzaW9uKSAqL1xuICAgIHRoaXMubW9kZWxSZXN1bHRzLmZvcndhcmRfaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgfVxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09IFNFVFRFUlMgPT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG4gIC8qKlxuICAgKiBUaGUgbW9kZWwgZ2VuZXJhdGVkIGJ5IFhNTVxuICAgKiBJdCBpcyBtYW5kYXRvcnkgZm9yIHRoZSBjbGFzcyB0byBoYXZlIGEgbW9kZWwgaW4gb3JkZXIgdG8gZG8gaXRzIGpvYlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc2V0IG1vZGVsKG1vZGVsKSB7ICAgICAgXG5cbiAgICB0aGlzLm1vZGVsID0gdW5kZWZpbmVkO1xuICAgIHRoaXMubW9kZWxSZXN1bHRzID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gdGVzdCBpZiBtb2RlbCBpcyB2YWxpZCBoZXJlIChUT0RPIDogd3JpdGUgYSBiZXR0ZXIgdGVzdClcbiAgICBpZihtb2RlbC5tb2RlbHMgIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAvL2NvbnNvbGUubG9nKG1vZGVsKTtcblxuICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgY29uc3QgbSA9IHRoaXMubW9kZWw7XG4gICAgICBjb25zdCBubW9kZWxzID0gbS5tb2RlbHMubGVuZ3RoO1xuXG4gICAgICAvLyBub3QgdXNlZCBhbnltb3JlIChyZXR1cm5zIGEgbW9yZSBjb21wbGV4IGpzIG9iamVjdClcbiAgICAgIC8vIGNvbnN0IG5zdGF0ZXNHbG9iYWwgPSBtLmNvbmZpZ3VyYXRpb24uZGVmYXVsdF9wYXJhbWV0ZXJzLnN0YXRlcztcbiAgICAgIC8vIHRoaXMucGFyYW1zLmZyYW1lU2l6ZSA9IG5zdGF0ZXNHbG9iYWw7XG5cbiAgICAgIHRoaXMubW9kZWxSZXN1bHRzID0ge1xuICAgICAgICBpbnN0YW50X2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG4gICAgICAgIHNtb290aGVkX2xvZ19saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuICAgICAgICBzbW9vdGhlZF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuICAgICAgICBpbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcbiAgICAgICAgc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuICAgICAgICBsaWtlbGllc3Q6IC0xLFxuICAgICAgICBmcm9udGllcl92MTogbmV3IEFycmF5KG5tb2RlbHMpLFxuICAgICAgICBmcm9udGllcl92MjogbmV3IEFycmF5KG5tb2RlbHMpLFxuICAgICAgICBmb3J3YXJkX2luaXRpYWxpemVkOiBmYWxzZSxcbiAgICAgICAgc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHM6IFtdXG4gICAgICB9O1xuXG4gICAgICAvLyBtb3ZlIG91dHB1dF92YWx1ZXMgLyBvdXRwdXRfY292YXJpYW5jZSBoZXJlIGZvciByZWdyZXNzaW9uXG4gICAgICAvLyBhbmQgZHVwZSAoLnNsaWNlKDApKSB0aGVtIGluIHN1Yi1tb2RlbFJlc3VsdHNcbiAgICAgIGNvbnN0IHBhcmFtcyA9IG0uc2hhcmVkX3BhcmFtZXRlcnM7XG4gICAgICBjb25zdCBkaW1PdXQgPSBwYXJhbXMuZGltZW5zaW9uIC0gcGFyYW1zLmRpbWVuc2lvbl9pbnB1dDtcbiAgICAgIHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF92YWx1ZXMgPSBuZXcgQXJyYXkoZGltT3V0KTtcbiAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgICAgICB0aGlzLm1vZGVsUmVzdWx0cy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICAgICAgfVxuXG4gICAgICBsZXQgb3V0Q292YXJTaXplO1xuICAgICAgaWYobS5jb25maWd1cmF0aW9uLmRlZmF1bHRfcGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT0gMCkgeyAvLyBmdWxsXG4gICAgICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dCAqIGRpbU91dDtcbiAgICAgIH1cbiAgICAgIGVsc2UgeyAvLyBkaWFnb25hbFxuICAgICAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQ7XG4gICAgICB9XG4gICAgICB0aGlzLm1vZGVsUmVzdWx0cy5vdXRwdXRfY292YXJpYW5jZSA9IG5ldyBBcnJheShvdXRDb3ZhclNpemUpO1xuICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgICAgIHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF9jb3ZhcmlhbmNlW2ldID0gMC4wO1xuICAgICAgfVxuXG4gICAgICBmb3IobGV0IGkgPSAwOyBpIDwgbm1vZGVsczsgaSsrKSB7XG5cbiAgICAgICAgdGhpcy5tb2RlbFJlc3VsdHMuaW5zdGFudF9saWtlbGlob29kc1tpXSA9IDA7XG4gICAgICAgIHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA9IDA7XG4gICAgICAgIHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX2xpa2VsaWhvb2RzW2ldID0gMDtcbiAgICAgICAgdGhpcy5tb2RlbFJlc3VsdHMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gMDtcbiAgICAgICAgdGhpcy5tb2RlbFJlc3VsdHMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IDA7XG5cbiAgICAgICAgY29uc3QgbnN0YXRlcyA9IG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzO1xuXG4gICAgICAgIGNvbnN0IGFscGhhX2ggPSBuZXcgQXJyYXkoMyk7XG4gICAgICAgIGZvcihsZXQgaj0wOyBqPDM7IGorKykge1xuICAgICAgICAgIGFscGhhX2hbal0gPSBuZXcgQXJyYXkobnN0YXRlcyk7XG4gICAgICAgICAgZm9yKGxldCBrPTA7IGs8bnN0YXRlczsgaysrKSB7XG4gICAgICAgICAgICBhbHBoYV9oW2pdW2tdID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGFscGhhID0gbmV3IEFycmF5KG5zdGF0ZXMpO1xuICAgICAgICBmb3IobGV0IGogPSAwOyBqIDwgbnN0YXRlczsgaisrKSB7XG4gICAgICAgICAgYWxwaGFbal0gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc3Qgd2luU2l6ZSA9IG0uc2hhcmVkX3BhcmFtZXRlcnMubGlrZWxpaG9vZF93aW5kb3dcbiAgICAgICAgLy8gbGV0IGxpa2VsaWhvb2RfYnVmZmVyID0gbmV3IEFycmF5KHdpblNpemUpO1xuICAgICAgICBsZXQgbGlrZWxpaG9vZF9idWZmZXIgPSBuZXcgQXJyYXkodGhpcy5saWtlbGlob29kV2luZG93KTtcbiAgICAgICAgZm9yKGxldCBqID0gMDsgaiA8IHRoaXMubGlrZWxpaG9vZFdpbmRvdzsgaisrKSB7XG4gICAgICAgICAgbGlrZWxpaG9vZF9idWZmZXJbal0gPSAwLjA7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBobW1SZXMgPSB7XG4gICAgICAgICAgaGllcmFyY2hpY2FsOiBtLmNvbmZpZ3VyYXRpb24uZGVmYXVsdF9wYXJhbWV0ZXJzLmhpZXJhcmNoaWNhbCxcbiAgICAgICAgICBpbnN0YW50X2xpa2VsaWhvb2Q6IDAsXG4gICAgICAgICAgbG9nX2xpa2VsaWhvb2Q6IDAsXG4gICAgICAgICAgLy8gZm9yIGNpcmN1bGFyIGJ1ZmZlciBpbXBsZW1lbnRhdGlvblxuICAgICAgICAgIC8vIChzZWUgaG1tVXBkYXRlUmVzdWx0cykgOlxuICAgICAgICAgIGxpa2VsaWhvb2RfYnVmZmVyOiBsaWtlbGlob29kX2J1ZmZlcixcbiAgICAgICAgICBsaWtlbGlob29kX2J1ZmZlcl9pbmRleDogMCxcbiAgICAgICAgICBwcm9ncmVzczogMCxcblxuICAgICAgICAgIGV4aXRfbGlrZWxpaG9vZDogMCxcbiAgICAgICAgICBleGl0X3JhdGlvOiAwLFxuXG4gICAgICAgICAgbGlrZWxpZXN0X3N0YXRlOiAtMSxcblxuICAgICAgICAgIC8vIGZvciBub24taGllcmFyY2hpY2FsIDpcbiAgICAgICAgICBwcmV2aW91c19hbHBoYTogYWxwaGEuc2xpY2UoMCksXG4gICAgICAgICAgYWxwaGE6IGFscGhhLFxuICAgICAgICAgIC8vIGZvciBoaWVyYXJjaGljYWwgOiAgICAgICBcbiAgICAgICAgICBhbHBoYV9oOiBhbHBoYV9oLFxuICAgICAgICAgIHByaW9yOiBuZXcgQXJyYXkobnN0YXRlcyksXG4gICAgICAgICAgdHJhbnNpdGlvbjogbmV3IEFycmF5KG5zdGF0ZXMpLFxuXG4gICAgICAgICAgLy8gdXNlZCBpbiBobW1VcGRhdGVBbHBoYVdpbmRvd1xuICAgICAgICAgIHdpbmRvd19taW5pbmRleDogMCxcbiAgICAgICAgICB3aW5kb3dfbWF4aW5kZXg6IDAsXG4gICAgICAgICAgd2luZG93X25vcm1hbGl6YXRpb25fY29uc3RhbnQ6IDAsXG5cbiAgICAgICAgICAvLyBmb3Igbm9uLWhpZXJhcmNoaWNhbCBtb2RlXG4gICAgICAgICAgZm9yd2FyZF9pbml0aWFsaXplZDogZmFsc2UsXG4gICAgICAgICAgXG4gICAgICAgICAgc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHM6IFtdICAvLyBzdGF0ZXNcbiAgICAgICAgfTtcblxuICAgICAgICBobW1SZXMub3V0cHV0X3ZhbHVlcyA9IHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG4gICAgICAgIGhtbVJlcy5vdXRwdXRfY292YXJpYW5jZSA9IHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF9jb3ZhcmlhbmNlLnNsaWNlKDApO1xuXG4gICAgICAgIC8vIGFkZCBITU0gc3RhdGVzIChHTU1zKVxuICAgICAgICBmb3IobGV0IGogPSAwOyBqIDwgbnN0YXRlczsgaisrKSB7XG4gICAgICAgICAgY29uc3QgZ21tUmVzID0ge1xuICAgICAgICAgICAgaW5zdGFudF9saWtlbGlob29kOiAwLFxuICAgICAgICAgICAgbG9nX2xpa2VsaWhvb2Q6IDBcbiAgICAgICAgICB9O1xuICAgICAgICAgIGdtbVJlcy5iZXRhID0gbmV3IEFycmF5KHRoaXMubW9kZWwubW9kZWxzW2ldLnBhcmFtZXRlcnMuZ2F1c3NpYW5zKTtcbiAgICAgICAgICBmb3IobGV0IGsgPSAwOyBrIDwgZ21tUmVzLmJldGEubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgIGdtbVJlcy5iZXRhW2tdID0gMSAvIGdtbVJlcy5iZXRhLmxlbmd0aDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZ21tUmVzLm91dHB1dF92YWx1ZXMgPSBobW1SZXMub3V0cHV0X3ZhbHVlcy5zbGljZSgwKTtcbiAgICAgICAgICBnbW1SZXMub3V0cHV0X2NvdmFyaWFuY2UgPSBobW1SZXMub3V0cHV0X2NvdmFyaWFuY2Uuc2xpY2UoMCk7XG5cbiAgICAgICAgICBobW1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHMucHVzaChnbW1SZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHMucHVzaChobW1SZXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNldCBsaWtlbGlob29kV2luZG93KG5ld1dpbmRvd1NpemUpIHtcbiAgICB0aGlzLmxpa2VsaWhvb2RXaW5kb3cgPSBuZXdXaW5kb3dTaXplO1xuICAgIGlmKHRoaXMubW9kZWwgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgIGNvbnN0IHJlcyA9IHRoaXMubW9kZWxSZXN1bHRzLnNpbmdsZUNsYXNzTW9kZWxSZXN1bHRzO1xuICAgIGZvcihsZXQgaT0wOyBpPHRoaXMubW9kZWwubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXNbaV0ubGlrZWxpaG9vZF9idWZmZXIgPSBuZXcgQXJyYXkodGhpcy5saWtlbGlob29kV2luZG93KTtcbiAgICAgIGZvcihsZXQgaj0wOyBqPHRoaXMubGlrZWxpaG9vZFdpbmRvdzsgaisrKSB7XG4gICAgICAgIHJlcy5saWtlbGlob29kX2J1ZmZlcltqXSA9IDEgLyB0aGlzLmxpa2VsaWhvb2RXaW5kb3c7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT0gR0VUVEVSUyA9PT09PT09PT09PT09PT09PT09PT09IC8vXG5cbiAgZ2V0IGxpa2VsaWVzdExhYmVsKCkge1xuICAgIGlmKHRoaXMubW9kZWxSZXN1bHRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmKHRoaXMubW9kZWxSZXN1bHRzLmxpa2VsaWVzdCA+IC0xKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLm1vZGVsc1t0aGlzLm1vZGVsUmVzdWx0cy5saWtlbGllc3RdLmxhYmVsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJ3Vua25vd24nO1xuICAgIC8vcmV0dXJuKCdubyBlc3RpbWF0aW9uIGF2YWlsYWJsZScpO1xuICB9XG5cbiAgZ2V0IG5iQ2xhc3NlcygpIHtcbiAgICBpZih0aGlzLm1vZGVsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGg7XG4gICAgfVxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZ2V0IG1vZGVsKCkge1xuICAgIGlmKHRoaXMubW9kZWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIEpTT04uZnJvbVN0cmluZyhKU09OLnN0cmluZ2lmeSh0aGlzLm1vZGVsKSk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXQgbGlrZWxpaG9vZFdpbmRvdygpIHtcbiAgICByZXR1cm4gdGhpcy5saWtlbGlob29kV2luZG93O1xuICB9XG59Il19