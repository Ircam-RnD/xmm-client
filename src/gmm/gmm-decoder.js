import * as gmmUtils from '../utils/gmm-utils';

export default class GmmDecoder {

	constructor(options = {}) {
		const defaults = {
			likelihoodWindow: 5
		};
		let params =Object.assign({}, defaults, options);

		this.model = undefined;
		this.modelResults = undefined;
		this.likelihoodWindow = params.likelihoodWindow;
	}

	filter(observation, resultsFunction) {
		if(this.model === undefined) {
			console.log("no model loaded");
			return;
		}

		gmmUtils.gmmLikelihoods(observation, this.model, this.modelResults);			

		//================ LFO specific :
		//gmmLikelihoods(frame, this.model, this.modelResults);			
		//this.time = time;
		//this.metaData = metaData;
		//const outFrame = this.outFrame;
		//for(let i=0; i<this.model.models.length; i++) {
		//	outFrame[i] = this.modelResults.smoothed_normalized_likelihoods[i];
		//}
		//this.output();

		const lklhds = this.modelResults.smoothed_normalized_likelihoods.slice(0);
		const lklst = 'unknown';
		if(this.modelResults.likeliest > -1) {
			lklst = this.model.models[this.modelResults.likeliest].label;
		}
		const results = {
			likeliest: lklst,
			likelihoods: lklhds			
		}

		// do something for regression here :
		// if(model.shared_parameters.bimodal) {
		//
		// }

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
			let nmodels = model.models.length;
			this.modelResults = {
				instant_likelihoods: new Array(nmodels),
				smoothed_log_likelihoods: new Array(nmodels),
				smoothed_likelihoods: new Array(nmodels),
				instant_normalized_likelihoods: new Array(nmodels),
				smoothed_normalized_likelihoods: new Array(nmodels),
				likeliest: -1,
				singleClassGmmModelResults: []
			};

			for(let i=0; i<model.models.length; i++) {

				this.modelResults.instant_likelihoods[i] = 0;
				this.modelResults.smoothed_log_likelihoods[i] = 0;
				this.modelResults.smoothed_likelihoods[i] = 0;
				this.modelResults.instant_normalized_likelihoods[i] = 0;
				this.modelResults.smoothed_normalized_likelihoods[i] = 0;

				let res = {};
				res.instant_likelihood = 0;
				res.log_likelihood = 0;
				res.likelihood_buffer = [];
				res.likelihood_buffer.length = this.likelihoodWindow;
				for(let j=0; j<this.likelihoodWindow; j++) {
					res.likelihood_buffer[j] = 1 / this.likelihoodWindow;
				}
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
			res[i].likelihood_buffer = [];
			res[i].likelihood_buffer.length = this.likelihoodWindow;
			for(let j=0; j<this.likelihoodWindow; j++) {
				res.likelihood_buffer[j] = 1 / this.likelihoodWindow;
			}
		}
	}

	set varianceOffset() {
		// not used for now (need to implement updateInverseCovariance method)
	}

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