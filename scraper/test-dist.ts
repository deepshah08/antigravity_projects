import axios from 'axios';
import { JSDOM } from 'jsdom';

async function test() {
  const url = 'https://www.geeksforgeeks.org/distributed-systems/distributed-systems-tutorial/';
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const dom = new JSDOM(res.data);
  const allLinks = Array.from(dom.window.document.querySelectorAll('a')).map(a => a.href);

  const distLinks = allLinks.filter(l => l.includes('distributed'));
  console.log("Dist related links:", distLinks.slice(0, 10));
}
test();
