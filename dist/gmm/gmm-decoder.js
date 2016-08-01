'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _gmmUtils = require('../utils/gmm-utils');

var gmmUtils = _interopRequireWildcard(_gmmUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var GmmDecoder = function () {
  function GmmDecoder() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    (0, _classCallCheck3.default)(this, GmmDecoder);

    var defaults = {
      likelihoodWindow: 5
    };
    var params = (0, _assign2.default)({}, defaults, options);

    this.model = undefined;
    this.modelResults = undefined;
    this.likelihoodWindow = params.likelihoodWindow;
  }

  (0, _createClass3.default)(GmmDecoder, [{
    key: 'filter',
    value: function filter(observation, resultsCallback) {
      if (this.model === undefined) {
        console.log("no model loaded");
        return;
      }

      var err = null;
      var results = null;

      try {
        gmmUtils.gmmFilter(observation, this.model, this.modelResults);

        //================ LFO specific :
        //gmmLikelihoods(frame, this.model, this.modelResults);         
        //this.time = time;
        //this.metaData = metaData;
        //const outFrame = this.outFrame;
        //for(let i=0; i<this.model.models.length; i++) {
        //  outFrame[i] = this.modelResults.smoothed_normalized_likelihoods[i];
        //}
        //this.output();

        // create results object from relevant modelResults values :

        var lklst = this.modelResults.likeliest > -1 ? this.model.models[this.modelResults.likeliest].label : 'unknown';
        var lklhds = this.modelResults.smoothed_normalized_likelihoods.slice(0);
        results = {
          likeliest: lklst,
          likelihoods: lklhds
        };

        // add regression results to global results if bimodal :
        if (this.model.shared_parameters.bimodal) {
          results.output_values = this.modelResults.output_values.slice(0);
          // results.output_covariance
          //     = this.modelResults.output_covariance.slice(0);
        }
      } catch (e) {
        err = 'problem occured during filtering : ' + e;
      }

      resultsCallback(err, results);
    }

    //=================== SETTERS =====================//

  }, {
    key: 'model',
    set: function set(model) {
      this.model = undefined;
      this.modelResults = undefined;

      // test if model is valid here (TODO : write a better test)
      if (model.models !== undefined) {
        this.model = model;
        var m = this.model;
        var nmodels = m.models.length;
        this.modelResults = {
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
        this.modelResults.output_values = new Array(dimOut);
        for (var i = 0; i < dimOut; i++) {
          this.modelResults.output_values[i] = 0.0;
        }

        var outCovarSize = void 0;
        //------------------------------------------------------------- full
        if (m.configuration.default_parameters.covariance_mode == 0) {
          outCovarSize = dimOut * dimOut;
          //--------------------------------------------------------- diagonal
        } else {
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

          var res = {
            instant_likelihood: 0,
            log_likelihood: 0
          };

          res.likelihood_buffer = new Array(this.likelihoodWindow);
          for (var j = 0; j < this.likelihoodWindow; j++) {
            res.likelihood_buffer[j] = 1 / this.likelihoodWindow;
          }
          res.likelihood_buffer_index = 0;

          // the following variables are used for regression :

          res.beta = new Array(m.models[_i2].components.length);
          for (var _j = 0; _j < res.beta.length; _j++) {
            res.beta[_j] = 1 / res.beta.length;
          }
          res.output_values = this.modelResults.output_values.slice(0);
          res.output_covariance = this.modelResults.output_covariance.slice(0);

          // now add this singleModelResults object
          // to the global modelResults object :

          this.modelResults.singleClassGmmModelResults.push(res);
        }
      }
      //========== LFO specific : don't forget to add it in the LFO wrapper
      //this.initialize({ frameSize: this.model.models.length });
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

    //set varianceOffset() {
    /*
    not used for now (need to implement updateInverseCovariance method)
    */
    //}

    //=================== GETTERS =====================//

  }, {
    key: 'likeliestLabel',
    get: function get() {
      if (this.modelResults !== undefined) {
        if (this.modelResults.likeliest > -1) {
          return this.model.models[this.modelResults.likeliest].label;
        }
      }
      return 'unknown';
    }
  }]);
  return GmmDecoder;
}();

exports.default = GmmDecoder;
//# sourceMappingURL=data:application/json;base64,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RUE7Ozs7d0JBRXFCO0FBQ25CLFVBQUcsS0FBSyxZQUFMLEtBQXNCLFNBQXpCLEVBQW9DO0FBQ2xDLFlBQUcsS0FBSyxZQUFMLENBQWtCLFNBQWxCLEdBQThCLENBQUMsQ0FBbEMsRUFBcUM7QUFDbkMsaUJBQU8sS0FBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixLQUFLLFlBQUwsQ0FBa0IsU0FBcEMsRUFBK0MsS0FBdEQ7QUFDRDtBQUNGO0FBQ0QsYUFBTyxTQUFQO0FBQ0Q7Ozs7O2tCQXhLa0IsVSIsImZpbGUiOiJnbW0tZGVjb2Rlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGdtbVV0aWxzIGZyb20gJy4uL3V0aWxzL2dtbS11dGlscyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdtbURlY29kZXIge1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IGRlZmF1bHRzID0ge1xuICAgICAgbGlrZWxpaG9vZFdpbmRvdzogNVxuICAgIH07XG4gICAgbGV0IHBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgIHRoaXMubW9kZWwgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5tb2RlbFJlc3VsdHMgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5saWtlbGlob29kV2luZG93ID0gcGFyYW1zLmxpa2VsaWhvb2RXaW5kb3c7XG4gIH1cblxuICBmaWx0ZXIob2JzZXJ2YXRpb24sIHJlc3VsdHNDYWxsYmFjaykge1xuICAgIGlmKHRoaXMubW9kZWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc29sZS5sb2coXCJubyBtb2RlbCBsb2FkZWRcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGVyciA9IG51bGw7XG4gICAgbGV0IHJlc3VsdHMgPSBudWxsO1xuXG4gICAgdHJ5IHtcbiAgICAgIGdtbVV0aWxzLmdtbUZpbHRlcihvYnNlcnZhdGlvbiwgdGhpcy5tb2RlbCwgdGhpcy5tb2RlbFJlc3VsdHMpOyAgICAgICAgIFxuXG4gICAgICAvLz09PT09PT09PT09PT09PT0gTEZPIHNwZWNpZmljIDpcbiAgICAgIC8vZ21tTGlrZWxpaG9vZHMoZnJhbWUsIHRoaXMubW9kZWwsIHRoaXMubW9kZWxSZXN1bHRzKTsgICAgICAgICBcbiAgICAgIC8vdGhpcy50aW1lID0gdGltZTtcbiAgICAgIC8vdGhpcy5tZXRhRGF0YSA9IG1ldGFEYXRhO1xuICAgICAgLy9jb25zdCBvdXRGcmFtZSA9IHRoaXMub3V0RnJhbWU7XG4gICAgICAvL2ZvcihsZXQgaT0wOyBpPHRoaXMubW9kZWwubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyAgb3V0RnJhbWVbaV0gPSB0aGlzLm1vZGVsUmVzdWx0cy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuICAgICAgLy99XG4gICAgICAvL3RoaXMub3V0cHV0KCk7XG5cbiAgICAgIC8vIGNyZWF0ZSByZXN1bHRzIG9iamVjdCBmcm9tIHJlbGV2YW50IG1vZGVsUmVzdWx0cyB2YWx1ZXMgOlxuXG4gICAgICBjb25zdCBsa2xzdCA9ICh0aGlzLm1vZGVsUmVzdWx0cy5saWtlbGllc3QgPiAtMSlcbiAgICAgICAgICAgICAgICAgID8gdGhpcy5tb2RlbC5tb2RlbHNbdGhpcy5tb2RlbFJlc3VsdHMubGlrZWxpZXN0XS5sYWJlbFxuICAgICAgICAgICAgICAgICAgOiAndW5rbm93bic7XG4gICAgICBjb25zdCBsa2xoZHMgPSB0aGlzLm1vZGVsUmVzdWx0cy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzLnNsaWNlKDApO1xuICAgICAgcmVzdWx0cyA9IHtcbiAgICAgICAgbGlrZWxpZXN0OiBsa2xzdCxcbiAgICAgICAgbGlrZWxpaG9vZHM6IGxrbGhkcyAgICAgICAgIFxuICAgICAgfVxuXG4gICAgICAvLyBhZGQgcmVncmVzc2lvbiByZXN1bHRzIHRvIGdsb2JhbCByZXN1bHRzIGlmIGJpbW9kYWwgOlxuICAgICAgaWYodGhpcy5tb2RlbC5zaGFyZWRfcGFyYW1ldGVycy5iaW1vZGFsKSB7XG4gICAgICAgIHJlc3VsdHMub3V0cHV0X3ZhbHVlcyA9IHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG4gICAgICAgIC8vIHJlc3VsdHMub3V0cHV0X2NvdmFyaWFuY2VcbiAgICAgICAgLy8gICAgID0gdGhpcy5tb2RlbFJlc3VsdHMub3V0cHV0X2NvdmFyaWFuY2Uuc2xpY2UoMCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyID0gJ3Byb2JsZW0gb2NjdXJlZCBkdXJpbmcgZmlsdGVyaW5nIDogJyArIGU7XG4gICAgfVxuXG4gICAgcmVzdWx0c0NhbGxiYWNrKGVyciwgcmVzdWx0cyk7XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT0gU0VUVEVSUyA9PT09PT09PT09PT09PT09PT09PT0vL1xuXG4gIHNldCBtb2RlbChtb2RlbCkge1xuICAgIHRoaXMubW9kZWwgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5tb2RlbFJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyB0ZXN0IGlmIG1vZGVsIGlzIHZhbGlkIGhlcmUgKFRPRE8gOiB3cml0ZSBhIGJldHRlciB0ZXN0KVxuICAgIGlmKG1vZGVsLm1vZGVscyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm1vZGVsID0gbW9kZWw7XG4gICAgICBjb25zdCBtID0gdGhpcy5tb2RlbDtcbiAgICAgIGNvbnN0IG5tb2RlbHMgPSBtLm1vZGVscy5sZW5ndGg7XG4gICAgICB0aGlzLm1vZGVsUmVzdWx0cyA9IHtcbiAgICAgICAgaW5zdGFudF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuICAgICAgICBzbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcbiAgICAgICAgc21vb3RoZWRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcbiAgICAgICAgaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG4gICAgICAgIHNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcbiAgICAgICAgbGlrZWxpZXN0OiAtMSxcbiAgICAgICAgc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHM6IFtdXG4gICAgICB9O1xuXG4gICAgICAvLyB0aGUgZm9sbG93aW5nIHZhcmlhYmxlcyBhcmUgdXNlZCBmb3IgcmVncmVzc2lvbiA6XG5cbiAgICAgIGNvbnN0IHBhcmFtcyA9IG0uc2hhcmVkX3BhcmFtZXRlcnM7XG4gICAgICBjb25zdCBkaW1PdXQgPSBwYXJhbXMuZGltZW5zaW9uIC0gcGFyYW1zLmRpbWVuc2lvbl9pbnB1dDtcbiAgICAgIHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF92YWx1ZXMgPSBuZXcgQXJyYXkoZGltT3V0KTtcbiAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBkaW1PdXQ7IGkrKykge1xuICAgICAgICB0aGlzLm1vZGVsUmVzdWx0cy5vdXRwdXRfdmFsdWVzW2ldID0gMC4wO1xuICAgICAgfVxuXG4gICAgICBsZXQgb3V0Q292YXJTaXplO1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZ1bGxcbiAgICAgIGlmKG0uY29uZmlndXJhdGlvbi5kZWZhdWx0X3BhcmFtZXRlcnMuY292YXJpYW5jZV9tb2RlID09IDApIHtcbiAgICAgICAgb3V0Q292YXJTaXplID0gZGltT3V0ICogZGltT3V0O1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGlhZ29uYWxcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dENvdmFyU2l6ZSA9IGRpbU91dDtcbiAgICAgIH1cbiAgICAgIHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF9jb3ZhcmlhbmNlID0gbmV3IEFycmF5KG91dENvdmFyU2l6ZSk7XG4gICAgICBmb3IobGV0IGkgPSAwOyBpIDwgZGltT3V0OyBpKyspIHtcbiAgICAgICAgdGhpcy5tb2RlbFJlc3VsdHMub3V0cHV0X2NvdmFyaWFuY2VbaV0gPSAwLjA7XG4gICAgICB9XG5cblxuICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG5tb2RlbHM7IGkrKykge1xuXG4gICAgICAgIHRoaXMubW9kZWxSZXN1bHRzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV0gPSAwO1xuICAgICAgICB0aGlzLm1vZGVsUmVzdWx0cy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSAwO1xuICAgICAgICB0aGlzLm1vZGVsUmVzdWx0cy5zbW9vdGhlZF9saWtlbGlob29kc1tpXSA9IDA7XG4gICAgICAgIHRoaXMubW9kZWxSZXN1bHRzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IDA7XG4gICAgICAgIHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSAwO1xuXG4gICAgICAgIGNvbnN0IHJlcyA9IHtcbiAgICAgICAgICBpbnN0YW50X2xpa2VsaWhvb2Q6IDAsXG4gICAgICAgICAgbG9nX2xpa2VsaWhvb2Q6IDBcbiAgICAgICAgfTtcblxuICAgICAgICByZXMubGlrZWxpaG9vZF9idWZmZXIgPSBuZXcgQXJyYXkodGhpcy5saWtlbGlob29kV2luZG93KTtcbiAgICAgICAgZm9yKGxldCBqID0gMDsgaiA8IHRoaXMubGlrZWxpaG9vZFdpbmRvdzsgaisrKSB7XG4gICAgICAgICAgcmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMSAvIHRoaXMubGlrZWxpaG9vZFdpbmRvdztcbiAgICAgICAgfVxuICAgICAgICByZXMubGlrZWxpaG9vZF9idWZmZXJfaW5kZXggPSAwO1xuXG4gICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgdmFyaWFibGVzIGFyZSB1c2VkIGZvciByZWdyZXNzaW9uIDpcblxuICAgICAgICByZXMuYmV0YSA9IG5ldyBBcnJheShtLm1vZGVsc1tpXS5jb21wb25lbnRzLmxlbmd0aCk7XG4gICAgICAgIGZvcihsZXQgaiA9IDA7IGogPCByZXMuYmV0YS5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHJlcy5iZXRhW2pdID0gMSAvIHJlcy5iZXRhLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICByZXMub3V0cHV0X3ZhbHVlcyA9IHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF92YWx1ZXMuc2xpY2UoMCk7XG4gICAgICAgIHJlcy5vdXRwdXRfY292YXJpYW5jZSA9IHRoaXMubW9kZWxSZXN1bHRzLm91dHB1dF9jb3ZhcmlhbmNlLnNsaWNlKDApO1xuXG4gICAgICAgIC8vIG5vdyBhZGQgdGhpcyBzaW5nbGVNb2RlbFJlc3VsdHMgb2JqZWN0XG4gICAgICAgIC8vIHRvIHRoZSBnbG9iYWwgbW9kZWxSZXN1bHRzIG9iamVjdCA6XG5cbiAgICAgICAgdGhpcy5tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHMucHVzaChyZXMpO1xuICAgICAgfVxuICAgIH1cbiAgICAvLz09PT09PT09PT0gTEZPIHNwZWNpZmljIDogZG9uJ3QgZm9yZ2V0IHRvIGFkZCBpdCBpbiB0aGUgTEZPIHdyYXBwZXJcbiAgICAvL3RoaXMuaW5pdGlhbGl6ZSh7IGZyYW1lU2l6ZTogdGhpcy5tb2RlbC5tb2RlbHMubGVuZ3RoIH0pO1xuICB9XG5cbiAgc2V0IGxpa2VsaWhvb2RXaW5kb3cobmV3V2luZG93U2l6ZSkge1xuICAgIHRoaXMubGlrZWxpaG9vZFdpbmRvdyA9IG5ld1dpbmRvd1NpemU7XG4gICAgaWYodGhpcy5tb2RlbCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgY29uc3QgcmVzID0gdGhpcy5tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NNb2RlbFJlc3VsdHM7XG4gICAgZm9yKGxldCBpPTA7IGk8dGhpcy5tb2RlbC5tb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc1tpXS5saWtlbGlob29kX2J1ZmZlciA9IG5ldyBBcnJheSh0aGlzLmxpa2VsaWhvb2RXaW5kb3cpO1xuICAgICAgZm9yKGxldCBqPTA7IGo8dGhpcy5saWtlbGlob29kV2luZG93OyBqKyspIHtcbiAgICAgICAgcmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMSAvIHRoaXMubGlrZWxpaG9vZFdpbmRvdztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvL3NldCB2YXJpYW5jZU9mZnNldCgpIHtcbiAgICAvKlxuICAgIG5vdCB1c2VkIGZvciBub3cgKG5lZWQgdG8gaW1wbGVtZW50IHVwZGF0ZUludmVyc2VDb3ZhcmlhbmNlIG1ldGhvZClcbiAgICAqL1xuICAvL31cblxuICAvLz09PT09PT09PT09PT09PT09PT0gR0VUVEVSUyA9PT09PT09PT09PT09PT09PT09PT0vL1xuXG4gIGdldCBsaWtlbGllc3RMYWJlbCgpIHtcbiAgICBpZih0aGlzLm1vZGVsUmVzdWx0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZih0aGlzLm1vZGVsUmVzdWx0cy5saWtlbGllc3QgPiAtMSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5tb2RlbHNbdGhpcy5tb2RlbFJlc3VsdHMubGlrZWxpZXN0XS5sYWJlbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICd1bmtub3duJztcbiAgfVxufSJdfQ==