import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function KpiCard({
  label,
  value,
  change,
  icon,
  colors,
}: {
  label: string;
  value: string;
  change?: string;
  icon: string;
  colors: ReturnType<typeof useColors>;
}) {
  const isPositive = change && !change.startsWith("-");
  return (
    <View style={[kpiStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[kpiStyles.iconBox, { backgroundColor: colors.secondary }]}>
        <Feather name={icon as any} size={16} color={colors.primary} />
      </View>
      <Text style={[kpiStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[kpiStyles.value, { color: colors.foreground }]}>{value}</Text>
      {change && (
        <Text style={[kpiStyles.change, { color: isPositive ? colors.success : colors.destructive }]}>
          {isPositive ? "↑" : "↓"} {change}
        </Text>
      )}
    </View>
  );
}

const kpiStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "46%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  change: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});

function formatCurrency(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

function formatNumber(val: number): string {
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return `${val}`;
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 120 : insets.bottom + 90;

  const { data, isLoading, isError, refetch, isFetching } = useGetDashboardSummary();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const summary = data as any;

  const s = styles(colors);

  return (
    <ScrollView
      style={[s.container]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad }}
      refreshControl={
        <RefreshControl refreshing={isFetching && !isLoading} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good day</Text>
          <Text style={s.title}>Dashboard</Text>
        </View>
        <View style={[s.badge, { backgroundColor: colors.primary + "22" }]}>
          <View style={[s.dot, { backgroundColor: colors.success }]} />
          <Text style={[s.badgeText, { color: colors.success }]}>Live</Text>
        </View>
      </View>

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Loading dashboard...</Text>
        </View>
      )}

      {isError && !isLoading && (
        <View style={s.center}>
          <Feather name="alert-circle" size={40} color={colors.destructive} />
          <Text style={[s.errorText, { color: colors.destructive }]}>Failed to load dashboard</Text>
        </View>
      )}

      {summary && !isLoading && (
        <>
          <Text style={s.sectionTitle}>Key Metrics</Text>
          <View style={s.kpiGrid}>
            <KpiCard
              label="Total Spend"
              value={formatCurrency(summary.totalSpend ?? 0)}
              change={summary.spendChange ? `${Math.abs(summary.spendChange).toFixed(1)}%` : undefined}
              icon="credit-card"
              colors={colors}
            />
            <KpiCard
              label="Revenue"
              value={formatCurrency(summary.totalRevenue ?? 0)}
              change={summary.revenueChange ? `${Math.abs(summary.revenueChange).toFixed(1)}%` : undefined}
              icon="trending-up"
              colors={colors}
            />
            <KpiCard
              label="ROAS"
              value={(summary.averageRoas ?? 0).toFixed(2) + "x"}
              icon="zap"
              colors={colors}
            />
            <KpiCard
              label="Conversions"
              value={formatNumber(summary.totalConversions ?? 0)}
              icon="check-circle"
              colors={colors}
            />
          </View>

          {summary.needsAttention && summary.needsAttention.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Needs Attention</Text>
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {(summary.needsAttention as any[]).slice(0, 4).map((item: any, idx: number) => (
                  <View key={idx} style={[s.listItem, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <View style={[s.dot2, { backgroundColor: colors.destructive }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.listItemTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {item.campaign || item.metric || "Campaign"}
                      </Text>
                      <Text style={[s.listItemSub, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {item.issue || item.message || "Review performance"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {summary.opportunities && summary.opportunities.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Opportunities</Text>
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {(summary.opportunities as any[]).slice(0, 4).map((item: any, idx: number) => (
                  <View key={idx} style={[s.listItem, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <View style={[s.dot2, { backgroundColor: colors.success }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.listItemTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {item.campaign || item.metric || "Campaign"}
                      </Text>
                      <Text style={[s.listItemSub, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {item.opportunity || item.message || "Scale this campaign"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {summary.aiRecommendations && summary.aiRecommendations.length > 0 && (
            <>
              <Text style={s.sectionTitle}>AI Recommendations</Text>
              {(summary.aiRecommendations as any[]).slice(0, 3).map((rec: any, idx: number) => (
                <View key={idx} style={[s.recCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[s.recIconBox, { backgroundColor: colors.primary + "22" }]}>
                    <Ionicons name="sparkles" size={14} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.recTitle, { color: colors.foreground }]}>
                      {rec.title || rec.recommendation || "Recommendation"}
                    </Text>
                    {rec.description && (
                      <Text style={[s.recDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {rec.description}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    greeting: {
      color: colors.mutedForeground,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    title: {
      color: colors.foreground,
      fontSize: 24,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    badgeText: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    sectionTitle: {
      color: colors.mutedForeground,
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      paddingHorizontal: 20,
      marginBottom: 10,
      marginTop: 20,
    },
    kpiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      paddingHorizontal: 20,
    },
    card: {
      marginHorizontal: 20,
      borderRadius: 14,
      borderWidth: 1,
      overflow: "hidden",
    },
    listItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      padding: 14,
    },
    dot2: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 4,
      flexShrink: 0,
    },
    listItemTitle: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      marginBottom: 2,
    },
    listItemSub: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      lineHeight: 17,
    },
    recCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginHorizontal: 20,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 1,
      padding: 14,
    },
    recIconBox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    recTitle: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      marginBottom: 3,
    },
    recDesc: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      lineHeight: 17,
    },
    center: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    errorText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
  });
}
