from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    groq_api_key: str = ""
    allowed_origins: List[str] = ["http://localhost:5173"]
    voice_samples_dir: str = "./voice_samples"
    port: int = 8000
    env: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
