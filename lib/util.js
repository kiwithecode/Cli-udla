'use strict';

// Utilidades de salida por consola.
const { c } = require('./banner');

function log(s = '') { process.stdout.write(s + '\n'); }

function fail(msg) {
  log(c.bold + '\x1b[31m✖ ' + msg + c.reset);
  process.exit(1);
}

module.exports = { log, fail };
