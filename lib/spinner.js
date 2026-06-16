'use strict';

// Barra de progreso animada (sin dependencias externas).
// Se anima con setInterval, así que SOLO sirve mientras el event loop esté libre:
// usalo con `spawn` asíncrono, nunca con `spawnSync` (que bloquea y lo congela).
// La IA no expone un % real, así que la barra es "indeterminada": un bloque que
// recorre la pista de ida y vuelta para indicar que hay trabajo en curso.
const { c } = require('./banner');

const TRACK = 22;  // ancho de la pista de la barra
const BLOCK = 7;   // largo del bloque que se desplaza
const isTTY = !!process.stdout.isTTY;

// Dibuja la barra indeterminada para un paso dado (bloque rebotando en los bordes).
function bar(step) {
  const span = TRACK - BLOCK;             // posiciones útiles
  const cycle = span * 2;                 // ida + vuelta
  const p = step % cycle;
  const pos = p <= span ? p : cycle - p;  // rebote
  let s = '';
  for (let i = 0; i < TRACK; i++) {
    s += (i >= pos && i < pos + BLOCK)
      ? c.wineBright + '█'
      : c.gray + '░';
  }
  return c.wine + '▕' + s + c.wine + '▏' + c.reset;
}

// Crea y arranca un spinner con un texto. Devuelve un control con succeed/fail/stop.
function start(text) {
  const t0 = Date.now();

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

  let step = 0;
  let label = text;

  const render = () => {
    step += 1;
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    // \r vuelve al inicio de línea; \x1b[K borra hasta el final por si el texto se acorta.
    process.stdout.write('\r\x1b[K' + bar(step) + ' ' +
      c.bold + label + c.reset + c.gray + '  ' + secs + 's' + c.reset);
  };

  process.stdout.write('\x1b[?25l'); // oculta el cursor
  render();
  const timer = setInterval(render, 90);

  const finish = (symbol, msg) => {
    clearInterval(timer);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    process.stdout.write('\r\x1b[K' + symbol + ' ' + (msg || label) +
      c.gray + '  (' + secs + 's)' + c.reset + '\n');
    process.stdout.write('\x1b[?25h'); // restaura el cursor
  };

  return {
    update(t) { label = t; },
    stop() { clearInterval(timer); process.stdout.write('\r\x1b[K\x1b[?25h'); },
    succeed(t) { finish(c.bold + '\x1b[32m✔' + c.reset, t); },
    fail(t) { finish(c.bold + '\x1b[31m✖' + c.reset, t); },
  };
}

// Si el proceso muere de golpe (Ctrl+C), nos aseguramos de devolver el cursor.
process.on('exit', () => { if (isTTY) process.stdout.write('\x1b[?25h'); });

module.exports = { start };
