'use strict';

// Rutas y metadatos compartidos por todo el CLI.
const path = require('node:path');

const PKG_DIR = path.join(__dirname, '..');
const MCP_CONFIG = path.join(PKG_DIR, '.mcp.json');
const COMMANDS_DIR = path.join(PKG_DIR, '.claude', 'commands');
const VERSION = require(path.join(PKG_DIR, 'package.json')).version;

// Origen para instalar/actualizar sin clonar (npm install -g <REPO_SPEC>).
const REPO_SPEC = 'github:kiwithecode/Cli-udla';

module.exports = { PKG_DIR, MCP_CONFIG, COMMANDS_DIR, VERSION, REPO_SPEC };
