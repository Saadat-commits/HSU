import type { Assignment, Loaded, Task } from './types';

/**
 * Einziger Zugang der Bildschirme zu Daten. Heute gibt es nur das Demo-Repository
 * (leer, ohne erfundene Zahlen). Die echte Anbindung (Anmeldung, Rollen, API) wird
 * hier eingehängt, ohne dass sich ein Bildschirm ändert.
 */
export interface Repository {
  assignments(): Promise<Loaded<Assignment[]>>;
  tasks(): Promise<Loaded<Task[]>>;
}

export const repository: Repository = {
  async assignments() {
    return { source: 'demo', data: [] };
  },
  async tasks() {
    return {
      source: 'demo',
      data: [
        { id: 't1', title: 'Arbeitsmaterial prüfen', done: false },
        { id: 't2', title: 'Einsatzbestätigung vorbereiten', done: false },
        { id: 't3', title: 'Dokumente aktualisieren', done: false },
      ],
    };
  },
};
