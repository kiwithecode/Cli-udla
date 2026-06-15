'use strict';

// Registro de comandos del agente. Cada uno define:
//   prompt     → archivo .md en .claude/commands/ con las instrucciones
//   tipo       → subcarpeta de salida en informes/<tipo>/
//   playwright → si necesita el navegador (Playwright MCP)
//   casos      → si admite la carpeta de entrada casos-de-uso/
//   tools      → herramientas permitidas sin pedir confirmación
const COMMANDS = {
  qa: {
    prompt: 'qa', tipo: 'qa', playwright: true, casos: true,
    tools: 'mcp__playwright Read Write Glob Grep TodoWrite WebFetch Bash',
  },
  seguridad: {
    prompt: 'qa-seguridad', tipo: 'seguridad', playwright: true, casos: false,
    tools: 'mcp__playwright Read Write Glob Grep TodoWrite WebFetch Bash',
  },
  carga: {
    prompt: 'qa-carga', tipo: 'carga', playwright: false, casos: false,
    tools: 'Read Write Glob Grep TodoWrite Bash',
  },
  auditar: {
    prompt: 'qa-auditar', tipo: 'auditoria', playwright: false, casos: false,
    tools: 'Read Write Glob Grep TodoWrite Bash',
  },
};

module.exports = { COMMANDS };
