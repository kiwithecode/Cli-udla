'use strict';

// Colores ANSI (sin dependencias externas)
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  brightCyan: '\x1b[96m',
  wine: '\x1b[38;2;120;20;28m',        // borde: vino oscuro
  wineBright: '\x1b[38;2;176;28;42m',  // arte: vino tirando a rojo
  blue: '\x1b[34m',
  white: '\x1b[97m',
  gray: '\x1b[90m',
};

// Glifos estilo "ANSI Shadow" (6 filas por letra)
const GLYPHS = {
  U: ['██╗   ██╗', '██║   ██║', '██║   ██║', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
  D: ['██████╗ ', '██╔══██╗', '██║  ██║', '██║  ██║', '██████╔╝', '╚═════╝ '],
  L: ['██╗     ', '██║     ', '██║     ', '██║     ', '███████╗', '╚══════╝'],
  A: [' █████╗ ', '██╔══██╗', '███████║', '██╔══██║', '██║  ██║', '╚═╝  ╚═╝'],
  Q: [' ██████╗ ', '██╔═══██╗', '██║   ██║', '██║▄▄ ██║', '╚██████╔╝', ' ╚══▀▀═╝ '],
  ' ': ['   ', '   ', '   ', '   ', '   ', '   '],
};

function renderWord(word) {
  const rows = ['', '', '', '', '', ''];
  for (const ch of word.toUpperCase()) {
    const g = GLYPHS[ch] || GLYPHS[' '];
    for (let i = 0; i < 6; i++) rows[i] += g[i] + ' ';
  }
  return rows;
}

// Dibuja un panel con borde redondeado alrededor de líneas ya en texto plano
function panel(artLines, infoLines) {
  const all = [...artLines, '', ...infoLines];
  const width = all.reduce((m, l) => Math.max(m, l.length), 0);
  const top = c.wine + '╭' + '─'.repeat(width + 2) + '╮' + c.reset;
  const bot = c.wine + '╰' + '─'.repeat(width + 2) + '╯' + c.reset;
  const out = [top];
  artLines.forEach((l) => {
    out.push(c.wine + '│ ' + c.wineBright + c.bold + l + ' '.repeat(width - l.length) + c.reset + c.wine + ' │' + c.reset);
  });
  out.push(c.wine + '│ ' + ' '.repeat(width) + ' │' + c.reset);
  infoLines.forEach((l) => {
    out.push(c.wine + '│ ' + c.white + l + ' '.repeat(width - l.length) + c.reset + c.wine + ' │' + c.reset);
  });
  out.push(bot);
  return out.join('\n');
}

function banner() {
  const { VERSION } = require('./config');
  const info = [
    'Agente de QA y Seguridad  ·  Universidad de Las Américas',
    'Powered by Claude Code  —  usa tu suscripción',
    'versión ' + VERSION,
  ];
  return '\n' + panel(renderWord('UDLA QA'), info) + '\n';
}

module.exports = { banner, c };
