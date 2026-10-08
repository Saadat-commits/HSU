import React from 'react';
import { Text } from 'react-native';
import { Card, DemoBadge, Empty, FadeIn, Heading } from '../components/ui';
import { type } from '../theme';

/** Lohn und Gehalt: echte Beträge kommen nur vom Büro-System, nie aus der App. */
export function Lohn() {
  return (
    <>
      <FadeIn index={0}><Heading title="Lohn und Gehalt" intro="Deine Abrechnungen und Auszahlungen." /></FadeIn>
      <FadeIn index={1}><DemoBadge text="Noch nicht verbunden: Es werden keine Beträge angezeigt." /></FadeIn>
      <FadeIn index={2}>
        <Empty icon="wallet-outline" title="Noch keine Abrechnung" text="Stunden, Einsätze und Auszahlung erscheinen hier, sobald die Verbindung zum Büro besteht. Du siehst nur deine eigenen Daten." />
      </FadeIn>
      <FadeIn index={3}>
        <Card style={{ marginTop: 12 }}><Text style={type.small}>Nachweis als PDF und Drucken folgen mit der Anbindung.</Text></Card>
      </FadeIn>
    </>
  );
}
