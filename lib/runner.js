'use strict';

// Lanzamiento del agente (Claude Code) y actualización del CLI.
const { spawnSync } = require('node:child_process');
const { banner, c } = require('./banner');
const { log, fail } = require('./util');
const { MCP_CONFIG, PKG_DIR } = require('./config');
const { COMMANDS } = require('./commands');
const { ensureOutputDir, buildPrompt } = require('./output');

// Verifica que Claude Code esté instalado.
function ensureClaude() {
  const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  if (r.error) {
    fail('No se encontró "claude" (Claude Code).\n' +
      '  Instalalo desde https://claude.com/claude-code y luego ejecutá:  claude  →  /login');
  }
}

// Lanza Claude Code en modo interactivo con el prompt (y el MCP de Playwright si aplica).
function runAgent(key, target) {
  log(banner());
  ensureClaude();
  const cfg = COMMANDS[key];
  if (!cfg) fail('Comando interno desconocido: ' + key);

  const outDir = ensureOutputDir(cfg.tipo);
  log(c.gray + '› Resultados en: ' + outDir + c.reset + '\n');

  const prompt = buildPrompt(cfg, target, outDir);
  const args = [];
  if (cfg.playwright) args.push('--mcp-config', MCP_CONFIG, '--strict-mcp-config');
  args.push('--allowedTools', cfg.tools, prompt);

  const r = spawnSync('claude', args, { stdio: 'inherit', cwd: process.cwd() });
  process.exit(r.status === null ? 0 : r.status);
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
  log(c.cyan + '› Verificando navegador de Playwright…' + c.reset);
  spawnSync('npx', ['-y', 'playwright', 'install', 'chromium'], { stdio: 'inherit' });
  log(c.bold + '\x1b[32m✔ Listo. Reiniciá udla-qa para usar la nueva versión.' + c.reset);
  process.exit(0);
}

module.exports = { ensureClaude, runAgent, update };
