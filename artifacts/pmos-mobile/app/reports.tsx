import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useGetWindsorConnection } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const REPORT_SCHEDULES = [
  { title: "Weekly Executive Summary", format: "PDF", schedule: "Every Monday 8:00 AM", channels: ["Email", "Slack"] },
  { title: "Consolidated ROAS Audit", format: "Excel", schedule: "Monthly (1st Day)", channels: ["Email"] },
  { title: "Daily Spend Alerts", format: "PDF", schedule: "Daily 9:00 PM", channels: ["Telegram"] },
];

const REPORT_TEMPLATES = [
  { name: "Campaign Performance Report", desc: "Complete cross-channel campaign metrics with ROAS, CPA, CTR breakdowns", format: "PDF" },
  { name: "Executive Spend Summary", desc: "High-level budget allocation and ROI summary for stakeholder review", format: "PDF" },
  { name: "Platform Comparison Matrix", desc: "Side-by-side comparison of Google, Meta, LinkedIn, and Microsoft metrics", format: "Excel" },
  { name: "Attribution Analysis Report", desc: "Multi-touch attribution breakdown across all tracked conversion events", format: "PDF" },
];

const CHANNEL_COLORS: Record<string, string> = {
  Email: "#a855f7",
  Slack: "#4A154B",
  Telegram: "#0088cc",
};

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: connection, isLoading } = useGetWindsorConnection();
  const [exported, setExported] = useState<string | null>(null);

  const handleExport = (name: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExported(name);
    Alert.alert("Export started", `"${name}" export queued successfully.`);
    setTimeout(() => setExported(null), 2000);
  };

  const s = styles(colors);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.title}>Reports</Text>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: botPad + 24, paddingTop: 16 }}>
          <Text style={s.sectionTitle}>Active Schedules</Text>
          {REPORT_SCHEDULES.map((rep) => (
            <View key={rep.title} style={[s.schedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.schedTop}>
                <Text style={[s.schedFormat, { color: colors.mutedForeground }]}>{rep.format} Report</Text>
                <View style={[s.activeDot, { backgroundColor: colors.success }]} />
              </View>
              <Text style={[s.schedTitle, { color: colors.foreground }]}>{rep.title}</Text>
              <View style={s.schedMeta}>
                <Feather name="calendar" size={12} color={colors.mutedForeground} />
                <Text style={[s.schedTime, { color: colors.mutedForeground }]}>{rep.schedule}</Text>
              </View>
              <View style={s.channels}>
                <Text style={[s.channelLabel, { color: colors.mutedForeground }]}>Deliver via:</Text>
                {rep.channels.map((ch) => (
                  <View key={ch} style={[s.channelChip, { backgroundColor: (CHANNEL_COLORS[ch] ?? colors.primary) + "22" }]}>
                    <Text style={[s.channelText, { color: CHANNEL_COLORS[ch] ?? colors.primary }]}>{ch}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <Text style={[s.sectionTitle, { marginTop: 20 }]}>On-Demand Templates</Text>
          <View style={[s.templatesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {REPORT_TEMPLATES.map((t, idx) => (
              <View key={t.name} style={[s.templateRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[s.templateIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="file-text" size={14} color={colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.templateName, { color: colors.foreground }]} numberOfLines={1}>{t.name}</Text>
                  <Text style={[s.templateDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{t.desc}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    s.exportBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                    exported === t.name && { borderColor: colors.success + "44" },
                  ]}
                  onPress={() => handleExport(t.name)}
                >
                  <Feather
                    name={exported === t.name ? "check" : "download"}
                    size={13}
                    color={exported === t.name ? colors.success : colors.mutedForeground}
                  />
                  <Text style={[s.exportBtnText, { color: exported === t.name ? colors.success : colors.mutedForeground }]}>
                    {exported === t.name ? "Done" : t.format}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingHorizontal: 20, paddingBottom: 16,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { padding: 4 },
    title: { color: colors.foreground, fontSize: 20, fontFamily: "Inter_700Bold" },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    sectionTitle: {
      color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.8, textTransform: "uppercase", paddingHorizontal: 20, marginBottom: 10, marginTop: 4,
    },
    schedCard: {
      marginHorizontal: 20, marginBottom: 10, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6,
    },
    schedTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    schedFormat: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6 },
    activeDot: { width: 7, height: 7, borderRadius: 3.5 },
    schedTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    schedMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
    schedTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
    channels: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
    channelLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
    channelChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    channelText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    templatesCard: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
    templateRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
    templateIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    templateName: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 2 },
    templateDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
    exportBtn: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1,
    },
    exportBtnText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  });
}
