"""Beispieldaten (Seed) für Mensa, Campus-News, Stundenplan und Noten."""

import uuid
from datetime import date, datetime, timedelta, timezone

from db import db

MENSA_TEMPLATE = [
    [
        {
            "category": "Hauptgericht",
            "name": "Hamburger Pannfisch mit Senfsauce und Bratkartoffeln",
            "price_student": 3.60,
            "price_staff": 5.80,
            "tags": ["Fisch"],
        },
        {
            "category": "Vegan",
            "name": "Linsen-Dal mit Basmatireis und Mango-Chutney",
            "price_student": 2.90,
            "price_staff": 4.70,
            "tags": ["Vegan"],
        },
        {
            "category": "Grill",
            "name": "Currywurst mit Pommes frites",
            "price_student": 3.20,
            "price_staff": 5.10,
            "tags": ["Schwein"],
        },
    ],
    [
        {
            "category": "Hauptgericht",
            "name": "Hähnchenbrust in Kräutersauce mit Spätzle",
            "price_student": 3.80,
            "price_staff": 6.00,
            "tags": ["Geflügel"],
        },
        {
            "category": "Vegetarisch",
            "name": "Gemüselasagne mit Rucola-Salat",
            "price_student": 3.10,
            "price_staff": 4.90,
            "tags": ["Vegetarisch"],
        },
        {
            "category": "Suppe",
            "name": "Kürbiscremesuppe mit Kürbiskernöl",
            "price_student": 1.60,
            "price_staff": 2.40,
            "tags": ["Vegan"],
        },
    ],
    [
        {
            "category": "Hauptgericht",
            "name": "Rinderrouladen mit Rotkohl und Klößen",
            "price_student": 4.20,
            "price_staff": 6.50,
            "tags": ["Rind"],
        },
        {
            "category": "Vegan",
            "name": "Falafel-Bowl mit Hummus und Couscous",
            "price_student": 3.00,
            "price_staff": 4.80,
            "tags": ["Vegan"],
        },
        {
            "category": "Pasta",
            "name": "Penne Arrabbiata mit Parmesan",
            "price_student": 2.80,
            "price_staff": 4.50,
            "tags": ["Vegetarisch"],
        },
    ],
    [
        {
            "category": "Hauptgericht",
            "name": "Seelachsfilet im Sesammantel mit Kartoffelpüree",
            "price_student": 3.70,
            "price_staff": 5.90,
            "tags": ["Fisch"],
        },
        {
            "category": "Vegetarisch",
            "name": "Käsespätzle mit Röstzwiebeln",
            "price_student": 3.10,
            "price_staff": 4.90,
            "tags": ["Vegetarisch"],
        },
        {
            "category": "Grill",
            "name": "Rindergeschnetzeltes mit Reis",
            "price_student": 4.00,
            "price_staff": 6.20,
            "tags": ["Rind"],
        },
    ],
    [
        {
            "category": "Hauptgericht",
            "name": "Schweineschnitzel Wiener Art mit Kartoffelsalat",
            "price_student": 3.90,
            "price_staff": 6.10,
            "tags": ["Schwein"],
        },
        {
            "category": "Vegan",
            "name": "Gebackener Blumenkohl mit Tahini und Quinoa",
            "price_student": 3.00,
            "price_staff": 4.80,
            "tags": ["Vegan"],
        },
        {
            "category": "Dessert",
            "name": "Rote Grütze mit Vanillesauce",
            "price_student": 1.20,
            "price_staff": 1.90,
            "tags": ["Vegetarisch"],
        },
    ],
]

NEWS_ITEMS = [
    {
        "title": "Semesterstart an der HSU: Alle Infos zum Trimester",
        "summary": "Das neue Trimester beginnt. Hier findest du alle wichtigen Termine, Fristen und Hinweise zur Anmeldung.",
        "body": "Die Helmut-Schmidt-Universität startet in das neue Trimester. Die Vorlesungen beginnen planmäßig, die Anmeldung zu den Prüfungen ist ab sofort über das Campus-Portal möglich.\n\nBitte beachtet die Fristen für die Rückmeldung sowie die Hinweise der jeweiligen Fakultäten. Das Studierendensekretariat ist montags bis freitags von 9 bis 15 Uhr erreichbar.",
        "category": "Studium",
        "image_url": "https://images.unsplash.com/photo-1562774053-701939374585?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    },
    {
        "title": "Universitätsbibliothek mit erweiterten Öffnungszeiten",
        "summary": "In der Prüfungsphase öffnet die Bibliothek bis 22 Uhr – inklusive zusätzlicher Lernplätze im Lesesaal.",
        "body": "Ab dieser Woche bietet die Universitätsbibliothek erweiterte Öffnungszeiten an. Montag bis Freitag ist bis 22 Uhr geöffnet, am Wochenende von 10 bis 18 Uhr.\n\nZusätzlich stehen 40 weitere Lernplätze im Lesesaal zur Verfügung. Gruppenarbeitsräume können online reserviert werden.",
        "category": "Campus",
        "image_url": "https://images.unsplash.com/photo-1514513452089-17f8a9771ee8?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    },
    {
        "title": "Hochschulsport: Neue Kurse im Programm",
        "summary": "Von Segeln auf der Alster bis Krafttraining – das neue Sportprogramm ist online.",
        "body": "Der Hochschulsport der HSU erweitert sein Angebot: Neu im Programm sind Segelkurse auf der Außenalster, Bouldern sowie zusätzliche Yoga-Einheiten am frühen Morgen.\n\nDie Anmeldung erfolgt über das Sportportal. Die Plätze sind begrenzt und werden nach Anmeldeeingang vergeben.",
        "category": "Sport",
        "image_url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    },
    {
        "title": "Forschungsprojekt zur Cybersicherheit gestartet",
        "summary": "Die Fakultät für Elektrotechnik und Informatik beteiligt sich an einem neuen Verbundprojekt.",
        "body": "Die HSU beteiligt sich an einem neuen Verbundprojekt zur Resilienz kritischer Infrastrukturen. Im Fokus stehen Angriffserkennung in vernetzten Systemen und sichere Kommunikationsprotokolle.\n\nStudierende können im Rahmen von Abschlussarbeiten mitwirken. Interessierte melden sich im Sekretariat der Professur.",
        "category": "Forschung",
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    },
    {
        "title": "Mensa: Neues veganes Tagesangebot",
        "summary": "Ab sofort gibt es täglich ein zusätzliches veganes Hauptgericht in der Mensa.",
        "body": "Das Studierendenwerk erweitert das Angebot der Mensa um ein tägliches veganes Hauptgericht. Die Gerichte wechseln wöchentlich und werden mit regionalen Zutaten zubereitet.\n\nAllergenangaben findet ihr direkt in der App im Bereich Mensa.",
        "category": "Campus",
        "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    },
]

DEMO_SCHEDULE = [
    {
        "title": "Höhere Mathematik II",
        "type": "Vorlesung",
        "professor": "Prof. Dr. Albrecht",
        "location": "H1, Gebäude Holstenhofweg",
        "weekday": 0,
        "start_time": "08:15",
        "end_time": "09:45",
    },
    {
        "title": "Technische Informatik",
        "type": "Vorlesung",
        "professor": "Prof. Dr. Reimers",
        "location": "H3, Gebäude Douaumont",
        "weekday": 0,
        "start_time": "10:00",
        "end_time": "11:30",
    },
    {
        "title": "Wehrtechnik Seminar",
        "type": "Seminar",
        "professor": "Dr. Lenz",
        "location": "Raum 2.14",
        "weekday": 1,
        "start_time": "13:00",
        "end_time": "14:30",
    },
    {
        "title": "Elektrotechnik Übung",
        "type": "Übung",
        "professor": "M. Sc. Kruse",
        "location": "Labor E05",
        "weekday": 2,
        "start_time": "09:00",
        "end_time": "10:30",
    },
    {
        "title": "Führung & Organisation",
        "type": "Vorlesung",
        "professor": "Prof. Dr. Hartmann",
        "location": "H2",
        "weekday": 3,
        "start_time": "11:00",
        "end_time": "12:30",
    },
    {
        "title": "Projektarbeit Robotik",
        "type": "Projekt",
        "professor": "Prof. Dr. Vogel",
        "location": "Labor R12",
        "weekday": 4,
        "start_time": "08:30",
        "end_time": "11:00",
    },
]

DEMO_GRADES = [
    {"semester": "Trimester 1", "course": "Höhere Mathematik I", "ects": 8, "grade": 1.7},
    {"semester": "Trimester 1", "course": "Grundlagen der Elektrotechnik", "ects": 6, "grade": 2.0},
    {"semester": "Trimester 1", "course": "Einführung in die Informatik", "ects": 5, "grade": 1.3},
    {"semester": "Trimester 2", "course": "Technische Mechanik", "ects": 6, "grade": 2.3},
    {"semester": "Trimester 2", "course": "Digitaltechnik", "ects": 5, "grade": 1.7},
    {"semester": "Trimester 3", "course": "Führung und Organisation", "ects": 4, "grade": 2.7},
]


async def seed_campus_data() -> None:
    """Mensa-Pläne für zwei Wochen und Campus-News anlegen (idempotent)."""
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    for offset in range(10):
        day = monday + timedelta(days=offset // 5 * 7 + offset % 5)
        day_iso = day.isoformat()
        if await db.mensa.find_one({"date": day_iso}):
            continue
        meals = MENSA_TEMPLATE[offset % 5]
        await db.mensa.insert_many(
            [
                {
                    "menu_id": str(uuid.uuid4()),
                    "date": day_iso,
                    **meal,
                }
                for meal in meals
            ]
        )

    if await db.news.count_documents({}) == 0:
        now = datetime.now(timezone.utc)
        await db.news.insert_many(
            [
                {
                    "news_id": str(uuid.uuid4()),
                    "published_at": now - timedelta(days=index, hours=index * 3),
                    **item,
                }
                for index, item in enumerate(NEWS_ITEMS)
            ]
        )


async def seed_user_data(user_id: str) -> None:
    """Beispiel-Stundenplan und -Noten für einen neuen Nutzer."""
    now = datetime.now(timezone.utc)
    if await db.schedule.count_documents({"user_id": user_id}) == 0:
        await db.schedule.insert_many(
            [
                {
                    "entry_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "created_at": now,
                    **entry,
                }
                for entry in DEMO_SCHEDULE
            ]
        )
    if await db.grades.count_documents({"user_id": user_id}) == 0:
        await db.grades.insert_many(
            [
                {
                    "grade_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "created_at": now,
                    **grade,
                }
                for grade in DEMO_GRADES
            ]
        )
