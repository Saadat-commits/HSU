import React, { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors, radius, space, touch, type } from './theme';
import { NAV, OVERLAYS, type Go, type Overlay, type Tab } from './navigation';
import { Press } from './components/ui';
import { repository } from './data/repository';
import type { Assignment, Loaded, Task } from './data/types';
import { Home } from './screens/Home';
import { Auftraege } from './screens/Auftraege';
import { Lohn } from './screens/Lohn';
import { Chat } from './screens/Chat';
import { Apps } from './screens/Apps';
import { Zeit } from './screens/Zeit';
import { Aufgaben } from './screens/Aufgaben';
import { Melden } from './screens/Melden';
import { Profil } from './screens/Profil';

export function MitarbeiterApp() {
  const [tab, setTab] = useState<Tab>('Home');
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [assignments, setAssignments] = useState<Loaded<Assignment[]> | null>(null);
  const [tasks, setTasks] = useState<Loaded<Task[]> | null>(null);

  useEffect(() => {
    void repository.assignments().then(setAssignments);
    void repository.tasks().then(setTasks);
  }, []);

  const go: Go = (to) => {
    if ((OVERLAYS as string[]).includes(to)) setOverlay(to as Overlay);
    else {
      setOverlay(null);
      setTab(to as Tab);
    }
  };
  const screen = overlay ?? tab;

  return (
    <>
      <SafeAreaView style={st.root}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <View style={st.header}>
          {overlay ? (
            <Press onPress={() => setOverlay(null)} label="Zurück" style={st.round}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Press>
          ) : (
            <Press onPress={() => go('Profil')} label="Mein Profil" style={st.round}>
              <Ionicons name="person" size={20} color={colors.mint} />
            </Press>
          )}
          <Text accessibilityRole="header" style={type.item}>{overlay ?? 'HSU Mitarbeiter'}</Text>
          <View style={{ width: touch }} />
        </View>
        <ScrollView key={screen} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          {screen === 'Home' && <Home assignments={assignments} go={go} />}
          {screen === 'Aufträge' && <Auftraege assignments={assignments} />}
          {screen === 'Lohn' && <Lohn />}
          {screen === 'Chat' && <Chat />}
          {screen === 'Apps' && <Apps go={go} />}
          {screen === 'Zeit' && <Zeit />}
          {screen === 'Aufgaben' && <Aufgaben tasks={tasks} />}
          {screen === 'Melden' && <Melden />}
          {screen === 'Profil' && <Profil />}
        </ScrollView>
        <View style={st.navWrap} pointerEvents="box-none">
          <View style={st.nav} accessibilityRole="tablist">
            {NAV.map((item) => {
              const active = !overlay && tab === item.label;
              return (
                <Press key={item.label} onPress={() => go(item.label)} label={item.label} role="tab" selected={active} style={[st.navItem, active ? st.navActive : undefined] as never}>
                  <Ionicons name={item.icon} size={22} color={active ? colors.text : colors.muted} />
                  {active ? <Text style={st.navText}>{item.label}</Text> : null}
                </Press>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: space.lg, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round: { width: touch, height: touch, borderRadius: touch / 2, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: 120 },
  navWrap: { position: 'absolute', left: 0, right: 0, bottom: 14, alignItems: 'center' },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1A1D1C', borderRadius: radius.pill, padding: 6, borderWidth: 1, borderColor: colors.line },
  navItem: { minHeight: touch, minWidth: touch, borderRadius: radius.pill, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  navActive: { backgroundColor: colors.surfaceStrong },
  navText: { color: colors.text, fontSize: 13.5, fontWeight: '700' },
});
