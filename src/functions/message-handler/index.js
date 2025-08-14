"use strict";

const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event));

  const action = event?.action;
  const args = event?.arguments || {};
  const userId = event?.identity?.resolverContext?.userId || "default-user";

  try {
    switch (action) {
      case "listConversations":
        return await listConversations(userId);
      case "getConversation":
        return await getConversation(args.id, userId);
      case "createConversation":
        return await createConversation(args.title, userId);
      case "listRecentConversations":
        return await listRecentConversations(args.limit, userId);
      case "getMessage":
        return await getMessage(args.id, args.conversationId, userId);
      case "getMessages":
        return await getMessages(args.conversationId, userId);
      case "sendMessage":
        return await sendMessage(args.conversationId, args.content, userId);
      case "updateMessageContent":
        return await updateMessageContent(
          args.messageId,
          args.conversationId,
          args.content,
          args.isComplete
        );
      default:
        return { ok: true };
    }
  } catch (e) {
    console.error("Handler error:", e);
    throw e;
  }
};

async function listConversations(userId) {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
    },
  };
  const result = await dynamodb.query(params).promise();
  return (result.Items || []).map((item) => ({
    id: item.id,
    userId: item.userId,
    title: item.title,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

async function getConversation(id, userId) {
  // Verify ownership via user-conversation mapping
  const check = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `CONV#${id}` },
    })
    .promise();
  if (!check.Item) return null;

  return {
    id: check.Item.id,
    userId: check.Item.userId,
    title: check.Item.title,
    createdAt: check.Item.createdAt,
    updatedAt: check.Item.updatedAt,
  };
}

async function getMessage(id, conversationId, userId) {
  const userConv = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `CONV#${conversationId}` },
    })
    .promise();
  if (!userConv.Item) return null;
  const res = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: { PK: `CONV#${conversationId}`, SK: `MSG#${id}` },
    })
    .promise();
  if (!res.Item) return null;
  return {
    id: res.Item.id,
    conversationId: res.Item.conversationId,
    content: res.Item.content,
    role: res.Item.role,
    timestamp: res.Item.timestamp,
    isComplete: res.Item.isComplete,
  };
}

async function createConversation(title, userId) {
  const timestamp = new Date().toISOString();
  const id = uuidv4();
  const reversedTimestamp = `${9999999999999 - Date.now()}`;

  const userConversationItem = {
    PK: `USER#${userId}`,
    SK: `CONV#${id}`,
    GSI2PK: `USER#${userId}`,
    GSI2SK: reversedTimestamp,
    id,
    userId,
    title: title || "New Conversation",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const conversationMetadataItem = {
    PK: `CONV#${id}`,
    SK: "METADATA",
    id,
    userId,
    title: title || "New Conversation",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamodb
    .transactWrite({
      TransactItems: [
        { Put: { TableName: TABLE_NAME, Item: userConversationItem } },
        { Put: { TableName: TABLE_NAME, Item: conversationMetadataItem } },
      ],
    })
    .promise();

  return {
    id,
    userId,
    title: userConversationItem.title,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function getMessages(conversationId, userId) {
  // Verify ownership
  const check = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `CONV#${conversationId}` },
    })
    .promise();
  if (!check.Item) return [];

  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `CONV#${conversationId}`,
      ":sk": "MSG#",
    },
  };
  const result = await dynamodb.query(params).promise();
  return (result.Items || []).map((item) => ({
    id: item.id,
    conversationId: item.conversationId,
    content: item.content,
    role: item.role,
    timestamp: item.timestamp,
    isComplete: item.isComplete,
  }));
}

async function sendMessage(conversationId, content, userId) {
  // Verify ownership
  const check = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `CONV#${conversationId}` },
    })
    .promise();
  if (!check.Item) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  const timestamp = new Date().toISOString();
  const userMessageId = uuidv4();

  const userMessage = {
    PK: `CONV#${conversationId}`,
    SK: `MSG#${userMessageId}`,
    GSI1PK: `MSG#${userMessageId}`,
    GSI1SK: timestamp,
    id: userMessageId,
    conversationId,
    content,
    role: "user",
    timestamp,
    isComplete: true,
  };

  await dynamodb.put({ TableName: TABLE_NAME, Item: userMessage }).promise();

  // Update conversation metadata and recent sort key
  const reversedTimestamp = `${9999999999999 - Date.now()}`;
  await dynamodb
    .update({
      TableName: TABLE_NAME,
      Key: { PK: `CONV#${conversationId}`, SK: "METADATA" },
      UpdateExpression: "SET updatedAt = :u",
      ExpressionAttributeValues: { ":u": timestamp },
    })
    .promise();

  await dynamodb
    .update({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `CONV#${conversationId}` },
      UpdateExpression: "SET updatedAt = :u, GSI2SK = :g",
      ExpressionAttributeValues: { ":u": timestamp, ":g": reversedTimestamp },
    })
    .promise();

  // Create minimal assistant placeholder
  const assistantMessageId = uuidv4();
  const assistant = {
    PK: `CONV#${conversationId}`,
    SK: `MSG#${assistantMessageId}`,
    GSI1PK: `MSG#${assistantMessageId}`,
    GSI1SK: new Date().toISOString(),
    id: assistantMessageId,
    conversationId,
    content: "...",
    role: "assistant",
    timestamp: new Date().toISOString(),
    isComplete: false,
  };
  await dynamodb.put({ TableName: TABLE_NAME, Item: assistant }).promise();

  // Invoke streaming handler asynchronously to generate assistant reply
  try {
    const payload = {
      messageId: assistant.id,
      conversationId,
      content,
    };
    await lambda
      .invoke({
        FunctionName: process.env.STREAMING_HANDLER_FUNCTION,
        InvocationType: "Event",
        Payload: JSON.stringify(payload),
      })
      .promise();
  } catch (e) {
    console.warn("Failed to invoke streaming handler", e);
  }

  return {
    userMessage: {
      id: userMessage.id,
      conversationId: userMessage.conversationId,
      content: userMessage.content,
      role: userMessage.role,
      timestamp: userMessage.timestamp,
      isComplete: userMessage.isComplete,
    },
    assistantMessage: {
      id: assistant.id,
      conversationId: assistant.conversationId,
      content: assistant.content,
      role: assistant.role,
      timestamp: assistant.timestamp,
      isComplete: assistant.isComplete,
    },
  };
}

async function updateMessageContent(
  messageId,
  conversationId,
  content,
  isComplete
) {
  const timestamp = new Date().toISOString();
  await dynamodb
    .update({
      TableName: TABLE_NAME,
      Key: { PK: `CONV#${conversationId}`, SK: `MSG#${messageId}` },
      UpdateExpression: "SET content = :c, isComplete = :ic",
      ExpressionAttributeValues: {
        ":c": content,
        ":ic": !!isComplete,
      },
    })
    .promise();

  return {
    messageId,
    conversationId,
    content,
    isComplete: !!isComplete,
    timestamp,
  };
}

async function listRecentConversations(limit, userId) {
  const maxLimit = limit && limit > 0 && limit <= 50 ? limit : 10;
  const params = {
    TableName: TABLE_NAME,
    IndexName: "GSI2",
    KeyConditionExpression: "GSI2PK = :pk",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
    },
    Limit: maxLimit,
  };
  const result = await dynamodb.query(params).promise();
  return (result.Items || []).map((item) => ({
    id: item.id,
    userId: item.userId,
    title: item.title,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}
