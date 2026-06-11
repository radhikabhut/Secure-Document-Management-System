package docs

import "github.com/swaggo/swag"

const docTemplate = `{
  "schemes": {{ marshal .Schemes }},
  "swagger": "2.0",
  "info": {
    "description": "{{ escape .Description }}",
    "title": "{{ .Title }}",
    "contact": {},
    "version": "{{ .Version }}"
  },
  "host": "{{ .Host }}",
  "basePath": "{{ .BasePath }}",
  "paths": {
    "/auth/register": {"post": {"summary": "Register user", "tags": ["Authentication"], "responses": {"201": {"description": "Created"}}}},
    "/auth/login": {"post": {"summary": "Login user", "tags": ["Authentication"], "responses": {"200": {"description": "OK"}}}},
    "/auth/logout": {"post": {"summary": "Logout user", "tags": ["Authentication"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}},
    "/auth/me": {"get": {"summary": "Current user", "tags": ["Authentication"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}},
    "/users": {"get": {"summary": "List users", "tags": ["Users"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}},
    "/users/{id}": {"get": {"summary": "Get user", "tags": ["Users"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}, "put": {"summary": "Update user", "tags": ["Users"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}, "delete": {"summary": "Delete user", "tags": ["Users"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}},
    "/categories": {"get": {"summary": "List categories", "tags": ["Categories"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}, "post": {"summary": "Create category", "tags": ["Categories"], "security": [{"BearerAuth": []}], "responses": {"201": {"description": "Created"}}}},
    "/categories/{id}": {"get": {"summary": "Get category", "tags": ["Categories"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}, "put": {"summary": "Update category", "tags": ["Categories"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}, "delete": {"summary": "Delete category", "tags": ["Categories"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}},
    "/documents": {"get": {"summary": "List documents", "tags": ["Documents"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}, "post": {"summary": "Upload document", "tags": ["Documents"], "security": [{"BearerAuth": []}], "responses": {"201": {"description": "Created"}}}},
    "/documents/upload": {"post": {"summary": "Upload document", "tags": ["Documents"], "security": [{"BearerAuth": []}], "responses": {"201": {"description": "Created"}}}},
    "/documents/{id}": {"get": {"summary": "Get document", "tags": ["Documents"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}, "put": {"summary": "Update document", "tags": ["Documents"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}, "delete": {"summary": "Delete document", "tags": ["Documents"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}},
    "/documents/{id}/download": {"get": {"summary": "Download document", "tags": ["Documents"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "File"}}}},
    "/permissions/grant": {"post": {"summary": "Grant permission", "tags": ["Permissions"], "security": [{"BearerAuth": []}], "responses": {"201": {"description": "Created"}}}},
    "/permissions/{id}": {"delete": {"summary": "Revoke permission", "tags": ["Permissions"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}},
    "/audit-logs": {"get": {"summary": "List audit logs", "tags": ["Audit Logs"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}},
    "/notifications": {"get": {"summary": "List notifications", "tags": ["Notifications"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}},
    "/dashboard/stats": {"get": {"summary": "Dashboard statistics", "tags": ["Dashboard"], "security": [{"BearerAuth": []}], "responses": {"200": {"description": "OK"}}}}
  },
  "securityDefinitions": {
    "BearerAuth": {
      "type": "apiKey",
      "name": "Authorization",
      "in": "header",
      "description": "Use: Bearer {token}"
    }
  }
}`

var SwaggerInfo = &swag.Spec{
	Version:          "1.0",
	Host:             "localhost:8080",
	BasePath:         "/api/v1",
	Schemes:          []string{"http"},
	Title:            "Secure Document Management System API",
	Description:      "Enterprise document management API with JWT authentication, RBAC, audit logging, document storage, notifications, and dashboard analytics.",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
	LeftDelim:        "{{",
	RightDelim:       "}}",
}

func init() {
	swag.Register(SwaggerInfo.InstanceName(), SwaggerInfo)
}
