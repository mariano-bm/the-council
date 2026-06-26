# VAULT_MAP — Mapa neuronal del segundo cerebro de The Council

> **REGLA #0**: ANTES de tocar código, leer las notas relevantes del vault.
> Este archivo es el ÍNDICE — te dice DÓNDE buscar.

**Vault físico**: `G:\VAULT CLAUDE\The Council\`
**Estructura**: `00 - INDEX` (4 MOCs + Home) · `20 - SOURCES` (handoff) · `30 - NOTES` (22 notas atómicas) · `40 - PEOPLE` (1 perfil).
Creado 2026-06-04.

---

## Cómo usar este mapa
1. Leé la sección que corresponde al tema del request.
2. Cada nota tiene resumen de 1 línea + cuándo consultarla.
3. Si vas a tocar algo cubierto por una nota → leéla completa antes.
4. Después del cambio significativo → crear/actualizar la nota + linkearla desde su MOC + sumarla acá.

## Lectura mínima al arrancar
1. `CLAUDE.md` (root del repo) — reglas del proyecto.
2. `00 - INDEX/🏠 Home.md` — hub raíz.
3. `30 - NOTES/Reglas de oro del código.md` — qué NO romper.
4. `30 - NOTES/Bugs recurrentes — qué NO repetir.md` — qué ya rompió.

---

## 00 - INDEX (4 MOCs)
- `🏠 Home.md` — hub raíz, qué es The Council, links a todo.
- `The Council (técnico).md` — **MOC central técnico.** Stack, schema, deploy, auth, reglas, bugs. Arrancá acá para código.
- `Producto y Comunidad.md` — Juego del Mes, rangos, puntos, recompensas, Hoyo, actividades, juegos.
- `Brawlhalla & Overlay.md` — el subsistema de torneos/overlay.
- `Equipo y Comunidad.md` — quién es quién.

## 20 - SOURCES
- `AGENT_HANDOFF — The Council v1.md` — convenciones de arranque. **NO son sugerencias, son reglas.**

## 30 - NOTES — Técnico
- `Stack técnico de The Council.md` — React+Vite / Express ESM / pg+Neon / Vercel+Railway. Sin TS. Estructura de carpetas.
- `Schema de la base — tablas en Neon.md` — las ~19 tablas (users, months, games, nominations, votes, reviews, activities, council_games, game_guides, brawlhalla_*, etc.). Convención: arrays como TEXT JSON.
- `Hosting — Vercel + Railway + Neon.md` — 3 piezas, URLs reales, env vars, el 502 de redeploy, CORS, vercel.json. Consultar para cualquier cosa de deploy.
- `Auth — Discord OAuth + JWT.md` — **por qué JWT y no cookies** (cross-domain). El flujo OAuth completo. `.denko_` admin. redirect_uri.
- `Migración SQLite → PostgreSQL — la decisión.md` — por qué se abandonó SQLite (Railway efímero). Cadena better-sqlite3→sql.js→pg.
- `Reglas de oro del código.md` — **las 10 que rompen prod.** Leer antes de tocar.
- `Convenciones de código.md` — patrones de ruta, query pg, componente, tema medieval, commits.
- `Bugs recurrentes — qué NO repetir.md` — **los 12 bugs que ya rompieron algo** (SQLite efímero, cookies cross-domain, CORS en errores, tabla sin crear, @import CSS, env con espacios, channel_binding, ORDER BY ambiguo, etc.).
- `Integración Steam + CheapShark.md` — búsqueda de juegos + precios + deals, sin key. Steam Store API + CheapShark en paralelo.

## 30 - NOTES — Producto
- `Ruleta del Destino — pesos y apuestas.md` — `/ruleta`. Rueda con covers reales en gajos, segmentos proporcionales al peso, apuestas con puntos (gastás puntos → más chance), giro ponderado server-side anti-trampa. Tablas roulette_games/roulette_bets.
- `Juego del Mes — nominación, votación, review.md` — el ciclo central. Fases, Borda count, review 5 categorías, servicios al cerrar.
- `Sistema de rangos — Plebeius a Rex Ludorum.md` — 10 rangos en latín. Todos arrancan Plebeius, suben por puntos u override admin. `COUNCIL_RANKS` en helpers.js.
- `Puntos, reputación y objetividad.md` — las 3 métricas (NO confundir). recommender_points (rango) / reputation (puede ser negativa, -999=baneado) / objectivity_score (0-100).
- `Recompensas y perks por rango.md` — perks/cosméticos/poderes/premios reales. perks.js. Codex.
- `Hoyo de la Vergüenza.md` — FOVEA IGNOMINIAE. Baneados + rep negativa. Estética crimson.
- `Actividades — eventos con puntos.md` — eventos donde te anotás (+pts) / no te anotás (-pts al cerrar). Tag opcional. Config de puntos solo admin.
- `Juegos del Council + Pergaminos.md` — biblioteca + guías comunitarias (7 categorías latín) + tryhard + detalle con precios. councilGames.js.
- `Panel de administración.md` — `/admin`. Roles, puntos, reputación, bans, fases, crear meses. admin.js.

## 30 - NOTES — Brawlhalla & Torneos
- `Brawlhalla Overlay — arquitectura híbrida.md` — control del overlay (`/torneos/overlay`) + overlay OBS estático (estética Brawlhalla) + SSE + proxy API. Roster en Neon.
- `Sistema de torneos — brackets y trofeos.md` — torneos completos: bracket visual single-elim con byes, armador, inscripción con Discord, premios, trofeos en perfil. Tablas tournaments/participants/matches/trophies. `routes/tournaments.js`. `/torneos`.

## 30 - NOTES — Diseño
- `Identidad visual — medieval fantasia.md` — paleta dorada, Cinzel, ember background, cultistas, latín, "es para virgos", "Hecha por El Viejo", navegación. La excepción: overlay Brawlhalla.
- `Toast medieval + reveal del ganador.md` — sistema de toast (pergamino dorado, reemplaza alert()) + reveal épico del Juego del Mes (countdown + confetti + card dorada). **Trampa**: countdown por timestamp/rAF, no setInterval (StrictMode lo traba).

## 40 - PEOPLE
- `Equipo y comunidad — quién es quién.md` — Mariano (operador no técnico, rioplatense), .denko_ (admin supremo = DENKITO), Rama (contexto), el grupo (Franco + roster Brawlhalla).

---

## Reglas de mantenimiento de este mapa
1. Nota nueva en el vault → agregala acá con su 1-line.
2. Nota que cambia de estado (deprecated/renombrada) → updateá la entry.
3. El vault es la fuente — este mapa es el índice. Si hay conflicto, el vault gana. Si el vault contradice el código, el código gana (y actualizás la nota).

*Creado: 2026-06-04 — vault inicial (17 notas, 4 MOCs, 1 handoff, 1 perfil).*
*Última revisión: 2026-06-25 — 22 notas. Se sumaron Ruleta del Destino, Sistema de torneos y Toast + reveal; se corrigió la nota de Steam (cover por `tiny_image`, no `header.jpg` — bug #14 — y búsqueda de 1 request).*
