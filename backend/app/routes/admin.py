from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..auth import create_token
from ..config import settings

router = APIRouter(prefix="/api/admin", tags=["Seller Admin"])

class AdminLogin(BaseModel):
    identifier: str
    password: str

@router.post("/login")
async def admin_login(data: AdminLogin):
    # Credentials stay on the backend, never in React/browser code.
    identifier = data.identifier.strip().lower()
    admin_email = settings.ADMIN_EMAIL.strip().lower()
    admin_mobile = settings.ADMIN_MOBILE.strip()

    if identifier not in {admin_email, admin_mobile} or data.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid seller email/mobile or password")

    token = create_token("seller_admin", "seller")
    return {
        "access_token": token,
        "role": "seller",
        "user": {
            "id": "seller_admin",
            "name": settings.ADMIN_NAME,
            "email": settings.ADMIN_EMAIL,
            "mobile": settings.ADMIN_MOBILE,
            "role": "seller",
        },
    }
