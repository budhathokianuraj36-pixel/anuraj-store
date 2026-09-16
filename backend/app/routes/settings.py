from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from pymongo import MongoClient

from ..config import settings as app_settings

router = APIRouter(prefix="/api/settings", tags=["Store Settings"])

DEFAULT_SETTINGS = {
    "storeName": "Anuraj Store",
    "panNumber": "",
    "vatNumber": "",
    "registrationNumber": "",
    "address": "",
    "email": "",
    "contactNumber": "",
    "whatsappNumber": "",
    "deliveryCharge": 150,
    "freeDeliveryAbove": 0,
    "deliveryTime": "2–5 business days",
    "insideKathmanduDelivery": "150",
    "outsideKathmanduDelivery": "As applicable",
    "codEnabled": True,
    "bankTransferEnabled": True,
    "esewaEnabled": False,
    "khaltiEnabled": False,
    "bankName": "",
    "accountName": "ANURAJ STORE",
    "accountNumber": "",
    "branch": "",
    "returnPolicy": "",
    "refundPolicy": "",
    "cancellationPolicy": "",
    "privacyPolicy": "",
    "terms": "",
}

class StoreSettings(BaseModel):
    storeName: str = "Anuraj Store"
    panNumber: str = ""
    vatNumber: str = ""
    registrationNumber: str = ""
    address: str = ""
    email: str = ""
    contactNumber: str = ""
    whatsappNumber: str = ""
    deliveryCharge: float = Field(default=150, ge=0)
    freeDeliveryAbove: float = Field(default=0, ge=0)
    deliveryTime: str = "2–5 business days"
    insideKathmanduDelivery: str = "150"
    outsideKathmanduDelivery: str = "As applicable"
    codEnabled: bool = True
    bankTransferEnabled: bool = True
    esewaEnabled: bool = False
    khaltiEnabled: bool = False
    bankName: str = ""
    accountName: str = "ANURAJ STORE"
    accountNumber: str = ""
    branch: str = ""
    returnPolicy: str = ""
    refundPolicy: str = ""
    cancellationPolicy: str = ""
    privacyPolicy: str = ""
    terms: str = ""


def _collection():
    client = MongoClient(app_settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
    db = client[app_settings.DATABASE_NAME]
    return client, db["store_settings"]


def _require_admin(authorization: str | None):
    # Initial local implementation: the seller token must be present.
    # Full JWT role verification should be added alongside the existing auth verifier before production deployment.
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Seller authentication required")


@router.get("")
async def get_settings():
    client, collection = _collection()
    try:
        doc = collection.find_one({"_id": "store"})
        data = {**DEFAULT_SETTINGS, **(doc or {})}
        data.pop("_id", None)
        return {"settings": data}
    finally:
        client.close()


@router.put("")
async def update_settings(payload: StoreSettings, authorization: str | None = Header(default=None)):
    _require_admin(authorization)
    client, collection = _collection()
    try:
        data: dict[str, Any] = payload.model_dump()
        data["updatedAt"] = datetime.now(timezone.utc)
        collection.update_one({"_id": "store"}, {"$set": data}, upsert=True)
        data.pop("updatedAt", None)
        return {"message": "Store settings saved", "settings": data}
    finally:
        client.close()
