import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const useStyles = makeStyles((colors) => ({
  group: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.onSurface },
  labelDestructive: { color: colors.error },
  value: { fontSize: 14, color: colors.muted },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 32 + spacing.md,
  },
}));

export function ListGroup({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const items = React.Children.toArray(children);
  return (
    <View style={styles.group}>
      {items.map((child, index) => (
        <View key={index}>
          {index > 0 ? <View style={styles.divider} /> : null}
          {child}
        </View>
      ))}
    </View>
  );
}

export function ListRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  testID,
  right,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  testID?: string;
  right?: React.ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.icon}>
        <Ionicons
          name={icon}
          size={17}
          color={destructive ? colors.error : colors.brandPrimary}
        />
      </View>
      <Text style={[styles.label, destructive && styles.labelDestructive]}>
        {label}
      </Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {right}
      {onPress && !right ? (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      ) : null}
    </TouchableOpacity>
  );
}
