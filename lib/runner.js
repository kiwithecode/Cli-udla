'use strict';

// Lanzamiento del agente (Claude Code) y actualización del CLI.
const path = require('node:path');
const readline = require('node:readline');
const { banner, c } = require('./banner');
const { log, fail } = require('./util');
const { MCP_CONFIG, PKG_DIR } = require('./config');
const { COMMANDS } = require('./commands');
const { ensureOutputDir, buildPrompt, buildPlanPrompt } = require('./output');
const spinner = require('./spinner');
const { run, runSync } = require('./proc');
const s = require('./style');

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

    log('\n' + s.block('Plan de pruebas propuesto', plan) + '\n');

    const ans = await ask('  ' + c.bold + '¿Ejecuto este plan?' + c.reset +
      c.gray + '  [Enter = sí · n = cancelar · o escribí ajustes]: ' + c.reset);
    const a = ans.toLowerCase();
    if (a === 'n' || a === 'no') { log(s.hint('› Cancelado.')); process.exit(0); }
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
    let errBuf = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { errBuf += d; });
    child.on('error', (e) => {
      sp.fail('No se pudo generar el plan');
      log(s.info(String(e.message || e)));
      resolve('');
    });
    child.on('close', (status) => {
      const plan = out.trim();
      if (plan) {
        sp.succeed('Plan de pruebas listo');
      } else {
        sp.fail('No se pudo generar el plan');
        if (status !== 0 || errBuf) log(s.info(errBuf.trim()));
      }
      resolve(plan);
    });
    child.stdin.end(prompt);
  });
}

// Ejecuta el comando de punta a punta y escribe el informe en la carpeta de salida.
// Mientras dura el análisis se muestra una barra de progreso 1→100%; al terminar
// salta a 100%. La salida cruda de Claude se captura en silencio y solo se vuelca
// si hubo error (el detalle queda en el informe.md de la carpeta de salida).
function execute(cfg, target, extra) {
  const outDir = ensureOutputDir(cfg.tipo);
  log(s.kv('Resultados', outDir) + '\n');

  const prompt = buildPrompt(cfg, target, outDir, extra);
  const args = baseArgs(cfg);
  args.push('-p'); // el prompt va por stdin (evita quoting en Windows); sin --verbose

  return new Promise((resolve) => {
    // El análisis completo suele tardar varios minutos: estimación más lenta.
    const sp = spinner.start('Analizando — generando casos, ejecutando e informe', { estimateMs: 180000 });
    const child = run('claude', args, { cwd: process.cwd() });
    let buf = '';
    let done = false;
    const finish = (status) => {
      if (done) return;
      done = true;
      if (status === 0) {
        sp.succeed('Análisis completado');
        log(s.kv('Informe', path.join(outDir, 'informe.md')));
      } else {
        sp.fail('El agente terminó con errores');
        if (buf.trim()) log(s.info(buf.trim()));
      }
      resolve();
      process.exit(status === null ? 0 : status);
    };
    child.stdout.on('data', (d) => { buf += d; });
    child.stderr.on('data', (d) => { buf += d; });
    child.on('error', (e) => { buf += String(e.message || e); finish(-1); });
    child.on('close', (status) => finish(status));
    child.stdin.end(prompt);
  });
}

function mergeScope(a, b) {
  return [a, b].filter(Boolean).join('\n\n');
}

// udla-qa update → trae la última versión del repo y refresca el navegador.
async function update() {
  log(s.step('Actualizando UDLA-QA…'));
  const isGit = runSync('git', ['-C', PKG_DIR, 'rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' });
  if (isGit.status === 0) {
    // Mostramos de dónde se va a actualizar antes de bajar código (transparencia
    // de la cadena de confianza: si el origin no es el esperado, se ve acá).
    const origin = runSync('git', ['-C', PKG_DIR, 'remote', 'get-url', 'origin'], { encoding: 'utf8' });
    if (origin.status === 0) {
      log(s.kv('Origen', (origin.stdout || '').trim()));
    }
    const pull = runSync('git', ['-C', PKG_DIR, 'pull', '--ff-only'], { stdio: 'inherit' });
    if (pull.status !== 0) {
      log(s.warn('No se pudo actualizar por fast-forward (suele ser por cambios locales;'));
      log(s.info('en Windows, a veces solo fin de línea CRLF/LF). Para forzar la actualización:'));
      log(s.info(c.bold + 'git -C "' + PKG_DIR + '" reset --hard origin/main' + c.reset));
    }
  } else {
    log(s.info('Instalación no-git: volvé a instalar con  npm install -g <repo>  para actualizar.'));
  }

  // El download del navegador puede tardar; spinner para que no parezca colgado.
  await spawnSpin(
    'npx', ['-y', '@playwright/mcp@latest', 'install-browser', 'chrome-for-testing'],
    'Verificando navegador de Playwright (MCP)',
    'Navegador de Playwright listo',
    'No se pudo preparar el navegador de Playwright'
  );

  log('\n' + s.ok('Listo. Reiniciá udla-qa para usar la nueva versión.'));
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
