import * as DocumentPicker from "expo-document-picker";
// client/app/settings/admin/meditations/new.tsx
import React, { useCallback, useState } from "react";
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
  Modal, // ✅ Ajout Import Modal
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router/react-navigation";
import * as ImagePicker from "expo-image-picker";

import { AdminField } from "../../../../components/AdminField";
import { apiAdminListSeries } from "../../../../services/admin.series.api";
import { apiAdminCreateMeditation } from "../../../../services/admin.meditations.api";
import { apiAdminUploadFile } from "../../../../services/uploads.api";

export default function AdminMeditationNew() {
  const insets = useSafeAreaInsets();

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const [series, setSeries] = useState<any[]>([]);
  // ✅ État pour gérer l'affichage du sélecteur
  const [showSeriesModal, setShowSeriesModal] = useState(false);

  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioDuration, setAudioDuration] = useState("");
  const [seriesId, setSeriesId] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await apiAdminListSeries();
          setSeries(res.series ?? []);
        } catch {}
      })();
    }, [])
  );

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
      setLocalImageUri(asset.uri);
      setUploadingImage(true);

      const upload = await apiAdminUploadFile(
        asset.uri,
        asset.fileName ?? "image.jpg",
        asset.mimeType ?? "image/jpeg"
      );

      setImageUrl(upload.file.url);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Upload image impossible.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function pickAndUploadAudio() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true });
      if (result.canceled) return;
      setUploadingAudio(true);
      const asset = result.assets[0];
      const upload = await apiAdminUploadFile(asset.uri, asset.name, asset.mimeType ?? "audio/mpeg", isPremium);
      setAudioUrl(upload.file.url);
    } catch (e: any) {
      Alert.alert("Audio", e.message ?? "Import impossible.");
    } finally { setUploadingAudio(false); }
  }

  async function onSave() {
    if (!title.trim()) return Alert.alert("Validation", "Le titre est obligatoire.");
    if (!bodyText.trim()) return Alert.alert("Validation", "Le texte est obligatoire.");

    setSaving(true);
    try {
      const res = await apiAdminCreateMeditation({
        isPremium,
        title: title.trim(),
        bodyText: bodyText.trim(),
        footerText: footerText.trim() || null,
        imageUrl: imageUrl.trim() || null,
        audioUrl: audioUrl.trim() || null,
        audioDuration: audioDuration.trim() || null,
        seriesId: seriesId || null, // ✅ Si vide => null (Aucune)
        isPublished: false,
      });

      Alert.alert("OK", "Méditation créée.");
      router.replace(`/settings/admin/meditations/${res.meditation.id}`);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de créer la méditation.");
    } finally {
      setSaving(false);
    }
  }

  const isBusy = uploadingAudio || saving || uploadingImage;
  const previewUri = localImageUri ?? (imageUrl ? imageUrl : null);
  
  // ✅ Label de la série sélectionnée
  const selectedSeriesLabel = series.find((s) => s.id === seriesId)?.title || "Aucune (Indépendant)";

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
          Nouvelle méditation
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Tu peux l’attacher à une série (optionnel).
        </Text>

        <AdminField
          label="Titre"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: La paix qui garde le cœur"
        />

        <Pressable accessibilityRole="switch" accessibilityState={{ checked: isPremium }} onPress={() => setIsPremium(!isPremium)} style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: "#0F1A2C" }}>
          <Text style={{ color: isPremium ? "#FBBF24" : "#EAF0FF", fontWeight: "800" }}>{isPremium ? "Premium uniquement" : "Accessible à tous"}</Text>
          <Text style={{ color: "#94A3B8", marginTop: 4 }}>Appuyez pour changer le niveau d’accès.</Text>
        </Pressable>
        <AdminField label="Texte" value={bodyText} onChangeText={setBodyText} multiline />

        <AdminField
          label="Prière / Application"
          value={footerText}
          onChangeText={setFooterText}
          multiline
        />

        {/* Preview image */}
        <View
          style={{
            marginTop: 14,
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
              style={{ width: "100%", height: 220 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ height: 120, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="image-outline" size={26} color="rgba(234,240,255,0.5)" />
              <Text style={{ color: "rgba(234,240,255,0.6)", marginTop: 8 }}>
                Aucune image sélectionnée
              </Text>
            </View>
          )}

          {uploadingImage && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
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
            {uploadingImage ? (
              <ActivityIndicator />
            ) : (
              <Ionicons name="image-outline" size={18} color="#EAF0FF" />
            )}
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Choisir image</Text>
          </Pressable>
        </View>

        <AdminField
          label="Image URL (4x4)"
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
        />

        <Pressable disabled={isBusy} onPress={pickAndUploadAudio} style={{ padding: 14, marginTop: 16, borderRadius: 16, backgroundColor: "#0F1A2C" }}>
          <Text style={{ color: "#60A5FA", fontWeight: "800" }}>{uploadingAudio ? "Import en cours…" : "Importer un fichier audio"}</Text>
        </Pressable>
        {isPremium && <Text style={{ color: "#94A3B8", marginTop: 8 }}>Choisissez Premium avant d’importer votre audio pour le stocker dans un espace privé.</Text>}
        <AdminField
          label="Audio URL"
          value={audioUrl}
          onChangeText={setAudioUrl}
          placeholder="https://..."
        />

        <AdminField
          label="Durée audio (mm:ss)"
          value={audioDuration}
          onChangeText={setAudioDuration}
          placeholder="07:34"
        />

        {/* ✅ SÉLECTEUR DE SÉRIE */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: "rgba(234,240,255,0.5)", fontSize: 13, marginBottom: 8, marginLeft: 4, textTransform: "uppercase", fontWeight: "700" }}>
            Série associée
          </Text>
          <Pressable
            onPress={() => setShowSeriesModal(true)}
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.1)",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
             <Text style={{ color: seriesId ? "#EAF0FF" : "rgba(234,240,255,0.5)", fontWeight: "500" }}>
               {selectedSeriesLabel}
             </Text>
             <Ionicons name="chevron-down" size={16} color="rgba(234,240,255,0.5)" />
          </Pressable>
        </View>

        {/* ✅ MODAL DE SÉLECTION */}
        <Modal
          visible={showSeriesModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSeriesModal(false)}
        >
           <Pressable 
             style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 }}
             onPress={() => setShowSeriesModal(false)}
           >
              <View style={{ backgroundColor: "#1E293B", borderRadius: 20, maxHeight: "60%", overflow: "hidden" }}>
                  <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
                     <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Choisir une série</Text>
                  </View>
                  <ScrollView>
                      {/* Option Aucune */}
                      <Pressable 
                        onPress={() => { setSeriesId(""); setShowSeriesModal(false); }}
                        style={{ padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: seriesId === "" ? "rgba(37,99,235,0.2)" : undefined }}
                      >
                         <Text style={{ color: "#EAF0FF", fontStyle: "italic" }}>Aucune (Indépendant)</Text>
                         {seriesId === "" && <Ionicons name="checkmark" size={20} color="#60A5FA" />}
                      </Pressable>

                      {/* Liste des séries */}
                      {series.map(s => (
                        <Pressable 
                          key={s.id}
                          onPress={() => { setSeriesId(s.id); setShowSeriesModal(false); }}
                          style={{ padding: 16, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.05)", flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: seriesId === s.id ? "rgba(37,99,235,0.2)" : undefined }}
                        >
                           <Text style={{ color: "#EAF0FF", fontWeight: "600" }}>{s.title}</Text>
                           {seriesId === s.id && <Ionicons name="checkmark" size={20} color="#60A5FA" />}
                        </Pressable>
                      ))}
                  </ScrollView>
              </View>
           </Pressable>
        </Modal>

        <Pressable
          onPress={onSave}
          disabled={isBusy}
          style={{
            marginTop: 24,
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
    </KeyboardAvoidingView>
  );
}