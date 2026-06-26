# The Council / El Consejo

Plataforma social/gaming para un grupo de amigos que juegan por Discord. Temática medieval-fantasía. Juego del Mes, rangos en latín, gamificación, overlay de Brawlhalla para stream.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS (tema medieval custom). Sin TypeScript. → Vercel.
- **Backend**: Node.js + Express en **ESM** (`import`, no `require`). `pg` contra PostgreSQL. → Railway.
- **DB**: PostgreSQL en **Neon** (serverless). Queries crudas con `$1/$2`, sin ORM.
- **Auth**: Discord OAuth → **JWT en localStorage** (no cookies).
- **APIs externas** (gratis, sin key): Steam Store, CheapShark, Brawlhalla v1.
- **Deploy**: push a `master` → auto-deploy Vercel (front) + Railway (back).

## Estructura

```
server/src/
  config/database.js     — pool pg + initDatabase() + query()
  middleware/auth.js     — isAuthenticated / isAdmin (JWT)
  routes/ (15)           — auth, users, months, nominations, voting, reviews,
                           games, leaderboard, activity, admin, activities,
                           councilGames, brawlhalla, webhook, ai
  services/ (7)          — bordaCount, objectivity, badges, analytics,
                           gameSearch, discord, brawlhallaApi
  index.js               — Express app, CORS, mounts, error handler
client/
  public/overlay/brawlhalla/ — overlay OBS estático (estética Brawlhalla, NO medieval)
  src/pages/ (18) · components/ui (11) · components/layout · context · services · utils
start.bat / stop.bat     — levantar / parar local
```

## Vault — memoria extendida del proyecto

The Council tiene un vault de Obsidian en `G:\VAULT CLAUDE\The Council\` — el **segundo cerebro del proyecto**: decisiones de producto, schema, bugs históricos, reglas duras, perfiles. Pensalo como tu memoria extendida.

`./VAULT_MAP.md` (root del repo) es el índice navegable — cada nota con resumen de 1 línea + cuándo consultarla. Se inyecta al contexto al inicio de cada sesión.

### Cómo usarlo
Como un humano usa su cuaderno: cuando un tema ya está documentado, vas a la nota antes de inventar. No es mecánico — es criterio. Ejemplos del reflejo correcto:
- Algo de deploy / 502 / env vars → `Hosting — Vercel + Railway + Neon`.
- Auth / login / token → `Auth — Discord OAuth + JWT`.
- Schema / tabla / columna → `Schema de la base — tablas en Neon`.
- Rangos / puntos / recompensas → `Sistema de rangos`, `Puntos reputación y objetividad`, `Recompensas y perks`.
- Bug sospechoso → primero `Bugs recurrentes — qué NO repetir`.
- Brawlhalla / overlay / torneos → `Brawlhalla Overlay — arquitectura híbrida`.

Si el vault contradice el código actual: el código gana, actualizá la nota.

### Mantenimiento (cerrar el loop)
Después de un cambio significativo: creá o actualizá la nota en `30 - NOTES/`, linkeala desde su MOC en `00 - INDEX/`, y agregala al `VAULT_MAP.md`. El cerebro crece con cada sesión.

## Reglas duras (rompen prod si las ignorás)

1. **Datos SIEMPRE en Neon, NUNCA SQLite en Railway** — el filesystem de Railway es efímero, SQLite pierde todo en cada deploy.
2. **Auth por JWT en header `Authorization`, NUNCA cookies** — no sobreviven cross-domain Railway↔Vercel. Callback redirige con `?token=`.
3. **CORS: permitir `*.vercel.app` + localhost Y mandar headers CORS también en el error handler** — sin eso un 500 se ve como "CORS block".
4. **Tabla nueva → `initDatabase()` + crearla en Neon** (script node o redeploy). Si no, 500.
5. **Queries pg con `$1/$2`** + verificar que la columna existe antes del WHERE.
6. **`VITE_API_URL` vacío en local** (proxy Vite) / **URL de Railway en prod**.
7. **Overlay OBS mantiene estética Brawlhalla** (naranja/Oswald). El resto es medieval dorado. NO unificar.
8. **`.denko_` es admin supremo siempre** (hardcoded en el callback).
9. **`redirect_uri` de Discord registrada en el Developer Portal** (local + prod).
10. **Guards defensivos** en componentes que consumen state async (SSE/fetch).

Las notas fuente: `30 - NOTES/Reglas de oro del código.md` y `30 - NOTES/Bugs recurrentes — qué NO repetir.md`.

## Convenciones

- Backend ESM, todo handler async con try/catch + `res.status(500).json({ error })`.
- Arrays a DB con `JSON.stringify` (TEXT), parsear al leer.
- `recommender_points` con `GREATEST(0, ...)`. `reputation` puede ser negativa (-999 = baneado).
- Frontend: `api.js` mete el JWT solo. Reusar componentes de `components/ui/`. Tema medieval (clases `medieval-*`, fuentes Cinzel).
- Wrappers con tabs (`ActivitiesHub`, `CodexPage`) para no saturar el sidebar.
- Latín en cada sección nueva (es parte de la identidad — ver `Identidad visual`).

## Comunicación con Mariano

No técnico, español rioplatense (vos, dale, mirá), velocidad > perfección, NO pide confirmación para cada paso. Sin enumeraciones largas. Ver `40 - PEOPLE/Equipo y comunidad — quién es quién.md`.

## Comandos

- `start.bat` — levanta backend (:3001) + frontend (:5174) + abre navegador.
- `stop.bat` — mata los puertos.
- Backend lee `server/.env` (Neon, Discord, JWT secret).
- Deploy: push a `master`.

## URLs

- Front prod: `the-council-livid.vercel.app`
- Back prod: `the-council-production-1381.up.railway.app`
- Overlay OBS: `/overlay/brawlhalla/?api=<backend>/api/brawlhalla`
- Repo: `github.com/mariano-bm/the-council`
