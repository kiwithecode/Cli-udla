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

// Toda la lógica corre dentro de una IIFE async para poder await-ear los
// comandos asíncronos (runAgent/menu/update) y capturar cualquier rechazo,
// evitando "unhandled rejection" con mensaje opaco.
(async () => {
  switch ((cmd || 'menu').toLowerCase()) {
    case 'analizar': case 'analyze': case 'qa':
      await runAgent('qa', target); break;
    case 'seguridad': case 'security': case 'pentest':
      await runAgent('seguridad', target); break;
    case 'carga': case 'rendimiento': case 'k6': case 'performance':
      await runAgent('carga', target); break;
    case 'servicio': case 'api': case 'rest': case 'endpoint':
      await runAgent('servicio', target); break;
    case 'auditar': case 'auditoria': case 'audit': case 'repo':
      await runAgent('auditar', target); break;
    case 'update': case 'actualizar':
      await update(); break;
    case 'help': case '--help': case '-h':
      help(); break;
    case 'version': case '--version': case '-v':
      log('udla-qa v' + VERSION); break;
    case 'menu':
      await menu(); break;
    default:
      log(c.gray + 'Comando desconocido: ' + cmd + c.reset); help(); process.exit(1);
  }
})().catch((e) => {
  log(c.bold + '\x1b[31m✖ ' + (e?.message || e) + c.reset);
  process.exit(1);
});
