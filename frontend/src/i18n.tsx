// Simple two-language dictionary (DE/EN) with an in-app switch.
// Add new strings to BOTH dictionaries; keys are flat and dot-free.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { storage } from "@/src/utils/storage";

export type Language = "de" | "en";

const LANG_KEY = "hsu.language";

const de = {
  appName: "HSU Campus",
  university: "Helmut-Schmidt-Universität",
  // Auth
  welcome: "Willkommen",
  loginTitle: "Anmelden",
  registerTitle: "Konto erstellen",
  loginSubtitle: "Dein Campus. Dein Studium. Eine App.",
  name: "Name",
  email: "E-Mail",
  password: "Passwort",
  passwordHint: "Mindestens 8 Zeichen",
  login: "Anmelden",
  register: "Registrieren",
  noAccount: "Noch kein Konto? Jetzt registrieren",
  haveAccount: "Schon registriert? Anmelden",
  googleLogin: "Mit Google anmelden",
  or: "oder",
  authFailed: "Anmeldung fehlgeschlagen",
  fillAllFields: "Bitte alle Felder ausfüllen.",
  // Tabs
  home: "Start",
  schedule: "Stundenplan",
  assistant: "KI-Assistent",
  profile: "Profil",
  // Home
  goodMorning: "Guten Morgen",
  goodAfternoon: "Guten Tag",
  goodEvening: "Guten Abend",
  quickLinks: "Schnellzugriff",
  todayClasses: "Heutige Veranstaltungen",
  noClassesToday: "Heute keine Veranstaltungen",
  noClassesTodayHint: "Genieße den freien Tag oder plane deine Lernzeit.",
  grades: "Noten",
  mensa: "Mensa",
  news: "Nachrichten",
  settings: "Einstellungen",
  average: "Durchschnitt",
  ects: "ECTS",
  openAssistant: "Frag den KI-Studienassistenten",
  openAssistantHint: "Zusammenfassungen, Lernpläne, Prüfungsfragen",
  // Schedule
  week: "Woche",
  addEntry: "Veranstaltung hinzufügen",
  noEntries: "Keine Veranstaltungen geplant",
  noEntriesHint: "Füge deine erste Veranstaltung hinzu.",
  title: "Titel",
  type: "Art",
  professor: "Dozent/in",
  location: "Ort",
  weekday: "Wochentag",
  startTime: "Beginn",
  endTime: "Ende",
  save: "Speichern",
  cancel: "Abbrechen",
  delete: "Löschen",
  deleteConfirm: "Wirklich löschen?",
  // Grades
  gradesTitle: "Noten",
  gradeAverage: "Notendurchschnitt",
  totalEcts: "ECTS gesamt",
  addGrade: "Note hinzufügen",
  semester: "Trimester",
  course: "Modul",
  grade: "Note",
  noGrades: "Noch keine Noten erfasst",
  noGradesHint: "Erfasse deine erste Note.",
  // Mensa
  mensaTitle: "Mensa",
  student: "Stud.",
  staff: "Bedienst.",
  mensaClosed: "Die Mensa hat heute geschlossen",
  mensaClosedHint: "Am Wochenende gibt es kein Angebot.",
  // News
  newsTitle: "Campus-Nachrichten",
  noNews: "Keine aktuellen Nachrichten",
  // Assistant
  assistantTitle: "KI-Studienassistent",
  assistantEmpty: "Wie kann ich dir beim Studium helfen?",
  assistantPlaceholder: "Nachricht schreiben …",
  suggestion1: "Fasse die Grundlagen der Elektrotechnik zusammen",
  suggestion2: "Erstelle mir einen Lernplan für diese Woche",
  suggestion3: "Erkläre Fourier-Transformation einfach",
  clearChat: "Verlauf löschen",
  thinking: "Denkt nach …",
  // Profile / Settings
  account: "Konto",
  preferences: "Einstellungen",
  language: "Sprache",
  german: "Deutsch",
  english: "Englisch",
  studyProgram: "Studiengang",
  editProfile: "Profil bearbeiten",
  logout: "Abmelden",
  logoutConfirm: "Möchtest du dich abmelden?",
  about: "Über die App",
  aboutText:
    "Inoffizielle Campus-App für Studierende der Helmut-Schmidt-Universität / Universität der Bundeswehr Hamburg.",
  // Exams
  exams: "Prüfungen",
  upcomingExams: "Kommende Prüfungen",
  addExam: "Prüfung hinzufügen",
  noExams: "Keine Prüfungen eingetragen",
  noExamsHint: "Trage deine nächste Klausur ein und behalte den Countdown im Blick.",
  examDate: "Datum (JJJJ-MM-TT)",
  daysLeft: "Tage",
  dayLeft: "Tag",
  examToday: "Heute!",
  examTomorrow: "Morgen",
  // Favorites
  favorites: "Favoriten",
  favoriteToday: "Lieblingsgericht heute in der Mensa",
  favoriteSoon: "Lieblingsgericht wieder am",
  favoriteAdded: "Zu den Favoriten hinzugefügt",
  favoriteBadge: "Favorit",
  // Flashcards
  flashcards: "Lernkarten",
  decks: "Kartenstapel",
  newDeck: "Lernkarten erstellen",
  deckTopic: "Modul oder Thema",
  deckCount: "Anzahl Karten",
  generate: "Mit KI erstellen",
  generating: "Lernkarten werden erstellt …",
  noDecks: "Noch keine Lernkarten",
  noDecksHint: "Lass die KI Lernkarten zu einem Modul erstellen.",
  cards: "Karten",
  mastered: "gewusst",
  answer: "Antwort",
  showAnswer: "Antwort zeigen",
  knewIt: "Gewusst",
  didntKnow: "Nochmal",
  deckDone: "Stapel durchgearbeitet",
  restart: "Von vorn beginnen",
  // Appearance
  appearance: "Erscheinungsbild",
  systemTheme: "Systemeinstellung",
  lightTheme: "Hell",
  darkTheme: "Dunkel",
  // Generic
  loading: "Lädt …",
  retry: "Erneut versuchen",
  errorTitle: "Etwas ist schiefgelaufen",
  errorGeneric: "Daten konnten nicht geladen werden.",
  today: "Heute",
  close: "Schließen",
};

const en: typeof de = {
  appName: "HSU Campus",
  university: "Helmut Schmidt University",
  welcome: "Welcome",
  loginTitle: "Sign in",
  registerTitle: "Create account",
  loginSubtitle: "Your campus. Your studies. One app.",
  name: "Name",
  email: "Email",
  password: "Password",
  passwordHint: "At least 8 characters",
  login: "Sign in",
  register: "Register",
  noAccount: "No account yet? Register now",
  haveAccount: "Already registered? Sign in",
  googleLogin: "Continue with Google",
  or: "or",
  authFailed: "Authentication failed",
  fillAllFields: "Please fill in all fields.",
  home: "Home",
  schedule: "Schedule",
  assistant: "AI Assistant",
  profile: "Profile",
  goodMorning: "Good morning",
  goodAfternoon: "Good afternoon",
  goodEvening: "Good evening",
  quickLinks: "Quick links",
  todayClasses: "Today's classes",
  noClassesToday: "No classes today",
  noClassesTodayHint: "Enjoy the free day or plan your study time.",
  grades: "Grades",
  mensa: "Canteen",
  news: "News",
  settings: "Settings",
  average: "Average",
  ects: "ECTS",
  openAssistant: "Ask the AI study assistant",
  openAssistantHint: "Summaries, study plans, exam questions",
  week: "Week",
  addEntry: "Add class",
  noEntries: "No classes scheduled",
  noEntriesHint: "Add your first class.",
  title: "Title",
  type: "Type",
  professor: "Lecturer",
  location: "Location",
  weekday: "Weekday",
  startTime: "Start",
  endTime: "End",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  deleteConfirm: "Delete this entry?",
  gradesTitle: "Grades",
  gradeAverage: "Grade average",
  totalEcts: "Total ECTS",
  addGrade: "Add grade",
  semester: "Term",
  course: "Course",
  grade: "Grade",
  noGrades: "No grades recorded yet",
  noGradesHint: "Add your first grade.",
  mensaTitle: "Canteen",
  student: "Student",
  staff: "Staff",
  mensaClosed: "The canteen is closed today",
  mensaClosedHint: "No meals are served on weekends.",
  newsTitle: "Campus news",
  noNews: "No recent news",
  assistantTitle: "AI study assistant",
  assistantEmpty: "How can I help with your studies?",
  assistantPlaceholder: "Write a message …",
  suggestion1: "Summarise the basics of electrical engineering",
  suggestion2: "Create a study plan for this week",
  suggestion3: "Explain the Fourier transform simply",
  clearChat: "Clear history",
  thinking: "Thinking …",
  account: "Account",
  preferences: "Preferences",
  language: "Language",
  german: "German",
  english: "English",
  studyProgram: "Study programme",
  editProfile: "Edit profile",
  logout: "Sign out",
  logoutConfirm: "Do you want to sign out?",
  about: "About",
  aboutText:
    "Unofficial campus app for students of Helmut Schmidt University / University of the Federal Armed Forces Hamburg.",
  // Exams
  exams: "Exams",
  upcomingExams: "Upcoming exams",
  addExam: "Add exam",
  noExams: "No exams scheduled",
  noExamsHint: "Add your next exam and keep an eye on the countdown.",
  examDate: "Date (YYYY-MM-DD)",
  daysLeft: "days",
  dayLeft: "day",
  examToday: "Today!",
  examTomorrow: "Tomorrow",
  // Favorites
  favorites: "Favourites",
  favoriteToday: "Favourite dish in the canteen today",
  favoriteSoon: "Favourite dish returns on",
  favoriteAdded: "Added to favourites",
  favoriteBadge: "Favourite",
  // Flashcards
  flashcards: "Flashcards",
  decks: "Decks",
  newDeck: "Create flashcards",
  deckTopic: "Course or topic",
  deckCount: "Number of cards",
  generate: "Create with AI",
  generating: "Creating flashcards …",
  noDecks: "No flashcards yet",
  noDecksHint: "Let the AI create flashcards for a course.",
  cards: "cards",
  mastered: "known",
  answer: "Answer",
  showAnswer: "Show answer",
  knewIt: "Knew it",
  didntKnow: "Again",
  deckDone: "Deck completed",
  restart: "Start over",
  // Appearance
  appearance: "Appearance",
  systemTheme: "System setting",
  lightTheme: "Light",
  darkTheme: "Dark",
  loading: "Loading …",
  retry: "Try again",
  errorTitle: "Something went wrong",
  errorGeneric: "Could not load data.",
  today: "Today",
  close: "Close",
};

const dictionaries = { de, en };

export type TranslationKey = keyof typeof de;

export const WEEKDAYS: Record<Language, string[]> = {
  de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

export const WEEKDAYS_LONG: Record<Language, string[]> = {
  de: [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
  ],
  en: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
};

type I18nValue = {
  lang: Language;
  t: (key: TranslationKey) => string;
  setLang: (lang: Language) => void;
};

const I18nContext = createContext<I18nValue>({
  lang: "de",
  t: (key) => de[key],
  setLang: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("de");

  useEffect(() => {
    storage.getItem(LANG_KEY, "de").then((value) => {
      if (value === "de" || value === "en") setLangState(value);
    });
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    storage.setItem(LANG_KEY, next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key: TranslationKey) => dictionaries[lang][key] ?? de[key],
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
