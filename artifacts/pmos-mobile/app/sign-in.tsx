import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  useColorScheme,
} from "react-native";
import { useSignIn, useSignUp, useOAuth } from "@clerk/expo";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const handleGoogleOAuth = async () => {
    setOauthLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/"),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      Alert.alert("Sign in failed", err?.message || "Could not sign in with Google.");
    } finally {
      setOauthLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn?.create({ identifier: email, password });
      if (result?.status === "complete" && setActiveSignIn) {
        await setActiveSignIn({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      Alert.alert("Sign in failed", err?.errors?.[0]?.longMessage || err?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const result = await signUp?.create({
        emailAddress: email,
        password,
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" ") || undefined,
      });
      if (result?.status === "complete" && setActiveSignUp) {
        await setActiveSignUp({ session: result.createdSessionId! });
        router.replace("/(tabs)");
      } else {
        Alert.alert("Check your email", "Please verify your email address to continue.");
      }
    } catch (err: any) {
      Alert.alert("Sign up failed", err?.errors?.[0]?.longMessage || err?.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[s.container, { paddingTop: topPad + 20, paddingBottom: botPad + 20 }]}>
      <View style={s.header}>
        <View style={s.logoBox}>
          <Text style={s.logoLetter}>P</Text>
        </View>
        <Text style={s.appName}>PerformanceOS</Text>
        <Text style={s.tagline}>
          {mode === "signin" ? "Welcome back" : "Create your workspace"}
        </Text>
        <Text style={s.subtitle}>
          {mode === "signin"
            ? "Sign in to access your dashboard"
            : "Start tracking your ad performance today"}
        </Text>
      </View>

      <View style={s.card}>
        <Pressable
          style={({ pressed }) => [s.oauthButton, pressed && s.pressed]}
          onPress={handleGoogleOAuth}
          disabled={oauthLoading}
        >
          {oauthLoading ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color={colors.foreground} />
              <Text style={s.oauthText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        {mode === "signup" && (
          <TextInput
            style={s.input}
            placeholder="Full name"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
          />
        )}

        <TextInput
          style={s.input}
          placeholder="Email address"
          placeholderTextColor={colors.mutedForeground}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor={colors.mutedForeground}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={({ pressed }) => [s.primaryButton, pressed && s.pressed, loading && s.disabled]}
          onPress={mode === "signin" ? handleEmailSignIn : handleEmailSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.primaryButtonText}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode(mode === "signin" ? "signup" : "signin")}>
          <Text style={s.toggleText}>
            {mode === "signin"
              ? "Don't have an account? "
              : "Already have an account? "}
            <Text style={s.toggleLink}>
              {mode === "signin" ? "Sign up" : "Sign in"}
            </Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function styles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      justifyContent: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
    },
    logoBox: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    logoLetter: {
      color: "#fff",
      fontSize: 28,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    appName: {
      color: colors.foreground,
      fontSize: 22,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      marginBottom: 6,
    },
    tagline: {
      color: colors.foreground,
      fontSize: 18,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 4,
    },
    subtitle: {
      color: colors.mutedForeground,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    oauthButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
    },
    oauthText: {
      color: colors.foreground,
      fontSize: 15,
      fontWeight: "500" as const,
      fontFamily: "Inter_500Medium",
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.mutedForeground,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    input: {
      backgroundColor: colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.foreground,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    disabled: {
      opacity: 0.6,
    },
    pressed: {
      opacity: 0.8,
    },
    toggleText: {
      color: colors.mutedForeground,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    toggleLink: {
      color: colors.primary,
      fontFamily: "Inter_500Medium",
    },
  });
}
