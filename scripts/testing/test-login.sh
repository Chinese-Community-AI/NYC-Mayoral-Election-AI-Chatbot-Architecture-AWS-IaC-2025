#!/usr/bin/env bash
set -euo pipefail

# Usage: bash scripts/testing/test-login.sh [username] [password]
USER_NAME=${1:-test}
PASSWORD=${2:-test123}

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_FILE="$ROOT_DIR/terraform/terraform-output.json"

if [ ! -f "$OUT_FILE" ]; then
  echo "terraform-output.json not found at $OUT_FILE"
  echo "Run: bash scripts/deployment/apply-changes.sh"
  exit 1
fi

API_URL=$(node -e "const o=require('$OUT_FILE'); const v=o.api_url?.value||o.api_url; console.log(v||'')")
if [ -z "$API_URL" ] || [ "$API_URL" = "null" ]; then
  echo "api_url missing from terraform outputs"
  exit 1
fi

LOGIN_ENDPOINT="${API_URL%/}/login"
echo "POST $LOGIN_ENDPOINT"

RESP=$(curl -sS -X POST \
  -H "Content-Type: application/json" \
  --data "{\"username\":\"$USER_NAME\",\"password\":\"$PASSWORD\"}" \
  "$LOGIN_ENDPOINT")

echo "$RESP" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);console.log('username:',j.username);console.log('token:',(j.token||'').slice(0,20)+'...');}catch(e){console.log(s);}})"


