#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

<<<<<<< HEAD
echo "Building the Next.js static export..."
pnpm next build

echo "Creating out directory for static export..."
mkdir -p out
=======
echo "Building the Next.js project..."
pnpm next build

echo "Bundling server with tsup..."
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify
>>>>>>> f2489fbff9d043b08412c8207f533099dbe402e1

echo "Build completed successfully!"
