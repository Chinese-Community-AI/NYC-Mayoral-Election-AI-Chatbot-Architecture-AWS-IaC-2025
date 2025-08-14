#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo "== Installing Lambda deps =="
pushd "$ROOT_DIR/src/functions/message-handler" >/dev/null
npm install --silent || true
popd >/dev/null

pushd "$ROOT_DIR/src/functions/streaming-handler" >/dev/null
npm install --silent || true
popd >/dev/null

pushd "$ROOT_DIR/src/functions/auth-handler" >/dev/null
npm install --silent || true
popd >/dev/null

echo "== Terraform apply =="
pushd "$ROOT_DIR/terraform" >/dev/null
terraform init -input=false -upgrade
terraform apply -auto-approve
terraform output -json > terraform-output.json
popd >/dev/null

echo "== Update frontend config =="
pushd "$ROOT_DIR/frontend" >/dev/null
if [ ! -f src/config.js ]; then
  cp src/config.js.example src/config.js
fi
npm run update-config || true
popd >/dev/null

echo "Done."


