import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../stores/auth.store";
import { apiActivatePremium, PremiumStatus } from "../../services/premium.api";
import { PremiumAccount } from "../../components/PremiumAccount";

export default function PremiumScreen() {
  const token = useAuthStore(s => s.token);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<PremiumStatus | null>(null);
  async function activate() {
    if (busy || !code.trim()) return;
    setBusy(true); setMessage(""); setResult(null);
    try {
      const value = await apiActivatePremium(code.trim());
      setResult(value); setCode("");
      const current = useAuthStore.getState();
      if (current.user && current.token === token) current.setUser({ ...current.user, ...value });
    } catch (e: any) { setMessage(e.message ?? "Activation impossible."); }
    finally { setBusy(false); }
  }
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20 }} style={{ flex: 1, backgroundColor: "#0B1220" }}>
    <Text style={{ color: "#EAF0FF", fontSize: 24, fontWeight: "900" }}>Activer Premium</Text>
    <Text style={{ color: "#94A3B8", marginTop: 12 }}>Votre code débloque les méditations Premium. Si votre accès est encore actif, sa durée sera prolongée.</Text>
    {!token ? <Pressable onPress={() => router.push("/sign-in")} style={{ marginTop: 24 }}><Text style={{ color: "#60A5FA" }}>Se connecter pour activer un code</Text></Pressable> : <View>
      <PremiumAccount key={result?.premiumEndAt ?? "current"} />
      <TextInput accessibilityLabel="Code d’activation Premium" placeholder="Entrez votre code d’activation" placeholderTextColor="#94A3B8" autoCapitalize="characters" autoCorrect={false} maxLength={80} value={code} onChangeText={setCode} editable={!busy} style={{ color: "#EAF0FF", backgroundColor: "#0F1A2C", borderRadius: 16, padding: 16, marginTop: 20 }} />
      <Pressable disabled={busy || !code.trim()} onPress={activate} style={{ padding: 16, marginTop: 16, borderRadius: 16, backgroundColor: "#2563EB", opacity: busy || !code.trim() ? 0.5 : 1 }}>
        {busy ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "800", textAlign: "center" }}>Activer mon Premium</Text>}
      </Pressable>
      {!!message && <Text accessibilityRole="alert" style={{ color: "#FCA5A5", marginTop: 20 }}>{message}</Text>}
      {result && <Text accessibilityRole="alert" style={{ color: "#86EFAC", marginTop: 20 }}>Premium activé. Votre accès Premium est actif jusqu’au {new Date(result.premiumEndAt!).toLocaleDateString("fr-FR")}.</Text>}
    </View>}
  </ScrollView>;
}
