# AppSync GraphQL API
resource "aws_appsync_graphql_api" "chatbot_api" {
  name                = "${var.project_name}-api-${var.environment}"
  authentication_type = "AWS_LAMBDA"
  schema              = file("${path.module}/../../../src/schema/schema.graphql")

  lambda_authorizer_config {
    authorizer_uri                  = var.auth_lambda_function_arn
    identity_validation_expression  = "Bearer .*"
  }

  additional_authentication_provider {
    authentication_type = "AWS_IAM"
  }

  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.appsync_logs_role.arn
    field_log_level          = "ALL"
  }
}

# API Key (dev/testing)
resource "aws_appsync_api_key" "chatbot_api_key" {
  api_id  = aws_appsync_graphql_api.chatbot_api.id
  expires = timeadd(timestamp(), "8760h")
}

# Store API key in SSM Parameter Store
resource "aws_ssm_parameter" "appsync_api_key" {
  name        = "/${var.project_name}/appsync/api-key"
  description = "API Key for AppSync GraphQL API"
  type        = "SecureString"
  value       = aws_appsync_api_key.chatbot_api_key.key
}

# IAM role for AppSync logs
resource "aws_iam_role" "appsync_logs_role" {
  name = "${var.project_name}-appsync-logs-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "appsync.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "appsync_logs_policy" {
  name        = "${var.project_name}-appsync-logs-policy-${var.environment}"
  description = "Policy for AppSync to write logs to CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "appsync_logs_attachment" {
  role       = aws_iam_role.appsync_logs_role.name
  policy_arn = aws_iam_policy.appsync_logs_policy.arn
}


