// Proxy + cache for Brawlhalla public API v1
import { query } from '../config/database.js';

const API_BASE = 'https://api.brawlhalla.com/v1';
const CACHE_TTL = 60_000; // 1 min

// In-memory cache (fast path) + DB cache (fallback if API down across restarts)
const memCache = new Map();

async function loadFromDbCache(path) {
  try {
    const r = await query('SELECT value FROM brawlhalla_cache WHERE path = $1', [path]);
    return r.rows[0]?.value || null;
  } catch { return null; }
}

async function saveToDbCache(path, value) {
  try {
    await query(
      `INSERT INTO brawlhalla_cache (path, value, cached_at) VALUES ($1, $2, NOW())
       ON CONFLICT (path) DO UPDATE SET value = $2, cached_at = NOW()`,
      [path, JSON.stringify(value)]
    );
  } catch {}
}

async function brawlhallaGet(pathSegment) {
  const url = `${API_BASE}${pathSegment}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'the-council-brawlhalla/1.0',
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  return await res.json();
}

export async function cachedGet(pathSegment) {
  const now = Date.now();
  const hit = memCache.get(pathSegment);
  if (hit && now - hit.t < CACHE_TTL) return hit.v;

  try {
    const v = await brawlhallaGet(pathSegment);
    memCache.set(pathSegment, { v, t: now });
    // Fire and forget — don't block on DB write
    saveToDbCache(pathSegment, v);
    return v;
  } catch (e) {
    if (hit) {
      console.warn(`[brawlhalla cache fallback - mem] ${pathSegment}`);
      return hit.v;
    }
    // Try DB cache as last resort
    const dbHit = await loadFromDbCache(pathSegment);
    if (dbHit) {
      console.warn(`[brawlhalla cache fallback - db] ${pathSegment}`);
      memCache.set(pathSegment, { v: dbHit, t: now });
      return dbHit;
    }
    throw e;
  }
}

export async function getPlayerStats(brawlhallaId) {
  return cachedGet(`/player/stats?brawlhalla_id=${encodeURIComponent(brawlhallaId)}&mode=all`);
}

export async function getPlayerRanked(brawlhallaId) {
  return cachedGet(`/player/stats?brawlhalla_id=${encodeURIComponent(brawlhallaId)}&mode=ranked_1v1`);
}

export async function getAllLegends() {
  const page1 = await cachedGet('/static/legends?max_results=100&page=1');
  let all = page1.legends || [];
  const totalPages = page1.total_pages || 1;
  for (let p = 2; p <= totalPages; p++) {
    const pageN = await cachedGet(`/static/legends?max_results=100&page=${p}`);
    all = all.concat(pageN.legends || []);
  }
  return all;
}
