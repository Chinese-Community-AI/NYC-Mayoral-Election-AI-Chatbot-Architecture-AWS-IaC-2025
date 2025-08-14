"use strict";

const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const dynamodb = new AWS.DynamoDB.DocumentClient();
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
