# Offline Knowledge Center

This project allows you to scrape tutorial websites (currently configured for GeeksForGeeks) and build a lightweight, offline-compatible Single Page Application (PWA) to read those tutorials without ads or distractions.

## Technical Details

### Architecture
- **Frontend (SPA):** Built with Vite, React, and Tailwind CSS. We use `vite-plugin-pwa` to turn the site into a Progressive Web App. The frontend fetches article data from statically generated JSON files in the `/public/data` directory, meaning no backend server is required.
- **Scraper:** A Node.js module (using TypeScript, Axios, JSDOM, and Mozilla Readability).
  - The scraper fetches a main index page, discovers all links within a specific CSS selector, and queues them up.
  - To respect rate limits and ensure we bypass basic protections, we implement a delay between requests.
  - Mozilla Readability (the same library behind Firefox's Reader View) is used to cleanly extract the title and core article content while ignoring sidebars, ads, and footers.
  - Images are downloaded locally and rewritten in the HTML, ensuring full offline functionality.
- **State Management:** User progress (bookmarks and "completed" articles) is stored in the browser's `localStorage`.

### Why this stack?
- **Vite + React:** extremely fast development cycle, minimal overhead, and easy to configure as a static PWA.
- **Mozilla Readability:** The most robust, battle-tested automatic article extraction tool available. It means we don't have to write custom CSS selectors for every single paragraph or code block on GeeksForGeeks.
- **TailwindCSS:** Provides quick utility classes, making it simple to implement the requested "Terminal Pro" aesthetic (dark mode, Outfit font, orange accents).

## Usage

1. Run the scraper: `cd scraper && npx tsx index.ts`
2. Run the frontend: `cd offline-knowledge-center && npm run dev`
3. Build for production: `cd offline-knowledge-center && npm run build`
