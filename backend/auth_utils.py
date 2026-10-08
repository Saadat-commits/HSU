import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from db import db

password_hash = PasswordHash.recommended()

JWT_SECRET = os.environ.get("JWT_SECRET", "hsu-dev-secret-change-me")
JWT_ISSUER = "hsu-app-api"
JWT_ALGORITHM = "HS256"
ACCESS_DAYS = 7

UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired token",
    headers={"WWW-Authenticate": "Bearer"},
)


def new_user_id() -> str:
    return f"user_{uuid.uuid4().hex[:12]}"


def hash_password(raw: str) -> str:
    return password_hash.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    return password_hash.verify(raw, hashed)


def make_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iss": JWT_ISSUER,
        "iat": now,
        "exp": now + timedelta(days=ACCESS_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def public_user(doc: dict) -> dict:
    return {
        "user_id": doc["user_id"],
        "email": doc["email"],
        "name": doc.get("name") or doc["email"].split("@")[0],
        "picture": doc.get("picture"),
        "language": doc.get("language", "de"),
        "study_program": doc.get("study_program"),
        "provider": doc.get("provider", "password"),
    }


def _bearer(request: Request) -> Optional[str]:
    header = request.headers.get("Authorization") or ""
    if not header.lower().startswith("bearer "):
        return None
    token = header.split(" ", 1)[1].strip()
    return token or None


async def _user_from_jwt(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token, JWT_SECRET, algorithms=[JWT_ALGORITHM], issuer=JWT_ISSUER
        )
    except (InvalidTokenError, TypeError, ValueError):
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return await db.users.find_one({"user_id": user_id}, {"_id": 0})


async def _user_from_session(token: str) -> Optional[dict]:
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, datetime):
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            return None
    return await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})


async def current_user(request: Request) -> dict:
    token = _bearer(request)
    if not token:
        raise UNAUTHORIZED
    user = await _user_from_jwt(token)
    if user is None:
        user = await _user_from_session(token)
    if user is None:
        raise UNAUTHORIZED
    return user


CurrentUser = Annotated[dict, Depends(current_user)]
