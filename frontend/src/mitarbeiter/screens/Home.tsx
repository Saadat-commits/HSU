import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Assignment, Loaded } from '../data/types';
import { colors, radius, space, type } from '../theme';
import { Card, DemoBadge, FadeIn, IconCircle, Press, SectionLabel, Tile, type IconName } from '../components/ui';
import type { Go } from '../navigation';

const ACTIONS: { label: string; icon: IconName; to: Parameters<Go>[0]; color: string }[] = [
  { label: 'Stempeln', icon: 'timer-outline', to: 'Zeit', color: colors.mint },
  { label: 'Aufträge', icon: 'location-outline', to: 'Aufträge', color: colors.blue },
  { label: 'Melden', icon: 'megaphone-outline', to: 'Melden', color: colors.yellow },
  { label: 'Apps', icon: 'grid-outline', to: 'Apps', color: colors.teal },
];

export function Home({ assignments, go }: { assignments: Loaded<Assignment[]> | null; go: Go }) {
  const month = new Date().toLocaleString('de-DE', { month: 'long' });
  const next = assignments?.data.find((a) => a.status === 'angenommen');
  return (
    <>
      {assignments?.source === 'demo' ? <FadeIn index={0}><DemoBadge /></FadeIn> : null}
      <FadeIn index={1}>
        <Card style={{ paddingVertical: space.lg }}>
          <Text style={type.label}>Verdient im {month}</Text>
          <Text style={[type.amount, { marginTop: 6 }]} accessibilityLabel="Noch kein Betrag verfügbar">—</Text>
          <Text style={[type.small, { marginTop: 6 }]}>Dein Verdienst erscheint hier, sobald die Verbindung zum Büro eingerichtet ist.</Text>
        </Card>
      </FadeIn>
      <FadeIn index={2}>
        <View style={st.actions}>
          {ACTIONS.map((a) => (
            <Press key={a.label} onPress={() => go(a.to)} label={a.label} style={st.action}>
              <IconCircle icon={a.icon} color={a.color} />
              <Text style={st.actionText}>{a.label}</Text>
            </Press>
          ))}
        </View>
      </FadeIn>
      <FadeIn index={3}>
        <SectionLabel>Heute · dein nächster Einsatz</SectionLabel>
        {next ? (
          <Tile icon="location-outline" title={next.title} detail={next.place} onPress={() => go('Aufträge')} />
        ) : (
          <Card><Text style={type.small}>Noch kein Einsatz zugewiesen. Neue Einsätze erscheinen hier.</Text></Card>
        )}
      </FadeIn>
      <FadeIn index={4}>
        <SectionLabel>Offene Aufträge für dich</SectionLabel>
        <Tile icon="briefcase-outline" title="Alle Aufträge ansehen" detail="Aufträge in deiner Nähe" onPress={() => go('Aufträge')} color={colors.blue} />
      </FadeIn>
    </>
  );
}

const st = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md },
  action: { alignItems: 'center', gap: 8, minWidth: 72, minHeight: 72, borderRadius: radius.md },
  actionText: { color: colors.text, fontSize: 12.5, fontWeight: '600' },
});
