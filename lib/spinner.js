'use strict';

// Barra de progreso con porcentaje (sin dependencias externas).
// Se anima con setInterval, así que SOLO sirve mientras el event loop esté libre:
// usala con `spawn` asíncrono, nunca con `spawnSync` (que bloquea y la congela).
//
// La IA no expone un progreso real, así que el % se ESTIMA por tiempo con una
// curva exponencial: avanza rápido al principio y se va frenando, acercándose a
// 100 sin llegar (tope 99%). Recién cuando el proceso termina de verdad salta a
// 100% (succeed). Es el patrón clásico de barra "tranquilizadora".
const { c } = require('./banner');

const TRACK = 24;          // ancho de la pista de la barra
const DEFAULT_TAU = 60000; // constante de tiempo (ms) de la estimación del %
const isTTY = !!process.stdout.isTTY;

// Dibuja la barra para un porcentaje 0..100.
function bar(pct) {
  const filled = Math.round((TRACK * pct) / 100);
  let s = '';
  for (let i = 0; i < TRACK; i++) s += i < filled ? c.wineBright + '█' : c.gray + '░';
  return c.wine + '▕' + s + c.wine + '▏' + c.reset;
}

// Crea y arranca la barra. opts.estimateMs ajusta qué tan rápido sube el %.
// Devuelve un control con update/succeed/fail/stop.
function start(text, opts = {}) {
  const t0 = Date.now();
  const tau = opts.estimateMs || DEFAULT_TAU;

  // Sin TTY (logs, CI): no animamos, solo dejamos una línea.
  if (!isTTY) {
    process.stdout.write(c.cyan + '› ' + text + '…' + c.reset + '\n');
    return {
      update(t) { process.stdout.write(c.gray + '  ' + t + c.reset + '\n'); },
      stop() {},
      succeed(t) { process.stdout.write(c.bold + '\x1b[32m✔ ' + (t || text) + c.reset + '\n'); },
      fail(t) { process.stdout.write(c.bold + '\x1b[31m✖ ' + (t || text) + c.reset + '\n'); },
    };
  }

  let label = text;

  const pctNow = () => {
    const elapsed = Date.now() - t0;
    const est = Math.round((1 - Math.exp(-elapsed / tau)) * 100);
    return Math.max(1, Math.min(99, est)); // entre 1 y 99 mientras corre
  };

  const render = () => {
    const pct = pctNow();
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    // \r vuelve al inicio de línea; \x1b[K borra hasta el final por si el texto se acorta.
    process.stdout.write('\r\x1b[K' + bar(pct) + ' ' +
      c.bold + String(pct).padStart(3) + '%' + c.reset + '  ' +
      label + c.gray + '  ' + secs + 's' + c.reset);
  };

  process.stdout.write('\x1b[?25l'); // oculta el cursor
  render();
  const timer = setInterval(render, 120);

  const finish = (ok, msg) => {
    clearInterval(timer);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const line = ok
      ? bar(100) + ' ' + c.bold + '100%' + c.reset + '  ' +
        c.bold + '\x1b[32m✔ ' + (msg || label) + c.reset
      : c.bold + '\x1b[31m✖ ' + (msg || label) + c.reset;
    process.stdout.write('\r\x1b[K' + line + c.gray + '  (' + secs + 's)' + c.reset + '\n');
    process.stdout.write('\x1b[?25h'); // restaura el cursor
  };

  return {
    update(t) { label = t; },
    stop() { clearInterval(timer); process.stdout.write('\r\x1b[K\x1b[?25h'); },
    succeed(t) { finish(true, t); },
    fail(t) { finish(false, t); },
  };
}

// Si el proceso muere de golpe (Ctrl+C), nos aseguramos de devolver el cursor.
process.on('exit', () => { if (isTTY) process.stdout.write('\x1b[?25h'); });

module.exports = { start };
