import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Platform,
} from "react-native";
import { useGetAnalyticsData } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const PLATFORM_COLORS: Record<string, string> = {
  google: "#4285F4",
  meta: "#0866FF",
  linkedin: "#0A66C2",
  microsoft: "#00A1F1",
};

function MetricCard({ label, value, color, colors }: { label: string; value: string; color: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[mcStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[mcStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[mcStyles.value, { color }]}>{value}</Text>
    </View>
  );
}
const mcStyles = StyleSheet.create({
  card: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  label: { fontSize: 11, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.5 },
  value: { fontSize: 22, fontFamily: "Inter_700Bold" },
});

function PlatformBar({ platform, roas, maxRoas, spend, revenue, colors }: {
  platform: string; roas: number; maxRoas: number; spend: number; revenue: number; colors: ReturnType<typeof useColors>;
}) {
  const key = platform.toLowerCase().replace("_ads", "").replace("_", "");
  const matchKey = Object.keys(PLATFORM_COLORS).find((k) => platform.toLowerCase().includes(k)) ?? "google";
  const color = PLATFORM_COLORS[matchKey] ?? colors.primary;
  const pct = maxRoas > 0 ? Math.min((roas / maxRoas) * 100, 100) : 0;

  return (
    <View style={[pbStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[pbStyles.name, { color: colors.foreground }]} numberOfLines={1}>
        {platform.replace("_ADS", "").replace("_", " ")}
      </Text>
      <View style={pbStyles.barContainer}>
        <View style={[pbStyles.barTrack, { backgroundColor: colors.secondary }]}>
          <View style={[pbStyles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
        </View>
        <Text style={[pbStyles.roas, { color }]}>{roas.toFixed(2)}x</Text>
      </View>
      <Text style={[pbStyles.spend, { color: colors.mutedForeground }]}>
        ${(spend / 1000).toFixed(1)}K / ${(revenue / 1000).toFixed(1)}K
      </Text>
    </View>
  );
}
const pbStyles = StyleSheet.create({
  row: { paddingVertical: 12, borderBottomWidth: 1, gap: 6 },
  name: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  barContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  roas: { fontSize: 13, fontFamily: "Inter_700Bold", minWidth: 42 },
  spend: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data, isLoading, isError, refetch, isFetching } = useGetAnalyticsData();

  const d = data as any;
  const timeSeries: any[] = d?.timeSeries ?? [];
  const campaigns: any[] = d?.campaigns ?? [];
  const platformsSummary: any[] = d?.platformsSummary ?? [];

  const totalSpend = platformsSummary.reduce((s, p) => s + (p.spend ?? 0), 0);
  const totalRevenue = platformsSummary.reduce((s, p) => s + (p.revenue ?? 0), 0);
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const maxRoas = Math.max(...platformsSummary.map((p) => p.roas ?? 0), 1);

  const fmt = (v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(1)}K` : `$${v.toFixed(0)}`;

  const s = styles(colors);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.title}>Analytics</Text>
      </View>

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {isError && !isLoading && (
        <View style={s.center}>
          <Feather name="alert-circle" size={40} color={colors.destructive} />
          <Text style={[s.errorText, { color: colors.destructive }]}>Failed to load analytics</Text>
          <Pressable style={[s.retryBtn, { borderColor: colors.border }]} onPress={() => refetch()}>
            <Text style={[s.retryText, { color: colors.foreground }]}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: botPad + 24, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        >
          <View style={[s.metricRow, { paddingHorizontal: 20 }]}>
            <MetricCard label="Total Spend" value={fmt(totalSpend)} color={colors.primary} colors={colors} />
            <MetricCard label="Revenue" value={fmt(totalRevenue)} color={colors.success} colors={colors} />
            <MetricCard label="Blended ROAS" value={`${blendedRoas.toFixed(2)}x`} color={colors.warning} colors={colors} />
          </View>

          {platformsSummary.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Platform ROAS Comparison</Text>
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {platformsSummary.map((p, idx) => (
                  <PlatformBar
                    key={idx}
                    platform={p.platform ?? "Unknown"}
                    roas={p.roas ?? 0}
                    maxRoas={maxRoas}
                    spend={p.spend ?? 0}
                    revenue={p.revenue ?? 0}
                    colors={colors}
                  />
                ))}
              </View>
            </>
          )}

          {timeSeries.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Spend Trend (30 Days)</Text>
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.sparklineContainer}>
                  {timeSeries.slice(-14).map((pt, idx) => {
                    const maxSpend = Math.max(...timeSeries.map((t) => t.spend ?? 0), 1);
                    const h = Math.max(((pt.spend ?? 0) / maxSpend) * 60, 4);
                    return (
                      <View key={idx} style={[s.sparkBar, { height: h, backgroundColor: colors.primary + "80" }]} />
                    );
                  })}
                </View>
                <Text style={[s.sparkLabel, { color: colors.mutedForeground }]}>Last 14 days spend</Text>
              </View>
            </>
          )}

          {campaigns.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Campaign Performance ({campaigns.length})</Text>
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {campaigns.slice(0, 10).map((c, idx) => {
                  const roas = c.roas ?? 0;
                  const roasColor = roas >= 4 ? colors.success : roas >= 2 ? colors.warning : colors.destructive;
                  return (
                    <View key={idx} style={[s.campRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.campName, { color: colors.foreground }]} numberOfLines={1}>
                          {c.campaignName || c.campaign_name || "Campaign"}
                        </Text>
                        <Text style={[s.campPlatform, { color: colors.mutedForeground }]}>
                          {c.platform} · ${((c.spend ?? 0) / 1000).toFixed(1)}K spend
                        </Text>
                      </View>
                      <Text style={[s.campRoas, { color: roasColor }]}>{roas.toFixed(2)}x</Text>
                    </View>
                  );
                })}
              </View>
            </>
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
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { padding: 4 },
    title: { color: colors.foreground, fontSize: 20, fontFamily: "Inter_700Bold" },
    sectionTitle: {
      color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.8, textTransform: "uppercase", paddingHorizontal: 20, marginBottom: 10, marginTop: 20,
    },
    metricRow: { flexDirection: "row", gap: 10 },
    card: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, padding: 14 },
    campRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
    campName: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 2 },
    campPlatform: { fontSize: 11, fontFamily: "Inter_400Regular" },
    campRoas: { fontSize: 15, fontFamily: "Inter_700Bold" },
    sparklineContainer: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 64, marginBottom: 8 },
    sparkBar: { flex: 1, borderRadius: 2 },
    sparkLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    errorText: { fontSize: 14, fontFamily: "Inter_500Medium" },
    retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    retryText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  });
}
