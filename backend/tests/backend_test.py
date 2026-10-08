"""
Backend API tests for HSU Campus App.

Covers:
- Auth (register, login, me, update profile)
- Schedule CRUD + seed + isolation
- Grades CRUD + ECTS-weighted average
- Campus (mensa, news)
- AI (chat SSE, messages list/clear)
"""

import json
import os
import time
import uuid
from datetime import date, timedelta

import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fall back to the frontend env file which is the public URL
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
                break

assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL not configured"

# Shared existing user credentials (see /app/memory/test_credentials.md)
EXISTING_EMAIL = "kadett@hsu-hh.de"
EXISTING_PASSWORD = "HsuTest1234"


def _unique_email(tag: str = "u") -> str:
    return f"TEST_{tag}_{uuid.uuid4().hex[:8]}@hsu-hh.de"


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def existing_token(api):
    r = api.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": EXISTING_EMAIL, "password": EXISTING_PASSWORD},
    )
    if r.status_code != 200:
        pytest.skip(f"Cannot login existing user: {r.status_code} {r.text}")
    return r.json()["access_token"]


def _auth(token: str):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ----------------- AUTH -----------------
class TestAuth:
    def test_health(self, api):
        r = api.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json() == {"ok": True}

    def test_register_success(self, api):
        email = _unique_email("reg")
        r = api.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "Passwort12345", "name": "Test Kadett"},
        )
        assert r.status_code == 201, r.text
        data = r.json()
        assert "access_token" in data and isinstance(data["access_token"], str)
        assert data["user"]["email"] == email.lower()
        assert data["user"]["name"] == "Test Kadett"
        assert data["user"]["language"] == "de"
        assert data["user"]["provider"] == "password"

    def test_register_duplicate_email(self, api):
        email = _unique_email("dup")
        r1 = api.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "Passwort12345"},
        )
        assert r1.status_code == 201
        r2 = api.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "Passwort12345"},
        )
        assert r2.status_code == 409

    def test_register_short_password(self, api):
        email = _unique_email("short")
        r = api.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "short"},
        )
        assert r.status_code == 422

    def test_login_success(self, api):
        r = api.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": EXISTING_EMAIL, "password": EXISTING_PASSWORD},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"] == EXISTING_EMAIL

    def test_login_wrong_password(self, api):
        r = api.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": EXISTING_EMAIL, "password": "WrongPassword123"},
        )
        assert r.status_code == 401

    def test_login_unknown_email(self, api):
        r = api.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nobody_" + uuid.uuid4().hex[:6] + "@hsu-hh.de",
                  "password": "Passwort12345"},
        )
        assert r.status_code == 401

    def test_me_requires_auth(self, api):
        r = api.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_invalid_token(self, api):
        r = api.get(f"{BASE_URL}/api/auth/me",
                    headers={"Authorization": "Bearer not-a-valid-jwt"})
        assert r.status_code == 401

    def test_me_success(self, api, existing_token):
        r = api.get(f"{BASE_URL}/api/auth/me", headers=_auth(existing_token))
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == EXISTING_EMAIL
        assert "user_id" in data

    def test_update_me_patch(self, api):
        # Create a fresh user so we don't mutate the shared one unpredictably
        email = _unique_email("patch")
        reg = api.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "Passwort12345", "name": "Alt Name"},
        )
        token = reg.json()["access_token"]
        r = api.patch(
            f"{BASE_URL}/api/auth/me",
            json={"name": "Neu Name", "language": "en", "study_program": "ETIT"},
            headers=_auth(token),
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "Neu Name"
        assert data["language"] == "en"
        assert data["study_program"] == "ETIT"

        # Verify persistence via GET /me
        r2 = api.get(f"{BASE_URL}/api/auth/me", headers=_auth(token))
        assert r2.status_code == 200
        assert r2.json()["language"] == "en"

    def test_update_me_invalid_language(self, api, existing_token):
        r = api.patch(
            f"{BASE_URL}/api/auth/me",
            json={"language": "fr"},
            headers=_auth(existing_token),
        )
        assert r.status_code == 422


# ----------------- SCHEDULE -----------------
class TestSchedule:
    def test_schedule_requires_auth(self, api):
        r = api.get(f"{BASE_URL}/api/schedule")
        assert r.status_code == 401

    def test_schedule_seeded_for_new_user(self, api):
        email = _unique_email("sched")
        reg = api.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "Passwort12345"},
        )
        token = reg.json()["access_token"]
        r = api.get(f"{BASE_URL}/api/schedule", headers=_auth(token))
        assert r.status_code == 200
        entries = r.json()
        assert isinstance(entries, list)
        assert len(entries) == 6, f"Expected 6 seed entries, got {len(entries)}"
        # Verify structure
        for e in entries:
            assert "entry_id" in e
            assert "title" in e
            assert 0 <= e["weekday"] <= 6

    def test_schedule_crud(self, api):
        email = _unique_email("sched2")
        reg = api.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "Passwort12345"},
        )
        token = reg.json()["access_token"]

        payload = {
            "title": "TEST Vorlesung",
            "type": "Vorlesung",
            "professor": "Prof. Test",
            "location": "H9",
            "weekday": 2,
            "start_time": "14:00",
            "end_time": "15:30",
        }
        r = api.post(f"{BASE_URL}/api/schedule", json=payload, headers=_auth(token))
        assert r.status_code == 201, r.text
        created = r.json()
        assert created["title"] == "TEST Vorlesung"
        entry_id = created["entry_id"]

        # Verify via list
        r2 = api.get(f"{BASE_URL}/api/schedule", headers=_auth(token))
        ids = [e["entry_id"] for e in r2.json()]
        assert entry_id in ids

        # Delete
        r3 = api.delete(f"{BASE_URL}/api/schedule/{entry_id}", headers=_auth(token))
        assert r3.status_code == 200
        assert r3.json().get("deleted") is True

        # Delete again -> 404
        r4 = api.delete(f"{BASE_URL}/api/schedule/{entry_id}", headers=_auth(token))
        assert r4.status_code == 404

    def test_schedule_isolation_between_users(self, api):
        em1, em2 = _unique_email("iso1"), _unique_email("iso2")
        t1 = api.post(f"{BASE_URL}/api/auth/register",
                      json={"email": em1, "password": "Passwort12345"}).json()["access_token"]
        t2 = api.post(f"{BASE_URL}/api/auth/register",
                      json={"email": em2, "password": "Passwort12345"}).json()["access_token"]
        # user1 creates
        created = api.post(
            f"{BASE_URL}/api/schedule",
            json={"title": "TEST Isolation", "type": "Vorlesung",
                  "weekday": 1, "start_time": "09:00", "end_time": "10:00"},
            headers=_auth(t1),
        ).json()
        # user2 should NOT see user1's entry
        r = api.get(f"{BASE_URL}/api/schedule", headers=_auth(t2))
        ids = [e["entry_id"] for e in r.json()]
        assert created["entry_id"] not in ids
        # user2 cannot delete user1's entry
        r2 = api.delete(f"{BASE_URL}/api/schedule/{created['entry_id']}", headers=_auth(t2))
        assert r2.status_code == 404


# ----------------- GRADES -----------------
class TestGrades:
    def test_grades_seeded_structure(self, api):
        email = _unique_email("gr")
        token = api.post(f"{BASE_URL}/api/auth/register",
                         json={"email": email, "password": "Passwort12345"}).json()["access_token"]
        r = api.get(f"{BASE_URL}/api/grades", headers=_auth(token))
        assert r.status_code == 200
        data = r.json()
        assert "grades" in data and "total_ects" in data and "average" in data
        assert isinstance(data["grades"], list)
        # ECTS-weighted average check
        total_ects = sum(g["ects"] for g in data["grades"])
        weighted = sum(g["ects"] * g["grade"] for g in data["grades"])
        expected = round(weighted / total_ects, 2) if total_ects else None
        assert data["total_ects"] == total_ects
        assert data["average"] == expected

    def test_grades_crud_and_validation(self, api):
        email = _unique_email("gr2")
        token = api.post(f"{BASE_URL}/api/auth/register",
                         json={"email": email, "password": "Passwort12345"}).json()["access_token"]
        # invalid grade
        r_bad = api.post(f"{BASE_URL}/api/grades",
                         json={"semester": "T1", "course": "X", "ects": 5, "grade": 6.0},
                         headers=_auth(token))
        assert r_bad.status_code == 422
        r_bad2 = api.post(f"{BASE_URL}/api/grades",
                          json={"semester": "T1", "course": "X", "ects": 5, "grade": 0.5},
                          headers=_auth(token))
        assert r_bad2.status_code == 422
        # valid
        r = api.post(f"{BASE_URL}/api/grades",
                     json={"semester": "TEST", "course": "TEST Kurs", "ects": 4, "grade": 1.0},
                     headers=_auth(token))
        assert r.status_code == 201
        gid = r.json()["grade_id"]
        # delete
        r2 = api.delete(f"{BASE_URL}/api/grades/{gid}", headers=_auth(token))
        assert r2.status_code == 200
        r3 = api.delete(f"{BASE_URL}/api/grades/{gid}", headers=_auth(token))
        assert r3.status_code == 404


# ----------------- CAMPUS -----------------
class TestCampus:
    def test_mensa_today(self, api, existing_token):
        r = api.get(f"{BASE_URL}/api/mensa", headers=_auth(existing_token))
        assert r.status_code == 200
        data = r.json()
        assert "date" in data and "meals" in data
        # Today could be weekend; verify shape only
        assert isinstance(data["meals"], list)

    def test_mensa_weekday_has_3_meals(self, api, existing_token):
        # Find next monday (weekday 0)
        today = date.today()
        delta = (0 - today.weekday()) % 7
        monday = today + timedelta(days=delta)
        r = api.get(f"{BASE_URL}/api/mensa?day={monday.isoformat()}",
                    headers=_auth(existing_token))
        assert r.status_code == 200
        data = r.json()
        assert data["date"] == monday.isoformat()
        assert len(data["meals"]) == 3, f"Weekday should have 3 meals, got {len(data['meals'])}"
        for m in data["meals"]:
            assert "name" in m and "price_student" in m

    def test_mensa_saturday_empty(self, api, existing_token):
        today = date.today()
        delta = (5 - today.weekday()) % 7
        saturday = today + timedelta(days=delta)
        r = api.get(f"{BASE_URL}/api/mensa?day={saturday.isoformat()}",
                    headers=_auth(existing_token))
        assert r.status_code == 200
        assert r.json()["meals"] == []

    def test_news_sorted_newest_first(self, api, existing_token):
        r = api.get(f"{BASE_URL}/api/news", headers=_auth(existing_token))
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 5
        dates = [i["published_at"] for i in items]
        assert dates == sorted(dates, reverse=True), "News not newest-first"
        for i in items:
            assert "title" in i and "summary" in i and "body" in i

    def test_campus_requires_auth(self, api):
        assert api.get(f"{BASE_URL}/api/mensa").status_code == 401
        assert api.get(f"{BASE_URL}/api/news").status_code == 401


# ----------------- AI -----------------
class TestAI:
    def test_ai_requires_auth(self, api):
        assert api.get(f"{BASE_URL}/api/ai/messages").status_code == 401
        assert api.post(f"{BASE_URL}/api/ai/chat", json={"message": "hi"}).status_code == 401

    def test_ai_chat_sse_and_history(self, api):
        # Fresh user so history is clean
        email = _unique_email("ai")
        token = api.post(f"{BASE_URL}/api/auth/register",
                         json={"email": email, "password": "Passwort12345"}).json()["access_token"]
        # Stream chat
        r = requests.post(
            f"{BASE_URL}/api/ai/chat",
            json={"message": "Antworte nur mit: OK"},
            headers={"Authorization": f"Bearer {token}",
                     "Content-Type": "application/json",
                     "Accept": "text/event-stream"},
            stream=True,
            timeout=60,
        )
        assert r.status_code == 200, r.text
        chunks = []
        done_seen = False
        for raw in r.iter_lines(decode_unicode=True):
            if not raw:
                continue
            assert raw.startswith("data: "), f"Unexpected line {raw[:80]}"
            payload = json.loads(raw[6:])
            if "delta" in payload:
                chunks.append(payload["delta"])
            if payload.get("done"):
                done_seen = True
                break
            if "error" in payload:
                pytest.fail(f"AI stream error: {payload['error']}")
        assert done_seen, "Did not receive done marker"
        full = "".join(chunks).strip()
        assert len(full) > 0, "No content streamed"

        # Give backend a moment to persist
        time.sleep(1)
        # Messages persisted
        r2 = api.get(f"{BASE_URL}/api/ai/messages", headers=_auth(token))
        assert r2.status_code == 200
        msgs = r2.json()
        roles = [m["role"] for m in msgs]
        assert "user" in roles and "assistant" in roles
        # Clear
        r3 = api.delete(f"{BASE_URL}/api/ai/messages", headers=_auth(token))
        assert r3.status_code == 200
        r4 = api.get(f"{BASE_URL}/api/ai/messages", headers=_auth(token))
        assert r4.json() == []
