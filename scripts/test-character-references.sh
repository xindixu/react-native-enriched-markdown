#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
build_dir=$(mktemp -d)
trap 'rm -rf "$build_dir"' EXIT

"${CC:-cc}" -O2 -c cpp/md4c/md4c.c -o "$build_dir/md4c.o"
objects=("$build_dir/md4c.o")
"${CC:-cc}" -O2 -c cpp/md4c/enrmrkd-entity.c -o "$build_dir/entity.o"
objects+=("$build_dir/entity.o")
"${CXX:-c++}" -std=c++17 -O2 -I cpp/md4c \
  cpp/parser/MD4CParser.cpp cpp/wasm/ASTSerializer.cpp cpp/tests/character_references.cpp \
  "${objects[@]}" -o "$build_dir/parser"

MARKDOWN_NATIVE_PARSER="$build_dir/parser" node --test scripts/character-references.test.cjs
