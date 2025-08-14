data "archive_file" "message_handler_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../src/functions/message-handler"
  output_path = "${path.module}/message-handler.zip"
}

data "archive_file" "streaming_handler_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../src/functions/streaming-handler"
  output_path = "${path.module}/streaming-handler.zip"
}

data "archive_file" "auth_handler_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../src/functions/auth-handler"
  output_path = "${path.module}/auth-handler.zip"
}

resource "aws_lambda_function" "message_handler" {
  function_name = "${var.project_name}-message-handler-${var.environment}"
  description   = "Lambda function for handling chat messages"
  role          = var.lambda_execution_role_arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30
  memory_size   = 256

  filename         = data.archive_file.message_handler_zip.output_path
  source_code_hash = data.archive_file.message_handler_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE_NAME        = var.dynamodb_table_name
      STREAMING_HANDLER_FUNCTION = aws_lambda_function.streaming_handler.function_name
      PROJECT_NAME               = var.project_name
    }
  }
}

resource "aws_lambda_function" "streaming_handler" {
  function_name = "${var.project_name}-streaming-handler-${var.environment}"
  description   = "Lambda function for streaming responses from Bedrock"
  role          = var.lambda_execution_role_arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 300
  memory_size   = 256

  filename         = data.archive_file.streaming_handler_zip.output_path
  source_code_hash = data.archive_file.streaming_handler_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = var.dynamodb_table_name
      BEDROCK_MODEL_ID    = var.bedrock_model_id
      PROJECT_NAME        = var.project_name
    }
  }
}

resource "aws_lambda_function" "auth_handler" {
  function_name = "${var.project_name}-auth-handler-${var.environment}"
  description   = "Lambda function for authentication and authorization"
  role          = var.lambda_execution_role_arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30
  memory_size   = 256

  filename         = data.archive_file.auth_handler_zip.output_path
  source_code_hash = data.archive_file.auth_handler_zip.output_base64sha256

  environment {
    variables = {
      USERS_TABLE_NAME = var.users_table_name
      JWT_SECRET_ARN   = var.jwt_secret_arn
      PROJECT_NAME     = var.project_name
    }
  }
}

resource "aws_lambda_permission" "appsync_message_handler_permission" {
  statement_id  = "AllowAppSyncToInvokeMessageHandler"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.message_handler.function_name
  principal     = "appsync.amazonaws.com"
}

resource "aws_lambda_permission" "message_handler_streaming_handler_permission" {
  statement_id  = "AllowMessageHandlerToInvokeStreamingHandler"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.streaming_handler.function_name
  principal     = "lambda.amazonaws.com"
  source_arn    = aws_lambda_function.message_handler.arn
}

resource "aws_lambda_permission" "appsync_streaming_handler_permission" {
  statement_id  = "AllowAppSyncToInvokeStreamingHandler"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.streaming_handler.function_name
  principal     = "appsync.amazonaws.com"
}

resource "aws_lambda_permission" "appsync_auth_handler_permission" {
  statement_id  = "AllowAppSyncToInvokeAuthHandler"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_handler.function_name
  principal     = "appsync.amazonaws.com"
}


