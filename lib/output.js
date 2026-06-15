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
function buildPrompt(cfg, target, outDir, extra) {
  const file = path.join(COMMANDS_DIR, cfg.prompt + '.md');
  if (!fs.existsSync(file)) fail('No se encontró el prompt: ' + file);

  let body = fs.readFileSync(file, 'utf8')
    .replace(/^---[\s\S]*?---\s*/, '')   // quita frontmatter YAML
    .replace(/\$ARGUMENTS/g, target || '') // inyecta la URL/objetivo
    .trim();

  if (extra) body += scopeDirective(extra);
  if (cfg.casos) body += casosDirective();
  body += outputDirective(outDir);
  body += nonInteractiveDirective();
  return body;
}

// Prompt de la fase de PLANIFICACIÓN (paso 1 del flujo con aprobación):
// el agente explora la web y propone un plan de pruebas, SIN ejecutarlas ni escribir archivos.
function buildPlanPrompt(cfg, target, extra) {
  const file = path.join(COMMANDS_DIR, cfg.prompt + '.md');
  if (!fs.existsSync(file)) fail('No se encontró el prompt: ' + file);

  let body = fs.readFileSync(file, 'utf8')
    .replace(/^---[\s\S]*?---\s*/, '')
    .replace(/\$ARGUMENTS/g, target || '')
    .trim();

  if (extra) body += scopeDirective(extra);
  body += '\n\n---\n## Tarea AHORA: solo PLANIFICAR (no ejecutar)\n' +
    'Estás en la fase de planificación y corrés de forma NO interactiva (`claude -p`): no podés ' +
    'preguntar nada.\n' +
    '1. Abrí la URL con Playwright y explorala lo justo para entender la estructura ' +
    '(formularios, botones, navegación, responsive).\n' +
    '2. Devolvé ÚNICAMENTE un plan de pruebas conciso: una lista numerada de casos a probar, ' +
    'respetando lo que pidió el usuario si indicó algo.\n' +
    'Reglas estrictas:\n' +
    '- NO ejecutes las pruebas todavía, NO generes scripts, NO escribas ningún archivo ni informe.\n' +
    '- NO escribas introducciones ni cierres: solo el plan (texto/markdown). Será mostrado al ' +
    'usuario para que lo apruebe.';
  return body;
}

// --- helpers de directivas ---

function scopeDirective(extra) {
  return '\n\n---\n## Alcance indicado por el usuario (prioritario)\n' + extra;
}

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

// El agente corre en modo NO interactivo (claude -p): no puede preguntar ni esperar
// respuestas. Le indicamos que avance solo de punta a punta.
function nonInteractiveDirective() {
  return '\n\n---\n## Modo de ejecución (obligatorio)\n' +
    'Estás corriendo de forma AUTÓNOMA y NO interactiva (`claude -p`): NO podés hacer preguntas ' +
    'ni esperar respuestas del usuario; nadie las va a leer.\n' +
    '- Ignorá cualquier instrucción previa de "preguntá al usuario" o "esperá su elección".\n' +
    '- Si la URL/objetivo ya vino arriba, usalo directamente. Si falta algún dato no crítico, ' +
    'asumí un default razonable y dejalo registrado en el informe.\n' +
    '- Para el alcance de pruebas: si hay archivos en la carpeta de casos de uso, usalos; si no, ' +
    'EXPLORÁ la web vos mismo y generá los casos automáticamente. No te detengas a pedir confirmación.\n' +
    '- Ejecutá el flujo completo (explorar → probar con el navegador → generar evidencia y scripts → ' +
    'escribir el informe) y recién entonces terminá.';
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

module.exports = { ensureOutputDir, ensureCasosDir, buildPrompt, buildPlanPrompt };
