# 🧠 AI Document Analysis Workflow

> Full-stack AI-powered document analysis platform for Microsoft AI Hackathon

## Features

- **📄 Document Upload** — Supports PDF, DOCX, TXT, MD, CSV, JSON
- **🤖 AI Analysis** — Summary, Sentiment, Key Points, Entity Extraction, Full Analysis
- **⚡ Workflows** — Automated multi-step analysis pipelines
- **💬 AI Chat** — Ask questions about your documents
- **🎨 Modern UI** — React + Tailwind with responsive design
- **🐳 Docker Ready** — One-command deployment

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, Python 3.11 |
| Database | SQLite (open-source, zero-config) |
| AI | OpenAI / Azure OpenAI / Ollama (local) |
| Deployment | Docker Compose, Render, Railway |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+
- An AI API key (OpenAI, Azure, or Ollama for free local)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure AI provider
copy .env.example .env
# Edit .env and add your API key

# Run backend
uvicorn app:app --reload --port 8000
```

Backend will be at: http://localhost:8000  
API docs at: http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend will be at: http://localhost:5173

---

## 🐳 Docker Deployment (One Command)

```bash
# Set your API key in .env file first
docker-compose up --build
```

App will be at: http://localhost

---

## ☁️ Deploy Online (Free Options)

### Option A: Railway (Recommended - Easiest)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. "New Project" → "Deploy from GitHub Repo"
4. Add environment variables (OPENAI_API_KEY, AI_PROVIDER)
5. Done! Gets a public URL automatically

### Option B: Render

1. Push to GitHub
2. Create a "Web Service" on [render.com](https://render.com) for backend:
   - Root: `backend/`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app:app --host 0.0.0.0 --port $PORT`
3. Create a "Static Site" for frontend:
   - Root: `frontend/`
   - Build: `npm install && npm run build`
   - Publish: `dist/`

### Option C: Azure Container Apps

```bash
# Login to Azure
az login

# Create resource group
az group create --name ai-hackathon --location eastus

# Deploy with Docker Compose
az containerapp compose create \
  --resource-group ai-hackathon \
  --environment ai-hackathon-env \
  --compose-file-path docker-compose.yml
```

---

## 🔑 AI Provider Configuration

### OpenAI (Paid - Best quality)
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo
```

### Azure OpenAI (If you have Azure credits)
```env
AI_PROVIDER=azure
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-35-turbo
```

### Ollama (Free - Runs locally)
```bash
# Install Ollama: https://ollama.ai
ollama pull llama3
```
```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

---

## 📁 Project Structure

```
ai-workflow-app/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # FastAPI app setup
│   │   ├── config.py            # Settings
│   │   ├── database.py          # SQLite/SQLAlchemy
│   │   ├── models.py            # DB models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── routers/
│   │   │   ├── documents.py     # Upload/manage docs
│   │   │   ├── analysis.py      # AI analysis endpoints
│   │   │   ├── workflows.py     # Workflow pipelines
│   │   │   └── chat.py          # AI chat
│   │   └── services/
│   │       ├── ai_service.py    # AI integration
│   │       └── document_service.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/index.js         # API client
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   └── AnalysisCard.jsx
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── Documents.jsx
│   │       ├── DocumentDetail.jsx
│   │       ├── Workflows.jsx
│   │       └── Chat.jsx
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env
└── README.md
```

---

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload document |
| GET | `/api/documents/` | List documents |
| GET | `/api/documents/{id}` | Get document |
| DELETE | `/api/documents/{id}` | Delete document |
| POST | `/api/analysis/` | Run analysis |
| GET | `/api/analysis/document/{id}` | Get analyses |
| POST | `/api/workflows/` | Run full workflow |
| GET | `/api/workflows/` | List workflows |
| POST | `/api/chat/` | Chat with AI |
| GET | `/api/health` | Health check |

---

## License

MIT — Built for Microsoft AI Hackathon 2026
