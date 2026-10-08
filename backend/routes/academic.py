import uuid
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from auth_utils import CurrentUser
from db import db

router = APIRouter(prefix="/api", tags=["academic"])


class ScheduleBody(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    type: str = Field(default="Vorlesung", max_length=40)
    professor: Optional[str] = Field(default=None, max_length=120)
    location: Optional[str] = Field(default=None, max_length=120)
    weekday: int = Field(ge=0, le=6)
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")


class GradeBody(BaseModel):
    semester: str = Field(min_length=1, max_length=60)
    course: str = Field(min_length=1, max_length=120)
    ects: int = Field(ge=0, le=60)
    grade: float = Field(ge=1.0, le=5.0)


class ExamBody(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    course: Optional[str] = Field(default=None, max_length=120)
    location: Optional[str] = Field(default=None, max_length=120)
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    start_time: str = Field(default="09:00", pattern=r"^\d{2}:\d{2}$")


@router.get("/schedule")
async def list_schedule(user: CurrentUser, weekday: Optional[int] = None):
    query: dict = {"user_id": user["user_id"]}
    if weekday is not None:
        query["weekday"] = weekday
    entries = (
        await db.schedule.find(query, {"_id": 0})
        .sort([("weekday", 1), ("start_time", 1)])
        .to_list(500)
    )
    return entries


@router.post("/schedule", status_code=201)
async def create_schedule(body: ScheduleBody, user: CurrentUser):
    entry = {
        "entry_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "created_at": datetime.now(timezone.utc),
        **body.model_dump(),
    }
    await db.schedule.insert_one(entry)
    entry.pop("_id", None)
    return entry


@router.delete("/schedule/{entry_id}")
async def delete_schedule(entry_id: str, user: CurrentUser):
    result = await db.schedule.delete_one(
        {"entry_id": entry_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Eintrag nicht gefunden.")
    return {"deleted": True}


@router.get("/grades")
async def list_grades(user: CurrentUser):
    grades = (
        await db.grades.find({"user_id": user["user_id"]}, {"_id": 0})
        .sort([("semester", 1), ("course", 1)])
        .to_list(500)
    )
    total_ects = sum(g.get("ects", 0) for g in grades)
    weighted = sum(g.get("grade", 0) * g.get("ects", 0) for g in grades)
    average = round(weighted / total_ects, 2) if total_ects else None
    return {"grades": grades, "total_ects": total_ects, "average": average}


@router.post("/grades", status_code=201)
async def create_grade(body: GradeBody, user: CurrentUser):
    grade = {
        "grade_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "created_at": datetime.now(timezone.utc),
        **body.model_dump(),
    }
    await db.grades.insert_one(grade)
    grade.pop("_id", None)
    return grade


@router.delete("/grades/{grade_id}")
async def delete_grade(grade_id: str, user: CurrentUser):
    result = await db.grades.delete_one(
        {"grade_id": grade_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Note nicht gefunden.")
    return {"deleted": True}


@router.get("/exams")
async def list_exams(user: CurrentUser, upcoming_only: bool = True):
    query: dict = {"user_id": user["user_id"]}
    if upcoming_only:
        query["date"] = {"$gte": date.today().isoformat()}
    exams = (
        await db.exams.find(query, {"_id": 0})
        .sort([("date", 1), ("start_time", 1)])
        .to_list(200)
    )
    return exams


@router.post("/exams", status_code=201)
async def create_exam(body: ExamBody, user: CurrentUser):
    exam = {
        "exam_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "created_at": datetime.now(timezone.utc),
        **body.model_dump(),
    }
    await db.exams.insert_one(exam)
    exam.pop("_id", None)
    return exam


@router.delete("/exams/{exam_id}")
async def delete_exam(exam_id: str, user: CurrentUser):
    result = await db.exams.delete_one(
        {"exam_id": exam_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Prüfung nicht gefunden.")
    return {"deleted": True}
