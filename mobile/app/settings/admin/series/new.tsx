// client/app/settings/admin/series/new.tsx
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
  Image, // ✅ Import Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // ✅ Import Picker

import { AdminField } from "../../../../components/AdminField";
import { apiAdminCreateSeries } from "../../../../services/admin.series.api";
import { apiAdminUploadFile } from "../../../../services/uploads.api"; // ✅ Import Service Upload

export default function AdminSeriesNew() {
  const insets = useSafeAreaInsets();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  
  const [saving, setSaving] = useState(false);
  
  // ✅ États pour l'image
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  // ✅ Logique d'upload (copiée et adaptée)
  async function pickAndUploadImage() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        return Alert.alert(
          "Permission",
          "Autorise l'accès à la galerie pour choisir une image."
        );
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.9,
      });

      if (res.canceled) return;

      const asset = res.assets[0];

      // Preview immédiat
      setLocalImageUri(asset.uri);
      setUploadingImage(true);

      const upload = await apiAdminUploadFile(
        asset.uri,
        asset.fileName ?? "image.jpg",
        asset.mimeType ?? "image/jpeg"
      );

      // On met à jour coverUrl pour les séries
      setCoverUrl(upload.file.url);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Upload image impossible.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSave() {
    if (!title.trim())
      return Alert.alert("Validation", "Le titre est obligatoire.");

    setSaving(true);
    try {
      const res = await apiAdminCreateSeries({
        title: title.trim(),
        description: description.trim() || null,
        coverUrl: coverUrl.trim() || null,
        isPublished: false,
      });

      Alert.alert("OK", "Série créée.");
      router.replace(`/settings/admin/series/${res.series.id}`);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de créer la série.");
    } finally {
      setSaving(false);
    }
  }

  // Helper pour désactiver les boutons si ça charge
  const isBusy = saving || uploadingImage;
  const previewUri = localImageUri ?? (coverUrl ? coverUrl : null);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0B1220" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 56}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#0B1220",
            paddingTop: insets.top,
          }}
        >
          <ScrollView
            contentContainerStyle={{
              padding: 16,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>
              Nouvelle série
            </Text>
            <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
              Crée une série pour regrouper tes méditations.
            </Text>

            {/* ✅ BLOC IMAGE PREVIEW */}
            <View
              style={{
                marginTop: 20,
                borderRadius: 18,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
                backgroundColor: "#0F1A2C",
              }}
            >
              {previewUri ? (
                <Image
                  source={{ uri: previewUri }}
                  style={{ width: "100%", height: 200 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ height: 120, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="image-outline" size={26} color="rgba(234,240,255,0.5)" />
                  <Text style={{ color: "rgba(234,240,255,0.6)", marginTop: 8 }}>
                    Aucune couverture
                  </Text>
                </View>
              )}

              {uploadingImage && (
                <View
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(11,18,32,0.55)",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <ActivityIndicator />
                  <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Upload...</Text>
                </View>
              )}
            </View>

            {/* ✅ BOUTON CHOISIR IMAGE */}
            <View style={{ marginTop: 12, marginBottom: 12 }}>
              <Pressable
                onPress={pickAndUploadImage}
                disabled={isBusy}
                style={{
                  paddingVertical: 12,
                  borderRadius: 18,
                  backgroundColor: "rgba(37,99,235,0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  opacity: isBusy ? 0.65 : 1,
                }}
              >
                {uploadingImage ? (
                  <ActivityIndicator />
                ) : (
                  <Ionicons name="image-outline" size={18} color="#EAF0FF" />
                )}
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Choisir Cover</Text>
              </Pressable>
            </View>

            <AdminField
              label="Titre"
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: 21 jours de foi"
            />
            <AdminField
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Description courte..."
              multiline
            />
            
            {/* Fallback manuel si besoin */}
            <AdminField
              label="Cover URL"
              value={coverUrl}
              onChangeText={setCoverUrl}
              placeholder="https://..."
            />

            <Pressable
              onPress={onSave}
              disabled={isBusy}
              style={{
                marginTop: 16,
                paddingVertical: 14,
                borderRadius: 22,
                backgroundColor: "#2563EB",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
                opacity: isBusy ? 0.7 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator />
              ) : (
                <Ionicons name="save-outline" size={18} color="#EAF0FF" />
              )}
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Créer</Text>
            </Pressable>
          </ScrollView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}