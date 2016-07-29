'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _wavesLfo = require('waves-lfo');

var lfo = _interopRequireWildcard(_wavesLfo);

var _xmmDecoderCommon = require('./xmm-decoder-common');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// simplified decoding algorithm :
//
// if(!forward_init)
// 		forward_init(obs);
// else
// 		forward_update(obs);
//
// for(model in models)
// 		model.updateAlphaWindow();
// 		model.updateResults();
//
// updateResults();

// A utiliser de xmm-decoder-common :
// - gaussianComponentLikelihood
// - gmmLikelihood (which uses gaussianComponentLikelihood)
// - not gmmLikelihoods, as it's the classifying part of GMM

// Which decoder parameters ?
// setLikelihoodWindow ?
// other smoothing windows ?
// exit probabilities ?
// ...


//===========================================================//

var XmmHhmmDecoder = function (_lfo$core$BaseLfo) {
	(0, _inherits3.default)(XmmHhmmDecoder, _lfo$core$BaseLfo);

	function XmmHhmmDecoder() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		(0, _classCallCheck3.default)(this, XmmHhmmDecoder);

		var defaults = {
			likelihoodWindow: 5
		};

		var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(XmmHhmmDecoder).call(this, defaults, options));

		_this.model = undefined;
		_this.modelResults = undefined;
		_this.likelihoodWindow = _this.params.likelihoodWindow;
		return _this;
	}

	(0, _createClass3.default)(XmmHhmmDecoder, [{
		key: 'process',


		//================ process frame =================//

		value: function process(time, frame, metaData) {

			//incoming frame is observation vector
			if (this.model === undefined || this.modelResults === undefined) {
				//console.log("no model loaded");
				return;
			}

			//--------------------------------------------//

			this.time = time;
			this.metaData = metaData;

			var outFrame = this.outFrame;

			if (this.forward_initialized) {
				this.forwardUpdate(frame);
			} else {
				this.forwardInit(frame);
			}

			// for(let i=0; i<this.modelResults.singleClassHmmModelResults.length; i++) {
			// 		console.log(this.modelResults.singleClassHmmModelResults[i].alpha_h[0][0]);
			// }

			for (var i = 0; i < this.model.models.length; i++) {
				(0, _xmmDecoderCommon.hmmUpdateAlphaWindow)(this.model.models[i], this.modelResults.singleClassHmmModelResults[i]);
				(0, _xmmDecoderCommon.hmmUpdateResults)(this.model.models[i], this.modelResults.singleClassHmmModelResults[i]);
			}

			// for(let i=0; i<this.modelResults.singleClassHmmModelResults.length; i++) {
			// 		console.log(this.modelResults.singleClassHmmModelResults[i].alpha_h[0][0]);
			// }

			this.updateResults();

			// for(let i=0; i<this.modelResults.singleClassHmmModelResults.length; i++) {
			// 		console.log(this.modelResults.singleClassHmmModelResults[i].alpha_h[0][0]);
			// }

			for (var _i = 0; _i < this.model.models.length; _i++) {
				outFrame[_i] = this.modelResults.smoothed_normalized_likelihoods[_i];
			}

			this.output();
		}

		//==================================================================//
		//====================== load model from json ======================//
		//==================================================================//

	}, {
		key: 'setModel',
		value: function setModel(model) {

			this.model = undefined;
			this.modelResults = undefined;

			// test if model is valid here (TODO : write a better test)
			if (model.models !== undefined) {

				console.log(model);

				this.model = model;
				var nmodels = model.models.length;

				var nstatesGlobal = model.configuration.default_parameters.states;
				this.params.frameSize = nstatesGlobal;

				// this.prior = new Array(nmodels);
				// this.exit_transition = new Array(nmodels);
				// this.transition = new Array(nmodels);
				// for(let i=0; i<nmodels; i++) {
				// 	this.transition[i] = new Array(nmodels);
				// }
				this.frontier_v1 = new Array(nmodels);
				this.frontier_v2 = new Array(nmodels);
				this.forward_initialized = false;
				//this.results = {};

				this.modelResults = {
					instant_likelihoods: new Array(nmodels),
					smoothed_log_likelihoods: new Array(nmodels),
					smoothed_likelihoods: new Array(nmodels),
					instant_normalized_likelihoods: new Array(nmodels),
					smoothed_normalized_likelihoods: new Array(nmodels),
					likeliest: -1,
					singleClassHmmModelResults: []
				};

				for (var i = 0; i < nmodels; i++) {

					this.modelResults.instant_likelihoods[i] = 0;
					this.modelResults.smoothed_log_likelihoods[i] = 0;
					this.modelResults.smoothed_likelihoods[i] = 0;
					this.modelResults.instant_normalized_likelihoods[i] = 0;
					this.modelResults.smoothed_normalized_likelihoods[i] = 0;

					var nstates = this.model.models[i].parameters.states;

					var alpha_h = new Array(3);
					for (var j = 0; j < 3; j++) {
						alpha_h[j] = new Array(nstates);
						for (var k = 0; k < nstates; k++) {
							alpha_h[j][k] = 0;
						}
					}

					var hmmRes = {
						instant_likelihood: 0,
						log_likelihood: 0,
						likelihood_buffer: [],
						progress: 0,

						// never used ? -> check xmm cpp
						exit_likelihood: 0,
						exit_ratio: 0,

						likeliest_state: -1,

						//alpha: new Array(nstates), 	// for non-hierarchical
						alpha_h: alpha_h, // for hierarchical
						prior: new Array(nstates),
						transition: new Array(nstates),

						// used in hmmUpdateAlphaWindow
						window_minindex: 0,
						window_maxindex: 0,
						window_normalization_constant: 0,

						singleClassGmmModelResults: [] // states
					};

					// ADD INDIVIDUAL STATES (GMMs)
					for (var _j = 0; _j < nstates; _j++) {
						var gmmRes = {
							instant_likelihood: 0
						};

						hmmRes.singleClassGmmModelResults.push(gmmRes);
					}

					this.modelResults.singleClassHmmModelResults.push(hmmRes);
				}
			}

			//this.streamParams.frameSize = this.model.models.length;
			this.initialize({ frameSize: this.model.models.length });
			//console.log(this.streamParams.frameSize);
			//console.log(this.modelResults);
		}

		//============================ RESET ==============================//

	}, {
		key: 'reset',
		value: function reset() {
			this.forward_initialized = false;
		}

		//==================================================================//
		//========================= FORWARD INIT ===========================//
		//==================================================================//

	}, {
		key: 'forwardInit',
		value: function forwardInit(observation) {
			var norm_const = 0;
			//let modelIndex = 0;

			//================= INITIALIZE ALPHA VARIABLES =================//

			for (var i = 0; i < this.model.models.length; i++) {

				var m = this.model.models[i];
				var nstates = m.parameters.states;
				var mRes = this.modelResults.singleClassHmmModelResults[i];

				for (var j = 0; j < 3; j++) {
					mRes.alpha_h[j] = new Array(nstates);
					for (var k = 0; k < nstates; k++) {
						mRes.alpha_h[j][k] = 0;
					}
				}

				if (m.parameters.transition_mode == 0) {
					////////////////////// ergodic
					for (var _k = 0; _k < nstates; _k++) {
						mRes.alpha_h[0][_k] = mRes.prior[_k] * (0, _xmmDecoderCommon.gmmLikelihood)(observation, m.states[_k], mRes.singleClassGmmModelResults[_k]); // see how obsProb is implemented
						mRes.instant_likelihood += mRes.alpha[0][_k];
					}
				} else {
					///////////////////////////////////////////////////// left-right
					mRes.alpha_h[0][0] = this.model.prior[i];
					mRes.alpha_h[0][0] *= (0, _xmmDecoderCommon.gmmLikelihood)(observation, m.states[0], mRes.singleClassGmmModelResults[0]);
					mRes.instant_likelihood = mRes.alpha_h[0][0];
				}
				norm_const += mRes.instant_likelihood;
			}

			//================== NORMALIZE ALPHA VARIABLES =================//

			for (var _i2 = 0; _i2 < this.model.models.length; _i2++) {

				var _nstates = this.model.models[_i2].parameters.states;
				for (var e = 0; e < 3; e++) {
					for (var _k2 = 0; _k2 < _nstates; _k2++) {
						this.modelResults.singleClassHmmModelResults[_i2].alpha_h[e][_k2] /= norm_const;
					}
				}
			}

			this.forward_initialized = true;
		}

		//==================================================================//
		//======================== FORWARD UPDATE ==========================//
		//==================================================================//

	}, {
		key: 'forwardUpdate',
		value: function forwardUpdate(observation) {
			var norm_const = 0;
			var tmp = 0;
			var front = void 0; // array

			var nmodels = this.model.models.length;

			(0, _xmmDecoderCommon.hhmmLikelihoodAlpha)(1, this.frontier_v1, this.model, this.modelResults);
			(0, _xmmDecoderCommon.hhmmLikelihoodAlpha)(2, this.frontier_v2, this.model, this.modelResults);

			// let num_classes = 
			// let dstModelIndex = 0;

			for (var i = 0; i < nmodels; i++) {

				var m = this.model.models[i];
				var nstates = m.parameters.states;
				var mRes = this.modelResults.singleClassHmmModelResults[i];

				//============= COMPUTE FRONTIER VARIABLE ============//

				front = new Array(nstates);
				for (var j = 0; j < nstates; j++) {
					front[j] = 0;
				}

				if (m.parameters.transition_mode == 0) {
					////////////////////// ergodic
					for (var k = 0; k < nstates; k++) {
						for (var _j2 = 0; _j2 < nstates; _j2++) {
							front[k] += m.transition[_j2 * nstates + k] / (1 - m.exitProbabilities[_j2]) * mRes.alpha_h[0][_j2];
						}
						for (var srci = 0; srci < nmodels; srci++) {
							front[k] += mRes.prior[k] * (this.frontier_v1[srci] * this.model.transition[srci][i] + this.model.prior[i] * this.frontier_v2[srci]);
						}
					}
				} else {
					//////////////////////////////////////////////////// left-right

					// k == 0 : first state of the primitive
					front[0] = m.transition[0] * mRes.alpha_h[0][0];

					for (var _srci = 0; _srci < this.model.models.length; _srci++) {
						front[0] += this.frontier_v1[_srci] * this.model.transition[_srci][i] + this.model.prior[i] * this.frontier_v2[_srci];
					}

					// k > 0 : rest of the primitive
					for (var _k3 = 1; _k3 < nstates; _k3++) {
						front[_k3] += m.transition[_k3 * 2] / (1 - m.exitProbabilities[_k3]) * mRes.alpha_h[0][_k3];
						front[_k3] += m.transition[(_k3 - 1) * 2 + 1] / (1 - m.exitProbabilities[_k3 - 1]) * mRes.alpha_h[0][_k3 - 1];
					}

					for (var _j3 = 0; _j3 < 3; _j3++) {
						for (var _k4 = 0; _k4 < nstates; _k4++) {
							mRes.alpha_h[_j3][_k4] = 0;
						}
					}
				}

				//console.log(front);

				//============== UPDATE FORWARD VARIABLE =============//

				mRes.exit_likelihood = 0;
				mRes.instant_likelihood = 0;

				for (var _k5 = 0; _k5 < nstates; _k5++) {
					tmp = (0, _xmmDecoderCommon.gmmLikelihood)(observation, m.states[_k5], mRes.singleClassGmmModelResults[_k5]) * front[_k5];

					mRes.alpha_h[2][_k5] = this.model.exit_transition[i] * m.exitProbabilities[_k5] * tmp;
					mRes.alpha_h[1][_k5] = (1 - this.model.exit_transition[i]) * m.exitProbabilities[_k5] * tmp;
					mRes.alpha_h[0][_k5] = (1 - m.exitProbabilities[_k5]) * tmp;

					mRes.exit_likelihood += mRes.alpha_h[1][_k5] + mRes.alpha_h[2][_k5];
					mRes.instant_likelihood += mRes.alpha_h[0][_k5] + mRes.alpha_h[1][_k5] + mRes.alpha_h[2][_k5];

					norm_const += tmp;
				}

				mRes.exit_ratio = mRes.exit_likelihood / mRes.instant_likelihood;
			}

			//============== NORMALIZE ALPHA VARIABLES =============//

			for (var _i3 = 0; _i3 < nmodels; _i3++) {
				for (var e = 0; e < 3; e++) {
					for (var _k6 = 0; _k6 < this.model.models[_i3].parameters.states; _k6++) {
						this.modelResults.singleClassHmmModelResults[_i3].alpha_h[e][_k6] /= norm_const;
					}
				}
			}
		}

		//====================== UPDATE RESULTS ====================//

	}, {
		key: 'updateResults',
		value: function updateResults() {
			var maxlog_likelihood = 0;
			var normconst_instant = 0;
			var normconst_smoothed = 0;

			var res = this.modelResults;

			for (var i = 0; i < this.model.models.length; i++) {

				var hmmRes = res.singleClassHmmModelResults[i];

				res.instant_likelihoods[i] = hmmRes.instant_likelihood;
				res.smoothed_log_likelihoods[i] = hmmRes.log_likelihood;
				res.smoothed_likelihoods[i] = Math.exp(res.smoothed_log_likelihoods[i]);

				res.instant_normalized_likelihoods[i] = res.instant_likelihoods[i];
				res.smoothed_normalized_likelihoods[i] = res.smoothed_likelihoods[i];

				normconst_instant += res.instant_normalized_likelihoods[i];
				normconst_smoothed += res.smoothed_normalized_likelihoods[i];

				if (i == 0 || res.smoothed_log_likelihoods[i] > maxlog_likelihood) {
					maxlog_likelihood = res.smoothed_log_likelihoods[i];
					res.likeliest = i;
				}
			}

			for (var _i4 = 0; _i4 < this.model.models.length; _i4++) {
				res.instant_normalized_likelihoods[_i4] /= normconst_instant;
				res.smoothed_normalized_likelihoods[_i4] /= normconst_smoothed;
			}
		}
	}, {
		key: 'likeliestLabel',
		get: function get() {
			if (this.modelResults !== undefined) {
				if (this.modelResults.likeliest > -1) {
					return this.model.models[this.modelResults.likeliest].label;
				}
			}
			return 'unknown';
			//return('no estimation available');
		}
	}]);
	return XmmHhmmDecoder;
}(lfo.core.BaseLfo);

/*
	setLikelihoodWindow(newWindowSize) {
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

	setVarianceOffset() {
		// not used for now (need to implement updateInverseCovariance method).
		// now accessible as training parameter of the child process.
	}

//*/


exports.default = XmmHhmmDecoder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxmby14bW0taGhtbS1kZWNvZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0lBQVksRzs7QUFDWjs7Ozs7O0FBS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBOztJQUVxQixjOzs7QUFFcEIsMkJBQTBCO0FBQUEsTUFBZCxPQUFjLHlEQUFKLEVBQUk7QUFBQTs7QUFDekIsTUFBTSxXQUFXO0FBQ2hCLHFCQUFrQjtBQURGLEdBQWpCOztBQUR5QixzSEFJbkIsUUFKbUIsRUFJVCxPQUpTOztBQU16QixRQUFLLEtBQUwsR0FBYSxTQUFiO0FBQ0EsUUFBSyxZQUFMLEdBQW9CLFNBQXBCO0FBQ0EsUUFBSyxnQkFBTCxHQUF3QixNQUFLLE1BQUwsQ0FBWSxnQkFBcEM7QUFSeUI7QUFTekI7Ozs7OztBQWFEOzswQkFFUSxJLEVBQU0sSyxFQUFPLFEsRUFBVTs7QUFFOUI7QUFDQSxPQUFHLEtBQUssS0FBTCxLQUFlLFNBQWYsSUFBNEIsS0FBSyxZQUFMLEtBQXNCLFNBQXJELEVBQWdFO0FBQy9EO0FBQ0E7QUFDQTs7QUFFRDs7QUFFQSxRQUFLLElBQUwsR0FBWSxJQUFaO0FBQ0EsUUFBSyxRQUFMLEdBQWdCLFFBQWhCOztBQUVBLE9BQU0sV0FBVyxLQUFLLFFBQXRCOztBQUVBLE9BQUcsS0FBSyxtQkFBUixFQUE2QjtBQUM1QixTQUFLLGFBQUwsQ0FBbUIsS0FBbkI7QUFDQSxJQUZELE1BRU87QUFDTixTQUFLLFdBQUwsQ0FBaUIsS0FBakI7QUFDQTs7QUFFRDtBQUNBO0FBQ0E7O0FBRUEsUUFBSSxJQUFJLElBQUUsQ0FBVixFQUFhLElBQUUsS0FBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixNQUFqQyxFQUF5QyxHQUF6QyxFQUE4QztBQUM3QyxnREFB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RUEsUUFBRyxLQUFHLENBQUgsSUFBUSxJQUFJLHdCQUFKLENBQTZCLENBQTdCLElBQWtDLGlCQUE3QyxFQUFnRTtBQUMvRCx5QkFBb0IsSUFBSSx3QkFBSixDQUE2QixDQUE3QixDQUFwQjtBQUNBLFNBQUksU0FBSixHQUFnQixDQUFoQjtBQUNBO0FBQ0Q7O0FBRUQsUUFBSSxJQUFJLE1BQUUsQ0FBVixFQUFhLE1BQUUsS0FBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixNQUFqQyxFQUF5QyxLQUF6QyxFQUE4QztBQUM3QyxRQUFJLDhCQUFKLENBQW1DLEdBQW5DLEtBQTBDLGlCQUExQztBQUNBLFFBQUksK0JBQUosQ0FBb0MsR0FBcEMsS0FBMkMsa0JBQTNDO0FBQ0E7QUFDRDs7O3NCQTFXb0I7QUFDcEIsT0FBRyxLQUFLLFlBQUwsS0FBc0IsU0FBekIsRUFBb0M7QUFDbkMsUUFBRyxLQUFLLFlBQUwsQ0FBa0IsU0FBbEIsR0FBOEIsQ0FBQyxDQUFsQyxFQUFxQztBQUNwQyxZQUFPLEtBQUssS0FBTCxDQUFXLE1BQVgsQ0FBa0IsS0FBSyxZQUFMLENBQWtCLFNBQXBDLEVBQStDLEtBQXREO0FBQ0E7QUFDRDtBQUNELFVBQU8sU0FBUDtBQUNBO0FBQ0E7OztFQXJCMEMsSUFBSSxJQUFKLENBQVMsTzs7QUEwWHJEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tCQTFYcUIsYyIsImZpbGUiOiJsZm8teG1tLWhobW0tZGVjb2Rlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxmbyBmcm9tICd3YXZlcy1sZm8nO1xuaW1wb3J0IHtnbW1MaWtlbGlob29kLFxuXHRcdGhtbVVwZGF0ZUFscGhhV2luZG93LFxuXHRcdGhtbVVwZGF0ZVJlc3VsdHMsXG5cdFx0aGhtbUxpa2VsaWhvb2RBbHBoYX0gZnJvbSAnLi94bW0tZGVjb2Rlci1jb21tb24nO1xuXG4vLyBzaW1wbGlmaWVkIGRlY29kaW5nIGFsZ29yaXRobSA6XG4vL1xuLy8gaWYoIWZvcndhcmRfaW5pdClcbi8vIFx0XHRmb3J3YXJkX2luaXQob2JzKTtcbi8vIGVsc2Vcbi8vIFx0XHRmb3J3YXJkX3VwZGF0ZShvYnMpO1xuLy9cbi8vIGZvcihtb2RlbCBpbiBtb2RlbHMpXG4vLyBcdFx0bW9kZWwudXBkYXRlQWxwaGFXaW5kb3coKTtcbi8vIFx0XHRtb2RlbC51cGRhdGVSZXN1bHRzKCk7XG4vL1xuLy8gdXBkYXRlUmVzdWx0cygpO1xuXG4vLyBBIHV0aWxpc2VyIGRlIHhtbS1kZWNvZGVyLWNvbW1vbiA6XG4vLyAtIGdhdXNzaWFuQ29tcG9uZW50TGlrZWxpaG9vZFxuLy8gLSBnbW1MaWtlbGlob29kICh3aGljaCB1c2VzIGdhdXNzaWFuQ29tcG9uZW50TGlrZWxpaG9vZClcbi8vIC0gbm90IGdtbUxpa2VsaWhvb2RzLCBhcyBpdCdzIHRoZSBjbGFzc2lmeWluZyBwYXJ0IG9mIEdNTVxuXG4vLyBXaGljaCBkZWNvZGVyIHBhcmFtZXRlcnMgP1xuLy8gc2V0TGlrZWxpaG9vZFdpbmRvdyA/XG4vLyBvdGhlciBzbW9vdGhpbmcgd2luZG93cyA/XG4vLyBleGl0IHByb2JhYmlsaXRpZXMgP1xuLy8gLi4uXG5cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFhtbUhobW1EZWNvZGVyIGV4dGVuZHMgbGZvLmNvcmUuQmFzZUxmbyB7XG5cblx0Y29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG5cdFx0Y29uc3QgZGVmYXVsdHMgPSB7XG5cdFx0XHRsaWtlbGlob29kV2luZG93OiA1LFxuXHRcdH07XG5cdFx0c3VwZXIoZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG5cdFx0dGhpcy5tb2RlbCA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLm1vZGVsUmVzdWx0cyA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLmxpa2VsaWhvb2RXaW5kb3cgPSB0aGlzLnBhcmFtcy5saWtlbGlob29kV2luZG93O1xuXHR9XG5cblx0Z2V0IGxpa2VsaWVzdExhYmVsKCkge1xuXHRcdGlmKHRoaXMubW9kZWxSZXN1bHRzICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGlmKHRoaXMubW9kZWxSZXN1bHRzLmxpa2VsaWVzdCA+IC0xKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLm1vZGVsLm1vZGVsc1t0aGlzLm1vZGVsUmVzdWx0cy5saWtlbGllc3RdLmxhYmVsO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gJ3Vua25vd24nO1xuXHRcdC8vcmV0dXJuKCdubyBlc3RpbWF0aW9uIGF2YWlsYWJsZScpO1xuXHR9XG5cblxuXHQvLz09PT09PT09PT09PT09PT0gcHJvY2VzcyBmcmFtZSA9PT09PT09PT09PT09PT09PS8vXG5cblx0cHJvY2Vzcyh0aW1lLCBmcmFtZSwgbWV0YURhdGEpIHtcblxuXHRcdC8vaW5jb21pbmcgZnJhbWUgaXMgb2JzZXJ2YXRpb24gdmVjdG9yXG5cdFx0aWYodGhpcy5tb2RlbCA9PT0gdW5kZWZpbmVkIHx8IHRoaXMubW9kZWxSZXN1bHRzID09PSB1bmRlZmluZWQpIHtcblx0XHRcdC8vY29uc29sZS5sb2coXCJubyBtb2RlbCBsb2FkZWRcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cblx0XHR0aGlzLnRpbWUgPSB0aW1lO1xuXHRcdHRoaXMubWV0YURhdGEgPSBtZXRhRGF0YTtcblxuXHRcdGNvbnN0IG91dEZyYW1lID0gdGhpcy5vdXRGcmFtZTtcblxuXHRcdGlmKHRoaXMuZm9yd2FyZF9pbml0aWFsaXplZCkge1xuXHRcdFx0dGhpcy5mb3J3YXJkVXBkYXRlKGZyYW1lKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5mb3J3YXJkSW5pdChmcmFtZSk7XG5cdFx0fVxuXG5cdFx0Ly8gZm9yKGxldCBpPTA7IGk8dGhpcy5tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHMubGVuZ3RoOyBpKyspIHtcblx0XHQvLyBcdFx0Y29uc29sZS5sb2codGhpcy5tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFswXVswXSk7XG5cdFx0Ly8gfVxuXG5cdFx0Zm9yKGxldCBpPTA7IGk8dGhpcy5tb2RlbC5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGhtbVVwZGF0ZUFscGhhV2luZG93KHRoaXMubW9kZWwubW9kZWxzW2ldLCB0aGlzLm1vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXSk7XG5cdFx0XHRobW1VcGRhdGVSZXN1bHRzKHRoaXMubW9kZWwubW9kZWxzW2ldLCB0aGlzLm1vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXSk7XG5cdFx0fVxuXG5cdFx0Ly8gZm9yKGxldCBpPTA7IGk8dGhpcy5tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHMubGVuZ3RoOyBpKyspIHtcblx0XHQvLyBcdFx0Y29uc29sZS5sb2codGhpcy5tb2RlbFJlc3VsdHMuc2luZ2xlQ2xhc3NIbW1Nb2RlbFJlc3VsdHNbaV0uYWxwaGFfaFswXVswXSk7XG5cdFx0Ly8gfVxuXG5cdFx0dGhpcy51cGRhdGVSZXN1bHRzKCk7XG5cblx0XHQvLyBmb3IobGV0IGk9MDsgaTx0aGlzLm1vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0cy5sZW5ndGg7IGkrKykge1xuXHRcdC8vIFx0XHRjb25zb2xlLmxvZyh0aGlzLm1vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0c1tpXS5hbHBoYV9oWzBdWzBdKTtcblx0XHQvLyB9XG5cblx0XHRmb3IobGV0IGk9MDsgaTx0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXHRcdFx0b3V0RnJhbWVbaV0gPSB0aGlzLm1vZGVsUmVzdWx0cy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXHRcdH1cblxuXHRcdHRoaXMub3V0cHV0KCk7XG5cdH1cblx0XHRcblxuXHQvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG5cdC8vPT09PT09PT09PT09PT09PT09PT09PSBsb2FkIG1vZGVsIGZyb20ganNvbiA9PT09PT09PT09PT09PT09PT09PT09Ly9cblx0Ly89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0vL1xuXHRcblx0c2V0TW9kZWwobW9kZWwpIHtcdFx0XG5cblx0XHR0aGlzLm1vZGVsID0gdW5kZWZpbmVkO1xuXHRcdHRoaXMubW9kZWxSZXN1bHRzID0gdW5kZWZpbmVkO1xuXG5cdFx0Ly8gdGVzdCBpZiBtb2RlbCBpcyB2YWxpZCBoZXJlIChUT0RPIDogd3JpdGUgYSBiZXR0ZXIgdGVzdClcblx0XHRpZihtb2RlbC5tb2RlbHMgIT09IHVuZGVmaW5lZCkge1xuXG5cdFx0XHRjb25zb2xlLmxvZyhtb2RlbCk7XG5cblx0XHRcdHRoaXMubW9kZWwgPSBtb2RlbDtcblx0XHRcdGxldCBubW9kZWxzID0gbW9kZWwubW9kZWxzLmxlbmd0aDtcblxuXHRcdFx0bGV0IG5zdGF0ZXNHbG9iYWwgPSBtb2RlbC5jb25maWd1cmF0aW9uLmRlZmF1bHRfcGFyYW1ldGVycy5zdGF0ZXM7XG5cdFx0XHR0aGlzLnBhcmFtcy5mcmFtZVNpemUgPSBuc3RhdGVzR2xvYmFsO1xuXG5cdFx0XHQvLyB0aGlzLnByaW9yID0gbmV3IEFycmF5KG5tb2RlbHMpO1xuXHRcdFx0Ly8gdGhpcy5leGl0X3RyYW5zaXRpb24gPSBuZXcgQXJyYXkobm1vZGVscyk7XG5cdFx0XHQvLyB0aGlzLnRyYW5zaXRpb24gPSBuZXcgQXJyYXkobm1vZGVscyk7XG5cdFx0XHQvLyBmb3IobGV0IGk9MDsgaTxubW9kZWxzOyBpKyspIHtcblx0XHRcdC8vIFx0dGhpcy50cmFuc2l0aW9uW2ldID0gbmV3IEFycmF5KG5tb2RlbHMpO1xuXHRcdFx0Ly8gfVxuXHRcdFx0dGhpcy5mcm9udGllcl92MSA9IG5ldyBBcnJheShubW9kZWxzKTtcblx0XHRcdHRoaXMuZnJvbnRpZXJfdjIgPSBuZXcgQXJyYXkobm1vZGVscyk7XG5cdFx0XHR0aGlzLmZvcndhcmRfaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblx0XHRcdC8vdGhpcy5yZXN1bHRzID0ge307XG5cblx0XHRcdHRoaXMubW9kZWxSZXN1bHRzID0ge1xuXHRcdFx0XHRpbnN0YW50X2xpa2VsaWhvb2RzOiBuZXcgQXJyYXkobm1vZGVscyksXG5cdFx0XHRcdHNtb290aGVkX2xvZ19saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuXHRcdFx0XHRzbW9vdGhlZF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuXHRcdFx0XHRpbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHM6IG5ldyBBcnJheShubW9kZWxzKSxcblx0XHRcdFx0c21vb3RoZWRfbm9ybWFsaXplZF9saWtlbGlob29kczogbmV3IEFycmF5KG5tb2RlbHMpLFxuXHRcdFx0XHRsaWtlbGllc3Q6IC0xLFxuXHRcdFx0XHRzaW5nbGVDbGFzc0htbU1vZGVsUmVzdWx0czogW11cblx0XHRcdH07XG5cblx0XHRcdGZvcihsZXQgaT0wOyBpPG5tb2RlbHM7IGkrKykge1xuXG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLmluc3RhbnRfbGlrZWxpaG9vZHNbaV0gPSAwO1xuXHRcdFx0XHR0aGlzLm1vZGVsUmVzdWx0cy5zbW9vdGhlZF9sb2dfbGlrZWxpaG9vZHNbaV0gPSAwO1xuXHRcdFx0XHR0aGlzLm1vZGVsUmVzdWx0cy5zbW9vdGhlZF9saWtlbGlob29kc1tpXSA9IDA7XG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLmluc3RhbnRfbm9ybWFsaXplZF9saWtlbGlob29kc1tpXSA9IDA7XG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gPSAwO1xuXG5cdFx0XHRcdGxldCBuc3RhdGVzID0gdGhpcy5tb2RlbC5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7XG5cblx0XHRcdFx0bGV0IGFscGhhX2ggPSBuZXcgQXJyYXkoMyk7XG5cdFx0XHRcdGZvcihsZXQgaj0wOyBqPDM7IGorKykge1xuXHRcdFx0XHRcdGFscGhhX2hbal0gPSBuZXcgQXJyYXkobnN0YXRlcyk7XG5cdFx0XHRcdFx0Zm9yKGxldCBrPTA7IGs8bnN0YXRlczsgaysrKSB7XG5cdFx0XHRcdFx0XHRhbHBoYV9oW2pdW2tdID0gMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgaG1tUmVzID0ge1xuXHRcdFx0XHRcdGluc3RhbnRfbGlrZWxpaG9vZDogMCxcblx0XHRcdFx0XHRsb2dfbGlrZWxpaG9vZDogMCxcblx0XHRcdFx0XHRsaWtlbGlob29kX2J1ZmZlcjogW10sXG5cdFx0XHRcdFx0cHJvZ3Jlc3M6IDAsXG5cblx0XHRcdFx0XHQvLyBuZXZlciB1c2VkID8gLT4gY2hlY2sgeG1tIGNwcFxuXHRcdFx0XHRcdGV4aXRfbGlrZWxpaG9vZDogMCxcblx0XHRcdFx0XHRleGl0X3JhdGlvOiAwLFxuXG5cdFx0XHRcdFx0bGlrZWxpZXN0X3N0YXRlOiAtMSxcblxuXHRcdFx0XHRcdC8vYWxwaGE6IG5ldyBBcnJheShuc3RhdGVzKSwgXHQvLyBmb3Igbm9uLWhpZXJhcmNoaWNhbFxuXHRcdFx0XHRcdGFscGhhX2g6IGFscGhhX2gsXHRcdFx0XHQvLyBmb3IgaGllcmFyY2hpY2FsXG5cdFx0XHRcdFx0cHJpb3I6IG5ldyBBcnJheShuc3RhdGVzKSxcblx0XHRcdFx0XHR0cmFuc2l0aW9uOiBuZXcgQXJyYXkobnN0YXRlcyksXG5cblx0XHRcdFx0XHQvLyB1c2VkIGluIGhtbVVwZGF0ZUFscGhhV2luZG93XG5cdFx0XHRcdFx0d2luZG93X21pbmluZGV4OiAwLFxuXHRcdFx0XHRcdHdpbmRvd19tYXhpbmRleDogMCxcblx0XHRcdFx0XHR3aW5kb3dfbm9ybWFsaXphdGlvbl9jb25zdGFudDogMCxcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRzaW5nbGVDbGFzc0dtbU1vZGVsUmVzdWx0czogW11cdC8vIHN0YXRlc1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vIEFERCBJTkRJVklEVUFMIFNUQVRFUyAoR01Ncylcblx0XHRcdFx0Zm9yKGxldCBqPTA7IGo8bnN0YXRlczsgaisrKSB7XG5cdFx0XHRcdFx0bGV0IGdtbVJlcyA9IHtcblx0XHRcdFx0XHRcdGluc3RhbnRfbGlrZWxpaG9vZDogMCxcblx0XHRcdFx0XHRcdC8vIGxvZ19saWtlbGlob29kOiAwLFxuXHRcdFx0XHRcdFx0Ly8gVE9ETyA6IGFkZCBzYW1lIGZpZWxkcyBhcyBpbiBHbW1EZWNvZGVyID8/Pz9cblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0aG1tUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzLnB1c2goZ21tUmVzKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzLnB1c2goaG1tUmVzKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvL3RoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IHRoaXMubW9kZWwubW9kZWxzLmxlbmd0aDtcblx0XHR0aGlzLmluaXRpYWxpemUoeyBmcmFtZVNpemU6IHRoaXMubW9kZWwubW9kZWxzLmxlbmd0aCB9KTtcblx0XHQvL2NvbnNvbGUubG9nKHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSk7XG5cdFx0Ly9jb25zb2xlLmxvZyh0aGlzLm1vZGVsUmVzdWx0cyk7XG5cdH1cblxuXHQvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT0gUkVTRVQgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ly9cblxuXHRyZXNldCgpIHtcblx0XHR0aGlzLmZvcndhcmRfaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblx0fVxuXG5cdC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ly9cblx0Ly89PT09PT09PT09PT09PT09PT09PT09PT09IEZPUldBUkQgSU5JVCA9PT09PT09PT09PT09PT09PT09PT09PT09PT0vL1xuXHQvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG5cblx0Zm9yd2FyZEluaXQob2JzZXJ2YXRpb24pIHtcblx0XHRsZXQgbm9ybV9jb25zdCA9IDA7XG5cdFx0Ly9sZXQgbW9kZWxJbmRleCA9IDA7XG5cblx0XHQvLz09PT09PT09PT09PT09PT09IElOSVRJQUxJWkUgQUxQSEEgVkFSSUFCTEVTID09PT09PT09PT09PT09PT09Ly9cblxuXHRcdGZvcihsZXQgaT0wOyBpPHRoaXMubW9kZWwubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG5cblx0XHRcdGxldCBtID0gdGhpcy5tb2RlbC5tb2RlbHNbaV07XG5cdFx0XHRsZXQgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG5cdFx0XHRsZXQgbVJlcyA9IHRoaXMubW9kZWxSZXN1bHRzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldO1xuXG5cdFx0XHRmb3IobGV0IGo9MDsgajwzOyBqKyspIHtcblx0XHRcdFx0bVJlcy5hbHBoYV9oW2pdID0gbmV3IEFycmF5KG5zdGF0ZXMpO1xuXHRcdFx0XHRmb3IobGV0IGs9MDsgazxuc3RhdGVzOyBrKyspIHtcblx0XHRcdFx0XHRtUmVzLmFscGhhX2hbal1ba10gPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT0gMCkgeyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vIGVyZ29kaWNcblx0XHRcdFx0Zm9yKGxldCBrPTA7IGs8bnN0YXRlczsgaysrKSB7XG5cdFx0XHRcdFx0bVJlcy5hbHBoYV9oWzBdW2tdID0gbVJlcy5wcmlvcltrXSAqIGdtbUxpa2VsaWhvb2Qob2JzZXJ2YXRpb24sIG0uc3RhdGVzW2tdLCBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2tdKTsgLy8gc2VlIGhvdyBvYnNQcm9iIGlzIGltcGxlbWVudGVkXG5cdFx0XHRcdFx0bVJlcy5pbnN0YW50X2xpa2VsaWhvb2QgKz0gbVJlcy5hbHBoYVswXVtrXTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHsgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8gbGVmdC1yaWdodFxuXHRcdFx0XHRtUmVzLmFscGhhX2hbMF1bMF0gPSB0aGlzLm1vZGVsLnByaW9yW2ldO1xuXHRcdFx0XHRtUmVzLmFscGhhX2hbMF1bMF0gKj0gZ21tTGlrZWxpaG9vZChvYnNlcnZhdGlvbiwgbS5zdGF0ZXNbMF0sIG1SZXMuc2luZ2xlQ2xhc3NHbW1Nb2RlbFJlc3VsdHNbMF0pO1xuXHRcdFx0XHRtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCA9IG1SZXMuYWxwaGFfaFswXVswXTtcblx0XHRcdH1cblx0XHRcdG5vcm1fY29uc3QgKz0gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG5cdFx0fVxuXG5cdFx0Ly89PT09PT09PT09PT09PT09PT0gTk9STUFMSVpFIEFMUEhBIFZBUklBQkxFUyA9PT09PT09PT09PT09PT09PS8vXG5cblx0XHRmb3IobGV0IGk9MDsgaTx0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXG5cdFx0XHRsZXQgbnN0YXRlcyA9IHRoaXMubW9kZWwubW9kZWxzW2ldLnBhcmFtZXRlcnMuc3RhdGVzO1xuXHRcdFx0Zm9yKGxldCBlPTA7IGU8MzsgZSsrKSB7XG5cdFx0XHRcdGZvcihsZXQgaz0wOyBrPG5zdGF0ZXM7IGsrKykge1xuXHRcdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZV1ba10gLz0gbm9ybV9jb25zdDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuZm9yd2FyZF9pbml0aWFsaXplZCA9IHRydWU7XG5cdH1cblxuXHQvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG5cdC8vPT09PT09PT09PT09PT09PT09PT09PT09IEZPUldBUkQgVVBEQVRFID09PT09PT09PT09PT09PT09PT09PT09PT09Ly9cblx0Ly89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0vL1xuXG5cdGZvcndhcmRVcGRhdGUob2JzZXJ2YXRpb24pIHtcblx0XHRsZXQgbm9ybV9jb25zdCA9IDA7XG5cdFx0bGV0IHRtcCA9IDA7XG5cdFx0bGV0IGZyb250OyAvLyBhcnJheVxuXG5cdFx0bGV0IG5tb2RlbHMgPSB0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGg7XG5cdFxuXHRcdGhobW1MaWtlbGlob29kQWxwaGEoMSwgdGhpcy5mcm9udGllcl92MSwgdGhpcy5tb2RlbCwgdGhpcy5tb2RlbFJlc3VsdHMpO1xuXHRcdGhobW1MaWtlbGlob29kQWxwaGEoMiwgdGhpcy5mcm9udGllcl92MiwgdGhpcy5tb2RlbCwgdGhpcy5tb2RlbFJlc3VsdHMpO1xuXG5cdFx0Ly8gbGV0IG51bV9jbGFzc2VzID0gXG5cdFx0Ly8gbGV0IGRzdE1vZGVsSW5kZXggPSAwO1xuXG5cdFx0Zm9yKGxldCBpPTA7IGk8bm1vZGVsczsgaSsrKSB7XG5cblx0XHRcdGxldCBtID0gdGhpcy5tb2RlbC5tb2RlbHNbaV07XG5cdFx0XHRsZXQgbnN0YXRlcyA9IG0ucGFyYW1ldGVycy5zdGF0ZXM7XG5cdFx0XHRsZXQgbVJlcyA9IHRoaXMubW9kZWxSZXN1bHRzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldO1xuXHRcdFx0XG5cdFx0XHQvLz09PT09PT09PT09PT0gQ09NUFVURSBGUk9OVElFUiBWQVJJQUJMRSA9PT09PT09PT09PT0vL1xuXG5cdFx0XHRmcm9udCA9IG5ldyBBcnJheShuc3RhdGVzKTtcblx0XHRcdGZvcihsZXQgaj0wOyBqPG5zdGF0ZXM7IGorKykge1xuXHRcdFx0XHRmcm9udFtqXSA9IDA7XG5cdFx0XHR9XG5cblx0XHRcdGlmKG0ucGFyYW1ldGVycy50cmFuc2l0aW9uX21vZGUgPT0gMCkgeyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vIGVyZ29kaWNcblx0XHRcdFx0Zm9yKGxldCBrPTA7IGs8bnN0YXRlczsgaysrKSB7XG5cdFx0XHRcdFx0Zm9yKGxldCBqPTA7IGo8bnN0YXRlczsgaisrKSB7XG5cdFx0XHRcdFx0XHRmcm9udFtrXSArPSBtLnRyYW5zaXRpb25baiAqIG5zdGF0ZXMgKyBrXSAvXG5cdFx0XHRcdFx0XHRcdFx0XHQoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNbal0pICpcblx0XHRcdFx0XHRcdFx0XHRcdG1SZXMuYWxwaGFfaFswXVtqXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Zm9yKGxldCBzcmNpPTA7IHNyY2k8bm1vZGVsczsgc3JjaSsrKSB7XG5cdFx0XHRcdFx0XHRmcm9udFtrXSArPSBtUmVzLnByaW9yW2tdICpcblx0XHRcdFx0XHRcdFx0XHRcdChcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5mcm9udGllcl92MVtzcmNpXSAqIHRoaXMubW9kZWwudHJhbnNpdGlvbltzcmNpXVtpXSArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubW9kZWwucHJpb3JbaV0gKiB0aGlzLmZyb250aWVyX3YyW3NyY2ldXG5cdFx0XHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHsgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBsZWZ0LXJpZ2h0XG5cblx0XHRcdFx0Ly8gayA9PSAwIDogZmlyc3Qgc3RhdGUgb2YgdGhlIHByaW1pdGl2ZVxuXHRcdFx0XHRmcm9udFswXSA9IG0udHJhbnNpdGlvblswXSAqIG1SZXMuYWxwaGFfaFswXVswXTtcblxuXHRcdFx0XHRmb3IobGV0IHNyY2k9MDsgc3JjaTx0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGg7IHNyY2krKykge1xuXHRcdFx0XHRcdGZyb250WzBdICs9IHRoaXMuZnJvbnRpZXJfdjFbc3JjaV0gKiB0aGlzLm1vZGVsLnRyYW5zaXRpb25bc3JjaV1baV0gK1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMubW9kZWwucHJpb3JbaV0gKiB0aGlzLmZyb250aWVyX3YyW3NyY2ldO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gayA+IDAgOiByZXN0IG9mIHRoZSBwcmltaXRpdmVcblx0XHRcdFx0Zm9yKGxldCBrPTE7IGs8bnN0YXRlczsgaysrKSB7XG5cdFx0XHRcdFx0ZnJvbnRba10gKz0gbS50cmFuc2l0aW9uW2sgKiAyXSAvXG5cdFx0XHRcdFx0XHRcdFx0KDEgLSBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdKSAqXG5cdFx0XHRcdFx0XHRcdFx0bVJlcy5hbHBoYV9oWzBdW2tdO1xuXHRcdFx0XHRcdGZyb250W2tdICs9IG0udHJhbnNpdGlvblsoayAtIDEpICogMiArIDFdIC9cblx0XHRcdFx0XHRcdFx0XHQoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNbayAtIDFdKSAqXG5cdFx0XHRcdFx0XHRcdFx0bVJlcy5hbHBoYV9oWzBdW2sgLSAxXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvcihsZXQgaj0wOyBqPDM7IGorKykge1xuXHRcdFx0XHRcdGZvcihsZXQgaz0wOyBrPG5zdGF0ZXM7IGsrKykge1xuXHRcdFx0XHRcdFx0bVJlcy5hbHBoYV9oW2pdW2tdID0gMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly9jb25zb2xlLmxvZyhmcm9udCk7XG5cblx0XHRcdC8vPT09PT09PT09PT09PT0gVVBEQVRFIEZPUldBUkQgVkFSSUFCTEUgPT09PT09PT09PT09PS8vXG5cblx0XHRcdG1SZXMuZXhpdF9saWtlbGlob29kID0gMDtcblx0XHRcdG1SZXMuaW5zdGFudF9saWtlbGlob29kID0gMDtcblxuXHRcdFx0Zm9yKGxldCBrPTA7IGs8bnN0YXRlczsgaysrKSB7XG5cdFx0XHRcdHRtcCA9IGdtbUxpa2VsaWhvb2Qob2JzZXJ2YXRpb24sIG0uc3RhdGVzW2tdLCBtUmVzLnNpbmdsZUNsYXNzR21tTW9kZWxSZXN1bHRzW2tdKSAqIGZyb250W2tdO1xuXG5cdFx0XHRcdG1SZXMuYWxwaGFfaFsyXVtrXSA9IHRoaXMubW9kZWwuZXhpdF90cmFuc2l0aW9uW2ldICogbS5leGl0UHJvYmFiaWxpdGllc1trXSAqIHRtcDtcblx0XHRcdFx0bVJlcy5hbHBoYV9oWzFdW2tdID0gKDEgLSB0aGlzLm1vZGVsLmV4aXRfdHJhbnNpdGlvbltpXSkgKiBtLmV4aXRQcm9iYWJpbGl0aWVzW2tdICogdG1wO1xuXHRcdFx0XHRtUmVzLmFscGhhX2hbMF1ba10gPSAoMSAtIG0uZXhpdFByb2JhYmlsaXRpZXNba10pICogdG1wO1xuXG5cdFx0XHRcdG1SZXMuZXhpdF9saWtlbGlob29kIFx0Kz0gbVJlcy5hbHBoYV9oWzFdW2tdICsgbVJlcy5hbHBoYV9oWzJdW2tdO1xuXHRcdFx0XHRtUmVzLmluc3RhbnRfbGlrZWxpaG9vZCArPSBtUmVzLmFscGhhX2hbMF1ba10gKyBtUmVzLmFscGhhX2hbMV1ba10gKyBtUmVzLmFscGhhX2hbMl1ba107XG5cblx0XHRcdFx0bm9ybV9jb25zdCArPSB0bXA7XG5cdFx0XHR9XG5cblx0XHRcdG1SZXMuZXhpdF9yYXRpbyA9IG1SZXMuZXhpdF9saWtlbGlob29kIC8gbVJlcy5pbnN0YW50X2xpa2VsaWhvb2Q7XG5cdFx0fVxuXG5cdFx0Ly89PT09PT09PT09PT09PSBOT1JNQUxJWkUgQUxQSEEgVkFSSUFCTEVTID09PT09PT09PT09PT0vL1xuXG5cdFx0Zm9yKGxldCBpPTA7IGk8bm1vZGVsczsgaSsrKSB7XG5cdFx0XHRmb3IobGV0IGU9MDsgZTwzOyBlKyspIHtcblx0XHRcdFx0Zm9yKGxldCBrPTA7IGs8dGhpcy5tb2RlbC5tb2RlbHNbaV0ucGFyYW1ldGVycy5zdGF0ZXM7IGsrKykge1xuXHRcdFx0XHRcdHRoaXMubW9kZWxSZXN1bHRzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldLmFscGhhX2hbZV1ba10gLz0gbm9ybV9jb25zdDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8vPT09PT09PT09PT09PT09PT09PT09PSBVUERBVEUgUkVTVUxUUyA9PT09PT09PT09PT09PT09PT09PS8vXG5cblx0dXBkYXRlUmVzdWx0cygpIHtcblx0XHRsZXQgbWF4bG9nX2xpa2VsaWhvb2QgPSAwO1xuXHRcdGxldCBub3JtY29uc3RfaW5zdGFudCA9IDA7XG5cdFx0bGV0IG5vcm1jb25zdF9zbW9vdGhlZCA9IDA7XG5cblx0XHRsZXQgcmVzID0gdGhpcy5tb2RlbFJlc3VsdHM7XG5cblx0XHRmb3IobGV0IGk9MDsgaTx0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXG5cdFx0XHRsZXQgaG1tUmVzID0gcmVzLnNpbmdsZUNsYXNzSG1tTW9kZWxSZXN1bHRzW2ldO1xuXG5cdFx0XHRyZXMuaW5zdGFudF9saWtlbGlob29kc1tpXSBcdFx0PSBobW1SZXMuaW5zdGFudF9saWtlbGlob29kO1xuXHRcdFx0cmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA9IGhtbVJlcy5sb2dfbGlrZWxpaG9vZDtcblx0XHRcdHJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXSBcdD0gTWF0aC5leHAocmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSk7XG5cblx0XHRcdHJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gXHQ9IHJlcy5pbnN0YW50X2xpa2VsaWhvb2RzW2ldO1xuXHRcdFx0cmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gXHQ9IHJlcy5zbW9vdGhlZF9saWtlbGlob29kc1tpXTtcblxuXHRcdFx0bm9ybWNvbnN0X2luc3RhbnQgXHQrPSByZXMuaW5zdGFudF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldO1xuXHRcdFx0bm9ybWNvbnN0X3Ntb290aGVkIFx0Kz0gcmVzLnNtb290aGVkX25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV07XG5cblx0XHRcdGlmKGk9PTAgfHwgcmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXSA+IG1heGxvZ19saWtlbGlob29kKSB7XG5cdFx0XHRcdG1heGxvZ19saWtlbGlob29kID0gcmVzLnNtb290aGVkX2xvZ19saWtlbGlob29kc1tpXTtcblx0XHRcdFx0cmVzLmxpa2VsaWVzdCA9IGk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yKGxldCBpPTA7IGk8dGhpcy5tb2RlbC5tb2RlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHJlcy5pbnN0YW50X25vcm1hbGl6ZWRfbGlrZWxpaG9vZHNbaV0gXHQvPSBub3JtY29uc3RfaW5zdGFudDtcblx0XHRcdHJlcy5zbW9vdGhlZF9ub3JtYWxpemVkX2xpa2VsaWhvb2RzW2ldIFx0Lz0gbm9ybWNvbnN0X3Ntb290aGVkO1xuXHRcdH1cblx0fVxufVxuXG4vKlxuXHRzZXRMaWtlbGlob29kV2luZG93KG5ld1dpbmRvd1NpemUpIHtcblx0XHR0aGlzLmxpa2VsaWhvb2RXaW5kb3cgPSBuZXdXaW5kb3dTaXplO1xuXHRcdGlmKHRoaXMubW9kZWwgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXHRcdGxldCByZXMgPSB0aGlzLm1vZGVsUmVzdWx0cy5zaW5nbGVDbGFzc01vZGVsUmVzdWx0cztcblx0XHRmb3IobGV0IGk9MDsgaTx0aGlzLm1vZGVsLm1vZGVscy5sZW5ndGg7IGkrKykge1xuXHRcdFx0cmVzW2ldLmxpa2VsaWhvb2RfYnVmZmVyID0gW107XG5cdFx0XHRyZXNbaV0ubGlrZWxpaG9vZF9idWZmZXIubGVuZ3RoID0gdGhpcy5saWtlbGlob29kV2luZG93O1xuXHRcdFx0Zm9yKGxldCBqPTA7IGo8dGhpcy5saWtlbGlob29kV2luZG93OyBqKyspIHtcblx0XHRcdFx0cmVzLmxpa2VsaWhvb2RfYnVmZmVyW2pdID0gMSAvIHRoaXMubGlrZWxpaG9vZFdpbmRvdztcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRzZXRWYXJpYW5jZU9mZnNldCgpIHtcblx0XHQvLyBub3QgdXNlZCBmb3Igbm93IChuZWVkIHRvIGltcGxlbWVudCB1cGRhdGVJbnZlcnNlQ292YXJpYW5jZSBtZXRob2QpLlxuXHRcdC8vIG5vdyBhY2Nlc3NpYmxlIGFzIHRyYWluaW5nIHBhcmFtZXRlciBvZiB0aGUgY2hpbGQgcHJvY2Vzcy5cblx0fVxuXG4vLyovXG4iXX0=