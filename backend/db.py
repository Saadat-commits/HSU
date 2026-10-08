import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "hsu_app")]


async def ensure_indexes() -> None:
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.schedule.create_index([("user_id", 1), ("weekday", 1)])
    await db.grades.create_index("user_id")
    await db.ai_messages.create_index([("user_id", 1), ("created_at", 1)])
    await db.mensa.create_index([("date", 1)])
    await db.news.create_index([("published_at", -1)])
    await db.exams.create_index([("user_id", 1), ("date", 1)])
    await db.mensa_favorites.create_index([("user_id", 1), ("name", 1)], unique=True)
    await db.flashcard_decks.create_index([("user_id", 1), ("created_at", -1)])
    await db.flashcards.create_index([("deck_id", 1), ("position", 1)])
