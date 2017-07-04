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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
  var xhr = new XMLHttpRequest();
  xhr.open('post', url, true);
  xhr.responseType = 'json';
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.setRequestHeader('Content-Type', 'application/json');

  //   xhr.onreadystate = function() {
  //     if (xhr.readyState === 4) {
  //       callback(xhr.status, xhr.responseText);
  //     }
  //   }

  xhr.onload = function () {
    callback(xhr.status, xhr.response);
  };
  xhr.onerror = function () {
    callback(xhr.status, xhr.response);
  };

  xhr.send((0, _stringify2.default)(data));
};

exports.train = train;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbImRlZmF1bHQiLCJ0cmFpbiIsImRhdGEiLCJjYWxsYmFjayIsInVybCIsInhociIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsInJlc3BvbnNlVHlwZSIsInNldFJlcXVlc3RIZWFkZXIiLCJvbmxvYWQiLCJzdGF0dXMiLCJyZXNwb25zZSIsIm9uZXJyb3IiLCJzZW5kIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OytDQVVTQSxPOzs7Ozs7Ozs7Z0RBQ0FBLE87Ozs7Ozs7Ozs4Q0FDQUEsTzs7Ozs7Ozs7OzJDQUNBQSxPOzs7Ozs7QUFFVDs7OztBQUlBOzs7O0FBS0E7Ozs7O0FBS0EsSUFBTUMsUUFBUSxTQUFSQSxLQUFRLENBQUNDLElBQUQsRUFBT0MsUUFBUCxFQUFvQjtBQUNoQyxNQUFNQyxNQUFNRixLQUFLLEtBQUwsSUFBY0EsS0FBSyxLQUFMLENBQWQsR0FBNEIsb0NBQXhDO0FBQ0EsTUFBTUcsTUFBTSxJQUFJQyxjQUFKLEVBQVo7QUFDQUQsTUFBSUUsSUFBSixDQUFTLE1BQVQsRUFBaUJILEdBQWpCLEVBQXNCLElBQXRCO0FBQ0FDLE1BQUlHLFlBQUosR0FBbUIsTUFBbkI7QUFDQUgsTUFBSUksZ0JBQUosQ0FBcUIsNkJBQXJCLEVBQW9ELEdBQXBEO0FBQ0FKLE1BQUlJLGdCQUFKLENBQXFCLGNBQXJCLEVBQXFDLGtCQUFyQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBSixNQUFJSyxNQUFKLEdBQWEsWUFBVztBQUN0QlAsYUFBU0UsSUFBSU0sTUFBYixFQUFxQk4sSUFBSU8sUUFBekI7QUFDRCxHQUZEO0FBR0FQLE1BQUlRLE9BQUosR0FBYyxZQUFXO0FBQ3ZCVixhQUFTRSxJQUFJTSxNQUFiLEVBQXFCTixJQUFJTyxRQUF6QjtBQUNELEdBRkQ7O0FBSUFQLE1BQUlTLElBQUosQ0FBUyx5QkFBZVosSUFBZixDQUFUO0FBQ0QsQ0F0QkQ7O1FBd0JTRCxLLEdBQUFBLEsiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgbGlicmFyeSBpcyBkZXZlbG9wZWQgYnkgdGhlIElTTU0gKGh0dHA6Ly9pc21tLmlyY2FtLmZyLykgdGVhbSBhdCBJUkNBTSxcbiAqIHdpdGhpbiB0aGUgY29udGV4dCBvZiB0aGUgUkFQSUQtTUlYIChodHRwOi8vcmFwaWRtaXguZ29sZHNtaXRoc2RpZ2l0YWwuY29tLylcbiAqIHByb2plY3QsIGZ1bmRlZCBieSB0aGUgRXVyb3BlYW4gVW5pb27igJlzIEhvcml6b24gMjAyMCByZXNlYXJjaCBhbmQgaW5ub3ZhdGlvbiBwcm9ncmFtbWUuICBcbiAqIE9yaWdpbmFsIFhNTSBjb2RlIGF1dGhvcmVkIGJ5IEp1bGVzIEZyYW7Dp29pc2UsIHBvcnRlZCB0byBKYXZhU2NyaXB0IGJ5IEpvc2VwaCBMYXJyYWxkZS4gIFxuICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9JcmNhbS1SbkQveG1tIGZvciBkZXRhaWxlZCBYTU0gY3JlZGl0cy5cbiAqL1xuXG4vLyBpbXBvcnQgeyBYTUxIdHRwUmVxdWVzdCB9IGZyb20gJ3htbGh0dHByZXF1ZXN0JztcblxuZXhwb3J0IHsgZGVmYXVsdCBhcyBHbW1EZWNvZGVyIH0gZnJvbSAnLi9nbW0vZ21tLWRlY29kZXInO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBIaG1tRGVjb2RlciB9IGZyb20gJy4vaGhtbS9oaG1tLWRlY29kZXInO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBQaHJhc2VNYWtlciB9IGZyb20gJy4vc2V0L3htbS1waHJhc2UnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBTZXRNYWtlciB9IGZyb20gJy4vc2V0L3htbS1zZXQnO1xuXG4vKipcbiAqIEB0eXBlZGVmIHhtbVRyYWluaW5nRGF0YVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYgeG1tTW9kZWxDb25maWdcbiAqL1xuXG5cbi8qKlxuICogU2VuZHMgYSBwb3N0IHJlcXVlc3QgdG8gaHR0cHM6Ly9jb21vLmlyY2FtLmZyL2FwaS92MS90cmFpblxuICogQHBhcmFtIHt4bW1UcmFpbmluZ0RhdGF9IGRhdGEgLSBtdXN0IGNvbnRhaW4gdGhyZXNzIGZpZWxkcyA6IGNvbmZpZ3VyYXRpb24sIG1vZGVsVHlwZSBhbmQgZGF0YXNldC5cbiAqIFRoZSBkYXRhc2V0IHNob3VsZCBoYXZlIGJlZW4gY3JlYXRlZCB3aXRoIFBocmFzZU1ha2VyIGFuZCBTZXRtYWtlciBjbGFzc2VzLlxuICovXG5jb25zdCB0cmFpbiA9IChkYXRhLCBjYWxsYmFjaykgPT4ge1xuICBjb25zdCB1cmwgPSBkYXRhWyd1cmwnXSA/IGRhdGFbJ3VybCddIDogJ2h0dHBzOi8vY29tby5pcmNhbS5mci9hcGkvdjEvdHJhaW4nO1xuICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgeGhyLm9wZW4oJ3Bvc3QnLCB1cmwsIHRydWUpO1xuICB4aHIucmVzcG9uc2VUeXBlID0gJ2pzb24nO1xuICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKTtcbiAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cbiAgLy8gICB4aHIub25yZWFkeXN0YXRlID0gZnVuY3Rpb24oKSB7XG4gIC8vICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgLy8gICAgICAgY2FsbGJhY2soeGhyLnN0YXR1cywgeGhyLnJlc3BvbnNlVGV4dCk7XG4gIC8vICAgICB9XG4gIC8vICAgfVxuXG4gIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICBjYWxsYmFjayh4aHIuc3RhdHVzLCB4aHIucmVzcG9uc2UpO1xuICB9XG4gIHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgY2FsbGJhY2soeGhyLnN0YXR1cywgeGhyLnJlc3BvbnNlKTtcbiAgfVxuXG4gIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbn07XG5cbmV4cG9ydCB7IHRyYWluIH07Il19