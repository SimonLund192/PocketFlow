from pydantic_settings import BaseSettings

class AIConfig(BaseSettings):
    # Mistral AI Configuration
    MISTRAL_API_KEY: str = ""
    AI_MODEL: str = "mistral-large-latest"
    AI_BASE_URL: str = "https://api.mistral.ai/v1"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

ai_config = AIConfig()
