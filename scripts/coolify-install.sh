#!/bin/sh
set -eu

# Nixpacks installs npm 9.9.4, which crashes on this tree:
#   Cannot read properties of null (reading 'edgesOut')
# Skip Coolify's stale /root/.npm cache and install with npm 11.
export npm_config_cache=/tmp/npm-cache
export NPM_CONFIG_CACHE=/tmp/npm-cache
rm -rf node_modules package-lock.json /tmp/npm-cache

npx -y npm@11.5.2 install --no-audit --no-fund --include=optional --legacy-peer-deps

OXC_VERSION="$(node -p "try { require('oxc-parser/package.json').version } catch { '' }")"
if [ -n "$OXC_VERSION" ]; then
  npx -y npm@11.5.2 install --no-save --no-audit --no-fund --legacy-peer-deps \
    "@oxc-parser/binding-linux-x64-gnu@${OXC_VERSION}" || true
fi

npx nuxt prepare
