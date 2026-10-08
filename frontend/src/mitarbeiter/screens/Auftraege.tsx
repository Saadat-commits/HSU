import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { Assignment, Loaded } from '../data/types';
import { colors } from '../theme';
import { DemoBadge, Empty, FadeIn, Heading, Pill, Tile } from '../components/ui';

const FILTERS = ['Neu', 'Dienstplan', 'Vergangene', 'Bewerbungen', 'Absagen'] as const;
type Filter = (typeof FILTERS)[number];
const STATUS: Record<Filter, Assignment['status'] | null> = {
  Neu: 'angefragt',
  Dienstplan: 'angenommen',
  Vergangene: 'abgeschlossen',
  Bewerbungen: null, // kommt mit der Anbindung (eigene Daten)
  Absagen: 'abgelehnt',
};

const when = (iso: string) =>
  new Date(iso).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function Auftraege({ assignments }: { assignments: Loaded<Assignment[]> | null }) {
  const [filter, setFilter] = useState<Filter>('Neu');
  const wanted = STATUS[filter];
  const list = wanted ? (assignments?.data ?? []).filter((a) => a.status === wanted) : [];
  return (
    <>
      <FadeIn index={0}><Heading title="Aufträge" intro="Aufträge in deiner Nähe und deine Einsätze." /></FadeIn>
      {assignments?.source === 'demo' ? <FadeIn index={1}><DemoBadge /></FadeIn> : null}
      <FadeIn index={2}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, flexGrow: 0 }}>
          {FILTERS.map((f) => <Pill key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />)}
        </ScrollView>
      </FadeIn>
      {list.length > 0 ? (
        list.map((a) => (
          <Tile key={a.id} icon="calendar-outline" color={colors.blue} title={a.title} detail={`${when(a.startsAt)} bis ${when(a.endsAt)}, ${a.place}`} />
        ))
      ) : (
        <FadeIn index={3}>
          <Empty icon="location-outline" title="Hier ist noch nichts" text="Aufträge werden geladen, sobald die Anmeldung und die Verbindung zum Büro eingerichtet sind." />
        </FadeIn>
      )}
    </>
  );
}
