import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from db import client, ensure_indexes
from routes.academic import router as academic_router
from routes.ai import router as ai_router
from routes.auth import router as auth_router
from routes.campus import router as campus_router
from routes.flashcards import router as flashcards_router
from seed import seed_campus_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_indexes()
    await seed_campus_data()
    logger.info("HSU API bereit")
    yield
    client.close()


app = FastAPI(title="HSU App API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"ok": True}


app.include_router(auth_router)
app.include_router(academic_router)
app.include_router(campus_router)
app.include_router(flashcards_router)
app.include_router(ai_router)
