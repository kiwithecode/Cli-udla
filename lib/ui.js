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
function menu() {
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
    1: '  URL a probar (Enter para definirla adentro): ',
    2: '  URL a probar (Enter para definirla adentro): ',
    3: '  URL de la API a probar (Enter para definirla adentro): ',
    4: '  Ruta del repo a auditar (Enter = directorio actual): ',
  };

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(c.bold + '  Opción [1-6]: ' + c.reset, (opt) => {
    const choice = opt.trim();
    if (choice === '5') { rl.close(); return update(); }
    if (choice === '6' || choice === '') { rl.close(); process.exit(0); }
    if (!KEYS[choice]) { rl.close(); return menu(); }
    rl.question(c.bold + ASKS[choice] + c.reset, (val) => {
      rl.close();
      runAgent(KEYS[choice], val.trim());
    });
  });
}

module.exports = { help, menu };
