import * as cheerio from 'cheerio';

export function parseHomePage(html) {
  const $ = cheerio.load(html);
  
  const hotUpdates = [];
  const hotSection = $('.section').filter((i, el) => $(el).find('.section-header').text().includes('HOT UPDATES'));
  hotSection.find('.trending-item').each((i, el) => {
    const titleLink = $(el).find('a').first();
    const title = titleLink.attr('title') || $(el).find('.name').text().trim();
    const url = titleLink.attr('href') || '';
    const slug = url.split('/').filter(Boolean).pop();
    const img = $(el).find('img');
    const image = img.attr('data-src') || img.attr('src') || '';
    const chapter = $(el).find('.latest-chapter').text().trim();

    hotUpdates.push({ title, slug, url, image, chapter });
  });

  const latestUpdates = [];
  $('.book-item').each((i, el) => {
    const title = $(el).find('.title a').text().trim();
    const url = $(el).find('.title a').attr('href') || '';
    const slug = url.split('/').filter(Boolean).pop();
    const img = $(el).find('img');
    const image = img.attr('data-src') || img.attr('src') || '';
    const chapters = [];
    $(el).find('.chap-item').each((j, chap) => {
      chapters.push({
        title: $(chap).find('a').text().trim(),
        url: $(chap).find('a').attr('href') || '',
        time: $(chap).find('.time').text().trim()
      });
    });

    latestUpdates.push({ title, slug, url, image, chapters });
  });

  const ranking = [];
  const rankSection = $('.section').filter((i, el) => $(el).find('.section-header').text().includes('RANKING'));
  rankSection.find('.top-item').each((i, el) => {
    const title = $(el).find('.title a').text().trim();
    const url = $(el).find('.title a').attr('href') || '';
    const slug = url.split('/').filter(Boolean).pop();
    const img = $(el).find('img');
    const image = img.attr('data-src') || img.attr('src') || '';
    const chapter = $(el).find('.chap-item a').text().trim();

    ranking.push({ rank: i + 1, title, slug, url, image, chapter });
  });

  return {
    hotUpdates,
    latestUpdates: latestUpdates.slice(0, 20),
    ranking
  };
}

export function parseSearchResults(html) {
  const $ = cheerio.load(html);
  const results = [];

  $('.book-item').each((i, el) => {
    const title = $(el).find('.title a').text().trim();
    const url = $(el).find('.title a').attr('href') || '';
    const slug = url.split('/').filter(Boolean).pop();
    const img = $(el).find('img');
    const image = img.attr('data-src') || img.attr('src') || '';
    const latestChapter = $(el).find('.chap-item a').text().trim();

    results.push({
      title,
      slug,
      url,
      image,
      latestChapter
    });
  });

  return results;
}

export function parseMangaDetails(html) {
  const $ = cheerio.load(html);
  
  const title = $('h1').text().trim();
  const synopsis = $('.summary .content').text().trim();
  const thumb = $('.book-info img, .cover img, .thumb img').first();
  const image = thumb.attr('data-src') || thumb.attr('src') || '';
  
  const info = {};
  $('.detail .meta p').each((i, el) => {
    const label = $(el).find('strong').text().replace(':', '').trim().toLowerCase();
    const value = $(el).text().replace($(el).find('strong').text(), '').trim();
    if (label) info[label] = value;
  });

  if (Object.keys(info).length === 0) {
    $('.meta-item').each((i, el) => {
      const label = $(el).find('.label').text().replace(':', '').trim().toLowerCase();
      const value = $(el).text().replace($(el).find('.label').text(), '').trim();
      if (label) info[label] = value;
    });
  }

  const genres = [];
  $('.detail .meta p:contains("Genres") a').each((i, el) => {
    const genre = $(el).text().replace(/[\n\t,]/g, '').trim();
    if (genre) genres.push(genre);
  });
  if (genres.length > 0) info.genres = genres;

  const chapters = [];
  $('.chapter-list li').each((i, el) => {
    const a = $(el).find('a');
    const title = a.find('.chapter-title').text().trim() || a.text().trim();
    const url = a.attr('href') || '';
    const slug = url.split('/').filter(Boolean).pop();
    const time = $(el).find('.chapter-update').text().trim() || $(el).find('.time').text().trim();

    chapters.push({ title, slug, url, time });
  });

  return {
    title,
    synopsis,
    image,
    ...info,
    chapters
  };
}

export function parseChapterPages(html) {
  // 1. Try to extract from chapImages JavaScript variable (modern MangaBuddy method)
  const chapImagesRegex = /var\s+chapImages\s*=\s*'([^']*)'/;
  const chapMatch = html.match(chapImagesRegex);
  if (chapMatch && chapMatch[1]) {
    const images = chapMatch[1].split(',').filter(Boolean);
    if (images.length > 0) {
      return images;
    }
  }

  // 2. Try to extract from chapter_images JavaScript variable (fallback method)
  const scriptRegex = /var\s+chapter_images\s*=\s*(\[[^\]]*\])/;
  const match = html.match(scriptRegex);
  if (match) {
    try {
      const jsonStr = match[1].replace(/'/g, '"').replace(/,\s*\]/, ']');
      const images = JSON.parse(jsonStr);
      if (Array.isArray(images) && images.length > 0) {
        return images.map(img => (typeof img === 'string' ? img : img.url));
      }
    } catch (e) {
      console.warn('Failed to parse chapter_images JS variable', e.message);
    }
  }

  // 3. DOM parsing: Catch all images in chapter-image containers
  const $ = cheerio.load(html);
  const images = [];

  $('div.chapter-image').each((i, div) => {
    const img = $(div).find('img');
    const src = img.attr('data-src') || img.attr('src');
    
    if (src && !src.includes('pubfuture') && !src.includes('pubadx') && !src.includes('x.gif')) {
        images.push(src);
    }
  });

  // 4. Last ditch effort: any img in #chapter-images
  if (images.length === 0) {
    $('#chapter-images img').each((i, el) => {
        const src = $(el).attr('data-src') || $(el).attr('src');
        if (src && (src.includes('/res/manga/') || src.includes('mbcdns')) && !src.includes('x.gif')) {
            images.push(src);
        }
    });
  }

  return images;
}
