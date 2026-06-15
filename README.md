# Agente QA CLI

Agente de QA basado en **Claude Code** con dos comandos listos para usar:

- **`/qa`** — Analiza una página web, recibe o genera casos de prueba, los ejecuta en un navegador real y entrega un informe.
- **`/qa-seguridad`** — Pruebas de seguridad / pentesting (OWASP Top 10) sobre sitios **autorizados**, con informe de hallazgos.
- **`/agent-update`** — Trae la última versión de los comandos y la config desde el repositorio.

Funciona con tu **suscripción de Claude Code** (no necesita API key). Es portable: cloná el repo en cualquier PC y los comandos aparecen solos.

## Cada usuario usa su propia cuenta

Claude Code usa **la cuenta logueada en cada PC**. El repo no contiene credenciales. Cada usuario:

```bash
claude        # si no hay sesión, ofrece iniciarla
/login        # inicia sesión con SU cuenta de Claude
```

A partir de ahí, al correr `/qa` o `/qa-seguridad` cada quien **consume sus propios tokens/suscripción**.

---

## Requisitos

- [Claude Code](https://claude.com/claude-code) instalado y con sesión iniciada (`claude`).
- [Node.js](https://nodejs.org) 18+ (incluye `npx`).

## Instalación

```bash
# 1. Cloná o descargá este repo
git clone <URL-DE-TU-REPO> agente-udla
cd agente-udla

# 2. (Una sola vez por PC) instalá el navegador para Playwright
npx -y playwright install chromium

# 3. Abrí Claude Code dentro de la carpeta
claude
```

La primera vez Claude Code te va a preguntar si confiás en el `.mcp.json` del proyecto (Playwright MCP) y si permitís las herramientas `mcp__playwright__*`. Aceptá (podés usar "always allow").

## Uso

Dentro de una sesión de Claude Code, parado en esta carpeta:

```
/qa https://mi-sitio.com
/qa-seguridad https://staging.mi-app.com
```

También podés escribir solo `/qa` y el agente te irá pidiendo la URL y el alcance.

### `/qa` — opciones de prueba
Al ejecutarlo elegís cómo probar:
1. **Describir un caso** en lenguaje natural.
2. **Subir/pegar casos** existentes (`.md`, `.csv`, `.feature` o texto).
3. **Generar casos** automáticamente (el agente explora la página).

Los informes se guardan en `qa-reports/` (en la carpeta desde donde ejecutás).

### `/qa-seguridad` — importante
Solo para sitios **propios o con autorización explícita** (o entornos de práctica como [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/) / DVWA). El comando confirma el alcance y la autorización antes de empezar. Las pruebas son **no destructivas** por defecto. Los informes van a `security-reports/`.

## Estructura

```text
.
├── .claude/
│   └── commands/
│       ├── qa.md             # comando /qa
│       ├── qa-seguridad.md   # comando /qa-seguridad
│       └── agent-update.md   # comando /agent-update
├── .mcp.json                 # registra el Playwright MCP (navegador real)
├── .gitignore
└── README.md
```

## Actualizar a la última versión

Dentro de Claude Code, parado en la carpeta del proyecto:

```text
/agent-update
```

Hace `git pull`, actualiza el navegador de Playwright si hace falta y te avisa qué cambió. Después reiniciá Claude Code para recargar los comandos.

## Práctica segura (recomendado)

Para probar `/qa-seguridad` sin riesgo, levantá un entorno vulnerable local:

```bash
docker run --rm -p 3000:3000 bkimminich/juice-shop
# luego: /qa-seguridad http://localhost:3000
```
