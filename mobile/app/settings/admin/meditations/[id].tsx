import * as DocumentPicker from "expo-document-picker";
// client/app/settings/admin/meditations/[id].tsx
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
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router/react-navigation";

import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
// Note: Utilise les imports nommés si FileSystem crash comme vu précédemment
// import { cacheDirectory, copyAsync } from "expo-file-system"; 

import { AdminField } from "../../../../components/AdminField";
import { apiAdminListSeries } from "../../../../services/admin.series.api";
import {
  apiAdminDeleteMeditation,
  apiAdminGetMeditation,
  apiAdminPublishMeditation,
  apiAdminUnpublishMeditation,
  apiAdminUpdateMeditation,
} from "../../../../services/admin.meditations.api";
import { apiAdminUploadFile } from "../../../../services/uploads.api";

function getExtFromMime(mime?: string) {
  if (!mime) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("heic")) return "heic";
  return "jpg";
}

export default function AdminMeditationEdit() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [entity, setEntity] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);

  // ✅ État pour gérer le modal
  const [showSeriesModal, setShowSeriesModal] = useState(false);

  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioDuration, setAudioDuration] = useState("");
  const [seriesId, setSeriesId] = useState("");

  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiAdminGetMeditation(String(id));
    setEntity(res.meditation);

    setIsPremium(Boolean(res.meditation.isPremium));
    setTitle(res.meditation.title ?? "");
    setBodyText(res.meditation.bodyText ?? "");
    setFooterText(res.meditation.footerText ?? "");
    setImageUrl(res.meditation.imageUrl ?? "");
    setAudioUrl(res.meditation.audioUrl ?? "");
    setAudioDuration(res.meditation.audioDuration ?? "");
    setSeriesId(res.meditation.seriesId ?? "");
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          setLoading(true);
          const s = await apiAdminListSeries();
          if (mounted) setSeries(s.series ?? []);
          await load();
        } catch {
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
      setLocalImageUri(asset.uri);
      setUploadingImage(true);

      const mime = asset.mimeType ?? "image/jpeg";
      const ext = getExtFromMime(mime);
      const filename = asset.fileName ?? `image.${ext}`;

      let uploadUri = asset.uri;
      setUploading(true);

      if (!uploadUri.startsWith("file://")) {
        const target = `${FileSystem.cacheDirectory}${Date.now()}-${filename}`;
        await FileSystem.copyAsync({ from: uploadUri, to: target });
        uploadUri = target;
      }

      const upload = await apiAdminUploadFile(uploadUri, filename, mime);

      if (!upload?.file?.url) {
        throw new Error("Upload OK mais URL manquante côté serveur.");
      }

      setImageUrl(upload.file.url);
      Alert.alert("OK", "Image uploadée.");
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible d'uploader l'image.");
    } finally {
      setUploading(false);
      setUploadingImage(false); // Fix: bien reset l'état image aussi
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
      const res = await apiAdminUpdateMeditation(String(id), {
        isPremium,
        title: title.trim(),
        bodyText: bodyText.trim(),
        footerText: footerText.trim() || null,
        imageUrl: imageUrl.trim() || null,
        audioUrl: audioUrl.trim() || null,
        audioDuration: audioDuration.trim() || null,
        seriesId: seriesId || null, // ✅ Handle null
      });

      setEntity(res.meditation);
      Alert.alert("OK", "Modifications enregistrées.");
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de sauvegarder.");
    } finally {
      setSaving(false);
    }
  }

  const isBusy = uploadingAudio || saving || uploading;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B1220", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!entity) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B1220", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Méditation introuvable</Text>
      </View>
    );
  }

  // ✅ Label
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
          paddingBottom: insets.bottom + 170,
        }}
      >
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>
          Modifier la méditation
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Statut : {entity.isPublished ? "Publié" : "Brouillon"} • Slug : {entity.slug}
        </Text>

        <AdminField label="Titre" value={title} onChangeText={setTitle} />
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: isPremium }} onPress={() => setIsPremium(!isPremium)} style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: "#0F1A2C" }}>
          <Text style={{ color: isPremium ? "#FBBF24" : "#EAF0FF", fontWeight: "800" }}>{isPremium ? "Premium uniquement" : "Accessible à tous"}</Text>
          <Text style={{ color: "#94A3B8", marginTop: 4 }}>Appuyez pour changer le niveau d’accès.</Text>
        </Pressable>
        <AdminField label="Texte" value={bodyText} onChangeText={setBodyText} multiline />
        <AdminField label="Prière / Application" value={footerText} onChangeText={setFooterText} multiline />

        {/* Upload buttons */}
        <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={pickAndUploadImage}
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
              opacity: isBusy ? 0.65 : 1,
            }}
          >
            {uploading ? <ActivityIndicator /> : <Ionicons name="image-outline" size={18} color="#EAF0FF" />}
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Choisir image</Text>
          </Pressable>
        </View>

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
          {(localImageUri || imageUrl) ? (
            <Image
              source={{ uri: localImageUri ?? imageUrl }}
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

        {uploadError ? (
          <Text style={{ color: "#FCA5A5", marginTop: 10, fontWeight: "800" }}>{uploadError}</Text>
        ) : null}

        <AdminField label="Image URL (4x4)" value={imageUrl} onChangeText={setImageUrl} />
        <Pressable disabled={isBusy} onPress={pickAndUploadAudio} style={{ padding: 14, marginTop: 16, borderRadius: 16, backgroundColor: "#0F1A2C" }}>
          <Text style={{ color: "#60A5FA", fontWeight: "800" }}>{uploadingAudio ? "Import en cours…" : "Importer un fichier audio"}</Text>
        </Pressable>
        {isPremium && <Text style={{ color: "#94A3B8", marginTop: 8 }}>Choisissez Premium avant d’importer votre audio pour le stocker dans un espace privé.</Text>}
        <AdminField label="Audio URL" value={audioUrl} onChangeText={setAudioUrl} />
        <AdminField label="Durée audio (mm:ss)" value={audioDuration} onChangeText={setAudioDuration} />

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

        {/* ✅ MODAL */}
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
                      <Pressable 
                        onPress={() => { setSeriesId(""); setShowSeriesModal(false); }}
                        style={{ padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: seriesId === "" ? "rgba(37,99,235,0.2)" : undefined }}
                      >
                         <Text style={{ color: "#EAF0FF", fontStyle: "italic" }}>Aucune (Indépendant)</Text>
                         {seriesId === "" && <Ionicons name="checkmark" size={20} color="#60A5FA" />}
                      </Pressable>

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
          {saving ? <ActivityIndicator /> : <Ionicons name="save-outline" size={18} color="#EAF0FF" />}
          <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Enregistrer</Text>
        </Pressable>

        {/* ... Reste des boutons Publier/Supprimer ... */}
        <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
            {/* Je n'ai pas tout recopié pour abréger, mais tu gardes les boutons existants ici */}
             <Pressable
                onPress={async () => {
                  try {
                    if (entity.isPublished)
                      await apiAdminUnpublishMeditation(String(id));
                    else await apiAdminPublishMeditation(String(id));
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
                  Alert.alert("Supprimer", "Supprimer cette méditation ?", [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Supprimer",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await apiAdminDeleteMeditation(String(id));
                          Alert.alert("OK", "Méditation supprimée.");
                          router.replace("/settings/admin/meditations");
                        } catch (e: any) {
                          Alert.alert("Erreur", e?.message ?? "Suppression impossible");
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
    </KeyboardAvoidingView>
  );
}
