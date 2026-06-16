'use strict';

// Lanzamiento de procesos multiplataforma.
//
// En Windows, `npx` y `claude` se instalan como shims `.cmd`, que Node solo
// resuelve a través del shell (PATHEXT). Sin `shell:true`, spawn busca un
// ejecutable llamado exactamente "npx"/"claude" y falla con ENOENT.
// Con `shell:true` el shell sí los resuelve, pero Node NO cita los argumentos
// por nosotros, así que los citamos acá: hay rutas con espacios (p. ej.
// "C:\…\MCP ARMAS\.mcp.json") que de otro modo cmd.exe partiría en dos.
const { spawn, spawnSync } = require('node:child_process');

const isWin = process.platform === 'win32';

// Cita un argumento para cmd.exe solo si lo necesita (deja tokens simples intactos).
function quoteArg(arg) {
  const s = String(arg);
  if (s !== '' && /^[A-Za-z0-9_@.:/\\-]+$/.test(s)) return s; // token sin espacios ni metacaracteres
  return '"' + s.replace(/"/g, '""') + '"';
}

function prep(cmd, args, opts) {
  if (!isWin) return [cmd, args, opts];
  return [cmd, args.map(quoteArg), { ...opts, shell: true }];
}

// spawn asíncrono multiplataforma.
function run(cmd, args, opts = {}) {
  const [c, a, o] = prep(cmd, args, opts);
  return spawn(c, a, o);
}

// spawnSync multiplataforma.
function runSync(cmd, args, opts = {}) {
  const [c, a, o] = prep(cmd, args, opts);
  return spawnSync(c, a, o);
}

module.exports = { run, runSync, isWin };
