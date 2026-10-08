import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LOGIN, REGISTER } from "@/constants/testIds";
import { useAuth } from "@/src/auth";
import { AppButton, Field } from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { notify } from "@/src/utils/confirm";

const HERO =
  "https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

const HERO_HEIGHT = Math.round(Dimensions.get("window").height * 0.38);

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  hero: { height: HERO_HEIGHT, width: "100%" },
  heroImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroGradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.xl,
    gap: spacing.xs,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  heroBadgeText: {
    color: colors.onBrandPrimary,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: colors.onSurfaceInverse,
    fontSize: 28,
    fontWeight: "800",
  },
  heroSubtitle: { color: colors.onSurfaceInverse, fontSize: 14, opacity: 0.9 },
  form: {
    padding: spacing.xl,
    gap: spacing.lg,
    marginTop: -spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  formTitle: { fontSize: 22, fontWeight: "800", color: colors.onSurface },
  error: { color: colors.error, fontSize: 13, fontWeight: "600" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  switchLink: { alignItems: "center", paddingVertical: spacing.sm },
  switchText: { color: colors.brandPrimary, fontWeight: "600", fontSize: 14 },
}));

export default function SignIn() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { login, register, loginWithGoogle } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password || (isRegister && !name.trim())) {
      setError(t("fillAllFields"));
      return;
    }
    setBusy(true);
    try {
      if (isRegister) await register(email, password, name);
      else await login(email, password);
    } catch (e) {
      setError((e as Error).message || t("authFailed"));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      notify(t("authFailed"), (e as Error).message);
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView
        bottomOffset={spacing.xl}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: HERO }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={["transparent", "rgba(28,28,30,0.35)", colors.surfaceInverse]}
            style={styles.heroGradient}
          />
          <View style={[styles.heroContent, { paddingTop: insets.top }]}>
            <View style={styles.heroBadge}>
              <Ionicons name="school" size={14} color={colors.onBrandPrimary} />
              <Text style={styles.heroBadgeText}>HSU</Text>
            </View>
            <Text style={styles.heroTitle}>{t("appName")}</Text>
            <Text style={styles.heroSubtitle}>{t("loginSubtitle")}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {isRegister ? t("registerTitle") : t("loginTitle")}
          </Text>

          {isRegister ? (
            <Field
              testID={REGISTER.nameInput}
              label={t("name")}
              value={name}
              onChangeText={setName}
              placeholder="Max Mustermann"
              autoCapitalize="words"
            />
          ) : null}

          <Field
            testID={isRegister ? REGISTER.emailInput : LOGIN.emailInput}
            label={t("email")}
            value={email}
            onChangeText={setEmail}
            placeholder="vorname.nachname@hsu-hh.de"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            inputMode="email"
          />

          <Field
            testID={isRegister ? REGISTER.passwordInput : LOGIN.passwordInput}
            label={t("password")}
            value={password}
            onChangeText={setPassword}
            placeholder={t("passwordHint")}
            secureTextEntry
            autoCapitalize="none"
            onSubmitEditing={submit}
            returnKeyType="go"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton
            testID={isRegister ? REGISTER.submitButton : LOGIN.submitButton}
            label={isRegister ? t("register") : t("login")}
            onPress={submit}
            loading={busy}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t("or")}</Text>
            <View style={styles.dividerLine} />
          </View>

          <AppButton
            testID="login-google-button"
            label={t("googleLogin")}
            onPress={google}
            variant="secondary"
            icon="logo-google"
            loading={googleBusy}
          />

          <TouchableOpacity
            testID={isRegister ? REGISTER.loginLink : LOGIN.registerLink}
            style={styles.switchLink}
            onPress={() => {
              setError(null);
              setIsRegister((value) => !value);
            }}
          >
            <Text style={styles.switchText}>
              {isRegister ? t("haveAccount") : t("noAccount")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
