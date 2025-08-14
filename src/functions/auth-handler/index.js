"use strict";

const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");

const ssm = new AWS.SSM();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;

async function getJwtSecret() {
  const arn = process.env.JWT_SECRET_ARN;
  if (!arn) throw new Error("JWT_SECRET_ARN is not set");
  const resp = await ssm
    .getParameter({ Name: arn, WithDecryption: true })
    .promise();
  const secret = resp && resp.Parameter && resp.Parameter.Value;
  if (!secret) throw new Error("JWT secret not found");
  return secret;
}

function ok(bodyObj) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    },
    body: JSON.stringify(bodyObj),
  };
}

function badRequest(message) {
  return {
    statusCode: 400,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    },
    body: JSON.stringify({ message }),
  };
}

exports.handler = async (event) => {
  // Branch: API Gateway proxy (login)
  if (event && (event.httpMethod || event.resource || event.path)) {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Access-Control-Allow-Methods": "OPTIONS,POST",
        },
        body: "",
      };
    }
    if (event.httpMethod === "POST") {
      let body;
      try {
        body = event.body ? JSON.parse(event.body) : {};
      } catch (_) {
        return badRequest("Invalid JSON body");
      }
      const username = (body && body.username) || "user";
      const roles = ["user"];
      const expiresIn = 24 * 60 * 60; // 24h
      const secret = await getJwtSecret();
      const token = jwt.sign({ sub: username, roles }, secret, {
        algorithm: "HS256",
        expiresIn,
      });

      // Upsert user record in users table
      if (USERS_TABLE_NAME) {
        const nowIso = new Date().toISOString();
        try {
          await dynamodb
            .update({
              TableName: USERS_TABLE_NAME,
              Key: { username },
              UpdateExpression:
                "SET lastLoginAt = :now, roles = if_not_exists(roles, :roles)",
              ExpressionAttributeValues: {
                ":now": nowIso,
                ":roles": roles,
              },
            })
            .promise();
        } catch (e) {
          console.warn("Failed to upsert user record", e);
        }
      }
      return ok({ token, username, roles, expiresIn });
    }
    return badRequest("Unsupported method");
  }

  // Branch: AppSync Lambda authorizer
  try {
    const authHeader =
      (event && event.authorizationToken) ||
      (event &&
        event.request &&
        event.request.headers &&
        event.request.headers.authorization) ||
      (event && event.headers && event.headers.authorization) ||
      "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : authHeader;

    let userId = "anonymous";
    if (token) {
      try {
        const secret = await getJwtSecret();
        const decoded = jwt.verify(token, secret);
        userId = decoded.sub || decoded.username || "anonymous";
      } catch (_) {
        // invalid token → fall through as unauthorized
        return {
          isAuthorized: false,
          resolverContext: {},
          denyMessage: "Unauthorized",
        };
      }
    } else {
      return {
        isAuthorized: false,
        resolverContext: {},
        denyMessage: "Unauthorized",
      };
    }

    return {
      isAuthorized: true,
      resolverContext: { userId },
      denyMessage: "",
    };
  } catch (e) {
    return { isAuthorized: false, resolverContext: {}, denyMessage: "Error" };
  }
};
