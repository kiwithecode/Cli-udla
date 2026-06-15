#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { banner, c } = require('../lib/banner');

const PKG_DIR = path.join(__dirname, '..');
const MCP_CONFIG = path.join(PKG_DIR, '.mcp.json');
const COMMANDS_DIR = path.join(PKG_DIR, '.claude', 'commands');
const VERSION = require(path.join(PKG_DIR, 'package.json')).version;

// Herramientas que el agente puede usar sin pedir permiso en cada paso
const ALLOWED_TOOLS = 'mcp__playwright Read Write Glob Grep TodoWrite WebFetch Bash';

function log(s = '') { process.stdout.write(s + '\n'); }

function fail(msg) {
  log(c.bold + '\x1b[31m✖ ' + msg + c.reset);
  process.exit(1);
}

// Verifica que Claude Code esté instalado
function ensureClaude() {
  const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  if (r.error) {
    fail('No se encontró "claude" (Claude Code).\n' +
      '  Instalalo desde https://claude.com/claude-code y luego ejecutá:  claude  →  /login');
  }
}

// Lee un comando .md, quita el frontmatter y reemplaza $ARGUMENTS
function buildPrompt(name, target) {
  const file = path.join(COMMANDS_DIR, name + '.md');
  if (!fs.existsSync(file)) fail('No se encontró el prompt: ' + file);
  let body = fs.readFileSync(file, 'utf8');
  body = body.replace(/^---[\s\S]*?---\s*/, '');          // quita frontmatter YAML
  body = body.replace(/\$ARGUMENTS/g, target || '');       // inyecta la URL/objetivo
  return body.trim();
}

// Lanza Claude Code en modo interactivo con el prompt y el MCP de Playwright
function runAgent(promptName, target) {
  ensureClaude();
  const prompt = buildPrompt(promptName, target);
  const args = [
    '--mcp-config', MCP_CONFIG,
    '--strict-mcp-config',
    '--allowedTools', ALLOWED_TOOLS,
    prompt,
  ];
  const r = spawnSync('claude', args, { stdio: 'inherit', cwd: process.cwd() });
  process.exit(r.status === null ? 0 : r.status);
}

// udla-qa update → trae la última versión del repo
function update() {
  log(c.cyan + '› Actualizando UDLA-QA…' + c.reset);
  const isGit = spawnSync('git', ['-C', PKG_DIR, 'rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' });
  if (isGit.status === 0) {
    const pull = spawnSync('git', ['-C', PKG_DIR, 'pull', '--ff-only'], { stdio: 'inherit' });
    if (pull.status !== 0) {
      log(c.gray + '  (No se pudo hacer fast-forward. Revisá el repo manualmente.)' + c.reset);
    }
  } else {
    log(c.gray + '  Instalación no-git: volvé a instalar con  npm install -g <repo>  para actualizar.' + c.reset);
  }
  log(c.cyan + '› Verificando navegador de Playwright…' + c.reset);
  spawnSync('npx', ['-y', 'playwright', 'install', 'chromium'], { stdio: 'inherit' });
  log(c.bold + '\x1b[32m✔ Listo. Reiniciá udla-qa para usar la nueva versión.' + c.reset);
  process.exit(0);
}

function help() {
  log(banner());
  log(c.bold + '  Uso:' + c.reset + '  udla-qa <comando> [url]\n');
  log(c.bold + '  Comandos:' + c.reset);
  log('    ' + c.cyan + 'analizar' + c.reset + ' [url]   Pruebas funcionales de QA: genera/recibe casos, los ejecuta y entrega informe');
  log('    ' + c.cyan + 'seguridad' + c.reset + ' [url]  Pentesting OWASP sobre un sitio autorizado + informe de hallazgos');
  log('    ' + c.cyan + 'update' + c.reset + '           Trae la última versión de los comandos');
  log('    ' + c.cyan + 'menu' + c.reset + '             Menú interactivo (por defecto si no pasás comando)');
  log('    ' + c.cyan + 'help' + c.reset + '             Muestra esta ayuda');
  log('    ' + c.cyan + 'version' + c.reset + '          Muestra la versión\n');
  log(c.gray + '  Ej:  udla-qa analizar https://mi-sitio.com' + c.reset);
  log(c.gray + '  Los informes se guardan en qa-reports/ y security-reports/ del directorio actual.' + c.reset + '\n');
}

// Menú interactivo cuando se ejecuta sin comando
function menu() {
  log(banner());
  log(c.bold + '  ¿Qué querés hacer?' + c.reset);
  log('    ' + c.cyan + '1)' + c.reset + ' Analizar una web (QA funcional)');
  log('    ' + c.cyan + '2)' + c.reset + ' Pruebas de seguridad (pentesting OWASP)');
  log('    ' + c.cyan + '3)' + c.reset + ' Actualizar el agente');
  log('    ' + c.cyan + '4)' + c.reset + ' Salir\n');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(c.bold + '  Opción [1-4]: ' + c.reset, (opt) => {
    const choice = opt.trim();
    if (choice === '3') { rl.close(); return update(); }
    if (choice === '4' || choice === '') { rl.close(); process.exit(0); }
    if (choice !== '1' && choice !== '2') { rl.close(); return menu(); }
    rl.question(c.bold + '  URL a probar (Enter para definirla adentro): ' + c.reset, (url) => {
      rl.close();
      runAgent(choice === '1' ? 'qa' : 'qa-seguridad', url.trim());
    });
  });
}

// ---- Router ----
const [, , cmd, ...rest] = process.argv;
const target = rest.join(' ').trim();

switch ((cmd || 'menu').toLowerCase()) {
  case 'analizar': case 'analyze': case 'qa':
    log(banner()); runAgent('qa', target); break;
  case 'seguridad': case 'security': case 'pentest':
    log(banner()); runAgent('qa-seguridad', target); break;
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
