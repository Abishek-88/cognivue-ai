# AI Chatbot Project — OpenCode Instructions

## Project Overview

This repository contains an AI-powered intelligent learning and document assistant.

The project is organized as a separate Spring Boot backend and frontend.

Project root:
- `chatbot-backend/` — Spring Boot backend
- `chatbot-frontend/` — frontend application
- `src.sql` — database/schema SQL
- `opencode.json` — OpenCode model configuration

## Current AI Model for Development

OpenCode is currently configured to use NVIDIA NIM:
- Provider: NVIDIA
- Model: `nvidia/openai/gpt-oss-20b`
- Base URL: `https://integrate.api.nvidia.com/v1`

API credentials must come from the environment/OpenCode authentication. NEVER hard-code the NVIDIA API key into source files or configuration committed to Git.

The working `opencode.json` should remain:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "nvidia/openai/gpt-oss-20b"
}
```

Do not replace the working NVIDIA configuration with another provider unless explicitly requested.

## Backend

The backend is a Spring Boot application using Java 17.

Known backend structure:
- `config/` — Spring configuration
- `controller/` — REST controllers
- `dto/request/` — request DTOs
- `dto/response/` — response DTOs
- `entity/` — JPA entities
- `repository/` — Spring Data repositories
- `service/` and `service/impl/` — business logic
- `security/` — authentication/security
- `security/jwt/` — JWT implementation
- `security/oauth/` — Google OAuth2 implementation
- `exception/` — application exceptions

Known authentication components include `SecurityConfig`, `AuthController`, `AuthService`, `CustomUserDetailsService`, `JwtUtils`, `JwtAuthenticationFilter`, and Google OAuth2 service/handler classes.

### Authentication Rules

JWT authentication is already implemented in the backend.

The authentication flow includes local registration, local login, access JWT, refresh JWT, password change, and Google OAuth2 integration.

Do NOT remove, bypass, or redesign authentication just to make another feature work.

Protected endpoints should remain protected. Public authentication endpoints include the `/api/auth/**` routes already configured by the application.

When modifying authentication, inspect the existing implementation first and make the smallest safe change.

## Database

The backend uses MySQL. Do not change database configuration, schema, entity relationships, or existing data behavior unless the task requires it.

Prefer the existing JPA/repository patterns. Do not introduce a second database technology unless explicitly requested.

## AI Integration

The application uses an external LLM for chatbot/learning-assistant functionality.

When adding AI functionality:
1. Keep API keys out of source code.
2. Use application configuration/environment variables for secrets.
3. Reuse existing service/configuration patterns where possible.
4. Keep provider-specific code isolated so the model/provider can be changed later.
5. Do not unnecessarily rewrite unrelated backend code.

## Vector Database

The project is intended to use ChromaDB for document embeddings/vector search.

Existing configuration references:
- ChromaDB URL: `http://localhost:8000`
- Collection: `chatbot_embeddings`

Do not replace ChromaDB with another vector database unless explicitly requested.

## File Storage

The project is intended to use Cloudinary for file storage. Cloudinary credentials must never be hard-coded.

## File Uploads

The backend is configured for multipart uploads with a maximum request/file size of 20 MB. Do not silently increase upload limits.

## Frontend

The frontend is in `chatbot-frontend/`.

Development URLs:
- Backend: `http://localhost:8080`
- Frontend: `http://localhost:5173`

When changing frontend behavior:
- Preserve existing routes and navigation unless the task requires a change.
- Reuse existing components/styles where possible.
- Do not break authentication state or API communication.
- Do not redesign the entire UI for a small feature request.

## Development Rules

Before modifying code:
1. Inspect the relevant existing files.
2. Understand the current flow.
3. Make the smallest change that solves the requested problem.
4. Preserve existing working functionality.
5. Avoid unrelated refactoring.
6. Do not invent files, APIs, database tables, or configuration values without checking the repository first.

After modifying backend code, run the appropriate Maven compile/test command when practical and check for compilation errors.

After modifying frontend code, run the appropriate npm build/type-check/lint command available in the project and check for build errors.

## Secrets and Configuration

NEVER commit:
- NVIDIA API keys
- Gemini API keys
- Google OAuth client secrets
- Cloudinary API secrets
- Production JWT secrets
- Production MySQL passwords

Use environment variables or local configuration. If an existing secret is found in source control, do not print it in responses; recommend moving it to environment configuration.

## Git Safety

Do not delete the `.git` directory, rewrite Git history, force-push, remove large portions of the project without explicit approval, or commit secrets.

Before making a large change, explain what will be changed.

## Coding Style

Prefer clear, readable code; existing project conventions; small focused methods; existing DTO/entity/service patterns; constructor injection; existing Lombok usage where already established; proper exception handling; and meaningful names.

Avoid unnecessary dependencies, duplicate implementations, hard-coded credentials, large rewrites for small fixes, dead code, and debug prints left in production code.

## Important Working Principle

This is an existing project, not a blank project.

Always inspect the repository before creating a new implementation.

If functionality already exists, extend or fix it instead of creating a parallel implementation.

If a requirement is ambiguous, explain the assumption before making a large architectural change.
