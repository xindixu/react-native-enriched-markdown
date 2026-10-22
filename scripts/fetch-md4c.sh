#!/bin/bash
set -euo pipefail

REPO="hryhoriiK97/md4c"
BRANCH="master"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}/src"
DEST_DIR="$(cd "$(dirname "$0")/.." && pwd)/cpp/md4c"

FILES=(
  "md4c.c"
  "md4c.h"
)

echo "Fetching md4c sources from github.com/${REPO} (branch: ${BRANCH})..."

mkdir -p "$DEST_DIR"

for file in "${FILES[@]}"; do
  url="${BASE_URL}/${file}"
  dest="${DEST_DIR}/${file}"
  echo "  ${url} -> ${dest}"
  curl -fSL --retry 3 "$url" -o "$dest"
done

ENTITY_REVISION="131d261d07b14ef6a2edeb30e09b411101fd9688"
ENTITY_BASE_URL="https://raw.githubusercontent.com/software-mansion/enriched-markdown/${ENTITY_REVISION}/packages/core/cpp/enrmrkd"
for file in enrmrkd-entity.c enrmrkd-entity.h; do
  curl -fSL --retry 3 "${ENTITY_BASE_URL}/${file}" -o "${DEST_DIR}/${file}"
done

echo "Done. Files updated in ${DEST_DIR}"
