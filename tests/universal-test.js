import * as xmm from '../src/index';
import test from 'tape';

// WARNING :
// THIS TEST PASSES DUE TO MODEL TRAINING CONFIG, BUT THIS IS RARELY THE CASE

test('universal', (t) => {
  t.plan(2);

  const pm = new xmm.PhraseMaker({ label: 'a' });
  const sm = new xmm.SetMaker();

  for (let i = 0; i < 10; i++) {
    pm.addObservation([i]);
  }
  sm.addPhrase(pm.getPhrase());

  xmm.train({
    configuration: {
      modelType: 'gmm',
      gaussians: 2,
    },
    dataset: sm.getTrainingSet(),
  }, (code, res) => {
    // console.log(res);
    res = JSON.parse(res);
    t.equal(code, 200, '"train" API end point should return a 200 status code');
    t.notEqual(res.data.models.length, 0, 'train should return a train model');
  });

  // t.end();
});