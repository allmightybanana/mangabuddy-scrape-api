import * as scraper from '../services/scraper.js';

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
    const { slug } = req.params;
    const data = await scraper.getMangaDetails(slug);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getChapter = async (req, res, next) => {
  try {
    const { mangaSlug, chapterSlug } = req.params;
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

    const response = await scraper.proxyImage(url);
    res.set('Content-Type', response.headers['content-type']);
    res.send(Buffer.from(response.data));
  } catch (error) {
    next(error);
  }
};
