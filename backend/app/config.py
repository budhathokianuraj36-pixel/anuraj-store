from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://127.0.0.1:27017"
    DATABASE_NAME: str = "anuraj_store"
    SECRET_KEY: str = "CHANGE_THIS"
    CORS_ORIGINS: str = "http://localhost:5173"

    # Seller/Admin credentials
    ADMIN_EMAIL: str = "budhathokianuraj36@gmail.com"
    ADMIN_MOBILE: str = "9768753675"
    ADMIN_PASSWORD: str = "Anuraj123"
    ADMIN_NAME: str = "Anuraj Store Seller"

    class Config:
        env_file = ".env"

settings = Settings()