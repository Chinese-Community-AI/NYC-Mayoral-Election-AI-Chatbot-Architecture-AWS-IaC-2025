#!/bin/bash
set -euo pipefail

# Load configuration
source "$(dirname "$0")/../config.sh"

echo "Testing conversation sorting..."

# Login and get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ]; then
  echo "Login failed"
  exit 1
fi

echo "Token obtained"

# Create test conversations
echo "Creating test conversations..."

CONV1_RESPONSE=$(curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation { createConversation(title: \"First Conversation\") { id title } }"
  }')

CONV1_ID=$(echo "$CONV1_RESPONSE" | jq -r '.data.createConversation.id')
echo "Created conversation 1: $CONV1_ID"

sleep 2

CONV2_RESPONSE=$(curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation { createConversation(title: \"Second Conversation\") { id title } }"
  }')

CONV2_ID=$(echo "$CONV2_RESPONSE" | jq -r '.data.createConversation.id')
echo "Created conversation 2: $CONV2_ID"

sleep 2

CONV3_RESPONSE=$(curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation { createConversation(title: \"Third Conversation\") { id title } }"
  }')

CONV3_ID=$(echo "$CONV3_RESPONSE" | jq -r '.data.createConversation.id')
echo "Created conversation 3: $CONV3_ID"

# Send messages to update timestamps
echo "Sending messages to update timestamps..."

# Message to conversation 1 (oldest activity)
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"query\": \"mutation { sendMessage(conversationId: \\\"$CONV1_ID\\\", content: \\\"Hello from conversation 1\\\") { id } }\"
  }" > /dev/null

sleep 2

# Message to conversation 3 (most recent activity)
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"query\": \"mutation { sendMessage(conversationId: \\\"$CONV3_ID\\\", content: \\\"Hello from conversation 3\\\") { id } }\"
  }" > /dev/null

sleep 2

# Message to conversation 2 (middle activity)
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"query\": \"mutation { sendMessage(conversationId: \\\"$CONV2_ID\\\", content: \\\"Hello from conversation 2\\\") { id } }\"
  }" > /dev/null

echo "Messages sent"

# Wait a moment for processing
sleep 3

# Test sorting
echo "Testing conversation sorting (should be: Conv2, Conv3, Conv1)..."

CONVERSATIONS_RESPONSE=$(curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query { listRecentConversations { id title updated_at } }"
  }')

echo "Recent conversations (most recent first):"
echo "$CONVERSATIONS_RESPONSE" | jq -r '.data.listRecentConversations[] | "\(.title) - \(.updated_at)"'

echo "Sorting test complete!"