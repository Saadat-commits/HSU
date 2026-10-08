from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from auth_utils import CurrentUser
from db import db

router = APIRouter(prefix="/api", tags=["campus"])


class FavoriteBody(BaseModel):
    name: str = Field(min_length=1, max_length=200)


async def _favorite_names(user_id: str) -> set[str]:
    favorites = await db.mensa_favorites.find(
        {"user_id": user_id}, {"_id": 0, "name": 1}
    ).to_list(200)
    return {favorite["name"] for favorite in favorites}


@router.get("/mensa")
async def mensa(user: CurrentUser, day: Optional[str] = None):
    day_iso = day or date.today().isoformat()
    meals = await db.mensa.find({"date": day_iso}, {"_id": 0}).to_list(50)
    favorites = await _favorite_names(user["user_id"])
    for meal in meals:
        meal["is_favorite"] = meal["name"] in favorites
    meals.sort(key=lambda meal: not meal["is_favorite"])
    return {"date": day_iso, "meals": meals}


@router.get("/mensa/favorites")
async def list_favorites(user: CurrentUser):
    """Favoriten plus die Tage dieser und nächster Woche, an denen sie wieder auf dem Plan stehen."""
    favorites = sorted(await _favorite_names(user["user_id"]))
    upcoming = []
    if favorites:
        matches = (
            await db.mensa.find(
                {"name": {"$in": favorites}, "date": {"$gte": date.today().isoformat()}},
                {"_id": 0, "name": 1, "date": 1, "category": 1, "price_student": 1},
            )
            .sort([("date", 1)])
            .to_list(100)
        )
        upcoming = matches
    return {"favorites": favorites, "upcoming": upcoming}


@router.post("/mensa/favorites")
async def toggle_favorite(body: FavoriteBody, user: CurrentUser):
    existing = await db.mensa_favorites.find_one(
        {"user_id": user["user_id"], "name": body.name}
    )
    if existing:
        await db.mensa_favorites.delete_one(
            {"user_id": user["user_id"], "name": body.name}
        )
        return {"name": body.name, "is_favorite": False}
    await db.mensa_favorites.insert_one(
        {
            "user_id": user["user_id"],
            "name": body.name,
            "created_at": datetime.now(timezone.utc),
        }
    )
    return {"name": body.name, "is_favorite": True}


@router.get("/news")
async def news(user: CurrentUser):
    items = (
        await db.news.find({}, {"_id": 0})
        .sort([("published_at", -1)])
        .to_list(50)
    )
    for item in items:
        if item.get("published_at") is not None:
            item["published_at"] = item["published_at"].isoformat()
    return items
