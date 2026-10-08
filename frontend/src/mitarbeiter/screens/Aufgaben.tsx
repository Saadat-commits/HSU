import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import type { Loaded, Task } from '../data/types';
import { colors, radius, space, touch, type } from '../theme';
import { DemoBadge, FadeIn, Heading, Press } from '../components/ui';

export function Aufgaben({ tasks }: { tasks: Loaded<Task[]> | null }) {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => setDone([]), [tasks]);
  const toggle = (id: string) => setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  return (
    <>
      <FadeIn index={0}><Heading title="Meine Aufgaben" intro="Deine Checkliste für den Einsatz." /></FadeIn>
      {tasks?.source === 'demo' ? <FadeIn index={1}><DemoBadge text="Testmodus: Beispielaufgaben, nur auf diesem Bildschirm" /></FadeIn> : null}
      {tasks?.data.map((t, i) => {
        const isDone = done.includes(t.id);
        return (
          <FadeIn key={t.id} index={2 + i}>
            <Press onPress={() => toggle(t.id)} role="checkbox" checked={isDone} label={t.title} style={st.row}>
              <Ionicons name={isDone ? 'checkmark-circle' : 'ellipse-outline'} color={isDone ? colors.mint : colors.muted} size={28} />
              <Text style={[type.item, { flex: 1 }, isDone && { textDecorationLine: 'line-through', color: colors.muted }]}>{t.title}</Text>
            </Press>
          </FadeIn>
        );
      })}
    </>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: touch + 16, padding: space.md, backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: space.sm },
});
