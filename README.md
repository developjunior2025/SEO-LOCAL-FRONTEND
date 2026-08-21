# SEOLOCAL · Marketplace de agencias SEO Local

Frontend React + TypeScript + Vite del marketplace SEOLOCAL.

## Stack

- React 19
- TypeScript
- Vite
- React Router (BrowserRouter)
- Tailwind CSS
- Lucide React
- Vitest (tests unitarios)

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
npx tsc --noEmit
```

## Variables de entorno

Copia `.env.example` a `.env` y ajusta:

```env
# URL base de la API (obligatoria en producción; en desarrollo fallback a localhost:4001)
VITE_API_URL=http://localhost:4001/api/v1

# Timeout por defecto para llamadas API en milisegundos (fallback: 15000)
VITE_API_TIMEOUT=15000

# Modo desarrollo: autenticación demo por fallback (solo funciona en DEV)
VITE_ENABLE_DEMO_AUTH=false

# Contraseña compartida para usuarios demo en desarrollo
VITE_DEMO_AUTH_PASSWORD=dev-demo-password

# Modo desarrollo: datos demo por fallback (solo funciona en DEV)
VITE_ENABLE_DEMO_DATA=false
```

> **Importante:** `VITE_ENABLE_DEMO_AUTH` y `VITE_ENABLE_DEMO_DATA` solo deben estar en `true` durante desarrollo local. En producción deben estar en `false` para forzar autenticación y datos reales.

## Estructura

```text
src/
  components/          Componentes compartidos
  features/            Módulos de dominio
  pages/               Páginas enrutables
  routes/              Router y lazy loading
  state/               Estado global (AppState)
  lib/                 Configuración de API, helpers y utilidades
  services/            Clientes HTTP por dominio (admin, marketplace)
  data/                Datos mock y fixtures
  utils/               Helpers
```

## Configuración de API

La central `src/lib/apiConfig.ts` gestiona:

- URL base y timeout (`VITE_API_URL`, `VITE_API_TIMEOUT`).
- Bearer token leído automáticamente desde `localStorage.getItem('seo_local_dashboard_token')`.
- Manejo de errores tipados (`ApiError`): `network`, `timeout`, `unauthorized`, `forbidden`, `server`, `credentials`, `client`, `unknown`.
- Cierre de sesión automático al recibir `401`/`403`: limpia token, usuario cacheado y emite `seo-dashboard-logout`.

## Navegación principal

- **Inicio** — `/`
- **Categorías** — `/categorias`
- **Agencias** — `/agencias`
- **Servicios Directos** — ancla en home
- **Ofertas Flash** — ancla en home
- **Dashboard interno** — `/dashboard`
- **Acceder** — `/login`

## Herramientas

El menú superior **Herramientas** es un acceso directo al portal cliente Command Center 360. Ya no despliega submenú; al hacer clic navega según el estado de sesión.

| Estado | Destino |
|--------|---------|
| Visitante no autenticado | `/login?returnTo=/herramientas/auditorias?tab=summary` |
| Cliente autenticado | `/herramientas/auditorias?tab=summary` |
| Vendedor / Admin / Otros roles | `/dashboard` |

Una vez dentro del Command Center, las ocho pestañas permiten navegar por las distintas auditorías:

| Pestaña | Ruta |
|---------|------|
| Centro de Auditoría 360 | `/herramientas/auditorias?tab=summary` |
| Cadena de Evidencia | `/herramientas/auditorias?tab=proof` |
| Rankings y GeoGrid | `/herramientas/auditorias?tab=rankings` |
| Google Business Profile y Listings | `/herramientas/auditorias?tab=listings` |
| Reseñas y Reputación | `/herramientas/auditorias?tab=reviews` |
| SEO Técnico y Autoridad | `/herramientas/auditorias?tab=site` |
| SEM y Conversiones | `/herramientas/auditorias?tab=ads` |
| Entregables y Aprobaciones | `/herramientas/auditorias?tab=files` |
| Citaciones (Etapa 1 manual) | `/herramientas/citaciones` |

### Integración con backend

El frontend ahora consume el backend real siempre que esté disponible. Los endpoints principales conectados son:

- Autenticación
  - `POST /admin/auth/login`
  - `GET /admin/auth/me`
  - `POST /admin/auth/logout`
- Dashboard administrativo
  - `GET /admin/dashboard/summary`
  - `GET /admin/agencies`
  - `GET /admin/services`
- Cliente (Command Center)
  - `GET /client/audits/current`
  - `GET /client/citations/draft`
  - `PUT /client/citations/draft`

Si el backend devuelve un error de red, timeout o credenciales, el sistema muestra mensajes específicos. Solo cuando `VITE_ENABLE_DEMO_AUTH=true` o `VITE_ENABLE_DEMO_DATA=true` se activan los datos de demostración como fallback.

### Credenciales

No se incluyen credenciales reales en el código frontend. Solicita o crea usuarios desde el backend/administración. En modo desarrollo con `VITE_ENABLE_DEMO_AUTH=true`, los usuarios demo están definidos en `src/state/authHelpers.ts`.

## Command Center 360

- Ruta protegida `/herramientas/auditorias`.
- La pestaña activa se controla con la query `tab`.
- Sincronización con navegación Back/Forward.
- Datos cargados desde `GET /client/audits/current`.
- Componentes desacoplados bajo `src/features/tools-audits/components/`.

### Citaciones

- Ruta `/herramientas/citaciones`.
- Etapa 1: gestor manual de copiado y seguimiento en 20 directorios.
- Estado persistente en backend vía `GET`/`PUT /client/citations/draft`.
- localStorage se usa solo como caché local y migración de datos antiguos.
- Etapa 2 (automatización de formularios, bots, scraping o navegación remota) no está implementada.

## Convenciones

- Un componente por archivo para Fast Refresh.
- Utilidades compartidas en archivos separados (`*Config.ts`, `*Helpers.ts`).
- Tipado explícito y reducción progresiva de `any`. TypeScript strict queda pendiente para una fase posterior.
- Estilos específicos del Command Center en `src/features/tools-audits/styles/command-center-360.css`.

## Estado global

`AppStateProvider` expone:

- `user`, `authLoading`, `authError`
- `login(email, password)` — intenta backend; fallback demo solo con `VITE_ENABLE_DEMO_AUTH=true`
- `logout()` — llama a `POST /admin/auth/logout`, limpia token y estado
- `restoreSession()` — valida token vía `GET /admin/auth/me` al montar
- `catalogLoading`, `catalogError`, `backendSource` — estado de carga del catálogo

## Tests

Vitest ejecuta tests unitarios para helpers críticos:

```bash
npm test
```

Tests actuales:

- `src/lib/apiConfig.test.ts` — URL base, normalización de endpoint, token Bearer y errores 401.
- `src/state/authHelpers.test.ts` — validación de email/password y credenciales demo.
- `src/features/tools-audits/hooks/useClientAudit.test.ts` — carga de auditoría.
- `src/features/tools-audits/hooks/useCitationDraft.test.ts` — autosave, importación y limpieza.

## Notas

- El backend PostgreSQL autónomo se consume cuando está disponible; de lo contrario se mantiene fallback mock solo si las flags demo están activas.
- La integración real de autenticación y de las secciones de auditoría/citaciones ya está operativa; los datos se persisten en el backend.
- **Citaciones:** Etapa 1 implementada como gestor manual de copiado y seguimiento en 20 directorios. La Etapa 2 no está implementada.

## Panel Utilidades V17

Ruta principal: `/utilidades`

Rutas operativas:

- `/utilidades/ubicaciones`
- `/utilidades/ubicaciones/:id/:seccion`
- `/utilidades/clientes`
- `/utilidades/agencias`
- `/utilidades/alertas`
- `/utilidades/operaciones`
- `/utilidades/acciones`
- `/utilidades/ordenes-trabajo`
- `/utilidades/campanas-resenas`
- `/utilidades/campanas-citaciones`
- `/utilidades/publicaciones-gbp`
- `/utilidades/mercado`
- `/utilidades/prospectos`
- `/utilidades/marca-blanca`

Usuario de desarrollo: `utilidades@seolocal.test`. La contraseña temporal se crea mediante el seed del backend. V17.2 prueba el logout del estado React, la conservación de sesión ante HTTP 403 y la rotación automática del refresh token.

## Centro de Control Utilidades V18

- URL: `/utilidades`
- API: `/api/v1/utilidades`
- Nuevas pantallas: Casos, Integraciones, Auditoría y Alcances.
- Campañas de reseñas: destinatarios, plantillas, estados y ejecución manual/webhook.
- Campañas de citaciones: NAP, directorios, fichas, evidencias y verificación.
- GBP: borrador, programación y publicación confirmada por referencia/webhook.
- Analytics/GSC: snapshots importados o sincronizados, nunca datos simulados.
- Mercado: créditos separados por moneda y aprobación transaccional.

<!-- V5_43_0_AUDITORIA_GBP_V25 -->
## SEO LOCAL v5.43.0 — Auditoría GBP V25

Ruta del workspace especializado:

```text
http://localhost:5173/utilidades/ubicaciones/:locationId/auditoria-gbp
```

La Utilidad #5 integra auditoría de perfil, categorías, reseñas, media, publicaciones, productos/servicios, Q&A, rendimiento, competencia y Change Monitor. Los datos de Local Lab permanecen explícitamente identificados como demostrativos.


<!-- V5_43_4_AUDITORIA_GBP_V25_1 -->
## SEO LOCAL v5.43.4 — Auditoría GBP V25.1 Data Integrity & Intelligence Closure

Ruta:

```text
http://localhost:5173/utilidades/ubicaciones/:locationId/auditoria-gbp
```

V25.1 unifica un Current GBP Snapshot canónico para reseñas/fotos, separa señales web de los campos GBP, reconcilia publicaciones y media, añade Opportunity Score de categorías, brechas concretas de catálogo/Q&A, Performance Intelligence con 18m e Índice 100, y un benchmark Top 10 con índice competitivo explicable.

<!-- V5_43_5_AUDITORIA_GBP_V25_1_1 -->
## SEO LOCAL v5.43.5 — Auditoría GBP V25.1.1 Derived Intelligence Consistency

Ruta:

```text
http://localhost:5173/utilidades/ubicaciones/:locationId/auditoria-gbp
```

V25.1.1 cierra la coherencia de inteligencia derivada: el Resumen consume la categoría prioridad #1 del Opportunity Score, la velocidad de respuesta usa el Review Audit canónico y el KPI/Resumen/Competencia comparten exactamente el benchmark SoLV de la keyword principal. Los tabs de competencia calculan índice, Top 5 y delta pp por keyword seleccionada.

<!-- V5_44_0_REPUTATION_MANAGER_V26 -->
## SEO LOCAL v5.44.0 — Reputation Manager V26 Operations & Intelligence

Ruta especializada:

```text
http://localhost:5173/utilidades/ubicaciones/:locationId/reputacion
```

V26 convierte la Utilidad #6 en un centro operativo de reputación con Resumen, Inbox, Respuestas, Campañas, Feedback/NPS, Fuentes, Temas, Competencia, Showcase, Automatización e Historial. Se integra con Auditoría GBP, Rank Tracker, Search Grid, Publicaciones GBP y Acciones. El flujo de respuesta es Generar → Editar → Aprobar → Publicar, y no representa como publicación externa una operación que permanezca en Local Lab o sin conector verificado.

## SEO LOCAL v5.44.1 — Reputation Manager V26.1

Ruta: `/utilidades/ubicaciones/:locationId/reputacion`.

V26.1 cierra integridad operacional: metodología Health 100% reconciliada, muestra Inbox vs. universo canónico, NPS estándar, atribución de campañas sin funnel imposible, SLA/respuesta ponderados por fuente, historial con fechas únicas/origen, Automation con prueba simulada sin crear trabajo y Showcase con vista previa/código de integración.

## SEO LOCAL v5.44.2 — Reputation Manager V26.1.1

Ruta: `/utilidades/ubicaciones/:locationId/reputacion`

V26.1.1 cierra Response Center, fechas y consentimiento: genera borrador asistido al abrir una review pendiente, deshabilita aprobacion con texto vacio, adapta el CTA a la capacidad real de publicacion externa, formatea los valores DATE sin desplazamiento UTC y limita la vista previa Showcase a candidatas realmente elegibles. Las bloqueadas por consentimiento se explican fuera del widget publico.

<!-- V5_44_3_REPUTATION_MANAGER_V26_1_2 -->
## SEO LOCAL v5.44.3 - Reputation Manager V26.1.2 Canonical Queue & UX Closure

Ruta:

```text
http://localhost:5173/utilidades/ubicaciones/:locationId/reputacion
```

V26.1.2 cierra la coherencia visual final de la Utilidad #6: Resumen y Showcase comparten elegibilidad canonica, Response Center muestra toda la cola pendiente priorizada, Competencia declara alcance Google/GBP, Topics separa variacion de menciones y sentimiento, y Showcase indica cuando la vista previa aun corresponde a la ultima politica guardada.


<!-- SEOLOCAL_LOCAL_VISIBILITY_PREVIEW_V0_1 -->
## Local Visibility Scanner Preview V0.1
Se muestra en el Home entre Hero y Categorias. Puede ocultarse con VITE_LOCAL_VISIBILITY_SCANNER=false o retirarse con el desinstalador v5.44.4.



<!-- SEOLOCAL_ROUTE_LOCAL_VISIBILITY_EXECUTIVE_V2 -->
## Local Visibility Executive Workspace V2

- Ruta pública: `/local-visibility`
- Entrada: scanner LIVE del Home → botón **Executive Workspace**.
- Vistas: Overview, GeoGrid, Competidores, SERP Local, Diagnóstico y Acciones.
- Datos: reutiliza `/api/v1/tools/local-visibility/preview` con acciones `pack`, `details` y `grid`.
- El traspaso Home → Workspace usa `sessionStorage` más parámetros URL; no guarda secretos.
- GeoGrid de competidor requiere confirmación porque ejecuta 25 búsquedas LIVE adicionales.
<!-- SEOLOCAL_ROUTE_LOCAL_VISIBILITY_EXECUTIVE_V2 -->
