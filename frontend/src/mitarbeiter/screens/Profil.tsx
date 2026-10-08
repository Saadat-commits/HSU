import React from 'react';
import { Text } from 'react-native';
import { colors, type } from '../theme';
import { Card, FadeIn, Heading, SectionLabel, Tile } from '../components/ui';

/** Gruppen laut Hauptdesign: Konto, Arbeit, App, Rechtliches. */
export function Profil() {
  return (
    <>
      <FadeIn index={0}><Heading title="Profil" intro="Persönliche Angaben und Einstellungen." /></FadeIn>
      <FadeIn index={1}>
        <SectionLabel>Konto</SectionLabel>
        <Tile icon="person-circle-outline" color={colors.mint} title="Persönliche Daten" detail="Kontakt, Bank, Steuer, Aufenthalt, Notfallkontakt" />
        <Tile icon="document-text-outline" color={colors.blue} title="Vertrag und Dokumente" detail="Lesen und digital unterschreiben" />
        <Tile icon="wallet-outline" color={colors.teal} title="Lohn und Auszahlung" detail="Nur deine eigenen Daten" />
      </FadeIn>
      <FadeIn index={2}>
        <SectionLabel>Arbeit</SectionLabel>
        <Tile icon="calendar-outline" color={colors.yellow} title="Verfügbarkeit" detail="Wann du arbeiten kannst" />
        <Tile icon="star-outline" color={colors.orange} title="Bewertungen" detail="Was Kunden sagen" />
      </FadeIn>
      <FadeIn index={3}>
        <SectionLabel>App</SectionLabel>
        <Tile icon="color-palette-outline" color={colors.sage} title="Design" detail="Hell, Dunkel oder System" />
        <Tile icon="notifications-outline" color={colors.blue} title="Benachrichtigungen" detail="Was dich erreichen darf" />
        <Tile icon="shield-checkmark-outline" color={colors.mint} title="Sicherheit" detail="PIN und Face ID" />
      </FadeIn>
      <FadeIn index={4}>
        <SectionLabel>Rechtliches</SectionLabel>
        <Tile icon="lock-closed-outline" color={colors.sage} title="Datenschutz" detail="Wie deine Daten verwendet werden" />
        <Card><Text style={type.small}>Eine Kündigung ist nur schriftlich wirksam (§ 623 BGB). Eine Kündigung in der App ist nicht möglich.</Text></Card>
      </FadeIn>
    </>
  );
}
