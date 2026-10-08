import { Platform, type TextStyle } from 'react-native';

/**
 * Hauptdesign der Mitarbeiter-App (Revolut-Stil, dunkel), übernommen aus
 * docs/design-mitarbeiter-app.md. Nur hier ändern, nicht in den Bildschirmen.
 */
export const colors = {
  bg: '#0C0E0D',
  surface: 'rgba(255,255,255,0.08)',
  surfaceStrong: 'rgba(255,255,255,0.14)',
  line: 'rgba(255,255,255,0.14)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.64)', // Zweittext
  mint: '#6EE7A0', // Erfolg, Plus, aktive Links
  yellow: '#FCD34D', // Achtung, "jetzt handeln"
  red: '#FB7185', // Gefahr, Abzug
  blue: '#38BDF8', // Info
  teal: '#2DD4BF',
  orange: '#FB923C',
  sage: '#CFD8C6',
  onLight: '#0C0E0D', // Text auf weißer Pille
} as const;

export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 36 } as const;
/** Karten haben Radius 24, keine Schatten, keine Ränder. */
export const radius = { sm: 14, md: 24, pill: 999 } as const;
/** Mindestgröße für Tippflächen (Apple: 44 pt, Android: 48 dp). */
export const touch = 48;

const base = Platform.select({ ios: 'System', default: 'sans-serif' });
const t = (s: TextStyle): TextStyle => ({ fontFamily: base, color: colors.text, ...s });
/** Schrift: Seitentitel 28/34 fett, Abschnittslabel 13 fett in Zweitfarbe, Hauptbetrag 48. */
export const type = {
  title: t({ fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3 }),
  label: t({ fontSize: 13, lineHeight: 18, fontWeight: '700', color: colors.muted }),
  item: t({ fontSize: 16, lineHeight: 22, fontWeight: '600' }),
  body: t({ fontSize: 15, lineHeight: 22 }),
  small: t({ fontSize: 13, lineHeight: 19, color: colors.muted }),
  amount: t({ fontSize: 48, lineHeight: 54, fontWeight: '700', fontVariant: ['tabular-nums'] }),
  num: t({ fontSize: 22, lineHeight: 28, fontWeight: '700', fontVariant: ['tabular-nums'] }),
} as const;
