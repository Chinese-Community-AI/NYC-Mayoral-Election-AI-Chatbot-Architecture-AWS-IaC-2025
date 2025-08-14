resource "aws_api_gateway_rest_api" "auth_api" {
  name        = "${var.project_name}-auth-${var.environment}"
  description = "Auth API"
}

resource "aws_api_gateway_resource" "login" {
  rest_api_id = aws_api_gateway_rest_api.auth_api.id
  parent_id   = aws_api_gateway_rest_api.auth_api.root_resource_id
  path_part   = "login"
}

resource "aws_api_gateway_method" "login_post" {
  rest_api_id   = aws_api_gateway_rest_api.auth_api.id
  resource_id   = aws_api_gateway_resource.login.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "login_lambda" {
  rest_api_id = aws_api_gateway_rest_api.auth_api.id
  resource_id = aws_api_gateway_resource.login.id
  http_method = aws_api_gateway_method.login_post.http_method
  type        = "AWS_PROXY"
  integration_http_method = "POST"
  uri         = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${var.auth_lambda_function_arn}/invocations"
}

resource "aws_lambda_permission" "apigw_invoke_auth" {
  statement_id  = "AllowAPIGatewayInvokeAuth"
  action        = "lambda:InvokeFunction"
  function_name = var.auth_lambda_function_name
  principal     = "apigateway.amazonaws.com"
}

resource "aws_api_gateway_deployment" "auth_deployment" {
  depends_on = [aws_api_gateway_integration.login_lambda]
  rest_api_id = aws_api_gateway_rest_api.auth_api.id
}

resource "aws_api_gateway_stage" "auth_stage" {
  rest_api_id   = aws_api_gateway_rest_api.auth_api.id
  deployment_id = aws_api_gateway_deployment.auth_deployment.id
  stage_name    = var.environment
}

// Remove explicit method/integration responses for proxy integration

output "api_url" {
  value = aws_api_gateway_stage.auth_stage.invoke_url
}

# Region data source for building Lambda APIGW URI
data "aws_region" "current" {}

# CORS: OPTIONS method for /login
resource "aws_api_gateway_method" "login_options" {
  rest_api_id   = aws_api_gateway_rest_api.auth_api.id
  resource_id   = aws_api_gateway_resource.login.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "login_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.auth_api.id
  resource_id = aws_api_gateway_resource.login.id
  http_method = aws_api_gateway_method.login_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\n  \"statusCode\": 200\n}"
  }
}

resource "aws_api_gateway_method_response" "login_options_200" {
  rest_api_id = aws_api_gateway_rest_api.auth_api.id
  resource_id = aws_api_gateway_resource.login.id
  http_method = aws_api_gateway_method.login_options.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true,
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "login_options_integration_200" {
  rest_api_id = aws_api_gateway_rest_api.auth_api.id
  resource_id = aws_api_gateway_resource.login.id
  http_method = aws_api_gateway_method.login_options.http_method
  status_code = aws_api_gateway_method_response.login_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.cors_allowed_origins[0]}'",
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
  }
}


