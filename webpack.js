'use strict';
/*
 * This is the webpack utility. This will copy the language files from the given source, by requiring them,
 * and pasting them in the public folder in order to be publicly accessible.
 * This is not included in the client-side script.
 * */
const fs = require('fs'),
  fse = require('fs-extra'),
  path = require('path');
const BASE_PATH = path.dirname(module.parent.filename);
let SOURCE_FILES = [],
  shouldWatch = !(process.argv.indexOf('--watch') === -1 && process.argv.indexOf('-w') === -1),
  TARGET_PATH = path.normalize(BASE_PATH + '/public/lang'); // by default, it is public/lang/{code}.json
const plugin = {};
/*
 * Sets the language source files.
 * */
plugin.source = function setSoruce(sourcePath) {
  SOURCE_FILES.push(sourcePath);
  return plugin;
};

/*
* Override the default watch() functionality.
* */
plugin.watch = function setWatch(v) {
  if(typeof v === 'boolean') {
    shouldWatch = v;
  }
  return plugin;
}

/*
 * Sets the target location
 * */
plugin.target = function setTarget(targetPath) {
  TARGET_PATH = (path.isAbsolute(targetPath) ? path.normalize(targetPath) : path.normalize(__dirname + '/' + targetPath));
  return plugin;
};

/*
 * Compiles the language packages. If not called within the first 100ms, it will auto-compile.
 * */
let isCompiling = false;
plugin.compile = function compile() {
  if (isCompiling) return;
  clearTimeout(_timer);
  isCompiling = true;
  try {
    fse.ensureDirSync(TARGET_PATH);
  } catch (e) {
    console.warn(`tri18n: could not ensure target path: ${TARGET_PATH}`);
    console.trace(e);
    return false;
  }
  let languageFiles = [];
  SOURCE_FILES.forEach((item) => {
    item = path.normalize(item);
    let ext = path.extname(item);
    if (ext === '.js' || ext === '.json') {
      languageFiles.push(item);
    } else {
      let files;
      try {
        files = fs.readdirSync(item);
      } catch (e) {
        console.warn(`tri18n: could not read source directory: ${item}`);
        console.trace(e);
        return;
      }
      files.forEach((fItem) => {
        let ext = path.extname(fItem);
        if (ext === '.js' || ext === '.json') {
          languageFiles.push(path.normalize(item + '/' + fItem));
        }
      });
    }
  });
  if (languageFiles.length === 0) {
    console.debug(`tri18n: no source language files present.`);
    return;
  }
  languageFiles.forEach((item) => {
    plugin.convert(item);
  });
  if(!shouldWatch) return;
  watchFiles(languageFiles);
}

/*
 * Converts a single source language file to the target .json
 * */
plugin.convert = function convert(sourceFile) {
  const ext = path.extname(sourceFile);
  let jsonObj;
  switch (ext) {
    case '.js':
      delete require.cache[sourceFile];
      jsonObj = require(sourceFile);
      if (typeof jsonObj !== 'object' || !jsonObj) {
        console.warn(`tri18n: source file: ${sourceFile} does not export an object. Skipping`);
        return;
      }
      break;
    case '.json':
      let jsonData;
      try {
        jsonData = fs.readFileSync(sourceFile, {encoding: 'utf8'});
      } catch (e) {
        console.warn(`tri18n: source file ${sourceFile} could not be read.`);
        console.trace(e);
        return;
      }
      try {
        jsonObj = JSON.parse(jsonData);
      } catch (e) {
        console.warn(`tri18n: source file ${sourceFile} is not a valid JSON object.`);
        return false;
      }
      break;
    default:
      console.warn(`tri18n: source file extension ${ext} not supported.`);
  }
  if (!jsonObj) return;
  writeOutput(sourceFile, jsonObj);
}

function writeOutput(file, langObj) {
  let targetFile = path.basename(file),
    languageCode = targetFile.substr(0, targetFile.lastIndexOf(path.extname(targetFile))),
    targetFilePath = path.normalize(TARGET_PATH + '/' + languageCode + ".json");
  let content = (typeof langObj === 'string' ? langObj : JSON.stringify(langObj));
  try {
    fs.writeFileSync(targetFilePath, content, {encoding: 'utf8'});
    console.log(`tri18n: compiled ${languageCode}.json`);
    return true;
  } catch (e) {
    console.warn(`tri18n: could not compile from: ${file}`);
    console.trace(e);
    return false;
  }
}

function watchFiles(sourceFiles) {
  let watchMap = {};
  sourceFiles.forEach((filePath) => {
    let fileName = path.basename(filePath);
    fs.watch(path.dirname(filePath), (e, file) => {
      if(file !== fileName) return;
      if(watchMap[filePath]) return;
      watchMap[filePath] = true;
      plugin.convert(filePath);
      setTimeout(() => {
        delete watchMap[filePath];
      }, 100);
    });
  });
}

let _timer = setTimeout(function() {
  if (isCompiling) return
  plugin.compile();
}, 100);

module.exports = plugin;

