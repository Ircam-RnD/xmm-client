import * as xmm from '../src/index';
import xmmNode from 'xmm-node';
import fs from 'fs';
import test from 'tape';
import filePaths from './utils/trainingset-files';

// for RMSE computation
const epsilon = 10e-9;

const compare = (t, err, res, clientDecoder, nativeDecoder, set) => {
  clientDecoder.setModel(res);

  let totalObservations = 0;
  let positives = 0;
  let sum = 0;
  
  for (let i = 0; i < set.phrases.length; i++) {
    const p = set.phrases[i];
    const dim = p['bimodal'] ? p['dimension_input'] : p['dimension'];
    const step = p['dimension'];
  
    for (let j = 0; j < p['length']; j++) {
      const startIndex = j * step;
      const endIndex = startIndex + dim;
      const clientResults = clientDecoder.filter(p['data'].slice(startIndex, endIndex));
      const nativeResults = nativeDecoder.filter(p['data'].slice(startIndex, endIndex));
  
      let ok = true;
      let diff = 0;

      for (let k = 0; k < clientResults.likelihoods.length; k++) {
        diff = clientResults.likelihoods[k] -
               nativeResults.smoothed_normalized_likelihoods[k];
        sum += diff * diff;
        totalObservations++;
      }
    }
  }

  const rmse = Math.sqrt(sum / totalObservations);
  // console.log('RMSE : ' + rmse);

  t.equal(rmse < epsilon, true, 'compared likelihoods should have a low RMSE');
};



test('node vs client gmm filtering', (t) => {
  t.plan(filePaths.length);

  const gmmModel = new xmmNode('gmm');
  const gmm = new xmm.GmmDecoder();

  for (let i = 0; i < filePaths.length; i++) {
    const set = JSON.parse(fs.readFileSync(filePaths[i], 'utf-8'));

    gmmModel.setTrainingSet(set);
    gmmModel.train((err, res) => {
      compare(t, err, res, gmm, gmmModel, set);
    });
  }
});

test('node vs client hhmm filtering', (t) => {
  t.plan(filePaths.length);

  const hhmmModel = new xmmNode('hhmm');
  const hhmm = new xmm.HhmmDecoder();

  for (let i = 0; i < filePaths.length; i++) {
    const set = JSON.parse(fs.readFileSync(filePaths[i], 'utf-8'));

    hhmmModel.setTrainingSet(set);
    hhmmModel.train((err, res) => {
      compare(t, err, res, hhmm, hhmmModel, set);
    });
  }
});