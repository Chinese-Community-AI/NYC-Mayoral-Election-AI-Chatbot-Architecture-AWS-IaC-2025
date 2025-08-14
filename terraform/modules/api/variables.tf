variable "project_name" { type = string }
variable "environment"  { type = string }
variable "auth_lambda_invoke_arn" { type = string }
variable "auth_lambda_function_name" { type = string }
variable "cors_allowed_origins" {
  type        = list(string)
  description = "Allowed origins for CORS"
  default     = ["*"]
}


