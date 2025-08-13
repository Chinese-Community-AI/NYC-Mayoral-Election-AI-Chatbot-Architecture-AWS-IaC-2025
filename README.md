# NYC-Mayoral-Election-AI-Chatbot-Architecture-AWS-IaC-2025
The is a MVP for 2025 Mayoral Election AI Chatbot. This is Approach 1:
- Approach 1: Leveraging AWS (AppSync, Bedrock, API Gateway, Lambda, DynamoDB, IAM, etc.) and IaC (Terraform).
- Approach 2: Locally run LLMs approach (Link placeholder)
- Approach 3: GCP approach (Link Placeholder)

Setup
1. Create an IAM user `terraform-admin`.
   Terraform and AWS CLI need programmatic credentials to create resources. Using a dedicated IAM user is safer and auditable vs. root.
   Ask Jahong for access, or create your own. Keep the access key + secret key
   Permissions: Attrached `adminstratorAccess` for speed in a dev/sandbox. We can repalce it with least privileged ones later.
   Description to identify it.
