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
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const CONNECTORS = [
  { name: "Google Ads", icon: "trending-up", color: "#4285F4", connected: true },
  { name: "Meta Ads", icon: "share-2", color: "#0866FF", connected: true },
  { name: "LinkedIn Ads", icon: "linkedin", color: "#0A66C2", connected: true },
  { name: "Microsoft Ads", icon: "monitor", color: "#00A1F1", connected: false },
  { name: "TikTok Ads", icon: "video", color: "#010101", connected: false },
  { name: "Snapchat Ads", icon: "camera", color: "#FFFC00", connected: false },
  { name: "Pinterest Ads", icon: "image", color: "#E60023", connected: false },
];

export default function IntegrationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: connection, isLoading } = useGetWindsorConnection();
  const conn = connection as any;
  const isConnected = conn?.connected;
  const apiKey = conn?.apiKey;
  const lastSync = conn?.lastSync;

  const s = styles(colors);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.title}>Integrations</Text>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: botPad + 24, paddingTop: 16 }}>
          <Text style={s.sectionTitle}>Windsor.ai Connection</Text>
          <View style={[s.windsorCard, { backgroundColor: colors.card, borderColor: isConnected ? colors.success + "44" : colors.border }]}>
            <View style={s.windsorTop}>
              <View style={[s.windsorIcon, { backgroundColor: isConnected ? colors.success + "22" : colors.secondary }]}>
                <Feather name="link" size={18} color={isConnected ? colors.success : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.windsorTitle, { color: colors.foreground }]}>Windsor.ai</Text>
                <Text style={[s.windsorSubtitle, { color: colors.mutedForeground }]}>Multi-channel marketing data aggregation</Text>
              </View>
              <View style={[s.statusPill, { backgroundColor: isConnected ? colors.success + "22" : colors.secondary }]}>
                <View style={[s.statusDot, { backgroundColor: isConnected ? colors.success : colors.mutedForeground }]} />
                <Text style={[s.statusText, { color: isConnected ? colors.success : colors.mutedForeground }]}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Text>
              </View>
            </View>

            {isConnected && (
              <View style={[s.windsorMeta, { borderTopColor: colors.border }]}>
                {apiKey && (
                  <View style={s.metaRow}>
                    <Text style={[s.metaLabel, { color: colors.mutedForeground }]}>API Key</Text>
                    <Text style={[s.metaValue, { color: colors.foreground }]}>{"•".repeat(8)}{String(apiKey).slice(-4)}</Text>
                  </View>
                )}
                {lastSync && (
                  <View style={s.metaRow}>
                    <Text style={[s.metaLabel, { color: colors.mutedForeground }]}>Last Sync</Text>
                    <Text style={[s.metaValue, { color: colors.foreground }]}>
                      {new Date(lastSync).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <Text style={[s.sectionTitle, { marginTop: 20 }]}>Data Sources</Text>
          <View style={[s.connectorsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {CONNECTORS.map((c, idx) => (
              <View key={c.name} style={[s.connectorRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[s.connectorIcon, { backgroundColor: c.color + "22" }]}>
                  <Feather name={c.icon as any} size={16} color={c.color} />
                </View>
                <Text style={[s.connectorName, { color: colors.foreground }]}>{c.name}</Text>
                <View style={[s.connectorStatus, { backgroundColor: c.connected ? colors.success + "22" : colors.secondary }]}>
                  <View style={[s.statusDot, { backgroundColor: c.connected ? colors.success : colors.mutedForeground }]} />
                  <Text style={[s.connectorStatusText, { color: c.connected ? colors.success : colors.mutedForeground }]}>
                    {c.connected ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {!isConnected && (
            <View style={[s.setupCard, { backgroundColor: colors.primary + "11", borderColor: colors.primary + "33" }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[s.setupText, { color: colors.mutedForeground }]}>
                To configure your Windsor.ai connection, visit the web dashboard at your Replit URL and complete the setup wizard.
              </Text>
            </View>
          )}
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
    windsorCard: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
    windsorTop: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
    windsorIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    windsorTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    windsorSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
    statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontFamily: "Inter_500Medium" },
    windsorMeta: { borderTopWidth: 1, padding: 14, gap: 8 },
    metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    metaLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
    metaValue: { fontSize: 12, fontFamily: "Inter_500Medium" },
    connectorsList: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
    connectorRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
    connectorIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    connectorName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
    connectorStatus: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    connectorStatusText: { fontSize: 11, fontFamily: "Inter_500Medium" },
    setupCard: {
      flexDirection: "row", alignItems: "flex-start", gap: 10,
      marginHorizontal: 20, marginTop: 20, padding: 14, borderRadius: 12, borderWidth: 1,
    },
    setupText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  });
}
