from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from auth_utils import (
    CurrentUser,
    hash_password,
    make_token,
    new_user_id,
    public_user,
    verify_password,
)
from db import db
from seed import seed_user_data

router = APIRouter(prefix="/api/auth", tags=["auth"])

EMERGENT_SESSION_URL = (
    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
)


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: Optional[str] = Field(default=None, max_length=80)


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class SessionBody(BaseModel):
    session_id: str = Field(min_length=8, max_length=512)


class ProfileBody(BaseModel):
    name: Optional[str] = Field(default=None, max_length=80)
    language: Optional[str] = Field(default=None, pattern="^(de|en)$")
    study_program: Optional[str] = Field(default=None, max_length=120)


async def _create_user(email: str, name: Optional[str], **extra) -> dict:
    doc = {
        "user_id": new_user_id(),
        "email": email,
        "name": name or email.split("@")[0],
        "language": "de",
        "created_at": datetime.now(timezone.utc),
        **extra,
    }
    await db.users.insert_one(doc)
    await seed_user_data(doc["user_id"])
    return doc


@router.post("/register", status_code=201)
async def register(body: RegisterBody):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(409, "Diese E-Mail-Adresse ist bereits registriert.")
    try:
        user = await _create_user(
            email,
            body.name,
            hashed_password=hash_password(body.password),
            provider="password",
        )
    except Exception as exc:  # unique index is authoritative
        if "duplicate" in str(exc).lower():
            raise HTTPException(409, "Diese E-Mail-Adresse ist bereits registriert.")
        raise
    return {"access_token": make_token(user["user_id"]), "user": public_user(user)}


@router.post("/login")
async def login(body: LoginBody):
    user = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    hashed = user.get("hashed_password") if user else None
    if not hashed:
        hashed = hash_password("dummy-password-for-timing")
    valid = verify_password(body.password, hashed)
    if not user or not user.get("hashed_password") or not valid:
        raise HTTPException(401, "E-Mail-Adresse oder Passwort ist falsch.")
    return {"access_token": make_token(user["user_id"]), "user": public_user(user)}


@router.post("/session")
async def google_session(body: SessionBody):
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            EMERGENT_SESSION_URL, headers={"X-Session-ID": body.session_id}
        )
    if response.status_code != 200:
        raise HTTPException(401, "Anmeldung über Google fehlgeschlagen.")
    data = response.json()
    email = (data.get("email") or "").lower()
    session_token = data.get("session_token")
    if not email or not session_token:
        raise HTTPException(401, "Anmeldung über Google fehlgeschlagen.")

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user = await _create_user(
            email,
            data.get("name"),
            picture=data.get("picture"),
            provider="google",
        )
    elif data.get("picture") and not user.get("picture"):
        await db.users.update_one(
            {"user_id": user["user_id"]}, {"$set": {"picture": data["picture"]}}
        )
        user["picture"] = data["picture"]

    now = datetime.now(timezone.utc)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {
            "$set": {
                "session_token": session_token,
                "user_id": user["user_id"],
                "expires_at": now + timedelta(days=7),
                "created_at": now,
            }
        },
        upsert=True,
    )
    return {"session_token": session_token, "user": public_user(user)}


@router.get("/me")
async def me(user: CurrentUser):
    return public_user(user)


@router.patch("/me")
async def update_me(body: ProfileBody, user: CurrentUser):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
        user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return public_user(user)
