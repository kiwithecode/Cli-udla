'use strict';

// Carpetas de entrada/salida y construcción del prompt que recibe el agente.
const fs = require('node:fs');
const path = require('node:path');
const { COMMANDS_DIR } = require('./config');
const { fail } = require('./util');

// Crea (si no existe) la carpeta de salida con marca de tiempo y devuelve su ruta absoluta.
function ensureOutputDir(tipo) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); // 2026-06-15T14-30-00
  const dir = path.join(process.cwd(), 'informes', tipo, stamp);
  fs.mkdirSync(path.join(dir, 'evidencia'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  return dir;
}

// Asegura la carpeta de entrada de casos de uso (opcional) y lista lo que haya.
function ensureCasosDir() {
  const dir = path.join(process.cwd(), 'casos-de-uso');
  fs.mkdirSync(dir, { recursive: true });
  const files = fs.readdirSync(dir).filter((f) => !f.startsWith('.') && f.toLowerCase() !== 'readme.md');
  return { dir, files };
}

// Lee el .md del comando, le quita el frontmatter, inyecta la URL/objetivo
// y agrega las directivas de casos de entrada y carpeta de salida.
function buildPrompt(cfg, target, outDir) {
  const file = path.join(COMMANDS_DIR, cfg.prompt + '.md');
  if (!fs.existsSync(file)) fail('No se encontró el prompt: ' + file);

  let body = fs.readFileSync(file, 'utf8')
    .replace(/^---[\s\S]*?---\s*/, '')   // quita frontmatter YAML
    .replace(/\$ARGUMENTS/g, target || '') // inyecta la URL/objetivo
    .trim();

  if (cfg.casos) body += casosDirective();
  body += outputDirective(outDir);
  return body;
}

// --- helpers de directivas ---

function casosDirective() {
  const { dir, files } = ensureCasosDir();
  let out = '\n\n---\n## Casos de uso de entrada (opcional)\n' +
    'Carpeta de casos de uso aportados por el usuario: `' + dir + '`\n';
  if (files.length) {
    out += 'Contiene estos archivos — leelos y usalos como base de las pruebas:\n' +
      files.map((f) => '- `' + path.join(dir, f) + '`').join('\n') + '\n';
  } else {
    out += 'Está vacía: NO hay casos aportados, así que generá los casos vos mismo explorando la web (o preguntá al usuario si prefiere describirlos).\n';
  }
  return out;
}

function outputDirective(outDir) {
  return '\n\n---\n## Carpeta de salida (obligatorio)\n' +
    'Guardá el informe y TODO lo que generes exclusivamente dentro de esta carpeta, que YA EXISTE:\n' +
    '`' + outDir + '`\n' +
    '- Informe principal: `' + path.join(outDir, 'informe.md') + '`\n' +
    '- Evidencia/screenshots: `' + path.join(outDir, 'evidencia') + '/`\n' +
    '- Scripts/código generado (tests, k6, etc.): `' + path.join(outDir, 'scripts') + '/`\n' +
    'No escribas informes fuera de esa ruta.';
}

module.exports = { ensureOutputDir, ensureCasosDir, buildPrompt };
