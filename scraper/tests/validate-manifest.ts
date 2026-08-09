import * as fs from 'fs-extra';
import * as path from 'path';

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

async function validateManifest() {
  const manifestPath = path.join(__dirname, '../manifest.json');
  console.log(`Loading manifest from ${manifestPath}...`);

  if (!await fs.pathExists(manifestPath)) {
    console.error('❌ Manifest file does not exist.');
    process.exit(1);
  }

  const manifest: Manifest = await fs.readJson(manifestPath);
  let hasErrors = false;

  // 1. Validate generatedAt
  if (!manifest.generatedAt || isNaN(Date.parse(manifest.generatedAt))) {
    console.error('❌ Invalid or missing generatedAt');
    hasErrors = true;
  } else {
    console.log('✅ generatedAt is valid');
  }

  // 2. Validate topics array
  if (!manifest.topics || !Array.isArray(manifest.topics) || manifest.topics.length === 0) {
    console.error('❌ Topics array is missing or empty');
    hasErrors = true;
  } else {
    console.log(`✅ Found ${manifest.topics.length} topics`);
  }

  const allUrls = new Set<string>();
  const allIds = new Set<string>();
  let totalArticles = 0;

  for (const topic of manifest.topics || []) {
    console.log(`\nValidating topic: ${topic.title} (${topic.id})`);

    if (!topic.id || typeof topic.id !== 'string') {
      console.error(`  ❌ Topic is missing a valid id`);
      hasErrors = true;
    }
    if (!topic.title || typeof topic.title !== 'string') {
      console.error(`  ❌ Topic ${topic.id} is missing a valid title`);
      hasErrors = true;
    }
    if (!topic.indexUrl || !topic.indexUrl.startsWith('https://www.geeksforgeeks.org')) {
      console.error(`  ❌ Topic ${topic.id} has an invalid indexUrl: ${topic.indexUrl}`);
      hasErrors = true;
    }
    if (!Array.isArray(topic.articles)) {
      console.error(`  ❌ Topic ${topic.id} has invalid articles array`);
      hasErrors = true;
      continue;
    }

    console.log(`  ✅ Schema valid. Found ${topic.articles.length} articles.`);
    totalArticles += topic.articles.length;

    for (const article of topic.articles) {
      if (!article.id || typeof article.id !== 'string') {
        console.error(`    ❌ Invalid article id in topic ${topic.id}`);
        hasErrors = true;
      } else {
        if (allIds.has(article.id)) {
          console.error(`    ❌ Duplicate article id found: ${article.id}`);
          hasErrors = true;
        }
        allIds.add(article.id);
      }

      if (!article.title || typeof article.title !== 'string') {
        console.error(`    ❌ Invalid article title for id ${article.id}`);
        hasErrors = true;
      }

      if (!article.url || !article.url.startsWith('https://') || !article.url.includes('geeksforgeeks.org')) {
        console.error(`    ❌ Invalid article url for id ${article.id}: ${article.url}`);
        hasErrors = true;
      } else {
        // Strip trailing slash for duplicate checking
        const normalizedUrl = article.url.endsWith('/') ? article.url.slice(0, -1) : article.url;
        if (allUrls.has(normalizedUrl)) {
          console.error(`    ❌ Duplicate article url found: ${article.url}`);
          hasErrors = true;
        }
        allUrls.add(normalizedUrl);
      }
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total Articles: ${totalArticles}`);
  console.log(`Unique URLs: ${allUrls.size}`);
  console.log(`Unique IDs: ${allIds.size}`);

  if (hasErrors) {
    console.error('\n❌ Manifest validation failed.');
    process.exit(1);
  } else {
    console.log('\n✅ Manifest validation passed successfully!');
    process.exit(0);
  }
}

validateManifest().catch(err => {
  console.error('❌ Unhandled error during validation:', err);
  process.exit(1);
});
