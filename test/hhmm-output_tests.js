import * as xmm from '../src/index';
import xmmNode from 'xmm-node';
import fs from 'fs';
import test from 'tape';
import { diff as deepDiff } from 'deep-diff';
import filePaths from './utils/trainingset-files';

const testModel = (t, err, res, decoder, set) => {
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

      const prog = results.timeProgressions;
      let cnt = 0;

      for (let k = 0; k < prog.length; k++) {
        if (prog[k] === 0) {
          cnt++;
        }
      }

      if (cnt === prog.length) {
        positives++;
      }

      totalObservations++;
    }
  }

  const classifyMsg
    = 'time progressions on 1 state models are always 0';
  t.equal(positives, totalObservations, classifyMsg);
};

test('testing hhmm output data', (t) => {
  const hhmm = new xmm.HhmmDecoder();

  const hhmmModel = new xmmNode('hhmm', {
    gaussians: 1,
    relativeRegularization: 0.01,
    absoluteRegularization: 0.01,
    states: 1
  });

  t.plan(filePaths.length);

  for (let i = 0; i < filePaths.length; i++) {
    const set = JSON.parse(fs.readFileSync(filePaths[i], 'utf-8'));

    hhmmModel.setTrainingSet(set);
    hhmmModel.train((err, res) => {
      testModel(t, err, res, hhmm, set);
    });
  }
});