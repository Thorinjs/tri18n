'use strict';
/**
 * Created by Adrian on 24-Jun-16.
 */
let CONFIG = null;
const dot = require('dot-object');
const LANGUAGE_CACHE_KEY = '__tri18n_lang_c';

export function setConfig(c) {
  CONFIG = c;
}

export function downloadLanguage(url, cb) {
  doGet(url, (err, content) => {
    if (err) return cb(err);
    let jsonObj;
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
export function download(done) {
  const url = getLanguageUrl(CONFIG.lang);
  downloadLanguage(url, done);
}

/*
 * Returns the JSON path of the given language code.
 * */
export function getLanguageUrl(code) {
  if (!CONFIG.url) return false;
  let url = CONFIG.url;
  if (CONFIG.raw) {
    url += code;
    return url;
  }
  if (typeof CONFIG.parse !== 'function') {
    if (url.charAt(url.length - 1) !== '/') url += '/';
    url += code + '.json';
  }
  return url;
}

/*
 * Inner function that will cache the language pack in the localStorage.
 * */
export function cacheLanguage(langCode, langObj) {
  try {
    localStorage.setItem(LANGUAGE_CACHE_KEY + ':' + langCode, JSON.stringify(langObj));
  } catch (e) {
  }
}

export function resetCache(langCode) {
  download((e, langObj) => {
    if (e) return;
    cacheLanguage(langCode, langObj);
  });
}

/*
 * Inner function that will try to load a previously cached language pack.
 * */
export function loadCachedLanguage(langCode) {
  try {
    let tmpObj = localStorage.getItem(LANGUAGE_CACHE_KEY + ':' + langCode);
    if (!tmpObj || tmpObj === '') throw 1;
    return flattenData(JSON.parse(tmpObj));
  } catch (e) {
    return false;
  }
}

/* Returns the inner key of an object. */
export function innerKey(obj, key) {
  if (typeof obj !== 'object' || !obj) return null;
  if (typeof key !== 'string' || key === '') return null;
  if (key.indexOf('.') === -1) {
    return obj[key];
  }
  let t = typeof obj[key];
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
export function flattenData(dataObj) {
  let copyObj = JSON.parse(JSON.stringify(dataObj));
  copyObj = deepen(copyObj);
  try {
    copyObj = dot.dot(copyObj);
  } catch (e) {
  }
  return copyObj;
}

function deepen(o) {
  var oo = {}, t, parts, part;
  for (var k in o) {
    t = oo;
    parts = k.split('.');
    var key = parts.pop();
    while (parts.length) {
      part = parts.shift();
      t = t[part] = t[part] || {};
    }
    t[key] = o[k]
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
  var versions = [
    "MSXML2.XmlHttp.6.0",
    "MSXML2.XmlHttp.5.0",
    "MSXML2.XmlHttp.4.0",
    "MSXML2.XmlHttp.3.0",
    "MSXML2.XmlHttp.2.0",
    "Microsoft.XmlHttp"
  ];
  var xhr;
  for (var i = 0; i < versions.length; i++) {
    try {
      xhr = new ActiveXObject(versions[i]);
      break;
    } catch (e) {
    }
  }
  return xhr;
};

