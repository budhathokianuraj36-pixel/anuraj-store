from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from datetime import datetime, timedelta, timezone
import secrets
from ..db import users
from ..auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class Register(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    mobile: str = Field(min_length=7)
    password: str = Field(min_length=8)

class Login(BaseModel):
    identifier: str
    password: str

class ForgotRequest(BaseModel):
    identifier: str

class VerifyOTP(BaseModel):
    identifier: str
    otp: str = Field(min_length=6, max_length=6)

class ResetPassword(BaseModel):
    identifier: str
    otp: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8)

@router.post("/register")
async def register(data: Register):
    email=data.email.lower()
    if await users.find_one({"$or":[{"email":email},{"mobile":data.mobile}]}):
        raise HTTPException(409,"Email or mobile number already registered")
    result=await users.insert_one({
        "name":data.name,"email":email,"mobile":data.mobile,
        "password_hash":hash_password(data.password),"role":"customer",
        "active":True,"created_at":datetime.now(timezone.utc)
    })
    return {"access_token":create_token(str(result.inserted_id)),"user":{"id":str(result.inserted_id),"name":data.name,"email":email,"mobile":data.mobile,"role":"customer"}}

@router.post("/login")
async def login(data: Login):
    ident=data.identifier.lower()
    user=await users.find_one({"$or":[{"email":ident},{"mobile":data.identifier}]})
    if not user or not user.get("password_hash") or not verify_password(data.password,user["password_hash"]):
        raise HTTPException(401,"Invalid email/mobile or password")
    return {"access_token":create_token(str(user["_id"]),user.get("role","customer")),"user":{"id":str(user["_id"]),"name":user["name"],"email":user["email"],"mobile":user["mobile"],"role":user.get("role","customer")}}

@router.post("/forgot-password")
async def forgot_password(data: ForgotRequest):
    ident=data.identifier.lower()
    user=await users.find_one({"$or":[{"email":ident},{"mobile":data.identifier}]})
    # For demo/development, return the OTP. In production send it via SMS/email and never return it.
    if not user:
        return {"message":"If the account exists, an OTP has been sent."}
    otp=f"{secrets.randbelow(1000000):06d}"
    await users.update_one({"_id":user["_id"]},{"$set":{"reset_otp":otp,"reset_otp_expires":datetime.now(timezone.utc)+timedelta(minutes=10)}})
    return {"message":"OTP generated for development. Configure email/SMS provider for production.","dev_otp":otp}

@router.post("/verify-otp")
async def verify_otp(data: VerifyOTP):
    ident=data.identifier.lower()
    user=await users.find_one({"$or":[{"email":ident},{"mobile":data.identifier}]})
    if not user or user.get("reset_otp")!=data.otp or user.get("reset_otp_expires",datetime.min.replace(tzinfo=timezone.utc)) < datetime.now(timezone.utc):
        raise HTTPException(400,"Invalid or expired OTP")
    return {"verified":True}

@router.post("/reset-password")
async def reset_password(data: ResetPassword):
    ident=data.identifier.lower()
    user=await users.find_one({"$or":[{"email":ident},{"mobile":data.identifier}]})
    if not user or user.get("reset_otp")!=data.otp or user.get("reset_otp_expires",datetime.min.replace(tzinfo=timezone.utc)) < datetime.now(timezone.utc):
        raise HTTPException(400,"Invalid or expired OTP")
    await users.update_one({"_id":user["_id"]},{"$set":{"password_hash":hash_password(data.new_password)},"$unset":{"reset_otp":"","reset_otp_expires":""}})
    return {"message":"Password reset successfully"}

@router.get("/me")
async def me():
    return {"message":"Use the protected customer profile endpoint in the next auth integration step."}
