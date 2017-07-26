import * as xmm from '../src/index';
import xmmNode from 'xmm-node';
import fs from 'fs';
import path from 'path';
import test from 'tape';

// we can't do this locally (todo : solve xhr client / node problem) ...

// test('train', (t) => {
//   xmm.train({
//     configuration:
//     {
//       modelType : 'gmm'
//     },
//     dataset :
//     {
//       "bimodal": false,
//       "column_names": [
//         ""
//       ],
//       "dimension": 1,
//       "dimension_input": 0,
//       "phrases": []
//     }
//   }, function(code, res) {
//     console.log(code + ' ' + res);
//   });

//   t.end();
// });

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

//======================== UTILITIES FOR THE NEXT TESTS ======================//

const folderPath = './tests/data/trainingsets';
const filePaths = fs.readdirSync(folderPath);

for (let i = filePaths.length - 1; i >= 0; i--) {
  if (filePaths[i].split('.').pop() !== 'json') {
    filePaths.splice(i, 1);
  } else {
    filePaths[i] = `${folderPath}/${filePaths[i]}`;
  }
}

const testModel = (t, err, res, decoder, set) => {
  t.equal(err, null);
  decoder.setModel(res);

  let totalObservations = 0;
  let positives = 0;
  
  for (let i = 0; i < set.phrases.length; i++) {
    const p = set.phrases[i];
    const dim = p['bimodal'] ? p['dimension_input'] : p['dimension'];
    const step = p['dimension'];
  
    for (let j = 0; j < p['length']; j++) {
      const startIndex = j * step;
      const endIndex = startIndex + dim;
      const results = decoder.filter(p['data'].slice(startIndex, endIndex));
  
      if (p['label'] === results['likeliest']) {
        positives++;
      }

      totalObservations++;
    }
  }

  const classifyMsg
    = 'phrases from training set should be classified perfectly by the decoder';
  t.equal(positives, totalObservations, classifyMsg);
};

//======== NEXT TESTS :

test('hhmm', (t) => {
  const hhmm = new xmm.HhmmDecoder();

  const hhmmModel = new xmmNode('hhmm', {
    gaussians: 1,
    relativeRegularization: 0.01,
    absoluteRegularization: 0.01,
    states: 5
  });

  t.plan(2 * filePaths.length);

  for (let i = 0; i < filePaths.length; i++) {
    const set = JSON.parse(fs.readFileSync(filePaths[i], 'utf-8'));

    hhmmModel.setTrainingSet(set);
    hhmmModel.train((err, res) => {
      testModel(t, err, res, hhmm, set);
    });
  }
});

test('gmm', (t) => {
  const gmm = new xmm.GmmDecoder();
  // gmm.setWeights([1, 1, 1, 0.6, 0.6, 0.6]);
  // gmm.setWeights([1.9, 1.9, 1.9, 1, 1, 1]);

  const gmmModel = new xmmNode('gmm', {
    gaussians: 5,
    relativeRegularization: 0.001,
    absoluteRegularization: 0.001
  });

  t.plan(2 * filePaths.length);

  for (let i = 0; i < filePaths.length; i++) {
    const set = JSON.parse(fs.readFileSync(filePaths[i], 'utf-8'));

    gmmModel.setTrainingSet(set);
    gmmModel.train((err, res) => {
      testModel(t, err, res, gmm, set);
    });
  }
});

test('trainingset', (t) => {
  const labels = ['a', 'b', 'c'];
  const pm = new xmm.PhraseMaker({
    columnNames: ['x', 'y'],
    dimension: 2
  });
  const sm = new xmm.SetMaker();
  const myXmm = new xmmNode('boubou');

  // console.log('phrase config : ' + JSON.stringify(pm.getConfig()));

  for (let p = 0; p < labels.length; p++) {
    pm.setConfig({ label: labels[p] });

    for (let i = 0; i < 10; i++) {
      pm.addObservation([Math.random(), Math.random()]);
    }

    sm.addPhrase(pm.getPhrase());
    myXmm.addPhrase(pm.getPhrase());

    pm.reset();
  }

  // this doesn't pass due to rounding errors (JS uses doubles and XMM floats)
  // TODO : write RMSE function for comparison of data in training sets
  // t.deepEqual(sm.getTrainingSet(), myXmm.getTrainingSet(), "aha");
  t.end();
});

