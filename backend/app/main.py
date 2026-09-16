from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routes.auth import router as auth_router
from .routes.customer import router as customer_router
from .routes.orders import router as orders_router
from .routes.admin import router as admin_router
from .routes.settings import router as settings_router

app = FastAPI(title="Anuraj Store API")

app.include_router(admin_router)
app.include_router(settings_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(customer_router)
app.include_router(orders_router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Anuraj Store API"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}


app.mount(
    "/uploads",
    StaticFiles(directory="app/uploads"),
    name="uploads",
)
