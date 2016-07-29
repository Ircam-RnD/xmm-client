"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
/*
 *	xmm decoder
 *	js port of the decoding part of XMM
 *	allows to filter input data from trained models
 * 	the training hes to be done with the XMM C++ library
 */

// NOTE : the models and modelResults must follow a precise document structure :
// 	- 	models should work as exported by XMM (JSON)
//	- 	modelResults replace the variables that normally exist in the cpp classes, which are needed for the decoding.
//		modelResults (in the case of HMMs), contains the array singleClassHmmModelResults, each element of which
//		contains an array of singleClassGmmModelResults (the HMM states).
//		see the decoder lfops for implementation.


// ================================= //
//    as in xmmHmmSingleClass.cpp    //
// ================================= //

var hmmUpdateAlphaWindow = exports.hmmUpdateAlphaWindow = function hmmUpdateAlphaWindow(singleClassHmmModel, singleClassHmmModelResults) {
	var m = singleClassHmmModel;
	var res = singleClassHmmModelResults;

	var nstates = m.parameters.states;

	res.likeliest_state = 0;
	var best_alpha = res.alpha_h[0][0] + res.alpha_h[1][0];
	for (var i = 1; i < nstates; i++) {
		if (res.alpha_h[0][i] + res.alpha_h[1][i] > best_alpha) {
			best_alpha = res.alpha_h[0][i] + res.alpha_h[1][i];
			res.likeliest_state = i;
		}
	}

	res.window_minindex = res.likeliest_state - nstates / 2;
	res.window_maxindex = res.likeliest_state + nstates / 2;
	res.window_minindex = res.window_minindex >= 0 ? res.window_minindex : 0;
	res.window_maxindex = res.window_maxindex <= nstates ? res.window_maxindex : nstates;
	res.window_normalization_constant = 0;
	for (var _i = res.window_minindex; _i < res.window_maxindex; _i++) {
		res.window_normalization_constant += res.alpha_h[0][_i] + res.alpha_h[1][_i];
	}
};

var hmmUpdateResults = exports.hmmUpdateResults = function hmmUpdateResults(singleClassHmmModel, singleClassHmmModelResults) {
	var m = singleClassHmmModel;
	var res = singleClassHmmModelResults;

	// IS THIS CORRECT  ? CHECK !
	res.likelihood_buffer.push(Math.log(res.instant_likelihood));
	res.log_likelihood = 0;
	var bufSize = res.likelihood_buffer.length;
	for (var i = 0; i < bufSize; i++) {
		res.log_likelihood += res.likelihood_buffer[i];
	}
	res.log_likelihood /= bufSize;

	res.progress = 0;
	for (var _i2 = res.window_minindex; _i2 < res.window_maxindex; _i2++) {
		res.progress += (res.alpha_h[0][_i2] + res.alpha_h[1][_i2] + res.alpha_h[2][_i2]) * _i2 / res.window_normalization_constant;
	}
	res.progress /= m.parameters.states - 1;
};

// ================================= //
//   as in xmmHierarchicalHmm.cpp    //
// ================================= //

var hhmmLikelihoodAlpha = exports.hhmmLikelihoodAlpha = function hhmmLikelihoodAlpha(exitNum, likelihoodVector, hhmmModel, hhmmModelResults) {
	var m = hhmmModel;
	var res = hhmmModelResults;

	if (exitNum < 0) {
		//let l = 0;
		for (var i = 0; i < m.models.length; i++) {
			likelihoodVector[i] = 0;
			for (var exit = 0; exit < 3; exit++) {
				for (var k = 0; k < m.models[i].parameters.states; k++) {
					likelihoodVector[i] += res.singleClassHmmModelResults[i].alpha_h[exit][k];
				}
			}
		}
	} else {
		for (var _i3 = 0; _i3 < m.models.length; _i3++) {
			likelihoodVector[_i3] = 0;
			for (var _k = 0; _k < m.models[_i3].parameters.states; _k++) {
				likelihoodVector[_i3] += res.singleClassHmmModelResults[_i3].alpha_h[exitNum][_k];
			}
		}
	}
};

//============================================================================//

// get the inverse_covariances matrix of each of the GMM classes
// for each input data, compute the distance of the frame to each of the GMMs
// with the following equations :

// ================================= //
// as in xmmGaussianDistribution.cpp //
// ================================= //

var gaussianComponentLikelihood = exports.gaussianComponentLikelihood = function gaussianComponentLikelihood(observation, gaussianComponent) {
	var component = gaussianComponent;
	var euclidianDistance = 0.0;
	for (var l = 0; l < component.dimension; l++) {
		var tmp = 0.0;
		for (var k = 0; k < component.dimension; k++) {
			tmp += component.inverse_covariance[l * component.dimension + k] * (observation[k] - component.mean[k]);
		}
		euclidianDistance += (observation[l] - component.mean[l]) * tmp;
	}
	var p = Math.exp(-0.5 * euclidianDistance) / Math.sqrt(component.covariance_determinant * Math.pow(2 * Math.PI, component.dimension));

	if (p < 1e-180 || isNaN(p) || isNaN(Math.abs(p))) {
		p = 1e-180;
	}
	return p;
};

// ================================= //
//    as in xmmGmmSingleClass.cpp    //
// ================================= //

// -> in obsProb, called from likelihood, called from filter, called from GMM::filter
// TODO : decompose in a similar way to XMM cpp to be able to use obsProb

var gmmLikelihood = exports.gmmLikelihood = function gmmLikelihood(observation, singleClassGmmModel) {
	var singleClassGmmModelResults = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

	var coeffs = singleClassGmmModel.mixture_coeffs;
	//console.log(coeffs);
	//if(coeffs === undefined) coeffs = [1];
	var components = singleClassGmmModel.components;
	//let res = singleClassGmmModelResults;
	var p = 0;

	for (var c = 0; c < coeffs.length; c++) {
		p += coeffs[c] * gaussianComponentLikelihood(observation, components[c]);
	}

	//res.instant_likelihood = p;

	// as in xmmGmmSingleClass::updateResults() :
	// => moved to gmmLikelihoods() so that this function looks more like obsProb
	/*
 res.likelihood_buffer.unshift(p);
 res.likelihood_buffer.length--;
 res.log_likelihood = res.likelihood_buffer.reduce((a, b) => a + b, 0); // sum of all array values
 res.log_likelihood /= res.likelihood_buffer.length;
 //*/

	return p;
};

// ================================= //
//          as in xmmGmm.cpp         //
// ================================= //

var gmmLikelihoods = exports.gmmLikelihoods = function gmmLikelihoods(observation, gmmModel, gmmModelResults) {
	var likelihoods = [];
	var models = gmmModel.models;
	var res = gmmModelResults;

	var maxLogLikelihood = 0;
	var normConstInstant = 0;
	var normConstSmoothed = 0;

	for (var i = 0; i < models.length; i++) {

		var singleRes = res.singleClassGmmModelResults[i];
		singleRes.instant_likelihood = gmmLikelihood(observation, models[i], singleRes);

		// as in xmmGmmSingleClass::updateResults() (moved from gmmLikelihood) :
		singleRes.likelihood_buffer.unshift(singleRes.instant_likelihood);
		singleRes.likelihood_buffer.length--;
		singleRes.log_likelihood = singleRes.likelihood_buffer.reduce(function (a, b) {
			return a + b;
		}, 0); // sum of all array values
		singleRes.log_likelihood /= singleRes.likelihood_buffer.length;

		res.instant_likelihoods[i] = singleRes.instant_likelihood;
		res.smoothed_log_likelihoods[i] = singleRes.log_likelihood;
		res.smoothed_likelihoods[i] = Math.exp(res.smoothed_log_likelihoods[i]);
		res.instant_normalized_likelihoods[i] = res.instant_likelihoods[i];
		res.smoothed_normalized_likelihoods[i] = res.smoothed_likelihoods[i];

		normConstInstant += res.instant_normalized_likelihoods[i];
		normConstSmoothed += res.smoothed_normalized_likelihoods[i];

		if (i == 0 || res.smoothed_log_likelihoods[i] > maxLogLikelihood) {
			maxLogLikelihood = res.smoothed_log_likelihoods[i];
			res.likeliest = i;
		}
	}

	for (var _i4 = 0; _i4 < models.length; _i4++) {

		res.instant_normalized_likelihoods[_i4] /= normConstInstant;
		res.smoothed_normalized_likelihoods[_i4] /= normConstSmoothed;
	}
};

//============================================================================//

// DO WE REALLY NEED THIS ?

/*
class XmmSingleClassGmm {
	constructor(options = {}) {
		const defaults = {
			likelihoodWindow: 5,
		};
		super(defaults, options);

		this.model = undefined;
		this.results = undefined;
		this.likelihoodWindow = this.params.likelihoodWindow;
	}

	setModel(model) {
		this.model = undefined;
		this.results = undefined;

		// test if model is valid here (TODO : write a better test)
		if(model !== undefined) {
			this.model = model;
			let nmodels = model.models.length;
			this.results = {
				instant_likelihood: new Array(nmodels),
				log_likelihood: new Array(nmodels),
				likelihood_buffer: new Array(nmodels),
				instant_normalized_likelihoods: new Array(nmodels),
				smoothed_normalized_likelihoods: new Array(nmodels),
				likeliest: -1,
				singleClassModelResults: []
			};

			for(let i=0; i<nmodels; i++) {

				this.results.instant_likelihoods[i] = 0;
				this.results.smoothed_log_likelihoods[i] = 0;
				this.results.smoothed_likelihoods[i] = 0;
				this.results.instant_normalized_likelihoods[i] = 0;
				this.results.smoothed_normalized_likelihoods[i] = 0;

				let res = {};
				res.instant_likelihood = 0;
				res.log_likelihood = 0;
				res.likelihood_buffer = [];
				res.likelihood_buffer.length = this.likelihoodWindow;
				for(let j=0; j<this.likelihoodWindow; j++) {
					res.likelihood_buffer[j] = 1 / this.likelihoodWindow;
				}
				this.results.singleClassModelResults.push(res);
			}
		}

		this.initialize({ frameSize: this.model.models.length });
	}

	likelihood(observation) {

	}

	// etc ...
}

class XmmSingleClassHmm {
	constructor(options = {}) {
		this.alpha_h = new Array(3);
		for(let i=0; i<3; i++) {
			alpha_h[i] = [];
		}

		this.prior = [];
		this.states = []; // these are XmmSingleClassGmm's

		this.results = {
			instant_likelihood: 0
		};

		this.forward_initialized = false;
		//this.previous_alpha = 
	}

	// ETC
}

*/
//# sourceMappingURL=data:application/json;base64,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VSxjQUFWLElBQTRCLFVBQVUsaUJBQVYsQ0FBNEIsTUFBeEQ7O0FBRUEsTUFBSSxtQkFBSixDQUF3QixDQUF4QixJQUE2QixVQUFVLGtCQUF2QztBQUNBLE1BQUksd0JBQUosQ0FBNkIsQ0FBN0IsSUFBa0MsVUFBVSxjQUE1QztBQUNBLE1BQUksb0JBQUosQ0FBeUIsQ0FBekIsSUFBOEIsS0FBSyxHQUFMLENBQVMsSUFBSSx3QkFBSixDQUE2QixDQUE3QixDQUFULENBQTlCO0FBQ0EsTUFBSSw4QkFBSixDQUFtQyxDQUFuQyxJQUF3QyxJQUFJLG1CQUFKLENBQXdCLENBQXhCLENBQXhDO0FBQ0EsTUFBSSwrQkFBSixDQUFvQyxDQUFwQyxJQUF5QyxJQUFJLG9CQUFKLENBQXlCLENBQXpCLENBQXpDOztBQUVBLHNCQUFvQixJQUFJLDhCQUFKLENBQW1DLENBQW5DLENBQXBCO0FBQ0EsdUJBQXFCLElBQUksK0JBQUosQ0FBb0MsQ0FBcEMsQ0FBckI7O0FBRUEsTUFBRyxLQUFLLENBQUwsSUFBVSxJQUFJLHdCQUFKLENBQTZCLENBQTdCLElBQWtDLGdCQUEvQyxFQUFpRTtBQUNoRSxzQkFBbUIsSUFBSSx3QkFBSixDQUE2QixDQUE3QixDQUFuQjtBQUNBLE9BQUksU0FBSixHQUFnQixDQUFoQjtBQUNBO0FBQ0Q7O0FBRUQsTUFBSSxJQUFJLE1BQUUsQ0FBVixFQUFhLE1BQUUsT0FBTyxNQUF0QixFQUE4QixLQUE5QixFQUFtQzs7QUFFbEMsTUFBSSw4QkFBSixDQUFtQyxHQUFuQyxLQUF5QyxnQkFBekM7QUFDQSxNQUFJLCtCQUFKLENBQW9DLEdBQXBDLEtBQTBDLGlCQUExQztBQUNBO0FBQ0QsQ0F4Q007O0FBMENQOztBQUVBOztBQUVBIiwiZmlsZSI6InhtbS1kZWNvZGVyLWNvbW1vbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKlx0eG1tIGRlY29kZXJcbiAqXHRqcyBwb3J0IG9mIHRoZSBkZWNvZGluZyBwYXJ0IG9mIFhNTVxuICpcdGFsbG93cyB0byBmaWx0ZXIgaW5wdXQgZGF0YSBmcm9tIHRyYWluZWQgbW9kZWxzXG4gKiBcdHRoZSB0cmFpbmluZyBoZXMgdG8gYmUgZG9uZSB3aXRoIHRoZSBYTU0gQysrIGxpYnJhcnlcbiAqL1xuXG5cbi8vIE5PVEUgOiB0aGUgbW9kZWxzIGFuZCBtb2RlbFJlc3VsdHMgbXVzdCBmb2xsb3cgYSBwcmVjaXNlIGRvY3VtZW50IHN0cnVjdHVyZSA6XG4vLyBcdC0gXHRtb2RlbHMgc2hvdWxkIHdvcmsgYXMgZXhwb3J0ZWQgYnkgWE1NIChKU09OKVxuLy9cdC0gXHRtb2RlbFJlc3VsdHMgcmVwbGFjZSB0aGUgdmFyaWFibGVzIHRoYXQgbm9ybWFsbHkgZXhpc3QgaW4gdGhlIGNwcCBjbGFzc2VzLCB3aGljaCBhcmUgbmVlZGVkIGZvciB0aGUgZGVjb2RpbmcuXG4vL1x0XHRtb2RlbFJlc3VsdHMgKGluIHRoZSBjYXNlIG9mIEhNTXMpLCBjb250YWlucyB0aGUgYXJyYXkgc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHMsIGVhY2ggZWxlbWVudCBvZiB3aGljaFxuLy9cdFx0Y29udGFpbnMgYW4gYXJyYXkgb2Ygc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHMgKHRoZSBITU0gc3RhdGVzKS5cbi8vXHRcdHNlZSB0aGUgZGVjb2RlciBsZm9wcyBmb3IgaW1wbGVtZW50YXRpb24uXG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyAgICBhcyBpbiB4bW1IbW1TaW5nbGVDbGFzcy5jcHAgICAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5leHBvcnQgY29uc3QgaG1tVXBkYXRlQWxwaGFXaW5kb3cgPSAoc2luZ2xlQ2xhc3NIbW1Nb2RlbCwgc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHMpID0+IHtcblx0bGV0IG0gPSBzaW5nbGVDbGFzc0htbU1vZGVsO1xuXHRsZXQgcmVzID0gc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHM7XG5cblx0bGV0IG5zdGF0ZXMgPSBtLnBhcmFtZXRlcnMuc3RhdGVzO1xuXHRcblx0cmVzLmxpa2VsaWVzdF9zdGF0ZSA9IDA7XG5cdGxldCBiZXN0X2FscGhhID0gcmVzLmFscGhhX2hbMF1bMF0gKyByZXMuYWxwaGFfaFsxXVswXTtcblx0Zm9yKGxldCBpPTE7IGk8bnN0YXRlczsgaSsrKSB7XG5cdFx0aWYoKHJlcy5hbHBoYV9oWzBdW2ldICsgcmVzLmFscGhhX2hbMV1baV0pID4gYmVzdF9hbHBoYSkge1xuXHRcdFx0YmVzdF9hbHBoYSA9IHJlcy5hbHBoYV9oWzBdW2ldICsgcmVzLmFscGhhX2hbMV1baV07XG5cdFx0XHRyZXMubGlrZWxpZXN0X3N0YXRlID0gaTtcblx0XHR9XG5cdH1cblxuXHRyZXMud2luZG93X21pbmluZGV4ID0gcmVzLmxpa2VsaWVzdF9zdGF0ZSAtIG5zdGF0ZXMgLyAyO1xuXHRyZXMud2luZG93X21heGluZGV4ID0gcmVzLmxpa2VsaWVzdF9zdGF0ZSArIG5zdGF0ZXMgLyAyO1xuXHRyZXMud2luZG93X21pbmluZGV4ID0gcmVzLndpbmRvd19taW5pbmRleCA+PSAwID8gcmVzLndpbmRvd19taW5pbmRleCA6IDA7XG5cdHJlcy53aW5kb3dfbWF4aW5kZXggPSByZXMud2luZG93X21heGluZGV4IDw9IG5zdGF0ZXMgPyByZXMud2luZG93X21heGluZGV4IDogbnN0YXRlcztcblx0cmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50ID0gMDtcblx0Zm9yKGxldCBpPXJlcy53aW5kb3dfbWluaW5kZXg7IGk8cmVzLndpbmRvd19tYXhpbmRleDsgaSsrKSB7XG5cdFx0cmVzLndpbmRvd19ub3JtYWxpemF0aW9uX2NvbnN0YW50ICs9IChyZXMuYWxwaGFfaFswXVtpXSArIHJlcy5hbHBoYV9oWzFdW2ldKTtcblx0fVxufVxuXG5leHBvcnQgY29uc3QgaG1tVXBkYXRlUmVzdWx0cyA9IChzaW5nbGVDbGFzc0htbU1vZGVsLCBzaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0cykgPT4ge1xuXHRsZXQgbSA9IHNpbmdsZUNsYXNzSG1tTW9kZWw7XG5cdGxldCByZXMgPSBzaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0cztcblxuXHQvLyBJUyBUSElTIENPUlJFQ1QgID8gQ0hFQ0sgIVxuXHRyZXMubGlrZWxpaG9vZF9idWZmZXIucHVzaChNYXRoLmxvZyhyZXMuaW5zdGFudF9saWtlbGlob29kKSk7XG5cdHJlcy5sb2dfbGlrZWxpaG9vZCA9IDA7XG5cdGxldCBidWZTaXplID0gcmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDtcblx0Zm9yKGxldCBpPTA7IGk8YnVmU2l6ZTsgaSsrKSB7XG5cdFx0cmVzLmxvZ19saWtlbGlob29kICs9IHJlcy5saWtlbGlob29kX2J1ZmZlcltpXTtcblx0fVxuXHRyZXMubG9nX2xpa2VsaWhvb2QgLz0gYnVmU2l6ZTtcblxuXHRyZXMucHJvZ3Jlc3MgPSAwO1xuXHRmb3IobGV0IGk9cmVzLndpbmRvd19taW5pbmRleDsgaTxyZXMud2luZG93X21heGluZGV4OyBpKyspIHtcblx0XHRyZXMucHJvZ3Jlc3MgKz0gKHJlcy5hbHBoYV9oWzBdW2ldICsgcmVzLmFscGhhX2hbMV1baV0gKyByZXMuYWxwaGFfaFsyXVtpXSkgKiBpIC9cblx0XHRcdFx0XHRcdHJlcy53aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDtcblx0fVxuXHRyZXMucHJvZ3Jlc3MgLz0gKG0ucGFyYW1ldGVycy5zdGF0ZXMgLSAxKTtcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyAgIGFzIGluIHhtbUhpZXJhcmNoaWNhbEhtbS5jcHAgICAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5leHBvcnQgY29uc3QgaGhtbUxpa2VsaWhvb2RBbHBoYSA9IChleGl0TnVtLCBsaWtlbGlob29kVmVjdG9yLCBoaG1tTW9kZWwsIGhobW1Nb2RlbFJlc3VsdHMpID0+IHtcblx0bGV0IG0gPSBoaG1tTW9kZWw7XG5cdGxldCByZXMgPSBoaG1tTW9kZWxSZXN1bHRzO1xuXG5cdGlmKGV4aXROdW0gPCAwKSB7XG5cdFx0Ly9sZXQgbCA9IDA7XG5cdFx0Zm9yKGxldCBpPTA7IGk8bS5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxpa2VsaWhvb2RWZWN0b3JbaV0gPSAwO1xuXHRcdFx0Zm9yKGxldCBleGl0PTA7IGV4aXQ8MzsgZXhpdCsrKSB7XG5cdFx0XHRcdGZvcihsZXQgaz0wOyBrPG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0XHRsaWtlbGlob29kVmVjdG9yW2ldICs9IHJlcy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oW2V4aXRdW2tdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGZvcihsZXQgaT0wOyBpPG0ubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsaWtlbGlob29kVmVjdG9yW2ldID0gMDtcblx0XHRcdGZvcihsZXQgaz0wOyBrPG0ubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0bGlrZWxpaG9vZFZlY3RvcltpXSArPSByZXMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFtleGl0TnVtXVtrXTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn07XG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG5cbi8vIGdldCB0aGUgaW52ZXJzZV9jb3ZhcmlhbmNlcyBtYXRyaXggb2YgZWFjaCBvZiB0aGUgR01NIGNsYXNzZXNcbi8vIGZvciBlYWNoIGlucHV0IGRhdGEsIGNvbXB1dGUgdGhlIGRpc3RhbmNlIG9mIHRoZSBmcmFtZSB0byBlYWNoIG9mIHRoZSBHTU1zXG4vLyB3aXRoIHRoZSBmb2xsb3dpbmcgZXF1YXRpb25zIDpcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyBhcyBpbiB4bW1HYXVzc2lhbkRpc3RyaWJ1dGlvbi5jcHAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG5leHBvcnQgY29uc3QgZ2F1c3NpYW5Db21wb25lbnRMaWtlbGlob29kID0gKG9ic2VydmF0aW9uLCBnYXVzc2lhbkNvbXBvbmVudCkgPT4ge1xuXHRsZXQgY29tcG9uZW50ID0gZ2F1c3NpYW5Db21wb25lbnQ7XG5cdGxldCBldWNsaWRpYW5EaXN0YW5jZSA9IDAuMDtcblx0Zm9yKGxldCBsID0gMDsgbCA8IGNvbXBvbmVudC5kaW1lbnNpb247IGwrKykge1xuXHRcdGxldCB0bXAgPSAwLjA7XG5cdFx0Zm9yKGxldCBrPSAwOyBrIDwgY29tcG9uZW50LmRpbWVuc2lvbjsgaysrKSB7XG5cdFx0XHR0bXAgKz0gY29tcG9uZW50LmludmVyc2VfY292YXJpYW5jZVtsICogY29tcG9uZW50LmRpbWVuc2lvbiArIGtdICogKG9ic2VydmF0aW9uW2tdIC0gY29tcG9uZW50Lm1lYW5ba10pO1xuXHRcdH1cblx0XHRldWNsaWRpYW5EaXN0YW5jZSArPSAob2JzZXJ2YXRpb25bbF0gLSBjb21wb25lbnQubWVhbltsXSkgKiB0bXA7XG5cdH1cblx0bGV0IHAgPSBNYXRoLmV4cCgtMC41ICogZXVjbGlkaWFuRGlzdGFuY2UpIC8gTWF0aC5zcXJ0KGNvbXBvbmVudC5jb3ZhcmlhbmNlX2RldGVybWluYW50ICogTWF0aC5wb3coMiAqIE1hdGguUEksIGNvbXBvbmVudC5kaW1lbnNpb24pKTtcblxuXHRpZiggcCA8IDFlLTE4MCB8fCBpc05hTihwKSB8fCBpc05hTihNYXRoLmFicyhwKSkpIHtcblx0XHRwID0gMWUtMTgwO1xuXHR9XG5cdHJldHVybiBwO1xufTtcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC8vXG4vLyAgICBhcyBpbiB4bW1HbW1TaW5nbGVDbGFzcy5jcHAgICAgLy9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuXG4vLyAtPiBpbiBvYnNQcm9iLCBjYWxsZWQgZnJvbSBsaWtlbGlob29kLCBjYWxsZWQgZnJvbSBmaWx0ZXIsIGNhbGxlZCBmcm9tIEdNTTo6ZmlsdGVyXG4vLyBUT0RPIDogZGVjb21wb3NlIGluIGEgc2ltaWxhciB3YXkgdG8gWE1NIGNwcCB0byBiZSBhYmxlIHRvIHVzZSBvYnNQcm9iXG5cbmV4cG9ydCBjb25zdCBnbW1MaWtlbGlob29kID0gKG9ic2VydmF0aW9uLCBzaW5nbGVDbGFzc0dtbU1vZGVsLCBzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0cyA9IHt9KSA9PiB7XG5cdGxldCBjb2VmZnMgPSBzaW5nbGVDbGFzc0dtbU1vZGVsLm1peHR1cmVfY29lZmZzO1xuXHQvL2NvbnNvbGUubG9nKGNvZWZmcyk7XG5cdC8vaWYoY29lZmZzID09PSB1bmRlZmluZWQpIGNvZWZmcyA9IFsxXTtcblx0bGV0IGNvbXBvbmVudHMgPSBzaW5nbGVDbGFzc0dtbU1vZGVsLmNvbXBvbmVudHM7XG5cdC8vbGV0IHJlcyA9IHNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzO1xuXHRsZXQgcCA9IDA7XG5cblx0Zm9yKGxldCBjID0gMDsgYyA8IGNvZWZmcy5sZW5ndGg7IGMrKykge1xuXHRcdHAgKz0gY29lZmZzW2NdICogZ2F1c3NpYW5Db21wb25lbnRMaWtlbGlob29kKG9ic2VydmF0aW9uLCBjb21wb25lbnRzW2NdKTtcblx0fVxuXG5cdC8vcmVzLmluc3RhbnRfbGlrZWxpaG9vZCA9IHA7XG5cblx0Ly8gYXMgaW4geG1tR21tU2luZ2xlQ2xhc3M6OnVwZGF0ZVJlc3VsdHMoKSA6XG5cdC8vID0+IG1vdmVkIHRvIGdtbUxpa2VsaWhvb2RzKCkgc28gdGhhdCB0aGlzIGZ1bmN0aW9uIGxvb2tzIG1vcmUgbGlrZSBvYnNQcm9iXG5cdC8qXG5cdHJlcy5saWtlbGlob29kX2J1ZmZlci51bnNoaWZ0KHApO1xuXHRyZXMubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoLS07XG5cdHJlcy5sb2dfbGlrZWxpaG9vZCA9IHJlcy5saWtlbGlob29kX2J1ZmZlci5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTsgLy8gc3VtIG9mIGFsbCBhcnJheSB2YWx1ZXNcblx0cmVzLmxvZ19saWtlbGlob29kIC89IHJlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGg7XG5cdC8vKi9cblxuXHRyZXR1cm4gcDtcbn07XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAvL1xuLy8gICAgICAgICAgYXMgaW4geG1tR21tLmNwcCAgICAgICAgIC8vXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLy9cblxuZXhwb3J0IGNvbnN0IGdtbUxpa2VsaWhvb2RzID0gKG9ic2VydmF0aW9uLCBnbW1Nb2RlbCwgZ21tTW9kZWxSZXN1bHRzKSA9PiB7XG5cdGxldCBsaWtlbGlob29kcyA9IFtdO1xuXHRsZXQgbW9kZWxzID0gZ21tTW9kZWwubW9kZWxzO1xuXHRsZXQgcmVzID0gZ21tTW9kZWxSZXN1bHRzO1xuXG5cdGxldCBtYXhMb2dMaWtlbGlob29kID0gMDtcblx0bGV0IG5vcm1Db25zdEluc3RhbnQgPSAwO1xuXHRsZXQgbm9ybUNvbnN0U21vb3RoZWQgPSAwO1xuXG5cdGZvcihsZXQgaT0wOyBpPG1vZGVscy5sZW5ndGg7IGkrKykge1xuXG5cdFx0bGV0IHNpbmdsZVJlcyA9IHJlcy5zaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0c1tpXTtcblx0XHRzaW5nbGVSZXMuaW5zdGFudF9saWtlbGlob29kID0gZ21tTGlrZWxpaG9vZChvYnNlcnZhdGlvbiwgbW9kZWxzW2ldLCBzaW5nbGVSZXMpO1xuXG5cdFx0Ly8gYXMgaW4geG1tR21tU2luZ2xlQ2xhc3M6OnVwZGF0ZVJlc3VsdHMoKSAobW92ZWQgZnJvbSBnbW1MaWtlbGlob29kKSA6XG5cdFx0c2luZ2xlUmVzLmxpa2VsaWhvb2RfYnVmZmVyLnVuc2hpZnQoc2luZ2xlUmVzLmluc3RhbnRfbGlrZWxpaG9vZCk7XG5cdFx0c2luZ2xlUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aC0tO1xuXHRcdHNpbmdsZVJlcy5sb2dfbGlrZWxpaG9vZCA9IHNpbmdsZVJlcy5saWtlbGlob29kX2J1ZmZlci5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTsgLy8gc3VtIG9mIGFsbCBhcnJheSB2YWx1ZXNcblx0XHRzaW5nbGVSZXMubG9nX2xpa2VsaWhvb2QgLz0gc2luZ2xlUmVzLmxpa2VsaWhvb2RfYnVmZmVyLmxlbmd0aDtcblxuXHRcdHJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldID0gc2luZ2xlUmVzLmluc3RhbnRfbGlrZWxpaG9vZDtcblx0XHRyZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldID0gc2luZ2xlUmVzLmxvZ19saWtlbGlob29kO1xuXHRcdHJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXSA9IE1hdGguZXhwKHJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0pO1xuXHRcdHJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSByZXMuaW5zdGFudF9saWtlbGlob29kc1tpXTtcblx0XHRyZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IHJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXTtcblxuXHRcdG5vcm1Db25zdEluc3RhbnQgKz0gcmVzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcblx0XHRub3JtQ29uc3RTbW9vdGhlZCArPSByZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXTtcblxuXHRcdGlmKGkgPT0gMCB8fCByZXMuc21vb3RoZWRfbG9nX2xpa2VsaWhvb2RzW2ldID4gbWF4TG9nTGlrZWxpaG9vZCkge1xuXHRcdFx0bWF4TG9nTGlrZWxpaG9vZCA9IHJlcy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV07XG5cdFx0XHRyZXMubGlrZWxpZXN0ID0gaTtcblx0XHR9XG5cdH1cblxuXHRmb3IobGV0IGk9MDsgaTxtb2RlbHMubGVuZ3RoOyBpKyspIHtcblxuXHRcdHJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gLz0gbm9ybUNvbnN0SW5zdGFudDtcblx0XHRyZXMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSAvPSBub3JtQ29uc3RTbW9vdGhlZDtcblx0fVxufTtcblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ly9cblxuLy8gRE8gV0UgUkVBTExZIE5FRUQgVEhJUyA/XG5cbi8qXG5jbGFzcyBYbW1TaW5nbGVDbGFzc0dtbSB7XG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuXHRcdGNvbnN0IGRlZmF1bHRzID0ge1xuXHRcdFx0bGlrZWxpaG9vZFdpbmRvdzogNSxcblx0XHR9O1xuXHRcdHN1cGVyKGRlZmF1bHRzLCBvcHRpb25zKTtcblxuXHRcdHRoaXMubW9kZWwgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5yZXN1bHRzID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMubGlrZWxpaG9vZFdpbmRvdyA9IHRoaXMucGFyYW1zLmxpa2VsaWhvb2RXaW5kb3c7XG5cdH1cblxuXHRzZXRNb2RlbChtb2RlbCkge1xuXHRcdHRoaXMubW9kZWwgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5yZXN1bHRzID0gdW5kZWZpbmVkO1xuXG5cdFx0Ly8gdGVzdCBpZiBtb2RlbCBpcyB2YWxpZCBoZXJlIChUT0RPIDogd3JpdGUgYSBiZXR0ZXIgdGVzdClcblx0XHRpZihtb2RlbCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR0aGlzLm1vZGVsID0gbW9kZWw7XG5cdFx0XHRsZXQgbm1vZGVscyA9IG1vZGVsLm1vZGVscy5sZW5ndGg7XG5cdFx0XHR0aGlzLnJlc3VsdHMgPSB7XG5cdFx0XHRcdGluc3RhbnRfbGlrZWxpaG9vZDogbmV3IEFycmF5KG5tb2RlbHMpLFxuXHRcdFx0XHRsb2dfbGlrZWxpaG9vZDogbmV3IEFycmF5KG5tb2RlbHMpLFxuXHRcdFx0XHRsaWtlbGlob29kX2J1ZmZlcjogbmV3IEFycmF5KG5tb2RlbHMpLFxuXHRcdFx0XHRpbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0c21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuXHRcdFx0XHRsaWtlbGllc3Q6IC0xLFxuXHRcdFx0XHRzaW5nbGVDbGFzc01vZGVsUmVzdWx0czogW11cblx0XHRcdH07XG5cblx0XHRcdGZvcihsZXQgaT0wOyBpPG5tb2RlbHM7IGkrKykge1xuXG5cdFx0XHRcdHRoaXMucmVzdWx0cy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldID0gMDtcblx0XHRcdFx0dGhpcy5yZXN1bHRzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA9IDA7XG5cdFx0XHRcdHRoaXMucmVzdWx0cy5zbW9vdGhlZF9saWtlbGlob29kc1tpXSA9IDA7XG5cdFx0XHRcdHRoaXMucmVzdWx0cy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSAwO1xuXHRcdFx0XHR0aGlzLnJlc3VsdHMuc21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IDA7XG5cblx0XHRcdFx0bGV0IHJlcyA9IHt9O1xuXHRcdFx0XHRyZXMuaW5zdGFudF9saWtlbGlob29kID0gMDtcblx0XHRcdFx0cmVzLmxvZ19saWtlbGlob29kID0gMDtcblx0XHRcdFx0cmVzLmxpa2VsaWhvb2RfYnVmZmVyID0gW107XG5cdFx0XHRcdHJlcy5saWtlbGlob29kX2J1ZmZlci5sZW5ndGggPSB0aGlzLmxpa2VsaWhvb2RXaW5kb3c7XG5cdFx0XHRcdGZvcihsZXQgaj0wOyBqPHRoaXMubGlrZWxpaG9vZFdpbmRvdzsgaisrKSB7XG5cdFx0XHRcdFx0cmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMSAvIHRoaXMubGlrZWxpaG9vZFdpbmRvdztcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLnJlc3VsdHMuc2luZ2xlQ2xhc3NNb2RlbFJlc3VsdHMucHVzaChyZXMpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuaW5pdGlhbGl6ZSh7IGZyYW1lU2l6ZTogdGhpcy5tb2RlbC5tb2RlbHMubGVuZ3RoIH0pO1xuXHR9XG5cblx0bGlrZWxpaG9vZChvYnNlcnZhdGlvbikge1xuXG5cdH1cblxuXHQvLyBldGMgLi4uXG59XG5cbmNsYXNzIFhtbVNpbmdsZUNsYXNzSG1tIHtcblx0Y29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG5cdFx0dGhpcy5hbHBoYV9oID0gbmV3IEFycmF5KDMpO1xuXHRcdGZvcihsZXQgaT0wOyBpPDM7IGkrKykge1xuXHRcdFx0YWxwaGFfaFtpXSA9IFtdO1xuXHRcdH1cblxuXHRcdHRoaXMucHJpb3IgPSBbXTtcblx0XHR0aGlzLnN0YXRlcyA9IFtdOyAvLyB0aGVzZSBhcmUgWG1tU2luZ2xlQ2xhc3NHbW0nc1xuXG5cdFx0dGhpcy5yZXN1bHRzID0ge1xuXHRcdFx0aW5zdGFudF9saWtlbGlob29kOiAwXG5cdFx0fTtcblxuXHRcdHRoaXMuZm9yd2FyZF9pbml0aWFsaXplZCA9IGZhbHNlO1xuXHRcdC8vdGhpcy5wcmV2aW91c19hbHBoYSA9IFxuXHR9XG5cblx0Ly8gRVRDXG59XG5cbiovXG4iXX0=