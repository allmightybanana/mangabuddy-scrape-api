import axios from 'axios';
import { solveWithFlare } from './flare.js';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Cookie storage to reuse FlareSolverr sessions
let savedCookies = '';
let savedUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Checks if the response body contains anti-bot challenge indicators.
 */
function isChallengePage(html) {
  if (!html) return false;

  const normalized = html.toLowerCase();

  return normalized.includes('id="cf-challenge"') ||
         normalized.includes('id="challenge-form"') ||
         normalized.includes('<title>just a moment...</title>') ||
         normalized.includes('<title>ddos-guard</title>') ||
         normalized.includes('ddos-guard') ||
         normalized.includes('__ddg') ||
         normalized.includes('ddos_guard');
}

export async function smartFetch(url) {
  const now = Date.now();
  
  // 1. Check Cache
  if (cache.has(url)) {
    const { data, expiry } = cache.get(url);
    if (now < expiry) {
      return data;
    }
    cache.delete(url);
  }

  // 2. Try Direct Request (with saved cookies/UA if available)
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': savedUserAgent,
        'Cookie': savedCookies,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 5000,
      validateStatus: (status) => status < 500, // Handle 403/503 manually
    });

    if (response.status === 200 && !isChallengePage(response.data)) {
      // Direct request worked!
      cache.set(url, { data: response.data, expiry: now + CACHE_TTL });
      return response.data;
    }
    
    console.log(`[Direct] Blocked or challenge detected for ${url}. Falling back to FlareSolverr...`);
  } catch (error) {
    console.log(`[Direct] Failed for ${url}: ${error.message}. Falling back to FlareSolverr...`);
  }

  // 3. Fallback to FlareSolverr
  // Use the upgraded solveWithFlare which handles persistent sessions
  const flareResponse = await solveWithFlare(url);
  
  // Store the "fresh" cookies and UA for future direct attempts
  if (flareResponse.cookies) {
    savedCookies = flareResponse.cookies.map(c => `${c.name}=${c.value}`).join('; ');
  }
  if (flareResponse.userAgent) {
    savedUserAgent = flareResponse.userAgent;
  }

  cache.set(url, { data: flareResponse.html, expiry: now + CACHE_TTL });
  return flareResponse.html;
}
