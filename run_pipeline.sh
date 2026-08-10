#!/bin/bash
set -e

# Define colors for logging
CYAN='\033[1;36m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

# Error handler for non-zero exit codes
trap 'echo -e "${RED}Pipeline aborted due to an error!${NC}" >&2' ERR

ROOT_DIR="$PWD"

echo -e "${CYAN}[STEP 1/5] Installing scraper dependencies...${NC}"
cd scraper
npm install

echo -e "${CYAN}[STEP 2/5] Discovering topics...${NC}"
npm run discover

echo -e "${CYAN}[STEP 3/5] Scraping offline JSON files...${NC}"
npm run scrape "$ROOT_DIR/offline-knowledge-center/public/data/"

echo -e "${CYAN}[STEP 4/5] Exporting clean .md files...${NC}"
npm run export "$ROOT_DIR/exported-markdown/"

echo -e "${CYAN}[STEP 5/5] Building offline-knowledge-center Vite app...${NC}"
cd "$ROOT_DIR/offline-knowledge-center"
npm install
npm run build

echo -e "${GREEN}Pipeline completed successfully!${NC}"
