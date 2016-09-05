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

	// pm.config = {
	// 	bimodal: false,
	// 	dimension: 6
	// };

	t.end();
});

// find a way to load json files (models)
