from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    activities,
    auth,
    campaign_mappings,
    leads,
    offers,
    users,
    webhooks,
)

app = FastAPI(
    title="MRK CRM API",
    description="Backend API for MRK Construction CRM",
    version="1.0.0",
)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(leads.router, prefix="/leads", tags=["leads"])
app.include_router(activities.router, tags=["activities"])
app.include_router(offers.router, tags=["offers"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(
    campaign_mappings.router,
    prefix="/campaign-mappings",
    tags=["campaign-mappings"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
