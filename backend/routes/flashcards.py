import json
import os
import re
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from auth_utils import CurrentUser
from db import db

router = APIRouter(prefix="/api", tags=["flashcards"])

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
MODEL_PROVIDER = "openai"
MODEL_NAME = "gpt-5.5"

GENERATOR_PROMPT = {
    "de": (
        "Du erstellst Lernkarten für Studierende der Helmut-Schmidt-Universität. "
        "Antworte AUSSCHLIESSLICH mit gültigem JSON in genau diesem Format: "
        '{"title": "Kurzer Titel", "cards": [{"question": "...", "answer": "..."}]}. '
        "Die Fragen sind prüfungsnah und präzise, die Antworten kurz (max. 4 Sätze). "
        "Kein Markdown, keine Code-Fences, kein Text außerhalb des JSON."
    ),
    "en": (
        "You create flashcards for university students. Answer ONLY with valid JSON "
        'in exactly this format: {"title": "Short title", "cards": '
        '[{"question": "...", "answer": "..."}]}. Questions are exam-like and precise, '
        "answers short (max 4 sentences). No markdown, no code fences, no extra text."
    ),
}


class GenerateBody(BaseModel):
    topic: str = Field(min_length=2, max_length=200)
    count: int = Field(default=8, ge=3, le=15)


class CardStateBody(BaseModel):
    known: bool


def _parse_payload(raw: str) -> dict:
    text = raw.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1:
        text = text[start : end + 1]
    return json.loads(text)


@router.post("/flashcards/generate", status_code=201)
async def generate_deck(body: GenerateBody, user: CurrentUser):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "KI-Dienst ist nicht konfiguriert.")

    language = user.get("language", "de")
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"hsu-cards-{uuid.uuid4().hex[:10]}",
        system_message=GENERATOR_PROMPT.get(language, GENERATOR_PROMPT["de"]),
    ).with_model(MODEL_PROVIDER, MODEL_NAME)

    prompt = (
        f"Thema/Modul: {body.topic}. Erstelle genau {body.count} Lernkarten."
        if language == "de"
        else f"Topic/course: {body.topic}. Create exactly {body.count} flashcards."
    )

    try:
        raw = await chat.send_message(UserMessage(text=prompt))
        payload = _parse_payload(raw)
    except json.JSONDecodeError:
        raise HTTPException(502, "Die KI-Antwort konnte nicht gelesen werden.")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(502, f"KI-Fehler: {exc}")

    cards = [
        card
        for card in payload.get("cards", [])
        if isinstance(card, dict) and card.get("question") and card.get("answer")
    ]
    if not cards:
        raise HTTPException(502, "Die KI hat keine Lernkarten geliefert.")

    now = datetime.now(timezone.utc)
    deck = {
        "deck_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "title": (payload.get("title") or body.topic)[:120],
        "topic": body.topic,
        "created_at": now,
    }
    await db.flashcard_decks.insert_one(dict(deck))
    await db.flashcards.insert_many(
        [
            {
                "card_id": str(uuid.uuid4()),
                "deck_id": deck["deck_id"],
                "user_id": user["user_id"],
                "question": str(card["question"])[:600],
                "answer": str(card["answer"])[:1200],
                "known": False,
                "position": index,
                "created_at": now,
            }
            for index, card in enumerate(cards)
        ]
    )
    deck.pop("_id", None)
    deck["created_at"] = now.isoformat()
    deck["card_count"] = len(cards)
    deck["known_count"] = 0
    return deck


@router.get("/decks")
async def list_decks(user: CurrentUser):
    decks = (
        await db.flashcard_decks.find({"user_id": user["user_id"]}, {"_id": 0})
        .sort([("created_at", -1)])
        .to_list(100)
    )
    for deck in decks:
        deck["created_at"] = deck["created_at"].isoformat()
        deck["card_count"] = await db.flashcards.count_documents(
            {"deck_id": deck["deck_id"]}
        )
        deck["known_count"] = await db.flashcards.count_documents(
            {"deck_id": deck["deck_id"], "known": True}
        )
    return decks


@router.get("/decks/{deck_id}")
async def get_deck(deck_id: str, user: CurrentUser):
    deck = await db.flashcard_decks.find_one(
        {"deck_id": deck_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not deck:
        raise HTTPException(404, "Kartenstapel nicht gefunden.")
    deck["created_at"] = deck["created_at"].isoformat()
    cards = (
        await db.flashcards.find({"deck_id": deck_id}, {"_id": 0, "created_at": 0})
        .sort([("position", 1)])
        .to_list(200)
    )
    return {"deck": deck, "cards": cards}


@router.patch("/decks/{deck_id}/cards/{card_id}")
async def set_card_state(
    deck_id: str, card_id: str, body: CardStateBody, user: CurrentUser
):
    result = await db.flashcards.update_one(
        {"card_id": card_id, "deck_id": deck_id, "user_id": user["user_id"]},
        {"$set": {"known": body.known}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Lernkarte nicht gefunden.")
    return {"card_id": card_id, "known": body.known}


@router.delete("/decks/{deck_id}")
async def delete_deck(deck_id: str, user: CurrentUser):
    result = await db.flashcard_decks.delete_one(
        {"deck_id": deck_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Kartenstapel nicht gefunden.")
    await db.flashcards.delete_many(
        {"deck_id": deck_id, "user_id": user["user_id"]}
    )
    return {"deleted": True}
