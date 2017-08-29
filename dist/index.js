'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.train = exports.SetMaker = exports.PhraseMaker = exports.HhmmDecoder = exports.GmmDecoder = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _gmmDecoder = require('./gmm/gmm-decoder');

Object.defineProperty(exports, 'GmmDecoder', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_gmmDecoder).default;
  }
});

var _hhmmDecoder = require('./hhmm/hhmm-decoder');

Object.defineProperty(exports, 'HhmmDecoder', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hhmmDecoder).default;
  }
});

var _xmmPhrase = require('./set/xmm-phrase');

Object.defineProperty(exports, 'PhraseMaker', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_xmmPhrase).default;
  }
});

var _xmmSet = require('./set/xmm-set');

Object.defineProperty(exports, 'SetMaker', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_xmmSet).default;
  }
});

var _xmlhttprequest = require('xmlhttprequest');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This library is developed by the ISMM (http://ismm.ircam.fr/) team at IRCAM,
 * within the context of the RAPID-MIX (http://rapidmix.goldsmithsdigital.com/)
 * project, funded by the European Union’s Horizon 2020 research and innovation programme.  
 * Original XMM code authored by Jules Françoise, ported to JavaScript by Joseph Larralde.  
 * See https://github.com/Ircam-RnD/xmm for detailed XMM credits.
 */

var isNode = new Function("try {return this===global;}catch(e){return false;}");

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
var train = function train(data, callback) {
  var url = data['url'] ? data['url'] : 'https://como.ircam.fr/api/v1/train';
  var xhr = isNode() ? new _xmlhttprequest.XMLHttpRequest() : new XMLHttpRequest();

  xhr.open('post', url, true);
  xhr.responseType = 'json';
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.setRequestHeader('Content-Type', 'application/json');

  if (isNode()) {
    // XMLHttpRequest module only supports xhr v1
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        callback(xhr.status, xhr.responseText);
      }
    };
  } else {
    // use xhr v2
    xhr.onload = function () {
      callback(xhr.status, xhr.response);
    };
    xhr.onerror = function () {
      callback(xhr.status, xhr.response);
    };
  }

  xhr.send((0, _stringify2.default)(data));
};

exports.train = train;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbImRlZmF1bHQiLCJpc05vZGUiLCJGdW5jdGlvbiIsInRyYWluIiwiZGF0YSIsImNhbGxiYWNrIiwidXJsIiwieGhyIiwiWE1MSHR0cFJlcXVlc3QiLCJvcGVuIiwicmVzcG9uc2VUeXBlIiwic2V0UmVxdWVzdEhlYWRlciIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsInJlYWR5U3RhdGUiLCJzdGF0dXMiLCJyZXNwb25zZVRleHQiLCJvbmxvYWQiLCJyZXNwb25zZSIsIm9uZXJyb3IiLCJzZW5kIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OytDQVlTQSxPOzs7Ozs7Ozs7Z0RBQ0FBLE87Ozs7Ozs7Ozs4Q0FDQUEsTzs7Ozs7Ozs7OzJDQUNBQSxPOzs7O0FBTFQ7Ozs7QUFWQTs7Ozs7Ozs7QUFRQSxJQUFNQyxTQUFTLElBQUlDLFFBQUosQ0FBYSxvREFBYixDQUFmOztBQVNBOzs7O0FBSUE7Ozs7QUFJQTs7Ozs7QUFLQSxJQUFNQyxRQUFRLFNBQVJBLEtBQVEsQ0FBQ0MsSUFBRCxFQUFPQyxRQUFQLEVBQW9CO0FBQ2hDLE1BQU1DLE1BQU1GLEtBQUssS0FBTCxJQUFjQSxLQUFLLEtBQUwsQ0FBZCxHQUE0QixvQ0FBeEM7QUFDQSxNQUFNRyxNQUFNTixXQUFXLG9DQUFYLEdBQXVCLElBQUlPLGNBQUosRUFBbkM7O0FBRUFELE1BQUlFLElBQUosQ0FBUyxNQUFULEVBQWlCSCxHQUFqQixFQUFzQixJQUF0QjtBQUNBQyxNQUFJRyxZQUFKLEdBQW1CLE1BQW5CO0FBQ0FILE1BQUlJLGdCQUFKLENBQXFCLDZCQUFyQixFQUFvRCxHQUFwRDtBQUNBSixNQUFJSSxnQkFBSixDQUFxQixjQUFyQixFQUFxQyxrQkFBckM7O0FBRUEsTUFBSVYsUUFBSixFQUFjO0FBQUU7QUFDZE0sUUFBSUssa0JBQUosR0FBeUIsWUFBVztBQUNsQyxVQUFJTCxJQUFJTSxVQUFKLEtBQW1CLENBQXZCLEVBQTBCO0FBQ3hCUixpQkFBU0UsSUFBSU8sTUFBYixFQUFxQlAsSUFBSVEsWUFBekI7QUFDRDtBQUNGLEtBSkQ7QUFLRCxHQU5ELE1BTU87QUFBRTtBQUNQUixRQUFJUyxNQUFKLEdBQWEsWUFBVztBQUN0QlgsZUFBU0UsSUFBSU8sTUFBYixFQUFxQlAsSUFBSVUsUUFBekI7QUFDRCxLQUZEO0FBR0FWLFFBQUlXLE9BQUosR0FBYyxZQUFXO0FBQ3ZCYixlQUFTRSxJQUFJTyxNQUFiLEVBQXFCUCxJQUFJVSxRQUF6QjtBQUNELEtBRkQ7QUFHRDs7QUFFRFYsTUFBSVksSUFBSixDQUFTLHlCQUFlZixJQUFmLENBQVQ7QUFDRCxDQXpCRDs7UUEyQlNELEssR0FBQUEsSyIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBsaWJyYXJ5IGlzIGRldmVsb3BlZCBieSB0aGUgSVNNTSAoaHR0cDovL2lzbW0uaXJjYW0uZnIvKSB0ZWFtIGF0IElSQ0FNLFxuICogd2l0aGluIHRoZSBjb250ZXh0IG9mIHRoZSBSQVBJRC1NSVggKGh0dHA6Ly9yYXBpZG1peC5nb2xkc21pdGhzZGlnaXRhbC5jb20vKVxuICogcHJvamVjdCwgZnVuZGVkIGJ5IHRoZSBFdXJvcGVhbiBVbmlvbuKAmXMgSG9yaXpvbiAyMDIwIHJlc2VhcmNoIGFuZCBpbm5vdmF0aW9uIHByb2dyYW1tZS4gIFxuICogT3JpZ2luYWwgWE1NIGNvZGUgYXV0aG9yZWQgYnkgSnVsZXMgRnJhbsOnb2lzZSwgcG9ydGVkIHRvIEphdmFTY3JpcHQgYnkgSm9zZXBoIExhcnJhbGRlLiAgXG4gKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL0lyY2FtLVJuRC94bW0gZm9yIGRldGFpbGVkIFhNTSBjcmVkaXRzLlxuICovXG5cbmNvbnN0IGlzTm9kZSA9IG5ldyBGdW5jdGlvbihcInRyeSB7cmV0dXJuIHRoaXM9PT1nbG9iYWw7fWNhdGNoKGUpe3JldHVybiBmYWxzZTt9XCIpO1xuXG5pbXBvcnQgeyBYTUxIdHRwUmVxdWVzdCBhcyBYSFIgfSBmcm9tICd4bWxodHRwcmVxdWVzdCc7XG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgR21tRGVjb2RlciB9IGZyb20gJy4vZ21tL2dtbS1kZWNvZGVyJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgSGhtbURlY29kZXIgfSBmcm9tICcuL2hobW0vaGhtbS1kZWNvZGVyJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgUGhyYXNlTWFrZXIgfSBmcm9tICcuL3NldC94bW0tcGhyYXNlJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgU2V0TWFrZXIgfSBmcm9tICcuL3NldC94bW0tc2V0JztcblxuLyoqXG4gKiBAdHlwZWRlZiB4bW1UcmFpbmluZ0RhdGFcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHhtbU1vZGVsQ29uZmlnXG4gKi9cblxuLyoqXG4gKiBTZW5kcyBhIHBvc3QgcmVxdWVzdCB0byBodHRwczovL2NvbW8uaXJjYW0uZnIvYXBpL3YxL3RyYWluXG4gKiBAcGFyYW0ge3htbVRyYWluaW5nRGF0YX0gZGF0YSAtIG11c3QgY29udGFpbiB0aHJlc3MgZmllbGRzIDogY29uZmlndXJhdGlvbiwgbW9kZWxUeXBlIGFuZCBkYXRhc2V0LlxuICogVGhlIGRhdGFzZXQgc2hvdWxkIGhhdmUgYmVlbiBjcmVhdGVkIHdpdGggUGhyYXNlTWFrZXIgYW5kIFNldG1ha2VyIGNsYXNzZXMuXG4gKi9cbmNvbnN0IHRyYWluID0gKGRhdGEsIGNhbGxiYWNrKSA9PiB7XG4gIGNvbnN0IHVybCA9IGRhdGFbJ3VybCddID8gZGF0YVsndXJsJ10gOiAnaHR0cHM6Ly9jb21vLmlyY2FtLmZyL2FwaS92MS90cmFpbic7XG4gIGNvbnN0IHhociA9IGlzTm9kZSgpID8gbmV3IFhIUigpIDogbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgeGhyLm9wZW4oJ3Bvc3QnLCB1cmwsIHRydWUpO1xuICB4aHIucmVzcG9uc2VUeXBlID0gJ2pzb24nO1xuICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKTtcbiAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cbiAgaWYgKGlzTm9kZSgpKSB7IC8vIFhNTEh0dHBSZXF1ZXN0IG1vZHVsZSBvbmx5IHN1cHBvcnRzIHhociB2MVxuICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICBjYWxsYmFjayh4aHIuc3RhdHVzLCB4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7IC8vIHVzZSB4aHIgdjJcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBjYWxsYmFjayh4aHIuc3RhdHVzLCB4aHIucmVzcG9uc2UpO1xuICAgIH1cbiAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgY2FsbGJhY2soeGhyLnN0YXR1cywgeGhyLnJlc3BvbnNlKTtcbiAgICB9XG4gIH1cblxuICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG59O1xuXG5leHBvcnQgeyB0cmFpbiB9OyJdfQ==