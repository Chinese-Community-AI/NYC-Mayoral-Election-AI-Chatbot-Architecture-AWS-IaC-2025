# Core data/storage
module "dynamodb" {
  source       = "./modules/dynamodb"
  project_name = var.project_name
  environment  = var.environment
}

# Secrets
module "secrets" {
  source       = "./modules/secrets"
  project_name = var.project_name
  environment  = var.environment
}

# IAM
module "iam" {
  source       = "./modules/iam"
  project_name = var.project_name
  environment  = var.environment
}

# API Gateway (auth)
module "api" {
  source       = "./modules/api"
  project_name = var.project_name
  environment  = var.environment
}

# AppSync GraphQL
module "appsync" {
  source       = "./modules/appsync"
  project_name = var.project_name
  environment  = var.environment
}

# Lambda functions
module "lambda" {
  source       = "./modules/lambda"
  project_name = var.project_name
  environment  = var.environment
}

# Frontend hosting (S3/CloudFront)
module "frontend" {
  source       = "./modules/frontend"
  project_name = var.project_name
  environment  = var.environment
}


