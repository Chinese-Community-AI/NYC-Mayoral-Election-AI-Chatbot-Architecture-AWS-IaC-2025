resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/${var.project_name}/${var.environment}/jwt/secret"
  description = "JWT signing secret"
  type        = "SecureString"
  value       = var.jwt_secret
}


