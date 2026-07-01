import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  useGetConversations,
  useCreateConversation,
  useGetConversationMessages,
  useSendMessage,
  getGetConversationsQueryKey,
  getGetConversationMessagesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const EXAMPLE_PROMPTS = [
  "Analyze all campaigns",
  "Which campaigns have the highest ROAS?",
  "Where is budget being wasted?",
  "Compare Meta vs Google performance",
  "What should I optimize first?",
];

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

function MessageBubble({ msg, colors }: { msg: Message; colors: ReturnType<typeof useColors> }) {
  const isUser = msg.role === "user";
  return (
    <View style={[bubbleStyles.row, isUser ? bubbleStyles.rowUser : bubbleStyles.rowAi]}>
      {!isUser && (
        <View style={[bubbleStyles.avatar, { backgroundColor: colors.primary + "33" }]}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
        </View>
      )}
      <View
        style={[
          bubbleStyles.bubble,
          {
            backgroundColor: isUser ? colors.primary + "22" : colors.card,
            borderColor: isUser ? colors.primary + "44" : colors.border,
            maxWidth: "80%",
          },
        ]}
      >
        <Text style={[bubbleStyles.text, { color: colors.foreground }]}>{msg.content}</Text>
      </View>
      {isUser && (
        <View style={[bubbleStyles.avatar, { backgroundColor: colors.secondary }]}>
          <Feather name="user" size={14} color={colors.mutedForeground} />
        </View>
      )}
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 12,
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  rowAi: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});

export default function AthenaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useGetConversations();

  useEffect(() => {
    const convs = conversations as any[];
    if (convs.length > 0 && !activeConvoId) {
      setActiveConvoId(convs[0].id);
    }
  }, [conversations, activeConvoId]);

  const { data: messages = [], isLoading: messagesLoading } = useGetConversationMessages(
    activeConvoId ?? "",
    { query: { enabled: !!activeConvoId } }
  );

  const typedMessages = (messages as Message[]);

  const createConvoMutation = useCreateConversation({
    mutation: {
      onSuccess: (data: any) => {
        queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
        setActiveConvoId(data.id);
      },
    },
  });

  const sendMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetConversationMessagesQueryKey(activeConvoId ?? ""),
        });
      },
    },
  });

  const handleSend = useCallback(
    async (prompt?: string) => {
      const content = prompt || input.trim();
      if (!content) return;
      setInput("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (!activeConvoId) {
        createConvoMutation.mutate(
          { data: { title: content.slice(0, 40) } },
          {
            onSuccess: (data: any) => {
              sendMutation.mutate({ id: data.id, data: { content } });
            },
          }
        );
      } else {
        sendMutation.mutate({ id: activeConvoId, data: { content } });
      }
    },
    [input, activeConvoId, createConvoMutation, sendMutation]
  );

  const handleNewChat = useCallback(() => {
    setActiveConvoId(null);
  }, []);

  const s = styles(colors);

  const showWelcome = !activeConvoId && typedMessages.length === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <View style={s.headerLeft}>
          <View style={[s.headerIcon, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={s.title}>Athena AI</Text>
            <Text style={[s.subtitle, { color: colors.mutedForeground }]}>Marketing intelligence</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [s.newChatBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          onPress={handleNewChat}
        >
          <Feather name="plus" size={16} color={colors.foreground} />
        </Pressable>
      </View>

      {showWelcome ? (
        <View style={s.welcome}>
          <View style={[s.welcomeIcon, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name="sparkles" size={32} color={colors.primary} />
          </View>
          <Text style={[s.welcomeTitle, { color: colors.foreground }]}>Ask Athena anything</Text>
          <Text style={[s.welcomeSubtitle, { color: colors.mutedForeground }]}>
            Powered by your real campaign data
          </Text>
          <View style={s.prompts}>
            {EXAMPLE_PROMPTS.map((p) => (
              <Pressable
                key={p}
                style={({ pressed }) => [
                  s.promptChip,
                  { borderColor: colors.border, backgroundColor: pressed ? colors.secondary : colors.card },
                ]}
                onPress={() => handleSend(p)}
              >
                <Text style={[s.promptText, { color: colors.foreground }]}>{p}</Text>
                <Feather name="arrow-up-right" size={14} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={[...typedMessages].reverse()}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={s.messageList}
          renderItem={({ item }) => <MessageBubble msg={item} colors={colors} />}
          ListFooterComponent={
            messagesLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ margin: 12 }} />
            ) : null
          }
          ListHeaderComponent={
            sendMutation.isPending ? (
              <View style={[bubbleStyles.row, bubbleStyles.rowAi]}>
                <View style={[bubbleStyles.avatar, { backgroundColor: colors.primary + "33" }]}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                </View>
                <View style={[bubbleStyles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[bubbleStyles.text, { color: colors.mutedForeground }]}>Thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />
      )}

      <View style={[s.inputBar, { borderTopColor: colors.border, paddingBottom: Math.max(botPad, 16) }]}>
        <TextInput
          style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
          placeholder="Ask about campaigns, ROAS, spend..."
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={() => handleSend()}
          blurOnSubmit
        />
        <Pressable
          style={({ pressed }) => [
            s.sendButton,
            { backgroundColor: colors.primary, opacity: pressed || !input.trim() ? 0.6 : 1 },
          ]}
          onPress={() => handleSend()}
          disabled={!input.trim() || sendMutation.isPending}
        >
          <Feather name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: colors.foreground,
      fontSize: 17,
      fontFamily: "Inter_700Bold",
    },
    subtitle: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    newChatBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    welcome: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 12,
    },
    welcomeIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    welcomeTitle: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
    },
    welcomeSubtitle: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginBottom: 8,
    },
    prompts: {
      width: "100%",
      gap: 8,
    },
    promptChip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    promptText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    messageList: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    input: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      maxHeight: 120,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
