const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");

// Configure AWS
AWS.config.update({ region: "us-east-1" });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = "nyc-election-ai-chatbot-dev-users";

async function seedUsers() {
  console.log("Seeding users...");

  // Hash passwords
  const demoPasswordHash = await bcrypt.hash("demo123", 10);
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  const users = [
    {
      username: "demo",
      password_hash: demoPasswordHash,
      roles: ["user"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      username: "admin",
      password_hash: adminPasswordHash,
      roles: ["admin", "user"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  for (const user of users) {
    try {
      await dynamodb
        .put({
          TableName: TABLE_NAME,
          Item: user,
          ConditionExpression: "attribute_not_exists(username)",
        })
        .promise();
      console.log(`✓ Created user: ${user.username}`);
    } catch (error) {
      if (error.code === "ConditionalCheckFailedException") {
        console.log(`- User already exists: ${user.username}`);
      } else {
        console.error(`✗ Error creating user ${user.username}:`, error.message);
      }
    }
  }

  console.log("User seeding complete!");
}

// Run if called directly
if (require.main === module) {
  seedUsers().catch(console.error);
}

module.exports = { seedUsers };
