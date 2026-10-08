import React, { useState } from 'react';
import { Text } from 'react-native';
import { colors, type } from '../theme';
import { Card, DemoBadge, FadeIn, Heading, Tile } from '../components/ui';

const ITEMS = [
  { icon: 'time-outline', title: 'Ich komme später', color: colors.yellow },
  { icon: 'thermometer-outline', title: 'Ich bin krank', color: colors.red },
  { icon: 'alert-circle-outline', title: 'Problem vor Ort', color: colors.orange },
  { icon: 'location-outline', title: 'Adresse falsch', color: colors.blue },
] as const;

export function Melden() {
  const [note, setNote] = useState('');
  return (
    <>
      <FadeIn index={0}><Heading title="Melden" intro="Sag dem Büro und dem Kunden Bescheid." /></FadeIn>
      <FadeIn index={1}><DemoBadge text="Testmodus: Meldungen werden noch nicht gesendet." /></FadeIn>
      {ITEMS.map((i, n) => (
        <FadeIn key={i.title} index={2 + n}>
          <Tile icon={i.icon} color={i.color} title={i.title} detail="Antippen" onPress={() => setNote(`${i.title}: Diese Meldung wird gesendet, sobald die Verbindung zum Büro eingerichtet ist. Im Testmodus passiert nichts.`)} />
        </FadeIn>
      ))}
      {note ? <Card><Text style={type.small}>{note}</Text></Card> : null}
    </>
  );
}
