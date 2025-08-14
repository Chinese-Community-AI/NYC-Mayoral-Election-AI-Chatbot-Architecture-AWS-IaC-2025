#!/usr/bin/env node
/*
Usage: node update-config.js ../terraform/terraform-output.json us-east-1
Reads Terraform outputs JSON and writes src/config.js
*/
const fs = require("fs");
const path = require("path");

function readTerraformOutputs(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(raw);
    // Support both `terraform output -json` and a plain JSON map
    const getVal = (key) => {
      if (!json) return "";
      if (json[key] && typeof json[key] === "object" && "value" in json[key]) {
        return json[key].value;
      }
      return json[key] || "";
    };
    return {
      graphqlEndpoint: getVal("appsync_graphql_endpoint") || "",
      apiKey: getVal("appsync_api_key") || "",
      apiUrl: getVal("api_url") || "",
    };
  } catch (e) {
    console.error("Failed to read Terraform outputs:", e.message);
    return { graphqlEndpoint: "", apiKey: "", apiUrl: "" };
  }
}

function writeConfig(destination, values, region) {
  const content = `const config = {
  appSync: {
    graphqlEndpoint: "${values.graphqlEndpoint}",
    apiKey: "${values.apiKey}",
    region: "${region}"
  },
  apiUrl: "${values.apiUrl}",
  jwt: {
    expiresIn: 86400,
    tokenPrefix: "Bearer "
  }
};

export default config;
`;
  fs.writeFileSync(destination, content, "utf8");
  console.log("Wrote", destination);
}

function main() {
  const terraformOutputPath =
    process.argv[2] ||
    path.join(__dirname, "..", "terraform", "terraform-output.json");
  const region = process.argv[3] || "us-east-1";
  const outputs = readTerraformOutputs(terraformOutputPath);
  const dest = path.join(__dirname, "src", "config.js");
  writeConfig(dest, outputs, region);
}

main();
