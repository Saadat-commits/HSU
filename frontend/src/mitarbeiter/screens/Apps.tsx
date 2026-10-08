import React from 'react';
import { colors } from '../theme';
import { Card, FadeIn, Heading, SectionLabel, Tile } from '../components/ui';
import { Text } from 'react-native';
import { type } from '../theme';
import type { Go } from '../navigation';

/** Mein Bereich, vom Chef freigeschaltete Apps (Sehen/Bearbeiten) und gesperrte Apps. */
export function Apps({ go }: { go: Go }) {
  return (
    <>
      <FadeIn index={0}><Heading title="Apps" intro="Alles, was du für deine Arbeit brauchst." /></FadeIn>
      <FadeIn index={1}>
        <SectionLabel>Mein Bereich</SectionLabel>
        <Tile icon="timer-outline" color={colors.mint} title="Zeiterfassung" detail="Arbeitszeit erfassen" onPress={() => go('Zeit')} />
        <Tile icon="checkbox-outline" color={colors.teal} title="Meine Aufgaben" detail="Checkliste für den Einsatz" onPress={() => go('Aufgaben')} />
        <Tile icon="megaphone-outline" color={colors.yellow} title="Melden" detail="Später, krank, Problem, Adresse falsch" onPress={() => go('Melden')} />
        <Tile icon="document-text-outline" color={colors.blue} title="Dokumente" detail="Noch nicht verbunden" />
        <Tile icon="school-outline" color={colors.orange} title="My Learning" detail="Schulungen und Onboarding, noch nicht verbunden" />
      </FadeIn>
      <FadeIn index={2}>
        <SectionLabel>Vom Chef freigeschaltet</SectionLabel>
        <Card><Text style={type.small}>Noch nichts freigeschaltet. Dein Chef kann dir weitere Apps zum Sehen oder Bearbeiten freigeben.</Text></Card>
      </FadeIn>
    </>
  );
}
