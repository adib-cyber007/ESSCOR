from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    helius_api_key: str
    bags_api_key: str
    bags_base_url: str = "https://public-api-v2.bags.fm/api/v1"
    analytics_port: int = 8000

    class Config:
        env_file = "../.env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
