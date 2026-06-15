---
description: Actualiza el agente a la última versión (trae los comandos y MCP más recientes del repositorio)
allowed-tools: Bash, Read
---

Sos el actualizador del Agente QA CLI. Tu trabajo es traer la última versión de los comandos y la configuración desde el repositorio remoto, de forma segura.

## Pasos

1. **Verificá que estás en el repo**: corré `git rev-parse --show-toplevel`. Si falla (no es un repo git), avisá al usuario que debe ejecutar el comando dentro de la carpeta del proyecto clonado y detené el proceso.

2. **Revisá cambios locales**: corré `git status --porcelain`.
   - Si hay cambios locales sin commitear en archivos versionados (no en `qa-reports/` ni `security-reports/`), avisá al usuario y preguntá si querés (a) guardarlos con `git stash` antes de actualizar, o (b) cancelar. No pises trabajo del usuario sin confirmación.

3. **Mostrá la versión actual**: `git log -1 --oneline`.

4. **Traé lo último**: `git fetch --all` y luego `git pull --ff-only` desde la rama actual.
   - Si el `--ff-only` falla por divergencia, explicá la situación y ofrecé opciones (rebase, merge o revisar manualmente). No fuerces.

5. **Mostrá qué cambió**: `git log --oneline <hash_anterior>..HEAD` y, si cambiaron los comandos, listá los archivos modificados en `.claude/commands/` y `.mcp.json` con `git diff --name-only <hash_anterior>..HEAD`.

6. **Actualizá el navegador de Playwright** (por si cambió la versión del MCP): corré `npx -y playwright install chromium`. Es idempotente; si ya está, no hace nada.

7. **Resumen final**: indicá al usuario
   - de qué versión a qué versión se actualizó,
   - qué comandos/archivos cambiaron,
   - y que **reinicie Claude Code** (cerrar y volver a abrir, o `/exit` y `claude`) para recargar los comandos y el `.mcp.json` actualizados.

## Reglas
- Nunca borres ni sobrescribas cambios locales del usuario sin confirmación explícita.
- Si no hay actualizaciones (`Already up to date`), decilo claramente y terminá.
- No toques los informes en `qa-reports/` ni `security-reports/`.
