import axios from 'axios';
import { JSDOM } from 'jsdom';
import * as fs from 'fs-extra';
import * as path from 'path';

const DELAY_BETWEEN_REQUESTS_MS = 2000;
const OUTPUT_DIR = path.join(__dirname, '../offline-knowledge-center/public/data');
const IMAGES_DIR = path.join(__dirname, '../offline-knowledge-center/public/images');

interface ArticleInfo {
  id: string;
  title: string;
  url: string;
}

interface IndexData {
  title: string;
  articles: ArticleInfo[];
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchHtml(url: string): Promise<string> {
  console.log(`Fetching: ${url}`);
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, (error as any).message);
    throw error;
  }
}

async function processArticle(url: string, id: string): Promise<void> {
  const html = await fetchHtml(url);
  const dom = new JSDOM(html, { url });

  const document = dom.window.document;

  // Custom Fallback Extraction since Readability fails on GFG's structure
  const title = document.querySelector('h1')?.textContent || 'Untitled';
  const articleBody = document.querySelector('.article--viewer') || document.querySelector('article') || document.body;

  // Clean up GFG-specific cruft inside the article body
  const elementsToRemove = articleBody.querySelectorAll(
    '.adsbygoogle, .gfg-footer, .header-main__wrapper, style, script, noscript, iframe, .side-bar, .rightBar'
  );
  elementsToRemove.forEach(el => el.remove());

  const images = articleBody.querySelectorAll('img');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    let src = img.getAttribute('src') || img.getAttribute('data-src');
    if (!src) continue;

    if (src.startsWith('//')) {
      src = 'https:' + src;
    } else if (src.startsWith('/')) {
      const urlObj = new URL(url);
      src = `${urlObj.protocol}//${urlObj.host}${src}`;
    }

    try {
      const ext = path.extname(src.split('?')[0]) || '.jpg';
      const safeExt = ext.split('#')[0];
      const imgFileName = `${id}-img-${i}${safeExt}`;
      const imgPath = path.join(IMAGES_DIR, imgFileName);

      const imgResponse = await axios.get(src, { responseType: 'arraybuffer' });
      await fs.writeFile(imgPath, imgResponse.data);

      img.setAttribute('src', `/images/${imgFileName}`);
      img.removeAttribute('srcset');
      img.removeAttribute('data-src');
    } catch (err) {
      // ignore
    }
  }

  const articleData = {
    id,
    title,
    content: articleBody.innerHTML,
    textContent: articleBody.textContent?.trim(),
    url,
  };

  const outPath = path.join(OUTPUT_DIR, `${id}.json`);
  await fs.writeFile(outPath, JSON.stringify(articleData, null, 2));
  console.log(`Saved article: ${id}`);
}

async function scrapeTutorialIndex(indexUrl: string, topicId: string) {
  await fs.ensureDir(OUTPUT_DIR);
  await fs.ensureDir(IMAGES_DIR);

  const html = await fetchHtml(indexUrl);
  const dom = new JSDOM(html, { url: indexUrl });
  const document = dom.window.document;

  const contentArea = document.querySelector('article') || document.querySelector('.article--viewer') || document.body;
  const links = contentArea.querySelectorAll('a');

  const articles: ArticleInfo[] = [];
  let count = 1;

  for (let i = 0; i < links.length; i++) {
    const link = links[i] as HTMLAnchorElement;
    let href = link.href;
    let title = link.textContent?.trim() || `Article ${count}`;

    if (!href || href.includes('#') || href.includes('tag') || href.includes('author') || href === indexUrl) continue;

    if (href.startsWith('/')) {
      href = `https://www.geeksforgeeks.org${href}`;
    }

    if (!href.includes('geeksforgeeks.org')) continue;

    if (articles.find(a => a.url === href)) continue;

    const id = `${topicId}-${count.toString().padStart(3, '0')}`;
    articles.push({ id, title, url: href });
    count++;
  }

  // Scrape 10 articles max for the demo
  const slicedArticles = articles.slice(0, 10);

  const indexData: IndexData = {
    title: document.title.replace(' - GeeksforGeeks', ''),
    articles: slicedArticles
  };

  const indexPath = path.join(OUTPUT_DIR, `${topicId}-index.json`);
  await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
  console.log(`Saved index with ${slicedArticles.length} articles to ${indexPath}`);

  for (const article of slicedArticles) {
    try {
      await processArticle(article.url, article.id);
    } catch (e) {
      console.error(`Skipping ${article.url} due to error`);
    }
    await delay(DELAY_BETWEEN_REQUESTS_MS);
  }
}

async function main() {
  console.log("Starting scraper...");

  await scrapeTutorialIndex(
    'https://www.geeksforgeeks.org/linux-tutorial/',
    'linux'
  );

  await scrapeTutorialIndex(
    'https://www.geeksforgeeks.org/distributed-systems/distributed-systems-tutorial/',
    'distributed-systems'
  );

  console.log("Scraping completed.");
}

main().catch(console.error);
