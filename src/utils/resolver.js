import axios from 'axios';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'id-cache.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DISABLE_CACHE = false;

// Global in-flight requests to prevent duplicate calls for the same ID
const inFlight = new Map();

// Global request queue to respect external rate limits (max 1 request per second)
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 1000; // 1 second

/**
 * Wait for the global queue
 */
async function throttle() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_GAP) {
    const waitTime = MIN_REQUEST_GAP - timeSinceLast;
    lastRequestTime = now + waitTime;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  } else {
    lastRequestTime = now;
  }
}

/**
 * Loads cache from file
 */
function loadIdCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

/**
 * Saves cache to file
 */
function saveIdCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {}
}

/**
 * Internal resolver that actually makes the network call
 */
async function performResolution(id, provider) {
  /** @type {string[]} */
  let titles = [];

  // Respect the global rate limit bottleneck
  await throttle();

  if (provider === 'anilist') {
    const query = `
      query ($id: Int) {
        Media (id: $id, type: MANGA) {
          title { romaji english native userPreferred }
        }
      }
    `;
    try {
      const response = await axios.post('https://graphql.anilist.co', {
        query,
        variables: { id: parseInt(id) }
      });
      const media = response.data.data.Media;
      const t = media?.title || {};
      titles = [t.romaji, t.userPreferred, t.english, t.native].filter(Boolean);
    } catch (e) {
      return null;
    }
  }

  if (provider === 'mal') {
    try {
      const response = await axios.get(`https://api.jikan.moe/v4/manga/${id}`);
      const d = response.data?.data || {};
      titles = [d.title, d.title_english, d.title_japanese, ... (d.titles || []).map(t => t.title)].filter(Boolean);
    } catch (e) {
      return null;
    }
  }

  // Normalize, dedupe, and drop empties.
  const seen = new Set();
  const normalized = [];
  for (const raw of titles) {
    const value = `${raw}`.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(value);
  }

  return normalized.length ? { titles: normalized } : null;
}

/**
 * Resolves a MAL ID or AniList ID to multiple candidate titles.
 */
export async function resolveExternalIdCandidates(id, provider) {
  const cacheKey = `${provider}:${id}`;

  if (!DISABLE_CACHE) {
    if (inFlight.has(cacheKey)) {
      return inFlight.get(cacheKey);
    }

    const cache = loadIdCache();
    if (cache[cacheKey]) {
      const entry = cache[cacheKey];
      const isFresh = entry?.timestamp && (Date.now() - entry.timestamp < CACHE_TTL);
      if (isFresh && Array.isArray(entry?.titles)) {
        return { titles: entry.titles };
      }
    }
  }

  const task = performResolution(id, provider).then(result => {
    if (result?.titles?.length && !DISABLE_CACHE) {
      const updatedCache = loadIdCache();
      updatedCache[cacheKey] = { 
        titles: result.titles, 
        timestamp: Date.now()
      };
      saveIdCache(updatedCache);
    }
    if (!DISABLE_CACHE) {
      inFlight.delete(cacheKey);
    }
    return result;
  }).catch(err => {
    if (!DISABLE_CACHE) {
      inFlight.delete(cacheKey);
    }
    throw err;
  });

  if (!DISABLE_CACHE) {
    inFlight.set(cacheKey, task);
  }
  return task;
}
