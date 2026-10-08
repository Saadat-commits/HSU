import React from 'react';
import { colors } from '../theme';
import { DemoBadge, Empty, FadeIn, Heading, Tile } from '../components/ui';

export function Chat() {
  return (
    <>
      <FadeIn index={0}><Heading title="Chat" intro="Hilfe, Ankündigungen und Einsatz-Chats." /></FadeIn>
      <FadeIn index={1}><DemoBadge text="Noch nicht verbunden: Nachrichten brauchen die sichere Verbindung zum Büro." /></FadeIn>
      <FadeIn index={2}><Tile icon="sparkles-outline" color={colors.mint} title="Assistent" detail="Fragen zu Einsatz, Lohn und Regeln" /></FadeIn>
      <FadeIn index={3}><Empty icon="chatbubble-outline" title="Keine Nachrichten" text="Team-Ankündigungen, Einsatz-Chats und das Büro erscheinen hier." /></FadeIn>
    </>
  );
}
