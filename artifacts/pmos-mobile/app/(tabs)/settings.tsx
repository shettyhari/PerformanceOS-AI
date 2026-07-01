import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useGetMe } from "@workspace/api-client-react";
import { useAuth, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

function SettingRow({
  icon,
  label,
  value,
  colors,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  colors: ReturnType<typeof useColors>;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        rowStyles.row,
        { borderBottomColor: colors.border, opacity: pressed && onPress ? 0.7 : 1 },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[rowStyles.iconBox, { backgroundColor: danger ? colors.destructive + "22" : colors.secondary }]}>
        <Feather name={icon as any} size={16} color={danger ? colors.destructive : colors.mutedForeground} />
      </View>
      <Text style={[rowStyles.label, { color: danger ? colors.destructive : colors.foreground }]}>
        {label}
      </Text>
      <Text style={[rowStyles.value, { color: colors.mutedForeground }]} numberOfLines={1}>
        {value}
      </Text>
      {onPress && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  value: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxWidth: 120,
  },
});

function AvatarCircle({ initials, colors }: { initials: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[avatarStyles.circle, { backgroundColor: colors.primary }]}>
      <Text style={avatarStyles.text}>{initials}</Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
});

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 120 : insets.bottom + 90;

  const { signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const { data: me, isLoading } = useGetMe();

  const meData = me as any;
  const fullName =
    clerkUser?.fullName ||
    (meData?.firstName && meData?.lastName ? `${meData.firstName} ${meData.lastName}` : null) ||
    meData?.name ||
    null;
  const email = clerkUser?.primaryEmailAddress?.emailAddress || meData?.email || "";
  const orgName = meData?.org?.name || meData?.organization?.name || "Your Organization";
  const initials = getInitials(fullName, email);

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await signOut();
          router.replace("/sign-in");
        },
      },
    ]);
  };

  const s = styles(colors);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad }}
    >
      <Text style={[s.pageTitle, { paddingHorizontal: 20 }]}>Settings</Text>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <View style={[s.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AvatarCircle initials={initials} colors={colors} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[s.name, { color: colors.foreground }]} numberOfLines={1}>
              {fullName || "User"}
            </Text>
            <Text style={[s.email, { color: colors.mutedForeground }]} numberOfLines={1}>
              {email}
            </Text>
            <View style={[s.orgBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[s.orgText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {orgName}
              </Text>
            </View>
          </View>
        </View>
      )}

      <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Account</Text>
      <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="user" label="Full Name" value={fullName || "—"} colors={colors} />
        <SettingRow icon="mail" label="Email" value={email || "—"} colors={colors} />
        <SettingRow icon="briefcase" label="Organization" value={orgName} colors={colors} />
      </View>

      <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Integrations</Text>
      <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="link" label="Windsor.ai" value="Connected" colors={colors} />
        <SettingRow icon="refresh-cw" label="Last Sync" value={meData?.lastSync ? "Recent" : "Never"} colors={colors} />
      </View>

      <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>About</Text>
      <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="info" label="Version" value="1.0.0" colors={colors} />
        <SettingRow icon="shield" label="Privacy Policy" colors={colors} onPress={() => {}} />
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Pressable
          style={({ pressed }) => [
            s.signOutBtn,
            { borderColor: colors.destructive + "44", opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleSignOut}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[s.signOutText, { color: colors.destructive }]}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pageTitle: {
      color: colors.foreground,
      fontSize: 24,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
      marginBottom: 20,
    },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginHorizontal: 20,
      marginBottom: 24,
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
    },
    name: {
      fontSize: 17,
      fontFamily: "Inter_700Bold",
    },
    email: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    orgBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      marginTop: 2,
    },
    orgText: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
    },
    sectionLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      paddingHorizontal: 20,
      marginBottom: 8,
      marginTop: 4,
    },
    section: {
      marginHorizontal: 20,
      borderRadius: 14,
      borderWidth: 1,
      overflow: "hidden",
      marginBottom: 20,
    },
    signOutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    signOutText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
    },
    center: {
      alignItems: "center",
      paddingVertical: 20,
    },
  });
}
