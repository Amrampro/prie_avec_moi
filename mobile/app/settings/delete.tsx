import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { AdminField } from "../../components/AdminField";
import { apiAccountDelete } from "../../services/account.api";
import { useAuthStore } from "../../stores/auth.store";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function AccountDeleteScreen() {
  const insets = useSafeAreaInsets();
//   const logout = useAuthStore((s) => s.logout);

  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!currentPassword.trim())
      return Alert.alert("Validation", "Mot de passe requis.");

    Alert.alert(
      "Confirmation",
      "Cette action est irréversible. Supprimer définitivement le compte ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await apiAccountDelete({ currentPassword });
              Alert.alert("OK", "Compte supprimé.");

              // logout + redirect to sign-in
              // logout();
              // await apiAccountDelete({ currentPassword });
              await AsyncStorage.removeItem("auth_token");
              router.replace("/sign-in");
            } catch (e: any) {
              Alert.alert("Erreur", e?.message ?? "Suppression impossible.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0B1220" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 56}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 140,
        }}
      >
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>
          Supprimer mon compte
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Action irréversible. Tes favoris et données seront perdus.
        </Text>

        <View
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "rgba(234,240,255,0.10)",
            flexDirection: "row",
            gap: 10,
          }}
        >
          <Ionicons name="alert-circle-outline" size={22} color="#EAF0FF" />
          <Text
            style={{ color: "rgba(234,240,255,0.72)", flex: 1, lineHeight: 20 }}
          >
            Pour confirmer, entre ton mot de passe actuel puis valide.
          </Text>
        </View>

        <AdminField
          label="Mot de passe actuel"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="••••••"
        />

        <Pressable
          onPress={onDelete}
          disabled={loading}
          style={{
            marginTop: 16,
            paddingVertical: 14,
            borderRadius: 22,
            backgroundColor: "rgba(220,38,38,0.18)",
            borderWidth: 1,
            borderColor: "rgba(234,240,255,0.10)",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 10,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Ionicons name="trash-outline" size={18} color="#EAF0FF" />
          )}
          <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
            Supprimer définitivement
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 10,
            paddingVertical: 14,
            borderRadius: 22,
            backgroundColor: "#0F1A2C",
            borderWidth: 1,
            borderColor: "rgba(234,240,255,0.10)",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Ionicons name="arrow-back-outline" size={18} color="#EAF0FF" />
          <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Annuler</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
