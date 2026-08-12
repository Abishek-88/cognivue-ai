# AI-Powered Intelligent Learning & Document Assistant — Backend

## Tech Stack
- **Spring Boot 3.2** + Spring Security + Spring Data JPA
- **MySQL** — users, conversations, messages, documents
- **Gemini API** — AI chat, embeddings, resume analysis
- **ChromaDB** — vector store for RAG
- **Cloudinary** — PDF/resume file storage
- **JWT** — stateless auth + refresh tokens
- **Google OAuth2** — social login
- **Apache PDFBox** + **Tesseract OCR** — PDF processing

---

## Prerequisites

| Tool | Version |
|------|---------|
| Java | 17+ |
| Maven | 3.8+ |
| MySQL | 8.0+ |
| Docker (for ChromaDB) | 24+ |
| Tesseract OCR | 4+ |

---

## Step 1 — Install Tesseract OCR

```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-hin tesseract-ocr-tam  # Hindi + Tamil

# macOS
brew install tesseract
```

---

## Step 2 — Start ChromaDB with Docker

```bash
docker pull chromadb/chroma
docker run -d -p 8000:8000 --name chromadb chromadb/chroma
```

Verify: http://localhost:8000/api/v1/heartbeat

---

## Step 3 — Create MySQL Database

```sql
CREATE DATABASE chatbot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chatbot'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON chatbot_db.* TO 'chatbot'@'localhost';
FLUSH PRIVILEGES;
```

---

## Step 4 — Get API Keys

### Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Create a new key
3. Copy it to `application.properties` → `app.gemini.api-key`

### Google OAuth2 (for Google Login)
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Add `http://localhost:8080/oauth2/callback/google` as redirect URI
4. Copy Client ID + Secret to `application.properties`

### Cloudinary
1. Sign up at https://cloudinary.com (free tier works)
2. Copy Cloud Name, API Key, API Secret from Dashboard

---

## Step 5 — Configure application.properties

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/chatbot_db?...
spring.datasource.username=chatbot
spring.datasource.password=your_password

app.gemini.api-key=YOUR_GEMINI_KEY
app.cloudinary.cloud-name=YOUR_CLOUD
app.cloudinary.api-key=YOUR_CLD_KEY
app.cloudinary.api-secret=YOUR_CLD_SECRET

spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_SECRET
```

---

## Step 6 — Build & Run

```bash
cd chatbot-backend
mvn clean install -DskipTests
mvn spring-boot:run
```

Server starts on: http://localhost:8080

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/change-password` | Change password |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/message` | Send message, get AI reply |
| GET | `/api/chat/conversations` | List all conversations |
| GET | `/api/chat/conversations/{id}` | Get conversation + messages |
| DELETE | `/api/chat/conversations/{id}` | Delete conversation |

### Documents (RAG)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload PDF (async processing) |
| POST | `/api/documents/ask` | Ask question about document |
| GET | `/api/documents` | List uploaded documents |
| DELETE | `/api/documents/{id}` | Delete document |

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/analyze` | Analyze resume, get ATS score |
| POST | `/api/resume/{docId}/interview-questions` | Generate interview questions |
| GET | `/api/resume/history` | Past resume analyses |

### Learning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/learning/roadmap` | Generate learning roadmap |
| POST | `/api/learning/ask/{conversationId}` | Follow-up learning question |
| GET | `/api/learning/quiz?topic=DSA&count=5` | Generate quiz |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get profile |
| PATCH | `/api/users/me` | Update name/language |

---

## Project Structure

```
src/main/java/com/chatbot/
├── AiChatbotApplication.java
├── config/
│   ├── AppConfig.java          # WebClient, Cloudinary, ObjectMapper beans
│   └── SecurityConfig.java     # JWT + OAuth2 security
├── controller/
│   ├── AuthController.java
│   ├── ChatController.java
│   ├── DocumentController.java
│   ├── ResumeAndLearningController.java
│   └── UserController.java
├── dto/
│   ├── request/                # Request DTOs with validation
│   └── response/               # Response DTOs + ApiResponse wrapper
├── entity/                     # JPA entities (User, Conversation, Message, Document, ResumeReport)
├── exception/                  # Custom exceptions + GlobalExceptionHandler
├── repository/                 # Spring Data JPA repositories
├── security/
│   ├── CustomUserDetailsService.java
│   ├── jwt/                    # JwtUtils + JwtAuthenticationFilter
│   └── oauth/                  # Google OAuth2 flow + JWT redirect
└── service/
    ├── GeminiService.java      # Core AI — chat, embeddings, resume, learning
    ├── ChromaDbService.java    # Vector store CRUD
    ├── PdfProcessingService.java # PDFBox + Tesseract OCR
    ├── CloudinaryService.java  # File upload/delete
    └── impl/
        ├── AuthService.java
        ├── ChatService.java    # Messages + conversation memory
        ├── DocumentService.java # Upload + async RAG processing
        ├── ResumeService.java  # ATS scoring + interview questions
        └── LearningService.java # Roadmaps + quizzes
```

---

## Deployment (Render)

1. Push code to GitHub
2. Create new Web Service on Render
3. Build Command: `mvn clean install -DskipTests`
4. Start Command: `java -jar target/ai-chatbot-backend-1.0.0.jar`
5. Add all environment variables in Render dashboard
6. Use Render's managed MySQL or PlanetScale for DB
7. ChromaDB: Deploy as a separate Render service using Docker image `chromadb/chroma`
