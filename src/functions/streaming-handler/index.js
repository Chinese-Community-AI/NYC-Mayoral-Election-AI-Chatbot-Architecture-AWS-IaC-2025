"use strict";

const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

exports.handler = async (event) => {
  console.log("Streaming event:", JSON.stringify(event));
  const messageId = event?.messageId;
  const conversationId = event?.conversationId;
  const userPrompt = event?.content || "";

  if (!TABLE_NAME || !messageId || !conversationId) {
    console.error("Missing required inputs", {
      TABLE_NAME,
      messageId,
      conversationId,
    });
    return { ok: false };
  }

  // Minimal simulated generation: write a final assistant response
  const finalText = `You said: ${userPrompt || "(no content)"}`;

  await dynamodb
    .update({
      TableName: TABLE_NAME,
      Key: { PK: `CONV#${conversationId}`, SK: `MSG#${messageId}` },
      UpdateExpression: "SET content = :c, isComplete = :ic",
      ExpressionAttributeValues: {
        ":c": finalText,
        ":ic": true,
      },
    })
    .promise();

  return { ok: true };
};
