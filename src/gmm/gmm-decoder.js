import * as gmmUtils from '../utils/gmm-utils';

/**
 * GMM decoder
 * loads a model trained by the XMM library and processes an input stream of float vectors in real-time
 * if the model was trained for regression, outputs an estimation
 */

export default class GmmDecoder {

  /**
   * @param {String} windowSize - size of the likelihood smoothing window
   */
  constructor(windowSize = 1) {

    /**
     * The model, as generated by XMM from a training data set
     * @type {Object}
     */
    this._model = undefined;

    /**
     * The model results, containing intermediate results that will be passed to the callback in filter
     * @type {Object}
     */
    this._modelResults = undefined;

    /**
     * Size of the likelihood smoothing window
     * @type {Number}
     */
    this._likelihoodWindow = windowSize;
  }

  /**
   * @typedef GmmResults
   * @type {Object}
   * @property {string} likeliest - the likeliest model's label
   * @property {Array.number} likelihoods - the array of all models' normalized likelihoods
   * @property {?Array.number} outputValues - if the model was trained with regression, the estimated float vector output
   */

  /**
   * Callback handling estimation results
   * @callback resultsCallback
   * @param {String} err - description of a potential error
   * @param {GmmResults} res - object holding the estimation results
   */

  /**
   * The decoding function
   * @param {Array} observation - an input float vector to be estimated
   * @param {resultsCallback} resultsCallback - the callback handling the estimation results
   */
  filter(observation, resultsCallback) {
    if(this._model === undefined) {
      console.log("no model loaded");
      return;
    }

    let err = null;
    let res = null;

    try {
      gmmUtils.gmmFilter(observation, this._model, this._modelResults);         

      const lklst = (this._modelResults.likeliest > -1)
                  ? this._model.models[this._modelResults.likeliest].label
                  : 'unknown';
      const lklhds = this._modelResults.smoothed_normalized_likelihoods.slice(0);
      res = {
        likeliest: lklst,
        likelihoods: lklhds         
      }

      // add regression results to global results if bimodal :
      if(this._model.shared_parameters.bimodal) {
        res.outputValues = this._modelResults.output_values.slice(0);
        // results.outputCovariance
        //     = this.modelResults.output_covariance.slice(0);
      }
    } catch (e) {
      err = 'problem occured during filtering : ' + e;
    }

    resultsCallback(err, res);
  }

  //=================== SETTERS =====================//

  set model(model) {
    this._model = undefined;
    this._modelResults = undefined;

    // test if model is valid here (TODO : write a better test)
    if(model.models !== undefined) {
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
        singleClassGmmModelResults: []
      };

      // the following variables are used for regression :

      const params = m.shared_parameters;
      const dimOut = params.dimension - params.dimension_input;
      this._modelResults.output_values = new Array(dimOut);
      for(let i = 0; i < dimOut; i++) {
        this._modelResults.output_values[i] = 0.0;
      }

      let outCovarSize;
      //------------------------------------------------------------- full
      if(m.configuration.default_parameters.covariance_mode == 0) {
        outCovarSize = dimOut * dimOut;
      //--------------------------------------------------------- diagonal
      } else {
        outCovarSize = dimOut;
      }
      this._modelResults.output_covariance = new Array(outCovarSize);
      for(let i = 0; i < dimOut; i++) {
        this._modelResults.output_covariance[i] = 0.0;
      }


      for(let i = 0; i < nmodels; i++) {

        this._modelResults.instant_likelihoods[i] = 0;
        this._modelResults.smoothed_log_likelihoods[i] = 0;
        this._modelResults.smoothed_likelihoods[i] = 0;
        this._modelResults.instant_normalized_likelihoods[i] = 0;
        this._modelResults.smoothed_normalized_likelihoods[i] = 0;

        const res = {
          instant_likelihood: 0,
          log_likelihood: 0
        };

        res.likelihood_buffer = new Array(this._likelihoodWindow);
        for(let j = 0; j < this._likelihoodWindow; j++) {
          res.likelihood_buffer[j] = 1 / this._likelihoodWindow;
        }
        res.likelihood_buffer_index = 0;

        // the following variables are used for regression :

        res.beta = new Array(m.models[i].components.length);
        for(let j = 0; j < res.beta.length; j++) {
          res.beta[j] = 1 / res.beta.length;
        }
        res.output_values = this._modelResults.output_values.slice(0);
        res.output_covariance = this._modelResults.output_covariance.slice(0);

        // now add this singleModelResults object
        // to the global modelResults object :

        this._modelResults.singleClassGmmModelResults.push(res);
      }
    }
  }

  set likelihoodWindow(newWindowSize) {
    this._likelihoodWindow = newWindowSize;
    if(this._model === undefined) return;
    const res = this._modelResults.singleClassModelResults;
    for(let i=0; i<this._model.models.length; i++) {
      res[i].likelihood_buffer = new Array(this._likelihoodWindow);
      for(let j=0; j<this._likelihoodWindow; j++) {
        res.likelihood_buffer[j] = 1 / this._likelihoodWindow;
      }
    }
  }

  //=================== GETTERS =====================//

  get likeliestLabel() {
    if(this._modelResults !== undefined) {
      if(this._modelResults.likeliest > -1) {
        return this._model.models[this._modelResults.likeliest].label;
      }
    }
    return 'unknown';
  }

  get nbClasses() {
    if(this._model !== undefined) {
      return this._model.models.length;
    }
    return 0;
  }

  get model() {
    if(this._model !== undefined) {
      return JSON.fromString(JSON.stringify(this._model));
    }
    return undefined;
  }

  get likelihoodWindow() {
    return this._likelihoodWindow;
  }
}