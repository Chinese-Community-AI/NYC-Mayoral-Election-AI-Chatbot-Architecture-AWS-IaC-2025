# NYC-Mayoral-Election-AI-Chatbot-Architecture-AWS-IaC-2025

<img width="1008" height="569" alt="Screenshot 2025-08-13 at 10 49 29 PM" src="https://github.com/user-attachments/assets/f26494fd-4e62-4630-8e9e-03f68c5d9fd0" />
https://speedmatch.nyc/

The is a MVP for 2025 Mayoral Election AI Chatbot. This is Approach 1:

- Approach 1: Leveraging AWS (AppSync, Bedrock, API Gateway, Lambda, DynamoDB, IAM, etc.) and IaC (Terraform).
- Approach 2: Locally run LLMs approach (Link placeholder)
- Approach 3: GCP approach (Link Placeholder)

Architecture Diagram
<img width="989" height="835" alt="Screenshot 2025-08-14 at 4 10 22 PM" src="https://github.com/user-attachments/assets/90b2db63-8928-4a17-82e9-5f965e24af7e" />
## Cost Management
Expected less than a dollar for deploying the Internal tesing with login:
<img width="963" height="315" alt="Screenshot 2025-08-19 at 6 15 56 AM" src="https://github.com/user-attachments/assets/83e8c8f6-5dff-4d74-b67f-f65e8cea3b76" />


## Prerequisites

### AWS Account Setup

1. Create an AWS account if you don't have one
2. Install AWS CLI: `aws --version` to verify
3. Configure AWS credentials: `aws configure`
4. Ensure you have permissions for IAM, Lambda, DynamoDB, AppSync, S3, CloudFront, API Gateway, and Secrets Manager

### Local Environment

1. Install Node.js 18+ and npm
2. Install Terraform 1.5+: `terraform --version` to verify
3. Clone this repository and navigate to the project directory

## Deployment Steps

### Step 1: Configure Variables

Edit `terraform/terraform.tfvars`:

```
project_name = "your-project-name"
jwt_secret = "your-secure-random-string-64-chars-minimum"
cors_allowed_origins = ["http://localhost:3000", "https://your-domain.com"]
```

Generate a secure JWT secret:

```bash
openssl rand -base64 64
```

### Step 2: Deploy Infrastructure

Run the deployment script:

```bash
./scripts/deployment/apply-changes.sh
```

This script will:

- Install Lambda function dependencies
- Initialize and apply Terraform configuration
- Generate frontend configuration from Terraform outputs
- Create all AWS resources (DynamoDB, Lambda, AppSync, S3, CloudFront, etc.)

The process takes 5-10 minutes. Terraform will show you what resources will be created before proceeding.

### Step 3: Seed Initial Users

Set your AWS region and run the user seeding script:

```bash
export AWS_REGION=us-east-1
export USERS_TABLE_NAME=$(cd terraform && terraform output -raw dynamodb_users_table_name)
node scripts/seed-users.js
```

This creates two test users:

- Username: `demo`, Password: `password123`
- Username: `admin`, Password: `admin123`

### Step 4: Deploy Frontend

Build and deploy the React application:

```bash
./scripts/deployment/deploy-frontend.sh
```

This will:

- Install frontend dependencies
- Build the React application
- Upload files to S3
- Invalidate CloudFront cache

### Step 5: Verify Deployment

#### Test API Endpoints

```bash
./scripts/testing/test-api.sh
```

#### Test Authentication

Get your API URL from Terraform outputs and test login:

```bash
API_URL=$(cd terraform && terraform output -raw api_url)
curl -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"password123"}'
```

#### Access the Application

Get your CloudFront URL:

```bash
cd terraform && terraform output frontend_cdn_domain
```

Open the URL in your browser and log in with the demo credentials.

## Development Workflow

### Local Frontend Development

```bash
cd frontend
npm install
npm start
```

The frontend will run on http://localhost:3000 and connect to your deployed AWS infrastructure.

### Update Infrastructure

After making changes to Terraform files:

```bash
./scripts/deployment/apply-changes.sh
```

### Update Frontend

After making changes to React components:

```bash
./scripts/deployment/deploy-frontend.sh
```

## Troubleshooting

### Common Issues

**Terraform fails with permissions error:**

- Verify AWS credentials: `aws sts get-caller-identity`
- Check IAM permissions for all required services

**Frontend can't connect to API:**

- Verify `frontend/src/config.js` was generated correctly
- Check CloudFront and S3 deployment completed successfully

**Authentication fails:**

- Ensure users were seeded: `node scripts/seed-users.js`
- Verify JWT secret in Secrets Manager matches tfvars

**Real-time features not working:**

- Check AppSync API key and endpoint in frontend config
- Verify WebSocket connections in browser developer tools

### Cleanup

To remove all AWS resources:

```bash
cd terraform
terraform destroy
```

Note: This will permanently delete all data. Make sure to backup any important conversations or user data first.
