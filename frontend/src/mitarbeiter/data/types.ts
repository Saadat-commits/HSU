/**
 * Datenmodell der App. Die App speichert keine Geschäftsdaten selbst:
 * Alles kommt über ein Repository (siehe repository.ts) vom Server.
 * Zeiten, Lohn und Personaldaten dürfen nie in der App erfunden oder berechnet werden.
 */
export type Assignment = {
  id: string;
  title: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  place: string;
  status: 'angefragt' | 'angenommen' | 'abgelehnt' | 'abgeschlossen';
};

export type Task = { id: string; title: string; done: boolean };

export type Source = 'demo' | 'server';

/** Antwort mit Herkunft: Die Oberfläche kennzeichnet Demo-Daten immer sichtbar. */
export type Loaded<T> = { source: Source; data: T };
