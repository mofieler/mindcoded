#!/bin/sh
set -eu

# Fresh resolve on Linux so optional native packages are not locked to Windows.
rm -rf node_modules package-lock.json
npm install --ignore-scripts --no-audit --no-fund

# npm < 11.3 often skips oxc-parser's optional Linux binding (npm/cli#4828).
OXC_VERSION="$(node -p "require('oxc-parser/package.json').version")"
npm install --no-save --ignore-scripts --no-audit --no-fund \
  "@oxc-parser/binding-linux-x64-gnu@${OXC_VERSION}" \
  "@oxc-parser/binding-linux-x64-musl@${OXC_VERSION}" || true

npx nuxt prepare
