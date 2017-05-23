import * as xmm from '../src/index';
import xmmNode from 'xmm-node';
import fs from 'fs';
import path from 'path';
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

/**
 * Utility returning all the names of the folders located in a specific folder.
 * @private
 */
const folderList = (prefix, subfolder = null) => {
  let path = prefix;
  if (subfolder) path += `/${subfolder}`;
  const tmpFolders = fs.readdirSync(path);
  const folders = [];
  for (let i = 0; i < tmpFolders.length; i++) {
    // this skips .DS_Store and (hopefully, to be tested on windows) Thumbs.db files
    if (fs.statSync(`${prefix}/${tmpFolders[i]}`).isDirectory()) {
      folders.push(tmpFolders[i]);
    }
  }
  return folders;
}

// test('gmm', (t) => {
//   const prefix = './tests/data/hhmm';
//   const folders = folderList(prefix);

//   const gmm = new xmm.GmmDecoder();

//   for (let i = 0; i < folders.length; i++) {
//     const path = `${prefix}/${folders[i]}`;
//     const set = JSON.parse(fs.readFileSync(`${path}/trainingset.json`, 'utf-8'));

//     gmm.train(set, (err, res) => {
//       console.log(model);
//     });
//   }

//   t.end();
// });

// test('hhmm', (t) => {
//   const modelPrefix = './tests/data/models/hhmm';
//   const trainingSetPrefix = './tests/data/trainingsets';
//   const modelFolders = folderList(modelPrefix);
//   const trainingSetFolders = folderList(trainingSetPrefix);

//   const hhmm = new xmm.HhmmDecoder();

//   // every subfolder should contain a "model.json" and a "trainingset.json"
//   // files created by the xmm library
//   for (let i = 0; i < modelFolders.length; i++) {
//     const modelPath = `${modelPrefix}/${modelFolders[i]}`;
//     const trainingSetPath = `${trainingSetPrefix}/${trainingSetFolders[i]}`;
//     const model = JSON.parse(fs.readFileSync(`${modelPath}/model.json`, 'utf-8'));
//     const set = JSON.parse(fs.readFileSync(`${trainingSetPath}/trainingset.json`, 'utf-8'));

//     hhmm.setModel(model);

//     let totalObservations = 0;
//     let positives = 0;
    
//     for (let i = 0; i < set.phrases.length; i++) {
//       const p = set.phrases[i];
//       const dim = p['dimension'] - p['dimension_input'];
//       const step = p['dimension'];
    
//       for (let j = 0; j < p['length']; j++) {
//         const results = hhmm.filter(p['data'].slice(j * step, dim));
//         // console.log(results);
    
//         if (p['label'] === results['likeliest']) {
//           positives++;
//         }
    
//         totalObservations++;
//       }
//     }

//     const classifyMsg = 'phrases from training set should be classified perfectly by hmm';
//     t.equal(totalObservations, positives, classifyMsg);
//   }
//   t.end();
// });

test('hhmm', (t) => {
  //const modelPrefix = './tests/data/models/gmm';
  const trainingSetPrefix = './tests/data/trainingsets';
  const trainingSetFolders = folderList(trainingSetPrefix);

  const hhmm = new xmm.HhmmDecoder();

  const hhmmModel = new xmmNode('hhmm', {
    gaussians: 1,
    relativeRegularization: 0.01,
    absoluteRegularization: 0.01,
    states: 5
  });

  t.plan(2 * trainingSetFolders.length);

  for (let i = 0; i < trainingSetFolders.length; i++) {
    const path = `${trainingSetPrefix}/${trainingSetFolders[i]}`;
    const set = JSON.parse(fs.readFileSync(`${path}/trainingset.json`, 'utf-8'));

    hhmmModel.setTrainingSet(set);
    hhmmModel.train((err, res) => {
      testHhmmModel(err, res);
    });

    const testHhmmModel = (err, res) => {
      t.equal(err, null);
      hhmm.setModel(res);

      let totalObservations = 0;
      let positives = 0;
      
      for (let i = 0; i < set.phrases.length; i++) {
        const p = set.phrases[i];
        const dim = p['dimension'] - p['dimension_input'];
        const step = p['dimension'];
      
        for (let j = 0; j < p['length']; j++) {
          const startIndex = j * step;
          const endIndex = startIndex + dim;
          const results = hhmm.filter(p['data'].slice(startIndex, endIndex));
          //console.log(results);
      
          if (p['label'] === results['likeliest']) {
            positives++;
          }

          // for (let i = 0; i < results['likelihoods'].length; i++) {
          //   if (isNaN(results['likelihoods'][i]))
          //     console.log(results['likelihoods'][i]);
          //   t.ok(!isNaN(results['likelihoods'][i]), 'likelihoods should be regular numbers');
          // }
      
          totalObservations++;
        }
      }

      const classifyMsg = 'phrases from training set should be classified perfectly by hmm';
      t.equal(totalObservations, positives, classifyMsg);
    };    
  }
});

test('gmm', (t) => {
  const trainingSetPrefix = './tests/data/trainingsets';
  const trainingSetFolders = folderList(trainingSetPrefix);

  const gmm = new xmm.GmmDecoder();

  const gmmModel = new xmmNode('gmm', {
    gaussians: 5,
    relativeRegularization: 0.001,
    absoluteRegularization: 0.001
  });

  t.plan(2 * trainingSetFolders.length);

  for (let i = 0; i < trainingSetFolders.length; i++) {
    const path = `${trainingSetPrefix}/${trainingSetFolders[i]}`;
    const set = JSON.parse(fs.readFileSync(`${path}/trainingset.json`, 'utf-8'));

    gmmModel.setTrainingSet(set);
    gmmModel.train((err, res) => {
      testGmmModel(err, res);
    });

    const testGmmModel = (err, res) => {
      t.equal(err, null);
      gmm.setModel(res);

      let totalObservations = 0;
      let positives = 0;
      
      for (let i = 0; i < set.phrases.length; i++) {
        const p = set.phrases[i];
        const dim = p['dimension'] - p['dimension_input'];
        const step = p['dimension'];
      
        for (let j = 0; j < p['length']; j++) {
          const startIndex = j * step;
          const endIndex = startIndex + dim;
          const results = gmm.filter(p['data'].slice(startIndex, endIndex));
          //console.log(results);
      
          if (p['label'] === results['likeliest']) {
            positives++;
          }
      
          totalObservations++;
        }
      }

      const classifyMsg = 'phrases from training set should be classified perfectly by gmm';
      t.equal(totalObservations, positives, classifyMsg);
    };    
  }
  //t.end();
});

test('trainingset', (t) => {
  const labels = ['a', 'b', 'c'];
  const pm = new xmm.PhraseMaker({
    columnNames: ['a'],
    dimension: 2
  });
  const sm = new xmm.SetMaker();

  console.log('phrase config : ' + JSON.stringify(pm.getConfig()));

  for (let p = 0; p < labels.length; p++) {
    pm.setConfig({ label: labels[p] });
    for (let i = 0; i < 10; i++) {
      pm.addObservation([Math.random(), Math.random()]);
    }
    sm.addPhrase(pm.getPhrase());
    // pm.setConfig({ label: "z"});
    // pm.setConfig({dimension: 2});
  }
  // console.log(JSON.parse(JSON.stringify(sm.getTrainingSet())));
  // console.log(JSON.stringify(sm.getPhrasesOfLabel("z")));
  t.end();
});

