import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Redirect, Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import React from "react";
import { ActivityIndicator, Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const colors = useColors();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return <>{children}</>;
}

function NativeTabLayout() {
  return (
    <AuthGuard>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
          <Label>Dashboard</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="campaigns">
          <Icon sf={{ default: "megaphone", selected: "megaphone.fill" }} />
          <Label>Campaigns</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="athena">
          <Icon sf={{ default: "sparkles", selected: "sparkles" }} />
          <Label>Athena</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="alerts">
          <Icon sf={{ default: "bell", selected: "bell.fill" }} />
          <Label>Alerts</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
          <Label>Settings</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </AuthGuard>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 0,
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={90}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) =>
              isIOS ? (
                <SymbolView name="chart.bar.fill" tintColor={color} size={size} />
              ) : (
                <Feather name="bar-chart-2" size={size} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="campaigns"
          options={{
            title: "Campaigns",
            tabBarIcon: ({ color, size }) =>
              isIOS ? (
                <SymbolView name="megaphone.fill" tintColor={color} size={size} />
              ) : (
                <Feather name="radio" size={size} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="athena"
          options={{
            title: "Athena",
            tabBarIcon: ({ color, size }) =>
              isIOS ? (
                <SymbolView name="sparkles" tintColor={color} size={size} />
              ) : (
                <Ionicons name="sparkles-outline" size={size} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: "Alerts",
            tabBarIcon: ({ color, size }) =>
              isIOS ? (
                <SymbolView name="bell.fill" tintColor={color} size={size} />
              ) : (
                <Feather name="bell" size={size} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) =>
              isIOS ? (
                <SymbolView name="gearshape.fill" tintColor={color} size={size} />
              ) : (
                <Feather name="settings" size={size} color={color} />
              ),
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
