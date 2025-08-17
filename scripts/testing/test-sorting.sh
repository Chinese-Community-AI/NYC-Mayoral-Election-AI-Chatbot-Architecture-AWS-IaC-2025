#!/bin/bash

# Script to test the time-based sorting functionality
# This script creates multiple conversations, sends messages to them,
# and verifies that the listRecentConversations query returns them in the correct order

# Set variables
API_URL=$(grep -o 'graphqlEndpoint: "[^"]*"' frontend/src/config.js | cut -d'"' -f2)
API_KEY=$(grep -o 'apiKey: "[^"]*"' frontend/src/config.js | cut -d'"' -f2)

if [ -z "$API_URL" ] || [ -z "$API_KEY" ]; then
  echo "Error: Could not find API URL or API Key in frontend/src/config.js"
  echo "Please run ./apply-changes.sh first to update the configuration"
  exit 1
fi

echo "===== Testing Time-Based Sorting ====="
echo "API URL: $API_URL"
echo "API Key: ${API_KEY:0:5}...${API_KEY: -5}"

# Function to create a conversation
create_conversation() {
  local title=$1
  echo "Creating conversation: $title"
  
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{\"query\": \"mutation CreateConversation { createConversation(title: \\\"$title\\\") { id title createdAt updatedAt } }\"}" \
    "$API_URL")
  
  echo "Response: $response"
  
  # Extract conversation ID
  conversation_id=$(echo "$response" | jq -r '.data.createConversation.id')
  
  if [ "$conversation_id" = "null" ] || [ -z "$conversation_id" ]; then
    echo "Error: Failed to create conversation"
    echo "Response: $response"
    exit 1
  fi
  
  echo "Created conversation ID: $conversation_id"
  echo "$conversation_id"
}

# Function to send a message to a conversation
send_message() {
  local conversation_id=$1
  local message_content=$2
  echo "Sending message to conversation $conversation_id: $message_content"
  
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{\"query\": \"mutation SendMessage { sendMessage(conversationId: \\\"$conversation_id\\\", content: \\\"$message_content\\\") { id content role timestamp } }\"}" \
    "$API_URL")
  
  echo "Message response: $response"
}

# Function to list recent conversations
list_recent_conversations() {
  echo "Listing recent conversations..."
  
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{"query": "query ListRecentConversations { listRecentConversations { id title createdAt updatedAt } }"}' \
    "$API_URL")
  
  echo "Recent conversations response: $response"
  
  # Parse and display conversation titles with timestamps
  echo "Parsed conversations (most recent first):"
  echo "$response" | jq -r '.data.listRecentConversations[] | "\(.title) - Updated: \(.updatedAt)"'
}

# Main test sequence
echo "Starting time-based sorting test..."

# Create conversations with delays to ensure different timestamps
echo "Step 1: Creating first conversation..."
CONV1_ID=$(create_conversation "First Conversation")
sleep 2

echo "Step 2: Creating second conversation..."
CONV2_ID=$(create_conversation "Second Conversation")
sleep 2

echo "Step 3: Creating third conversation..."
CONV3_ID=$(create_conversation "Third Conversation")
sleep 2

# Send messages to update conversation timestamps in reverse order
echo "Step 4: Sending message to first conversation (will be oldest after messages)"
send_message "$CONV1_ID" "Hello from first conversation"
sleep 2

echo "Step 5: Sending message to third conversation (will be middle after messages)"
send_message "$CONV3_ID" "Hello from third conversation"
sleep 2

echo "Step 6: Sending message to second conversation (will be most recent after messages)"
send_message "$CONV2_ID" "Hello from second conversation"
sleep 2

# List conversations to verify sorting
echo "Step 7: Verifying conversation order..."
list_recent_conversations

echo "===== Test Complete ====="
echo "Expected order (most recent first): Second Conversation, Third Conversation, First Conversation"