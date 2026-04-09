import axios from 'axios';
import { smartFetch } from './requestManager.js';
import { 
  parseHomePage, 
  parseSearchResults, 
  parseMangaDetails,
  parseChapterPages 
} from '../utils/parser.js';

const BASE_URL = 'https://mangabuddy.com';

export async function getHomePage() {
  const html = await smartFetch(`${BASE_URL}/home`);
  const data = parseHomePage(html);
  return { success: true, data };
}

export async function searchManga(query) {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
  const html = await smartFetch(url);
  const results = parseSearchResults(html);
  return { success: true, results };
}

export async function getMangaDetails(slug) {
  const url = `${BASE_URL}/${slug}`;
  const html = await smartFetch(url);
  const details = parseMangaDetails(html);
  return { success: true, details };
}

export async function getChapterPages(mangaSlug, chapterSlug) {
  const url = `${BASE_URL}/${mangaSlug}/${chapterSlug}`;
  const html = await smartFetch(url);
  const images = parseChapterPages(html);
  return { success: true, images };
}

export async function proxyImageStream(imageUrl, res) {
  const response = await axios.get(imageUrl, {
    headers: {
      'Referer': BASE_URL,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    responseType: 'stream'
  });
  
  res.set('Content-Type', response.headers['content-type']);
  if (response.headers['content-length']) {
    res.set('Content-Length', response.headers['content-length']);
  }
  
  response.data.pipe(res);
}
