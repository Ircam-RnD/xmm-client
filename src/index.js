/*
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
 * Callback returning a trained model.
 * @callback

/**
 * Send a POST request to CoMo RESTful API and receive a trained model.
 * @param {Object} trainingData - Data needed by the API to train the model.
 * @param {String} [trainingData.url=https://como.ircam.fr/api/v1/train] - The API's url.
 * @param {Object} trainingData.configuration - The training configuration parameters.
 * @param {Object} trainingData.trainingSet - The examples used to train the model.
 * @param {}
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
