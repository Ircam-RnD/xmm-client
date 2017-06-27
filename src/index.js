/**
 * This library is developed by the ISMM (http://ismm.ircam.fr/) team at IRCAM,
 * within the context of the RAPID-MIX (http://rapidmix.goldsmithsdigital.com/)
 * project, funded by the European Union’s Horizon 2020 research and innovation programme.  
 * Original XMM code authored by Jules Françoise, ported to JavaScript by Joseph Larralde.  
 * See https://github.com/Ircam-RnD/xmm for detailed XMM credits.
 */

// import { XMLHttpRequest } from 'xmlhttprequest';

export { default as GmmDecoder } from './gmm/gmm-decoder';
export { default as HhmmDecoder } from './hhmm/hhmm-decoder';
export { default as PhraseMaker } from './set/xmm-phrase';
export { default as SetMaker } from './set/xmm-set';

const train = (data, callback) => {
  const url = 'https://como.ircam.fr/api/v1/train';
  const xhr = new XMLHttpRequest();
  xhr.open('post', url, true);
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      callback(xhr.status, xhr.responseText);
    }
  };
  xhr.send(JSON.stringify(data));
};

export { train };