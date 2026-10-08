import json
import os
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import (
    LlmChat,
    StreamDone,
    TextDelta,
    UserMessage,
)
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from auth_utils import CurrentUser
from db import db

router = APIRouter(prefix="/api/ai", tags=["ai"])

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
MODEL_PROVIDER = "openai"
MODEL_NAME = "gpt-5.5"
HISTORY_LIMIT = 20

SYSTEM_PROMPTS = {
    "de": (
        "Du bist der KI-Studienassistent der Helmut-Schmidt-Universität / "
        "Universität der Bundeswehr Hamburg. Du hilfst Studierenden bei "
        "Lerninhalten, Zusammenfassungen, Prüfungsvorbereitung, Lernplänen "
        "und allgemeinen Fragen zum Campusleben. Antworte auf Deutsch, "
        "sachlich, strukturiert und prägnant. Nutze kurze Absätze und "
        "Aufzählungen, wenn es hilft. Wenn du etwas nicht sicher weißt "
        "(z. B. konkrete Fristen oder Raumnummern), sage es und verweise auf "
        "das Studierendensekretariat."
    ),
    "en": (
        "You are the AI study assistant of Helmut Schmidt University / "
        "University of the Federal Armed Forces Hamburg. You help students "
        "with study content, summaries, exam preparation, study plans and "
        "general campus questions. Answer in English, factual, structured and "
        "concise. If you are unsure about specifics such as deadlines or room "
        "numbers, say so and point to the student office."
    ),
}


class ChatBody(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


async def _store(user_id: str, role: str, content: str) -> dict:
    doc = {
        "message_id": str(uuid.uuid4()),
        "user_id": user_id,
        "role": role,
        "content": content,
        "created_at": datetime.now(timezone.utc),
    }
    await db.ai_messages.insert_one(doc)
    return doc


@router.get("/messages")
async def list_messages(user: CurrentUser):
    messages = (
        await db.ai_messages.find({"user_id": user["user_id"]}, {"_id": 0})
        .sort([("created_at", 1)])
        .to_list(200)
    )
    for message in messages:
        message["created_at"] = message["created_at"].isoformat()
    return messages


@router.delete("/messages")
async def clear_messages(user: CurrentUser):
    await db.ai_messages.delete_many({"user_id": user["user_id"]})
    return {"deleted": True}


@router.post("/chat")
async def chat(body: ChatBody, user: CurrentUser):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "KI-Dienst ist nicht konfiguriert.")

    user_id = user["user_id"]
    language = user.get("language", "de")
    history_docs = (
        await db.ai_messages.find({"user_id": user_id}, {"_id": 0})
        .sort([("created_at", -1)])
        .to_list(HISTORY_LIMIT)
    )
    history = [
        {"role": doc["role"], "content": doc["content"]}
        for doc in reversed(history_docs)
    ]

    await _store(user_id, "user", body.message)

    chat_client = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"hsu-{user_id}",
        system_message=SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS["de"]),
        initial_messages=history,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)

    async def event_generator():
        full = ""
        try:
            async for event in chat_client.stream_message(
                UserMessage(text=body.message)
            ):
                if isinstance(event, TextDelta):
                    full += event.content
                    yield f"data: {json.dumps({'delta': event.content})}\n\n"
                elif isinstance(event, StreamDone):
                    break
        except Exception as exc:  # noqa: BLE001
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        if full:
            await _store(user_id, "assistant", full)
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
