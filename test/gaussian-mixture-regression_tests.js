import * as xmm from '../src/index';
import xmmNode from 'xmm-node';
import fs from 'fs';
import test from 'tape';
import filePaths from './utils/trainingset-files';

test('basic use of GMRs', (t) => {

  const phraseMaker = new xmm.PhraseMaker({
    bimodal: true,
    dimension: 7,
    dimensionInput: 3
  });

  const setMaker = new xmm.SetMaker();

  phraseMaker.reset();
  phraseMaker.setConfig({ label: 'a' });
  for (let i = 0; i < 10; i++) {
    phraseMaker.addObservation([1, 2, 3, 0, 0, 0, 0]);
  }
  setMaker.addPhrase(phraseMaker.getPhrase());

  phraseMaker.reset();
  phraseMaker.setConfig({ label: 'b' });
  for (let i = 0; i < 10; i++) {
    phraseMaker.addObservation([3, 2, 1, 10, 10, 10, 10]);
  }

  setMaker.addPhrase(phraseMaker.getPhrase());

  // console.log(phraseMaker.getPhrase());
  // console.log(setMaker.getTrainingSet());

  const gmmNative = new xmmNode('gmm');
  gmmNative.setConfig({
    absoluteRegularization: 1,
    relativeRegularization: 0.01,
  });
  const gmm = new xmm.GmmDecoder();

  gmmNative.setTrainingSet(setMaker.getTrainingSet());
  gmmNative.train((err, res) => {
    // console.log(err, JSON.stringify(res, null));
    gmm.setModel(res);
    const nativeRes = gmmNative.filter([3, 2, 1]);
    const clientRes = gmm.filter([3, 2, 1]);

    console.log(nativeRes);
    console.log(clientRes);

    t.deepEqual(clientRes.outputValues, [10, 10, 10, 10], 'gmm regression should work');
    t.end();
  });
});