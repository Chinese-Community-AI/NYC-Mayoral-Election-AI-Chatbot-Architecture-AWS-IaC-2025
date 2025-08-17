const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");

AWS.config.update({ region: process.env.AWS_REGION || "us-east-1" });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE =
  process.env.USERS_TABLE_NAME || "appsync-genai-chatbot-users";

const users = [
  {
    username: "demo",
    email: "demo@example.com",
    password: "password123",
    roles: ["user"],
  },
  {
    username: "admin",
    email: "admin@example.com",
    password: "admin123",
    roles: ["admin", "user"],
  },
];

async function seedUsers() {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const now = new Date().toISOString();
    const params = {
      TableName: USERS_TABLE,
      Item: {
        username: user.username,
        email: user.email,
        passwordHash,
        roles: user.roles,
        createdAt: now,
        lastLogin: now,
      },
      ConditionExpression: "attribute_not_exists(username)",
    };
    try {
      await dynamodb.put(params).promise();
      console.log(`Created user: ${user.username}`);
    } catch (e) {
      if (e.code === "ConditionalCheckFailedException")
        console.log(`User ${user.username} exists, skipping`);
      else console.error(`Error creating ${user.username}:`, e);
    }
  }
}

if (require.main === module) {
  seedUsers().catch((e) => {
    console.error("Error seeding users:", e);
    process.exit(1);
  });
}

module.exports = { seedUsers };
