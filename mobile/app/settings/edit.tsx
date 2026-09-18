import React, { useCallback, useState } from "react";

import { Link, router } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router/react-navigation";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { AdminField } from "../../components/AdminField";
import { apiAccountMe, apiAccountUpdate } from "../../services/account.api";
import { apiAdminUploadFile } from "../../services/uploads.api";
import { useAuthStore } from "../../stores/auth.store";

export default function AccountEditScreen() {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [user, setLocalUser] = useState<any>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // optional password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);

  const load = useCallback(async () => {
    const res = await apiAccountMe();
    setLocalUser(res.user);
    setFullName(res.user.fullName ?? "");
    setEmail(res.user.email ?? "");
    setAvatarUrl(res.user.avatarUrl ?? "");
    setLocalAvatar(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          setLoading(true);
          await load();
        } catch (e: any) {
          if (mounted)
            Alert.alert(
              "Erreur",
              e?.message ?? "Impossible de charger le compte.",
            );
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [load]),
  );

  const previewAvatar = localAvatar ?? (avatarUrl ? avatarUrl : null);

  async function pickAndUploadAvatar() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted)
        return Alert.alert("Permission", "Autorise l'accès à la galerie.");

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.9,
      });

      if (res.canceled) return;

      const asset = res.assets[0];
      setLocalAvatar(asset.uri);

      setUploading(true);
      const upload = await apiAdminUploadFile(
        asset.uri,
        asset.fileName ?? "avatar.jpg",
        asset.mimeType ?? "image/jpeg",
      );
      setAvatarUrl(upload.file.url);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Upload avatar impossible.");
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (!fullName.trim())
      return Alert.alert("Validation", "Nom complet obligatoire.");
    if (!email.trim()) return Alert.alert("Validation", "Email obligatoire.");

    const payload: any = {
      fullName: fullName.trim(),
      email: email.trim(),
      avatarUrl: avatarUrl.trim() || null,
    };

    if (currentPassword.trim() || newPassword.trim()) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    setSaving(true);
    try {
      // ✅ Update
      const updated = await apiAccountUpdate(payload);

      // ✅ Update local UI
      setLocalUser(updated.user);
      setFullName(updated.user.fullName ?? "");
      setEmail(updated.user.email ?? "");
      setAvatarUrl(updated.user.avatarUrl ?? "");

      // ✅ IMPORTANT: sync store + AsyncStorage user
      setUser(updated.user);

      // reset password inputs
      setCurrentPassword("");
      setNewPassword("");

      Alert.alert("OK", "Compte mis à jour.");

      // ✅ redirect to settings
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Mise à jour impossible.");
    } finally {
      setSaving(false);
    }
  }

  const busy = loading || saving || uploading;

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
          Mon compte
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Mets à jour tes informations.
        </Text>

        {loading ? (
          <View
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 18,
              backgroundColor: "#0F1A2C",
              alignItems: "center",
            }}
          >
            <ActivityIndicator />
          </View>
        ) : (
          <>
            {/* Avatar preview */}
            <View
              style={{
                marginTop: 14,
                borderRadius: 18,
                padding: 14,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 999,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.12)",
                  backgroundColor: "#0B1220",
                }}
              >
                {previewAvatar ? (
                  <Image
                    source={{ uri: previewAvatar }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="person-outline"
                      size={22}
                      color="rgba(234,240,255,0.6)"
                    />
                  </View>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#EAF0FF", fontWeight: "900" }}
                  numberOfLines={1}
                >
                  {user?.fullName ?? "—"}
                </Text>
                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }}
                  numberOfLines={1}
                >
                  {user?.email ?? "—"}
                </Text>
              </View>

              <Pressable
                onPress={pickAndUploadAvatar}
                disabled={busy}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 16,
                  backgroundColor: "rgba(37,99,235,0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                  opacity: busy ? 0.65 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {uploading ? (
                  <ActivityIndicator />
                ) : (
                  <Ionicons name="image-outline" size={18} color="#EAF0FF" />
                )}
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  Avatar
                </Text>
              </Pressable>
            </View>

            <AdminField
              label="Nom complet"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ton nom"
            />
            <AdminField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="email@..."
            />

            {/* avatarUrl is still editable (fallback) */}
            <AdminField
              label="Avatar URL"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              placeholder="https://..."
            />

            <View
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
              }}
            >
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                Changer le mot de passe (optionnel)
              </Text>
              <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
                Remplis les deux champs pour changer.
              </Text>
            </View>

            <AdminField
              label="Mot de passe actuel"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••"
            />
            <AdminField
              label="Nouveau mot de passe"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••"
            />

            <Pressable
              onPress={onSave}
              disabled={busy}
              style={{
                marginTop: 16,
                paddingVertical: 14,
                borderRadius: 22,
                backgroundColor: "#2563EB",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
                opacity: busy ? 0.7 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator />
              ) : (
                <Ionicons name="save-outline" size={18} color="#EAF0FF" />
              )}
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                Enregistrer
              </Text>
            </Pressable>

            {/* link to delete page */}
            <Pressable
              onPress={() => router.push("/settings/delete")}
              style={{
                marginTop: 10,
                paddingVertical: 14,
                borderRadius: 22,
                backgroundColor: "rgb(255, 67, 67)",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Ionicons name="warning-outline" size={18} color="#EAF0FF" />
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                Supprimer mon compte
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
