import * as gmmUtils from '../utils/gmm-utils';

/**
 * GMM decoder <br />
 * Loads a model trained by the XMM library and processes an input stream of float vectors in real-time.
 * If the model was trained for regression, outputs an estimation of the associated process.
 * @class
 */

class GmmDecoder {

  /**
   * @param {Number} [windowSize=1] - Size of the likelihood smoothing window.
   */
  constructor(windowSize = 1) {

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
  }

  /**
   * Callback handling estimation results.
   * @callback GmmResultsCallback
   * @param {String} err - Description of a potential error.
   * @param {GmmResults} res - Object holding the estimation results.
   */

  /**
   * Results of the filtering process.
   * @typedef GmmResults
   * @type {Object}
   * @property {String} likeliest - The likeliest model's label.
   * @property {Number} likeliestIndex - The likeliest model's index
   * @property {Array.number} likelihoods - The array of all models' smoothed normalized likelihoods.
   * @property {?Array.number} outputValues - If the model was trained with regression, the estimated float vector output.
   * @property {?Array.number} outputCovariance - If the model was trained with regression, the output covariance matrix.
   */

  /**
   * The decoding function.
   * @param {Array} observation - An input float vector to be estimated.
   * @param {GmmResultsCallback} resultsCallback - The callback handling the estimation results.
   */
  filter(observation, resultsCallback) {
    let err = null;
    let res = null;

    if(this._model === undefined) {
      console.log("no model loaded");
      return;
    } else {
      try {
        gmmUtils.gmmFilter(observation, this._model, this._modelResults);         

        const likeliest = (this._modelResults.likeliest > -1)
                        ? this._model.models[this._modelResults.likeliest].label
                        : 'unknown';
        const likelihoods = this._modelResults.smoothed_normalized_likelihoods.slice(0);
        res = {
          likeliest: likeliest,
          likeliestIndex: this._modelResults.likeliest,
          likelihoods: likelihoods
        }

        // add regression results to global results if bimodal :
        if(this._model.shared_parameters.bimodal) {
          res['outputValues'] = this._modelResults.output_values.slice(0);
          res['outputCovariance']
              = this.modelResults.output_covariance.slice(0);
        }
      } catch (e) {
        err = 'problem occured during filtering : ' + e;
      }
    }

    resultsCallback(err, res);
  }

  //=========================== GETTERS / SETTERS ============================//

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
    _setModel(model);
  }

  /** @private */
  _setModel(model) {
    this._model = undefined;
    this._modelResults = undefined;

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
        singleClassGmmModelResults: []
      };

      // the following variables are used for regression :
      const params = m.shared_parameters;
      const dimOut = params.dimension - params.dimension_input;
      this._modelResults.output_values = new Array(dimOut);

      for (let i = 0; i < dimOut; i++) {
        this._modelResults.output_values[i] = 0.0;
      }

      let outCovarSize;
      //------------------------------------------------------------------- full
      if (m.configuration.default_parameters.covariance_mode == 0) {
        outCovarSize = dimOut * dimOut;
      //--------------------------------------------------------------- diagonal
      } else {
        outCovarSize = dimOut;
      }
      
      this._modelResults.output_covariance = new Array(outCovarSize);

      for (let i = 0; i < dimOut; i++) {
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

        for (let j = 0; j < this._likelihoodWindow; j++) {
          res.likelihood_buffer[j] = 1 / this._likelihoodWindow;
        }
        
        res.likelihood_buffer_index = 0;

        // the following variables are used for regression :
        res.beta = new Array(m.models[i].components.length);

        for (let j = 0; j < res.beta.length; j++) {
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
    if(this._model !== undefined) {
      return this._model.models.length;
    }
    return 0;
  }
};

export default GmmDecoder;