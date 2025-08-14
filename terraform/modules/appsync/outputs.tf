output "api_id" {
  value       = aws_appsync_graphql_api.chatbot_api.id
  description = "AppSync API ID"
}

output "graphql_endpoint" {
  value       = aws_appsync_graphql_api.chatbot_api.uris["GRAPHQL"]
  description = "AppSync GraphQL endpoint URL"
}

output "api_key" {
  value       = aws_appsync_api_key.chatbot_api_key.key
  description = "AppSync API key (dev/testing)"
  sensitive   = true
}


