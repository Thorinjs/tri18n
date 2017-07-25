'use strict';
/**
 * Created by Adrian on 24-Jun-16.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.setConfig = setConfig;
exports.downloadLanguage = downloadLanguage;
exports.download = download;
exports.getLanguageUrl = getLanguageUrl;
exports.cacheLanguage = cacheLanguage;
exports.resetCache = resetCache;
exports.loadCachedLanguage = loadCachedLanguage;
exports.innerKey = innerKey;
exports.flattenData = flattenData;
var CONFIG = null;
var LANGUAGE_CACHE_KEY = '__tri18n_lang_c';
function setConfig(c) {
  CONFIG = c;
}
function downloadLanguage(url, cb) {
  doGet(url, function (err, content) {
    if (err) return cb(err);
    var jsonObj = void 0;
    try {
      jsonObj = JSON.parse(content);
    } catch (e) {
      return cb(new Error("Could not parse language pack."));
    }
    if (typeof CONFIG.parse === 'function') {
      try {
        jsonObj = CONFIG.parse(jsonObj);
      } catch (e) {
        return cb(e);
      }
    }
    return cb(null, jsonObj);
  });
}

/*
 * Download the current language pack.
 * */
function download(done) {
  var url = getLanguageUrl(CONFIG.lang);
  downloadLanguage(url, done);
}

/*
 * Returns the JSON path of the given language code.
 * */
function getLanguageUrl(code) {
  if (!CONFIG.url) return false;
  var url = CONFIG.url;
  if (CONFIG.raw) {
    url += code;
    return url;
  }
  if (url.charAt(url.length - 1) !== '/') url += '/';
  url += code + '.json';
  return url;
}

/*
 * Inner function that will cache the language pack in the localStorage.
 * */
function cacheLanguage(langCode, langObj) {
  try {
    localStorage.setItem(LANGUAGE_CACHE_KEY + ':' + langCode, JSON.stringify(langObj));
  } catch (e) {}
}

function resetCache(langCode) {
  download(function (e, langObj) {
    if (e) return;
    cacheLanguage(langCode, langObj);
  });
}

/*
 * Inner function that will try to load a previously cached language pack.
 * */
function loadCachedLanguage(langCode) {
  try {
    var tmpObj = localStorage.getItem(LANGUAGE_CACHE_KEY + ':' + langCode);
    if (!tmpObj || tmpObj === '') throw 1;
    return flattenData(JSON.parse(tmpObj));
  } catch (e) {
    return false;
  }
}

/* Returns the inner key of an object. */
function innerKey(obj, key) {
  if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object' || !obj) return null;
  if (typeof key !== 'string' || key === '') return null;
  if (key.indexOf('.') === -1) {
    return obj[key];
  }
  var t = _typeof(obj[key]);
  if (t === 'string' || t === 'number' || t === 'boolean') return obj[key];
  var s = key.split('.');
  var tmp = obj;
  try {
    for (var i = 0; i < s.length; i++) {
      tmp = tmp[s[i]];
    }
    if (typeof tmp === 'undefined') return null;
    return tmp;
  } catch (e) {
    return null;
  }
}

/*
 * Flattens the data pack, mergin inner keys together.
 * */
function flattenData(dataObj) {
  var copyObj = JSON.parse(JSON.stringify(dataObj));
  copyObj = deepen(copyObj);
  return copyObj;
}

function deepen(o) {
  var oo = {},
      t,
      parts,
      part;
  for (var k in o) {
    t = oo;
    parts = k.split('.');
    var key = parts.pop();
    while (parts.length) {
      part = parts.shift();
      t = t[part] = t[part] || {};
    }
    t[key] = o[k];
  }
  return oo;
}

function doGet(url, fn) {
  var x = getXhr();
  x.open('GET', url, true);
  x.onreadystatechange = function () {
    if (x.readyState == 4) {
      if (x.status >= 200 && x.status <= 399) {
        return fn(null, x.responseText);
      }
      fn(new Error("Could not download language."));
    }
  };
  x.send();
}

function getXhr() {
  if (typeof XMLHttpRequest !== 'undefined') {
    return new XMLHttpRequest();
  }
  var versions = ["MSXML2.XmlHttp.6.0", "MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"];
  var xhr;
  for (var i = 0; i < versions.length; i++) {
    try {
      xhr = new ActiveXObject(versions[i]);
      break;
    } catch (e) {}
  }
  return xhr;
};