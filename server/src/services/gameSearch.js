/**
 * Integración con Steam Store API y RAWG API para buscar juegos
 */

export async function searchSteam(queryStr) {
  try {
    // Steam no tiene API de búsqueda oficial, usamos la store search
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(queryStr)}&l=english&cc=US`
    );
    const data = await res.json();

    if (!data.items) return [];

    return data.items.slice(0, 10).map(item => ({
      source: 'steam',
      steam_app_id: item.id,
      name: item.name,
      cover_url: item.tiny_image,
      metacritic: item.metascore || null,
      platforms: [
        item.platforms?.windows && 'PC',
        item.platforms?.mac && 'Mac',
        item.platforms?.linux && 'Linux',
      ].filter(Boolean),
      price: item.price?.final ? `$${(item.price.final / 100).toFixed(2)}` : 'Free',
    }));
  } catch (err) {
    console.error('Steam search error:', err.message);
    return [];
  }
}

export async function searchRAWG(queryStr) {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.warn('RAWG_API_KEY not set');
    return [];
  }

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(queryStr)}&page_size=10`
    );
    const data = await res.json();

    if (!data.results) return [];

    return data.results.map(game => ({
      source: 'rawg',
      rawg_slug: game.slug,
      name: game.name,
      cover_url: game.background_image,
      metacritic: game.metacritic,
      genres: game.genres?.map(g => g.name) || [],
      platforms: game.platforms?.map(p => p.platform.name) || [],
      release_date: game.released,
      rating: game.rating,
    }));
  } catch (err) {
    console.error('RAWG search error:', err.message);
    return [];
  }
}
