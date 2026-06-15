#!/usr/bin/env node
'use strict';

// Punto de entrada del CLI. Solo enruta el comando hacia la lógica
// que vive en los módulos de ../lib/.
const { c } = require('../lib/banner');
const { log } = require('../lib/util');
const { runAgent, update } = require('../lib/runner');
const { help, menu } = require('../lib/ui');
const { VERSION } = require('../lib/config');

const [, , cmd, ...rest] = process.argv;
const target = rest.join(' ').trim();

switch ((cmd || 'menu').toLowerCase()) {
  case 'analizar': case 'analyze': case 'qa':
    runAgent('qa', target); break;
  case 'seguridad': case 'security': case 'pentest':
    runAgent('seguridad', target); break;
  case 'carga': case 'rendimiento': case 'k6': case 'performance':
    runAgent('carga', target); break;
  case 'auditar': case 'auditoria': case 'audit': case 'repo':
    runAgent('auditar', target); break;
  case 'update': case 'actualizar':
    update(); break;
  case 'help': case '--help': case '-h':
    help(); break;
  case 'version': case '--version': case '-v':
    log('udla-qa v' + VERSION); break;
  case 'menu':
    menu(); break;
  default:
    log(c.gray + 'Comando desconocido: ' + cmd + c.reset); help(); process.exit(1);
}
