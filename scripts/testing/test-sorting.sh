#!/usr/bin/env bash
set -euo pipefail

API_URL=$(grep -o 'graphqlEndpoint: "[^"]*"' frontend/src/config.js | cut -d'"' -f2 || true)
API_KEY=$(grep -o 'apiKey: "[^"]*"' frontend/src/config.js | cut -d'"' -f2 || true)

if [ -z "${API_URL:-}" ] || [ -z "${API_KEY:-}" ]; then
  echo "Missing API URL or API Key in frontend/src/config.js"
  exit 1
fi

create_conversation() {
  local title=$1
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{"query": "mutation CreateConversation($t:String){ createConversation(title:$t){ id title createdAt updatedAt }}","variables":{"t":"'$title'"}}' \
    "$API_URL"
}

send_message() {
  local conv=$1
  local content=$2
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{"query": "mutation SendMessage($id:ID!,$c:String!){ sendMessage(conversationId:$id, content:$c){ id }}","variables":{"id":"'$conv'","c":"'$content'"}}' \
    "$API_URL"
}

list_recent() {
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{"query": "query { listRecentConversations(limit:20){ id title updatedAt }}"}' \
    "$API_URL" | jq .
}

id1=$(create_conversation "First" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4); sleep 2
id2=$(create_conversation "Second"| grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4); sleep 2
id3=$(create_conversation "Third" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4); sleep 2

list_recent
send_message "$id1" "Hello 1"; sleep 2
list_recent
send_message "$id2" "Hello 2"; sleep 2
list_recent


