import type { IconName } from './components/ui';

/** Fünf Punkte in der schwebenden Leiste (Hauptdesign). Profil liegt hinter dem Kreis oben links. */
export type Tab = 'Home' | 'Aufträge' | 'Lohn' | 'Chat' | 'Apps';
/** Bildschirme, die über einem Reiter öffnen. */
export type Overlay = 'Profil' | 'Zeit' | 'Aufgaben' | 'Melden';
export type Go = (to: Tab | Overlay) => void;

export const NAV: { label: Tab; icon: IconName }[] = [
  { label: 'Home', icon: 'home-outline' },
  { label: 'Aufträge', icon: 'location-outline' },
  { label: 'Lohn', icon: 'wallet-outline' },
  { label: 'Chat', icon: 'chatbubble-outline' },
  { label: 'Apps', icon: 'grid-outline' },
];
export const OVERLAYS: Overlay[] = ['Profil', 'Zeit', 'Aufgaben', 'Melden'];
