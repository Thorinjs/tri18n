'use strict';
const util = require('./util.js');
let CONFIG = {
  lang: 'en',   // the default language
  url: window.location.protocol + '//' + window.location.host + '/lang', // the URL from where to download language packages. The URL is as follows: {url}/{languageCode}.json
                                                                        // Setting the url to false will result in not downloading any language and just looking into the pack variable.
  data: null, // if set, we will not use the url to download any language, but will use this as the language object.
  cache: false       // should we try and cache the language object? If we do, onLoad will automatically callback if we have a cached version, and re-cache it after download.
};

util.setConfig(CONFIG);

/**
* Given a text code, it will return the associated value from the config data.
 * Text codes can be: "account.login.hello": "Hello world" -> translated to CONFIG.data.account.login.hello OR the default value, OR the given code.
* */
function transform(code, _default) {
  if(typeof code !== 'string' || !code) {
    return '?';
  }
  let text = util.innerKey(CONFIG.data, code),
    defaultText = (typeof _default === 'undefined' ? code : _default);
  if(text == null) return defaultText;
  return text;
}
export function t() {
  return transform.apply(this, arguments);
}
export default function tr() {
  return transform.apply(this, arguments);
}


/**
* Wraps the transform function by prepending a namespace.
 * This can be used as follows:
 * const t = tri18n.namespace('account')
 *
 * t('login.hello') => equivalent with tri18n.t('account.login.hello')
* */
export function tns(nsCode) {
  if(typeof nsCode !== 'string' || !nsCode) {
    console.warn(`tri18n: namespace() requires a string.`);
    return t;
  }
  return function namespacedTransform(code) {
    if(nsCode.charAt(nsCode.length-1) === '.') nsCode = nsCode.substr(0, nsCode.length-1);
    return t(nsCode + '.' + code);
  }
}


/**
* Overrides the default configuration of the plugin.
* */
export function configure(opt) {
  if(typeof opt.data === 'object' && opt.data) {
    CONFIG.data = util.flattenData(opt.data);
    delete opt.data;
  }
  CONFIG = Object.assign({}, CONFIG, opt);
  util.setConfig(CONFIG);
  return this;
}

/**
* Manually set the cache.
* */
export function cache(bVal) {
  if(typeof bVal === 'boolean') {
    CONFIG.cache = bVal;
  }
  return this;
}

/**
* Sets the language data of tri18n
* */
export function data(dataObj) {
  if(typeof dataObj === 'object' && dataObj) {
    CONFIG.data = util.flattenData(dataObj);
  }
  return this;
}

/**
* Loads the language pack from the remote source.
 * TODO: asynchronously load language packs from a given URL
* */
export function load(onDone) {
  if(typeof CONFIG.data === 'object' && CONFIG.data) return onDone && onDone();
  // Check if we have anything in cache.
  if(CONFIG.cache) {
    let oldLang = util.loadCachedLanguage(CONFIG.lang);
    // IF we have a previous cached language pack, we done here and re-set the cache.
    if(oldLang) {
      data(oldLang);
      onDone && onDone();
      util.resetCache(CONFIG.lang);
      return this;
    }
  }
  // If no caching and no URL, we stop.
  if(!CONFIG.url) {
    console.warn(`tri18n: no language data set and nothing to download. Starting with no language support.`);
    return onDone && onDone();
  }
  // Otherwise, we download the lang pack.
  util.download((e, langObj) => {
    if(e) return onDone && onDone(e);
    // at this point, we have the lang pack. We check if we can cache it.
    data(langObj);
    if(CONFIG.cache) {
      util.cacheLanguage(CONFIG.lang, CONFIG.data);
    }
    onDone && onDone();
  });
}

export function getLanguageUrl(code) {
  return util.getLanguageUrl(code);
}

/**
* Sets the location of the language package.
 * TODO: asynchronously load language pack
* */
export function setLanguage(langCode, done) {
  if(typeof langCode === 'string' && langCode) {
    CONFIG.lang = langCode;
  }
  return this;
}


