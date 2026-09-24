# Cognivue AI

### Intelligent Learning & Document Assistant

Cognivue AI is a full-stack AI-powered learning and document assistant
that combines conversational AI, document processing,
retrieval-augmented generation (RAG), semantic search, authentication,
and personalized learning features in a single web application.

The application uses a React frontend and Spring Boot backend, with
MySQL for application data, ChromaDB for vector-based retrieval, and
external AI services for language-model and embedding capabilities.

------------------------------------------------------------------------

## Features

### AI Chat Assistant

-   Conversational AI interface
-   Persistent chat conversations
-   Authenticated user-specific interactions
-   Backend-managed AI model integration
-   Context-aware responses

### Document Intelligence

-   Upload and manage documents
-   PDF text extraction using Apache PDFBox
-   OCR support using Tesseract for scanned or image-based content
-   Document processing and indexing
-   Semantic retrieval over processed content
-   Cloud-based file storage integration

### Retrieval-Augmented Generation (RAG)

Cognivue AI can retrieve relevant information from indexed documents and
provide that context to the language model before generating a response.

``` text
User Query
    |
    v
Query Processing
    |
    v
Embedding Generation
    |
    v
Vector Similarity Search
    |
    v
Relevant Document Chunks
    |
    v
Context Construction
    |
    v
AI Model
    |
    v
Grounded Response
```

### Learning Assistant

-   Learning-focused conversational interactions
-   AI-assisted question answering
-   Learning content management
-   User-specific learning workflows

### Resume Module

-   Resume-related document management
-   AI-assisted resume interactions
-   Resume processing through the application

### Authentication & Authorization

-   User registration and login
-   JWT-based stateless authentication
-   Access and refresh tokens
-   BCrypt password hashing
-   Protected REST endpoints
-   Spring Security integration
-   Google OAuth2 login
-   Automatic access-token refresh

------------------------------------------------------------------------

## Architecture

``` text
                         +----------------------+
                         |     React Frontend   |
                         |                      |
                         |  Chat                |
                         |  Documents           |
                         |  Learning            |
                         |  Resume              |
                         |  Authentication      |
                         +----------+-----------+
                                    |
                              REST API + JWT
                                    |
                                    v
                         +----------------------+
                         |    Spring Boot API   |
                         |                      |
                         | Controllers          |
                         | Services             |
                         | Security             |
                         | Document Processing  |
                         | RAG Pipeline         |
                         +----+------------+----+
                              |            |
                    +---------+            +---------+
                    v                                v
             +-------------+                  +-------------+
             |    MySQL    |                  |  ChromaDB   |
             |             |                  |             |
             | Users       |                  | Embeddings  |
             | Chats       |                  | Vector      |
             | Documents   |                  | Retrieval   |
             | Learning    |                  +-------------+
             +-------------+
                              |
                              v
                    +-------------------+
                    |   AI Provider(s)  |
                    | LLM + Embeddings  |
                    +-------------------+

                              |
                              v
                    +-------------------+
                    |    Cloudinary     |
                    |    File Storage   |
                    +-------------------+
```

------------------------------------------------------------------------

## RAG Pipeline

1.  **Document Upload** --- The user uploads a supported document.
2.  **File Storage** --- The configured cloud storage integration stores
    the file.
3.  **Text Extraction** --- Apache PDFBox extracts PDF text; Tesseract
    can handle scanned/image-based content.
4.  **Chunking** --- Extracted text is divided into retrieval-friendly
    chunks.
5.  **Embedding Generation** --- Chunks are converted into vector
    representations.
6.  **Vector Storage** --- Embeddings and metadata are stored in
    ChromaDB.
7.  **Query Embedding** --- A document-related user query is converted
    into an embedding.
8.  **Similarity Retrieval** --- Relevant chunks are retrieved from
    ChromaDB.
9.  **Context Construction** --- Retrieved content is assembled with the
    query.
10. **Response Generation** --- The AI model generates the response
    using the retrieved context.

``` text
Document
   |
   v
Text Extraction / OCR
   |
   v
Chunking
   |
   v
Embeddings
   |
   v
ChromaDB
   |
   |                 User Query
   |                     |
   +---------------------+
                         v
                 Similarity Search
                         |
                         v
                  Relevant Chunks
                         |
                         v
                   Context + Query
                         |
                         v
                        LLM
                         |
                         v
                   Final Answer
```

------------------------------------------------------------------------

## Authentication Flow

Cognivue AI uses stateless JWT authentication.

### Registration

``` text
React Client
    |
    | POST /api/auth/register
    v
AuthController
    |
    v
AuthService
    |
    +--> Validate user
    +--> BCrypt password hashing
    +--> Save user
    +--> Generate access token
    +--> Generate refresh token
    |
    v
TokenPair
```

### Login

``` text
React Client
    |
    | POST /api/auth/login
    v
AuthController
    |
    v
AuthenticationManager
    |
    v
AuthService
    |
    +--> Generate access token
    +--> Generate refresh token
    |
    v
TokenPair
```

### Protected Requests

The frontend sends:

``` http
Authorization: Bearer <access-token>
```

The backend JWT filter validates the token, loads the corresponding
user, and establishes the Spring Security authentication context.

### Refresh

When an access token expires, the frontend can request:

``` http
POST /api/auth/refresh
```

The backend validates the refresh token and issues a new token pair.

------------------------------------------------------------------------

## Technology Stack

### Frontend

  Technology   Purpose
  ------------ -------------------------------
  React        Single-page application
  Vite         Development and build tooling
  Axios        REST API communication
  JavaScript   Frontend application logic

### Backend

  Technology        Purpose
  ----------------- ------------------------------------
  Java              Backend programming language
  Spring Boot       REST API and application framework
  Spring Security   Authentication and authorization
  Spring Data JPA   Persistence layer
  Hibernate         ORM
  Maven             Build and dependency management
  JWT               Stateless authentication

### AI & RAG

  Technology            Purpose
  --------------------- ---------------------------------------
  Language Model API    AI response generation
  Embedding Model/API   Semantic representations
  ChromaDB              Vector storage and retrieval
  Apache PDFBox         PDF text extraction
  Tesseract OCR         OCR for scanned/image-based documents

### Data & Storage

  Technology   Purpose
  ------------ -----------------------------
  MySQL        Relational application data
  Cloudinary   Cloud-based file storage
  ChromaDB     Vector database

------------------------------------------------------------------------

## Project Structure

``` text
Cognivue-AI/
|
+-- chatbot-backend/
|   +-- src/
|   |   +-- main/
|   |   |   +-- java/com/chatbot/
|   |   |   |   +-- config/
|   |   |   |   +-- controller/
|   |   |   |   +-- dto/
|   |   |   |   +-- entity/
|   |   |   |   +-- exception/
|   |   |   |   +-- repository/
|   |   |   |   +-- security/
|   |   |   |   +-- service/
|   |   |   +-- resources/
|   |   |       +-- application.properties
|   |   +-- test/
|   +-- pom.xml
|
+-- chatbot-frontend/
|   +-- src/
|   |   +-- api/
|   |   +-- components/
|   |   +-- contexts/
|   |   +-- pages/
|   |   +-- ...
|   +-- package.json
|   +-- vite.config.js
|
+-- src.sql
+-- .gitignore
+-- README.md
```

> The structure above describes the main modules. Individual files may
> change as development continues.

------------------------------------------------------------------------

## API Overview

### Authentication

``` text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/change-password
```

### User

``` text
GET /api/users/me
```

### Feature Modules

``` text
/api/chat/**
/api/documents/**
/api/resume/**
/api/learning/**
```

> Endpoint details may evolve with the application. Refer to the backend
> controllers for the current API contract.

------------------------------------------------------------------------

## Getting Started

### Prerequisites

Install:

-   Java 17 or later
-   Maven 3.9+
-   Node.js 20+
-   npm
-   MySQL 8+
-   ChromaDB
-   Tesseract OCR if OCR functionality is required

You also need credentials for the external services configured by the
application.

### 1. Clone

``` bash
git clone https://github.com/<your-username>/cognivue-ai.git
cd cognivue-ai
```

### 2. Configure MySQL

Create the database:

``` sql
CREATE DATABASE chatbot_db;
```

Configure the database connection for your local environment:

``` text
DB_URL=jdbc:mysql://localhost:3306/chatbot_db
DB_USERNAME=root
DB_PASSWORD=your_password
```

If the repository contains a schema file, import it:

``` bash
mysql -u root -p chatbot_db < src.sql
```

### 3. Configure Environment Variables

Never commit real credentials.

Example:

``` text
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRATION_MS=86400000
JWT_REFRESH_EXPIRATION_MS=604800000

GEMINI_API_KEY=your-ai-api-key

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

FRONTEND_URL=http://localhost:5173
```

Use the AI provider configured by your current application. The exact
environment variables can differ between providers and deployment
environments.

### 4. Start ChromaDB

Start ChromaDB using the method configured for your environment.

The backend must be able to reach the configured ChromaDB endpoint
before document retrieval functionality is used.

### 5. Start the Backend

``` bash
cd chatbot-backend
mvn clean install
mvn spring-boot:run
```

The backend is typically available at:

``` text
http://localhost:8080
```

### 6. Start the Frontend

Open another terminal:

``` bash
cd chatbot-frontend
npm install
npm run dev
```

The Vite development server is typically available at:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

## Local Development Architecture

``` text
Browser
  |
  | http://localhost:5173
  v
React + Vite
  |
  | REST API
  v
Spring Boot
  |
  +------> MySQL
  |
  +------> ChromaDB
  |
  +------> Cloudinary
  |
  +------> AI Provider
```

------------------------------------------------------------------------

## Security

The application uses:

-   JWT-based stateless authentication
-   BCrypt password hashing
-   Spring Security
-   Protected REST endpoints
-   OAuth2 authentication
-   Access and refresh tokens
-   Backend-side AI API integration
-   Environment-based secret configuration
-   Input validation
-   CORS configuration

### Never Commit Secrets

Do not commit:

``` text
.env
.env.*
application-local.properties
application-secret.properties
```

or files containing:

-   JWT secrets
-   Database passwords
-   AI API keys
-   Cloudinary secrets
-   OAuth client secrets
-   Other private credentials

For production, use environment variables or a dedicated
secrets-management system.

------------------------------------------------------------------------

## Development Commands

### Backend

``` bash
mvn clean package
mvn spring-boot:run
mvn test
```

### Frontend

``` bash
npm install
npm run dev
npm run build
npm run preview
```

------------------------------------------------------------------------

## Design Principles

### Grounded AI

Document-related responses should use retrieved application data
whenever the RAG workflow is applicable.

### Separation of Concerns

Controllers, services, repositories, security components, entities, and
DTOs are separated to keep responsibilities organized.

### Secure Authentication

API authentication uses Spring Security and JWT rather than server-side
HTTP sessions.

### Provider-Agnostic AI Integration

AI communication is handled by the backend so the underlying
model/provider can be changed without redesigning the frontend.

### Modular Feature Design

Chat, documents, learning, resume, and authentication are separate
application areas that can evolve independently.

------------------------------------------------------------------------

## Current Project Status

**Status: Active Development**

The project currently includes the core architecture for:

-   AI-powered conversations
-   User registration and login
-   JWT authentication
-   Google OAuth2 authentication
-   Document management
-   PDF processing
-   OCR support
-   RAG-based retrieval
-   Vector search
-   Learning workflows
-   Resume functionality
-   MySQL persistence
-   Cloud-based file storage
-   AI model integration

The project is being developed toward a more production-oriented AI
assistant with stronger testing, security hardening, observability, and
deployment practices.

------------------------------------------------------------------------

## Planned Improvements

-   [ ] Expand unit and integration test coverage
-   [ ] Improve RAG retrieval quality
-   [ ] Add hybrid keyword + vector retrieval
-   [ ] Add document reranking
-   [ ] Add citation-aware document responses
-   [ ] Improve conversation memory
-   [ ] Add streaming AI responses
-   [ ] Add rate limiting
-   [ ] Strengthen production CORS configuration
-   [ ] Implement refresh-token rotation/revocation
-   [ ] Improve background document processing
-   [ ] Add structured application logging
-   [ ] Add observability and monitoring
-   [ ] Add CI/CD automation
-   [ ] Production deployment

------------------------------------------------------------------------

## Screenshots

Add application screenshots under:

``` text
docs/
+-- dashboard.png
+-- chat.png
+-- documents.png
+-- learning.png
+-- resume.png
```

Then reference them, for example:

``` markdown
![Cognivue AI Chat](docs/chat.png)
```

------------------------------------------------------------------------

## Why Cognivue AI?

Cognivue AI goes beyond a conventional chatbot by combining:

``` text
Conversational AI
       +
User Documents
       +
Semantic Retrieval
       +
RAG
       +
Learning Workflows
       +
Application Data
```

The goal is to provide a unified assistant that can converse with users
while also working with information stored within the application.

------------------------------------------------------------------------

## Author

**Abishek S**

Computer Science & Engineering

------------------------------------------------------------------------

## License

No open-source license is claimed unless a license file is explicitly
included in this repository.

If the project is released as open source, add an appropriate license
file before publishing licensing terms.

------------------------------------------------------------------------

## Acknowledgements

Cognivue AI is built using and integrates several open-source frameworks
and tools, including:

-   Spring Boot
-   Spring Security
-   React
-   Vite
-   MySQL
-   ChromaDB
-   Apache PDFBox
-   Tesseract OCR
-   Hibernate
-   Maven
