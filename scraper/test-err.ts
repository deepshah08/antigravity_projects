import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import * as fs from 'fs';

async function test() {
  const url = 'https://www.geeksforgeeks.org/linux-unix/introduction-to-linux-operating-system/';
  try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      fs.writeFileSync('debug.html', res.data);
      const dom = new JSDOM(res.data, { url });

      // Let's strip less stuff. Readability might be failing because we stripped too much in index.ts
      // In the debug script we don't strip anything and see if it works
      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      if (!article) {
          console.log("Failed to parse article even without stripping.");

          // Fallback parsing strategy if Readability fails: Extract manually
          const title = dom.window.document.querySelector('h1')?.textContent;
          const articleBody = dom.window.document.querySelector('.article--viewer') || dom.window.document.querySelector('article');
          console.log("Fallback title:", title);
          console.log("Fallback body exists:", !!articleBody);
          if (articleBody) {
             console.log("Fallback content length:", articleBody.textContent?.length);
          }
      } else {
          console.log("Success! Title:", article.title);
      }
  } catch(e) {
      console.log("Error:", (e as any).message);
  }
}
test();
