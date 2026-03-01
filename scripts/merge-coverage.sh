#!/bin/bash
mkdir -p coverage
> coverage/lcov.info
for file in packages/*/coverage/lcov.info; do
  if [ -f "$file" ]; then
    package_name=$(echo "$file" | sed 's|packages/\([^/]*\)/coverage/lcov.info|\1|')
    echo "Processing: $package_name"
    sed "s|^SF:|SF:packages/$package_name/|g" "$file" >> coverage/lcov.info
  fi
done
echo "Done"
grep "^SF:" coverage/lcov.info | sort | uniq | head -20
