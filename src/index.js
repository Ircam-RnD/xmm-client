/**
 * This library is developed by the ISMM (http://ismm.ircam.fr/) team at IRCAM,
 * within the context of the RAPID-MIX (http://rapidmix.goldsmithsdigital.com/)
 * project, funded by the European Union’s Horizon 2020 research and innovation programme.  
 * Original XMM code authored by Jules Françoise, ported to JavaScript by Joseph Larralde.  
 * See https://github.com/Ircam-RnD/xmm for detailed XMM credits.
 */

const isNode = new Function("try {return this===global;}catch(e){return false;}");

import { XMLHttpRequest as XHR } from 'xmlhttprequest';

export { default as GmmDecoder } from './gmm/gmm-decoder';
export { default as HhmmDecoder } from './hhmm/hhmm-decoder';
export { default as PhraseMaker } from './set/xmm-phrase';
export { default as SetMaker } from './set/xmm-set';

/**
 * @typedef xmmTrainingData
 */

/**
 * @typedef xmmModelConfig
 */

/**
 * Sends a post request to https://como.ircam.fr/api/v1/train
 * @param {xmmTrainingData} data - must contain thress fields : configuration, modelType and dataset.
 * The dataset should have been created with PhraseMaker and Setmaker classes.
 */
const train = (data, callback) => {
  const url = data['url'] ? data['url'] : 'https://como.ircam.fr/api/v1/train';
  const xhr = isNode() ? new XHR() : new XMLHttpRequest();

  xhr.open('post', url, true);
  xhr.responseType = 'json';
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.setRequestHeader('Content-Type', 'application/json');

  if (isNode()) { // XMLHttpRequest module only supports xhr v1
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        callback(xhr.status, xhr.responseText);
      }
    }
  } else { // use xhr v2
    xhr.onload = function() {
      callback(xhr.status, xhr.response);
    }
    xhr.onerror = function() {
      callback(xhr.status, xhr.response);
    }
  }

  xhr.send(JSON.stringify(data));
};

export { train };