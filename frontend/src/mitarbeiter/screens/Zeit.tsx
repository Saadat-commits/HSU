import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors, radius, space, type } from '../theme';
import { DemoBadge, FadeIn, Heading, PrimaryButton } from '../components/ui';

const hms = (ms: number) => {
  const t = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(t / 3600))}:${p(Math.floor((t % 3600) / 60))}:${p(t % 60)}`;
};

/**
 * Testmodus: eine lokale Stoppuhr zum Ausprobieren der Bedienung.
 * Es werden keine Arbeitszeiten gespeichert. Die echte Zeiterfassung läuft später
 * mit Serverzeit über das Büro (Beginn, Pause, Ende, Korrekturantrag).
 */
export function Zeit() {
  const [state, setState] = useState<'bereit' | 'laeuft' | 'pause'>('bereit');
  const [elapsed, setElapsed] = useState(0);
  const last = useRef(0);

  useEffect(() => {
    if (state !== 'laeuft') return;
    last.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      setElapsed((e) => e + (now - last.current));
      last.current = now;
    }, 500);
    return () => clearInterval(id);
  }, [state]);

  return (
    <>
      <FadeIn index={0}><Heading title="Zeiterfassung" intro="Deine Arbeitszeit im Blick." /></FadeIn>
      <DemoBadge text="Testmodus: Die Stoppuhr dient nur zum Ausprobieren. Es wird keine Arbeitszeit gespeichert." />
      <FadeIn index={2}>
      <View style={st.card}>
        <Ionicons name="time-outline" size={42} color={colors.mint} />
        <Text style={[type.amount, { fontSize: 44 }]} accessibilityLabel={`Gestoppte Zeit ${hms(elapsed)}`}>{hms(elapsed)}</Text>
        <Text style={[type.small, { marginBottom: space.sm }]}>{state === 'bereit' ? 'Bereit zum Starten' : state === 'laeuft' ? 'Läuft' : 'Pause'}</Text>
        {state === 'bereit' && <PrimaryButton label="Jetzt einstempeln" tone="urgent" onPress={() => setState('laeuft')} />}
        {state === 'laeuft' && (
          <>
            <PrimaryButton label="Pause" tone="quiet" onPress={() => setState('pause')} />
            <PrimaryButton label="Ende" onPress={() => { setState('bereit'); setElapsed(0); }} />
          </>
        )}
        {state === 'pause' && (
          <>
            <PrimaryButton label="Weiter" onPress={() => setState('laeuft')} />
            <PrimaryButton label="Ende" tone="quiet" onPress={() => { setState('bereit'); setElapsed(0); }} />
          </>
        )}
      </View>
      </FadeIn>
    </>
  );
}

const st = StyleSheet.create({
  card: { alignItems: 'center', padding: space.lg, borderRadius: radius.md, backgroundColor: colors.surface, gap: space.sm },
});
