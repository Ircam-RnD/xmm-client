import * as gmmUtils from '../utils/gmm-utils';

export default class GmmDecoder {

  constructor(options = {}) {
    const defaults = {
      likelihoodWindow: 5
    };
    let params = Object.assign({}, defaults, options);

    this.model = undefined;
    this.modelResults = undefined;
    this.likelihoodWindow = params.likelihoodWindow;
  }

  filter(observation, resultsFunction) {
    if(this.model === undefined) {
      console.log("no model loaded");
      return;
    }

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

    let lklhds = this.modelResults.smoothed_normalized_likelihoods.slice(0);
    let lklst = 'unknown';
    if(this.modelResults.likeliest > -1) {
      lklst = this.model.models[this.modelResults.likeliest].label;
    }
    let results = {
      likeliest: lklst,
      likelihoods: lklhds         
    }

    // add regression results to global results if bimodal :
    if(this.model.shared_parameters.bimodal) {
      results.output_values = this.modelResults.output_values.slice(0);
      // results.output_covariance
      //     = this.modelResults.output_covariance.slice(0);
    }

    resultsFunction(results);
    // OR :
    // return results;
  }

  //=================== SETTERS =====================//

  set model(model) {
    this.model = undefined;
    this.modelResults = undefined;

    // test if model is valid here (TODO : write a better test)
    if(model.models !== undefined) {
      this.model = model;
      let m = this.model;
      let nmodels = m.models.length;
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

      let params = m.shared_parameters;
      let dimOut = params.dimension - params.dimension_input;
      this.modelResults.output_values = new Array(dimOut);
      for(let i = 0; i < dimOut; i++) {
        this.modelResults.output_values[i] = 0.0;
      }

      let outCovarSize;
      //------------------------------------------------------------- full
      if(m.configuration.default_parameters.covariance_mode == 0) {
        outCovarSize = dimOut * dimOut;
      //--------------------------------------------------------- diagonal
      } else {
        outCovarSize = dimOut;
      }
      this.modelResults.output_covariance = new Array(outCovarSize);
      for(let i = 0; i < dimOut; i++) {
        this.modelResults.output_covariance[i] = 0.0;
      }


      for(let i = 0; i < nmodels; i++) {

        this.modelResults.instant_likelihoods[i] = 0;
        this.modelResults.smoothed_log_likelihoods[i] = 0;
        this.modelResults.smoothed_likelihoods[i] = 0;
        this.modelResults.instant_normalized_likelihoods[i] = 0;
        this.modelResults.smoothed_normalized_likelihoods[i] = 0;

        let res = {};
        res.instant_likelihood = 0;
        res.log_likelihood = 0;

        res.likelihood_buffer = new Array(this.likelihoodWindow);
        res.likelihood_buffer.length = this.likelihoodWindow;
        for(let j = 0; j < this.likelihoodWindow; j++) {
          res.likelihood_buffer[j] = 1 / this.likelihoodWindow;
        }
        res.likelihood_buffer_index = 0;

        // the following variables are used for regression :

        res.beta = new Array(m.models[i].components.length);
        for(let j = 0; j < res.beta.length; j++) {
          res.beta[j] = 1 / res.beta.length;
        }
        res.output_values
          = this.modelResults.output_values.slice(0);
        res.output_covariance
          = this.modelResults.output_covariance.slice(0);

        // now add this singleModelResults object
        // to the global modelResults object :

        this.modelResults.singleClassGmmModelResults.push(res);
      }
    }
    //========== LFO specific : don't forget to add it in the LFO wrapper
    //this.initialize({ frameSize: this.model.models.length });
  }

  set likelihoodWindow(newWindowSize) {
    this.likelihoodWindow = newWindowSize;
    if(this.model === undefined) return;
    let res = this.modelResults.singleClassModelResults;
    for(let i=0; i<this.model.models.length; i++) {
      res[i].likelihood_buffer = new Array(this.likelihoodWindow);
      for(let j=0; j<this.likelihoodWindow; j++) {
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

  get likeliestLabel() {
    if(this.modelResults !== undefined) {
      if(this.modelResults.likeliest > -1) {
        return this.model.models[this.modelResults.likeliest].label;
      }
    }
    return 'unknown';
  }
}