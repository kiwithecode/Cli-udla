# UDLA-QA · Agente CLI de QA y Seguridad

Binario de línea de comandos (`udla-qa`) para automatizar pruebas de aplicaciones web, basado en **Claude Code**.

```text
╭──────────────────────────────────────────────────────────────╮
│  ██╗   ██╗ ██████╗  ██╗       █████╗       ██████╗   █████╗   │
│  ██║   ██║ ██║  ██║ ██║      ███████║      ██║   ██║ ███████║  │
│  ╚██████╔╝ ██████╔╝ ███████╗ ██║  ██║      ╚██████╔╝ ██║  ██║ │
╰──────────────────────────────────────────────────────────────╯
```

- **`udla-qa analizar [url]`** — Pruebas funcionales: genera o recibe casos, los ejecuta en un navegador real y entrega un informe.
- **`udla-qa seguridad [url]`** — Pentesting OWASP Top 10 sobre sitios **autorizados** + informe de hallazgos.
- **`udla-qa update`** — Trae la última versión de los comandos.
- **`udla-qa`** (sin argumentos) — Menú interactivo.

Usa la **suscripción de Claude Code** de cada usuario (no necesita API key): por debajo invoca el `claude` instalado y logueado en esa PC.

---

## Requisitos

- [Claude Code](https://claude.com/claude-code) instalado y con sesión iniciada (`claude` → `/login`).
- [Node.js](https://nodejs.org) 18+ (incluye `npx`).

> Cada usuario usa **su propia** cuenta de Claude y consume **sus propios** tokens. El repo no contiene credenciales.

## Instalación

```bash
# 1. Cloná el repo
git clone <URL-DE-TU-REPO> udla-qa
cd udla-qa

# 2. Instalá (baja el navegador Chromium para Playwright automáticamente)
npm install

# 3. Dejá disponible el comando global "udla-qa"
npm link          # o:  npm install -g .
```

Listo. Ya podés ejecutar `udla-qa` desde cualquier carpeta.

> Si no querés instalarlo global, podés correrlo desde el repo con `node bin/udla-qa.js <comando>`.

## Uso

```bash
udla-qa                                  # menú interactivo
udla-qa analizar https://mi-sitio.com    # QA funcional
udla-qa seguridad http://localhost:3000  # pentesting (sitio autorizado)
udla-qa update                           # actualizar
udla-qa help                             # ayuda
```

La primera vez, Claude Code puede pedir permiso para las herramientas de Playwright; aceptá para que el navegador funcione.

### `udla-qa analizar`

Al ejecutarlo elegís cómo probar:

1. **Describir un caso** en lenguaje natural.
2. **Subir/pegar casos** existentes (`.md`, `.csv`, `.feature` o texto).
3. **Generar casos** automáticamente (el agente explora la página).

Los informes se guardan en `informes/qa/<fecha-hora>/` del directorio donde ejecutás el comando (el binario crea la carpeta automáticamente).

### `udla-qa seguridad`

Solo para sitios **propios o con autorización explícita** (o entornos de práctica como [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/) / DVWA). El comando confirma alcance y autorización antes de empezar. Las pruebas son **no destructivas** por defecto. Los informes van a `informes/seguridad/<fecha-hora>/`.

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

```text
.
├── bin/udla-qa.js          # binario CLI (entrypoint)
├── lib/banner.js           # panel/banner ASCII
├── .claude/commands/       # prompts del agente (fuente única)
│   ├── qa.md
│   ├── qa-seguridad.md
│   └── agent-update.md
├── .mcp.json               # registra el Playwright MCP
├── package.json            # bin "udla-qa" + postinstall (navegador)
├── .gitignore
└── README.md
```

> Los mismos prompts también funcionan como slash-commands (`/qa`, `/qa-seguridad`) si abrís Claude Code directamente dentro de la carpeta.

## Práctica segura

```bash
docker run --rm -p 3000:3000 bkimminich/juice-shop
udla-qa seguridad http://localhost:3000
```
