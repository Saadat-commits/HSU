import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.05)" },
      default: {
        shadowColor: "#000000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      },
    }),
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  buttonPrimary: { backgroundColor: colors.brandPrimary },
  buttonSecondary: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  buttonGhost: { backgroundColor: "transparent" },
  buttonTextPrimary: {
    color: colors.onBrandPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonTextSecondary: {
    color: colors.onSurfaceSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextGhost: {
    color: colors.brandPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  disabled: { opacity: 0.5 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurfaceTertiary,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -spacing.sm,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.onSurface,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.onBrandTertiary,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  centerText: { color: colors.muted, fontSize: 14 },
}));

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: string }) {
  const styles = useStyles();
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const variantStyle =
    variant === "primary"
      ? styles.buttonPrimary
      : variant === "secondary"
        ? styles.buttonSecondary
        : styles.buttonGhost;
  const textStyle =
    variant === "primary"
      ? styles.buttonTextPrimary
      : variant === "secondary"
        ? styles.buttonTextSecondary
        : styles.buttonTextGhost;
  const iconColor =
    variant === "primary" ? colors.onBrandPrimary : colors.brandPrimary;

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      activeOpacity={0.85}
      disabled={isDisabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={[styles.button, variantStyle, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={iconColor} /> : null}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function ScreenHeader({
  title,
  showBack = true,
  right,
}: {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          testID="screen-header-back"
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={26} color={colors.brandPrimary} />
        </Pressable>
      ) : null}
      <Text style={styles.headerTitle}>{title}</Text>
      {right}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: IconName;
  title: string;
  hint?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.brandPrimary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
    </View>
  );
}

export function Pill({ children }: { children: string }) {
  const styles = useStyles();
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

export function LoadingView({ label }: { label?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brandPrimary} size="large" />
      {label ? <Text style={styles.centerText}>{label}</Text> : null}
    </View>
  );
}

export function ErrorView({
  title,
  retryLabel,
  onRetry,
}: {
  title: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
      <Text style={styles.centerText}>{title}</Text>
      <AppButton label={retryLabel} onPress={onRetry} variant="secondary" />
    </View>
  );
}
