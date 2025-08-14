#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_FILE="$ROOT_DIR/terraform/terraform-output.json"

if [ ! -f "$OUT_FILE" ]; then
  echo "terraform-output.json not found at $OUT_FILE"
  echo "Run: bash scripts/deployment/apply-changes.sh"
  exit 1
fi

BUCKET=$(node -e "const o=require('$OUT_FILE'); const v=o.frontend_bucket_name?.value||o.frontend_bucket_name; console.log(v||'')")
DISTRIBUTION_ID=$(node -e "const o=require('$OUT_FILE'); const v=o.frontend_distribution_id?.value||o.frontend_distribution_id; console.log(v||'')")

if [ -z "$BUCKET" ] || [ "$BUCKET" = "null" ]; then
  echo "Bucket name missing from terraform outputs"
  exit 1
fi

echo "== Building frontend =="
pushd "$ROOT_DIR/frontend" >/dev/null
npm install
npm run build
popd >/dev/null

echo "== Uploading to s3://$BUCKET =="
aws s3 sync "$ROOT_DIR/frontend/build/" "s3://$BUCKET/" --delete --cache-control max-age=31536000,public --exclude index.html
aws s3 cp "$ROOT_DIR/frontend/build/index.html" "s3://$BUCKET/index.html" --cache-control no-cache,public --metadata-directive REPLACE

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "null" ]; then
  echo "== Creating CloudFront invalidation =="$DISTRIBUTION_ID
  aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/index.html" "/" >/dev/null || true
fi

echo "Deployment complete."


