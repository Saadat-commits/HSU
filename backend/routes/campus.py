from datetime import date
from typing import Optional

from fastapi import APIRouter

from auth_utils import CurrentUser
from db import db

router = APIRouter(prefix="/api", tags=["campus"])


@router.get("/mensa")
async def mensa(user: CurrentUser, day: Optional[str] = None):
    day_iso = day or date.today().isoformat()
    meals = await db.mensa.find({"date": day_iso}, {"_id": 0}).to_list(50)
    return {"date": day_iso, "meals": meals}


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
