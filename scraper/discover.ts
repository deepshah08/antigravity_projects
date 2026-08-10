import axios from 'axios';
import { JSDOM } from 'jsdom';
import fs from 'fs-extra';
import path from 'path';

const DEFAULT_URLS = [
  'https://www.geeksforgeeks.org/dsa-tutorial-learn-data-structures-and-algorithms/',
  'https://www.geeksforgeeks.org/python-tutorial/',
  'https://www.geeksforgeeks.org/java/',
  'https://www.geeksforgeeks.org/c-plus-plus/',
  'https://www.geeksforgeeks.org/c-programming-language/',
  'https://www.geeksforgeeks.org/sql-tutorial/',
  'https://www.geeksforgeeks.org/system-design-tutorial/',
  'https://www.geeksforgeeks.org/operating-systems/',
  'https://www.geeksforgeeks.org/computer-network-tutorials/',
  'https://www.geeksforgeeks.org/web-development/',
  'https://www.geeksforgeeks.org/devops-tutorial/',
  'https://www.geeksforgeeks.org/machine-learning/',
  'https://www.geeksforgeeks.org/linux-tutorial/',
  'https://www.geeksforgeeks.org/distributed-systems/distributed-systems-tutorial/'
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface Article {
  id: string;
  title: string;
  url: string;
}

interface Topic {
  id: string;
  title: string;
  indexUrl: string;
  articles: Article[];
}

interface Manifest {
  generatedAt: string;
  topics: Topic[];
}

function generateTopicId(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    const pathname = url.pathname.toLowerCase();
    if (pathname.includes('dsa-tutorial')) return 'dsa';
    if (pathname.includes('python')) return 'python';
    if (pathname.includes('java')) return 'java';
    if (pathname.includes('c-plus-plus')) return 'cpp';
    if (pathname.includes('c-programming')) return 'c';
    if (pathname.includes('sql')) return 'sql';
    if (pathname.includes('system-design')) return 'system-design';
    if (pathname.includes('operating-system')) return 'os';
    if (pathname.includes('computer-network')) return 'networking';
    if (pathname.includes('web-development')) return 'web-dev';
    if (pathname.includes('devops')) return 'devops';
    if (pathname.includes('machine-learning')) return 'ml-ai';
    if (pathname.includes('linux')) return 'linux';
    if (pathname.includes('distributed-systems')) return 'distributed-systems';

    const parts = url.pathname.split('/').filter(p => p);
    if (parts.length === 0) return 'unknown';
    const lastPart = parts[parts.length - 1];
    return lastPart.replace(/-tutorial$/, '');
  } catch (e) {
    return 'unknown';
  }
}

function formatTitle(id: string): string {
  return id.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') + ' Tutorial';
}

async function discover(urls: string[] = DEFAULT_URLS) {
  const topics: Topic[] = [];

  for (let i = 0; i < urls.length; i++) {
    const indexUrl = urls[i];
    console.log(`Fetching ${indexUrl}...`);
    
    try {
      const response = await axios.get(indexUrl, {
        headers: {
          'User-Agent': USER_AGENT
        }
      });
      
      const dom = new JSDOM(response.data, { url: indexUrl });
      const document = dom.window.document;
      
      const container = document.querySelector('.article--viewer') 
        || document.querySelector('article') 
        || document.body;
      
      const links = Array.from(container.querySelectorAll('a'));
      
      const seenUrls = new Set<string>();
      const articles: Article[] = [];
      let articleCount = 1;
      
      for (const link of links) {
        let href = link.href;
        
        try {
          const urlObj = new URL(href, indexUrl);
          href = urlObj.toString();
          
          if (!urlObj.hostname.includes('geeksforgeeks.org')) continue;
          
          const lowerHref = href.toLowerCase();
          if (lowerHref.includes('#') ||
              lowerHref.includes('tag') ||
              lowerHref.includes('author') ||
              lowerHref.includes('category') ||
              lowerHref.includes('page') ||
              lowerHref.includes('login') ||
              lowerHref.includes('signup')) {
            continue;
          }
          
          const normalizedHref = href.endsWith('/') ? href.slice(0, -1) : href;
          const normalizedIndexUrl = indexUrl.endsWith('/') ? indexUrl.slice(0, -1) : indexUrl;
          
          if (normalizedHref === normalizedIndexUrl) {
            continue;
          }
          
          if (seenUrls.has(normalizedHref)) continue;
          seenUrls.add(normalizedHref);
          
          const topicId = generateTopicId(indexUrl);
          
          articles.push({
            id: `${topicId}-${String(articleCount).padStart(3, '0')}`,
            title: link.textContent?.trim().replace(/\s+/g, ' ') || 'Untitled',
            url: href
          });
          
          articleCount++;
        } catch (e) {
          // Invalid URL, skip
        }
      }
      
      const topicId = generateTopicId(indexUrl);
      
      topics.push({
        id: topicId,
        title: formatTitle(topicId),
        indexUrl,
        articles
      });
      
    } catch (err) {
      console.error(`Error fetching ${indexUrl}:`, err);
    }
    
    if (i < urls.length - 1) {
      console.log('Waiting 1 second before next fetch...');
      await delay(1000);
    }
  }
  
  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    topics
  };
  
  const outputPath = path.join(__dirname, 'manifest.json');
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeJson(outputPath, manifest, { spaces: 2 });
  console.log(`Manifest written to ${outputPath} with ${topics.length} topics.`);
}

const args = process.argv.slice(2);
const urlsToScrape = args.length > 0 ? args : DEFAULT_URLS;

discover(urlsToScrape).catch(console.error);
