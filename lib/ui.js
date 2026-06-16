'use strict';

// Interfaz de consola: ayuda y menú interactivo.
const fs = require('node:fs');
const readline = require('node:readline');
const { banner, c } = require('./banner');
const { log } = require('./util');
const { runAgent, update } = require('./runner');
const s = require('./style');

// Fila de comando alineada:  nombre  [arg]   descripción
function cmdRow(name, arg, desc) {
  const left = '  ' + c.cyan + c.bold + name.padEnd(10) + c.reset + c.gray + arg.padEnd(8) + c.reset;
  return left + '  ' + desc;
}

function help() {
  log(banner());
  log(s.hr('Uso'));
  log('  ' + c.bold + 'udla-qa' + c.reset + ' <comando> ' + c.gray + '[url|ruta]' + c.reset + '\n');
  log(s.hr('Comandos'));
  log(cmdRow('analizar', '[url]', 'QA funcional (caja negra): casos + ejecución + tests + informe'));
  log(cmdRow('seguridad', '[url]', 'Pentesting OWASP de la web corriendo (caja negra) + hallazgos'));
  log(cmdRow('carga', '[api]', 'Rendimiento con k6 (carga, estrés, pico) — pregunta # de usuarios'));
  log(cmdRow('servicio', '[url]', 'Pruebas de API REST: casos + colección Postman + run + ✅/❌'));
  log(cmdRow('auditar', '[ruta]', 'Análisis del código fuente de un repo (caja blanca)'));
  log(cmdRow('update', '', 'Trae la última versión de los comandos'));
  log(cmdRow('menu', '', 'Menú interactivo (por defecto si no pasás comando)'));
  log(cmdRow('help', '', 'Muestra esta ayuda') + '\n');
  log(s.hr('Ejemplos'));
  log(s.hint('  udla-qa analizar https://mi-sitio.com'));
  log(s.hint('  udla-qa servicio https://api.mi-sitio.com/v1/usuarios'));
  log(s.hint('  udla-qa carga https://api.mi-sitio.com/v1'));
  log(s.hint('  udla-qa auditar ./mi-repo') + '\n');
  log(s.info('Entrada (opcional): carpeta  casos-de-uso/  del directorio actual.'));
  log(s.info('Resultados:        informes/<tipo>/<fecha-hora>/  del directorio actual.') + '\n');
}

// Fila de opción del menú:  N)  descripción
function menuRow(n, desc) {
  return '   ' + c.wine + c.bold + n + c.reset + c.cyan + ')' + c.reset + '  ' + desc;
}

// Menú interactivo cuando se ejecuta sin comando.
// TODAS las preguntas se hacen acá, dentro del CLI. Recién con las respuestas
// se lanza el agente (claude -p), que corre autónomo sin abrir Claude Code.
async function menu() {
  log(banner());
  log(s.hr('¿Qué querés hacer?') + '\n');
  log(menuRow(1, 'Analizar una web ' + c.gray + '(QA funcional · caja negra)' + c.reset));
  log(menuRow(2, 'Pruebas de seguridad ' + c.gray + '(pentesting OWASP · caja negra)' + c.reset));
  log(menuRow(3, 'Pruebas de carga/estrés/pico ' + c.gray + 'con k6' + c.reset));
  log(menuRow(4, 'Auditar código de un repo ' + c.gray + '(caja blanca)' + c.reset));
  log(menuRow(5, 'Probar una API/servicio REST ' + c.gray + '(casos + Postman + run + ✅/❌)' + c.reset));
  log(menuRow(6, 'Actualizar el agente'));
  log(menuRow(7, 'Salir') + '\n');

  const KEYS = { 1: 'qa', 2: 'seguridad', 3: 'carga', 4: 'auditar', 5: 'servicio' };
  const ASKS = {
    1: '  URL a probar: ',
    2: '  URL a probar: ',
    3: '  URL de la API a probar: ',
    4: '  Ruta del repo a auditar (Enter = directorio actual): ',
    5: '  URL del endpoint a probar: ',
  };

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(c.bold + q + c.reset, (a) => res(a.trim())));

  try {
    // Pedimos la opción en un bucle: una entrada inválida vuelve a preguntar
    // sin recursión (evita inflar la pila con stdin redirigido).
    let choice;
    for (;;) {
      choice = await ask('  Opción [1-7]: ');
      if (choice === '6') { rl.close(); return update(); }
      if (choice === '7' || choice === '') { rl.close(); return process.exit(0); }
      if (KEYS[choice]) break;
      log(s.warn('Opción inválida. Elegí un número del 1 al 7.'));
    }

    const target = await ask(ASKS[choice]);
    const extra = await askScope(choice, ask);
    rl.close();
    await runAgent(KEYS[choice], target, extra);
  } catch (e) {
    rl.close();
    throw e;
  }
}

// Preguntas de alcance según el comando elegido. Devuelve un texto que se inyecta
// al prompt del agente como instrucciones del usuario (puede ser '').
async function askScope(choice, ask) {
  if (choice === '1' || choice === '2') return askCasos(ask);   // QA funcional / seguridad
  if (choice === '3') return askCarga(ask);                     // carga k6
  if (choice === '5') return askServicio(ask);                  // API REST
  return ''; // auditar: sin preguntas extra
}

// QA funcional y seguridad: cómo definir los casos a probar.
async function askCasos(ask) {
  log('\n' + s.hr('¿Qué querés probar?') + '\n');
  log(menuRow(1, 'Describir un caso en lenguaje natural'));
  log(menuRow(2, 'Indicar la ruta de un archivo de casos ' + c.gray + '(.md/.csv/.feature)' + c.reset));
  log(menuRow(3, 'Generar los casos automáticamente ' + c.gray + '(explorar la web)' + c.reset) + '\n');
  const k = await ask('  Opción [1-3] (Enter = 3): ');
  if (k === '1') {
    const txt = await ask('  Describí el caso: ');
    return txt ? 'Caso de prueba a cubrir (en lenguaje natural):\n' + txt : '';
  }
  if (k === '2') {
    const ruta = await ask('  Ruta del archivo de casos: ');
    return ruta ? 'Leé y usá como base los casos del archivo: ' + ruta : '';
  }
  return 'Generá los casos automáticamente explorando la web.';
}

// Carga: parámetros del escenario k6.
async function askCarga(ask) {
  const vus = await ask('  Usuarios virtuales (VUs) concurrentes (Enter = 50): ');
  const dur = await ask('  Duración por escenario (ej: 30s, 2m) (Enter = 1m): ');
  return 'Parámetros de carga: ' +
    (vus || '50') + ' usuarios virtuales (VUs), duración ' + (dur || '1m') +
    ' por escenario (carga, estrés y pico).';
}

// Servicio (API REST): método, headers/auth, delay y body.
async function askServicio(ask) {
  const method = (await ask('  Método HTTP [GET/POST/PUT/PATCH/DELETE] (Enter = GET): ') || 'GET').toUpperCase();
  const headers = await ask('  Headers/Auth (ej: Authorization: Bearer xxx; Content-Type: application/json) (Enter = ninguno): ');
  const delay = await ask('  Delay entre requests en ms (Enter = 0): ');

  let body = '';
  if (method !== 'GET' && method !== 'DELETE') {
    const raw = await ask('  Body: pegá JSON en una línea, o ruta a un .json (Enter = sin body): ');
    body = readBodyMaybe(raw);
  }

  return [
    'Servicio/API a probar (REST):',
    '- Método HTTP: ' + method,
    '- Endpoint: el indicado arriba.',
    headers ? '- Headers/Auth: ' + headers : '- Headers/Auth: ninguno indicado.',
    '- Delay entre requests: ' + (delay || '0') + ' ms',
    body ? '- Body del request:\n' + body : '- Body del request: no aplica.',
  ].join('\n');
}

// Si el texto es una ruta a un archivo existente, devuelve su contenido; si no,
// devuelve el texto tal cual (JSON inline). '' si no hay nada.
function readBodyMaybe(raw) {
  if (!raw) return '';
  try {
    if (fs.existsSync(raw) && fs.statSync(raw).isFile()) {
      return fs.readFileSync(raw, 'utf8').trim();
    }
  } catch { /* no es ruta legible: lo tratamos como JSON inline */ }
  return raw;
}

module.exports = { help, menu };
