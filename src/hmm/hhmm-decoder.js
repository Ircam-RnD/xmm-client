import * as gmmUtils from '../utils/gmm-utils';
import * as hhmmUtils from '../utils/hhmm-utils';

export default class HhmmDecoder {

	constructor(options = {}) {
		const defaults = {
			likelihoodWindow: 5,
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

		// could I do that ? (don't think it's the best idea)
		// (also change gmm-decoder so that both are consistent)

		// HhmmUtils.HhmmLikelihoods(observation, this.model, this.modelResults);			

	}

	reset() {
		this.modelResults.forward_initialized = false;
	}

	// ==================== SETTERS ====================== //

	set model(model) {		

		this.model = undefined;
		this.modelResults = undefined;

		// test if model is valid here (TODO : write a better test)
		if(model.models !== undefined) {

			console.log(model);

			this.model = model;
			let nmodels = model.models.length;

			let nstatesGlobal = model.configuration.default_parameters.states;
			this.params.frameSize = nstatesGlobal;

			// this.prior = new Array(nmodels);
			// this.exit_transition = new Array(nmodels);
			// this.transition = new Array(nmodels);
			// for(let i=0; i<nmodels; i++) {
			// 	this.transition[i] = new Array(nmodels);
			// }

			// this.frontier_v1 = new Array(nmodels);
			// this.frontier_v2 = new Array(nmodels);
			// this.forward_initialized = false;

			//this.results = {};

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

			for(let i = 0; i < nmodels; i++) {

				this.modelResults.instant_likelihoods[i] = 0;
				this.modelResults.smoothed_log_likelihoods[i] = 0;
				this.modelResults.smoothed_likelihoods[i] = 0;
				this.modelResults.instant_normalized_likelihoods[i] = 0;
				this.modelResults.smoothed_normalized_likelihoods[i] = 0;

				let nstates = this.model.models[i].parameters.states;

				let alpha_h = new Array(3);
				for(let j=0; j<3; j++) {
					alpha_h[j] = new Array(nstates);
					for(let k=0; k<nstates; k++) {
						alpha_h[j][k] = 0;
					}
				}
				
				let alpha = new Array(nstates);
				for(let j = 0; j < nstates; j++) {
					alpha[j] = 0;
				}

				let winSize = this.model.shared_parameters.likelihood_window
				let likelihood_buffer = new Array(winSize);
				for(let j = 0; j < winSize; j++) {
					likelihood_buffer[j] = 0.0;
				}

				let hmmRes = {
					hierarchical:
						this.model.configuration.default_parameters.hierarchical,
					instant_likelihood: 0,
					log_likelihood: 0,
					// for circular buffer implementation
					// (see hmmUpdateResults) :
					likelihood_buffer: likelihood_buffer,
					likelihood_buffer_index: 0,
					progress: 0,

					// never used ? -> check xmm cpp
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
					
					singleClassGmmModelResults: []	// states
				};

	            let params = this.model.shared_parameters;
	            let dimOut = params.dimension - params.dimension_input;
	            hmmRes.output_values = new Array(dimOut);
	            for(let i = 0; i < dimOut; i++) {
	                hmmRes.output_values[i] = 0.0;
	            }

	            let outCovarSize;
	            if(this.model.configuration.default_parameters.covariance_mode
	            	== 0) { // full
	                outCovarSize = dimOut * dimOut;
	            }
	            else { // diagonal
	                outCovarSize = dimOut;
	            }
	            hmmRes.output_covariance = new Array(outCovarSize);
	            for(let i = 0; i < dimOut; i++) {
	                hmmRes.output_covariance[i] = 0.0;
	            }

				// ADD INDIVIDUAL STATES (GMMs)
				for(let j = 0; j < nstates; j++) {
					let gmmRes = {
						instant_likelihood: 0,
						log_likelihood: 0,
					};
					gmmRes.beta
						= new Array(this.model.models[i].parameters.gaussians);
					for(let k = 0; k < gmmRes.beta.length; k++) {
						gmmRes.beta[k] = 1 / gmmRes.beta.length;
					}
					
	                gmmRes.output_values = hmmRes.output_values.slice(0);
	                gmmRes.output_covariance = hmmRes.output_covariance.slice(0);

					hmmRes.singleClassGmmModelResults.push(gmmRes);
				}

				this.modelResults.singleClassHmmModelResults.push(hmmRes);
			}
		}

		// ========== LFO specific
		// this.initialize({ frameSize: this.model.models.length });
	}

	// ==================== GETTERS ====================== //

	get likeliestLabel() {
		if(this.modelResults !== undefined) {
			if(this.modelResults.likeliest > -1) {
				return this.model.models[this.modelResults.likeliest].label;
			}
		}
		return 'unknown';
		//return('no estimation available');
	}

}