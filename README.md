# UDLA-QA · Agente CLI de QA y Seguridad

Binario de línea de comandos (`udla-qa`) para automatizar pruebas de aplicaciones web, basado en **Claude Code**.

```text
╭──────────────────────────────────────────────────────────────╮
│  ██╗   ██╗ ██████╗  ██╗       █████╗       ██████╗   █████╗   │
│  ██║   ██║ ██║  ██║ ██║      ███████║      ██║   ██║ ███████║  │
│  ╚██████╔╝ ██████╔╝ ███████╗ ██║  ██║      ╚██████╔╝ ██║  ██║ │
╰──────────────────────────────────────────────────────────────╯
```

- **`udla-qa analizar [url]`** — QA funcional (**caja negra**): genera o recibe casos, los ejecuta en un navegador real, **genera tests automatizados** (Playwright) y entrega un informe.
- **`udla-qa seguridad [url]`** — Pentesting OWASP Top 10 de la web corriendo (**caja negra**) sobre sitios **autorizados** + informe.
- **`udla-qa carga [api]`** — Rendimiento con **k6**: genera y ejecuta pruebas de **carga, estrés y pico**; pregunta cuántos usuarios (VUs) simular.
- **`udla-qa auditar [ruta]`** — Auditoría del **código fuente** de un repo (**caja blanca**) para prevenir vulnerabilidades y fallas.
- **`udla-qa update`** — Trae la última versión de los comandos.
- **`udla-qa`** (sin argumentos) — Menú interactivo.

Usa la **suscripción de Claude Code** de cada usuario (no necesita API key): por debajo invoca el `claude` instalado y logueado en esa PC.

---

## Requisitos (todos los SO)

Primero **verificá si ya los tenés** (si el comando devuelve una versión, está instalado):

```bash
node -v             # Node.js 18+
git --version       # Git
claude --version    # Claude Code
k6 version          # k6 (solo para "udla-qa carga")
```

Si **alguno falta**, instalalo con el comando de tu sistema operativo:

| Requisito | macOS (Homebrew) | Windows (winget) | Linux (Debian/Ubuntu) |
| --- | --- | --- | --- |
| **Node.js 18+** | `brew install node` | `winget install OpenJS.NodeJS` | `curl -fsSL https://deb.nodesource.com/setup_lts.x \| sudo -E bash - && sudo apt-get install -y nodejs` |
| **Git** | `brew install git` | `winget install Git.Git` | `sudo apt-get install -y git` |
| **Claude Code** | `npm install -g @anthropic-ai/claude-code` | `npm install -g @anthropic-ai/claude-code` | `npm install -g @anthropic-ai/claude-code` |
| **k6** (opcional) | `brew install k6` | `winget install k6.k6` | ver bloque Linux abajo |

Después de instalar **Claude Code**, iniciá sesión una sola vez:

```bash
claude              # se abre y te pide iniciar sesión
/login              # entrá con TU cuenta de Claude
```

> Cada usuario usa **su propia** cuenta de Claude y consume **sus propios** tokens. El repo no contiene credenciales.

## Instalación

### Pasos comunes (cualquier SO)

```bash
git clone <URL-DE-TU-REPO> udla-qa
cd udla-qa
npm install        # baja el navegador Chromium para Playwright (postinstall)
npm link           # deja disponible el comando global "udla-qa"
```

Después podés ejecutar `udla-qa` desde cualquier carpeta. (Si preferís no instalarlo global, corré `node bin/udla-qa.js <comando>` desde el repo.)

Abajo, cómo dejar listos los **requisitos** en cada sistema operativo.

### 🍎 macOS

```bash
# Node + git + k6 con Homebrew (https://brew.sh)
brew install node git k6
# Claude Code
npm install -g @anthropic-ai/claude-code
claude            # abrí una vez y ejecutá /login
```

### 🪟 Windows (PowerShell)

```powershell
# Node + git + k6 con winget
winget install OpenJS.NodeJS Git.Git k6.k6
# Claude Code
npm install -g @anthropic-ai/claude-code
claude            # abrí una vez y ejecutá /login
```

> En Windows, usá **PowerShell** o **Windows Terminal** para que el banner ASCII y los colores se vean bien. Si usás WSL, seguí los pasos de Linux.

### 🐧 Linux (Debian/Ubuntu)

```bash
# Node 18+ (NodeSource) y git
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs git
# k6 (repo oficial de Grafana)
sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install -y k6
# Claude Code
npm install -g @anthropic-ai/claude-code
claude            # abrí una vez y ejecutá /login
```

## Uso

```bash
udla-qa                                  # menú interactivo
udla-qa analizar https://mi-sitio.com    # QA funcional (caja negra)
udla-qa seguridad http://localhost:3000  # pentesting web (caja negra)
udla-qa carga https://api.mi-sitio/v1    # carga/estrés/pico con k6
udla-qa auditar ./mi-repo                # auditoría de código (caja blanca)
udla-qa update                           # actualizar
udla-qa help                             # ayuda
```

La primera vez, Claude Code puede pedir permiso para las herramientas de Playwright; aceptá para que el navegador funcione.

### `udla-qa analizar` (caja negra · funcional)

Casos de prueba de tres fuentes posibles:

1. **Carpeta `casos-de-uso/`** (opcional): si dejás archivos ahí (`.md`, `.csv`, `.feature`…), el agente los usa como base.
2. **Describir/pegar** un caso en el momento.
3. **Generar** automáticamente (el agente explora la página).

Ejecuta los casos en navegador real, **genera tests automatizados de Playwright** (en `scripts/`) reutilizables como regresión, y guarda todo en `informes/qa/<fecha-hora>/`.

### `udla-qa seguridad` (caja negra · web corriendo)

Pentesting OWASP. Solo para sitios **propios o con autorización explícita** (o entornos de práctica como [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/) / DVWA). Confirma alcance y autorización antes de empezar. Pruebas **no destructivas** por defecto. Informes en `informes/seguridad/<fecha-hora>/`.

### `udla-qa carga` (rendimiento · k6)

Pregunta el endpoint, **cuántos usuarios virtuales (VUs)** y la duración, genera scripts de **k6** para **carga, estrés y pico** (en `scripts/`), los ejecuta y resume las métricas (latencia p95/p99, RPS, % errores, punto de quiebre) en `informes/carga/<fecha-hora>/`. Solo contra APIs propias/autorizadas; sugiere staging antes que producción.

### `udla-qa auditar` (caja blanca · código)

Analiza el **código fuente** de un repo (sin ejecutarlo) buscando inyección, secretos hardcodeados, fallas de auth/cripto, malas configuraciones y **dependencias vulnerables** (`npm audit`, etc.), con remediación por hallazgo. Es **solo lectura**: no modifica el repo. Informe en `informes/auditoria/<fecha-hora>/`.

## Cómo funciona

```text
udla-qa (binario Node)
   │  arma el prompt del agente + carga el MCP de Playwright
   ▼
claude  (Claude Code, ya logueado → usa tu suscripción)
   │  maneja un navegador real vía Playwright MCP
   ▼
Informe en informes/<tipo>/<fecha-hora>/  (carpeta creada por el binario)
```

## Estructura

El código del binario está separado por lógica en módulos dentro de `lib/`:

```text
.
├── bin/
│   └── udla-qa.js          # entrypoint: solo enruta el comando
├── lib/
│   ├── banner.js           # banner/panel ASCII (con versión)
│   ├── config.js           # rutas y metadatos compartidos
│   ├── commands.js         # registro de comandos (prompt, tools, salida)
│   ├── output.js           # carpetas de entrada/salida + armado del prompt
│   ├── runner.js           # lanza Claude Code y maneja "update"
│   ├── ui.js               # ayuda y menú interactivo
│   └── util.js             # helpers de consola (log, fail)
├── .claude/commands/       # prompts del agente (fuente única)
│   ├── qa.md               # /qa  · analizar
│   ├── qa-seguridad.md     # /qa-seguridad
│   ├── qa-carga.md         # /qa-carga  (k6)
│   ├── qa-auditar.md       # /qa-auditar (caja blanca)
│   └── agent-update.md
├── casos-de-uso/           # casos de uso de entrada (opcional)
├── .mcp.json               # registra el Playwright MCP
├── package.json            # bin "udla-qa" + postinstall (navegador)
├── .gitignore
└── README.md
```

> Los mismos prompts también funcionan como slash-commands (`/qa`, `/qa-seguridad`, `/qa-carga`, `/qa-auditar`) si abrís Claude Code directamente dentro de la carpeta.

## Práctica segura

```bash
docker run --rm -p 3000:3000 bkimminich/juice-shop
udla-qa seguridad http://localhost:3000
```
