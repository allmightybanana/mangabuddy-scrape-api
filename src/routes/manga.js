import express from 'express';
import * as mangaController from '../controllers/mangaController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Manga
 *     description: Core manga data endpoints
 *   - name: Utilities
 *     description: Helper endpoints for images and system
 */

/**
 * @swagger
 * /api/manga/home:
 *   get:
 *     tags: [Manga]
 *     summary: Fetch Homepage Content
 *     description: Returns curated lists of hot updates, latest chapters, and top rankings directly from MangaBuddy.
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomeData'
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/home', mangaController.getHome);

/**
 * @swagger
 * /api/manga/search:
 *   get:
 *     tags: [Manga]
 *     summary: Search Manga Database
 *     description: Search for manga by title or keywords.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword (e.g., "solo leveling")
 *     responses:
 *       200:
 *         description: List of search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 results:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/MangaBase' }
 *       400:
 *         description: Missing query parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', mangaController.searchManga);

/**
 * @swagger
 * /api/manga/details/{slug}:
 *   get:
 *     tags: [Manga]
 *     summary: Get Full Manga Details
 *     description: Retrieve comprehensive metadata including synopsis, genres, status, and the complete chapter list.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier for the manga (e.g., "one-piece")
 *     responses:
 *       200:
 *         description: Detailed manga object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 details: { $ref: '#/components/schemas/MangaDetails' }
 */
router.get('/details/:slug', mangaController.getDetails);

/**
 * @swagger
 * /api/manga/read/{mangaSlug}/{chapterSlug}:
 *   get:
 *     tags: [Manga]
 *     summary: Scrape Chapter Images
 *     description: Returns a complete list of image URLs for a specific chapter. Uses deep-parsing logic to ensure all pages are captured.
 *     parameters:
 *       - in: path
 *         name: mangaSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Manga slug (e.g., "solo-leveling")
 *       - in: path
 *         name: chapterSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter slug (e.g., "chapter-164")
 *     responses:
 *       200:
 *         description: Array of image URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 images:
 *                   type: array
 *                   items: { type: 'string', example: 'https://s16.mbcdnsaq.org/...' }
 */
router.get('/read/:mangaSlug/:chapterSlug', mangaController.getChapter);

/**
 * @swagger
 * /api/manga/proxy:
 *   get:
 *     tags: [Utilities]
 *     summary: Bypass Hotlink Protection
 *     description: Proxies image requests with the correct Referer headers. Use this endpoint to display chapter images in your frontend without being blocked.
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: The direct image URL to proxy.
 *     responses:
 *       200:
 *         description: Binary image data
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/proxy', mangaController.proxyImage);

export default router;
