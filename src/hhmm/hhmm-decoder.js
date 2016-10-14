import * as hhmmUtils from '../utils/hhmm-utils';

/**
 * Hierarchical HMM decoder <br />
 * Loads a model trained by the XMM library and processes an input stream of float vectors in real-time.
 * If the model was trained for regression, outputs an estimation of the associated process.
 * @class
 */

class HhmmDecoder {

  /**
   * @param {Number} [windowSize=1] - Size of the likelihood smoothing window.
   */
  constructor(windowSize = 1) {

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
   * @param {HhmmResultsCallback} resultsCallback - The callback handling the estimation results.
   */
  filter(observation, resultsCallback) {
    let err = null;
    let res = null;

    if(this._model === undefined) {
      err = 'no model loaded yet';
    } else {
      //console.log(observation);
      //this._observation = observation;
      try {
        hhmmUtils.hhmmFilter(observation, this._model, this._modelResults);

        // create results object from relevant modelResults values :
        const likeliest = (this._modelResults.likeliest > -1)
                        ? this._model.models[this._modelResults.likeliest].label
                        : 'unknown';
        const likelihoods = this._modelResults.smoothed_normalized_likelihoods.slice(0);
        res = {
          likeliest: likeliest,
          likeliestIndex: this._modelResults.likeliest,
          likelihoods: likelihoods,
          timeProgressions: new Array(this._model.models.length),
          alphas: new Array(this._model.models.length)
        };

        for (let i = 0; i < this._model.models.length; i++) {
          res.timeProgressions[i] = this._modelResults.singleClassHmmModelResults[i].progress;
          if (this._model.configuration.default_parameters.hierarchical) {
            res.alphas[i]
              = this._modelResults.singleClassHmmModelResults[i].alpha_h[0];
          } else {
            res.alphas[i]
              = this._modelResults.singleClassHmmModelResults[i].alpha[0];
          }
        }

        if (this._model.shared_parameters.bimodal) {
          res['outputValues'] = this._modelResults.output_values.slice(0);
          res['outputCovariance']
              = this._modelResults.output_covariance.slice(0);
        }
      } catch (e) {
        err = 'problem occured during filtering : ' + e;
      }
    }

    resultsCallback(err, res);
  }

  /**
   * Resets the intermediate results of the estimation (shortcut for reloading the model).
   */
  reset() {
    if (this._model !== undefined) {
      this._setModel(this._model);
    }
  }

  //========================== GETTERS / SETTERS =============================//

  /**
   * Likelihood smoothing window size.
   * @type {Number}
   */
  get likelihoodWindow() {
    return this._likelihoodWindow;
  }

  set likelihoodWindow(newWindowSize) {
    this._likelihoodWindow = newWindowSize;

    if (this._model === undefined) return;

    const res = this._modelResults.singleClassModelResults;
    
    for (let i=0; i<this._model.models.length; i++) {
      res[i].likelihood_buffer = new Array(this._likelihoodWindow);

      for (let j=0; j<this._likelihoodWindow; j++) {
        res.likelihood_buffer[j] = 1 / this._likelihoodWindow;
      }
    }
  }

  /**
   * The model generated by XMM.
   * It is mandatory for the class to have a model in order to do its job.
   * @type {Object}
   */
  get model() {
    if (this._model !== undefined) {
      return JSON.fromString(JSON.stringify(this._model));
    }
    return undefined;
  }

  set model(model) {
    this._setModel(model);
  }

  /** @private */
  _setModel(model) {      

    this._model = undefined;
    this._modelResults = undefined;

    if (!model) return;

    // test if model is valid here (TODO : write a better test)
    if (model.models !== undefined) {
      this._model = model;
      const m = this._model;
      const nmodels = m.models.length;

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

      const params = m.shared_parameters;
      const dimOut = params.dimension - params.dimension_input;
      this._modelResults.output_values = new Array(dimOut);
      for (let i = 0; i < dimOut; i++) {
        this._modelResults.output_values[i] = 0.0;
      }

      let outCovarSize;
      if (m.configuration.default_parameters.covariance_mode == 0) { //---- full
        outCovarSize = dimOut * dimOut;
      } else { //------------------------------------------------------ diagonal
        outCovarSize = dimOut;
      }
      
      this._modelResults.output_covariance = new Array(outCovarSize);

      for (let i = 0; i < dimOut; i++) {
        this._modelResults.output_covariance[i] = 0.0;
      }

      for (let i = 0; i < nmodels; i++) {
        this._modelResults.instant_likelihoods[i] = 0;
        this._modelResults.smoothed_log_likelihoods[i] = 0;
        this._modelResults.smoothed_likelihoods[i] = 0;
        this._modelResults.instant_normalized_likelihoods[i] = 0;
        this._modelResults.smoothed_normalized_likelihoods[i] = 0;

        const nstates = m.models[i].parameters.states;

        const alpha_h = new Array(3);
        for (let j=0; j<3; j++) {
          alpha_h[j] = new Array(nstates);
          for (let k=0; k<nstates; k++) {
            alpha_h[j][k] = 0;
          }
        }
        
        const alpha = new Array(nstates);
        for (let j = 0; j < nstates; j++) {
          alpha[j] = 0;
        }

        let likelihood_buffer = new Array(this._likelihoodWindow);
        for (let j = 0; j < this._likelihoodWindow; j++) {
          likelihood_buffer[j] = 0.0;
        }

        const hmmRes = {
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
          
          singleClassGmmModelResults: []  // aka states
        };

        hmmRes.output_values = this._modelResults.output_values.slice(0);
        hmmRes.output_covariance = this._modelResults.output_covariance.slice(0);

        // add HMM states (GMMs)
        for (let j = 0; j < nstates; j++) {
          const gmmRes = {
            instant_likelihood: 0,
            log_likelihood: 0
          };
          gmmRes.beta = new Array(this._model.models[i].parameters.gaussians);
          for (let k = 0; k < gmmRes.beta.length; k++) {
            gmmRes.beta[k] = 1 / gmmRes.beta.length;
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
  get likeliestLabel() {
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
  get nbClasses() {
    if (this._model !== undefined) {
      return this._model.models.length;
    }
    return 0;
  }
};

export default HhmmDecoder;