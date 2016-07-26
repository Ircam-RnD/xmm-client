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
	// if (c.covariance_mode === 0) {
	for(let l = 0; l < c.dimension; l++) {
		let tmp = 0.0;
		for(let k = 0; k < c.dimension; k++) {
			tmp += c.inverse_covariance[l * c.dimension + k] * (observation[k] - c.mean[k]);
		}
		euclidianDistance += (observation[l] - c.mean[l]) * tmp;
	}
	// }
	// else { // diagonal
	// 	for(let l = 0; l < c.dimension: l++) {
	// 		euclidianDistance += c.inverse_covariance[l] * (obervation[l] - c.mean[l]) * (observation[l] - c.mean[l]);
	// 	}
	// }
	let p = Math.exp(-0.5 * euclidianDistance) / Math.sqrt(c.covariance_determinant * Math.pow(2 * Math.PI, c.dimension));

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
	//if(c.covariance_mode === 0) { // full
	for(let l = 0; l < c.dimension_input; l++) {
		let tmp = 0.0;
		for(let k = 0; k < c.dimension_input; k++) {
			tmp += c.inverse_covariance_input[l * c.dimension_input + k] * (observationIn[k] - c.mean[k]);
		}
		euclidianDistance += (observationIn[l] - c.mean[l]) * tmp;
	}
	// }
	// else { // diagonal
	// 	for(let l = 0; l < c.dimension_input; l++) {
	//		// or would it be c.inverse_covariance_input[l] ? sounds logic ... 
	// 		euclidianDistance += c.inverse_covariance_input[l] * (observationIn[l] - c.mean[l]) * (observationIn[l] - c.mean[l]);
	// 	}
	// }
	let p = Math.exp(-0.5 * euclidianDistance) / Math.sqrt(c.covariance_determinant_input * Math.pow(2 * Math.PI, c.dimension_input));

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
	// if(c.covariance_mode === 0) { // full
	for(let l = 0; l < c.dimension; l++) {
		let tmp = 0.0;
		for(let k = 0; k < c.dimension_input; k++) {
			tmp += c.inverse_covariance[l * c.dimension + k] * (observationIn[k] - c.mean[k]);
		}
		for(let k =  0; k < dimension_output; k++) {
			tmp += c.inverse_covariance[l * c.dimension + c.dimension_input + k] * (observationOut[k] - c.mean[c.dimension_input +k]);
		}
		if(l < c.dimension_input) {
			euclidianDistance += (observationIn[l] - c.mean[l]) * tmp;
		}
		else {
			euclidianDistance += (observationOut[l - c.dimension_input] - c.mean[l]) * tmp;
		}

	}
	// }
	//else { // diagonal
	for(let l = 0; l < c.dimension_input; l++) {
		euclidianDistance += c.inverse_covariance[l] * (observationIn[l] - c.mean[l]) * (observationIn[l] - .mean[l]);
	}
	for(let l = c.dimension_input; l < c.dimension; l++) {
		let sq = (observationOut[l - c.dimension_input] - c.mean[l]) * (observationOut[l - c.dimension_input] - c.mean[l]);
		euclidianDistance += c.inverse_covariance[l] * sq;
	}
	//}

	let p = Math.exp(-0.5 * euclidianDistance) / Math.sqrt(c.covariance_determinant * Math.pow(2 * Math.PI, c.dimension));

	if(p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
		p = 1e-180;
	}
	return p;
};


// ================================= //
//    as in xmmGmmSingleClass.cpp    //
// ================================= //

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


export const gmmLikelihood =() => {

};



//export const gmmRegression = (observation, )

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
		singleRes.log_likelihood = singleRes.likelihood_buffer.reduce((a, b) => a + b, 0); // sum of all array values
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
};
