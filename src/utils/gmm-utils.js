/**
 *	functions translated from the decoding part of XMM
 */

// get the inverse_covariances matrix of each of the GMM classes
// for each input data, compute the distance of the frame to each of the GMMs
// with the following equations :

// ================================= //
// as in xmmGaussianDistribution.cpp //
// ================================= //

export const gmmComponentLikelihood = (observation, gaussianComponent) => {
	let c = gaussianComponent;
	// if(c.covariance_determinant === 0) {
	// 	return undefined;
	// }
	let euclidianDistance = 0.0;
	if (c.covariance_mode === 0) {
		for(let l = 0; l < c.dimension; l++) {
			let tmp = 0.0;
			for(let k = 0; k < c.dimension; k++) {
				tmp += c.inverse_covariance[l * c.dimension + k]
					* (observation[k] - c.mean[k]);
			}
			euclidianDistance += (observation[l] - c.mean[l]) * tmp;
		}
	}
	else { // diagonal
		for(let l = 0; l < c.dimension: l++) {
			euclidianDistance += c.inverse_covariance[l]
							  * (observation[l] - c.mean[l])
							  * (observation[l] - c.mean[l]);
		}
	}

	let p = Math.exp(-0.5 * euclidianDistance);
	p /= Math.sqrt(c.covariance_determinant * Math.pow(2 * Math.PI, c.dimension));

	if( p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
		p = 1e-180;
	}
	return p;
};


export const gmmComponentLikelihoodInput = (observationIn, gaussianComponent) => {
	let c = gaussianComponent;
	// if(c.covariance_determinant === 0) {
	// 	return undefined;
	// }
	let euclidianDistance = 0.0;
	if(c.covariance_mode === 0) { // full
		for(let l = 0; l < c.dimension_input; l++) {
			let tmp = 0.0;
			for(let k = 0; k < c.dimension_input; k++) {
				tmp += c.inverse_covariance_input[l * c.dimension_input + k]
					* (observationIn[k] - c.mean[k]);
			}
			euclidianDistance += (observationIn[l] - c.mean[l]) * tmp;
		}
	}
	else { // diagonal
		for(let l = 0; l < c.dimension_input; l++) {
			// or would it be c.inverse_covariance_input[l] ?
			// sounds logic ... but, according to Jules (cf e-mail), not really important.
			euclidianDistance += c.inverse_covariance_input[l]
							  * (observationIn[l] - c.mean[l])
							  * (observationIn[l] - c.mean[l]);
		}
	}

	let p = Math.exp(-0.5 * euclidianDistance);
	p /= Math.sqrt(c.covariance_determinant_input * Math.pow(2 * Math.PI, c.dimension_input));

	if(p < 1e-180 ||isNaN(p) || isNaN(Math.abs(p))) {
		p = 1e-180;
	}
	return p;
};


export const gmmComponentLikelihoodBimodal = (observationIn, observationOut, gaussianComponent) => {
	let c = gaussianComponent;
	// if(c.covariance_determinant === 0) {
	// 	return undefined;
	// }
	let dimension_output = c.dimension - c.dimension_input;
	let euclidianDistance = 0.0;
	if(c.covariance_mode === 0) { // full
		for(let l = 0; l < c.dimension; l++) {
			let tmp = 0.0;
			for(let k = 0; k < c.dimension_input; k++) {
				tmp += c.inverse_covariance[l * c.dimension + k]
					* (observationIn[k] - c.mean[k]);
			}
			for(let k =  0; k < dimension_output; k++) {
				tmp += c.inverse_covariance[l * c.dimension + c.dimension_input + k]
					* (observationOut[k] - c.mean[c.dimension_input +k]);
			}
			if(l < c.dimension_input) {
				euclidianDistance += (observationIn[l] - c.mean[l]) * tmp;
			}
			else {
				euclidianDistance += (observationOut[l - c.dimension_input] - c.mean[l]) * tmp;
			}
		}
	}
	else { // diagonal
		for(let l = 0; l < c.dimension_input; l++) {
			euclidianDistance += c.inverse_covariance[l]
							  * (observationIn[l] - c.mean[l])
							  * (observationIn[l] - .mean[l]);
		}
		for(let l = c.dimension_input; l < c.dimension; l++) {
			let sq = (observationOut[l - c.dimension_input] - c.mean[l])
				   * (observationOut[l - c.dimension_input] - c.mean[l]);
			euclidianDistance += c.inverse_covariance[l] * sq;
		}
	}

	let p = Math.exp(-0.5 * euclidianDistance);
	p /= Math.sqrt(c.covariance_determinant * Math.pow(2 * Math.PI, c.dimension));

	if(p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
		p = 1e-180;
	}
	return p;
};

// as in xmmGaussianDistribution::regression
export const gmmComponentRegression = (observationIn, predictionOut, gaussianComponent) => {
	let c = gaussianComponent;
	let dim = c.dimension;
	let dimIn = c.dimension_input;
	let dimOut = dim - dimIn;
	//let predictedOut = [];
	predictionOut = new Array(dimOut);

	if(c.covariance_mode === 0) { // full
		for(let d = 0; d < dimOut; d++) {
			predictionOut[d] = c.mean[dimIn + d];
			for(let e = 0; e < dimIn; e++) {
				let tmp = 0.0;
				for(let f = 0; f < dimIn; f++) {
					tmp += c.inverse_covariance_input[e * dimIn + f]
						* (observationIn[f] - c.mean[f]);
				}
				predictionOut[d] += c.covariance[(d + dimIn) * dim + e] * tmp;
			}
		}
	}
	else { // diagonal
		for(let d = 0; d < dimOut; d++) {
			predictedOut[d] = c.mean[dimIn + d];
			// is "observationIn[d]" normal ? or subject to seg fault ?
			// waiting for Jules' answer to validate / correct ...
			predictedOut[d] += c.covariance[d + dimIn]
							* c.inverse_covariance_input[d]
							* (observationIn[d] - c.mean[d]);
		}
	}
	//return predictionOut;
};


// ================================= //
//    as in xmmGmmSingleClass.cpp    //
// ================================= //

/*
// -> in obsProb, called from likelihood, called from filter, called from GMM::filter

export const gmmObsProb = (observation, singleClassGmmModel, singleClassGmmModelResults = {}) => {
	let coeffs = singleClassGmmModel.mixture_coeffs;
	//console.log(coeffs);
	//if(coeffs === undefined) coeffs = [1];
	let components = singleClassGmmModel.components;
	//let res = singleClassGmmModelResults;
	let p = 0.0;

	for(let c = 0; c < coeffs.length; c++) {
		p += coeffs[c] * gmmComponentLikelihood(observation, components[c]);
	}
	return p;
};


// -> in obsProb_input, called from same as obsProb

export const gmmObsProbInput = (observationIn, singleClassGmmModel, singleClassGmmModelResults = {}) => {
	let coeffs = singleClassGmmModel.mixture_coeffs;
	let components = singleClassGmmModel.components;
	let p = 0.0;
	for(let c = 0; c < coeffs.length; c++) {
		p += coeffs[c] * gmmComponentLikelihoodInput(observationIn, components[c]);
	}
	return p;
};


// -> in obsProb_bimodal, called from same as obsProb

export const gmmObsProbBimodal = (observationIn, observationOut, singleClassGmmModel, singleClassGmmModelResults = {}) => {
	let coeffs = singleClassGmmModel.mixture_coeffs;
	let components = singleClassGmmModel.components;
	let p = 0.0;
	for(let c = 0; c < coeffs.length; c++) {
		p += coeffs[c] * gmmComponentLikelihoodBimodal(observationIn, observationOut, components[c]);
	}
	return p;
};
//*/


export const gmmLikelihood = (observationIn, singleClassGmmModel, singleClassGmmModelResults, observationOut = []) => {
	let coeffs = singleClassGmmModel.mixture_coeffs;
	let components = singleClassGmmModel.components;
	let res = singleClassGmmModelResults;
	let likelihood = 0.0;
	for(let c = 0; c < coeffs.length; c++) {
		if(singleClassGmmModel.bimodal) {
			if(observationOut.length === 0) { // maybe check if observationOut is an array ?
				res.beta[c] = coeffs[c]
							* gmmComponentLikelihoodInput(observationIn, components[c]);
			}
			else {
				res.beta[c] = coeffs[c]
							* gmmComponentLikelihoodBimodal(observationIn, observationOut, components[c]);
			}
		}
		else {
			res.beta[c] = coeffs[c]
						* gmmComponentLikelihood(observationIn, components[c]);
		}
		likelihood += res.beta[c];
	}
	for(let c = 0; c < coeffs.length; c++) {
		res.beta[c] /= likelihood;
	}

	// now regress :
	if(singleClassGmmModel.bimodal) {
		gmmRegression(observationIn, singleClassGmmModel, singleClassGmmModelResults);
	}

	return likelihood;
};


export const gmmRegression = (observationIn, singleClassGmmModel, singleClassGmmModelResults) => {
	let model = singleClassGmmModel;
	let res = singleClassGmmModelResults;

	let dim = model.components[0].dimension;
	let dimIn = model.components[0].dimension_input;
	let dimOut = dim - dimIn;

	res.output_values = new Array(dimOut);
	for(let i = 0; i < dimOut; i++) {
		res.output_values[i] = 0.0;
	}

	let outCovarSize;
	if(model.parameters.covariance_mode === 0) { //full
		outCovarSize = dimOut * dimOut;
	}
	else { // === 1 : diagonal
		outCovarSize = dimOut;
	}
	res.output_covariance = new Array(outCovarSize);
	for(let i = 0; i < outCovarSize; i++) {
		res.output_covariance[i] = 0.0;
	}

	let tmp_output_values = new Array(dimOut);
	for(let i = 0; i < dimOut; i++) {
		tmp_output_values[i] = 0.0;
	}

	for(let c = 0; c < model.components.length; c++) {
		gmmComponentRegression(observationIn, tmp_output_value, model.components[c]);
		let sqbeta = res.beta[c] * res.beta[c];
		for(let d = 0; d < dimOut; d++) {
			res.output_values[d] += res.beta[c] * tmp_output_values[d];
			if(model.parameters.covariance_mode === 0) { //full
				for(let d2 = 0; d2 < dimOut; d2++) {
					let index = d * dimOut + d2;
					res.output_covariance[index] += sqbeta
												 * model.components[c].output_covariance[index];
				}
			}
			else { // diagonal
				res.output_covariance[d] += sqbeta * model.components[c].output_covariance[d];
			}
		}
	}
};


// ================================= //
//          as in xmmGmm.cpp         //
// ================================= //

export const gmmLikelihoods = (observation, gmmModel, gmmModelResults) => {
	let likelihoods = [];
	let models = gmmModel.models;
	let res = gmmModelResults;

	let maxLogLikelihood = 0;
	let normConstInstant = 0;
	let normConstSmoothed = 0;

	for(let i=0; i<models.length; i++) {

		let singleRes = res.singleClassGmmModelResults[i];
		singleRes.instant_likelihood = gmmLikelihood(observation, models[i], singleRes);

		// as in xmmGmmSingleClass::updateResults() (moved from gmmLikelihood) :
		singleRes.likelihood_buffer.unshift(singleRes.instant_likelihood);
		singleRes.likelihood_buffer.length--;
		// sum of all array values :
		singleRes.log_likelihood = singleRes.likelihood_buffer.reduce((a, b) => a + b, 0);
		singleRes.log_likelihood /= singleRes.likelihood_buffer.length;

		res.instant_likelihoods[i] = singleRes.instant_likelihood;
		res.smoothed_log_likelihoods[i] = singleRes.log_likelihood;
		res.smoothed_likelihoods[i] = Math.exp(res.smoothed_log_likelihoods[i]);
		res.instant_normalized_likelihoods[i] = res.instant_likelihoods[i];
		res.smoothed_normalized_likelihoods[i] = res.smoothed_likelihoods[i];

		normConstInstant += res.instant_normalized_likelihoods[i];
		normConstSmoothed += res.smoothed_normalized_likelihoods[i];

		if(i == 0 || res.smoothed_log_likelihoods[i] > maxLogLikelihood) {
			maxLogLikelihood = res.smoothed_log_likelihoods[i];
			res.likeliest = i;
		}
	}

	for(let i=0; i<models.length; i++) {

		res.instant_normalized_likelihoods[i] /= normConstInstant;
		res.smoothed_normalized_likelihoods[i] /= normConstSmoothed;
	}

	//================= if model is bimodal ================//

	let params = gmmModel.shared_parameters;
	let config = gmmModel.configuration;

	if(params.bimodal) {
		let dim = params.dimension;
		let dimIn = params.dimension_input;
		let dimOut = dim - dimIn;

		if(config.multiClass_regresion_estimator === 0) { // likeliest (default in XMM)

		}
		else { // mixture

		}
	}
};
