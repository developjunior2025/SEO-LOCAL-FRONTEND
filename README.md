# SEOLOCAL · Marketplace de agencias SEO Local

Frontend React + TypeScript + Vite del marketplace SEOLOCAL.

## Stack

- React 19
- TypeScript
- Vite
- React Router (BrowserRouter)
- Tailwind CSS
- Lucide React

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npx tsc --noEmit
```

## Estructura

```text
src/
  components/          Componentes compartidos
  features/            Módulos de dominio
  pages/               Páginas enrutables
  routes/              Router y lazy loading
  state/               Estado global (AppState)
  data/                Datos mock y fixtures
  utils/               Helpers
```

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

### Credenciales de demostración

| Rol | Email | Contraseña |
|-----|-------|------------|
| Cliente | `cliente@clinicasonrisa.com` | `Demo1234` |
| Vendedor | `vendedor@seolocal.com` | `Demo1234` |
| Admin | `admin@seolocal.com` | `Demo1234` |

## Command Center 360

- Ruta protegida `/herramientas/auditorias`.
- La pestaña activa se controla con la query `tab`.
- Sincronización con navegación Back/Forward.
- Datos demostrativos centralizados en `src/features/tools-audits/data/clientAuditDemoData.ts`.
- Componentes desacoplados bajo `src/features/tools-audits/components/`.

## Convenciones

- Un componente por archivo para Fast Refresh.
- Utilidades compartidas en archivos separados (`*Config.ts`, `*Helpers.ts`).
- Tipado explícito y reducción progresiva de `any`. TypeScript strict queda pendiente para una fase posterior.
- Estilos específicos del Command Center en `src/features/tools-audits/styles/command-center-360.css`.

## Estado global

`AppStateProvider` expone catálogo, búsqueda, listas, modales y autenticación básica (`user`, `login`, `logout`).

## Notas

- El backend PostgreSQL autónomo se consume cuando está disponible; de lo contrario se mantiene fallback mock.
- La fase actual del Command Center usa datos demostrativos; la integración real con APIs externas queda fuera del alcance actual.
- **Citaciones:** Etapa 1 implementada como gestor manual de copiado y seguimiento en 20 directorios. La Etapa 2 (automatización de formularios, bots, scraping o navegación remota) no está implementada.
