from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import connect, disconnect
from app.routers import health, logs


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    await disconnect()


app = FastAPI(title="Log Report API", lifespan=lifespan)
app.include_router(health.router)
app.include_router(logs.router)
