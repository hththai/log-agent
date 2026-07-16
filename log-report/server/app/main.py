from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect, disconnect
from app.routers import health, logs, sso


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    await disconnect()



app = FastAPI(title="Log Report API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(health.router)
app.include_router(logs.router)
app.include_router(sso.router)
