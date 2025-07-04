# ⚙️ PDF Chat Worker

This is the background worker service for the PDF Chat application. It listens for new PDF uploads, processes them into text chunks, enriches metadata, generates embeddings using OpenAI, and indexes them into Qdrant for vector search.

---

## 📁 Environment Variables

Create a `.env` file in the root of the project:

```env
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/postgres"
BUCKET_NAME=pdf-chat-harshit
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=pdf_embeddings
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=your-openai-api-key
```

If you're using the provided docker-compose.yml, these ports and values are already configured accordingly.

# ☁️ Google Cloud Setup
Place your Google Cloud service account key file in the root of the project as `cloud-key.json`

How to get cloud-key.json:
1. Go to Google Cloud Console
2. Navigate to IAM & Admin > Service Accounts
3. Create a service account with access to Cloud Storage
4. Generate and download the JSON key
5. Rename it to cloud-key.json and place it in the root directory of this project

# 🐳 Running with Docker Compose
This repo provides a docker-compose.yml file that spins up:

1. PostgreSQL (on port 5432)
2. Redis (on port 6379)
3. Qdrant (on port 6333)

# Start Services
```bash
docker-compose up -d
```

# Set Up the Database Schema
Once services are up, run:

```bash
npx prisma migrate dev
🚀 Running the Worker
bash
Copy
Edit
npm install
npm dev
```

The worker will listen to Redis queues and process PDF ingestion jobs automatically.

🔗 Related Repositories
🧠 Backend: https://github.com/harshit2786/pdf-chat-be

🖼 Frontend: https://github.com/harshit2786/pdf-chat-fe