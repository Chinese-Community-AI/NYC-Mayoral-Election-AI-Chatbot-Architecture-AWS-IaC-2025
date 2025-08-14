variable "project_name" { type = string }
variable "environment"  { type = string }
variable "lambda_execution_role_arn" { type = string }
variable "bedrock_model_id" { type = string }
variable "dynamodb_table_name" { type = string }
variable "users_table_name" { type = string }
variable "jwt_secret_arn" { type = string }


