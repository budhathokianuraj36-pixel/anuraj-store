import os
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/api/orders", tags=["Orders"])


# =========================================================
# MongoDB
# =========================================================

MONGO_URL = os.getenv(
    "MONGO_URL",
    "mongodb://127.0.0.1:27017"
)

client = AsyncIOMotorClient(MONGO_URL)

db = client["anuraj_store"]

orders_collection = db["orders"]


# =========================================================
# Payment Screenshot Storage
# =========================================================

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "uploads",
    "payments"
)

os.makedirs(UPLOAD_DIR, exist_ok=True)


# =========================================================
# CREATE ORDER
# =========================================================

@router.post("")
async def create_order(
    customer_name: str = Form(...),
    mobile: str = Form(...),

    province: str = Form(""),
    district: str = Form(""),
    city: str = Form(""),
    ward: str = Form(""),
    address: str = Form(...),
    notes: str = Form(""),

    payment_method: str = Form(...),
    transaction_id: str = Form(""),

    items: str = Form(...),

    subtotal: float = Form(...),
    delivery_charge: float = Form(...),
    total: float = Form(...),

    payment_screenshot: UploadFile | None = File(None),
):
    # -----------------------------------------------------
    # Basic Validation
    # -----------------------------------------------------

    if not customer_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Customer name is required"
        )

    if not mobile.strip():
        raise HTTPException(
            status_code=400,
            detail="Mobile number is required"
        )

    if not address.strip():
        raise HTTPException(
            status_code=400,
            detail="Delivery address is required"
        )

    # -----------------------------------------------------
    # Payment Validation
    # -----------------------------------------------------

    payment_method = payment_method.strip().lower()

    if payment_method not in ["cod", "bank"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid payment method"
        )

    if payment_method == "bank":

        if not transaction_id.strip():
            raise HTTPException(
                status_code=400,
                detail="Bank transaction ID is required"
            )

        if not payment_screenshot:
            raise HTTPException(
                status_code=400,
                detail="Payment screenshot is required"
            )

    # -----------------------------------------------------
    # Parse Cart Items
    # -----------------------------------------------------

    try:
        order_items = json.loads(items)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid order items"
        )

    if not isinstance(order_items, list):
        raise HTTPException(
            status_code=400,
            detail="Invalid order items format"
        )

    if not order_items:
        raise HTTPException(
            status_code=400,
            detail="Cart is empty"
        )

    # -----------------------------------------------------
    # Save Payment Screenshot
    # -----------------------------------------------------

    screenshot_url = None

    if payment_screenshot:

        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ]

        if payment_screenshot.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Only JPG, PNG and WEBP images are allowed"
            )

        extension = os.path.splitext(
            payment_screenshot.filename or ""
        )[1].lower()

        if extension not in [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        ]:
            extension = ".jpg"

        filename = f"{uuid.uuid4().hex}{extension}"

        filepath = os.path.join(
            UPLOAD_DIR,
            filename
        )

        content = await payment_screenshot.read()

        # 5 MB maximum
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Payment screenshot must be below 5 MB"
            )

        with open(filepath, "wb") as file:
            file.write(content)

        screenshot_url = f"/uploads/payments/{filename}"

    # -----------------------------------------------------
    # Generate Order Number
    # -----------------------------------------------------

    order_number = (
        f"AS-{datetime.now().strftime('%Y%m%d')}-"
        f"{uuid.uuid4().hex[:6].upper()}"
    )

    # -----------------------------------------------------
    # Create Order
    # -----------------------------------------------------

    order = {

        "order_number": order_number,

        "customer": {
            "name": customer_name.strip(),
            "mobile": mobile.strip(),

            "province": province.strip(),
            "district": district.strip(),
            "city": city.strip(),
            "ward": ward.strip(),

            "address": address.strip(),
            "notes": notes.strip(),
        },

        "items": order_items,

        "payment": {
            "method": payment_method,

            "transaction_id": (
                transaction_id.strip()
                if transaction_id
                else None
            ),

            "screenshot": screenshot_url,

            "status": "pending",
        },

        "subtotal": float(subtotal),

        "delivery_charge": float(delivery_charge),

        "total": float(total),

        # Order status
        "status": "pending",

        "created_at": datetime.utcnow(),

        "updated_at": datetime.utcnow(),
    }

    # -----------------------------------------------------
    # Save Order to MongoDB
    # -----------------------------------------------------

    result = await orders_collection.insert_one(order)

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "success": True,
        "message": "Order placed successfully",

        "order_id": str(result.inserted_id),

        "order_number": order_number,

        "total": float(total),

        "status": "pending",
    }


# =========================================================
# GET ALL ORDERS
# =========================================================

@router.get("")
async def get_orders():
    """
    Temporary admin order list.

    Authentication will be added later.
    """

    orders = []

    cursor = orders_collection.find().sort(
        "created_at",
        -1
    )

    async for order in cursor:

        order["_id"] = str(order["_id"])

        orders.append(order)

    return {
        "success": True,
        "count": len(orders),
        "orders": orders
    }


# =========================================================
# GET SINGLE ORDER
# =========================================================

@router.get("/{order_number}")
async def get_order(
    order_number: str
):

    order = await orders_collection.find_one(
        {
            "order_number": order_number
        }
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    order["_id"] = str(order["_id"])

    return {
        "success": True,
        "order": order
    }


# =========================================================
# UPDATE ORDER STATUS
# =========================================================

@router.patch("/{order_number}/status")
async def update_order_status(
    order_number: str,
    status: str = Form(...)
):

    # Allowed order statuses
    allowed_statuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
    ]

    status = status.strip().lower()

    # -----------------------------------------------------
    # Validate Status
    # -----------------------------------------------------

    if status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Allowed: "
                + ", ".join(allowed_statuses)
            )
        )

    # -----------------------------------------------------
    # Update MongoDB
    # -----------------------------------------------------

    result = await orders_collection.update_one(

        {
            "order_number": order_number
        },

        {
            "$set": {
                "status": status,
                "updated_at": datetime.utcnow(),
            }
        }
    )

    # -----------------------------------------------------
    # Check Order
    # -----------------------------------------------------

    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "success": True,

        "message": (
            "Order status updated successfully"
        ),

        "order_number": order_number,

        "status": status,
    }