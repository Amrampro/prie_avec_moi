// mobile/app/settings/admin/posts/[id].tsx
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
import { useFocusEffect } from "expo-router/react-navigation";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { AdminField } from "../../../../components/AdminField";
import {
  apiAdminDeletePost,
  apiAdminGetPost,
  apiAdminPublishPost,
  apiAdminUnpublishPost,
  apiAdminUpdatePost,
} from "../../../../services/admin.posts.api";
import { apiAdminUploadFile } from "../../../../services/uploads.api";

type Img = { localUri: string; remoteUrl?: string; uploading?: boolean };

export default function AdminPostEdit() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [post, setPost] = useState<any>(null);

  const [text, setText] = useState("");
  const [images, setImages] = useState<Img[]>([]);

  const busy = loading || saving || images.some((i) => i.uploading);

  const uploadedUrls = useMemo(
    () => images.filter((i) => !!i.remoteUrl).map((i) => i.remoteUrl as string),
    [images]
  );

  const load = useCallback(async () => {
    if (!id) return;
    const res = await apiAdminGetPost(id);

    setPost(res.post);
    setText(res.post.text ?? "");

    const remoteImgs: Img[] =
      (res.post.images ?? []).map((img: any) => ({
        localUri: img.imageUrl, // for preview
        remoteUrl: img.imageUrl,
        uploading: false,
      })) ?? [];

    setImages(remoteImgs);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          setLoading(true);
          await load();
        } catch (e: any) {
          if (mounted) Alert.alert("Erreur", e?.message ?? "Impossible de charger la publication.");
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [load])
  );

  const isPublished = !!post?.isPublished;

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

      const next: Img[] = res.assets.map((a) => ({
        localUri: a.uri,
        uploading: false,
      }));

      setImages((prev) => [...prev, ...next]);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de choisir les images.");
    }
  }, []);

  const uploadOne = useCallback(
    async (idx: number) => {
      const item = images[idx];
      if (!item) return;

      if (item.remoteUrl && item.localUri === item.remoteUrl) {
        // already remote
        return;
      }

      try {
        setImages((prev) => prev.map((it, i) => (i === idx ? { ...it, uploading: true } : it)));

        const name = `post_${Date.now()}_${idx}.jpg`;
        const mime = "image/jpeg";

        const up = await apiAdminUploadFile(item.localUri, name, mime);

        setImages((prev) =>
          prev.map((it, i) =>
            i === idx ? { ...it, remoteUrl: up.file.url, uploading: false } : it
          )
        );
      } catch (e: any) {
        setImages((prev) => prev.map((it, i) => (i === idx ? { ...it, uploading: false } : it)));
        Alert.alert("Erreur", e?.message ?? "Upload impossible.");
      }
    },
    [images]
  );

  const uploadAllMissing = useCallback(async () => {
    for (let i = 0; i < images.length; i++) {
      if (!images[i].remoteUrl || images[i].remoteUrl !== images[i].localUri) {
        // eslint-disable-next-line no-await-in-loop
        await uploadOne(i);
      }
    }
  }, [images, uploadOne]);

  const removeImage = useCallback((idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const onSave = useCallback(async () => {
    if (!id) return;
    if (!text.trim()) return Alert.alert("Validation", "Le texte est obligatoire.");
    if (uploadedUrls.length < 1) return Alert.alert("Validation", "Au moins 1 image est requise.");

    setSaving(true);
    try {
      const res = await apiAdminUpdatePost(id, {
        text: text.trim(),
        images: uploadedUrls,
      });

      setPost(res.post);
      Alert.alert("OK", "Publication mise à jour.");
      router.replace("/settings/admin/posts");
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Mise à jour impossible.");
    } finally {
      setSaving(false);
    }
  }, [id, text, uploadedUrls]);

  const onTogglePublish = useCallback(async () => {
    if (!id) return;
    try {
      if (isPublished) await apiAdminUnpublishPost(id);
      else await apiAdminPublishPost(id);
      await load();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Action impossible");
    }
  }, [id, isPublished, load]);

  const onDelete = useCallback(() => {
    if (!id) return;

    Alert.alert("Supprimer", "Supprimer cette publication ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await apiAdminDeletePost(id);
            Alert.alert("OK", "Publication supprimée.");
            router.replace("/settings/admin/posts");
          } catch (e: any) {
            Alert.alert("Erreur", e?.message ?? "Suppression impossible.");
          }
        },
      },
    ]);
  }, [id]);

  const canSave = !busy && text.trim().length > 0 && uploadedUrls.length >= 1;

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
          Publication
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          {isPublished ? "Publié" : "Brouillon"} • {post?.id ?? ""}
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
          </View>
        ) : (
          <>
            <AdminField
              label="Texte"
              value={text}
              onChangeText={setText}
              placeholder="Texte de publication..."
              multiline
            />

            {/* actions */}
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
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  Ajouter images
                </Text>
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

            {/* images list */}
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
                  <Text style={{ color: "rgba(234,240,255,0.72)" }}>
                    Aucune image (minimum 1).
                  </Text>
                </View>
              ) : (
                images.map((img, idx) => {
                  const hasRemote = !!img.remoteUrl;
                  const label = hasRemote ? "OK" : "Non uploadée";

                  return (
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
                          <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                            Image {idx + 1}
                          </Text>
                          <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }} numberOfLines={1}>
                            {label}
                          </Text>
                        </View>

                        {!hasRemote ? (
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
                            {img.uploading ? (
                              <ActivityIndicator />
                            ) : (
                              <Ionicons name="cloud-upload-outline" size={18} color="#EAF0FF" />
                            )}
                            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                              Uploader
                            </Text>
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
                            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                              OK
                            </Text>
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
                  );
                })
              )}
            </View>

            {/* publish/unpublish + delete */}
            <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={onTogglePublish}
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
                <Ionicons
                  name={isPublished ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#EAF0FF"
                />
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  {isPublished ? "Dépublier" : "Publier"}
                </Text>
              </Pressable>

              <Pressable
                onPress={onDelete}
                disabled={busy}
                style={{
                  width: 62,
                  paddingVertical: 12,
                  borderRadius: 18,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: busy ? 0.65 : 1,
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#EAF0FF" />
              </Pressable>
            </View>

            <Pressable
              onPress={onSave}
              disabled={!canSave}
              style={{
                marginTop: 14,
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
              {saving ? (
                <ActivityIndicator />
              ) : (
                <Ionicons name="save-outline" size={18} color="#EAF0FF" />
              )}
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                Enregistrer
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
