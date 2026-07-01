import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useGetWindsorConnection } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const STAGES = ["New Leads", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"] as const;
type Stage = typeof STAGES[number];

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  source: string;
  stage: Stage;
  value: number;
}

const DEFAULT_LEADS: Lead[] = [
  { id: "1", name: "Sarah Johnson", company: "TechCorp Inc.", email: "sarah@techcorp.com", source: "Google Ads", stage: "Qualified", value: 12000 },
  { id: "2", name: "Mark Davis", company: "Growth Agency", email: "mark@growthco.com", source: "Meta Ads", stage: "Contacted", value: 8500 },
  { id: "3", name: "Priya Patel", company: "SaaS Platform", email: "priya@saasplatform.io", source: "LinkedIn Ads", stage: "Proposal Sent", value: 24000 },
  { id: "4", name: "Tom Wilson", company: "E-Commerce Brand", email: "tom@ecobrand.com", source: "Google Ads", stage: "New Leads", value: 5000 },
  { id: "5", name: "Lisa Chen", company: "Digital Media Co.", email: "lisa@dmedia.com", source: "Meta Ads", stage: "Won", value: 18000 },
];

const STAGE_COLORS: Record<Stage, string> = {
  "New Leads": "#6366f1",
  "Contacted": "#3b82f6",
  "Qualified": "#8b5cf6",
  "Proposal Sent": "#f59e0b",
  "Won": "#22c55e",
  "Lost": "#ef4444",
};

function fmt(v: number) {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v}`;
}

function LeadCard({ lead, onMove, colors }: { lead: Lead; onMove: (id: string, stage: Stage) => void; colors: ReturnType<typeof useColors> }) {
  const [showStages, setShowStages] = useState(false);
  const stageColor = STAGE_COLORS[lead.stage];

  return (
    <View style={[lcStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={lcStyles.top}>
        <View>
          <Text style={[lcStyles.name, { color: colors.foreground }]}>{lead.name}</Text>
          <Text style={[lcStyles.company, { color: colors.mutedForeground }]}>{lead.company}</Text>
        </View>
        <Text style={[lcStyles.value, { color: colors.success }]}>{fmt(lead.value)}</Text>
      </View>
      <View style={lcStyles.meta}>
        <View style={[lcStyles.sourceBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={[lcStyles.sourceText, { color: colors.mutedForeground }]}>{lead.source}</Text>
        </View>
        <Pressable
          style={[lcStyles.stageBadge, { backgroundColor: stageColor + "22", borderColor: stageColor + "44" }]}
          onPress={() => setShowStages(!showStages)}
        >
          <Text style={[lcStyles.stageText, { color: stageColor }]}>{lead.stage}</Text>
          <Feather name={showStages ? "chevron-up" : "chevron-down"} size={10} color={stageColor} />
        </Pressable>
      </View>
      {showStages && (
        <View style={[lcStyles.stageDropdown, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          {STAGES.map((s) => (
            <Pressable
              key={s}
              style={({ pressed }) => [lcStyles.stageOption, { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => {
                onMove(lead.id, s);
                setShowStages(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={[lcStyles.stageOptionDot, { backgroundColor: STAGE_COLORS[s] }]} />
              <Text style={[lcStyles.stageOptionText, { color: s === lead.stage ? STAGE_COLORS[s] : colors.foreground }]}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const lcStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 8 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  name: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  company: { fontSize: 12, fontFamily: "Inter_400Regular" },
  value: { fontSize: 15, fontFamily: "Inter_700Bold" },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  sourceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  sourceText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  stageBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  stageText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  stageDropdown: { borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  stageOption: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  stageOptionDot: { width: 8, height: 8, borderRadius: 4 },
  stageOptionText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});

export default function CRMScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { isLoading } = useGetWindsorConnection();
  const [leads, setLeads] = useState<Lead[]>(DEFAULT_LEADS);
  const [filterStage, setFilterStage] = useState<Stage | "All">("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", source: "Google Ads", value: "" });

  const filtered = filterStage === "All" ? leads : leads.filter((l) => l.stage === filterStage);

  const handleMove = (id: string, stage: Stage) => {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, stage } : l));
  };

  const handleAdd = () => {
    if (!form.name || !form.company) return;
    setLeads((prev) => [...prev, {
      id: crypto.randomUUID(),
      name: form.name,
      company: form.company,
      email: form.email,
      source: form.source,
      stage: "New Leads",
      value: Number(form.value) || 0,
    }]);
    setForm({ name: "", company: "", email: "", source: "Google Ads", value: "" });
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const pipelineValue = leads.filter((l) => l.stage !== "Lost").reduce((s, l) => s + l.value, 0);

  const s = styles(colors);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>CRM Leads</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>Pipeline: {fmt(pipelineValue)}</Text>
        </View>
        <Pressable style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowModal(true)}>
          <Feather name="plus" size={16} color="#fff" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
          >
            {(["All", ...STAGES] as const).map((stage) => {
              const active = filterStage === stage;
              const color = stage === "All" ? colors.primary : STAGE_COLORS[stage];
              const count = stage === "All" ? leads.length : leads.filter((l) => l.stage === stage).length;
              return (
                <Pressable
                  key={stage}
                  style={[s.filterChip, { borderColor: active ? color : colors.border, backgroundColor: active ? color + "22" : "transparent" }]}
                  onPress={() => setFilterStage(stage as any)}
                >
                  <Text style={[s.filterText, { color: active ? color : colors.mutedForeground }]}>
                    {stage} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <LeadCard lead={item} onMove={handleMove} colors={colors} />}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: botPad + 24 }}
            ListEmptyComponent={
              <View style={s.center}>
                <Feather name="users" size={40} color={colors.mutedForeground} />
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No leads in this stage</Text>
              </View>
            }
          />
        </>
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={[s.modal, { backgroundColor: colors.background }]}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Add New Lead</Text>
            <Pressable onPress={() => setShowModal(false)}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            {[
              { label: "Full Name *", key: "name", placeholder: "Jane Smith" },
              { label: "Company *", key: "company", placeholder: "Acme Inc." },
              { label: "Email", key: "email", placeholder: "jane@acme.com" },
              { label: "Deal Value (USD)", key: "value", placeholder: "10000" },
            ].map((f) => (
              <View key={f.key} style={{ gap: 6 }}>
                <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                <TextInput
                  style={[s.fieldInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={(form as any)[f.key]}
                  onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                  keyboardType={f.key === "value" ? "numeric" : "default"}
                />
              </View>
            ))}
            <View style={s.modalActions}>
              <Pressable
                style={[s.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[s.cancelText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleAdd}
              >
                <Text style={s.saveBtnText}>Add Lead</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingHorizontal: 20, paddingBottom: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { padding: 4 },
    title: { color: colors.foreground, fontSize: 20, fontFamily: "Inter_700Bold" },
    subtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
    addBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 40 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    filterText: { fontSize: 12, fontFamily: "Inter_500Medium" },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    modal: { flex: 1 },
    modalHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
    fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
    fieldInput: {
      borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, fontFamily: "Inter_400Regular",
    },
    modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, alignItems: "center" },
    cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
    saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  });
}
