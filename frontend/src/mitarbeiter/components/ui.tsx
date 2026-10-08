import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors, radius, space, touch, type } from '../theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Ist "Bewegung reduzieren" im Gerät an, laufen keine Animationen. */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

/** Gestaffeltes Erscheinen (45 ms je Element) von unten. */
export function FadeIn({ children, index = 0, style }: { children: React.ReactNode; index?: number; style?: ViewStyle }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, { toValue: 1, duration: 320, delay: index * 45, easing: Easing.bezier(0.23, 1, 0.32, 1), useNativeDriver: true }).start();
  }, [reduced, index, v]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Tippfläche mit Druckgefühl 0,97. */
export function Press({ children, onPress, style, label, role = 'button', checked, selected }: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  label: string;
  role?: 'button' | 'checkbox' | 'tab';
  checked?: boolean;
  selected?: boolean;
}) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const to = (n: number) => {
    if (!reduced) Animated.timing(scale, { toValue: n, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      onPressIn={() => to(0.97)}
      onPressOut={() => to(1)}
      accessibilityRole={onPress ? role : 'text'}
      accessibilityLabel={label}
      accessibilityState={{ ...(checked === undefined ? {} : { checked }), ...(selected === undefined ? {} : { selected }) }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Heading({ title, intro }: { title: string; intro?: string }) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text accessibilityRole="header" style={type.title}>{title}</Text>
      {intro ? <Text style={[type.small, { marginTop: space.xs, fontSize: 15, lineHeight: 22 }]}>{intro}</Text> : null}
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text accessibilityRole="header" style={[type.label, { marginTop: space.md, marginBottom: space.sm }]}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function DemoBadge({ text = 'Testmodus: Beispieldaten, nichts wird gespeichert' }: { text?: string }) {
  return (
    <View style={s.demo} accessible accessibilityLabel={text}>
      <Ionicons name="flask-outline" size={16} color={colors.yellow} />
      <Text style={s.demoText}>{text}</Text>
    </View>
  );
}

export function IconCircle({ icon, color = colors.mint }: { icon: IconName; color?: string }) {
  return (
    <View style={s.circle}>
      <Ionicons name={icon} size={21} color={color} />
    </View>
  );
}

export function Tile({ icon, title, detail, onPress, color, locked }: { icon: IconName; title: string; detail: string; onPress?: () => void; color?: string; locked?: boolean }) {
  return (
    <Press onPress={onPress} label={`${title}. ${detail}`} style={s.tile}>
      <IconCircle icon={locked ? 'lock-closed-outline' : icon} {...(color ? { color } : {})} />
      <View style={{ flex: 1 }}>
        <Text style={type.item}>{title}</Text>
        <Text style={type.small}>{detail}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </Press>
  );
}

export function Empty({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <View style={s.empty}>
      <IconCircle icon={icon} />
      <Text style={type.item}>{title}</Text>
      <Text style={[type.small, { textAlign: 'center', maxWidth: 280 }]}>{text}</Text>
    </View>
  );
}

/** Primär: weiße Pille. Leise: Glas. Dringend ("jetzt handeln"): gelbe Pille. */
export function PrimaryButton({ label, onPress, tone = 'primary' }: { label: string; onPress: () => void; tone?: 'primary' | 'quiet' | 'urgent' }) {
  const bg = tone === 'primary' ? '#FFFFFF' : tone === 'urgent' ? colors.yellow : colors.surfaceStrong;
  const fg = tone === 'quiet' ? colors.text : colors.onLight;
  return (
    <Press onPress={onPress} label={label} style={[s.button, { backgroundColor: bg }] as ViewStyle[]}>
      <Text style={[s.buttonText, { color: fg }]}>{label}</Text>
    </Press>
  );
}

export function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Press onPress={onPress} label={label} role="tab" selected={!!active} style={[s.pill, active ? s.pillActive : undefined] as ViewStyle[]}>
      <Text style={[s.pillText, active && { color: colors.onLight }]}>{label}</Text>
    </Press>
  );
}

export const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(252,211,77,0.14)', borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 14, marginBottom: space.md },
  demoText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: colors.yellow, fontWeight: '600' },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center' },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: space.md, minHeight: touch + 16, backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: space.sm },
  empty: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: space.xl, paddingHorizontal: space.lg, gap: 12 },
  button: { minHeight: touch + 4, borderRadius: radius.pill, paddingHorizontal: 22, justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch' },
  buttonText: { fontWeight: '700', fontSize: 15.5 },
  pill: { minHeight: 40, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.surface, justifyContent: 'center', marginRight: space.sm },
  pillActive: { backgroundColor: '#FFFFFF' },
  pillText: { color: colors.text, fontWeight: '600', fontSize: 14 },
});
