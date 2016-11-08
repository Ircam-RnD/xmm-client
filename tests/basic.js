//import { HhmmDecoder, GmmDecoder, PhraseMaker } from '../src/index';
import * as xmm from '../src/index';
import test from 'tape';

test('basic', (t) => {
	const pm = new xmm.PhraseMaker();
	const hhmm = new xmm.HhmmDecoder();
	const gmm = new xmm.GmmDecoder();

	const phraseConfig = pm.config;
	pm.config = phraseConfig;
	const pmConfigMsg = 'PhraseMaker configuration should not change when replaced by itself';
	t.deepEqual(pm.config, phraseConfig, pmConfigMsg);

	const hhmmConfig = hhmm.config;
	hhmm.config = hhmmConfig;
	const hhmmConfigMsg = 'HhmmDecoder configuration should not change when replaced by itself'
	t.deepEqual(hhmm.config, hhmmConfig, hhmmConfigMsg);

	const gmmConfig = gmm.config;
	gmm.config = gmmConfig;
	const gmmConfigMsg = 'GmmDecoder configuration should not change when replaced by itself'
	t.deepEqual(gmm.config, gmmConfig, gmmConfigMsg);

	t.end();
});

// test('trainingset', (t) => {
// 	const pm = new xmm.PhraseMaker({
// 		columnNames: ['a'],
// 		label: 'someLabel'
// 	});
// 	const sm = new xmm.SetMaker();

// 	// console.log('phrase config : ' + JSON.stringify(pm.config));
// 	for (let p = 0; p < 3; p++) {
// 		for (let i = 0; i < 10; i++) {
// 			pm.addObservation([Math.random()]);
// 		}
// 		sm.addPhrase(pm.getPhrase());
// 		pm.setConfig({ label: "z"});
// 		// pm.setConfig({dimension: 2});
// 	}
// 	// console.log(JSON.stringify(sm.getTrainingSet()));
// 	// console.log(JSON.stringify(sm.getPhrasesOfLabel("z")));
// 	t.end();
// });

// find a way to load json files (models)
