import React, { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authApi } from "@/src/api";
import { saveScheme } from "@/src/appearance";
import { useAuth } from "@/src/auth";
import { ListGroup, ListRow } from "@/src/components/row";
import { AppButton, Card, Field, ScreenHeader, SectionTitle } from "@/src/components/ui";
import { Language, useI18n } from "@/src/i18n";
import { getPreferredScheme, SchemePreference, useTheme } from "@/src/theme";
import { notify } from "@/src/utils/confirm";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.xl },
  hint: { fontSize: 13, color: colors.muted },
  formCard: { gap: spacing.lg },
}));

export default function Settings() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { t, lang, setLang } = useI18n();
  const { user, setUser } = useAuth();
  useTheme(); // re-render this screen when the scheme preference changes
  const preference = getPreferredScheme();

  const [name, setName] = useState(user?.name ?? "");
  const [program, setProgram] = useState(user?.study_program ?? "");
  const [saving, setSaving] = useState(false);

  const changeLanguage = async (next: Language) => {
    setLang(next);
    try {
      const updated = await authApi.updateMe({ language: next });
      setUser(updated);
    } catch {
      // Sprache bleibt lokal gesetzt, auch wenn das Backend nicht erreichbar ist.
    }
  };

  const changeScheme = (next: SchemePreference) => {
    saveScheme(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await authApi.updateMe({
        name: name.trim() || user?.name,
        study_program: program.trim(),
      });
      setUser(updated);
      notify(t("save"), t("editProfile"));
    } catch (error) {
      notify(t("errorTitle"), (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <ScreenHeader title={t("settings")} />
      <KeyboardAwareScrollView
        bottomOffset={spacing.xl}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <SectionTitle>{t("language")}</SectionTitle>
          <ListGroup>
            <ListRow
              testID="settings-language-de"
              icon={lang === "de" ? "checkmark-circle" : "ellipse-outline"}
              label={t("german")}
              onPress={() => changeLanguage("de")}
            />
            <ListRow
              testID="settings-language-en"
              icon={lang === "en" ? "checkmark-circle" : "ellipse-outline"}
              label={t("english")}
              onPress={() => changeLanguage("en")}
            />
          </ListGroup>
        </View>

        <View>
          <SectionTitle>{t("appearance")}</SectionTitle>
          <ListGroup>
            <ListRow
              testID="settings-theme-system"
              icon={preference === null ? "checkmark-circle" : "ellipse-outline"}
              label={t("systemTheme")}
              onPress={() => changeScheme(null)}
            />
            <ListRow
              testID="settings-theme-light"
              icon={preference === "light" ? "checkmark-circle" : "ellipse-outline"}
              label={t("lightTheme")}
              onPress={() => changeScheme("light")}
            />
            <ListRow
              testID="settings-theme-dark"
              icon={preference === "dark" ? "checkmark-circle" : "ellipse-outline"}
              label={t("darkTheme")}
              onPress={() => changeScheme("dark")}
            />
          </ListGroup>
        </View>

        <View>
          <SectionTitle>{t("editProfile")}</SectionTitle>
          <Card style={styles.formCard}>
            <Field
              testID="settings-name-input"
              label={t("name")}
              value={name}
              onChangeText={setName}
              placeholder={t("name")}
            />
            <Field
              testID="settings-program-input"
              label={t("studyProgram")}
              value={program}
              onChangeText={setProgram}
              placeholder="Elektrotechnik (B.Sc.)"
            />
            <AppButton
              testID="settings-save-button"
              label={t("save")}
              onPress={save}
              loading={saving}
            />
          </Card>
        </View>

        <View>
          <SectionTitle>{t("account")}</SectionTitle>
          <ListGroup>
            <ListRow icon="mail-outline" label={t("email")} value={user?.email} />
            <ListRow
              icon="shield-checkmark-outline"
              label={t("login")}
              value={user?.provider === "google" ? "Google" : t("password")}
            />
          </ListGroup>
        </View>

        <Text style={styles.hint}>{t("aboutText")}</Text>
      </KeyboardAwareScrollView>
    </View>
  );
}
