// client/app/settings/admin/series/[id].tsx
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
  Image, // ✅ Import Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router/react-navigation";

import * as ImagePicker from "expo-image-picker"; // ✅ Import
import * as FileSystem from "expo-file-system/legacy";   // ✅ Import FS

import { AdminField } from "../../../../components/AdminField";
import {
  apiAdminDeleteSeries,
  apiAdminGetSeries,
  apiAdminPublishSeries,
  apiAdminUnpublishSeries,
  apiAdminUpdateSeries,
} from "../../../../services/admin.series.api";
import { apiAdminUploadFile } from "../../../../services/uploads.api"; // ✅ API Upload

// ✅ Helper extension
function getExtFromMime(mime?: string) {
  if (!mime) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("heic")) return "heic";
  return "jpg";
}

export default function AdminSeriesEdit() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entity, setEntity] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  // ✅ États upload image
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiAdminGetSeries(String(id));
    setEntity(res.series);
    setTitle(res.series.title ?? "");
    setDescription(res.series.description ?? "");
    setCoverUrl(res.series.coverUrl ?? "");
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          setLoading(true);
          await load();
        } catch (e: any) {
          if (mounted) setEntity(null);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [load]),
  );

  // ✅ Fonction Pick & Upload (Identique à MeditationEdit)
  async function pickAndUploadImage() {
    setUploadError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission requise", "Autorise l'accès à la galerie.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      // 1) Preview local
      setLocalImageUri(asset.uri);
      
      // 2) Upload
      setUploadingImage(true);

      const mime = asset.mimeType ?? "image/jpeg";
      const ext = getExtFromMime(mime);
      const filename = asset.fileName ?? `image.${ext}`;

      let uploadUri = asset.uri;

      // Hack iOS pour fichiers ph:// (si nécessaire)
      if (!uploadUri.startsWith("file://")) {
        const target = `${FileSystem.cacheDirectory}${Date.now()}-${filename}`;
        await FileSystem.copyAsync({ from: uploadUri, to: target });
        uploadUri = target;
      }

      const upload = await apiAdminUploadFile(uploadUri, filename, mime);

      if (!upload?.file?.url) {
        throw new Error("Upload OK mais URL manquante côté serveur.");
      }

      setCoverUrl(upload.file.url);
      Alert.alert("OK", "Image uploadée.");

    } catch (e: any) {
      setUploadError(e?.message);
      Alert.alert(
        "Erreur",
        e?.message ?? "Impossible d'uploader l'image."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSave() {
    if (!title.trim())
      return Alert.alert("Validation", "Le titre est obligatoire.");

    setSaving(true);
    try {
      const res = await apiAdminUpdateSeries(String(id), {
        title: title.trim(),
        description: description.trim() || null,
        coverUrl: coverUrl.trim() || null,
      });
      setEntity(res.series);
      Alert.alert("OK", "Modifications enregistrées.");
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de sauvegarder.");
    } finally {
      setSaving(false);
    }
  }

  const isBusy = saving || uploadingImage;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0B1220",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!entity) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0B1220",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
          Série introuvable
        </Text>
      </View>
    );
  }

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
              Modifier la série
            </Text>
            <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
              Statut : {entity.isPublished ? "Publié" : "Brouillon"} • Slug :{" "}
              {entity.slug}
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

            {/* Message d'erreur upload */}
            {uploadError ? (
              <Text style={{ color: "#FCA5A5", marginTop: 10, fontWeight: "800" }}>
                {uploadError}
              </Text>
            ) : null}

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
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  Choisir Cover
                </Text>
              </Pressable>
            </View>

            <AdminField label="Titre" value={title} onChangeText={setTitle} />
            <AdminField
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <AdminField
              label="Cover URL"
              value={coverUrl}
              onChangeText={setCoverUrl}
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
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                Enregistrer
              </Text>
            </Pressable>

            {/* Actions Publier / Supprimer */}
            <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={async () => {
                  try {
                    if (entity.isPublished)
                      await apiAdminUnpublishSeries(String(id));
                    else await apiAdminPublishSeries(String(id));
                    await load();
                  } catch (e: any) {
                    Alert.alert("Erreur", e?.message ?? "Action impossible");
                  }
                }}
                disabled={isBusy}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 18,
                  backgroundColor: "rgba(37,99,235,0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  opacity: isBusy ? 0.7 : 1,
                }}
              >
                <Ionicons
                  name={entity.isPublished ? "eye-off-outline" : "eye-outline"}
                  size={16}
                  color="#EAF0FF"
                />
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  {entity.isPublished ? "Dépublier" : "Publier"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  Alert.alert("Supprimer", "Supprimer cette série ?", [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Supprimer",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await apiAdminDeleteSeries(String(id));
                          Alert.alert("OK", "Série supprimée.");
                          router.replace("/settings/admin/series");
                        } catch (e: any) {
                          Alert.alert(
                            "Erreur",
                            e?.message ?? "Suppression impossible",
                          );
                        }
                      },
                    },
                  ])
                }
                disabled={isBusy}
                style={{
                  width: 56,
                  paddingVertical: 12,
                  borderRadius: 18,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isBusy ? 0.7 : 1,
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#EAF0FF" />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
