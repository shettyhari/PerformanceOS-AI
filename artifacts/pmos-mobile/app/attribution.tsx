import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
} from "react-native";
import { useGetWindsorConnection } from "@workspace/api-client-react";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const ATTRIBUTION_MODELS = [
  {
    name: "First Touch Model",
    desc: "Assigns 100% of conversion value to the first channel clicked.",
    icon: "flag",
  },
  {
    name: "Last Touch Model",
    desc: "Assigns 100% of conversion value to the final channel clicked.",
    icon: "check-circle",
  },
  {
    name: "Linear Model",
    desc: "Distributes credit equally across all touchpoints in the funnel.",
    icon: "minus",
  },
  {
    name: "Time Decay Model",
    desc: "Gives more weight to touchpoints closer in time to the conversion.",
    icon: "clock",
  },
];

const AI_INSIGHTS = [
  "Google Search campaigns are capturing the majority of last-touch credit — review first-touch data to assess true upper-funnel contribution.",
  "Meta Ads show strong mid-funnel influence under Linear Attribution — consider Time Decay for conversion-optimized campaigns.",
  "LinkedIn B2B touchpoints appear in 43% of enterprise lead paths — first-touch model undervalues LinkedIn by 2.1x vs. Linear.",
];

export default function AttributionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: connection, isLoading } = useGetWindsorConnection();
  const connected = (connection as any)?.connected;

  const s = styles(colors);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.title}>Attribution</Text>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: botPad + 24, paddingTop: 16 }}>
          {!connected && (
            <View style={[s.warningCard, { backgroundColor: colors.card, borderColor: colors.warning + "44" }]}>
              <Feather name="alert-triangle" size={16} color={colors.warning} />
              <Text style={[s.warningText, { color: colors.mutedForeground }]}>
                Connect Windsor.ai in Integrations to activate attribution models.
              </Text>
            </View>
          )}

          <View style={[s.engineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.engineIcon, { backgroundColor: colors.primary + "22" }]}>
              <Feather name="git-merge" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.engineTitle, { color: colors.foreground }]}>Attribution Engine</Text>
              <Text style={[s.engineSubtitle, { color: colors.mutedForeground }]}>
                {connected ? "Running against Windsor.ai aggregated pipelines" : "Connect Windsor.ai to activate"}
              </Text>
            </View>
            <View style={[s.statusDot, { backgroundColor: connected ? colors.success : colors.mutedForeground }]} />
          </View>

          <Text style={s.sectionTitle}>Attribution Models</Text>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {ATTRIBUTION_MODELS.map((model, idx) => (
              <View key={model.name} style={[s.modelRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[s.modelIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={model.icon as any} size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.modelName, { color: colors.foreground }]}>{model.name}</Text>
                  <Text style={[s.modelDesc, { color: colors.mutedForeground }]}>{model.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>AI Attribution Insights</Text>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.primary + "33" }]}>
            <View style={s.insightsHeader}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={[s.insightsLabel, { color: colors.primary }]}>AI Analysis</Text>
            </View>
            {AI_INSIGHTS.map((insight, idx) => (
              <View key={idx} style={[s.insightRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[s.insightNum, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[s.insightNumText, { color: colors.primary }]}>{idx + 1}</Text>
                </View>
                <Text style={[s.insightText, { color: colors.foreground }]}>{insight}</Text>
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
    sectionTitle: {
      color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.8, textTransform: "uppercase", paddingHorizontal: 20, marginBottom: 10, marginTop: 20,
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    warningCard: {
      flexDirection: "row", alignItems: "flex-start", gap: 10,
      marginHorizontal: 20, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16,
    },
    warningText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
    engineCard: {
      flexDirection: "row", alignItems: "center", gap: 12,
      marginHorizontal: 20, padding: 14, borderRadius: 14, borderWidth: 1,
    },
    engineIcon: {
      width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center",
    },
    engineTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    engineSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    card: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
    modelRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
    modelIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    modelName: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
    modelDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
    insightsHeader: { flexDirection: "row", alignItems: "center", gap: 6, padding: 14, paddingBottom: 10 },
    insightsLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
    insightNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    insightNumText: { fontSize: 11, fontFamily: "Inter_700Bold" },
    insightText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  });
}
