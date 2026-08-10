import fs from 'fs-extra';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import path from 'path';
// Node CommonJS provides __dirname and __filename natively

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImage(url: string, outputPath: string) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            headers: { 'User-Agent': USER_AGENT }
        });
        await fs.outputFile(outputPath, response.data);
    } catch (error) {
        console.error(`Failed to download image ${url}:`, error);
    }
}

async function run() {
    const basePath = path.join(__dirname, '..');
    const dataDir = path.join(basePath, 'offline-knowledge-center', 'public', 'data');
    const imagesDir = path.join(basePath, 'offline-knowledge-center', 'public', 'images');

    await fs.ensureDir(dataDir);
    await fs.ensureDir(imagesDir);

    const manifestPath = path.join(__dirname, 'manifest.json');
    let manifest;
    try {
        manifest = await fs.readJson(manifestPath);
    } catch (e) {
        console.error(`Could not read manifest from ${manifestPath}`);
        return;
    }

    // Build a URL -> { topicId, articleId } lookup map
    const urlMap = new Map<string, { topicId: string; articleId: string }>();
    for (const topic of manifest.topics || []) {
        for (const article of topic.articles || []) {
            const normUrl = article.url.replace(/\/$/, '');
            urlMap.set(normUrl, { topicId: topic.id, articleId: article.id });
        }
    }

    const topicsRegistry: any = { topics: [] };

    for (const topic of manifest.topics || []) {
        let icon = 'book';
        if (topic.id === 'linux') icon = 'terminal';
        else if (topic.id === 'distributed-systems') icon = 'network';

        const topicIndex: any = {
            id: topic.id,
            title: topic.title,
            articles: []
        };

        let articleCount = 0;

        for (const articleInfo of topic.articles || []) {
            console.log(`Processing article ${articleInfo.id} from ${articleInfo.url}`);
            try {
                await wait(2000); // Respect rate limits

                const response = await axios.get(articleInfo.url, {
                    headers: { 'User-Agent': USER_AGENT }
                });

                const dom = new JSDOM(response.data);
                const document = dom.window.document;

                // Extract content
                let contentNode = document.querySelector('.article--viewer .text') || document.querySelector('article .text');
                if (!contentNode) {
                    contentNode = document.body;
                }

                if (contentNode) {
                    // Strip unwanted elements
                    const selectorsToRemove = ['script', 'iframe', '.adsbygoogle', '.gfg-footer', '.side-bar', '.rightBar', '.ads', '.sidebar'];
                    selectorsToRemove.forEach(sel => {
                        const elements = contentNode!.querySelectorAll(sel);
                        elements.forEach(el => el.parentNode?.removeChild(el));
                    });

                    // Handle images
                    const images = contentNode.querySelectorAll('img');
                    let imgIndex = 1;
                    for (const img of Array.from(images)) {
                        const src = img.getAttribute('src');
                        if (src) {
                            // Resolve relative URLs
                            const imgUrl = new URL(src, articleInfo.url).href;
                            const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
                            const filename = `${articleInfo.id}-img-${imgIndex}${ext}`;
                            const localPath = path.join(imagesDir, filename);
                            
                            await downloadImage(imgUrl, localPath);
                            
                            img.setAttribute('src', `/images/${filename}`);
                            imgIndex++;
                        }
                    }

                    // Handle hyperlinks (rewrite internal GFG links to SPA router links)
                    const links = contentNode.querySelectorAll('a');
                    for (const a of Array.from(links)) {
                        const href = a.getAttribute('href');
                        if (href) {
                            try {
                                const fullUrl = new URL(href, articleInfo.url).href.replace(/\/$/, '');
                                const targetArticle = urlMap.get(fullUrl);
                                if (targetArticle) {
                                    a.setAttribute('href', `/#/article/${targetArticle.topicId}/${targetArticle.articleId}`);
                                } else if (href.startsWith('http://') || href.startsWith('https://')) {
                                    a.setAttribute('target', '_blank');
                                    a.setAttribute('rel', 'noopener noreferrer');
                                }
                            } catch (e) {
                                // ignore invalid URL
                            }
                        }
                    }

                    const cleanedHtml = contentNode.innerHTML;
                    const textContent = contentNode.textContent || '';
                    const title = document.querySelector('title')?.textContent || articleInfo.id;

                    const articleData = {
                        id: articleInfo.id,
                        title,
                        content: cleanedHtml,
                        textContent: textContent.trim(),
                        url: articleInfo.url
                    };

                    const articleDataPath = path.join(dataDir, `${articleInfo.id}.json`);
                    await fs.writeJson(articleDataPath, articleData, { spaces: 2 });

                    topicIndex.articles.push({ id: articleInfo.id, title });
                    articleCount++;
                }
            } catch (error) {
                console.error(`Error processing article ${articleInfo.id}:`, error);
            }
        }

        const topicIndexPath = path.join(dataDir, `${topic.id}-index.json`);
        await fs.writeJson(topicIndexPath, topicIndex, { spaces: 2 });

        topicsRegistry.topics.push({
            id: topic.id,
            title: topic.title,
            articleCount,
            icon
        });
    }

    const registryPath = path.join(dataDir, 'topics-registry.json');
    await fs.writeJson(registryPath, topicsRegistry, { spaces: 2 });
    console.log('Done!');
}

run().catch(console.error);
