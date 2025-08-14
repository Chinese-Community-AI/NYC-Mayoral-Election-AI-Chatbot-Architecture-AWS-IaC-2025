"use strict";

const AWS = require("aws-sdk");
const https = require("https");
const dynamodb = new AWS.DynamoDB.DocumentClient();
const appSync = new AWS.AppSync();
const ssm = new AWS.SSM();

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const PROJECT_NAME = process.env.PROJECT_NAME || "chatbot";

async function getGraphqlInfo() {
  let endpoint = "";
  let apiKey = "";
  try {
    const apis = await appSync.listGraphqlApis().promise();
    const api = apis.graphqlApis.find((a) => a.name.includes(PROJECT_NAME));
    if (api) {
      endpoint = api.uris.GRAPHQL;
    }
  } catch (e) {
    console.warn("Failed to list AppSync APIs", e);
  }
  try {
    const paramName = `/${PROJECT_NAME}/appsync/api-key`;
    const param = await ssm
      .getParameter({ Name: paramName, WithDecryption: true })
      .promise();
    apiKey = param?.Parameter?.Value || "";
  } catch (e) {
    console.warn("Failed to get AppSync API key from SSM", e);
  }
  return { endpoint, apiKey };
}

function postGraphql(endpoint, apiKey, query, variables) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const payload = JSON.stringify({ query, variables });
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "Content-Length": Buffer.byteLength(payload),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (d) => (data += d));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve({});
        }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

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

  const finalText = `You said: ${userPrompt || "(no content)"}`;

  // Try to publish via AppSync to trigger subscriptions; fallback to direct DynamoDB update
  try {
    const { endpoint, apiKey } = await getGraphqlInfo();
    if (endpoint && apiKey) {
      const mutation = `mutation Update($messageId: ID!, $conversationId: ID!, $content: String!, $isComplete: Boolean!) {
        updateMessageContent(messageId: $messageId, conversationId: $conversationId, content: $content, isComplete: $isComplete) {
          messageId
          conversationId
          content
          isComplete
          timestamp
        }
      }`;
      await postGraphql(endpoint, apiKey, mutation, {
        messageId,
        conversationId,
        content: finalText,
        isComplete: true,
      });
      return { ok: true, via: "appsync" };
    }
  } catch (e) {
    console.warn("AppSync update failed, falling back to DynamoDB", e);
  }

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

  return { ok: true, via: "dynamodb" };
};
