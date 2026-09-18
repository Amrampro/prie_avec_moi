import { PremiumBadge } from "../../components/PremiumBadge";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router/react-navigation";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiListPosts, apiLikePost, apiUnlikePost } from "../../services/posts.api";
import { FeedSkeleton } from "../../components/PostSkeleton";
import { useAuthStore } from "../../stores/auth.store";

const { width } = Dimensions.get("window");

// ✅ Hauteur max autorisée (comme avant)
const POST_IMAGE_MAX_HEIGHT = width * (5 / 4);
const PAGE_SIZE = 20;

/**
 * Charge les tailles des images et calcule leurs hauteurs (à largeur fixe).
 */
function useImagesComputedHeights(images: { id: string; imageUrl: string }[], fixedWidth: number) {
  const [heightsById, setHeightsById] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    setReady(false);
    setHeightsById({});

    if (!images?.length) {
      setReady(true);
      return;
    }

    const tasks = images.map(
      (img) =>
        new Promise<void>((resolve) => {
          Image.getSize(
            img.imageUrl,
            (w, h) => {
              if (!mounted) return resolve();
              if (w > 0 && h > 0) {
                const computed = Math.round(fixedWidth * (h / w));
                setHeightsById((prev) => ({ ...prev, [img.id]: computed }));
              }
              resolve();
            },
            () => {
              // si erreur => ignore, on ne bloque pas
              resolve();
            }
          );
        })
    );

    Promise.all(tasks).then(() => {
      if (!mounted) return;
      setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, [images, fixedWidth]);

  const maxComputedHeight = useMemo(() => {
    const vals = Object.values(heightsById);
    return vals.length ? Math.max(...vals) : null;
  }, [heightsById]);

  return { heightsById, maxComputedHeight, ready };
}

/**
 * ✅ Affichage image selon la logique:
 * - width 100%
 * - si computedHeight >= containerHeight => cover (crop vertical possible)
 * - sinon contain (letterbox si containerHeight > computedHeight)
 * - tant que pas prêt => contain + containerHeight (évite crop largeur)
 */
function SmartPostImage({
  uri,
  containerHeight,
  computedHeight,
  fixedWidth,
  isGallery,
  galleryBackgroundColor = "#000",
  forceLoadingSafe = false,
}: {
  uri: string;
  containerHeight: number;
  computedHeight: number | null; // hauteur à largeur fixe
  fixedWidth: number;
  isGallery: boolean;
  galleryBackgroundColor?: string;
  forceLoadingSafe?: boolean;
}) {
  // ✅ tant que les tailles ne sont pas connues, ne JAMAIS mettre cover
  const resizeMode: "contain" | "cover" = useMemo(() => {
    if (forceLoadingSafe) return "contain";
    if (!computedHeight) return "contain";
    return computedHeight >= containerHeight ? "cover" : "contain";
  }, [forceLoadingSafe, computedHeight, containerHeight]);

  const backgroundColor = useMemo(() => {
    if (!isGallery) return "transparent";
    return resizeMode === "contain" ? galleryBackgroundColor : "transparent";
  }, [isGallery, resizeMode, galleryBackgroundColor]);

  return (
    <View style={{ width: fixedWidth, height: containerHeight, backgroundColor }}>
      <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode={resizeMode} />
    </View>
  );
}

const PostCard = ({
  post,
  onToggleLike,
}: {
  post: any;
  onToggleLike: (postId: string, currentlyLiked: boolean) => void;
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const images = Array.isArray(post.images) ? post.images : [];
  const isGallery = images.length > 1;

  const { heightsById, maxComputedHeight, ready } = useImagesComputedHeights(images, width);

  // ✅ NOUVELLE règle:
  // hauteur du carousel = min(maxHeight, hauteur max des images du post)
  // => si la plus haute image est moins haute que maxHeight, le container shrink => pas de noir sur elle
  const galleryContainerHeight = useMemo(() => {
    if (!isGallery) return null;
    if (!ready || !maxComputedHeight) return POST_IMAGE_MAX_HEIGHT; // fallback pendant loading
    return Math.min(POST_IMAGE_MAX_HEIGHT, maxComputedHeight);
  }, [isGallery, ready, maxComputedHeight]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== activeImageIndex) setActiveImageIndex(slide);
  };

  const formattedDate = new Date(post.createdAt || Date.now()).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <View style={{ marginBottom: 20, backgroundColor: "#0B1220" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 12, gap: 10 }}>
        <Image
          source={{ uri: post.author?.avatarUrl ?? "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
          style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: "rgba(234,240,255,0.1)" }}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={{ color: "#EAF0FF", fontWeight: "800", fontSize: 15 }}>
              {post.author?.fullName ?? "Utilisateur"}
            </Text>
            <PremiumBadge account={post.author} size={14} />
          </View>
          <Text style={{ color: "rgba(234,240,255,0.5)", fontSize: 11 }}>{formattedDate}</Text>
        </View>
      </View>

      {/* Texte */}
      <Pressable onPress={() => setExpanded(!expanded)} style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
        <Text style={{ color: "#EAF0FF", fontSize: 14, lineHeight: 20 }} numberOfLines={expanded ? undefined : 3}>
          {!expanded && (post.text?.length ?? 0) > 100 ? (
            <>
              {post.text.slice(0, 100)}
              <Text style={{ color: "#fff", fontWeight: "600", fontStyle: "italic" }}>... voir plus</Text>
            </>
          ) : expanded && (post.text?.length ?? 0) > 100 ? (
            <>
              {post.text}
              <Text style={{ color: "#fff", fontWeight: "600", fontStyle: "italic" }}> {" "}...voir moins</Text>
            </>
          ) : (
            post.text
          )}
        </Text>
      </Pressable>

      {/* ✅ Images */}
      {images.length ? (
        <View>
          {/* Single image: shrink si plus petite, sinon maxHeight + crop vertical */}
          {!isGallery ? (
            (() => {
              const img = images[0];
              const computed = heightsById[img.id] ?? null;

              // hauteur single = min(max, computed) sinon fallback
              const containerHeight =
                computed && ready ? Math.min(POST_IMAGE_MAX_HEIGHT, computed) : POST_IMAGE_MAX_HEIGHT;

              return (
                <View style={{ width, height: containerHeight }}>
                  <Image
                    source={{ uri: img.imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    // ✅ si computed > container => cover (crop vertical), sinon contain
                    resizeMode={!ready || !computed ? "contain" : computed >= containerHeight ? "cover" : "contain"}
                  />
                </View>
              );
            })()
          ) : (
            <>
              {/* Gallery: container = hauteur max des images (cap maxHeight) */}
              <FlatList
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <SmartPostImage
                    uri={item.imageUrl}
                    fixedWidth={width}
                    isGallery={true}
                    containerHeight={galleryContainerHeight ?? POST_IMAGE_MAX_HEIGHT}
                    computedHeight={heightsById[item.id] ?? null}
                    galleryBackgroundColor="#000"
                    // ✅ tant que pas prêt => contain safe (pas de crop largeur)
                    forceLoadingSafe={!ready}
                  />
                )}
              />

              {/* Dots */}
              <View style={{ flexDirection: "row", justifyContent: "center", position: "absolute", bottom: 15, width: "100%" }}>
                {images.map((_: any, i: number) => (
                  <View
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i === activeImageIndex ? "#60A5FA" : "rgba(255,255,255,0.4)",
                      marginHorizontal: 3,
                    }}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      ) : null}

      {/* Actions */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 12, gap: 18 }}>
        <Pressable
          onPress={() => onToggleLike(post.id, Boolean(post.isLikedByMe))}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Ionicons name={post.isLikedByMe ? "heart" : "heart-outline"} size={26} color={post.isLikedByMe ? "#FF3B30" : "#EAF0FF"} />
          <Text style={{ color: "rgba(234,240,255,0.8)", fontWeight: "700" }}>
            {post.likesCount ?? 0}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push(`/post/${post.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="chatbubble-outline" size={24} color="#EAF0FF" />
          <Text style={{ color: "rgba(234,240,255,0.8)", fontWeight: "700" }}>
            {post.commentsCount ?? 0}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [posts, setPosts] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<null | { cursorId: string; cursorCreatedAt: string }>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async () => {
    const res = await apiListPosts({ limit: PAGE_SIZE });
    setPosts(res.posts ?? []);
    setNextCursor(res.nextCursor ?? null);
    setHasMore(Boolean(res.nextCursor));
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await apiListPosts({
        limit: PAGE_SIZE,
        cursorId: nextCursor.cursorId,
        cursorCreatedAt: nextCursor.cursorCreatedAt,
      });

      setPosts((prev) => [...prev, ...(res.posts ?? [])]);
      setNextCursor(res.nextCursor ?? null);
      setHasMore(Boolean(res.nextCursor));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextCursor]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitial();
    } finally {
      setRefreshing(false);
    }
  }, [loadInitial]);

  const onToggleLike = useCallback(async (postId: string, currentlyLiked: boolean) => {
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

    // optimistic UI
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLikedByMe: !currentlyLiked,
              likesCount: Math.max(0, (p.likesCount ?? 0) + (!currentlyLiked ? 1 : -1)),
            }
          : p
      )
    );

    try {
      const res = currentlyLiked ? await apiUnlikePost(postId) : await apiLikePost(postId);

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isLikedByMe: res.isLikedByMe, likesCount: res.likesCount } : p))
      );
    } catch (e) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLikedByMe: currentlyLiked,
                likesCount: Math.max(0, (p.likesCount ?? 0) + (currentlyLiked ? 1 : -1)),
              }
            : p
        )
      );
      console.error(e);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        setLoading(true);
        try {
          await loadInitial();
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [loadInitial])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220" }}>
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 16,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(234,240,255,0.05)",
        }}
      >
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>Actualités</Text>
      </View>

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(i) => String(i)}
          renderItem={() => <FeedSkeleton count={1} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} onToggleLike={onToggleLike} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingTop: 10 }}>
                <FeedSkeleton count={2} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
