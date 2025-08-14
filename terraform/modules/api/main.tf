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
  uri         = var.auth_lambda_invoke_arn
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
  stage_name  = var.environment
}

resource "aws_api_gateway_method_response" "login_200" {
  rest_api_id = aws_api_gateway_rest_api.auth_api.id
  resource_id = aws_api_gateway_resource.login.id
  http_method = aws_api_gateway_method.login_post.http_method
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "login_integration_200" {
  rest_api_id = aws_api_gateway_rest_api.auth_api.id
  resource_id = aws_api_gateway_resource.login.id
  http_method = aws_api_gateway_method.login_post.http_method
  status_code = aws_api_gateway_method_response.login_200.status_code
}

output "api_url" {
  value = aws_api_gateway_deployment.auth_deployment.invoke_url
}


