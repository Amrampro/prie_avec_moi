// mobile/app/settings/posts/new.tsx
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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { AdminField } from "../../../components/AdminField";
import { apiMyCreatePost } from "../../../services/my.posts.api";
import { apiAdminUploadFile } from "../../../services/uploads.api"; // ✅ on réutilise ton endpoint upload existant

type PickedImage = {
  localUri: string;
  remoteUrl?: string;
  uploading?: boolean;
};

export default function MyPostNew() {
  const insets = useSafeAreaInsets();

  const [saving, setSaving] = useState(false);
  const [text, setText] = useState("");
  const [images, setImages] = useState<PickedImage[]>([]);

  const busy = saving || images.some((i) => i.uploading);

  const uploadedUrls = useMemo(
    () => images.filter((i) => !!i.remoteUrl).map((i) => i.remoteUrl as string),
    [images]
  );

  const canSave = text.trim().length > 0 && uploadedUrls.length >= 1 && !busy;

  const pickImages = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert("Permission", "Autorise l'accès à la galerie.");

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.9,
        selectionLimit: 10,
      });

      if (res.canceled) return;

      const next: PickedImage[] = res.assets.map((a) => ({ localUri: a.uri, uploading: false }));
      setImages((prev) => [...prev, ...next]);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de choisir les images.");
    }
  }, []);

  const uploadOne = useCallback(
    async (idx: number) => {
      const item = images[idx];
      if (!item) return;

      try {
        setImages((prev) => prev.map((it, i) => (i === idx ? { ...it, uploading: true } : it)));

        const name = `post_${Date.now()}_${idx}.jpg`;
        const mime = "image/jpeg";

        const up = await apiAdminUploadFile(item.localUri, name, mime);

        setImages((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, remoteUrl: up.file.url, uploading: false } : it))
        );
      } catch (e: any) {
        setImages((prev) => prev.map((it, i) => (i === idx ? { ...it, uploading: false } : it)));
        Alert.alert("Erreur", e?.message ?? "Upload image impossible.");
      }
    },
    [images]
  );

  const uploadAllMissing = useCallback(async () => {
    for (let i = 0; i < images.length; i++) {
      if (!images[i].remoteUrl) {
        // eslint-disable-next-line no-await-in-loop
        await uploadOne(i);
      }
    }
  }, [images, uploadOne]);

  const removeImage = useCallback((idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const onSave = useCallback(async () => {
    if (!text.trim()) return Alert.alert("Validation", "Le texte est obligatoire.");
    if (uploadedUrls.length < 1) return Alert.alert("Validation", "Ajoute au moins 1 image.");

    setSaving(true);
    try {
      const res = await apiMyCreatePost({
        text: text.trim(),
        images: uploadedUrls,
        isPublished: false,
      });

      Alert.alert("OK", "Post créé.");
      router.replace(`/settings/posts/${res.post.id}`);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de créer le post.");
    } finally {
      setSaving(false);
    }
  }, [text, uploadedUrls]);

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
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>Nouveau post</Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Minimum 1 image. Tu peux publier depuis la page détail.
        </Text>

        <AdminField label="Texte" value={text} onChangeText={setText} placeholder="Écris ton message..." multiline />

        <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={pickImages}
            disabled={busy}
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
              opacity: busy ? 0.65 : 1,
            }}
          >
            <Ionicons name="images-outline" size={18} color="#EAF0FF" />
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Choisir images</Text>
          </Pressable>

          <Pressable
            onPress={uploadAllMissing}
            disabled={busy || images.length === 0}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 18,
              backgroundColor: "#0B1220",
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.10)",
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: busy || images.length === 0 ? 0.5 : 1,
            }}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#EAF0FF" />
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Upload</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 12, gap: 10 }}>
          {images.length === 0 ? (
            <View
              style={{
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
              }}
            >
              <Text style={{ color: "rgba(234,240,255,0.72)" }}>Aucune image sélectionnée.</Text>
            </View>
          ) : (
            images.map((img, idx) => (
              <View
                key={`${img.localUri}-${idx}`}
                style={{
                  borderRadius: 18,
                  overflow: "hidden",
                  backgroundColor: "#0F1A2C",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                }}
              >
                <Image source={{ uri: img.localUri }} style={{ width: "100%", height: 180 }} />

                <View style={{ padding: 12, flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Image {idx + 1}</Text>
                    <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }} numberOfLines={1}>
                      {img.remoteUrl ? "Upload OK" : "Non uploadée"}
                    </Text>
                  </View>

                  {!img.remoteUrl ? (
                    <Pressable
                      onPress={() => uploadOne(idx)}
                      disabled={busy}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 14,
                        backgroundColor: "rgba(37,99,235,0.14)",
                        borderWidth: 1,
                        borderColor: "rgba(234,240,255,0.10)",
                        opacity: busy ? 0.6 : 1,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {img.uploading ? <ActivityIndicator /> : <Ionicons name="cloud-upload-outline" size={18} color="#EAF0FF" />}
                      <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Uploader</Text>
                    </Pressable>
                  ) : (
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 14,
                        backgroundColor: "rgba(37,99,235,0.12)",
                        borderWidth: 1,
                        borderColor: "rgba(234,240,255,0.10)",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#60A5FA" />
                      <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>OK</Text>
                    </View>
                  )}

                  <Pressable
                    onPress={() => removeImage(idx)}
                    disabled={busy}
                    style={{
                      width: 48,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: "rgba(234,240,255,0.10)",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EAF0FF" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        <Pressable
          onPress={onSave}
          disabled={!canSave}
          style={{
            marginTop: 16,
            paddingVertical: 14,
            borderRadius: 22,
            backgroundColor: "#2563EB",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 10,
            opacity: canSave ? 1 : 0.55,
          }}
        >
          {saving ? <ActivityIndicator /> : <Ionicons name="save-outline" size={18} color="#EAF0FF" />}
          <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Créer</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}