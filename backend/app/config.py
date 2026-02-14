from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    elevenlabs_api_key: str = ""
    anthropic_api_key: str = ""
    deepgram_api_key: str = ""
    allowed_origins: List[str] = ["http://localhost:5173"]
    port: int = 8000
    env: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
