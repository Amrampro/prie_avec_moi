import React, { useCallback, useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router/react-navigation";
import { useAuthStore } from "../../../stores/auth.store";
import { apiAdminPremiumCodes, apiAdminCreatePremiumCode, apiAdminDisablePremiumCode, PremiumCode } from "../../../services/premium.api";

const inputStyle = { color: "#EAF0FF", backgroundColor: "#0F1A2C", padding: 14, borderRadius: 14, marginTop: 12 };
const labels = { AVAILABLE: "Disponible", USED: "Utilisé", EXPIRED: "Expiré", DISABLED: "Désactivé" };
export default function PremiumCodesScreen() {
  const user = useAuthStore(s => s.user);
  const [codes, setCodes] = useState<PremiumCode[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [duration, setDuration] = useState("30");
  const [unit, setUnit] = useState<PremiumCode["durationUnit"]>("DAYS");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [created, setCreated] = useState("");
  async function load(page = 1) {
    const result = await apiAdminPremiumCodes(page);
    setCodes(previous => page === 1 ? result.codes : [...previous, ...result.codes]);
    setNextPage(result.nextPage);
  }
  useFocusEffect(useCallback(() => {
    if (!user?.isAdmin) return;
    setBusy(true);
    load().catch(e => setMessage(e.message)).finally(() => setBusy(false));
  }, [user?.id, user?.isAdmin]));
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setMessage("");
    try { await action(); } catch (e: any) { setMessage(e.message ?? "Erreur"); } finally { setBusy(false); }
  }
  if (!user?.isAdmin) return <Text style={{ color: "#EAF0FF", padding: 20 }}>Accès réservé à l’administration.</Text>;
  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, backgroundColor: "#0B1220" }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>Codes Premium</Text>
      <TextInput style={inputStyle} placeholderTextColor="#94A3B8" placeholder="Code manuel (vide = génération sécurisée)" accessibilityLabel="Code manuel" value={code} onChangeText={setCode} autoCapitalize="characters" maxLength={80} />
      <TextInput style={inputStyle} placeholderTextColor="#94A3B8" placeholder="Durée" accessibilityLabel="Durée du Premium" keyboardType="number-pad" value={duration} onChangeText={setDuration} />
      <View style={{ flexDirection: "row", gap: 16, marginTop: 14 }}>{([['DAYS', 'Jours'], ['MONTHS', 'Mois'], ['YEARS', 'Années']] as const).map(([value, label]) => <Pressable key={value} onPress={() => setUnit(value)}><Text style={{ color: unit === value ? "#FBBF24" : "#94A3B8", fontWeight: "800" }}>{label}</Text></Pressable>)}</View>
      <TextInput style={inputStyle} placeholderTextColor="#94A3B8" placeholder="Expiration du code : AAAA-MM-JJ (facultatif)" accessibilityLabel="Date d’expiration du code" value={expiry} onChangeText={setExpiry} />
      <Pressable disabled={busy} onPress={() => run(async () => {
        if (!Number.isInteger(Number(duration)) || Number(duration) < 1) throw new Error("Saisissez une durée entière positive.");
        const date = expiry.trim() ? new Date(`${expiry.trim()}T23:59:59`) : null;
        if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(expiry.trim()) || Number.isNaN(date.getTime()) || `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` !== expiry.trim())) throw new Error("Date invalide (AAAA-MM-JJ).");
        const result = await apiAdminCreatePremiumCode({ code: code.trim() || undefined, duration: Number(duration), durationUnit: unit, expiresAt: date?.toISOString() });
        setCreated(result.code.code); setCode(""); await load();
      })} style={{ padding: 16, borderRadius: 16, backgroundColor: "#2563EB", marginTop: 16 }}><Text style={{ color: "white", textAlign: "center", fontWeight: "800" }}>Créer un code</Text></Pressable>
      {busy && <ActivityIndicator style={{ marginTop: 12 }} />}
      {!!message && <Text accessibilityRole="alert" style={{ color: "#FCA5A5", marginTop: 12 }}>{message}</Text>}
      {!!created && <Text selectable style={{ color: "#86EFAC", marginTop: 12 }}>Code créé : {created}</Text>}
      {codes.map(item => <View key={item.id} style={{ backgroundColor: "#0F1A2C", padding: 16, borderRadius: 16, marginTop: 16 }}>
        <Text selectable style={{ color: "#EAF0FF", fontWeight: "800" }}>{item.code}</Text>
        <Text style={{ color: "#FBBF24", marginTop: 6 }}>{labels[item.status]} • {item.duration} {({ DAYS: "jours", MONTHS: "mois", YEARS: "années" })[item.durationUnit]}</Text>
        <Text style={{ color: "#94A3B8", marginTop: 6 }}>Créé le {new Date(item.createdAt).toLocaleDateString("fr-FR")}</Text>
        {item.expiresAt && <Text style={{ color: "#94A3B8" }}>Expire le {new Date(item.expiresAt).toLocaleDateString("fr-FR")}</Text>}
        {item.usedAt && <Text style={{ color: "#94A3B8" }}>{item.usedBy ? `${item.usedBy.fullName} (${item.usedBy.email})` : "Compte supprimé"} • {new Date(item.usedAt).toLocaleString("fr-FR")}</Text>}
        {item.status === "AVAILABLE" && <Pressable disabled={busy} onPress={() => run(async () => { await apiAdminDisablePremiumCode(item.id); await load(); })} style={{ marginTop: 12 }}><Text style={{ color: "#FCA5A5" }}>Désactiver ce code</Text></Pressable>}
      </View>)}
      {nextPage && <Pressable disabled={busy} onPress={() => run(() => load(nextPage))} style={{ padding: 20 }}><Text style={{ color: "#60A5FA" }}>Charger la suite</Text></Pressable>}
    </ScrollView>
  );
}
