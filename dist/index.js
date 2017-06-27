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

var train = function train(data, callback) {
  var url = 'https://como.ircam.fr/api/v1/train';
  var xhr = new XMLHttpRequest();
  xhr.open('post', url, true);
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      callback(xhr.status, xhr.responseText);
    }
  };
  xhr.send((0, _stringify2.default)(data));
};

exports.train = train;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbImRlZmF1bHQiLCJ0cmFpbiIsImRhdGEiLCJjYWxsYmFjayIsInVybCIsInhociIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsInNldFJlcXVlc3RIZWFkZXIiLCJvbnJlYWR5c3RhdGVjaGFuZ2UiLCJyZWFkeVN0YXRlIiwic3RhdHVzIiwicmVzcG9uc2VUZXh0Iiwic2VuZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OzsrQ0FVU0EsTzs7Ozs7Ozs7O2dEQUNBQSxPOzs7Ozs7Ozs7OENBQ0FBLE87Ozs7Ozs7OzsyQ0FDQUEsTzs7Ozs7O0FBRVQsSUFBTUMsUUFBUSxTQUFSQSxLQUFRLENBQUNDLElBQUQsRUFBT0MsUUFBUCxFQUFvQjtBQUNoQyxNQUFNQyxNQUFNLG9DQUFaO0FBQ0EsTUFBTUMsTUFBTSxJQUFJQyxjQUFKLEVBQVo7QUFDQUQsTUFBSUUsSUFBSixDQUFTLE1BQVQsRUFBaUJILEdBQWpCLEVBQXNCLElBQXRCO0FBQ0FDLE1BQUlHLGdCQUFKLENBQXFCLDZCQUFyQixFQUFvRCxHQUFwRDtBQUNBSCxNQUFJRyxnQkFBSixDQUFxQixjQUFyQixFQUFxQyxrQkFBckM7QUFDQUgsTUFBSUksa0JBQUosR0FBeUIsWUFBVztBQUNsQyxRQUFJSixJQUFJSyxVQUFKLEtBQW1CLENBQXZCLEVBQTBCO0FBQ3hCUCxlQUFTRSxJQUFJTSxNQUFiLEVBQXFCTixJQUFJTyxZQUF6QjtBQUNEO0FBQ0YsR0FKRDtBQUtBUCxNQUFJUSxJQUFKLENBQVMseUJBQWVYLElBQWYsQ0FBVDtBQUNELENBWkQ7O1FBY1NELEssR0FBQUEsSyIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBsaWJyYXJ5IGlzIGRldmVsb3BlZCBieSB0aGUgSVNNTSAoaHR0cDovL2lzbW0uaXJjYW0uZnIvKSB0ZWFtIGF0IElSQ0FNLFxuICogd2l0aGluIHRoZSBjb250ZXh0IG9mIHRoZSBSQVBJRC1NSVggKGh0dHA6Ly9yYXBpZG1peC5nb2xkc21pdGhzZGlnaXRhbC5jb20vKVxuICogcHJvamVjdCwgZnVuZGVkIGJ5IHRoZSBFdXJvcGVhbiBVbmlvbuKAmXMgSG9yaXpvbiAyMDIwIHJlc2VhcmNoIGFuZCBpbm5vdmF0aW9uIHByb2dyYW1tZS4gIFxuICogT3JpZ2luYWwgWE1NIGNvZGUgYXV0aG9yZWQgYnkgSnVsZXMgRnJhbsOnb2lzZSwgcG9ydGVkIHRvIEphdmFTY3JpcHQgYnkgSm9zZXBoIExhcnJhbGRlLiAgXG4gKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL0lyY2FtLVJuRC94bW0gZm9yIGRldGFpbGVkIFhNTSBjcmVkaXRzLlxuICovXG5cbi8vIGltcG9ydCB7IFhNTEh0dHBSZXF1ZXN0IH0gZnJvbSAneG1saHR0cHJlcXVlc3QnO1xuXG5leHBvcnQgeyBkZWZhdWx0IGFzIEdtbURlY29kZXIgfSBmcm9tICcuL2dtbS9nbW0tZGVjb2Rlcic7XG5leHBvcnQgeyBkZWZhdWx0IGFzIEhobW1EZWNvZGVyIH0gZnJvbSAnLi9oaG1tL2hobW0tZGVjb2Rlcic7XG5leHBvcnQgeyBkZWZhdWx0IGFzIFBocmFzZU1ha2VyIH0gZnJvbSAnLi9zZXQveG1tLXBocmFzZSc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIFNldE1ha2VyIH0gZnJvbSAnLi9zZXQveG1tLXNldCc7XG5cbmNvbnN0IHRyYWluID0gKGRhdGEsIGNhbGxiYWNrKSA9PiB7XG4gIGNvbnN0IHVybCA9ICdodHRwczovL2NvbW8uaXJjYW0uZnIvYXBpL3YxL3RyYWluJztcbiAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gIHhoci5vcGVuKCdwb3N0JywgdXJsLCB0cnVlKTtcbiAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICBjYWxsYmFjayh4aHIuc3RhdHVzLCB4aHIucmVzcG9uc2VUZXh0KTtcbiAgICB9XG4gIH07XG4gIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbn07XG5cbmV4cG9ydCB7IHRyYWluIH07Il19