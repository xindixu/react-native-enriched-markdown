#!/usr/bin/env bash
# Compile md4c + the WASM wrapper to a single self-contained JS file.
#
# Prerequisites:
#   Emscripten 5.0.4
#   # See https://emscripten.org/docs/getting_started/downloads.html
#   # or use: docker run --rm -v "$PWD":/src -w /src \
#   #              emscripten/emsdk:5.0.4 bash cpp/wasm/build.sh
#
# Usage:
#   bash cpp/wasm/build.sh
#
# Output:
#   src/web/wasm/md4c.js   — Emscripten glue with WASM binary inlined as base64
#                            (SINGLE_FILE=1 means no separate .wasm file is needed)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUT_DIR="$REPO_ROOT/src/web/wasm"
EXPECTED_EMSCRIPTEN_VERSION="5.0.4"

EMSCRIPTEN_VERSION="$({ emcc --version || true; } | awk '
  NR == 1 {
    for (i = 1; i <= NF; i += 1) {
      if ($i ~ /^[0-9]+\.[0-9]+\.[0-9]+$/) {
        print $i
        exit
      }
    }
  }
')"

if [[ "$EMSCRIPTEN_VERSION" != "$EXPECTED_EMSCRIPTEN_VERSION" ]]; then
  echo "Expected Emscripten $EXPECTED_EMSCRIPTEN_VERSION, found ${EMSCRIPTEN_VERSION:-none}." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "Building md4c WASM…"

# Compile the C file separately (no -std=c++17)
emcc \
  -I "$REPO_ROOT/cpp" \
  -ffile-prefix-map="$REPO_ROOT"=. \
  -O2 \
  -c "$REPO_ROOT/cpp/md4c/md4c.c" \
  -o "$OUT_DIR/md4c.o"

# Compile C++ sources and link everything together
emcc \
  "$SCRIPT_DIR/md4c_wasm.cpp" \
  "$SCRIPT_DIR/ASTSerializer.cpp" \
  "$REPO_ROOT/cpp/parser/MD4CParser.cpp" \
  "$OUT_DIR/md4c.o" \
  -I "$REPO_ROOT/cpp" \
  -I "$SCRIPT_DIR" \
  -ffile-prefix-map="$REPO_ROOT"=. \
  -O2 \
  -std=c++17 \
  -Wswitch \
  -s WASM=1 \
  -s SINGLE_FILE=1 \
  -s EXPORTED_FUNCTIONS='["_parseMarkdown"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString"]' \
  -s ENVIRONMENT='web' \
  -s MODULARIZE=1 \
  -s EXPORT_NAME='createMd4cModule' \
  -o "$OUT_DIR/md4c.js"

rm "$OUT_DIR/md4c.o"

echo "Done → $OUT_DIR/md4c.js"
