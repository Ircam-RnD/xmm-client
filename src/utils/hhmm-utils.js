/**
 *	functions translated from the decoding part of XMM
 */

// ================================= //
//    as in xmmHmmSingleClass.cpp    //
// ================================= //

export const hmmUpdateAlphaWindow = (singleClassHmmModel, singleClassHmmModelResults) => {
	let m = singleClassHmmModel;
	let res = singleClassHmmModelResults;

	let nstates = m.parameters.states;
	
	res.likeliest_state = 0;
	let best_alpha = res.alpha_h[0][0] + res.alpha_h[1][0];
	for(let i=1; i<nstates; i++) {
		if((res.alpha_h[0][i] + res.alpha_h[1][i]) > best_alpha) {
			best_alpha = res.alpha_h[0][i] + res.alpha_h[1][i];
			res.likeliest_state = i;
		}
	}

	res.window_minindex = res.likeliest_state - nstates / 2;
	res.window_maxindex = res.likeliest_state + nstates / 2;
	res.window_minindex = res.window_minindex >= 0 ? res.window_minindex : 0;
	res.window_maxindex = res.window_maxindex <= nstates ? res.window_maxindex : nstates;
	res.window_normalization_constant = 0;
	for(let i=res.window_minindex; i<res.window_maxindex; i++) {
		res.window_normalization_constant += (res.alpha_h[0][i] + res.alpha_h[1][i]);
	}
}

export const hmmUpdateResults = (singleClassHmmModel, singleClassHmmModelResults) => {
	let m = singleClassHmmModel;
	let res = singleClassHmmModelResults;

	// IS THIS CORRECT  ? TODO : CHECK AGAIN (seems to have precision issues)
	res.likelihood_buffer.push(Math.log(res.instant_likelihood));
	res.log_likelihood = 0;
	let bufSize = res.likelihood_buffer.length;
	for(let i=0; i<bufSize; i++) {
		res.log_likelihood += res.likelihood_buffer[i];
	}
	res.log_likelihood /= bufSize;

	res.progress = 0;
	for(let i=res.window_minindex; i<res.window_maxindex; i++) {
		res.progress += (res.alpha_h[0][i] + res.alpha_h[1][i] + res.alpha_h[2][i]) * i /
						res.window_normalization_constant;
	}
	res.progress /= (m.parameters.states - 1);
}

// ================================= //
//   as in xmmHierarchicalHmm.cpp    //
// ================================= //

export const hhmmLikelihoodAlpha = (exitNum, likelihoodVector, hhmmModel, hhmmModelResults) => {
	let m = hhmmModel;
	let res = hhmmModelResults;

	if(exitNum < 0) {
		//let l = 0;
		for(let i=0; i<m.models.length; i++) {
			likelihoodVector[i] = 0;
			for(let exit=0; exit<3; exit++) {
				for(let k=0; k<m.models[i].parameters.states; k++) {
					likelihoodVector[i] += res.singleClassHmmModelResults[i].alpha_h[exit][k];
				}
			}
		}
	} else {
		for(let i=0; i<m.models.length; i++) {
			likelihoodVector[i] = 0;
			for(let k=0; k<m.models[i].parameters.states; k++) {
				likelihoodVector[i] += res.singleClassHmmModelResults[i].alpha_h[exitNum][k];
			}
		}
	}
};
