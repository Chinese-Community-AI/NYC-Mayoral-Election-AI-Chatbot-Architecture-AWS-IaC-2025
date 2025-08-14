# NYC-Mayoral-Election-AI-Chatbot-Architecture-AWS-IaC-2025
<img width="1008" height="569" alt="Screenshot 2025-08-13 at 10 49 29 PM" src="https://github.com/user-attachments/assets/f26494fd-4e62-4630-8e9e-03f68c5d9fd0" />
https://speedmatch.nyc/ 

The is a MVP for 2025 Mayoral Election AI Chatbot. This is Approach 1:
- Approach 1: Leveraging AWS (AppSync, Bedrock, API Gateway, Lambda, DynamoDB, IAM, etc.) and IaC (Terraform).
- Approach 2: Locally run LLMs approach (Link placeholder)
- Approach 3: GCP approach (Link Placeholder)
  
Architecture Diagram
<img width="989" height="835" alt="Screenshot 2025-08-14 at 4 10 22 PM" src="https://github.com/user-attachments/assets/90b2db63-8928-4a17-82e9-5f965e24af7e" />


Setup
1. Create an IAM user `terraform-admin`.
   Terraform and AWS CLI need programmatic credentials to create resources. Using a dedicated IAM user is safer and auditable vs. root.
   Ask Jahong for access, or create your own. Keep the access key + secret key
   Permissions: Attrached `adminstratorAccess` for speed in a dev/sandbox. We can repalce it with least privileged ones later.
   Description to identify it.
