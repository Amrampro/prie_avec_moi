import { PremiumBadge } from "../../components/PremiumBadge";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router/react-navigation";
import {
  apiCreatePostComment,
  apiLikePost,
  apiListPostComments,
  apiPostDetail,
  apiUnlikePost,
} from "../../services/posts.api";
import { useAuthStore } from "../../stores/auth.store";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  // Image viewer (facebook-like)
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // ✅ Scroll ref (pour remonter quand clavier arrive)
  const scrollRef = useRef<ScrollView | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [p, c] = await Promise.all([apiPostDetail(id), apiListPostComments(id)]);
    setPost(p.post);
    setComments(c.comments ?? []);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const showSub = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
        () => {
          setKeyboardOpen(true);
          // petit délai pour laisser le layout se recalculer
          setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
          }, 80);
        }
      );

      const hideSub = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
        () => setKeyboardOpen(false)
      );

      (async () => {
        try {
          setLoading(true);
          await load();
        } catch (e: any) {
          if (mounted) Alert.alert("Erreur", e?.message ?? "Impossible de charger.");
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
        showSub.remove();
        hideSub.remove();
      };
    }, [load])
  );

  const coverImages = useMemo(() => post?.images ?? [], [post]);

  async function onToggleLike() {
    if (!post?.id) return;
    if (!user) {
      Alert.alert(
        "Connexion requise",
        "Pour aimer une publication, tu dois être connecté.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Se connecter", onPress: () => router.push("/sign-in") },
        ],
      );
      return;
    }

    try {
      const nextLiked = !post.isLikedByMe;

      // optimistic
      setPost((prev: any) =>
        prev
          ? {
              ...prev,
              isLikedByMe: nextLiked,
              likesCount: Math.max(0, (prev.likesCount ?? 0) + (nextLiked ? 1 : -1)),
            }
          : prev
      );

      if (nextLiked) await apiLikePost(post.id);
      else await apiUnlikePost(post.id);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Action impossible.");
      await load();
    }
  }

  async function onSendComment() {
    if (!id) return;
    if (!user) {
      Alert.alert(
        "Connexion requise",
        "Pour commenter une publication, tu dois être connecté.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Se connecter", onPress: () => router.push("/sign-in") },
        ],
      );
      return;
    }
    if (!commentText.trim()) return;

    setSending(true);
    try {
      const res = await apiCreatePostComment(id, { text: commentText.trim() });
      setComments((prev) => [...prev, res.comment]);
      setCommentText("");

      setPost((prev: any) =>
        prev ? { ...prev, commentsCount: (prev.commentsCount ?? 0) + 1 } : prev
      );

      // ✅ après envoi, on descend (optionnel mais agréable)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Commentaire impossible.");
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220", paddingTop: insets.top }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // ✅ important pour ne pas cacher l’input sous la barre header
        keyboardVerticalOffset={insets.top + 12}
      >
        <ScrollView
          ref={(r) => {
            scrollRef.current = r;
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 16,
            // ✅ si clavier ouvert, on ajoute un peu plus de marge en bas
            paddingBottom: insets.bottom + (keyboardOpen ? 260 : 140),
          }}
        >
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
            </View>
          ) : !post ? (
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Publication introuvable.</Text>
          ) : (
            <>
              {/* Images carousel (tap -> fullscreen viewer) */}
              {coverImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {coverImages.map((img: any, index: number) => (
                      <Pressable
                        key={img.id}
                        onPress={() => {
                          setViewerIndex(index);
                          setViewerOpen(true);
                        }}
                        style={{
                          width: 280,
                          height: 180,
                          borderRadius: 18,
                          overflow: "hidden",
                          backgroundColor: "#0B1220",
                          borderWidth: 1,
                          borderColor: "rgba(234,240,255,0.10)",
                        }}
                      >
                        <Image
                          source={{ uri: img.imageUrl }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="contain"
                        />
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              )}

              {/* Text + like */}
              <View
                style={{
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: "#0F1A2C",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                }}
              >
                <Text style={{ color: "#EAF0FF", fontWeight: "900", lineHeight: 20 }}>{post.text}</Text>

                <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Pressable
                    onPress={onToggleLike}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: post.isLikedByMe ? "rgba(37,99,235,0.18)" : "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: "rgba(234,240,255,0.10)",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons
                      name={post.isLikedByMe ? "heart" : "heart-outline"}
                      size={18}
                      color={post.isLikedByMe ? "#60A5FA" : "#EAF0FF"}
                    />
                    <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>{post.likesCount ?? 0}</Text>
                  </Pressable>

                  <View style={{ flex: 1 }} />

                  <Text style={{ color: "rgba(234,240,255,0.55)", fontWeight: "800", fontSize: 12 }}>
                    {new Date(post.createdAt).toLocaleString("fr-FR")}
                  </Text>
                </View>
              </View>

              {/* Comment input */}
              <View
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 18,
                  backgroundColor: "#0F1A2C",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                }}
              >
                <Text style={{ color: "rgba(234,240,255,0.72)", fontWeight: "800", marginBottom: 8 }}>
                  Ajouter un commentaire
                </Text>

                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder={user ? "Écris ici..." : "Connecte-toi pour commenter"}
                  placeholderTextColor="rgba(234,240,255,0.35)"
                  editable={!!user && !sending}
                  multiline
                  onFocus={() => {
                    // ✅ quand l’input est focus, on descend pour le rendre visible
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
                  }}
                  style={{
                    minHeight: 44,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: "#0B1220",
                    borderWidth: 1,
                    borderColor: "rgba(234,240,255,0.10)",
                    color: "#EAF0FF",
                    textAlignVertical: "top",
                  }}
                />

                <Pressable
                  onPress={onSendComment}
                  disabled={!user || sending || !commentText.trim()}
                  style={{
                    marginTop: 10,
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: "#2563EB",
                    alignItems: "center",
                    opacity: !user || sending || !commentText.trim() ? 0.5 : 1,
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {sending ? <ActivityIndicator /> : <Ionicons name="send-outline" size={18} color="#EAF0FF" />}
                  <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>Commenter</Text>
                </Pressable>
              </View>

              {/* Comments */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  Commentaires ({post.commentsCount ?? comments.length})
                </Text>

                <View style={{ marginTop: 10, gap: 10 }}>
                  {comments.length === 0 ? (
                    <View
                      style={{
                        padding: 14,
                        borderRadius: 18,
                        backgroundColor: "#0F1A2C",
                        borderWidth: 1,
                        borderColor: "rgba(234,240,255,0.10)",
                      }}
                    >
                      <Text style={{ color: "rgba(234,240,255,0.72)" }}>Aucun commentaire.</Text>
                    </View>
                  ) : (
                    comments.map((c) => (
                      <View
                        key={c.id}
                        style={{
                          padding: 12,
                          borderRadius: 18,
                          backgroundColor: "#0F1A2C",
                          borderWidth: 1,
                          borderColor: "rgba(234,240,255,0.10)",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <Image
                            source={{
                              uri: c.user?.avatarUrl ?? "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                            }}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 17,
                              borderWidth: 1,
                              borderColor: "rgba(234,240,255,0.10)",
                              backgroundColor: "#0B1220",
                            }}
                          />

                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Text style={{ color: "#EAF0FF", fontWeight: "900" }} numberOfLines={1}>
                                {c.user?.fullName ?? "Utilisateur"}
                              </Text>

                              <PremiumBadge account={c.user} size={14} />
                            </View>

                            <Text style={{ color: "rgba(234,240,255,0.45)", fontSize: 12, marginTop: 2 }}>
                              {new Date(c.createdAt).toLocaleString("fr-FR")}
                            </Text>
                          </View>
                        </View>

                        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 10 }}>{c.text}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </>
          )}

          {/* Fullscreen image viewer */}
          <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)" }}>
              <View
                style={{
                  paddingTop: insets.top + 10,
                  paddingHorizontal: 14,
                  paddingBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "800" }}>
                  {viewerIndex + 1} / {coverImages.length}
                </Text>

                <Pressable
                  onPress={() => setViewerOpen(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="close" size={22} color="#fff" />
                </Pressable>
              </View>

              <FlatList
                data={coverImages}
                horizontal
                pagingEnabled
                initialScrollIndex={viewerIndex}
                getItemLayout={(_, index) => ({
                  length: SCREEN_WIDTH,
                  offset: SCREEN_WIDTH * index,
                  index,
                })}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setViewerIndex(idx);
                }}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View
                    style={{
                      width: SCREEN_WIDTH,
                      height: SCREEN_HEIGHT - (insets.top + 60),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Image source={{ uri: item.imageUrl }} style={{ width: SCREEN_WIDTH, height: "100%" }} resizeMode="contain" />
                  </View>
                )}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
