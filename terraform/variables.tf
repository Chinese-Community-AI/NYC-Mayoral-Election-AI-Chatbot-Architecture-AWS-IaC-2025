variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "nyc-mayoral-chatbot"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "bedrock_model_id" {
  description = "Bedrock model ID for streaming handler"
  type        = string
  default     = "anthropic.claude-3-haiku-20240307-v1:0"
}

variable "jwt_secret" {
  description = "JWT signing secret (set in terraform.tfvars)"
  type        = string
}

variable "cors_allowed_origins" {
  description = "List of allowed CORS origins for the Auth API"
  type        = list(string)
  default     = ["*"]
}


