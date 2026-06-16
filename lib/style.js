'use strict';

// Lenguaje visual común de la consola: símbolos, colores y bloques coherentes
// con el banner (paleta vino). Todo en una sola línea de salida, sin estado.
const { c } = require('./banner');

// Ancho de referencia para reglas/bloques.
const W = 60;

// Quita los códigos ANSI para medir el largo visible real de un texto.
function visibleLen(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}

// — Líneas de estado (devuelven string; se imprimen con log) —
const step = (t) => c.cyan + '› ' + c.reset + t;                 // acción en curso
const ok = (t) => c.green + c.bold + '✔ ' + c.reset + t;          // éxito
const err = (t) => c.red + c.bold + '✖ ' + c.reset + t;           // error
const warn = (t) => c.yellow + c.bold + '⚠ ' + c.reset + t;       // aviso
const info = (t) => c.gray + '  ' + t + c.reset;                  // secundario
const hint = (t) => c.gray + t + c.reset;                         // tenue

// Par clave · valor alineado, p. ej.  "Resultados  ·  /ruta".
function kv(key, value) {
  return c.gray + '  ' + key + '  ' + c.wine + '·' + c.reset + '  ' + c.white + value + c.reset;
}

// Regla horizontal con etiqueta opcional, en color vino.
function hr(label) {
  if (!label) return c.wine + '─'.repeat(W) + c.reset;
  const head = '── ' + c.bold + c.white + label + c.reset + c.wine + ' ';
  const used = visibleLen('── ' + label + ' ');
  return c.wine + '── ' + c.bold + c.white + label + c.reset + c.wine + ' ' +
    '─'.repeat(Math.max(0, W - used)) + c.reset;
}

// Bloque con barra lateral para contenido multilínea (p. ej. el plan).
//   ╭─ Título ───────────…
//   │ contenido…
//   ╰────────────────────…
function block(title, body) {
  const top = c.wine + '╭─ ' + c.bold + c.white + title + c.reset + c.wine + ' ' +
    '─'.repeat(Math.max(0, W - visibleLen('╭─ ' + title + ' '))) + c.reset;
  const mid = String(body).split('\n')
    .map((l) => c.wine + '│ ' + c.reset + l)
    .join('\n');
  const bot = c.wine + '╰' + '─'.repeat(W - 1) + c.reset;
  return top + '\n' + c.wine + '│' + c.reset + '\n' + mid + '\n' + c.wine + '│' + c.reset + '\n' + bot;
}

module.exports = { step, ok, err, warn, info, hint, kv, hr, block };
