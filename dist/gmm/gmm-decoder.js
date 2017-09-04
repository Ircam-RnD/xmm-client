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

var _gmmUtils = require('../utils/gmm-utils');

var gmmUtils = _interopRequireWildcard(_gmmUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * GMM decoder <br />
 * Loads a model trained by the XMM library and processes an input stream of float vectors in real-time.
 * If the model was trained for regression, outputs an estimation of the associated process.
 * @class
 */

var GmmDecoder = function () {

  /**
   * @param {Number} [windowSize=1] - Size of the likelihood smoothing window.
   */
  function GmmDecoder() {
    var windowSize = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    (0, _classCallCheck3.default)(this, GmmDecoder);


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

    /**
     * Size of the likelihood smoothing window.
     * @type {Number}
     * @private
     */
    this._likelihoodWindow = windowSize;

    this._weights = [];
  }

  /**
   * Callback handling estimation results.
   * @callback gmmResultsCallback
   * @param {String} err - Description of a potential error.
   * @param {gmmResults} res - Object holding the estimation results.
   */

  /**
   * Results of the filtering process.
   * @typedef gmmResults
   * @type {Object}
   * @name gmmResults
   * @property {String} likeliest - The likeliest model's label.
   * @property {Number} likeliestIndex - The likeliest model's index
   * @property {Array.number} likelihoods - The array of all models' smoothed normalized likelihoods.
   * @property {?Array.number} outputValues - If the model was trained with regression, the estimated float vector output.
   * @property {?Array.number} outputCovariance - If the model was trained with regression, the output covariance matrix.
   */

  /**
   * The decoding function.
   * @param {Array} observation - An input float vector to be estimated.
   * @param {gmmResultsCallback} [resultsCallback=null] - The callback handling the estimation results.
   * @returns {gmmResults}
   */


  (0, _createClass3.default)(GmmDecoder, [{
    key: 'filter',
    value: function filter(observation) {
      var resultsCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      var err = null;
      var res = null;

      if (!this._model) {
        err = 'no model loaded yet';
      } else {
        try {
          gmmUtils.gmmFilter(observation, this._model, this._modelResults);

          // create results object from relevant modelResults values :
          var likeliest = this._modelResults.likeliest > -1 ? this._model.models[this._modelResults.likeliest].label : 'unknown';
          var likelihoods = this._modelResults.smoothed_normalized_likelihoods.slice(0);
          res = {
            likeliest: likeliest,
            likeliestIndex: this._modelResults.likeliest,
            likelihoods: likelihoods,
            outputValues: [],
            outputCovariance: []
          };

          // add regression results to global results if bimodal :
          if (this._model.shared_parameters.bimodal) {
            res['outputValues'] = this._modelResults.output_values.slice(0);
            res['outputCovariance'] = this.modelResults.output_covariance.slice(0);
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

    //=========================== GETTERS / SETTERS ============================//

    /***
     * Likelihood smoothing window size.
     * @type {Number}
     */
    // get likelihoodWindow() {
    //   return this._likelihoodWindow;
    // }

    // set likelihoodWindow(newWindowSize) {
    //   this._likelihoodWindow = newWindowSize;
    //   this._updateLikelihoodWindow();
    // }

    /**
     * Get the likelihood smoothing window size.
     * @returns {Number}
     */

  }, {
    key: 'getLikelihoodWindow',
    value: function getLikelihoodWindow() {
      return this._likelihoodWindow;
    }

    /**
     * Set the likelihood smoothing window size.
     * @param {Number} newWindowSize - the new window size.
     */

  }, {
    key: 'setLikelihoodWindow',
    value: function setLikelihoodWindow(newWindowSize) {
      this._likelihoodWindow = newWindowSize;
      this._updateLikelihoodWindow();
    }

    /** @private */

  }, {
    key: '_updateLikelihoodWindow',
    value: function _updateLikelihoodWindow() {
      if (this._model === undefined) return;

      var res = this._modelResults.singleClassGmmModelResults;

      for (var i = 0; i < this._model.models.length; i++) {
        res[i].likelihood_buffer = new Array(this._likelihoodWindow);

        for (var j = 0; j < this._likelihoodWindow; j++) {
          res[i].likelihood_buffer[j] = 1 / this._likelihoodWindow;
        }
      }
    }
  }, {
    key: 'setWeights',
    value: function setWeights(newWeights) {
      if (!Array.isArray(newWeights)) {
        throw new Error('Weights must be an array');
      }

      this._weights = newWeights;
      this._updateWeights();
    }

    /** @private */

  }, {
    key: '_updateWeights',
    value: function _updateWeights() {
      if (this._model === undefined) return;

      var m = this._model;
      var params = m.shared_parameters;
      var dimIn = params.bimodal ? params.dimension_input : params.dimension;

      var w = this._weights.slice();

      if (w.length < dimIn) {
        var onesToAdd = dimIn - w.length;

        for (var i = 0; i < onesToAdd; i++) {
          w.push(1);
        }
      } else if (w.length > dimIn) {
        w.splice(dimIn - 1);
      }

      for (var _i = 0; _i < w.length; _i++) {
        w[_i] = Math.max(w[_i], 0);
      }

      for (var _i2 = 0; _i2 < m.models.length; _i2++) {
        for (var j = 0; j < m.models[_i2].components.length; j++) {
          m.models[_i2].components[j].weights = w;
        }
      }
    }

    /**
     * A valid XMM GMM model
     * @typedef xmmGmmModel
     * @type {Object}
     * @name xmmGmmModel
     * @property {String} TODO - LIST REAL GMM MODEL PROPERTIES HERE
     */

    /***
     * The model generated by XMM.
     * It is mandatory for the class to have a model in order to do its job.
     * @type {xmmGmmModel}
     */
    // get model() {
    //   return this.getModel();
    // }

    // set model(model) {
    //   this.setModel(model);
    // }

    /**
     * Get the actual XMM GMM model.
     * @returns {xmmGmmModel}
     */

  }, {
    key: 'getModel',
    value: function getModel() {
      if (this._model) {
        return JSON.parse((0, _stringify2.default)(this._model));
      }
      return undefined;
    }

    /**
     * Set the actual XMM GMM model.
     * @param {xmmGmmModel} model
     */

  }, {
    key: 'setModel',
    value: function setModel(model) {
      this._setModel(model);
    }

    /** @private */

  }, {
    key: '_setModel',
    value: function _setModel(model) {
      this._model = undefined;
      this._modelResults = undefined;

      if (!model) return;

      // test if model is valid here (TODO : write a better test)
      if (model.models !== undefined) {
        this._model = model;

        // adds user defined weights to the model (default [1, 1, ..., 1])
        this._updateWeights();

        var m = this._model;
        var nmodels = m.models.length;

        this._modelResults = {
          instant_likelihoods: new Array(nmodels),
          smoothed_log_likelihoods: new Array(nmodels),
          smoothed_likelihoods: new Array(nmodels),
          instant_normalized_likelihoods: new Array(nmodels),
          smoothed_normalized_likelihoods: new Array(nmodels),
          likeliest: -1,
          singleClassGmmModelResults: []
        };

        // the following variables are used for regression :
        var params = m.shared_parameters;
        var dimOut = params.dimension - params.dimension_input;
        this._modelResults.output_values = new Array(dimOut);

        for (var i = 0; i < dimOut; i++) {
          this._modelResults.output_values[i] = 0.0;
        }

        var outCovarSize = void 0;
        //------------------------------------------------------------------- full
        if (m.configuration.default_parameters.covariance_mode == 0) {
          outCovarSize = dimOut * dimOut;
          //--------------------------------------------------------------- diagonal
        } else {
          outCovarSize = dimOut;
        }

        this._modelResults.output_covariance = new Array(outCovarSize);

        for (var _i3 = 0; _i3 < dimOut; _i3++) {
          this._modelResults.output_covariance[_i3] = 0.0;
        }

        for (var _i4 = 0; _i4 < nmodels; _i4++) {
          this._modelResults.instant_likelihoods[_i4] = 0;
          this._modelResults.smoothed_log_likelihoods[_i4] = 0;
          this._modelResults.smoothed_likelihoods[_i4] = 0;
          this._modelResults.instant_normalized_likelihoods[_i4] = 0;
          this._modelResults.smoothed_normalized_likelihoods[_i4] = 0;

          var res = {
            instant_likelihood: 0,
            log_likelihood: 0
          };

          res.likelihood_buffer = new Array(this._likelihoodWindow);

          for (var j = 0; j < this._likelihoodWindow; j++) {
            res.likelihood_buffer[j] = 1 / this._likelihoodWindow;
          }

          res.likelihood_buffer_index = 0;

          // the following variables are used for regression :
          res.beta = new Array(m.models[_i4].components.length);

          for (var _j = 0; _j < res.beta.length; _j++) {
            res.beta[_j] = 1 / res.beta.length;
          }

          res.output_values = this._modelResults.output_values.slice(0);
          res.output_covariance = this._modelResults.output_covariance.slice(0);

          // now add this singleModelResults object
          // to the global modelResults object :
          this._modelResults.singleClassGmmModelResults.push(res);
        }
      }
    }

    /***
     * Currently estimated likeliest label.
     * @readonly
     * @type {String}
     */
    // get likeliestLabel() {
    //   return this.getLikeliestLabel();
    // }

    /**
     * Get the currently estimated likeliest label.
     * @returns {String}
     */

  }, {
    key: 'getLikeliestLabel',
    value: function getLikeliestLabel() {
      if (this._modelResults) {
        if (this._modelResults.likeliest > -1) {
          return this._model.models[this._modelResults.likeliest].label;
        }
      }
      return 'unknown';
    }

    /***
     * Number of classes contained in the model.
     * @readonly
     * @type {Number}
     */
    // get nbClasses() {
    //   return this.getNumberOfClasses();
    // }

    /**
     * Get the total number of classes the model was trained with.
     * @returns {Number}
     */

  }, {
    key: 'getNumberOfClasses',
    value: function getNumberOfClasses() {
      if (this._model) {
        return this._model.models.length;
      }
      return 0;
    }

    /***
     * Size of the regression vector if model is bimodal.
     * @readonly
     * @type {Number}
     */
    // get regressionSize() {
    //   return this.getRegressionVectorSize();
    // }

    /**
     * Get the output dimension of the model (size of a regression vector).
     * @returns {Number}
     */

  }, {
    key: 'getRegressionVectorSize',
    value: function getRegressionVectorSize() {
      if (this._model) {
        var params = this._model.shared_parameters;
        return params['bimodal'] ? params['dimension'] - params['dimension_input'] : 0;
      }
      return 0;
    }
  }]);
  return GmmDecoder;
}();

;

exports.default = GmmDecoder;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdtbS1kZWNvZGVyLmpzIl0sIm5hbWVzIjpbImdtbVV0aWxzIiwiR21tRGVjb2RlciIsIndpbmRvd1NpemUiLCJfbW9kZWwiLCJ1bmRlZmluZWQiLCJfbW9kZWxSZXN1bHRzIiwiX2xpa2VsaWhvb2RXaW5kb3ciLCJfd2VpZ2h0cyIsIm9ic2VydmF0aW9uIiwicmVzdWx0c0NhbGxiYWNrIiwiZXJyIiwicmVzIiwiZ21tRmlsdGVyIiwibGlrZWxpZXN0IiwibW9kZWxzIiwibGFiZWwiLCJsaWtlbGlob29kcyIsInNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMiLCJzbGljZSIsImxpa2VsaWVzdEluZGV4Iiwib3V0cHV0VmFsdWVzIiwib3V0cHV0Q292YXJpYW5jZSIsInNoYXJlZF9wYXJhbWV0ZXJzIiwiYmltb2RhbCIsIm91dHB1dF92YWx1ZXMiLCJtb2RlbFJlc3VsdHMiLCJvdXRwdXRfY292YXJpYW5jZSIsImUiLCJuZXdXaW5kb3dTaXplIiwiX3VwZGF0ZUxpa2VsaWhvb2RXaW5kb3ciLCJzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cyIsImkiLCJsZW5ndGgiLCJsaWtlbGlob29kX2J1ZmZlciIsIkFycmF5IiwiaiIsIm5ld1dlaWdodHMiLCJpc0FycmF5IiwiRXJyb3IiLCJfdXBkYXRlV2VpZ2h0cyIsIm0iLCJwYXJhbXMiLCJkaW1JbiIsImRpbWVuc2lvbl9pbnB1dCIsImRpbWVuc2lvbiIsInciLCJvbmVzVG9BZGQiLCJwdXNoIiwic3BsaWNlIiwiTWF0aCIsIm1heCIsImNvbXBvbmVudHMiLCJ3ZWlnaHRzIiwiSlNPTiIsInBhcnNlIiwibW9kZWwiLCJfc2V0TW9kZWwiLCJubW9kZWxzIiwiaW5zdGFudF9saWtlbGlob29kcyIsInNtb290aGVkX2xvZ19saWtlbGlob29kcyIsInNtb290aGVkX2xpa2VsaWhvb2RzIiwiaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzIiwiZGltT3V0Iiwib3V0Q292YXJTaXplIiwiY29uZmlndXJhdGlvbiIsImRlZmF1bHRfcGFyYW1ldGVycyIsImNvdmFyaWFuY2VfbW9kZSIsImluc3RhbnRfbGlrZWxpaG9vZCIsImxvZ19saWtlbGlob29kIiwibGlrZWxpaG9vZF9idWZmZXJfaW5kZXgiLCJiZXRhIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7SUFBWUEsUTs7Ozs7O0FBRVo7Ozs7Ozs7SUFPTUMsVTs7QUFFSjs7O0FBR0Esd0JBQTRCO0FBQUEsUUFBaEJDLFVBQWdCLHVFQUFILENBQUc7QUFBQTs7O0FBRTFCOzs7OztBQUtBLFNBQUtDLE1BQUwsR0FBY0MsU0FBZDs7QUFFQTs7Ozs7QUFLQSxTQUFLQyxhQUFMLEdBQXFCRCxTQUFyQjs7QUFFQTs7Ozs7QUFLQSxTQUFLRSxpQkFBTCxHQUF5QkosVUFBekI7O0FBRUEsU0FBS0ssUUFBTCxHQUFnQixFQUFoQjtBQUNEOztBQUVEOzs7Ozs7O0FBT0E7Ozs7Ozs7Ozs7OztBQVlBOzs7Ozs7Ozs7OzJCQU1PQyxXLEVBQXFDO0FBQUEsVUFBeEJDLGVBQXdCLHVFQUFOLElBQU07O0FBQzFDLFVBQUlDLE1BQU0sSUFBVjtBQUNBLFVBQUlDLE1BQU0sSUFBVjs7QUFFQSxVQUFHLENBQUMsS0FBS1IsTUFBVCxFQUFpQjtBQUNmTyxjQUFNLHFCQUFOO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsWUFBSTtBQUNGVixtQkFBU1ksU0FBVCxDQUFtQkosV0FBbkIsRUFBZ0MsS0FBS0wsTUFBckMsRUFBNkMsS0FBS0UsYUFBbEQ7O0FBRUE7QUFDQSxjQUFNUSxZQUFhLEtBQUtSLGFBQUwsQ0FBbUJRLFNBQW5CLEdBQStCLENBQUMsQ0FBakMsR0FDQSxLQUFLVixNQUFMLENBQVlXLE1BQVosQ0FBbUIsS0FBS1QsYUFBTCxDQUFtQlEsU0FBdEMsRUFBaURFLEtBRGpELEdBRUEsU0FGbEI7QUFHQSxjQUFNQyxjQUFjLEtBQUtYLGFBQUwsQ0FBbUJZLCtCQUFuQixDQUFtREMsS0FBbkQsQ0FBeUQsQ0FBekQsQ0FBcEI7QUFDQVAsZ0JBQU07QUFDSkUsdUJB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QUNEOzs7OztBQUNGOztrQkFFY3hDLFUiLCJmaWxlIjoiZ21tLWRlY29kZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBnbW1VdGlscyBmcm9tICcuLi91dGlscy9nbW0tdXRpbHMnO1xuXG4vKipcbiAqIEdNTSBkZWNvZGVyIDxiciAvPlxuICogTG9hZHMgYSBtb2RlbCB0cmFpbmVkIGJ5IHRoZSBYTU0gbGlicmFyeSBhbmQgcHJvY2Vzc2VzIGFuIGlucHV0IHN0cmVhbSBvZiBmbG9hdCB2ZWN0b3JzIGluIHJlYWwtdGltZS5cbiAqIElmIHRoZSBtb2RlbCB3YXMgdHJhaW5lZCBmb3IgcmVncmVzc2lvbiwgb3V0cHV0cyBhbiBlc3RpbWF0aW9uIG9mIHRoZSBhc3NvY2lhdGVkIHByb2Nlc3MuXG4gKiBAY2xhc3NcbiAqL1xuXG5jbGFzcyBHbW1EZWNvZGVyIHtcblxuICAvKipcbiAgICogQHBhcmFtIHtOdW1iZXJ9IFt3aW5kb3dTaXplPTFdIC0gU2l6ZSBvZiB0aGUgbGlrZWxpaG9vZCBzbW9vdGhpbmcgd2luZG93LlxuICAgKi9cbiAgY29uc3RydWN0b3Iod2luZG93U2l6ZSA9IDEpIHtcblxuICAgIC8qKlxuICAgICAqIFRoZSBtb2RlbCwgYXMgZ2VuZXJhdGVkIGJ5IFhNTSBmcm9tIGEgdHJhaW5pbmcgZGF0YSBzZXQuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuX21vZGVsID0gdW5kZWZpbmVkO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG1vZGVsIHJlc3VsdHMsIGNvbnRhaW5pbmcgaW50ZXJtZWRpYXRlIHJlc3VsdHMgdGhhdCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgY2FsbGJhY2sgaW4gZmlsdGVyLlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLl9tb2RlbFJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cbiAgICAvKipcbiAgICAgKiBTaXplIG9mIHRoZSBsaWtlbGlob29kIHNtb290aGluZyB3aW5kb3cuXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuX2xpa2VsaWhvb2RXaW5kb3cgPSB3aW5kb3dTaXplO1xuXG4gICAgdGhpcy5fd2VpZ2h0cyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIGhhbmRsaW5nIGVzdGltYXRpb24gcmVzdWx0cy5cbiAgICogQGNhbGxiYWNrIGdtbVJlc3VsdHNDYWxsYmFja1xuICAgKiBAcGFyYW0ge1N0cmluZ30gZXJyIC0gRGVzY3JpcHRpb24gb2YgYSBwb3RlbnRpYWwgZXJyb3IuXG4gICAqIEBwYXJhbSB7Z21tUmVzdWx0c30gcmVzIC0gT2JqZWN0IGhvbGRpbmcgdGhlIGVzdGltYXRpb24gcmVzdWx0cy5cbiAgICovXG5cbiAgLyoqXG4gICAqIFJlc3VsdHMgb2YgdGhlIGZpbHRlcmluZyBwcm9jZXNzLlxuICAgKiBAdHlwZWRlZiBnbW1SZXN1bHRzXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBuYW1lIGdtbVJlc3VsdHNcbiAgICogQHByb3BlcnR5IHtTdHJpbmd9IGxpa2VsaWVzdCAtIFRoZSBsaWtlbGllc3QgbW9kZWwncyBsYWJlbC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGxpa2VsaWVzdEluZGV4IC0gVGhlIGxpa2VsaWVzdCBtb2RlbCdzIGluZGV4XG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkubnVtYmVyfSBsaWtlbGlob29kcyAtIFRoZSBhcnJheSBvZiBhbGwgbW9kZWxzJyBzbW9vdGhlZCBub3JtYWxpemVkIGxpa2VsaWhvb2RzLlxuICAgKiBAcHJvcGVydHkgez9BcnJheS5udW1iZXJ9IG91dHB1dFZhbHVlcyAtIElmIHRoZSBtb2RlbCB3YXMgdHJhaW5lZCB3aXRoIHJlZ3Jlc3Npb24sIHRoZSBlc3RpbWF0ZWQgZmxvYXQgdmVjdG9yIG91dHB1dC5cbiAgICogQHByb3BlcnR5IHs/QXJyYXkubnVtYmVyfSBvdXRwdXRDb3ZhcmlhbmNlIC0gSWYgdGhlIG1vZGVsIHdhcyB0cmFpbmVkIHdpdGggcmVncmVzc2lvbiwgdGhlIG91dHB1dCBjb3ZhcmlhbmNlIG1hdHJpeC5cbiAgICovXG5cbiAgLyoqXG4gICAqIFRoZSBkZWNvZGluZyBmdW5jdGlvbi5cbiAgICogQHBhcmFtIHtBcnJheX0gb2JzZXJ2YXRpb24gLSBBbiBpbnB1dCBmbG9hdCB2ZWN0b3IgdG8gYmUgZXN0aW1hdGVkLlxuICAgKiBAcGFyYW0ge2dtbVJlc3VsdHNDYWxsYmFja30gW3Jlc3VsdHNDYWxsYmFjaz1udWxsXSAtIFRoZSBjYWxsYmFjayBoYW5kbGluZyB0aGUgZXN0aW1hdGlvbiByZXN1bHRzLlxuICAgKiBAcmV0dXJucyB7Z21tUmVzdWx0c31cbiAgICovXG4gIGZpbHRlcihvYnNlcnZhdGlvbiwgcmVzdWx0c0NhbGxiYWNrID0gbnVsbCkge1xuICAgIGxldCBlcnIgPSBudWxsO1xuICAgIGxldCByZXMgPSBudWxsO1xuXG4gICAgaWYoIXRoaXMuX21vZGVsKSB7XG4gICAgICBlcnIgPSAnbm8gbW9kZWwgbG9hZGVkIHlldCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGdtbVV0aWxzLmdtbUZpbHRlcihvYnNlcnZhdGlvbiwgdGhpcy5fbW9kZWwsIHRoaXMuX21vZGVsUmVzdWx0cyk7ICAgICAgICAgXG5cbiAgICAgICAgLy8gY3JlYXRlIHJlc3VsdHMgb2JqZWN0IGZyb20gcmVsZXZhbnQgbW9kZWxSZXN1bHRzIHZhbHVlcyA6XG4gICAgICAgIGNvbnN0IGxpa2VsaWVzdCA9ICh0aGlzLl9tb2RlbFJlc3VsdHMubGlrZWxpZXN0ID4gLTEpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuX21vZGVsLm1vZGVsc1t0aGlzLl9tb2RlbFJlc3VsdHMubGlrZWxpZXN0XS5sYWJlbFxuICAgICAgICAgICAgICAgICAgICAgICAgOiAndW5rbm93bic7XG4gICAgICAgIGNvbnN0IGxpa2VsaWhvb2RzID0gdGhpcy5fbW9kZWxSZXN1bHRzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHMuc2xpY2UoMCk7XG4gICAgICAgIHJlcyA9IHtcbiAgICAgICAgICBsaWtlbGllc3Q6IGxpa2VsaWVzdCxcbiAgICAgICAgICBsaWtlbGllc3RJbmRleDogdGhpcy5fbW9kZWxSZXN1bHRzLmxpa2VsaWVzdCxcbiAgICAgICAgICBsaWtlbGlob29kczogbGlrZWxpaG9vZHMsXG4gICAgICAgICAgb3V0cHV0VmFsdWVzOiBbXSxcbiAgICAgICAgICBvdXRwdXRDb3ZhcmlhbmNlOiBbXSxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBhZGQgcmVncmVzc2lvbiByZXN1bHRzIHRvIGdsb2JhbCByZXN1bHRzIGlmIGJpbW9kYWwgOlxuICAgICAgICBpZiAodGhpcy5fbW9kZWwuc2hhcmVkX3BhcmFtZXRlcnMuYmltb2RhbCkge1xuICAgICAgICAgIHJlc1snb3V0cHV0VmFsdWVzJ10gPSB0aGlzLl9tb2RlbFJlc3VsdHMub3V0cHV0X3ZhbHVlcy5zbGljZSgwKTtcbiAgICAgICAgICByZXNbJ291dHB1dENvdmFyaWFuY2UnXVxuICAgICAgICAgICAgICA9IHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF9jb3ZhcmlhbmNlLnNsaWNlKDApO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGVyciA9ICdwcm9ibGVtIG9jY3VyZWQgZHVyaW5nIGZpbHRlcmluZyA6ICcgKyBlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChyZXN1bHRzQ2FsbGJhY2spIHtcbiAgICAgIHJlc3VsdHNDYWxsYmFjayhlcnIsIHJlcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09IEdFVFRFUlMgLyBTRVRURVJTID09PT09PT09PT09PT09PT09PT09PT09PT09PT0vL1xuXG4gIC8qKipcbiAgICogTGlrZWxpaG9vZCBzbW9vdGhpbmcgd2luZG93IHNpemUuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICAvLyBnZXQgbGlrZWxpaG9vZFdpbmRvdygpIHtcbiAgLy8gICByZXR1cm4gdGhpcy5fbGlrZWxpaG9vZFdpbmRvdztcbiAgLy8gfVxuXG4gIC8vIHNldCBsaWtlbGlob29kV2luZG93KG5ld1dpbmRvd1NpemUpIHtcbiAgLy8gICB0aGlzLl9saWtlbGlob29kV2luZG93ID0gbmV3V2luZG93U2l6ZTtcbiAgLy8gICB0aGlzLl91cGRhdGVMaWtlbGlob29kV2luZG93KCk7XG4gIC8vIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBsaWtlbGlob29kIHNtb290aGluZyB3aW5kb3cgc2l6ZS5cbiAgICogQHJldHVybnMge051bWJlcn1cbiAgICovXG4gIGdldExpa2VsaWhvb2RXaW5kb3coKSB7XG4gICAgcmV0dXJuIHRoaXMuX2xpa2VsaWhvb2RXaW5kb3c7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBsaWtlbGlob29kIHNtb290aGluZyB3aW5kb3cgc2l6ZS5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IG5ld1dpbmRvd1NpemUgLSB0aGUgbmV3IHdpbmRvdyBzaXplLlxuICAgKi9cbiAgc2V0TGlrZWxpaG9vZFdpbmRvdyhuZXdXaW5kb3dTaXplKSB7XG4gICAgdGhpcy5fbGlrZWxpaG9vZFdpbmRvdyA9IG5ld1dpbmRvd1NpemU7XG4gICAgdGhpcy5fdXBkYXRlTGlrZWxpaG9vZFdpbmRvdygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF91cGRhdGVMaWtlbGlob29kV2luZG93KCkge1xuICAgIGlmICh0aGlzLl9tb2RlbCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG5cbiAgICBjb25zdCByZXMgPSB0aGlzLl9tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHM7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX21vZGVsLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzW2ldLmxpa2VsaWhvb2RfYnVmZmVyID0gbmV3IEFycmF5KHRoaXMuX2xpa2VsaWhvb2RXaW5kb3cpO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMuX2xpa2VsaWhvb2RXaW5kb3c7IGorKykge1xuICAgICAgICByZXNbaV0ubGlrZWxpaG9vZF9idWZmZXJbal0gPSAxIC8gdGhpcy5fbGlrZWxpaG9vZFdpbmRvdztcbiAgICAgIH1cbiAgICB9ICAgIFxuICB9XG5cbiAgc2V0V2VpZ2h0cyhuZXdXZWlnaHRzKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KG5ld1dlaWdodHMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dlaWdodHMgbXVzdCBiZSBhbiBhcnJheScpO1xuICAgIH1cblxuICAgIHRoaXMuX3dlaWdodHMgPSBuZXdXZWlnaHRzO1xuICAgIHRoaXMuX3VwZGF0ZVdlaWdodHMoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfdXBkYXRlV2VpZ2h0cygpIHtcbiAgICBpZiAodGhpcy5fbW9kZWwgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXG4gICAgY29uc3QgbSA9IHRoaXMuX21vZGVsO1xuICAgIGNvbnN0IHBhcmFtcyA9IG0uc2hhcmVkX3BhcmFtZXRlcnM7XG4gICAgY29uc3QgZGltSW4gPSBwYXJhbXMuYmltb2RhbCA/IHBhcmFtcy5kaW1lbnNpb25faW5wdXQgOiBwYXJhbXMuZGltZW5zaW9uO1xuXG4gICAgY29uc3QgdyA9IHRoaXMuX3dlaWdodHMuc2xpY2UoKTtcblxuICAgIGlmICh3Lmxlbmd0aCA8IGRpbUluKSB7XG4gICAgICBjb25zdCBvbmVzVG9BZGQgPSBkaW1JbiAtIHcubGVuZ3RoO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9uZXNUb0FkZDsgaSsrKSB7XG4gICAgICAgIHcucHVzaCgxKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHcubGVuZ3RoID4gZGltSW4pIHtcbiAgICAgIHcuc3BsaWNlKGRpbUluIC0gMSk7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB3W2ldID0gTWF0aC5tYXgod1tpXSwgMCk7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtLm1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBtLm1vZGVsc1tpXS5jb21wb25lbnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIG0ubW9kZWxzW2ldLmNvbXBvbmVudHNbal0ud2VpZ2h0cyA9IHc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICAvKipcbiAgICogQSB2YWxpZCBYTU0gR01NIG1vZGVsXG4gICAqIEB0eXBlZGVmIHhtbUdtbU1vZGVsXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBuYW1lIHhtbUdtbU1vZGVsXG4gICAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBUT0RPIC0gTElTVCBSRUFMIEdNTSBNT0RFTCBQUk9QRVJUSUVTIEhFUkVcbiAgICovXG5cbiAgLyoqKlxuICAgKiBUaGUgbW9kZWwgZ2VuZXJhdGVkIGJ5IFhNTS5cbiAgICogSXQgaXMgbWFuZGF0b3J5IGZvciB0aGUgY2xhc3MgdG8gaGF2ZSBhIG1vZGVsIGluIG9yZGVyIHRvIGRvIGl0cyBqb2IuXG4gICAqIEB0eXBlIHt4bW1HbW1Nb2RlbH1cbiAgICovXG4gIC8vIGdldCBtb2RlbCgpIHtcbiAgLy8gICByZXR1cm4gdGhpcy5nZXRNb2RlbCgpO1xuICAvLyB9XG5cbiAgLy8gc2V0IG1vZGVsKG1vZGVsKSB7XG4gIC8vICAgdGhpcy5zZXRNb2RlbChtb2RlbCk7XG4gIC8vIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBhY3R1YWwgWE1NIEdNTSBtb2RlbC5cbiAgICogQHJldHVybnMge3htbUdtbU1vZGVsfVxuICAgKi9cbiAgZ2V0TW9kZWwoKSB7XG4gICAgaWYgKHRoaXMuX21vZGVsKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLl9tb2RlbCkpO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkOyAgICBcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGFjdHVhbCBYTU0gR01NIG1vZGVsLlxuICAgKiBAcGFyYW0ge3htbUdtbU1vZGVsfSBtb2RlbFxuICAgKi9cbiAgc2V0TW9kZWwobW9kZWwpIHtcbiAgICB0aGlzLl9zZXRNb2RlbChtb2RlbCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX3NldE1vZGVsKG1vZGVsKSB7XG4gICAgdGhpcy5fbW9kZWwgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fbW9kZWxSZXN1bHRzID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKCFtb2RlbCkgcmV0dXJuO1xuXG4gICAgLy8gdGVzdCBpZiBtb2RlbCBpcyB2YWxpZCBoZXJlIChUT0RPIDogd3JpdGUgYSBiZXR0ZXIgdGVzdClcbiAgICBpZiAobW9kZWwubW9kZWxzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX21vZGVsID0gbW9kZWw7XG5cbiAgICAgIC8vIGFkZHMgdXNlciBkZWZpbmVkIHdlaWdodHMgdG8gdGhlIG1vZGVsIChkZWZhdWx0IFsxLCAxLCAuLi4sIDFdKVxuICAgICAgdGhpcy5fdXBkYXRlV2VpZ2h0cygpO1xuXG4gICAgICBjb25zdCBtID0gdGhpcy5fbW9kZWw7XG4gICAgICBjb25zdCBubW9kZWxzID0gbS5tb2RlbHMubGVuZ3RoO1xuXG4gICAgICB0aGlzLl9tb2RlbFJlc3VsdHMgPSB7XG4gICAgICAgIGluc3RhbnRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcbiAgICAgICAgc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG4gICAgICAgIHNtb290aGVkX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG4gICAgICAgIGluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuICAgICAgICBzbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG4gICAgICAgIGxpa2VsaWVzdDogLTEsXG4gICAgICAgIHNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzOiBbXVxuICAgICAgfTtcblxuICAgICAgLy8gdGhlIGZvbGxvd2luZyB2YXJpYWJsZXMgYXJlIHVzZWQgZm9yIHJlZ3Jlc3Npb24gOlxuICAgICAgY29uc3QgcGFyYW1zID0gbS5zaGFyZWRfcGFyYW1ldGVycztcbiAgICAgIGNvbnN0IGRpbU91dCA9IHBhcmFtcy5kaW1lbnNpb24gLSBwYXJhbXMuZGltZW5zaW9uX2lucHV0O1xuICAgICAgdGhpcy5fbW9kZWxSZXN1bHRzLm91dHB1dF92YWx1ZXMgPSBuZXcgQXJyYXkoZGltT3V0KTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgICAgICB0aGlzLl9tb2RlbFJlc3VsdHMub3V0cHV0X3ZhbHVlc1tpXSA9IDAuMDtcbiAgICAgIH1cblxuICAgICAgbGV0IG91dENvdmFyU2l6ZTtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBmdWxsXG4gICAgICBpZiAobS5jb25maWd1cmF0aW9uLmRlZmF1bHRfcGFyYW1ldGVycy5jb3ZhcmlhbmNlX21vZGUgPT0gMCkge1xuICAgICAgICBvdXRDb3ZhclNpemUgPSBkaW1PdXQgKiBkaW1PdXQ7XG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkaWFnb25hbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0O1xuICAgICAgfVxuICAgICAgXG4gICAgICB0aGlzLl9tb2RlbFJlc3VsdHMub3V0cHV0X2NvdmFyaWFuY2UgPSBuZXcgQXJyYXkob3V0Q292YXJTaXplKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgICAgICB0aGlzLl9tb2RlbFJlc3VsdHMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gICAgICB9XG5cblxuICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG5tb2RlbHM7IGkrKykge1xuICAgICAgICB0aGlzLl9tb2RlbFJlc3VsdHMuaW5zdGFudF9saWtlbGlob29kc1tpXSA9IDA7XG4gICAgICAgIHRoaXMuX21vZGVsUmVzdWx0cy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSAwO1xuICAgICAgICB0aGlzLl9tb2RlbFJlc3VsdHMuc21vb3RoZWRfbGlrZWxpaG9vZHNbaV0gPSAwO1xuICAgICAgICB0aGlzLl9tb2RlbFJlc3VsdHMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldID0gMDtcbiAgICAgICAgdGhpcy5fbW9kZWxSZXN1bHRzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSAwO1xuXG4gICAgICAgIGNvbnN0IHJlcyA9IHtcbiAgICAgICAgICBpbnN0YW50X2xpa2VsaWhvb2Q6IDAsXG4gICAgICAgICAgbG9nX2xpa2VsaWhvb2Q6IDBcbiAgICAgICAgfTtcblxuICAgICAgICByZXMubGlrZWxpaG9vZF9idWZmZXIgPSBuZXcgQXJyYXkodGhpcy5fbGlrZWxpaG9vZFdpbmRvdyk7XG5cbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLl9saWtlbGlob29kV2luZG93OyBqKyspIHtcbiAgICAgICAgICByZXMubGlrZWxpaG9vZF9idWZmZXJbal0gPSAxIC8gdGhpcy5fbGlrZWxpaG9vZFdpbmRvdztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmVzLmxpa2VsaWhvb2RfYnVmZmVyX2luZGV4ID0gMDtcblxuICAgICAgICAvLyB0aGUgZm9sbG93aW5nIHZhcmlhYmxlcyBhcmUgdXNlZCBmb3IgcmVncmVzc2lvbiA6XG4gICAgICAgIHJlcy5iZXRhID0gbmV3IEFycmF5KG0ubW9kZWxzW2ldLmNvbXBvbmVudHMubGVuZ3RoKTtcblxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHJlcy5iZXRhLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgcmVzLmJldGFbal0gPSAxIC8gcmVzLmJldGEubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzLm91dHB1dF92YWx1ZXMgPSB0aGlzLl9tb2RlbFJlc3VsdHMub3V0cHV0X3ZhbHVlcy5zbGljZSgwKTtcbiAgICAgICAgcmVzLm91dHB1dF9jb3ZhcmlhbmNlID0gdGhpcy5fbW9kZWxSZXN1bHRzLm91dHB1dF9jb3ZhcmlhbmNlLnNsaWNlKDApO1xuXG4gICAgICAgIC8vIG5vdyBhZGQgdGhpcyBzaW5nbGVNb2RlbFJlc3VsdHMgb2JqZWN0XG4gICAgICAgIC8vIHRvIHRoZSBnbG9iYWwgbW9kZWxSZXN1bHRzIG9iamVjdCA6XG4gICAgICAgIHRoaXMuX21vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cy5wdXNoKHJlcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqKlxuICAgKiBDdXJyZW50bHkgZXN0aW1hdGVkIGxpa2VsaWVzdCBsYWJlbC5cbiAgICogQHJlYWRvbmx5XG4gICAqIEB0eXBlIHtTdHJpbmd9XG4gICAqL1xuICAvLyBnZXQgbGlrZWxpZXN0TGFiZWwoKSB7XG4gIC8vICAgcmV0dXJuIHRoaXMuZ2V0TGlrZWxpZXN0TGFiZWwoKTtcbiAgLy8gfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGN1cnJlbnRseSBlc3RpbWF0ZWQgbGlrZWxpZXN0IGxhYmVsLlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgKi9cbiAgZ2V0TGlrZWxpZXN0TGFiZWwoKSB7XG4gICAgaWYgKHRoaXMuX21vZGVsUmVzdWx0cykge1xuICAgICAgaWYgKHRoaXMuX21vZGVsUmVzdWx0cy5saWtlbGllc3QgPiAtMSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbW9kZWwubW9kZWxzW3RoaXMuX21vZGVsUmVzdWx0cy5saWtlbGllc3RdLmxhYmVsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJ3Vua25vd24nOyAgICBcbiAgfVxuXG4gIC8qKipcbiAgICogTnVtYmVyIG9mIGNsYXNzZXMgY29udGFpbmVkIGluIHRoZSBtb2RlbC5cbiAgICogQHJlYWRvbmx5XG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICAvLyBnZXQgbmJDbGFzc2VzKCkge1xuICAvLyAgIHJldHVybiB0aGlzLmdldE51bWJlck9mQ2xhc3NlcygpO1xuICAvLyB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdG90YWwgbnVtYmVyIG9mIGNsYXNzZXMgdGhlIG1vZGVsIHdhcyB0cmFpbmVkIHdpdGguXG4gICAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gICAqL1xuICBnZXROdW1iZXJPZkNsYXNzZXMoKSB7XG4gICAgaWYgKHRoaXMuX21vZGVsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbW9kZWwubW9kZWxzLmxlbmd0aDtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKioqXG4gICAqIFNpemUgb2YgdGhlIHJlZ3Jlc3Npb24gdmVjdG9yIGlmIG1vZGVsIGlzIGJpbW9kYWwuXG4gICAqIEByZWFkb25seVxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgLy8gZ2V0IHJlZ3Jlc3Npb25TaXplKCkge1xuICAvLyAgIHJldHVybiB0aGlzLmdldFJlZ3Jlc3Npb25WZWN0b3JTaXplKCk7XG4gIC8vIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBvdXRwdXQgZGltZW5zaW9uIG9mIHRoZSBtb2RlbCAoc2l6ZSBvZiBhIHJlZ3Jlc3Npb24gdmVjdG9yKS5cbiAgICogQHJldHVybnMge051bWJlcn1cbiAgICovXG4gIGdldFJlZ3Jlc3Npb25WZWN0b3JTaXplKCkge1xuICAgIGlmICh0aGlzLl9tb2RlbCkge1xuICAgICAgY29uc3QgcGFyYW1zID0gdGhpcy5fbW9kZWwuc2hhcmVkX3BhcmFtZXRlcnM7XG4gICAgICByZXR1cm4gcGFyYW1zWydiaW1vZGFsJ11cbiAgICAgICAgICAgPyBwYXJhbXNbJ2RpbWVuc2lvbiddIC0gcGFyYW1zWydkaW1lbnNpb25faW5wdXQnXVxuICAgICAgICAgICA6IDA7XG4gICAgfVxuICAgIHJldHVybiAwO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBHbW1EZWNvZGVyOyJdfQ==