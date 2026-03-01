#!/bin/bash
# verify-packages.sh - Verify package.json configurations for npm publishing

echo "=========================================="
echo "Verifying package.json configurations..."
echo "=========================================="

PASS=0
FAIL=0

for pkg in packages/*/package.json; do
  echo ""
  echo "----------------------------------------"
  echo "Checking: $pkg"
  echo "----------------------------------------"

  # Check main field
  main=$(jq -r '.main' "$pkg")
  if [[ "$main" == "dist/index.js" || "$main" == "./dist/cjs/index.js" ]]; then
    echo "✓ main field correct: $main"
    ((PASS++))
  else
    echo "✗ main field incorrect: $main (expected: dist/index.js or ./dist/cjs/index.js)"
    ((FAIL++))
  fi

  # Check types field
  types=$(jq -r '.types' "$pkg")
  if [[ "$types" != "null" && -n "$types" ]]; then
    echo "✓ types field present: $types"
    ((PASS++))
  else
    echo "✗ types field missing"
    ((FAIL++))
  fi

  # Check exports field
  exports=$(jq -r '.exports' "$pkg")
  if [[ "$exports" != "null" && -n "$exports" ]]; then
    echo "✓ exports field present"
    ((PASS++))
  else
    echo "✗ exports field missing"
    ((FAIL++))
  fi

  # Check files field
  files=$(jq -r '.files' "$pkg")
  if [[ "$files" != "null" && -n "$files" ]]; then
    echo "✓ files field present"
    # Check for LICENSE in files
    has_license=$(jq -r '.files[]' "$pkg" | grep -c "LICENSE" || true)
    if [[ "$has_license" -gt 0 ]]; then
      echo "  ✓ LICENSE included in files"
    else
      echo "  ⚠ LICENSE not included in files"
    fi
    ((PASS++))
  else
    echo "✗ files field missing"
    ((FAIL++))
  fi

  # Check for workspace dependencies
  workspace_deps=$(jq -r '.dependencies | to_entries[] | select(.value == "workspace:*") | .key' "$pkg" 2>/dev/null)
  if [[ -n "$workspace_deps" ]]; then
    echo "✓ workspace dependencies found:"
    echo "$workspace_deps" | while read -r dep; do
      echo "    - $dep: workspace:*"
    done
  fi
done

echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [[ $FAIL -eq 0 ]]; then
  echo "✓ All checks passed!"
  exit 0
else
  echo "✗ Some checks failed. Please review the output above."
  exit 1
fi
