from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # AI Provider
    ai_provider: str = "openrouter"

    # OpenAI
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-3.5-turbo"

    # OpenRouter
    openrouter_api_key: Optional[str] = None
    openrouter_model: str = "google/gemini-2.0-flash-001"

    # Azure OpenAI
    azure_openai_api_key: Optional[str] = None
    azure_openai_endpoint: Optional[str] = None
    azure_openai_deployment: Optional[str] = None
    azure_openai_api_version: str = "2024-02-01"

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"

    # App
    database_url: str = "sqlite:///./app.db"
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 10
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
