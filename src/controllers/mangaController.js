import * as scraper from '../services/scraper.js';
import { resolveExternalIdCandidates } from '../utils/resolver.js';

export const getHome = async (req, res, next) => {
  try {
    const data = await scraper.getHomePage();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const searchManga = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
    const data = await scraper.searchManga(q);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getDetails = async (req, res, next) => {
  try {
    let { slug } = req.params;
    const { provider } = req.query;

    if (provider && provider !== 'mangabuddy') {
      const resolution = await resolveExternalIdCandidates(slug, provider);
      const titles = resolution?.titles;

      if (!titles?.length) return res.status(404).json({ error: `Could not resolve ${provider} ID ${slug} to a title` });

      let match = null;
      for (const title of titles) {
        const searchData = await scraper.searchManga(title);
        if (searchData.success && searchData.results.length > 0) {
          // Exact or fuzzy match on title
          match = searchData.results.find(r => 
            r.title.toLowerCase() === title.toLowerCase() ||
            r.title.toLowerCase().includes(title.toLowerCase()) ||
            title.toLowerCase().includes(r.title.toLowerCase())
          );
          if (match) break;
        }
      }

      if (!match) return res.status(404).json({ error: `Could not find manga on MangaBuddy matching ${provider} ID ${slug}` });
      slug = match.slug;
    }

    const data = await scraper.getMangaDetails(slug);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getChapter = async (req, res, next) => {
  try {
    let { mangaSlug, chapterSlug } = req.params;
    const { provider } = req.query;

    if (provider && provider !== 'mangabuddy') {
      const resolution = await resolveExternalIdCandidates(mangaSlug, provider);
      const titles = resolution?.titles;

      if (!titles?.length) return res.status(404).json({ error: `Could not resolve ${provider} ID ${mangaSlug} to a title` });

      let match = null;
      for (const title of titles) {
        const searchData = await scraper.searchManga(title);
        if (searchData.success && searchData.results.length > 0) {
          match = searchData.results.find(r => 
            r.title.toLowerCase() === title.toLowerCase() ||
            r.title.toLowerCase().includes(title.toLowerCase()) ||
            title.toLowerCase().includes(r.title.toLowerCase())
          );
          if (match) break;
        }
      }

      if (!match) return res.status(404).json({ error: `Could not find manga on MangaBuddy matching ${provider} ID ${mangaSlug}` });
      mangaSlug = match.slug;
    }

    const data = await scraper.getChapterPages(mangaSlug, chapterSlug);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const proxyImage = async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter is required' });

    await scraper.proxyImageStream(url, res);
  } catch (error) {
    next(error);
  }
};
