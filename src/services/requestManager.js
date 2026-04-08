import axios from 'axios';
import { solveWithFlare } from './flare.js';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Cookie storage to reuse FlareSolverr sessions
let savedCookies = '';
let savedUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Checks if the response body contains Cloudflare challenge indicators
 */
function isCloudflare(html) {
  if (!html) return false;
  return html.includes('id="cf-challenge"') || 
         html.includes('id="challenge-form"') || 
         html.includes('<title>Just a moment...</title>');
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

    if (response.status === 200 && !isCloudflare(response.data)) {
      // Direct request worked!
      cache.set(url, { data: response.data, expiry: now + CACHE_TTL });
      return response.data;
    }
    
    console.log(`[Direct] Blocked or challenge detected for ${url}. Falling back to FlareSolverr...`);
  } catch (error) {
    console.log(`[Direct] Failed for ${url}: ${error.message}. Falling back to FlareSolverr...`);
  }

  // 3. Fallback to FlareSolverr
  const flareResponse = await solveWithFlareExtended(url);
  
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

/**
 * Updated FlareSolverr caller that returns cookies and UA
 */
async function solveWithFlareExtended(url) {
  const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL || 'http://localhost:8191/v1';
  
  const response = await axios.post(FLARESOLVERR_URL, {
    cmd: 'request.get',
    url,
    maxTimeout: 60000,
  });

  const { status, solution } = response.data;

  if (status !== 'ok') {
    throw new Error(`FlareSolverr error: ${status}`);
  }

  return {
    html: solution.response,
    cookies: solution.cookies,
    userAgent: solution.userAgent
  };
}
