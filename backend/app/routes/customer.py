from fastapi import APIRouter, Depends
from ..auth import current_user

router=APIRouter(prefix="/api/customer",tags=["Customer"])

@router.get("/profile")
async def profile(user=Depends(current_user)):
    return {"id":str(user["_id"]),"name":user["name"],"email":user["email"],"mobile":user["mobile"],"role":user.get("role","customer")}

@router.put("/profile")
async def update_profile(data: dict,user=Depends(current_user)):
    allowed={k:data[k] for k in ("name","mobile") if k in data}
    if allowed:
        from ..db import users
        await users.update_one({"_id":user["_id"]},{"$set":allowed})
    return {"message":"Profile updated"}
