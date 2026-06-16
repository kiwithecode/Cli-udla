'use strict';

// Rutas y metadatos compartidos por todo el CLI.
const path = require('node:path');

const PKG_DIR = path.join(__dirname, '..');
const MCP_CONFIG = path.join(PKG_DIR, '.mcp.json');
const COMMANDS_DIR = path.join(PKG_DIR, '.claude', 'commands');
const PKG = require(path.join(PKG_DIR, 'package.json'));
const VERSION = PKG.version;
const PKG_NAME = PKG.name; // 'udla-qa' (paquete publicado en npm)

// Orígenes para instalar/actualizar sin clonar:
//  - npm (canónico):   npm install -g udla-qa@latest
//  - GitHub (fallback): npm install -g github:kiwithecode/Cli-udla
const REPO_SPEC = 'github:kiwithecode/Cli-udla';

module.exports = { PKG_DIR, MCP_CONFIG, COMMANDS_DIR, VERSION, PKG_NAME, REPO_SPEC };
