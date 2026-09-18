// mobile/app/sign-in.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { apiSignIn } from "../services/auth.api";
import { useAuthStore } from "../stores/auth.store";

function parseErrorMessage(e: any) {
  const msg = e?.message ?? "Erreur";
  return typeof msg === "string" ? msg : "Erreur";
}

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length >= 3 && password.length >= 1 && !submitting;
  }, [email, password, submitting]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220", paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 16,
            paddingBottom: insets.bottom + 28,
            justifyContent: "center",
          }}
        >
          <View style={{ alignSelf: "stretch" }}>
            {/* Header */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#EAF0FF", fontWeight: "900", fontSize: 30, letterSpacing: 0.2 }}>
                Connexion
              </Text>
              <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6, lineHeight: 20 }}>
                Bienvenue ! Connecte-toi pour continuer.
              </Text>
            </View>

            {/* Card */}
            <View
              style={{
                padding: 16,
                borderRadius: 24,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
              }}
            >
              {/* Error banner */}
              {error ? (
                <View
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: "rgba(239,68,68,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(239,68,68,0.25)",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: "rgba(234,240,255,0.92)", fontWeight: "800" }}>{error}</Text>
                </View>
              ) : null}

              {/* Email */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: "rgba(234,240,255,0.72)", marginBottom: 8, fontWeight: "800" }}>
                  Email
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    borderRadius: 18,
                    backgroundColor: "#111F35",
                    borderWidth: 1,
                    borderColor: "rgba(234,240,255,0.10)",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Ionicons name="mail-outline" size={18} color="rgba(234,240,255,0.75)" />
                  <TextInput
                    value={email}
                    onChangeText={(v) => {
                      setError(null);
                      setEmail(v);
                    }}
                    placeholder="email@exemple.com"
                    placeholderTextColor="rgba(234,240,255,0.40)"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{ color: "#EAF0FF", flex: 1, fontWeight: "700" }}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={{ marginBottom: 6 }}>
                <Text style={{ color: "rgba(234,240,255,0.72)", marginBottom: 8, fontWeight: "800" }}>
                  Mot de passe
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    borderRadius: 18,
                    backgroundColor: "#111F35",
                    borderWidth: 1,
                    borderColor: "rgba(234,240,255,0.10)",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={18} color="rgba(234,240,255,0.75)" />
                  <TextInput
                    value={password}
                    onChangeText={(v) => {
                      setError(null);
                      setPassword(v);
                    }}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(234,240,255,0.40)"
                    secureTextEntry={!show}
                    style={{ color: "#EAF0FF", flex: 1, fontWeight: "700" }}
                  />
                  <Pressable onPress={() => setShow((v) => !v)} style={{ padding: 4 }}>
                    <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color="rgba(234,240,255,0.75)" />
                  </Pressable>
                </View>
              </View>

              {/* Submit */}
              <Pressable
                disabled={!canSubmit}
                onPress={async () => {
                  if (!canSubmit) return;
                  setSubmitting(true);
                  setError(null);

                  try {
                    const res = await apiSignIn({ email: email.trim(), password });
                    await setSession({ user: res.user, token: res.token });
                    router.replace("/(tabs)");
                  } catch (e: any) {
                    setError(parseErrorMessage(e));
                  } finally {
                    setSubmitting(false);
                  }
                }}
                style={{
                  marginTop: 14,
                  paddingVertical: 14,
                  borderRadius: 18,
                  backgroundColor: "#2563EB",
                  alignItems: "center",
                  opacity: canSubmit ? 1 : 0.55,
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                {submitting ? <ActivityIndicator color="#EAF0FF" /> : <Ionicons name="log-in-outline" size={18} color="#EAF0FF" />}
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  {submitting ? "Connexion..." : "Se connecter"}
                </Text>
              </Pressable>

              <Pressable onPress={() => {}} style={{ alignItems: "center", paddingVertical: 10 }}>
                <Text style={{ color: "rgba(234,240,255,0.72)", fontWeight: "800" }}>
                  Mot de passe oublié ? (V2)
                </Text>
              </Pressable>
            </View>

            {/* Footer link */}
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <Text style={{ color: "rgba(234,240,255,0.72)", fontWeight: "700" }}>
                Pas de compte ?{" "}
                <Link href="/sign-up" style={{ color: "#60A5FA", fontWeight: "900" }}>
                  Créer un compte
                </Link>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
