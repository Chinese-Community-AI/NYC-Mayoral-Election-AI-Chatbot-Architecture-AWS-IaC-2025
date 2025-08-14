output "project_name" {
  value       = var.project_name
  description = "Project name"
}

output "environment" {
  value       = var.environment
  description = "Environment"
}

output "appsync_graphql_endpoint" {
  value       = module.appsync.graphql_endpoint
  description = "AppSync GraphQL endpoint"
}

output "appsync_api_key" {
  value       = module.appsync.api_key
  description = "AppSync API key (dev/testing)"
  sensitive   = true
}

output "frontend_cdn_domain" {
  value       = module.frontend.cdn_domain_name
  description = "Frontend CDN domain"
}

output "frontend_distribution_id" {
  value       = module.frontend.distribution_id
  description = "CloudFront distribution id"
}

output "api_url" {
  value       = module.api.api_url
  description = "Auth API URL"
}


