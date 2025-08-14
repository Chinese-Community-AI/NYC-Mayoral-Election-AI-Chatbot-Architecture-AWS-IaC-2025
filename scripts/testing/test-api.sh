#!/usr/bin/env bash
set -euo pipefail

# Requires: jq

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_FILE="$ROOT_DIR/terraform/terraform-output.json"

if [ ! -f "$OUT_FILE" ]; then
  echo "terraform-output.json not found at $OUT_FILE"
  echo "Run: bash scripts/deployment/apply-changes.sh"
  exit 1
fi

GRAPHQL_ENDPOINT=$(jq -r '.appsync_graphql_endpoint.value // .appsync_graphql_endpoint // empty' "$OUT_FILE")
API_KEY=$(jq -r '.appsync_api_key.value // .appsync_api_key // empty' "$OUT_FILE")

if [ -z "$GRAPHQL_ENDPOINT" ]; then
  echo "GraphQL endpoint missing from terraform outputs"
  exit 1
fi

QUERY='{ "query": "query ListConversations { listConversations { id title updatedAt } }" }'

echo "Endpoint: $GRAPHQL_ENDPOINT"

if [ -n "$API_KEY" ] && [ "$API_KEY" != "null" ]; then
  echo "Using API key authentication"
  curl -sS -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    --data "$QUERY" \
    "$GRAPHQL_ENDPOINT" | jq .
else
  echo "No API key in outputs. Provide Authorization: Bearer <JWT>"
  echo "Example: AUTH=\"Bearer YOUR_JWT\" scripts/testing/test-api.sh"
  AUTH_HEADER=${AUTH:-}
  if [ -z "$AUTH_HEADER" ]; then
    echo "Skipping call (no AUTH env)."
    exit 0
  fi
  curl -sS -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: $AUTH_HEADER" \
    --data "$QUERY" \
    "$GRAPHQL_ENDPOINT" | jq .
fi


