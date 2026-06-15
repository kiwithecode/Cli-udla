'use strict';

// Lanzamiento del agente (Claude Code) y actualización del CLI.
const { spawnSync } = require('node:child_process');
const readline = require('node:readline');
const { banner, c } = require('./banner');
const { log, fail } = require('./util');
const { MCP_CONFIG, PKG_DIR } = require('./config');
const { COMMANDS } = require('./commands');
const { ensureOutputDir, buildPrompt, buildPlanPrompt } = require('./output');

// Verifica que Claude Code esté instalado.
function ensureClaude() {
  const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  if (r.error) {
    fail('No se encontró "claude" (Claude Code).\n' +
      '  Instalalo desde https://claude.com/claude-code y luego ejecutá:  claude  →  /login');
  }
}

// Arma los flags de MCP + herramientas permitidas comunes a toda invocación de claude.
// --allowedTools es variádico: consume todo lo que le siga sin guion, por eso el prompt
// se pasa SIEMPRE después de un flag booleano (-p), nunca pegado a --allowedTools.
function baseArgs(cfg) {
  const args = [];
  if (cfg.playwright) args.push('--mcp-config', MCP_CONFIG, '--strict-mcp-config');
  args.push('--allowedTools', ...cfg.tools.split(' '));
  return args;
}

// Pregunta una línea por consola (Promise).
function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(c.bold + q + c.reset, (a) => { rl.close(); res(a.trim()); }));
}

// Punto de entrada: enruta al flujo con plan (paso 1 propone, paso 2 ejecuta) o al directo.
async function runAgent(key, target, extra) {
  log(banner());
  ensureClaude();
  const cfg = COMMANDS[key];
  if (!cfg) fail('Comando interno desconocido: ' + key);

  if (cfg.plan) return runWithPlan(cfg, target, extra);
  return execute(cfg, target, extra);
}

// Flujo con aprobación: explora la web, propone un plan, lo muestra y espera tu OK.
async function runWithPlan(cfg, target, extra) {
  let scope = extra;
  for (;;) {
    log(c.cyan + '\n› Explorando la web y armando el plan de pruebas…' + c.reset);
    const plan = generatePlan(cfg, target, scope);
    if (!plan) fail('No se pudo generar el plan (¿la URL es accesible?). Reintentá.');

    log('\n' + c.bold + '── Plan de pruebas propuesto ──' + c.reset + '\n');
    log(plan + '\n');

    const ans = await ask('  ¿Ejecuto este plan?  [Enter = sí · n = cancelar · o escribí ajustes]: ');
    const a = ans.toLowerCase();
    if (a === 'n' || a === 'no') { log(c.gray + '› Cancelado.' + c.reset); process.exit(0); }
    if (ans === '' || a === 's' || a === 'si' || a === 'sí' || a === 'y' || a === 'yes') {
      const approved = 'PLAN APROBADO POR EL USUARIO (ejecutá exactamente estos casos):\n' + plan;
      return execute(cfg, target, mergeScope(extra, approved));
    }
    // Cualquier otro texto = ajustes: regenera el plan incorporándolos.
    scope = mergeScope(extra,
      'Ajustá el plan anterior según este pedido del usuario:\n' + ans + '\n\nPlan anterior:\n' + plan);
  }
}

// Genera el plan capturando la salida de claude -p (sin --verbose, para que sea texto limpio).
function generatePlan(cfg, target, extra) {
  const prompt = buildPlanPrompt(cfg, target, extra);
  const args = baseArgs(cfg);
  args.push('-p', prompt);
  const r = spawnSync('claude', args, { encoding: 'utf8', cwd: process.cwd(), maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '').trim();
  if (!out && (r.status !== 0 || r.stderr)) {
    log(c.gray + (r.stderr || '').trim() + c.reset);
  }
  return out;
}

// Ejecuta el comando de punta a punta y escribe el informe en la carpeta de salida.
function execute(cfg, target, extra) {
  const outDir = ensureOutputDir(cfg.tipo);
  log(c.gray + '› Resultados en: ' + outDir + c.reset + '\n');

  const prompt = buildPrompt(cfg, target, outDir, extra);
  const args = baseArgs(cfg);
  args.push('--verbose', '-p', prompt);

  const r = spawnSync('claude', args, { stdio: 'inherit', cwd: process.cwd() });
  process.exit(r.status === null ? 0 : r.status);
}

function mergeScope(a, b) {
  return [a, b].filter(Boolean).join('\n\n');
}

// udla-qa update → trae la última versión del repo y refresca el navegador.
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
  log(c.cyan + '› Verificando navegador de Playwright (MCP)…' + c.reset);
  spawnSync('npx', ['-y', '@playwright/mcp@latest', 'install-browser', 'chrome-for-testing'], { stdio: 'inherit' });
  log(c.bold + '\x1b[32m✔ Listo. Reiniciá udla-qa para usar la nueva versión.' + c.reset);
  process.exit(0);
}

module.exports = { ensureClaude, runAgent, update };
