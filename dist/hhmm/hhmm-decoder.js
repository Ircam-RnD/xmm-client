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
 * Hierarchical HMM decoder <br />
 * Loads a model trained by the XMM library and processes an input stream of float vectors in real-time.
 * If the model was trained for regression, outputs an estimation of the associated process.
 * @class
 */

var HhmmDecoder = function () {

  /**
   * @param {Number} [windowSize=1] - Size of the likelihood smoothing window.
   */
  function HhmmDecoder() {
    var windowSize = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
    (0, _classCallCheck3.default)(this, HhmmDecoder);


    /**
     * Size of the likelihood smoothing window.
     * @type {number}
     * @private
     */
    this._likelihoodWindow = windowSize;

    /**
     * The model, as generated by XMM from a training data set.
     * @type {Object}
     * @private
     */
    this._model = undefined;

    /**
     * The model results, containing intermediate results that will be passed to the callback in filter.
     * @type {Object}
     * @private
     */
    this._modelResults = undefined;
  }

  /**
   * Callback handling estimation results.
   * @callback HhmmResultsCallback
   * @param {string} err - Description of a potential error.
   * @param {HhmmResults} res - Object holding the estimation results.
   */

  /**
   * Results of the filtering process.
   * @typedef HhmmResults
   * @type {Object}
   * @property {String} likeliest - The likeliest model's label.
   * @property {Number} likeliestIndex - The likeliest model's index
   * @property {Array.number} likelihoods - The array of all models' smoothed normalized likelihoods.
   * @property {Array.number} timeProgressions - The array of all models' normalized time progressions.
   * @property {Array.Array.number} alphas - The array of all models' states likelihoods array.
   * @property {?Array.number} outputValues - If the model was trained with regression, the estimated float vector output.
   * @property {?Array.number} outputCovariance - If the model was trained with regression, the output covariance matrix.
   */

  /**
   * The decoding function.
   * @param {Array.number} observation - An input float vector to be estimated.
   * @param {HhmmResultsCallback} [resultsCallback=null] - The callback handling the estimation results.
   * @returns {HhmmResults} results - The estimation results.
   */


  (0, _createClass3.default)(HhmmDecoder, [{
    key: 'filter',
    value: function filter(observation) {
      var resultsCallback = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      var err = null;
      var res = null;

      if (!this._model) {
        err = 'no model loaded yet';
      } else {
        //console.log(observation);
        //this._observation = observation;
        try {
          hhmmUtils.hhmmFilter(observation, this._model, this._modelResults);

          // create results object from relevant modelResults values :
          var likeliest = this._modelResults.likeliest > -1 ? this._model.models[this._modelResults.likeliest].label : 'unknown';
          var likelihoods = this._modelResults.smoothed_normalized_likelihoods.slice(0);
          res = {
            likeliest: likeliest,
            likeliestIndex: this._modelResults.likeliest,
            likelihoods: likelihoods,
            timeProgressions: new Array(this._model.models.length),
            alphas: new Array(this._model.models.length)
          };

          for (var i = 0; i < this._model.models.length; i++) {
            res.timeProgressions[i] = this._modelResults.singleClassHmmModelResults[i].progress;
            if (this._model.configuration.default_parameters.hierarchical) {
              res.alphas[i] = this._modelResults.singleClassHmmModelResults[i].alpha_h[0];
            } else {
              res.alphas[i] = this._modelResults.singleClassHmmModelResults[i].alpha[0];
            }
          }

          if (this._model.shared_parameters.bimodal) {
            res['outputValues'] = this._modelResults.output_values.slice(0);
            res['outputCovariance'] = this._modelResults.output_covariance.slice(0);
          }
        } catch (e) {
          err = 'problem occured during filtering : ' + e;
        }
      }

      if (resultsCallback) {
        resultsCallback(err, res);
      }
      return res;
    }

    /**
     * Resets the intermediate results of the estimation (shortcut for reloading the model).
     */

  }, {
    key: 'reset',
    value: function reset() {
      if (this._model !== undefined) {
        this._setModel(this._model);
      }
    }

    //========================== GETTERS / SETTERS =============================//

    /**
     * Likelihood smoothing window size.
     * @type {Number}
     */

  }, {
    key: '_setModel',


    /** @private */
    value: function _setModel(model) {

      this._model = undefined;
      this._modelResults = undefined;

      if (!model) return;

      // test if model is valid here (TODO : write a better test)
      if (model.models !== undefined) {
        this._model = model;
        var m = this._model;
        var nmodels = m.models.length;

        this._modelResults = {
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

        var params = m.shared_parameters;
        var dimOut = params.dimension - params.dimension_input;
        this._modelResults.output_values = new Array(dimOut);
        for (var i = 0; i < dimOut; i++) {
          this._modelResults.output_values[i] = 0.0;
        }

        var outCovarSize = void 0;
        if (m.configuration.default_parameters.covariance_mode == 0) {
          //---- full
          outCovarSize = dimOut * dimOut;
        } else {
          //------------------------------------------------------ diagonal
          outCovarSize = dimOut;
        }

        this._modelResults.output_covariance = new Array(outCovarSize);

        for (var _i = 0; _i < dimOut; _i++) {
          this._modelResults.output_covariance[_i] = 0.0;
        }

        for (var _i2 = 0; _i2 < nmodels; _i2++) {
          this._modelResults.instant_likelihoods[_i2] = 0;
          this._modelResults.smoothed_log_likelihoods[_i2] = 0;
          this._modelResults.smoothed_likelihoods[_i2] = 0;
          this._modelResults.instant_normalized_likelihoods[_i2] = 0;
          this._modelResults.smoothed_normalized_likelihoods[_i2] = 0;

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

          var likelihood_buffer = new Array(this._likelihoodWindow);
          for (var _j2 = 0; _j2 < this._likelihoodWindow; _j2++) {
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

            singleClassGmmModelResults: [] // aka states
          };

          hmmRes.output_values = this._modelResults.output_values.slice(0);
          hmmRes.output_covariance = this._modelResults.output_covariance.slice(0);

          // add HMM states (GMMs)
          for (var _j3 = 0; _j3 < nstates; _j3++) {
            var gmmRes = {
              instant_likelihood: 0,
              log_likelihood: 0
            };
            gmmRes.beta = new Array(this._model.models[_i2].parameters.gaussians);
            for (var _k = 0; _k < gmmRes.beta.length; _k++) {
              gmmRes.beta[_k] = 1 / gmmRes.beta.length;
            }
            gmmRes.output_values = hmmRes.output_values.slice(0);
            gmmRes.output_covariance = hmmRes.output_covariance.slice(0);

            hmmRes.singleClassGmmModelResults.push(gmmRes);
          }

          this._modelResults.singleClassHmmModelResults.push(hmmRes);
        }
      }
    }

    /**
     * Currently estimated likeliest label.
     * @readonly
     * @type {String}
     */

  }, {
    key: 'likelihoodWindow',
    get: function get() {
      return this._likelihoodWindow;
    },
    set: function set(newWindowSize) {
      this._likelihoodWindow = newWindowSize;

      if (this._model === undefined) return;

      var res = this._modelResults.singleClassModelResults;

      for (var i = 0; i < this._model.models.length; i++) {
        res[i].likelihood_buffer = new Array(this._likelihoodWindow);

        for (var j = 0; j < this._likelihoodWindow; j++) {
          res.likelihood_buffer[j] = 1 / this._likelihoodWindow;
        }
      }
    }

    /**
     * The model generated by XMM.
     * It is mandatory for the class to have a model in order to do its job.
     * @type {Object}
     */

  }, {
    key: 'model',
    get: function get() {
      if (this._model !== undefined) {
        return JSON.fromString((0, _stringify2.default)(this._model));
      }
      return undefined;
    },
    set: function set(model) {
      this._setModel(model);
    }
  }, {
    key: 'likeliestLabel',
    get: function get() {
      if (this._modelResults !== undefined) {
        if (this._modelResults.likeliest > -1) {
          return this._model.models[this._modelResults.likeliest].label;
        }
      }
      return 'unknown';
    }

    /**
     * Number of classes contained in the model.
     * @readonly
     * @type {Number}
     */

  }, {
    key: 'nbClasses',
    get: function get() {
      if (this._model !== undefined) {
        return this._model.models.length;
      }
      return 0;
    }

    /**
     * Size of the regression vector if model is bimodal.
     * @readonly
     * @type {Number}
     */

  }, {
    key: 'regressionSize',
    get: function get() {
      if (this._model !== undefined) {
        return this._model.shared_parameters.dimension_input;
      }
      return 0;
    }
  }]);
  return HhmmDecoder;
}();

;

exports.default = HhmmDecoder;
//# sourceMappingURL=data:application/json;base64,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Q0QsYUFBTyxDQUFQO0FBQ0Q7Ozs7O0FBQ0Y7O2tCQUVjLFciLCJmaWxlIjoiaGhtbS1kZWNvZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgaGhtbVV0aWxzIGZyb20gJy4uL3V0aWxzL2hobW0tdXRpbHMnO1xuXG4vKipcbiAqIEhpZXJhcmNoaWNhbCBITU0gZGVjb2RlciA8YnIgLz5cbiAqIExvYWRzIGEgbW9kZWwgdHJhaW5lZCBieSB0aGUgWE1NIGxpYnJhcnkgYW5kIHByb2Nlc3NlcyBhbiBpbnB1dCBzdHJlYW0gb2YgZmxvYXQgdmVjdG9ycyBpbiByZWFsLXRpbWUuXG4gKiBJZiB0aGUgbW9kZWwgd2FzIHRyYWluZWQgZm9yIHJlZ3Jlc3Npb24sIG91dHB1dHMgYW4gZXN0aW1hdGlvbiBvZiB0aGUgYXNzb2NpYXRlZCBwcm9jZXNzLlxuICogQGNsYXNzXG4gKi9cblxuY2xhc3MgSGhtbURlY29kZXIge1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge051bWJlcn0gW3dpbmRvd1NpemU9MV0gLSBTaXplIG9mIHRoZSBsaWtlbGlob29kIHNtb290aGluZyB3aW5kb3cuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih3aW5kb3dTaXplID0gMSkge1xuXG4gICAgLyoqXG4gICAgICogU2l6ZSBvZiB0aGUgbGlrZWxpaG9vZCBzbW9vdGhpbmcgd2luZG93LlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl9saWtlbGlob29kV2luZG93ID0gd2luZG93U2l6ZTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBtb2RlbCwgYXMgZ2VuZXJhdGVkIGJ5IFhNTSBmcm9tIGEgdHJhaW5pbmcgZGF0YSBzZXQuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuX21vZGVsID0gdW5kZWZpbmVkO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG1vZGVsIHJlc3VsdHMsIGNvbnRhaW5pbmcgaW50ZXJtZWRpYXRlIHJlc3VsdHMgdGhhdCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgY2FsbGJhY2sgaW4gZmlsdGVyLlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl9tb2RlbFJlc3VsdHMgPSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGJhY2sgaGFuZGxpbmcgZXN0aW1hdGlvbiByZXN1bHRzLlxuICAgKiBAY2FsbGJhY2sgSGhtbVJlc3VsdHNDYWxsYmFja1xuICAgKiBAcGFyYW0ge3N0cmluZ30gZXJyIC0gRGVzY3JpcHRpb24gb2YgYSBwb3RlbnRpYWwgZXJyb3IuXG4gICAqIEBwYXJhbSB7SGhtbVJlc3VsdHN9IHJlcyAtIE9iamVjdCBob2xkaW5nIHRoZSBlc3RpbWF0aW9uIHJlc3VsdHMuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBSZXN1bHRzIG9mIHRoZSBmaWx0ZXJpbmcgcHJvY2Vzcy5cbiAgICogQHR5cGVkZWYgSGhtbVJlc3VsdHNcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQHByb3BlcnR5IHtTdHJpbmd9IGxpa2VsaWVzdCAtIFRoZSBsaWtlbGllc3QgbW9kZWwncyBsYWJlbC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGxpa2VsaWVzdEluZGV4IC0gVGhlIGxpa2VsaWVzdCBtb2RlbCdzIGluZGV4XG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkubnVtYmVyfSBsaWtlbGlob29kcyAtIFRoZSBhcnJheSBvZiBhbGwgbW9kZWxzJyBzbW9vdGhlZCBub3JtYWxpemVkIGxpa2VsaWhvb2RzLlxuICAgKiBAcHJvcGVydHkge0FycmF5Lm51bWJlcn0gdGltZVByb2dyZXNzaW9ucyAtIFRoZSBhcnJheSBvZiBhbGwgbW9kZWxzJyBub3JtYWxpemVkIHRpbWUgcHJvZ3Jlc3Npb25zLlxuICAgKiBAcHJvcGVydHkge0FycmF5LkFycmF5Lm51bWJlcn0gYWxwaGFzIC0gVGhlIGFycmF5IG9mIGFsbCBtb2RlbHMnIHN0YXRlcyBsaWtlbGlob29kcyBhcnJheS5cbiAgICogQHByb3BlcnR5IHs/QXJyYXkubnVtYmVyfSBvdXRwdXRWYWx1ZXMgLSBJZiB0aGUgbW9kZWwgd2FzIHRyYWluZWQgd2l0aCByZWdyZXNzaW9uLCB0aGUgZXN0aW1hdGVkIGZsb2F0IHZlY3RvciBvdXRwdXQuXG4gICAqIEBwcm9wZXJ0eSB7P0FycmF5Lm51bWJlcn0gb3V0cHV0Q292YXJpYW5jZSAtIElmIHRoZSBtb2RlbCB3YXMgdHJhaW5lZCB3aXRoIHJlZ3Jlc3Npb24sIHRoZSBvdXRwdXQgY292YXJpYW5jZSBtYXRyaXguXG4gICAqL1xuXG4gIC8qKlxuICAgKiBUaGUgZGVjb2RpbmcgZnVuY3Rpb24uXG4gICAqIEBwYXJhbSB7QXJyYXkubnVtYmVyfSBvYnNlcnZhdGlvbiAtIEFuIGlucHV0IGZsb2F0IHZlY3RvciB0byBiZSBlc3RpbWF0ZWQuXG4gICAqIEBwYXJhbSB7SGhtbVJlc3VsdHNDYWxsYmFja30gW3Jlc3VsdHNDYWxsYmFjaz1udWxsXSAtIFRoZSBjYWxsYmFjayBoYW5kbGluZyB0aGUgZXN0aW1hdGlvbiByZXN1bHRzLlxuICAgKiBAcmV0dXJucyB7SGhtbVJlc3VsdHN9IHJlc3VsdHMgLSBUaGUgZXN0aW1hdGlvbiByZXN1bHRzLlxuICAgKi9cbiAgZmlsdGVyKG9ic2VydmF0aW9uLCByZXN1bHRzQ2FsbGJhY2sgPSBudWxsKSB7XG4gICAgbGV0IGVyciA9IG51bGw7XG4gICAgbGV0IHJlcyA9IG51bGw7XG5cbiAgICBpZighdGhpcy5fbW9kZWwpIHtcbiAgICAgIGVyciA9ICdubyBtb2RlbCBsb2FkZWQgeWV0JztcbiAgICB9IGVsc2Uge1xuICAgICAgLy9jb25zb2xlLmxvZyhvYnNlcnZhdGlvbik7XG4gICAgICAvL3RoaXMuX29ic2VydmF0aW9uID0gb2JzZXJ2YXRpb247XG4gICAgICB0cnkge1xuICAgICAgICBoaG1tVXRpbHMuaGhtbUZpbHRlcihvYnNlcnZhdGlvbiwgdGhpcy5fbW9kZWwsIHRoaXMuX21vZGVsUmVzdWx0cyk7XG5cbiAgICAgICAgLy8gY3JlYXRlIHJlc3VsdHMgb2JqZWN0IGZyb20gcmVsZXZhbnQgbW9kZWxSZXN1bHRzIHZhbHVlcyA6XG4gICAgICAgIGNvbnN0IGxpa2VsaWVzdCA9ICh0aGlzLl9tb2RlbFJlc3VsdHMubGlrZWxpZXN0ID4gLTEpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuX21vZGVsLm1vZGVsc1t0aGlzLl9tb2RlbFJlc3VsdHMubGlrZWxpZXN0XS5sYWJlbFxuICAgICAgICAgICAgICAgICAgICAgICAgOiAndW5rbm93bic7XG4gICAgICAgIGNvbnN0IGxpa2VsaWhvb2RzID0gdGhpcy5fbW9kZWxSZXN1bHRzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMuc2xpY2UoMCk7XG4gICAgICAgIHJlcyA9IHtcbiAgICAgICAgICBsaWtlbGllc3Q6IGxpa2VsaWVzdCxcbiAgICAgICAgICBsaWtlbGllc3RJbmRleDogdGhpcy5fbW9kZWxSZXN1bHRzLmxpa2VsaWVzdCxcbiAgICAgICAgICBsaWtlbGlob29kczogbGlrZWxpaG9vZHMsXG4gICAgICAgICAgdGltZVByb2dyZXNzaW9uczogbmV3IEFycmF5KHRoaXMuX21vZGVsLm1vZGVscy5sZW5ndGgpLFxuICAgICAgICAgIGFscGhhczogbmV3IEFycmF5KHRoaXMuX21vZGVsLm1vZGVscy5sZW5ndGgpXG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9tb2RlbC5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICByZXMudGltZVByb2dyZXNzaW9uc1tpXSA9IHRoaXMuX21vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5wcm9ncmVzcztcbiAgICAgICAgICBpZiAodGhpcy5fbW9kZWwuY29uZmlndXJhdGlvbi5kZWZhdWx0X3BhcmFtZXRlcnMuaGllcmFyY2hpY2FsKSB7XG4gICAgICAgICAgICByZXMuYWxwaGFzW2ldXG4gICAgICAgICAgICAgID0gdGhpcy5fbW9kZWxSZXN1bHRzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbMF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcy5hbHBoYXNbaV1cbiAgICAgICAgICAgICAgPSB0aGlzLl9tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFbMF07XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX21vZGVsLnNoYXJlZF9wYXJhbWV0ZXJzLmJpbW9kYWwpIHtcbiAgICAgICAgICByZXNbJ291dHB1dFZhbHVlcyddID0gdGhpcy5fbW9kZWxSZXN1bHRzLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG4gICAgICAgICAgcmVzWydvdXRwdXRDb3ZhcmlhbmNlJ11cbiAgICAgICAgICAgICAgPSB0aGlzLl9tb2RlbFJlc3VsdHMub3V0cHV0X2NvdmFyaWFuY2Uuc2xpY2UoMCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgZXJyID0gJ3Byb2JsZW0gb2NjdXJlZCBkdXJpbmcgZmlsdGVyaW5nIDogJyArIGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdHNDYWxsYmFjaykge1xuICAgICAgcmVzdWx0c0NhbGxiYWNrKGVyciwgcmVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgdGhlIGludGVybWVkaWF0ZSByZXN1bHRzIG9mIHRoZSBlc3RpbWF0aW9uIChzaG9ydGN1dCBmb3IgcmVsb2FkaW5nIHRoZSBtb2RlbCkuXG4gICAqL1xuICByZXNldCgpIHtcbiAgICBpZiAodGhpcy5fbW9kZWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fc2V0TW9kZWwodGhpcy5fbW9kZWwpO1xuICAgIH1cbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT0gR0VUVEVSUyAvIFNFVFRFUlMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT0vL1xuXG4gIC8qKlxuICAgKiBMaWtlbGlob29kIHNtb290aGluZyB3aW5kb3cgc2l6ZS5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIGdldCBsaWtlbGlob29kV2luZG93KCkge1xuICAgIHJldHVybiB0aGlzLl9saWtlbGlob29kV2luZG93O1xuICB9XG5cbiAgc2V0IGxpa2VsaWhvb2RXaW5kb3cobmV3V2luZG93U2l6ZSkge1xuICAgIHRoaXMuX2xpa2VsaWhvb2RXaW5kb3cgPSBuZXdXaW5kb3dTaXplO1xuXG4gICAgaWYgKHRoaXMuX21vZGVsID09PSB1bmRlZmluZWQpIHJldHVybjtcblxuICAgIGNvbnN0IHJlcyA9IHRoaXMuX21vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc01vZGVsUmVzdWx0cztcbiAgICBcbiAgICBmb3IgKGxldCBpPTA7IGk8dGhpcy5fbW9kZWwubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXNbaV0ubGlrZWxpaG9vZF9idWZmZXIgPSBuZXcgQXJyYXkodGhpcy5fbGlrZWxpaG9vZFdpbmRvdyk7XG5cbiAgICAgIGZvciAobGV0IGo9MDsgajx0aGlzLl9saWtlbGlob29kV2luZG93OyBqKyspIHtcbiAgICAgICAgcmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMSAvIHRoaXMuX2xpa2VsaWhvb2RXaW5kb3c7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBtb2RlbCBnZW5lcmF0ZWQgYnkgWE1NLlxuICAgKiBJdCBpcyBtYW5kYXRvcnkgZm9yIHRoZSBjbGFzcyB0byBoYXZlIGEgbW9kZWwgaW4gb3JkZXIgdG8gZG8gaXRzIGpvYi5cbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIGdldCBtb2RlbCgpIHtcbiAgICBpZiAodGhpcy5fbW9kZWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIEpTT04uZnJvbVN0cmluZyhKU09OLnN0cmluZ2lmeSh0aGlzLl9tb2RlbCkpO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgc2V0IG1vZGVsKG1vZGVsKSB7XG4gICAgdGhpcy5fc2V0TW9kZWwobW9kZWwpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9zZXRNb2RlbChtb2RlbCkgeyAgICAgIFxuXG4gICAgdGhpcy5fbW9kZWwgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fbW9kZWxSZXN1bHRzID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKCFtb2RlbCkgcmV0dXJuO1xuXG4gICAgLy8gdGVzdCBpZiBtb2RlbCBpcyB2YWxpZCBoZXJlIChUT0RPIDogd3JpdGUgYSBiZXR0ZXIgdGVzdClcbiAgICBpZiAobW9kZWwubW9kZWxzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX21vZGVsID0gbW9kZWw7XG4gICAgICBjb25zdCBtID0gdGhpcy5fbW9kZWw7XG4gICAgICBjb25zdCBubW9kZWxzID0gbS5tb2RlbHMubGVuZ3RoO1xuXG4gICAgICB0aGlzLl9tb2RlbFJlc3VsdHMgPSB7XG4gICAgICAgIGluc3RhbnRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcbiAgICAgICAgc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG4gICAgICAgIHNtb290aGVkX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG4gICAgICAgIGluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuICAgICAgICBzbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG4gICAgICAgIGxpa2VsaWVzdDogLTEsXG4gICAgICAgIGZyb250aWVyX3YxOiBuZXcgQXJyYXkobm1vZGVscyksXG4gICAgICAgIGZyb250aWVyX3YyOiBuZXcgQXJyYXkobm1vZGVscyksXG4gICAgICAgIGZvcndhcmRfaW5pdGlhbGl6ZWQ6IGZhbHNlLFxuICAgICAgICBzaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0czogW11cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHBhcmFtcyA9IG0uc2hhcmVkX3BhcmFtZXRlcnM7XG4gICAgICBjb25zdCBkaW1PdXQgPSBwYXJhbXMuZGltZW5zaW9uIC0gcGFyYW1zLmRpbWVuc2lvbl9pbnB1dDtcbiAgICAgIHRoaXMuX21vZGVsUmVzdWx0cy5vdXRwdXRfdmFsdWVzID0gbmV3IEFycmF5KGRpbU91dCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpbU91dDsgaSsrKSB7XG4gICAgICAgIHRoaXMuX21vZGVsUmVzdWx0cy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICAgICAgfVxuXG4gICAgICBsZXQgb3V0Q292YXJTaXplO1xuICAgICAgaWYgKG0uY29uZmlndXJhdGlvbi5kZWZhdWx0X3BhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09IDApIHsgLy8tLS0tIGZ1bGxcbiAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0ICogZGltT3V0O1xuICAgICAgfSBlbHNlIHsgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0O1xuICAgICAgfVxuICAgICAgXG4gICAgICB0aGlzLl9tb2RlbFJlc3VsdHMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgICAgICB0aGlzLl9tb2RlbFJlc3VsdHMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm1vZGVsczsgaSsrKSB7XG4gICAgICAgIHRoaXMuX21vZGVsUmVzdWx0cy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldID0gMDtcbiAgICAgICAgdGhpcy5fbW9kZWxSZXN1bHRzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA9IDA7XG4gICAgICAgIHRoaXMuX21vZGVsUmVzdWx0cy5zbW9vdGhlZF9saWtlbGlob29kc1tpXSA9IDA7XG4gICAgICAgIHRoaXMuX21vZGVsUmVzdWx0cy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSAwO1xuICAgICAgICB0aGlzLl9tb2RlbFJlc3VsdHMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IDA7XG5cbiAgICAgICAgY29uc3QgbnN0YXRlcyA9IG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzO1xuXG4gICAgICAgIGNvbnN0IGFscGhhX2ggPSBuZXcgQXJyYXkoMyk7XG4gICAgICAgIGZvciAobGV0IGo9MDsgajwzOyBqKyspIHtcbiAgICAgICAgICBhbHBoYV9oW2pdID0gbmV3IEFycmF5KG5zdGF0ZXMpO1xuICAgICAgICAgIGZvciAobGV0IGs9MDsgazxuc3RhdGVzOyBrKyspIHtcbiAgICAgICAgICAgIGFscGhhX2hbal1ba10gPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3QgYWxwaGEgPSBuZXcgQXJyYXkobnN0YXRlcyk7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnN0YXRlczsgaisrKSB7XG4gICAgICAgICAgYWxwaGFbal0gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGxpa2VsaWhvb2RfYnVmZmVyID0gbmV3IEFycmF5KHRoaXMuX2xpa2VsaWhvb2RXaW5kb3cpO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMuX2xpa2VsaWhvb2RXaW5kb3c7IGorKykge1xuICAgICAgICAgIGxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMC4wO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaG1tUmVzID0ge1xuICAgICAgICAgIGhpZXJhcmNoaWNhbDogbS5jb25maWd1cmF0aW9uLmRlZmF1bHRfcGFyYW1ldGVycy5oaWVyYXJjaGljYWwsXG4gICAgICAgICAgaW5zdGFudF9saWtlbGlob29kOiAwLFxuICAgICAgICAgIGxvZ19saWtlbGlob29kOiAwLFxuICAgICAgICAgIC8vIGZvciBjaXJjdWxhciBidWZmZXIgaW1wbGVtZW50YXRpb25cbiAgICAgICAgICAvLyAoc2VlIGhtbVVwZGF0ZVJlc3VsdHMpIDpcbiAgICAgICAgICBsaWtlbGlob29kX2J1ZmZlcjogbGlrZWxpaG9vZF9idWZmZXIsXG4gICAgICAgICAgbGlrZWxpaG9vZF9idWZmZXJfaW5kZXg6IDAsXG4gICAgICAgICAgcHJvZ3Jlc3M6IDAsXG5cbiAgICAgICAgICBleGl0X2xpa2VsaWhvb2Q6IDAsXG4gICAgICAgICAgZXhpdF9yYXRpbzogMCxcblxuICAgICAgICAgIGxpa2VsaWVzdF9zdGF0ZTogLTEsXG5cbiAgICAgICAgICAvLyBmb3Igbm9uLWhpZXJhcmNoaWNhbCA6XG4gICAgICAgICAgcHJldmlvdXNfYWxwaGE6IGFscGhhLnNsaWNlKDApLFxuICAgICAgICAgIGFscGhhOiBhbHBoYSxcbiAgICAgICAgICAvLyBmb3IgaGllcmFyY2hpY2FsIDogICAgICAgXG4gICAgICAgICAgYWxwaGFfaDogYWxwaGFfaCxcbiAgICAgICAgICBwcmlvcjogbmV3IEFycmF5KG5zdGF0ZXMpLFxuICAgICAgICAgIHRyYW5zaXRpb246IG5ldyBBcnJheShuc3RhdGVzKSxcblxuICAgICAgICAgIC8vIHVzZWQgaW4gaG1tVXBkYXRlQWxwaGFXaW5kb3dcbiAgICAgICAgICB3aW5kb3dfbWluaW5kZXg6IDAsXG4gICAgICAgICAgd2luZG93X21heGluZGV4OiAwLFxuICAgICAgICAgIHdpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50OiAwLFxuXG4gICAgICAgICAgLy8gZm9yIG5vbi1oaWVyYXJjaGljYWwgbW9kZVxuICAgICAgICAgIGZvcndhcmRfaW5pdGlhbGl6ZWQ6IGZhbHNlLFxuICAgICAgICAgIFxuICAgICAgICAgIHNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzOiBbXSAgLy8gYWthIHN0YXRlc1xuICAgICAgICB9O1xuXG4gICAgICAgIGhtbVJlcy5vdXRwdXRfdmFsdWVzID0gdGhpcy5fbW9kZWxSZXN1bHRzLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG4gICAgICAgIGhtbVJlcy5vdXRwdXRfY292YXJpYW5jZSA9IHRoaXMuX21vZGVsUmVzdWx0cy5vdXRwdXRfY292YXJpYW5jZS5zbGljZSgwKTtcblxuICAgICAgICAvLyBhZGQgSE1NIHN0YXRlcyAoR01NcylcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBuc3RhdGVzOyBqKyspIHtcbiAgICAgICAgICBjb25zdCBnbW1SZXMgPSB7XG4gICAgICAgICAgICBpbnN0YW50X2xpa2VsaWhvb2Q6IDAsXG4gICAgICAgICAgICBsb2dfbGlrZWxpaG9vZDogMFxuICAgICAgICAgIH07XG4gICAgICAgICAgZ21tUmVzLmJldGEgPSBuZXcgQXJyYXkodGhpcy5fbW9kZWwubW9kZWxzW2ldLnBhcmFtZXRlcnMuZ2F1c3NpYW5zKTtcbiAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGdtbVJlcy5iZXRhLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICBnbW1SZXMuYmV0YVtrXSA9IDEgLyBnbW1SZXMuYmV0YS5sZW5ndGg7XG4gICAgICAgICAgfVxuICAgICAgICAgIGdtbVJlcy5vdXRwdXRfdmFsdWVzID0gaG1tUmVzLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG4gICAgICAgICAgZ21tUmVzLm91dHB1dF9jb3ZhcmlhbmNlID0gaG1tUmVzLm91dHB1dF9jb3ZhcmlhbmNlLnNsaWNlKDApO1xuXG4gICAgICAgICAgaG1tUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzLnB1c2goZ21tUmVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX21vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0cy5wdXNoKGhtbVJlcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEN1cnJlbnRseSBlc3RpbWF0ZWQgbGlrZWxpZXN0IGxhYmVsLlxuICAgKiBAcmVhZG9ubHlcbiAgICogQHR5cGUge1N0cmluZ31cbiAgICovXG4gIGdldCBsaWtlbGllc3RMYWJlbCgpIHtcbiAgICBpZiAodGhpcy5fbW9kZWxSZXN1bHRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0aGlzLl9tb2RlbFJlc3VsdHMubGlrZWxpZXN0ID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21vZGVsLm1vZGVsc1t0aGlzLl9tb2RlbFJlc3VsdHMubGlrZWxpZXN0XS5sYWJlbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICd1bmtub3duJztcbiAgfVxuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgY2xhc3NlcyBjb250YWluZWQgaW4gdGhlIG1vZGVsLlxuICAgKiBAcmVhZG9ubHlcbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIGdldCBuYkNsYXNzZXMoKSB7XG4gICAgaWYgKHRoaXMuX21vZGVsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9tb2RlbC5tb2RlbHMubGVuZ3RoO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaXplIG9mIHRoZSByZWdyZXNzaW9uIHZlY3RvciBpZiBtb2RlbCBpcyBiaW1vZGFsLlxuICAgKiBAcmVhZG9ubHlcbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIGdldCByZWdyZXNzaW9uU2l6ZSgpIHtcbiAgICBpZiAodGhpcy5fbW9kZWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX21vZGVsLnNoYXJlZF9wYXJhbWV0ZXJzLmRpbWVuc2lvbl9pbnB1dDtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IEhobW1EZWNvZGVyOyJdfQ==