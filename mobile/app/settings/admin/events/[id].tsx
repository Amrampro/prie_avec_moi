// client/app/settings/admin/events/[id].tsx
import React, { useCallback, useMemo, useState } from "react";
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
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router/react-navigation";
import * as ImagePicker from "expo-image-picker";

import { AdminField } from "../../../../components/AdminField";
import {
  apiAdminDeleteEvent,
  apiAdminGetEvent,
  apiAdminPublishEvent,
  apiAdminUnpublishEvent,
  apiAdminUpdateEvent,
} from "../../../../services/admin.events.api";
import { apiAdminUploadFile } from "../../../../services/uploads.api";

function formatDT(d: string) {
  try {
    return new Date(d).toLocaleString("fr-FR");
  } catch {
    return d;
  }
}

/**
 * Convert a Date (or ISO string) to "YYYY-MM-DD HH:mm"
 */
function toInputDateTime(value: any) {
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return "";
  }
}

export default function AdminEventEdit() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [event, setEvent] = useState<any>(null);

  // form fields
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [address, setAddress] = useState("");
  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // preview local image
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const previewUri = useMemo(() => localImageUri ?? (imageUrl ? imageUrl : null), [localImageUri, imageUrl]);

  const hydrate = useCallback((e: any) => {
    setEvent(e);
    setName(e?.name ?? "");
    setPlace(e?.place ?? "");
    setAddress(e?.address ?? "");
    setTheme(e?.theme ?? "");
    setDescription(e?.description ?? "");
    setImageUrl(e?.imageUrl ?? "");
    setStartDate(toInputDateTime(e?.startDate));
    setEndDate(toInputDateTime(e?.endDate));
    setLocalImageUri(null); // reset local preview on refresh
  }, []);

  const load = useCallback(async () => {
    const res = await apiAdminGetEvent(String(id));
    hydrate(res.event);
  }, [id, hydrate]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          setLoading(true);
          await load();
        } catch (e: any) {
          if (mounted) {
            setEvent(null);
            Alert.alert("Erreur", e?.message ?? "Impossible de charger l'évènement.");
          }
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [load])
  );

  const isBusy = loading || saving || uploadingImage;

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

      // preview
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
      const res = await apiAdminUpdateEvent(String(id), {
        name: name.trim(),
        place: place.trim() || null,
        address: address.trim() || null,
        theme: theme.trim() || null,
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
      });

      hydrate(res.event);
      Alert.alert("OK", "Évènement mis à jour.");
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Mise à jour impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    if (!event) return;
    try {
      if (event.isPublished) {
        const res = await apiAdminUnpublishEvent(event.id);
        setEvent((prev: any) => ({ ...prev, ...res.event }));
        Alert.alert("OK", "Dépublié.");
      } else {
        const res = await apiAdminPublishEvent(event.id);
        setEvent((prev: any) => ({ ...prev, ...res.event }));
        Alert.alert("OK", "Publié.");
      }
      // refresh for consistency (optional)
      await load();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Action impossible.");
    }
  }

  async function onDelete() {
    Alert.alert("Supprimer", "Supprimer cet évènement ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await apiAdminDeleteEvent(String(id));
            Alert.alert("OK", "Supprimé.");
            router.replace("/settings");
          } catch (e: any) {
            Alert.alert("Erreur", e?.message ?? "Suppression impossible.");
          }
        },
      },
    ]);
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
          Modifier évènement
        </Text>

        {loading ? (
          <View
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 18,
              backgroundColor: "#0F1A2C",
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.10)",
              alignItems: "center",
            }}
          >
            <ActivityIndicator />
            <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 10 }}>Chargement...</Text>
          </View>
        ) : !event ? (
          <View
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 18,
              backgroundColor: "#0F1A2C",
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.10)",
            }}
          >
            <Text style={{ color: "rgba(234,240,255,0.72)" }}>Évènement introuvable.</Text>
          </View>
        ) : (
          <>
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
                <Image source={{ uri: previewUri }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
              ) : (
                <View style={{ height: 120, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="image-outline" size={26} color="rgba(234,240,255,0.5)" />
                  <Text style={{ color: "rgba(234,240,255,0.6)", marginTop: 8 }}>Aucune image</Text>
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

            <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
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
                {uploadingImage ? <ActivityIndicator /> : <Ionicons name="image-outline" size={18} color="#EAF0FF" />}
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Changer image</Text>
              </Pressable>

              <Pressable
                onPress={togglePublish}
                disabled={isBusy}
                style={{
                  width: 140,
                  paddingVertical: 12,
                  borderRadius: 18,
                  backgroundColor: event.isPublished ? "rgba(255,255,255,0.06)" : "#2563EB",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                  opacity: isBusy ? 0.65 : 1,
                }}
              >
                <Ionicons name={event.isPublished ? "eye-off-outline" : "eye-outline"} size={18} color="#EAF0FF" />
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  {event.isPublished ? "Dépublier" : "Publier"}
                </Text>
              </Pressable>
            </View>

            {/* Info */}
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
              <Text style={{ color: "rgba(234,240,255,0.72)" }}>
                Statut :{" "}
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  {event.isPublished ? "Publié" : "Brouillon"}
                </Text>
              </Text>
              <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
                Dernière mise à jour : <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>{formatDT(event.updatedAt)}</Text>
              </Text>
            </View>

            {/* Fields */}
            <AdminField label="Nom" value={name} onChangeText={setName} placeholder="Ex: Conférence de prière" />
            <AdminField label="Lieu" value={place} onChangeText={setPlace} placeholder="Ex: Bruxelles" />
            <AdminField label="Adresse" value={address} onChangeText={setAddress} placeholder="Rue..." />
            <AdminField label="Thème" value={theme} onChangeText={setTheme} placeholder="Ex: Foi & Paix" />
            <AdminField label="Description" value={description} onChangeText={setDescription} multiline />

            <AdminField label="Image URL" value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." />

            <AdminField
              label="Date de début (YYYY-MM-DD HH:mm)"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2026-02-15 19:00"
            />
            <AdminField
              label="Date de fin (YYYY-MM-DD HH:mm)"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2026-02-15 21:00"
            />

            {/* Actions */}
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
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Enregistrer</Text>
            </Pressable>

            <Pressable
              onPress={onDelete}
              disabled={isBusy}
              style={{
                marginTop: 10,
                paddingVertical: 14,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
                opacity: isBusy ? 0.7 : 1,
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#EAF0FF" />
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Supprimer</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
