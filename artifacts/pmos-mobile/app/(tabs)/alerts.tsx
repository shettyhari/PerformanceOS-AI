import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import {
  useGetAlerts,
  useResolveAlert,
  getGetAlertsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

type AlertItem = {
  id: string;
  severity: string;
  message: string;
  campaignName?: string;
  campaign_name?: string;
  metric?: string;
  value?: number;
  threshold?: number;
  status?: string;
  createdAt?: string;
};

function AlertCard({
  item,
  onResolve,
  colors,
}: {
  item: AlertItem;
  onResolve: (id: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const isCritical = item.severity?.toUpperCase() === "CRITICAL";
  const isResolved = item.status === "resolved";
  const severityColor = isCritical ? colors.destructive : colors.warning;

  return (
    <View
      style={[
        cardStyles.card,
        {
          backgroundColor: colors.card,
          borderColor: isResolved ? colors.border : severityColor + "44",
          borderLeftWidth: 3,
          borderLeftColor: isResolved ? colors.border : severityColor,
        },
      ]}
    >
      <View style={cardStyles.top}>
        <View style={[cardStyles.badge, { backgroundColor: severityColor + "22", borderColor: severityColor + "44" }]}>
          <Text style={[cardStyles.badgeText, { color: severityColor }]}>
            {item.severity?.toUpperCase() ?? "ALERT"}
          </Text>
        </View>
        {isResolved && (
          <View style={[cardStyles.badge, { backgroundColor: colors.success + "22", borderColor: colors.success + "44" }]}>
            <Text style={[cardStyles.badgeText, { color: colors.success }]}>RESOLVED</Text>
          </View>
        )}
      </View>
      {(item.campaignName || item.campaign_name) && (
        <Text style={[cardStyles.campaign, { color: colors.foreground }]} numberOfLines={1}>
          {item.campaignName || item.campaign_name}
        </Text>
      )}
      <Text style={[cardStyles.message, { color: colors.mutedForeground }]} numberOfLines={3}>
        {item.message}
      </Text>
      {!isResolved && (
        <Pressable
          style={({ pressed }) => [
            cardStyles.resolveBtn,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => onResolve(item.id)}
        >
          <Feather name="check" size={14} color={colors.success} />
          <Text style={[cardStyles.resolveBtnText, { color: colors.foreground }]}>Resolve</Text>
        </Pressable>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
  },
  campaign: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  message: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  resolveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  resolveBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 120 : insets.bottom + 90;
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useGetAlerts();

  const resolveMutation = useResolveAlert({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAlertsQueryKey() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
  });

  const handleResolve = useCallback(
    (id: string) => {
      Alert.alert("Resolve Alert", "Mark this alert as resolved?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          onPress: () => resolveMutation.mutate({ id }),
        },
      ]);
    },
    [resolveMutation]
  );

  const alerts = (data as any) ?? [];
  const unresolvedCount = alerts.filter((a: any) => a.status !== "resolved").length;

  const s = styles(colors);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <View style={s.headerRow}>
          <Text style={s.title}>Alerts</Text>
          {unresolvedCount > 0 && (
            <View style={[s.countBadge, { backgroundColor: colors.destructive }]}>
              <Text style={s.countText}>{unresolvedCount}</Text>
            </View>
          )}
        </View>
        <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
          AI-generated performance alerts
        </Text>
      </View>

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {isError && !isLoading && (
        <View style={s.center}>
          <Feather name="alert-circle" size={40} color={colors.destructive} />
          <Text style={[s.errorText, { color: colors.destructive }]}>Failed to load alerts</Text>
          <Pressable style={[s.retryBtn, { borderColor: colors.border }]} onPress={() => refetch()}>
            <Text style={[s.retryText, { color: colors.foreground }]}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertCard item={item} onResolve={handleResolve} colors={colors} />
          )}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: botPad }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Feather name="check-circle" size={40} color={colors.success} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>All clear</Text>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No alerts at the moment</Text>
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
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    title: {
      color: colors.foreground,
      fontSize: 24,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
    },
    countBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    countText: {
      color: "#fff",
      fontSize: 12,
      fontFamily: "Inter_700Bold",
    },
    subtitle: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingVertical: 60,
    },
    errorText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    emptyText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    retryBtn: {
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
