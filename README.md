# UDLA-QA · Agente CLI de QA y Seguridad

[![npm](https://img.shields.io/npm/v/udla-qa.svg)](https://www.npmjs.com/package/udla-qa)
[![node](https://img.shields.io/node/v/udla-qa.svg)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/udla-qa.svg)](LICENSE)

Binario de línea de comandos (`udla-qa`) para automatizar pruebas de aplicaciones web y APIs, basado en **Claude Code**. Genera casos, ejecuta en un navegador/API reales y entrega un **informe** — todo desde la terminal.

```text
██╗   ██╗ ██████╗  ██╗       █████╗       ██████╗   █████╗
██║   ██║ ██║  ██║ ██║      ███████║      ██║   ██║ ███████║
╚██████╔╝ ██████╔╝ ███████╗ ██║  ██║      ╚██████╔╝ ██║  ██║
 ╚═════╝  ╚═════╝  ╚══════╝ ╚═╝  ╚═╝       ╚═════╝  ╚═╝  ╚═╝
        Desarrollado por Kevin Armas · Universidad de Las Américas
```

> Usa la **suscripción de Claude Code** de cada usuario (no necesita API key): por debajo invoca el `claude` instalado y logueado en esa PC. Cada uno consume **sus propios** tokens; el repo no contiene credenciales.

---

## Comandos

| Comando | Tipo | Qué hace |
| --- | --- | --- |
| `udla-qa analizar [url]` | Web · caja negra | Genera/recibe casos, los ejecuta en un navegador real, **genera tests Playwright** y entrega informe. **Asistido**: propone un plan y lo aprobás. |
| `udla-qa servicio [url]` | API REST · caja negra | Pruebas de API: casos (con ✅/❌), **colección Postman** ejecutable, corre el run (newman/curl) e informa. **Asistido** + soporta **archivo** de varios endpoints. |
| `udla-qa movil [app]` | App móvil · caja negra | Apps **Flutter/nativas** (Android/iOS) con **Maestro**: genera flujos, los corre en emulador/simulador y reporta ✅/❌. **Asistido**. |
| `udla-qa seguridad [url]` | Web · caja negra | Pentesting **OWASP Top 10** sobre sitios **autorizados** + informe de hallazgos. |
| `udla-qa carga [api]` | API · rendimiento | Pruebas de **carga, estrés y pico** con **k6**; pregunta cuántos usuarios (VUs) simular. |
| `udla-qa auditar [ruta]` | Código · caja blanca | Auditoría del **código fuente** de un repo (solo lectura) para prevenir vulnerabilidades. |
| `udla-qa update` | — | Trae la última versión (npm o, si clonaste, `git pull`). |
| `udla-qa` | — | **Menú interactivo** (si no pasás comando). |
| `udla-qa help` | — | Ayuda. |

Mientras la IA trabaja vas viendo una **barra de progreso**; al terminar, la ruta del informe.

---

## Requisitos

Verificá primero si ya los tenés (si devuelve una versión, está instalado):

```bash
node -v             # Node.js 18+
claude --version    # Claude Code (obligatorio)
git --version       # Git (solo si vas a clonar)
k6 version          # k6 (solo para "udla-qa carga")
```

Si falta alguno, instalalo según tu sistema operativo:

| Requisito | macOS (Homebrew) | Windows (winget) | Linux (Debian/Ubuntu) |
| --- | --- | --- | --- |
| **Node.js 18+** | `brew install node` | `winget install OpenJS.NodeJS` | `curl -fsSL https://deb.nodesource.com/setup_lts.x \| sudo -E bash - && sudo apt-get install -y nodejs` |
| **Claude Code** | `npm install -g @anthropic-ai/claude-code` | igual | igual |
| **Git** (opcional) | `brew install git` | `winget install Git.Git` | `sudo apt-get install -y git` |
| **k6** (opcional) | `brew install k6` | `winget install k6.k6` | ver bloque Linux abajo |
| **Maestro** (opcional, para `movil`) | `curl -fsSL "https://get.maestro.mobile.dev" \| bash` | usar **WSL** + comando de Linux | `curl -fsSL "https://get.maestro.mobile.dev" \| bash` |

Después de instalar **Claude Code**, iniciá sesión **una sola vez**:

```bash
claude              # se abre y te pide iniciar sesión
/login              # entrá con TU cuenta de Claude
```

---

## Instalación

### Recomendada — desde npm (un comando, sin clonar)

```bash
npm install -g udla-qa
```

Deja el comando **`udla-qa`** disponible desde cualquier carpeta (el `postinstall` baja solo el navegador Chromium para Playwright).

**Actualizar:**

```bash
udla-qa update      # reinstala udla-qa@latest desde npm
```

> Alternativa sin esperar a npm: `npm install -g github:kiwithecode/Cli-udla`.

### Para desarrollo — clonando el repo

```bash
git clone https://github.com/kiwithecode/Cli-udla.git udla-qa
cd udla-qa
npm install        # postinstall: baja el navegador de Playwright
npm link           # expone el comando global "udla-qa"
```

Si preferís no instalarlo global: `node bin/udla-qa.js <comando>` desde el repo. En este modo, `udla-qa update` hace `git pull`.

<details>
<summary><b>Comandos por sistema operativo (requisitos completos)</b></summary>

### 🍎 macOS

```bash
brew install node git k6
npm install -g @anthropic-ai/claude-code
claude            # abrí una vez y ejecutá /login
```

### 🪟 Windows (PowerShell)

```powershell
winget install OpenJS.NodeJS Git.Git k6.k6
npm install -g @anthropic-ai/claude-code
claude            # abrí una vez y ejecutá /login
```

> Usá **PowerShell** o **Windows Terminal** para que el banner ASCII y los colores se vean bien. Con WSL, seguí los pasos de Linux.

### 🐧 Linux (Debian/Ubuntu)

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs git
# k6 (repo oficial de Grafana)
sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install -y k6
npm install -g @anthropic-ai/claude-code
claude            # abrí una vez y ejecutá /login
```

</details>

---

## Uso

```bash
udla-qa                                       # menú interactivo
udla-qa analizar https://mi-sitio.com         # QA funcional (caja negra)
udla-qa servicio https://api.mi-sitio/v1/users  # pruebas de API REST
udla-qa seguridad http://localhost:3000       # pentesting web (caja negra)
udla-qa carga https://api.mi-sitio/v1         # carga/estrés/pico con k6
udla-qa auditar ./mi-repo                     # auditoría de código (caja blanca)
udla-qa update                                # actualizar
udla-qa help                                  # ayuda
```

La primera vez, Claude Code puede pedir permiso para las herramientas de Playwright; aceptá para que el navegador funcione.

Los resultados se guardan siempre en `informes/<tipo>/<fecha-hora>/` del directorio actual (informe + evidencia + scripts).

### `udla-qa analizar` — Web funcional (caja negra)

Flujo **asistido**: el agente explora la página, **propone un plan de casos** y lo mostrá para que lo **apruebes o ajustes**. Los casos pueden venir de tres fuentes:

1. **Carpeta `casos-de-uso/`** (opcional): dejás archivos (`.md`, `.csv`, `.feature`…) y los usa como base.
2. **Describir/pegar** un caso en el momento.
3. **Generar** automáticamente (explora la página).

Ejecuta en navegador real, **genera tests de Playwright** (en `scripts/`) reutilizables como regresión, y guarda todo en `informes/qa/<fecha-hora>/`.

### `udla-qa servicio` — API REST (caja negra)

Flujo **asistido** para probar APIs:

1. Elegís **método** (GET/POST/PUT/PATCH/DELETE), **headers/auth**, **delay** y **body** (JSON inline o ruta a `.json`).
   O bien, en el menú, dejás la URL vacía e indicás un **archivo con varios endpoints** (curls, **OpenAPI/Swagger**, una **colección Postman** ya hecha, CSV o lista).
2. El agente **propone los casos** (happy path ✅, auth 🔒, validaciones 🧪, 404/405 🚫, tiempo ⏱️) y los aprobás.
3. Genera una **colección Postman v2.1.0** importable, la **ejecuta** (newman, o `curl` de fallback) y te muestra la **tabla de resultados** con ✅/❌ en la consola.

Salida en `informes/servicio/<fecha-hora>/`: `informe.md` + `scripts/coleccion.postman_collection.json` + `scripts/resultado.json`.

**Re-correr la colección** después, sin la IA:

```bash
npx newman run informes/servicio/<fecha-hora>/scripts/coleccion.postman_collection.json
```

…o importarla en **Postman** → *Runner* → *Run*.

### `udla-qa movil` — App móvil Flutter/nativa (caja negra)

Flujo **asistido** para apps **Flutter** y **nativas** (Android/iOS) con [**Maestro**](https://maestro.mobile.dev):

1. Elegís **plataforma** (Android / iOS / ambas) e indicás la **app**: su `appId` (`com.miapp`) si ya está instalada, o la ruta a un `.apk`/`.app`/`.ipa` para instalarla.
2. Definís los **flujos** (describir, archivo `.yaml`/`.md`/`.csv`, o explorar automáticamente).
3. El agente **propone los flujos** (happy path ✅, auth 🔒, validaciones 🧪, navegación 🔁, resiliencia 📵) y los aprobás.
4. Genera flujos **Maestro** (`.yaml`), los **ejecuta** en emulador/simulador y muestra la **tabla ✅/❌** con capturas.

Salida en `informes/movil/<fecha-hora>/`: `informe.md` + `scripts/*.yaml` + `scripts/resultado.xml` + capturas en `evidencia/`.

**Requiere:** Maestro instalado y un **emulador Android** / **simulador iOS** (Mac) corriendo con la app. *Nota Flutter:* Maestro ubica elementos por texto y por labels de accesibilidad/semántica — conviene que la app exponga `Semantics(label:)`/`Key`. Para tests más profundos en Flutter existe **Patrol / `integration_test`** (Dart).

**Re-correr los flujos** después, sin la IA:

```bash
maestro test informes/movil/<fecha-hora>/scripts/
```

### `udla-qa seguridad` — Pentesting OWASP (caja negra)

Solo para sitios **propios o con autorización explícita** (o entornos de práctica como [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/) / DVWA). Confirma alcance y autorización antes de empezar. Pruebas **no destructivas** por defecto. Informes en `informes/seguridad/<fecha-hora>/`.

### `udla-qa carga` — Rendimiento (k6)

Pregunta el endpoint, **cuántos usuarios virtuales (VUs)** y la duración; genera scripts de **k6** para **carga, estrés y pico**, los ejecuta y resume métricas (latencia p95/p99, RPS, % errores, punto de quiebre) en `informes/carga/<fecha-hora>/`. Solo contra APIs propias/autorizadas; sugiere staging antes que producción.

### `udla-qa auditar` — Código fuente (caja blanca)

Analiza el **código** de un repo (sin ejecutarlo) buscando inyección, secretos hardcodeados, fallas de auth/cripto, malas configuraciones y **dependencias vulnerables** (`npm audit`, etc.), con remediación por hallazgo. Es **solo lectura**: no modifica el repo. Informe en `informes/auditoria/<fecha-hora>/`.

---

## Cómo funciona

```text
udla-qa (binario Node)
   │  hace TODAS las preguntas en el CLI y arma el prompt del agente
   │  (para web/API: propone un plan y espera tu aprobación)
   ▼
claude  (Claude Code, ya logueado → usa tu suscripción)
   │  navegador real vía Playwright MCP · curl/newman/k6 vía Bash
   ▼
informes/<tipo>/<fecha-hora>/   (carpeta creada por el binario)
   ├── informe.md      · evidencia/   · scripts/
```

---

## Estructura

```text
.
├── bin/
│   └── udla-qa.js          # entrypoint: solo enruta el comando
├── lib/
│   ├── banner.js           # banner/panel ASCII (con versión y autor)
│   ├── style.js            # lenguaje visual: pasos, ✔/✖/⚠, kv, reglas, bloques
│   ├── spinner.js          # barra de progreso 1→100%
│   ├── proc.js             # spawn multiplataforma (npx/claude/git en Windows)
│   ├── config.js           # rutas y metadatos compartidos
│   ├── commands.js         # registro de comandos (prompt, tools, plan, salida)
│   ├── output.js           # carpetas de entrada/salida + armado del prompt
│   ├── runner.js           # lanza Claude Code, flujo con plan y "update"
│   ├── ui.js               # ayuda y menú interactivo
│   └── util.js             # helpers de consola (log, fail)
├── .claude/commands/       # prompts del agente (fuente única)
│   ├── qa.md               # analizar
│   ├── qa-servicio.md      # servicio (API REST)
│   ├── qa-movil.md         # movil (Flutter/nativa · Maestro)
│   ├── qa-seguridad.md     # seguridad
│   ├── qa-carga.md         # carga (k6)
│   ├── qa-auditar.md       # auditar (caja blanca)
│   └── agent-update.md
├── casos-de-uso/           # casos de uso de entrada (opcional)
├── .mcp.json               # registra el Playwright MCP
├── package.json            # bin "udla-qa" + postinstall (navegador)
└── README.md
```

> Los mismos prompts también funcionan como slash-commands (`/qa`, `/qa-servicio`, `/qa-movil`, `/qa-seguridad`, `/qa-carga`, `/qa-auditar`) si abrís Claude Code dentro de la carpeta.

---

## Práctica segura

Probá contra un entorno de práctica antes que contra algo real:

```bash
docker run --rm -p 3000:3000 bkimminich/juice-shop
udla-qa seguridad http://localhost:3000
```

> Corré `seguridad`, `carga` y `servicio` **solo** sobre sistemas propios o con autorización explícita.
