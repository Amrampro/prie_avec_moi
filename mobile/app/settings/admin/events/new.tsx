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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { AdminField } from "../../../../components/AdminField";
import { apiAdminCreateEvent } from "../../../../services/admin.events.api";
import { apiAdminUploadFile } from "../../../../services/uploads.api";

export default function AdminEventNew() {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [address, setAddress] = useState("");
  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // MVP dates as string (backend accepts string)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function pickAndUploadImage() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        return Alert.alert("Permission", "Autorise l'accès à la galerie.");
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.9,
      });

      if (res.canceled) return;

      const asset = res.assets[0];
      setLocalImageUri(asset.uri);

      setUploadingImage(true);
      const upload = await apiAdminUploadFile(
        asset.uri,
        asset.fileName ?? "event.jpg",
        asset.mimeType ?? "image/jpeg"
      );

      setImageUrl(upload.file.url);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Upload image impossible.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSave() {
    if (!name.trim()) return Alert.alert("Validation", "Le nom est obligatoire.");
    if (!startDate.trim()) return Alert.alert("Validation", "Date de début obligatoire.");
    if (!endDate.trim()) return Alert.alert("Validation", "Date de fin obligatoire.");

    setSaving(true);
    try {
      const res = await apiAdminCreateEvent({
        name: name.trim(),
        place: place.trim() || null,
        address: address.trim() || null,
        theme: theme.trim() || null,
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        isPublished: false,
      });

      Alert.alert("OK", "Évènement créé.");
      router.replace(`/settings/admin/events/${res.event.id}`);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de créer l'évènement.");
    } finally {
      setSaving(false);
    }
  }

  const isBusy = saving || uploadingImage;
  const previewUri = localImageUri ?? (imageUrl ? imageUrl : null);

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
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>Nouvel évènement</Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Remplis les infos et publie ensuite si tout est ok.
        </Text>

        {/* Preview */}
        <View style={{ marginTop: 14, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(234,240,255,0.10)", backgroundColor: "#0F1A2C" }}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
          ) : (
            <View style={{ height: 120, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="image-outline" size={26} color="rgba(234,240,255,0.5)" />
              <Text style={{ color: "rgba(234,240,255,0.6)", marginTop: 8 }}>Aucune image sélectionnée</Text>
            </View>
          )}

          {uploadingImage && (
            <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(11,18,32,0.55)", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <ActivityIndicator />
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Upload...</Text>
            </View>
          )}
        </View>

        <View style={{ marginTop: 12 }}>
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
            {uploadingImage ? <ActivityIndicator /> : <Ionicons name="image-outline" size={18} color="#EAF0FF" />}
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Choisir image</Text>
          </Pressable>
        </View>

        <AdminField label="Nom" value={name} onChangeText={setName} placeholder="Ex: Conférence de prière" />
        <AdminField label="Lieu" value={place} onChangeText={setPlace} placeholder="Ex: Bruxelles" />
        <AdminField label="Adresse" value={address} onChangeText={setAddress} placeholder="Rue..." />
        <AdminField label="Thème" value={theme} onChangeText={setTheme} placeholder="Ex: Foi & Paix" />
        <AdminField label="Description" value={description} onChangeText={setDescription} multiline />

        <AdminField label="Image URL" value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." />

        <AdminField label="Date de début (YYYY-MM-DD HH:mm)" value={startDate} onChangeText={setStartDate} placeholder="2026-02-15 19:00" />
        <AdminField label="Date de fin (YYYY-MM-DD HH:mm)" value={endDate} onChangeText={setEndDate} placeholder="2026-02-15 21:00" />

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
          {saving ? <ActivityIndicator /> : <Ionicons name="save-outline" size={18} color="#EAF0FF" />}
          <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Créer</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
