import axios from 'axios';
import { JSDOM } from 'jsdom';

async function test() {
  const url = 'https://www.geeksforgeeks.org/linux-tutorial/';
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const dom = new JSDOM(res.data);
  // GFG changed their layout, we need to find where the tutorial links actually live.
  const allLinks = Array.from(dom.window.document.querySelectorAll('a')).map(a => a.href);
  console.log("Found total links:", allLinks.length);

  // Let's find links that contain "linux" in them
  const linuxLinks = allLinks.filter(l => l.includes('linux'));
  console.log("Linux related links:", linuxLinks.slice(0, 10));

  // Let's print out the classes of the main content area to identify the sidebar
  const mainDivs = Array.from(dom.window.document.querySelectorAll('div[class]')).map(d => d.className);
  console.log("Some classes:", mainDivs.filter(c => c.includes('side') || c.includes('nav') || c.includes('menu')).slice(0, 10));
}
test();
