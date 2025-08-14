variable "project_name" { type = string }
variable "environment"  { type = string }
variable "auth_lambda_function_arn" { type = string }
variable "lambda_function_arns" { type = map(string) }
variable "lambda_function_names" { type = map(string) }


