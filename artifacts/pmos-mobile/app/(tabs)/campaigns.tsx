import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useGetAnalyticsData } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const PLATFORMS = ["All", "Google", "Meta", "LinkedIn", "Microsoft"] as const;
type Platform_ = (typeof PLATFORMS)[number];

const PLATFORM_COLORS: Record<string, string> = {
  google: "#4285F4",
  meta: "#0866FF",
  linkedin: "#0A66C2",
  microsoft: "#00A1F1",
};

function PlatformBadge({ platform, colors }: { platform: string; colors: ReturnType<typeof useColors> }) {
  const key = platform.toLowerCase();
  const color = PLATFORM_COLORS[key] ?? colors.mutedForeground;
  return (
    <View style={[badgeStyles.badge, { backgroundColor: color + "22", borderColor: color + "44" }]}>
      <Text style={[badgeStyles.text, { color }]}>{platform}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  text: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

function CampaignRow({ item, colors }: { item: any; colors: ReturnType<typeof useColors> }) {
  const roas = item.roas ?? 0;
  const roasColor = roas >= 4 ? colors.success : roas >= 2 ? colors.warning : colors.destructive;
  return (
    <View style={[rowStyles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={rowStyles.top}>
        <Text style={[rowStyles.name, { color: colors.foreground }]} numberOfLines={1}>
          {item.campaignName || item.campaign_name || "Campaign"}
        </Text>
        <PlatformBadge platform={item.platform || "Unknown"} colors={colors} />
      </View>
      <View style={rowStyles.metrics}>
        <View style={rowStyles.metric}>
          <Text style={[rowStyles.metricLabel, { color: colors.mutedForeground }]}>Spend</Text>
          <Text style={[rowStyles.metricValue, { color: colors.foreground }]}>
            ${((item.spend ?? 0) / 1000).toFixed(1)}K
          </Text>
        </View>
        <View style={rowStyles.metric}>
          <Text style={[rowStyles.metricLabel, { color: colors.mutedForeground }]}>Revenue</Text>
          <Text style={[rowStyles.metricValue, { color: colors.foreground }]}>
            ${((item.revenue ?? 0) / 1000).toFixed(1)}K
          </Text>
        </View>
        <View style={rowStyles.metric}>
          <Text style={[rowStyles.metricLabel, { color: colors.mutedForeground }]}>ROAS</Text>
          <Text style={[rowStyles.metricValue, { color: roasColor }]}>{roas.toFixed(2)}x</Text>
        </View>
        <View style={rowStyles.metric}>
          <Text style={[rowStyles.metricLabel, { color: colors.mutedForeground }]}>Conv.</Text>
          <Text style={[rowStyles.metricValue, { color: colors.foreground }]}>
            {item.conversions ?? 0}
          </Text>
        </View>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metric: {
    alignItems: "center",
    gap: 3,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});

export default function CampaignsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 120 : insets.bottom + 90;

  const [selectedPlatform, setSelectedPlatform] = useState<Platform_>("All");

  const { data, isLoading, isError, refetch, isFetching } = useGetAnalyticsData();

  const campaigns = useMemo(() => {
    const raw = (data as any)?.campaigns ?? [];
    if (selectedPlatform === "All") return raw;
    return raw.filter(
      (c: any) => c.platform?.toLowerCase() === selectedPlatform.toLowerCase()
    );
  }, [data, selectedPlatform]);

  const s = styles(colors);

  return (
    <View style={[s.container]}>
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <Text style={s.title}>Campaigns</Text>
        <Text style={[s.count, { color: colors.mutedForeground }]}>
          {campaigns.length} campaigns
        </Text>
      </View>

      <View style={s.filters}>
        <FlatList
          horizontal
          data={PLATFORMS}
          keyExtractor={(p) => p}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => {
            const active = item === selectedPlatform;
            return (
              <Pressable
                style={[
                  s.filterChip,
                  { borderColor: active ? colors.primary : colors.border },
                  active && { backgroundColor: colors.primary + "22" },
                ]}
                onPress={() => setSelectedPlatform(item)}
              >
                <Text
                  style={[
                    s.filterText,
                    { color: active ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {isError && !isLoading && (
        <View style={s.center}>
          <Feather name="alert-circle" size={40} color={colors.destructive} />
          <Text style={[s.errorText, { color: colors.destructive }]}>Failed to load campaigns</Text>
          <Pressable style={[s.retryButton, { borderColor: colors.border }]} onPress={() => refetch()}>
            <Text style={[s.retryText, { color: colors.foreground }]}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={campaigns}
          keyExtractor={(item, idx) => item.id ?? item.campaignName ?? idx.toString()}
          renderItem={({ item }) => <CampaignRow item={item} colors={colors} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: botPad }}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Feather name="radio" size={40} color={colors.mutedForeground} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No campaigns found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    title: {
      color: colors.foreground,
      fontSize: 24,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
    },
    count: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    filters: {
      marginBottom: 4,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    errorText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
    },
    retryText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
  });
}
