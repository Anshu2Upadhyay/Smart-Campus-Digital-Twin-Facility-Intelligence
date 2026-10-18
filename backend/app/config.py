import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central application configuration loaded from environment variables
    with strict typing, sensible defaults, and automated local asset directory initialization.
    """
    # Core Application Info
    APP_NAME: str = "Smart Campus Digital Twin & Facility Intelligence Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # MongoDB Connection Pool & Database Configuration
    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "smart_campus_digital_twin"

    # JWT Authentication & Authorization
    JWT_SECRET_KEY: str = "campus-digital-twin-ultra-secret-key-2026"
    JWT_SECRET: str = "campus-digital-twin-ultra-secret-key-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 Hours

    # Energy Tariff Settings
    ELECTRICITY_TARIFF_PER_KWH: float = 8.5  # ₹8.5 per commercial unit (kWh)

    # Real-Time Operational SLA Timers & Autopilot Thresholds
    SLA_SUPERVISOR_AUTOPILOT_SECONDS: int = 60  # Auto-dispatch if supervisor inactive for 60s
    SLA_WORKER_ACCEPT_SECONDS: int = 180       # 3 minutes acceptance countdown
    SLA_ESCALATION_SECONDS: int = 600          # 10 minutes resolution SLA deadline
    GHOST_ENERGY_VACANT_MINUTES: int = 10      # Trigger ghost energy after 10m vacant

    # External AI & RAG APIs (Optional)
    GEMINI_API_KEY: Optional[str] = None

    # File Storage Paths
    UPLOAD_DIR: str = "uploads"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def init_upload_directories(self) -> None:
        """Create required asset subdirectories on startup."""
        subdirs = ["proofs", "complaints", "clips", "pdfs"]
        for sub in subdirs:
            target_path = os.path.join(self.UPLOAD_DIR, sub)
            os.makedirs(target_path, exist_ok=True)


# Instantiate singleton and guarantee directory structure
settings = Settings()
settings.init_upload_directories()
