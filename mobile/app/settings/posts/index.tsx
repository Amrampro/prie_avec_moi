// mobile/app/settings/posts/index.tsx
import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router/react-navigation";
import { router } from "expo-router";

import {
  apiMyDeletePost,
  apiMyListPosts,
  apiMyPublishPost,
  apiMyUnpublishPost,
} from "../../../services/my.posts.api";

export default function MyPostsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);

  const load = useCallback(async () => {
    const res = await apiMyListPosts();
    setPosts(res.posts ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          setLoading(true);
          await load();
        } catch (e: any) {
          if (mounted) setPosts([]);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220", paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
      >
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>Mes posts</Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Tes publications (brouillons + publiés).
        </Text>

        <View style={{ marginTop: 14 }}>
          <Pressable
            onPress={() => router.push("/settings/posts/new")}
            style={{
              paddingVertical: 12,
              borderRadius: 18,
              backgroundColor: "#2563EB",
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="add" size={18} color="#EAF0FF" />
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Nouveau post</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          {loading ? (
            <View
              style={{
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
          ) : posts.length === 0 ? (
            <View
              style={{
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
              }}
            >
              <Text style={{ color: "rgba(234,240,255,0.72)" }}>Aucun post.</Text>
            </View>
          ) : (
            posts.map((p) => {
              const cover = p.images?.[0]?.imageUrl ?? null;
              const isPublished = !!p.isPublished;

              return (
                <View
                  key={p.id}
                  style={{
                    padding: 12,
                    borderRadius: 18,
                    backgroundColor: "#0F1A2C",
                    borderWidth: 1,
                    borderColor: "rgba(234,240,255,0.10)",
                  }}
                >
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {cover ? (
                      <Image source={{ uri: cover }} style={{ width: 72, height: 72, borderRadius: 16 }} />
                    ) : (
                      <View
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 16,
                          backgroundColor: "#0B1220",
                          borderWidth: 1,
                          borderColor: "rgba(234,240,255,0.10)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="image-outline" size={20} color="rgba(234,240,255,0.55)" />
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#EAF0FF", fontWeight: "900" }} numberOfLines={2}>
                        {p.text}
                      </Text>

                      <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }} numberOfLines={1}>
                        {isPublished ? "Publié" : "Brouillon"} •{" "}
                        {new Date(p.createdAt).toLocaleString("fr-FR")}
                      </Text>

                      <Text style={{ color: "rgba(234,240,255,0.55)", marginTop: 4, fontWeight: "800" }}>
                        ❤️ {p.likesCount ?? p._count?.likes ?? 0} • 💬 {p.commentsCount ?? p._count?.comments ?? 0}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 12, flexDirection: "row", gap: 10, alignItems: "center" }}>
                    <Pressable
                      onPress={() => router.push(`/settings/posts/${p.id}`)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 14,
                        backgroundColor: "#0B1220",
                        borderWidth: 1,
                        borderColor: "rgba(234,240,255,0.10)",
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <Ionicons name="eye-outline" size={16} color="#EAF0FF" />
                      <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Voir</Text>
                    </Pressable>

                    <Pressable
                      onPress={async () => {
                        try {
                          if (isPublished) await apiMyUnpublishPost(p.id);
                          else await apiMyPublishPost(p.id);
                          await load();
                        } catch (e: any) {
                          Alert.alert("Erreur", e?.message ?? "Action impossible");
                        }
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 14,
                        backgroundColor: "rgba(37,99,235,0.14)",
                        borderWidth: 1,
                        borderColor: "rgba(234,240,255,0.10)",
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <Ionicons name={isPublished ? "eye-off-outline" : "eye-outline"} size={16} color="#EAF0FF" />
                      <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                        {isPublished ? "Dépublier" : "Publier"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        Alert.alert("Supprimer", "Supprimer ce post ?", [
                          { text: "Annuler", style: "cancel" },
                          {
                            text: "Supprimer",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await apiMyDeletePost(p.id);
                                await load();
                              } catch (e: any) {
                                Alert.alert("Erreur", e?.message ?? "Suppression impossible");
                              }
                            },
                          },
                        ]);
                      }}
                      style={{
                        width: 54,
                        paddingVertical: 10,
                        borderRadius: 14,
                        backgroundColor: "rgba(255,255,255,0.06)",
                        borderWidth: 1,
                        borderColor: "rgba(234,240,255,0.10)",
                        alignItems: "center",
                        justifyContent: "center",
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
      </ScrollView>
    </View>
  );
}