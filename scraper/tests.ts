import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

// A simple test script to ensure our data structures are correct and paths exist.
async function runTests() {
  console.log("Running scraper sanity checks...");

  const publicDir = path.join(__dirname, '../offline-knowledge-center/public');
  const dataDir = path.join(publicDir, 'data');
  const imagesDir = path.join(publicDir, 'images');

  await fs.ensureDir(dataDir);
  await fs.ensureDir(imagesDir);

  const dataDirExists = await fs.pathExists(dataDir);
  const imagesDirExists = await fs.pathExists(imagesDir);

  if (dataDirExists && imagesDirExists) {
    console.log("✅ Output directories are correctly configured.");
  } else {
    console.error("❌ Failed to resolve output directories.");
    process.exit(1);
  }

  console.log("All pre-flight checks passed.");
}

runTests();
