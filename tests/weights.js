import * as xmm from '../src/index';
import xmmNode from 'xmm-node';
import fs from 'fs';
import test from 'tape';

// WARNING :
// THIS TEST PASSES DUE TO MODEL TRAINING CONFIG, BUT THIS IS RARELY THE CASE

test('weights', (t) => {
  const setAccelGyro = JSON.parse(
    fs.readFileSync('./tests/data/trainingsets/3gestures-unimodal-dim6.json')
  );

  const setAccel = JSON.parse(JSON.stringify(setAccelGyro));

  // remove all data from dim 4 to dim 6 in set copy
  setAccel.dimension = 3;
  setAccel.column_names.splice(3, 3);

  for (let p of setAccel.phrases) {
    p.dimension = 3;
    p.column_names.splice(3, 3);

    const d = p.data;

    for (let i = 0; i < p.length; i++) {
      p.data.splice(3 + i * 3, 3);
    }
  }

  const myXmm = new xmmNode('hhmm', {
    gaussians: 5,
    relativeRegularization: 0.01,
    absoluteRegularization: 0.001,
    states: 12    
  });

  myXmm.setTrainingSet(setAccelGyro);
  const pAccelGyro = new Promise((resolve, reject) => {
    myXmm.train((err, res) => {
      if (!err) {
        resolve(res);
      } else {
        reject(err);
      }
    });
  });

  myXmm.setTrainingSet(setAccel);
  const pAccel = new Promise((resolve, reject) => {
    myXmm.train((err, res) => {
      if (!err) {
        resolve(res);
      } else {
        reject(err);
      }
    });
  });

  const gmmAccelGyro = new xmm.HhmmDecoder();
  gmmAccelGyro.setWeights([1, 1, 1, 0, 0, 0]);
  const gmmAccel = new xmm.HhmmDecoder();

  Promise.all([pAccelGyro, pAccel]).then(values => {
    gmmAccelGyro.setModel(values[0]);
    gmmAccel.setModel(values[1]);
    compare();
  });

  const compare = () => {
    let diffCnt = 0;
    let total = 0;

    for (let i = 0; i < setAccelGyro.phrases.length; i++) {
      const p1 = setAccelGyro.phrases[i];
      const p2 = setAccel.phrases[i];

      for (let j = 0; j < p1.length; j++) {
        const res1 = gmmAccelGyro.filter(p1.data.slice(j * 6, (j + 1) * 6));
        const res2 = gmmAccel.filter(p2.data.slice(j * 3, (j + 1) * 3));
        // console.log('dim 6 results :');
        // console.log(JSON.stringify(res6, null, 2));
        // console.log('dim 3 results :');
        // console.log(JSON.stringify(res3, null, 2));

        if (res1.likeliest !== res2.likeliest) {
          diffCnt++;
        }

        total++;
      }
    }
    console.log('total : ' + total);

    t.equal(diffCnt, 0, "all likeliests should be the same")
  };

  t.end();
});