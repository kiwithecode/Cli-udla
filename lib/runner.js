'use strict';

// Lanzamiento del agente (Claude Code) y actualización del CLI.
const readline = require('node:readline');
const { banner, c } = require('./banner');
const { log, fail } = require('./util');
const { MCP_CONFIG, PKG_DIR } = require('./config');
const { COMMANDS } = require('./commands');
const { ensureOutputDir, buildPrompt, buildPlanPrompt } = require('./output');
const spinner = require('./spinner');
const { run, runSync } = require('./proc');

// Verifica que Claude Code esté instalado.
function ensureClaude() {
  const r = runSync('claude', ['--version'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) {
    const why = r.error ? r.error.message : 'salió con código ' + r.status;
    fail('No se pudo ejecutar "claude" (Claude Code): ' + why + '.\n' +
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
    log('');
    const plan = await generatePlan(cfg, target, scope);
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
// Usa spawn ASÍNCRONO para que el spinner pueda animarse mientras la IA trabaja.
function generatePlan(cfg, target, extra) {
  const prompt = buildPlanPrompt(cfg, target, extra);
  const args = baseArgs(cfg);
  args.push('-p'); // el prompt va por stdin (evita problemas de quoting en Windows)

  return new Promise((resolve) => {
    const sp = spinner.start('Explorando la web y armando el plan de pruebas');
    const child = run('claude', args, { cwd: process.cwd() });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => {
      sp.fail('No se pudo generar el plan');
      log(c.gray + String(e.message || e) + c.reset);
      resolve('');
    });
    child.on('close', (status) => {
      const plan = out.trim();
      if (plan) {
        sp.succeed('Plan de pruebas listo');
      } else {
        sp.fail('No se pudo generar el plan');
        if (status !== 0 || err) log(c.gray + err.trim() + c.reset);
      }
      resolve(plan);
    });
    child.stdin.end(prompt);
  });
}

// Ejecuta el comando de punta a punta y escribe el informe en la carpeta de salida.
// Spinner mientras la IA arranca; en cuanto produce la primera salida, lo apaga
// y deja correr el log en vivo (--verbose) de Claude Code.
function execute(cfg, target, extra) {
  const outDir = ensureOutputDir(cfg.tipo);
  log(c.gray + '› Resultados en: ' + outDir + c.reset + '\n');

  const prompt = buildPrompt(cfg, target, outDir, extra);
  const args = baseArgs(cfg);
  args.push('--verbose', '-p'); // el prompt va por stdin (evita quoting en Windows)

  return new Promise((resolve) => {
    const sp = spinner.start('Iniciando el agente de QA');
    const child = run('claude', args, { cwd: process.cwd() });
    let started = false;
    const onFirst = () => { if (!started) { started = true; sp.succeed('Agente en marcha'); } };
    child.stdout.on('data', (d) => { onFirst(); process.stdout.write(d); });
    child.stderr.on('data', (d) => { onFirst(); process.stderr.write(d); });
    child.on('error', (e) => {
      if (!started) { started = true; sp.fail('No se pudo iniciar el agente'); }
      log(c.gray + String(e.message || e) + c.reset);
    });
    child.on('close', (status) => {
      if (!started) sp.stop();
      resolve();
      process.exit(status === null ? 0 : status);
    });
    child.stdin.end(prompt);
  });
}

function mergeScope(a, b) {
  return [a, b].filter(Boolean).join('\n\n');
}

// udla-qa update → trae la última versión del repo y refresca el navegador.
async function update() {
  log(c.cyan + '› Actualizando UDLA-QA…' + c.reset);
  const isGit = runSync('git', ['-C', PKG_DIR, 'rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' });
  if (isGit.status === 0) {
    // Mostramos de dónde se va a actualizar antes de bajar código (transparencia
    // de la cadena de confianza: si el origin no es el esperado, se ve acá).
    const origin = runSync('git', ['-C', PKG_DIR, 'remote', 'get-url', 'origin'], { encoding: 'utf8' });
    if (origin.status === 0) {
      log(c.gray + '  Origen: ' + (origin.stdout || '').trim() + c.reset);
    }
    const pull = runSync('git', ['-C', PKG_DIR, 'pull', '--ff-only'], { stdio: 'inherit' });
    if (pull.status !== 0) {
      log(c.gray + '  (No se pudo actualizar por fast-forward. Suele ser por cambios locales\n' +
        '   (en Windows, a veces solo fin de línea CRLF/LF). Para forzar la actualización:\n' +
        '     git -C "' + PKG_DIR + '" reset --hard origin/main' + c.reset);
    }
  } else {
    log(c.gray + '  Instalación no-git: volvé a instalar con  npm install -g <repo>  para actualizar.' + c.reset);
  }

  // El download del navegador puede tardar; spinner para que no parezca colgado.
  await spawnSpin(
    'npx', ['-y', '@playwright/mcp@latest', 'install-browser', 'chrome-for-testing'],
    'Verificando navegador de Playwright (MCP)',
    'Navegador de Playwright listo',
    'No se pudo preparar el navegador de Playwright'
  );

  log(c.bold + '\x1b[32m✔ Listo. Reiniciá udla-qa para usar la nueva versión.' + c.reset);
  process.exit(0);
}

// Corre un proceso con spinner animado, capturando su salida y mostrándola solo si falla.
function spawnSpin(cmd, args, running, ok, ko) {
  return new Promise((resolve) => {
    const sp = spinner.start(running);
    const child = run(cmd, args, { cwd: process.cwd() });
    let buf = '';
    let done = false;
    const finish = (status) => {
      if (done) return;
      done = true;
      if (status === 0) { sp.succeed(ok); }
      else { sp.fail(ko); if (buf.trim()) log(c.gray + buf.trim() + c.reset); }
      resolve(status);
    };
    child.stdout.on('data', (d) => { buf += d; });
    child.stderr.on('data', (d) => { buf += d; });
    // 'error' (p. ej. ENOENT) puede no emitir 'close': cerramos acá igual.
    child.on('error', (e) => { buf += String(e.message || e); finish(-1); });
    child.on('close', (status) => finish(status));
  });
}

module.exports = { ensureClaude, runAgent, update };
