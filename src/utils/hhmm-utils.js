import * as gmmUtils from './gmm-utils';

/**
 *	functions translated from the decoding part of XMM
 */

// ================================= //
//    as in xmmHmmSingleClass.cpp    //
// ================================= //

export const hmmRegression = (observationIn, singleClassHmmModel, singleClassHmmModelResults) => {
	let m = singleClassHmmModel;
	let mRes = singleClassHmmModelResults;
	let dim = m.states[0].components[0].dimension;
	let dimIn = m.states[0].components[0].dimension_input;
	let dimOut = dim - dimIn;

	let outCovarSize;
	if(m.states[0].components[0].covariance_mode === 0) { // full
		outCovarSize = dimOut * dimOut;
	}
	else { // diagonal
		outCovarSize = dimOut;
	}

	mRes.output_values = new Array(dimOut);
	for(let i = 0; i < dimOut; i++) {
		mRes.output_values[i] = 0.0;
	}
	mRes.output_covariance = new Array(outCovarSize);
	for(let i = 0; i < outCovarSize; i++) {
		mRes.output_covariance[i] = 0.0;
	}

	if(m.parameters.regression_estimator === 2) { // likeliest
		gmmUtils.gmmLikelihood(
			observationIn,
			m.states[mRes.likeliest_state],
			mRes.singleClassGmmModelResults[mRes.likeliest_state]
		);
		gmmUtils.gmmRegression(
			observationIn,
			m.states[mRes.likeliest_state],
			mRes.singleClassGmmModelResults[mRes.likeliest_state]
		);
		mRes.output_values
			= m.states[mRes.likeliest_state].output_values.slice(0);
		return;
	}

	let clipMinState = (m.parameters.regression_estimator == 0) // full
					 ? 0 : mRes.window_minindex;
	let clipMaxState = (m.parameters.regression_estimator == 0) // full
					 ? m.states.length : mRes.window_maxindex;
	let normConstant = (m.parameters.regression_estimator == 0) // full
					 ? 1.0 : mRes.window_normalization_constant;

	if(normConstant <= 0.0) {
		normConstant = 1.;
	}

	for(let i = clipMinState; i < clipMaxState; i++) {
		gmmUtils.gmmLikelihood(
			observationIn,
			m.states[i],
			mRes.singleClassGmmModelResults[i]
		);
		gmmUtils.gmmRegression(
			observationIn,
			m.states[i],
			mRes.singleClassGmmModelResults[i]
		);
		let tmpPredictedOutput
			= mRes.singleClassGmmModelResults[i].output_values.slice(0);

		for(let d = 0; d < dimOut; d++) {
			if(mRes.hierarchical) { // hierarchical
				mRes.output_values[d]
					+= (mRes.alpha_h[0][i] + mRes.alpha_h[1][i])
					* tmpPredictedOutput[d] / normConstant;
				if(m.parameters.covariance_mode === 0) { // full
					for(let d2 = 0; d2 < dimOut; d2++) {
						mRes.output_covariance[d * dimOut + d2]
							+= (mRes.alpha_h[0][i] + mRes.alpha_h[1][i]) *
							   (mRes.alpha_h[0][i] + mRes.alpha_h[1][i]) *
							    mRes.singleClassGmmModelResults[i]
							 		.output_covariance[d * dimOut + d2] /
							 	normConstant;
					}
				}
				else { // diagonal
					mRes.output_covariance[d]
						+= (mRes.alpha_h[0][i] + mRes.alpha_h[1][i]) *
						   (mRes.alpha_h[0][i] + mRes.alpha_h[1][i]) *
							mRes.singleClassGmmModelResults[i]
								.output_covariance[d] /
							normConstant;
				}
			}
			else { // non-hierarchical
				mRes.output_values[d] += mRes.alpha[i] * 
										 tmpPredictedOutput[d] / normConstant;
				if(m.parameters.covariance_mode === 0) { // full
					for(let d2 = 0; d2 < dimOut; d2++) {
						mRes.output_covariance[d * dimOut + d2]
							+= mRes.alpha[i] * mRes.alpha[i] *
							   mRes.singleClassGmmModelResults[i]
									.output_covariance[d * dimOut + d2] /
							   normConstant;
					}
				}
				else { // diagonal
					mRes.output_covariance[d] += mRes.alpha[i] * mRes.alpha[i] *
												 mRes.singleClassGmmModelResults
												 	.output_covariance[d] /
												 normConstant;
				}
			}
		}
	}
};

export const hmmForwardInit = (onservationIn, singleClassHmmModel, singleClassHmmModelResults, observationOut = []) => {
	let m = singleClassHmmModel;
	let mRes = singleClassHmmModelResults;
	let nstates = m.parameters.states;
	let normConst = 0.0;

	if(m.parameters.transition_mode === 0) { // ergodic
		for(let i = 0; i < nstates; i++) {
			if(m.states[i].components[0].bimodal) { // bimodal
				if(observationOut.length > 0) {
					mRes.alpha[i] = m.prior[i]
								  * gmmUtils.gmmObsProbBimodal(observationIn,
								  							   observationOut,
								  							   m.states[i]);
				}
				else {
					mRes.alpha[i] = m.prior[i]
								  * gmmUtils.gmmObsProbInput(observationIn,
								  							 m.states[i]);
				}
			}
			else { // not bimodal
				mRes.alpha[i] = m.prior[i]
							  * gmmUtils.gmmObsProb(observationIn, m.states[i]);
			}
			normConst += mRes.alpha[i];
		}
	}
	else { // left-right
		for(let i = 0; i < mRes.alpha.length; i++) {
			mRes.alpha[i] = 0.0;
		}
		if(m.states[0].components[0].bimodal) { //bimodal
			if(observationOut.length > 0) {
				mRes.alpha[0] = gmmUtils.gmmObsProbBimodal(observationIn,
														   observationOut,
														   m.states[0]);
			}
			else {
				mRes.alpha[0] = gmmUtils.gmmObsProbInput(observationIn,
														 m.states[0]);
			}
		}
		else {
			mRes.alpha[0] = gmmUtils.gmmObsProb(observationIn, m.states[0]);
		}
		normConst += mRes.alpha[0];
	}

	if(normConst > 0) {
		for(let i = 0; i < nstates; i++) {
			mRes.alpha[i] /= normConst;
		}
		return (1.0 / normConst);
	}
	else {
		for(let i = 0; i < nstates; i++) {
			mRes.alpha[i] = 1.0 / nstates;
		}
		return 1.0;
	}
};

export const hmmForwardUpdate = (observationIn, singleClassHmmModel, singleClassHmmModelResults, observationOut = []) => {
	let m = singleClassHmmModel;
	let mRes = singleClassHmmModelResults;
	let nstates = m.parameters.states;
	let normConst = 0.0;

	mRes.previous_alpha = mRes.alpha.slice(0);
	for(let i = 0; i < nstates; i++) {
		mRes.alpha[i] = 0;
		if(m.parameters.transition_mode === 0) { // ergodic
			for(let j = 0; j < nstates; j++) {
				mRes.alpha[i] += mRes.previous_alpha[j]
							  * mRes.transition[j * nstates+ i];
			}
		}
		else { // left-right
			mRes.alpha[i] += mRes.previous_alpha[i] * mRes.transition[i * 2];
			if(i > 0) {
				mRes.alpha[i] += mRes.previous_alpha[i - 1]
							  * mRes.transition[(i - 1) * 2 + 1];
			}
			else {
				mRes.alpha[0] += mRes.previous_alpha[nstates - 1]
							  * mRes.transition[nstates * 2 - 1];
			}
		}

		if(m.states[i].components[0].bimodal) {
			if(observationOut.length > 0) {
				mRes.alpha[i] *= gmmUtils.gmmObsProbBimodal(observationIn,
															observationOut,
															m.states[i]);
			}
			else {
				mRes.alpha[i] *= gmmUtils.gmmObsProbInput(observationIn,
														  m.states[i]);
			}
		}
		else {
			mRes.alpha[i] *= gmmUtils.gmmObsProb(observationIn,
												 m.states[i]);
		}
		normConst += mRes.alpha[i];
	}

	if(normConst > 1e-300) {
		for(let i = 0; i < nstates; i++) {
			mRes.alpha[i] /= normConst;
		}
		return (1.0 / normConst);
	}
	else {
		return 0.0;
	}
};

export const hmmUpdateAlphaWindow = (singleClassHmmModel, singleClassHmmModelResults) => {
	let m = singleClassHmmModel;
	let res = singleClassHmmModelResults;

	let nstates = m.parameters.states;
	
	res.likeliest_state = 0;
	let best_alpha;
	if(m.parameters.hierarchical) {
		best_alpha = res.alpha_h[0][0] + res.alpha_h[1][0];	
	}
	else {
		best_alpha = res.alpha[0];	
	}

	for(let i = 1; i < nstates; i++) {
		if(m.parameters.hierarchical) {
			if((res.alpha_h[0][i] + res.alpha_h[1][i]) > best_alpha) {
				best_alpha = res.alpha_h[0][i] + res.alpha_h[1][i];
				res.likeliest_state = i;
			}			
		}
		else {
			if(res.alpha[i] > best_alpha) {
				best_alpha = res.alpha[0];
				res.likeliest_state = i;
			}
		}
	}

	res.window_minindex = res.likeliest_state - nstates / 2;
	res.window_maxindex = res.likeliest_state + nstates / 2;
	res.window_minindex = (res.window_minindex >= 0)
						? res.window_minindex
						: 0;
	res.window_maxindex = (res.window_maxindex <= nstates)
						? res.window_maxindex
						: nstates;
	res.window_normalization_constant = 0;
	for(let i = res.window_minindex; i < res.window_maxindex; i++) {
		res.window_normalization_constant
			+= (res.alpha_h[0][i] + res.alpha_h[1][i]);
	}
}

export const hmmUpdateResults = (singleClassHmmModel, singleClassHmmModelResults) => {
	let m = singleClassHmmModel;
	let res = singleClassHmmModelResults;

	// IS THIS CORRECT  ? TODO : CHECK AGAIN (seems to have precision issues)
	// NORMALLY LIKELIHOOD_BUFFER IS CIRCULAR : IS IT THE CASE HERE ?
	// SHOULD I "POP_FRONT" ? (seems that yes)

	//res.likelihood_buffer.push(Math.log(res.instant_likelihood));

	// NOW THIS IS BETTER (SHOULDWORK AS INTENDED)
	res.likelihood_buffer[res.likelihood_buffer_index]
		= Math.log(res.instant_likelihood);
	res.likelihood_buffer_index
		= (res.likelihood_buffer_index + 1) % res.likelihood_buffer.length;

	res.log_likelihood = 0;
	let bufSize = res.likelihood_buffer.length;
	for(let i = 0; i < bufSize; i++) {
		res.log_likelihood += res.likelihood_buffer[i];
	}
	res.log_likelihood /= bufSize;

	res.progress = 0;
	for(let i = res.window_minindex; i < res.window_maxindex; i++) {
		if(m.parameters.hierarchical) { // hierarchical
			res.progress
				+= (res.alpha_h[0][i] + res.alpha_h[1][i] + res.alpha_h[2][i])
				* i / res.window_normalization_constant;
		}
		else { // non hierarchical
			res.progress += res.alpha[i] * i / res.window_normalization_constant;
		}
	}
	res.progress /= (m.parameters.states - 1);
}

// ================================= //
//   as in xmmHierarchicalHmm.cpp    //
// ================================= //

export const likelihoodAlpha = (exitNum, likelihoodVector, hhmmModel, hhmmModelResults) => {
	let m = hhmmModel;
	let res = hhmmModelResults;

	if(exitNum < 0) {
		//let l = 0;
		for(let i = 0; i < m.models.length; i++) {
			likelihoodVector[i] = 0;
			for(let exit = 0; exit < 3; exit++) {
				for(let k = 0; k < m.models[i].parameters.states; k++) {
					likelihoodVector[i]
						+= res.singleClassHmmModelResults[i].alpha_h[exit][k];
				}
			}
		}
	}
	else {
		for(let i = 0; i < m.models.length; i++) {
			likelihoodVector[i] = 0;
			for(let k = 0; k < m.models[i].parameters.states; k++) {
				likelihoodVector[i]
					+= res.singleClassHmmModelResults[i].alpha_h[exitNum][k];
			}
		}
	}
};

export const forwardInit = (observation, hhmmModel, hhmmModelResults) => {
	let norm_const = 0;

	//================= INITIALIZE ALPHA VARIABLES =================//

	for(let i = 0; i < hhmmModel.models.length; i++) {

		let m = hhmmModel.models[i];
		let nstates = m.parameters.states;
		let mRes = hhmmModelResults.singleClassHmmModelResults[i];

		for(let j = 0; j < 3; j++) {
			mRes.alpha_h[j] = new Array(nstates);
			for(let k = 0; k < nstates; k++) {
				mRes.alpha_h[j][k] = 0;
			}
		}

		if(m.parameters.transition_mode == 0) { // ergodic
			for(let k = 0; k < nstates; k++) {
				if(hhmmModel.shared_parameters.bimodal) { // bimodal
					mRes.alpha_h[0][k] = m.prior[k]
									   * gmmUtils.gmmObsProbInput(observation,
									   							  m.states[k]);
				}
				else { // not bimodal
					// see how obsProb is implemented
					mRes.alpha_h[0][k] = m.prior[k]
									   * gmmUtils.gmmObsProb(observation,
									   						 m.states[k]);
				}
				mRes.instant_likelihood += mRes.alpha[0][k];
			}
		}
		else { // left-right
			mRes.alpha_h[0][0] = hhmmModel.prior[i];
			if(hhmmModel.shared_parameters.bimodal) { // bimodal
				mRes.alpha_h[0][0] *= gmmUtils.gmmObsProbInput(observation,
															   m.states[k]);
			}
			else { // not bimodal
				mRes.alpha_h[0][0] *= gmmUtils.gmmObsProb(observation,
														  m.states[k]);
			}
			mRes.instant_likelihood = mRes.alpha_h[0][0];
		}
		norm_const += mRes.instant_likelihood;
	}

	//================== NORMALIZE ALPHA VARIABLES =================//

	for(let i = 0; i < hhmmModel.models.length; i++) {

		let nstates = hhmmModel.models[i].parameters.states;
		for(let e = 0; e < 3; e++) {
			for(let k = 0; k < nstates; k++) {
				hhmmModelResults.singleClassHmmModelResults[i].alpha_h[e][k] /= norm_const;
			}
		}
	}

	hhmmModelResults.forward_initialized = true;
};

//==================================================================//
//======================== FORWARD UPDATE ==========================//
//==================================================================//

export const forwardUpdate = (observation, hhmmModel, hhmmModelResults) => {
	let norm_const = 0;
	let tmp = 0;
	let front; // array

	let nmodels = hhmmModel.models.length;

	likelihoodAlpha(1, hhmmModelResults.frontier_v1, hhmmModel, hhmmModelResults);
	likelihoodAlpha(2, hhmmModelResults.frontier_v2, hhmmModel, hhmmModelResults);

	// let num_classes = 
	// let dstModelIndex = 0;

	for(let i = 0; i < nmodels; i++) {

		let m = hhmmModel.models[i];
		let nstates = m.parameters.states;
		let mRes = hhmmModelResults.singleClassHmmModelResults[i];
		
		//============= COMPUTE FRONTIER VARIABLE ============//

		front = new Array(nstates);
		for(let j = 0; j < nstates; j++) {
			front[j] = 0;
		}

		if(m.parameters.transition_mode == 0) { // ergodic
			for(let k = 0; k < nstates; k++) {
				for(let j = 0; j < nstates; j++) {
					front[k] += m.transition[j * nstates + k] /
								(1 - m.exitProbabilities[j]) *
								mRes.alpha_h[0][j];
				}
				for(let srci = 0; srci < nmodels; srci++) {
					front[k] += m.prior[k] *
								(
									hhmmModelResults.frontier_v1[srci]
									* hhmmModel.transition[srci][i]
								  + hhmmModelResults.frontier_v2[srci]
								  	* hhmmModel.prior[i]
								);
				}
			}
		}
		else { // left-right

			// k == 0 : first state of the primitive
			front[0] = m.transition[0] * mRes.alpha_h[0][0];

			for(let srci = 0; srci < hhmmModel.models.length; srci++) {
				front[0] += hhmmModelResults.frontier_v1[srci]
							* hhmmModel.transition[srci][i]
						  + hhmmModelResults.frontier_v2[srci]
						    * hhmmModel.prior[i];
			}

			// k > 0 : rest of the primitive
			for(let k = 1; k < nstates; k++) {
				front[k] += m.transition[k * 2] /
							(1 - m.exitProbabilities[k]) *
							mRes.alpha_h[0][k];
				front[k] += m.transition[(k - 1) * 2 + 1] /
							(1 - m.exitProbabilities[k - 1]) *
							mRes.alpha_h[0][k - 1];
			}

			for(let j = 0; j < 3; j++) {
				for(let k = 0; k < nstates; k++) {
					mRes.alpha_h[j][k] = 0;
				}
			}
		}

		//console.log(front);

		//============== UPDATE FORWARD VARIABLE =============//

		mRes.exit_likelihood = 0;
		mRes.instant_likelihood = 0;

		for(let k = 0; k < nstates; k++) {
			if(hhmmModel.shared_parameters.bimodal) {
				tmp = gmmUtils.gmmObsProbInput(observation, m.states[k]) * front[k];
			}
			else {
				tmp = gmmUtils.gmmObsProb(observation, m.states[k]) * front[k];
			}

			mRes.alpha_h[2][k] = hhmmModel.exit_transition[i] * m.exitProbabilities[k] * tmp;
			mRes.alpha_h[1][k] = (1 - hhmmModel.exit_transition[i]) * m.exitProbabilities[k] * tmp;
			mRes.alpha_h[0][k] = (1 - m.exitProbabilities[k]) * tmp;

			mRes.exit_likelihood 	+= mRes.alpha_h[1][k] + mRes.alpha_h[2][k];
			mRes.instant_likelihood += mRes.alpha_h[0][k] + mRes.alpha_h[1][k] + mRes.alpha_h[2][k];

			norm_const += tmp;
		}

		mRes.exit_ratio = mRes.exit_likelihood / mRes.instant_likelihood;
	}

	//============== NORMALIZE ALPHA VARIABLES =============//

	for(let i = 0; i < nmodels; i++) {
		for(let e = 0; e < 3; e++) {
			for(let k = 0; k < hhmmModel.models[i].parameters.states; k++) {
				hhmmModelResults.singleClassHmmModelResults[i].alpha_h[e][k] /= norm_const;
			}
		}
	}
};

//====================== UPDATE RESULTS ====================//

export const updateResults = (hhmmModel, hhmmModelResults) => {
	let maxlog_likelihood = 0;
	let normconst_instant = 0;
	let normconst_smoothed = 0;

	let res = hhmmModelResults;

	for(let i = 0; i < hhmmModel.models.length; i++) {

		let hmmRes = res.singleClassHmmModelResults[i];

		res.instant_likelihoods[i] 		= hmmRes.instant_likelihood;
		res.smoothed_log_likelihoods[i] = hmmRes.log_likelihood;
		res.smoothed_likelihoods[i] 	= Math.exp(res.smoothed_log_likelihoods[i]);

		res.instant_normalized_likelihoods[i] 	= res.instant_likelihoods[i];
		res.smoothed_normalized_likelihoods[i] 	= res.smoothed_likelihoods[i];

		normconst_instant 	+= res.instant_normalized_likelihoods[i];
		normconst_smoothed 	+= res.smoothed_normalized_likelihoods[i];

		if(i == 0 || res.smoothed_log_likelihoods[i] > maxlog_likelihood) {
			maxlog_likelihood = res.smoothed_log_likelihoods[i];
			res.likeliest = i;
		}
	}

	for(let i = 0; i < hhmmModel.models.length; i++) {
		res.instant_normalized_likelihoods[i] 	/= normconst_instant;
		res.smoothed_normalized_likelihoods[i] 	/= normconst_smoothed;
	}
};
