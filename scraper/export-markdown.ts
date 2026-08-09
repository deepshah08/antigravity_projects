import * as fs from 'fs-extra';
import * as path from 'path';

interface ArticleManifest {
  articleId: string;
  title: string;
  topicId: string;
}

interface ArticleData {
  title: string;
  textContent: string;
}

function sanitizeFilename(name: string): string {
  // Replace spaces with underscores and remove characters not allowed in filenames
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
}

async function main() {
  const manifestPath = path.join(__dirname, 'manifest.json');
  const articlesDir = path.join(__dirname, '..', '..', 'offline-knowledge-center', 'public', 'data');
  const outputBaseDir = path.join(__dirname, '..', '..', 'OfflineTutor', 'data_buffer', 'gfg');

  console.log(`Loading manifest from: ${manifestPath}`);
  let manifest: ArticleManifest[];
  try {
    manifest = await fs.readJson(manifestPath);
  } catch (error: any) {
    console.error(`Failed to read manifest: ${error.message}`);
    return;
  }

  for (const item of manifest) {
    const { articleId, title, topicId } = item;
    const articleFilePath = path.join(articlesDir, `${articleId}.json`);

    try {
      const articleData: ArticleData = await fs.readJson(articleFilePath);

      const safeTitle = sanitizeFilename(articleData.title || title);
      const markdownContent = `# ${articleData.title || title}\n\n${articleData.textContent || ''}\n`;

      const outputDir = path.join(outputBaseDir, topicId);
      await fs.ensureDir(outputDir);

      const outputPath = path.join(outputDir, `${safeTitle}.txt`);
      await fs.writeFile(outputPath, markdownContent, 'utf-8');

      console.log(`Successfully exported: ${title} to ${outputPath}`);
    } catch (error: any) {
      console.error(`Failed to process article ${articleId} (${title}): ${error.message}`);
    }
  }

  console.log('Export process completed.');
}

main().catch(console.error);
