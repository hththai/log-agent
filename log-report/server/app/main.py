from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
from app.database import connect, disconnect
from app.routers import health, logs, sso


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    await disconnect()



app = FastAPI(title="Log Report API", lifespan=lifespan)

# Backs the /sso/authorize -> /sso/callback redirect flow's CSRF state/OIDC
# nonce storage (Authlib requires request.session to exist) and the app's
# own post-login session cookie (see research.md).
app.add_middleware(SessionMiddleware, secret_key=settings.session_secret_key or "insecure-dev-only-session-key")

# CORSMiddleware last so it wraps outermost and can attach headers to
# responses (including errors) produced by every inner middleware.
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
