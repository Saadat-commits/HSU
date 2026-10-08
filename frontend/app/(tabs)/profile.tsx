import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { campusApi, GradesResponse } from "@/src/api";
import { useAuth } from "@/src/auth";
import { ListGroup, ListRow } from "@/src/components/row";
import { Card, ScreenHeader, SectionTitle } from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { makeStyles, radius, spacing } from "@/src/theme";
import { confirmAction } from "@/src/utils/confirm";
import { LOGOUT } from "@/constants/testIds";

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.xl },
  header: { alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontSize: 30, fontWeight: "800", color: colors.brandPrimary },
  name: { fontSize: 20, fontWeight: "800", color: colors.onSurface },
  email: { fontSize: 14, color: colors.muted },
  statsRow: { flexDirection: "row", gap: spacing.md },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.brandPrimary },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
}));

export default function Profile() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { user, logout } = useAuth();

  const grades = useQuery<GradesResponse>({
    queryKey: ["grades"],
    queryFn: campusApi.grades,
  });

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const confirmLogout = () => {
    confirmAction({
      title: t("logout"),
      message: t("logoutConfirm"),
      confirmLabel: t("logout"),
      cancelLabel: t("cancel"),
      onConfirm: () => logout(),
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <ScreenHeader title={t("profile")} showBack={false} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={styles.name} testID="profile-name">
            {user?.name}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.study_program ? (
            <Text style={styles.email}>{user.study_program}</Text>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {grades.data?.average != null ? grades.data.average.toFixed(2) : "–"}
            </Text>
            <Text style={styles.statLabel}>{t("gradeAverage")}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{grades.data?.total_ects ?? 0}</Text>
            <Text style={styles.statLabel}>{t("totalEcts")}</Text>
          </Card>
        </View>

        <View>
          <SectionTitle>{t("account")}</SectionTitle>
          <ListGroup>
            <ListRow
              testID="profile-settings-row"
              icon="settings-outline"
              label={t("settings")}
              onPress={() => router.push("/settings")}
            />
            <ListRow
              testID="profile-grades-row"
              icon="ribbon-outline"
              label={t("grades")}
              onPress={() => router.push("/grades")}
            />
            <ListRow
              testID="profile-exams-row"
              icon="school-outline"
              label={t("exams")}
              onPress={() => router.push("/exams")}
            />
            <ListRow
              testID="profile-flashcards-row"
              icon="albums-outline"
              label={t("flashcards")}
              onPress={() => router.push("/flashcards")}
            />
            <ListRow
              testID="profile-news-row"
              icon="newspaper-outline"
              label={t("news")}
              onPress={() => router.push("/news")}
            />
          </ListGroup>
        </View>

        <View>
          <SectionTitle>{t("about")}</SectionTitle>
          <Card>
            <Text style={styles.email}>{t("aboutText")}</Text>
          </Card>
        </View>

        <ListGroup>
          <ListRow
            testID={LOGOUT.button}
            icon="log-out-outline"
            label={t("logout")}
            destructive
            onPress={confirmLogout}
          />
        </ListGroup>
      </ScrollView>
    </View>
  );
}
