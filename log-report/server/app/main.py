from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import connect, disconnect
from app.routers import health, logs


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    await disconnect()



app = FastAPI(title="Log Report API", lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(health.router)
app.include_router(logs.router)
