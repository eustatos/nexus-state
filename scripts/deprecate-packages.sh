#!/bin/bash
# Deprecate 6 micro-packages that were consolidated into @nexus-state/extras
# Run: bash scripts/deprecate-packages.sh

set -e

MSG="DEPRECATED: This package has been consolidated into @nexus-state/extras. Use @nexus-state/extras instead. See https://nexus-state.website.yandexcloud.net/guides/migration for details."

PACKAGES=(
  "@nexus-state/async"
  "@nexus-state/family"
  "@nexus-state/immer"
  "@nexus-state/persist"
  "@nexus-state/middleware"
  "@nexus-state/web-worker"
)

echo "Make sure you are logged in: npm login"
echo ""

for pkg in "${PACKAGES[@]}"; do
  echo "Deprecating $pkg..."
  npm deprecate "$pkg" "$MSG"
  echo "  ✓ $pkg deprecated"
done

echo ""
echo "All 6 packages deprecated successfully."
