'use strict';

// Interfaz de consola: ayuda y menú interactivo.
const readline = require('node:readline');
const { banner, c } = require('./banner');
const { log } = require('./util');
const { runAgent, update } = require('./runner');

function help() {
  log(banner());
  log(c.bold + '  Uso:' + c.reset + '  udla-qa <comando> [url|ruta]\n');
  log(c.bold + '  Comandos:' + c.reset);
  log('    ' + c.cyan + 'analizar' + c.reset + '  [url]    QA funcional (caja negra): casos + ejecución + tests automatizados + informe');
  log('    ' + c.cyan + 'seguridad' + c.reset + ' [url]    Pentesting OWASP de la web corriendo (caja negra) + hallazgos');
  log('    ' + c.cyan + 'carga' + c.reset + '     [api]    Pruebas de rendimiento con k6 (carga, estrés, pico) — pregunta # de usuarios');
  log('    ' + c.cyan + 'auditar' + c.reset + '   [ruta]   Análisis del código fuente de un repo (caja blanca) para prevenir fallas');
  log('    ' + c.cyan + 'update' + c.reset + '             Trae la última versión de los comandos');
  log('    ' + c.cyan + 'menu' + c.reset + '               Menú interactivo (por defecto si no pasás comando)');
  log('    ' + c.cyan + 'help' + c.reset + '               Muestra esta ayuda\n');
  log(c.gray + '  Ej:  udla-qa analizar https://mi-sitio.com' + c.reset);
  log(c.gray + '       udla-qa carga https://api.mi-sitio.com/v1' + c.reset);
  log(c.gray + '       udla-qa auditar ./mi-repo' + c.reset);
  log(c.gray + '  Casos de uso de entrada (opcional): carpeta casos-de-uso/ del directorio actual.' + c.reset);
  log(c.gray + '  Resultados: informes/<tipo>/<fecha-hora>/ del directorio actual.' + c.reset + '\n');
}

// Menú interactivo cuando se ejecuta sin comando.
// TODAS las preguntas se hacen acá, dentro del CLI. Recién con las respuestas
// se lanza el agente (claude -p), que corre autónomo sin abrir Claude Code.
async function menu() {
  log(banner());
  log(c.bold + '  ¿Qué querés hacer?' + c.reset);
  log('    ' + c.cyan + '1)' + c.reset + ' Analizar una web (QA funcional · caja negra)');
  log('    ' + c.cyan + '2)' + c.reset + ' Pruebas de seguridad (pentesting OWASP · caja negra)');
  log('    ' + c.cyan + '3)' + c.reset + ' Pruebas de carga/estrés/pico con k6');
  log('    ' + c.cyan + '4)' + c.reset + ' Auditar código de un repo (caja blanca)');
  log('    ' + c.cyan + '5)' + c.reset + ' Actualizar el agente');
  log('    ' + c.cyan + '6)' + c.reset + ' Salir\n');

  const KEYS = { 1: 'qa', 2: 'seguridad', 3: 'carga', 4: 'auditar' };
  const ASKS = {
    1: '  URL a probar: ',
    2: '  URL a probar: ',
    3: '  URL de la API a probar: ',
    4: '  Ruta del repo a auditar (Enter = directorio actual): ',
  };

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(c.bold + q + c.reset, (a) => res(a.trim())));

  try {
    // Pedimos la opción en un bucle: una entrada inválida vuelve a preguntar
    // sin recursión (evita inflar la pila con stdin redirigido).
    let choice;
    for (;;) {
      choice = await ask('  Opción [1-6]: ');
      if (choice === '5') { rl.close(); return update(); }
      if (choice === '6' || choice === '') { rl.close(); return process.exit(0); }
      if (KEYS[choice]) break;
      log(c.gray + '  Opción inválida. Elegí un número del 1 al 6.' + c.reset);
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
  // QA funcional y seguridad: cómo definir los casos a probar.
  if (choice === '1' || choice === '2') {
    log('\n  ' + c.bold + '¿Qué querés probar?' + c.reset);
    log('    ' + c.cyan + '1)' + c.reset + ' Describir un caso en lenguaje natural');
    log('    ' + c.cyan + '2)' + c.reset + ' Indicar la ruta de un archivo de casos existente (.md/.csv/.feature)');
    log('    ' + c.cyan + '3)' + c.reset + ' Generar los casos automáticamente (explorar la web)');
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
  if (choice === '3') {
    const vus = await ask('  Usuarios virtuales (VUs) concurrentes (Enter = 50): ');
    const dur = await ask('  Duración por escenario (ej: 30s, 2m) (Enter = 1m): ');
    return 'Parámetros de carga: ' +
      (vus || '50') + ' usuarios virtuales (VUs), duración ' + (dur || '1m') +
      ' por escenario (carga, estrés y pico).';
  }

  // Auditar: sin preguntas extra.
  return '';
}

module.exports = { help, menu };
