import * as xmm from '../src/index';
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

test('hhmm', (t) => {
  const prefix = './tests/data/hhmm';
  const folders = folderList(prefix);

  const hhmm = new xmm.HhmmDecoder();

  // every subfolder should contain a "model.json" and a "trainingset.json"
  // files created by the xmm library
  for (let i = 0; i < folders.length; i++) {
    const path = `${prefix}/${folders[i]}`;
    const set = JSON.parse(fs.readFileSync(`${path}/trainingset.json`, 'utf-8'));
    const model = JSON.parse(fs.readFileSync(`${path}/model.json`, 'utf-8'));

    hhmm.setModel(model);

    let totalObservations = 0;
    let positives = 0;
    
    for (let i = 0; i < set.phrases.length; i++) {
      const p = set.phrases[i];
      const dim = p['dimension'] - p['dimension_input'];
      const step = p['dimension'];
    
      for (let j = 0; j < p['length']; j++) {
        const results = hhmm.filter(p['data'].slice(j * step, dim));
        // console.log(results);
    
        if (p['label'] === results['likeliest']) {
          positives++;
        }
    
        totalObservations++;
      }
    }

    const classifyMsg = 'phrases from training set should be classified perfectly';
    t.equal(totalObservations, positives, classifyMsg);
  }
  t.end();
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

