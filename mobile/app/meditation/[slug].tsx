// app/meditation/[slug].tsx

import { useFocusEffect } from "expo-router/react-navigation";
import { API_BASE_URL } from "../../constants/api";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Share,
  Alert,
  Platform,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";

import { apiMeditationDetail } from "../../services/meditations.api";

import {
  apiAddFavorite,
  apiListFavorites,
  apiRemoveFavorite,
} from "../../services/favorites.api";

import { useAuthStore } from "../../stores/auth.store";

/* =========================================================
   HELPERS
========================================================= */

function formatSeconds(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;

  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/* =========================================================
   SCREEN
========================================================= */

export default function MeditationDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const token = useAuthStore((s) => s.token);

  /* =========================================================
     GENERAL
  ========================================================= */

  const [premiumRequired, setPremiumRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [meditation, setMeditation] = useState<any>(null);

  /* =========================================================
     FAVORITES
  ========================================================= */

  const [favLoading, setFavLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  /* =========================================================
     AUDIO
  ========================================================= */

  const [speed, setSpeed] = useState<1 | 1.25 | 1.5 | 2>(1);

  /*
   * Avec expo-audio, le player est automatiquement
   * libéré lorsque le composant est démonté.
   */
  const player = useAudioPlayer(null, {
    updateInterval: 250,
  });

  /*
   * Permet de suivre automatiquement :
   * - position
   * - durée
   * - lecture/pause
   * - chargement
   */
  const audioStatus = useAudioPlayerStatus(player);

  const audioReady = Boolean(audioStatus.isLoaded);

  const isPlaying = Boolean(audioStatus.playing);

  const positionSec = audioStatus.currentTime ?? 0;

  const durationSec = audioStatus.duration ?? 0;

  /*
   * Sur le Web, lorsqu'on génère un URL.createObjectURL(),
   * on garde sa référence pour pouvoir la supprimer ensuite.
   */
  const blobUrlRef = useRef<string | null>(null);

  /* =========================================================
     AUDIO URL
  ========================================================= */

  const audioUrl = meditation?.audioUrl?.startsWith("/")
    ? `${API_BASE_URL}${meditation.audioUrl}`
    : meditation?.audioUrl ?? null;

  /* =========================================================
     PROGRESS
  ========================================================= */

  const progress = useMemo(() => {
    if (!durationSec) {
      return 0;
    }

    return Math.min(
      1,
      Math.max(0, positionSec / durationSec),
    );
  }, [positionSec, durationSec]);

  /* =========================================================
     LOAD MEDITATION
  ========================================================= */

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          setLoading(true);
          setMeditation(null);
          setPremiumRequired(false);

          const res = await apiMeditationDetail(
            String(slug),
          );

          if (!mounted) {
            return;
          }

          setMeditation(res.meditation);

          /*
           * Vérification favoris
           */
          try {
            if (!token) {
              setIsFavorite(false);
              return;
            }

            const favs = await apiListFavorites();

            if (!mounted) {
              return;
            }

            const found = favs.favorites?.some(
              (f) =>
                f.meditation?.id ===
                res.meditation?.id,
            );

            setIsFavorite(Boolean(found));
          } catch {
            setIsFavorite(false);
          }
        } catch (e: any) {
          console.log(
            "Meditation detail error:",
            e?.message,
          );

          if (mounted) {
            setMeditation(null);

            setPremiumRequired(
              e?.code === "PREMIUM_REQUIRED",
            );
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      })();

      return () => {
        mounted = false;

        setMeditation(null);

        /*
         * On arrête l'audio lorsqu'on quitte la page.
         */
        try {
          player.pause();
        } catch {}
      };
    }, [slug, token, player]),
  );

  /* =========================================================
     AUDIO MODE
  ========================================================= */

  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,

          /*
           * Important pour iPhone :
           * permet de jouer même si l'iPhone
           * est en mode silencieux.
           */
          playsInSilentMode: true,

          /*
           * Pour le moment, comme ton ancien code,
           * on ne laisse pas jouer en arrière-plan.
           */
          shouldPlayInBackground: false,

          /*
           * Baisse le volume des autres applications.
           */
          interruptionMode: "duckOthers",
        });
      } catch (error) {
        console.log(
          "Audio mode error:",
          error,
        );
      }
    })();
  }, []);

  /* =========================================================
     LOAD AUDIO
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const abortController =
      new AbortController();

    /*
     * Supprimer ancien blob éventuel.
     */
    if (blobUrlRef.current) {
      URL.revokeObjectURL(
        blobUrlRef.current,
      );

      blobUrlRef.current = null;
    }

    /*
     * Arrêter l'ancien audio.
     */
    try {
      player.pause();
    } catch {}

    /*
     * Enlever l'ancienne source.
     */
    try {
      player.replace(null);
    } catch {}

    if (!audioUrl) {
      return () => {
        abortController.abort();
      };
    }

    (async () => {
      try {
        /* =====================================================
           WEB + PREMIUM

           On garde exactement ta logique de sécurité :
           récupération du fichier avec Authorization Bearer
           puis création d'un Blob URL.
        ===================================================== */

        if (
          Platform.OS === "web" &&
          meditation?.isPremium
        ) {
          const response = await fetch(
            audioUrl,
            {
              headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {},

              signal:
                abortController.signal,
            },
          );

          if (!response.ok) {
            if (
              response.status === 403 &&
              !cancelled
            ) {
              setMeditation(null);
              setPremiumRequired(true);
            }

            throw new Error(
              "Accès audio refusé.",
            );
          }

          const blob =
            await response.blob();

          if (cancelled) {
            return;
          }

          const blobUrl =
            URL.createObjectURL(blob);

          blobUrlRef.current =
            blobUrl;

          /*
           * Charger le Blob dans expo-audio.
           */
          player.replace({
            uri: blobUrl,
          });

          return;
        }

        /* =====================================================
           ANDROID / IOS / AUDIO NORMAL
        ===================================================== */

        const headers: Record<
          string,
          string
        > = {};

        /*
         * Pour les méditations Premium,
         * le token est envoyé au backend.
         */
        if (
          meditation?.isPremium &&
          token
        ) {
          headers.Authorization =
            `Bearer ${token}`;
        }

        player.replace({
          uri: audioUrl,

          ...(Object.keys(headers)
            .length > 0
            ? { headers }
            : {}),
        });
      } catch (e: any) {
        /*
         * Abort est normal lorsque l'utilisateur
         * quitte la page.
         */
        if (
          e?.name === "AbortError"
        ) {
          return;
        }

        console.log(
          "Audio load error:",
          e?.message,
        );
      }
    })();

    return () => {
      cancelled = true;

      abortController.abort();

      try {
        player.pause();
      } catch {}

      /*
       * Nettoyage Blob Web.
       */
      if (blobUrlRef.current) {
        URL.revokeObjectURL(
          blobUrlRef.current,
        );

        blobUrlRef.current = null;
      }
    };
  }, [
    audioUrl,
    token,
    meditation?.isPremium,
    player,
  ]);

  /* =========================================================
     PLAYBACK SPEED
  ========================================================= */

  useEffect(() => {
    try {
      player.playbackRate = speed;

      /*
       * Évite que la voix devienne trop aiguë
       * lorsqu'on accélère.
       */
      player.shouldCorrectPitch = true;
    } catch (error) {
      console.log(
        "Playback rate error:",
        error,
      );
    }
  }, [speed, player]);

  /* =========================================================
     PLAYER ERROR
  ========================================================= */

  useEffect(() => {
    if (audioStatus.error) {
      console.log(
        "Audio player error:",
        audioStatus.error,
      );
    }
  }, [audioStatus.error]);

  /* =========================================================
     PLAY / PAUSE
  ========================================================= */

  function togglePlay() {
    try {
      if (!audioReady) {
        return;
      }

      if (isPlaying) {
        player.pause();
      } else {
        /*
         * Si l'audio est arrivé à la fin,
         * on recommence au début.
         */
        if (
          durationSec > 0 &&
          positionSec >=
            durationSec - 0.2
        ) {
          player
            .seekTo(0)
            .then(() => {
              player.play();
            })
            .catch(() => {});

          return;
        }

        player.play();
      }
    } catch (e: any) {
      Alert.alert(
        "Audio",
        e?.message ??
          "Impossible de lire l'audio.",
      );
    }
  }

  /* =========================================================
     SEEK TO FRACTION
  ========================================================= */

  async function seekToFraction(
    f: number,
  ) {
    try {
      if (
        !audioReady ||
        !durationSec
      ) {
        return;
      }

      const fraction = Math.min(
        1,
        Math.max(0, f),
      );

      const seconds =
        durationSec * fraction;

      await player.seekTo(seconds);
    } catch (error) {
      console.log(
        "Seek error:",
        error,
      );
    }
  }

  /* =========================================================
     SEEK +/- 10 SECONDS
  ========================================================= */

  async function seekBy(
    deltaSec: number,
  ) {
    try {
      if (!audioReady) {
        return;
      }

      const next = Math.max(
        0,
        Math.min(
          durationSec || Infinity,
          positionSec + deltaSec,
        ),
      );

      await player.seekTo(next);
    } catch (error) {
      console.log(
        "Seek error:",
        error,
      );
    }
  }

  /* =========================================================
     FAVORITES
  ========================================================= */

  async function onToggleFavorite() {
    if (!meditation?.id) {
      return;
    }

    if (!token) {
      Alert.alert(
        "Connexion requise",
        "Pour ajouter cette méditation aux favoris, tu dois être connecté.",
        [
          {
            text: "Annuler",
            style: "cancel",
          },
          {
            text: "Se connecter",
            onPress: () =>
              router.push("/sign-in"),
          },
        ],
      );

      return;
    }

    setFavLoading(true);

    try {
      if (isFavorite) {
        await apiRemoveFavorite(
          meditation.id,
        );

        setIsFavorite(false);
      } else {
        await apiAddFavorite(
          meditation.id,
        );

        setIsFavorite(true);
      }
    } catch (e: any) {
      Alert.alert(
        "Favoris",
        e?.message ??
          "Erreur favoris.",
      );
    } finally {
      setFavLoading(false);
    }
  }

  /* =========================================================
     SHARE
  ========================================================= */

  async function onShare() {
    try {
      const title =
        meditation?.title ??
        "Méditation";

      const body =
        meditation?.bodyText ?? "";

      const footer =
        meditation?.footerText ?? "";

      const text =
        meditation?.isPremium
          ? `${title} — Prie avec moi (Premium)`
          : `${title}\n\n${body}\n\n${footer}\n\n— Prie avec moi`;

      await Share.share({
        message: text,
      });
    } catch {}
  }

  /* =========================================================
     DATA
  ========================================================= */

  const coverUri =
    meditation?.imageUrl ??
    "https://picsum.photos/seed/meditation/900/900";

  const title =
    meditation?.title ??
    "Méditation";

  const bodyText =
    meditation?.bodyText ?? "";

  const footerText =
    meditation?.footerText ?? "";

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor:
            "#0B1220",
          alignItems: "center",
          justifyContent:
            "center",
        }}
      >
        <ActivityIndicator />

        <Text
          style={{
            color:
              "rgba(234,240,255,0.72)",
            marginTop: 10,
          }}
        >
          Chargement...
        </Text>
      </View>
    );
  }

  /* =========================================================
     PREMIUM REQUIRED
  ========================================================= */

  if (premiumRequired) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor:
            "#0B1220",
          justifyContent:
            "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            color: "#FBBF24",
            fontSize: 22,
            fontWeight: "900",
          }}
        >
          Méditation Premium
        </Text>

        <Text
          style={{
            color: "#EAF0FF",
            marginTop: 12,
          }}
        >
          Cette méditation est
          réservée aux utilisateurs
          Premium.
        </Text>

        <Pressable
          onPress={() =>
            router.push(
              "/settings/premium",
            )
          }
          style={{
            marginTop: 20,
            backgroundColor:
              "#2563EB",
            padding: 16,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "800",
            }}
          >
            Activer Premium
          </Text>
        </Pressable>
      </View>
    );
  }

  /* =========================================================
     MEDITATION NOT FOUND
  ========================================================= */

  if (!meditation) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor:
            "#0B1220",
          alignItems: "center",
          justifyContent:
            "center",
          padding: 16,
        }}
      >
        <Text
          style={{
            color: "#EAF0FF",
            fontWeight: "900",
          }}
        >
          Méditation introuvable.
        </Text>

        <Text
          style={{
            color:
              "rgba(234,240,255,0.72)",
            marginTop: 6,
          }}
        >
          Vérifie le lien.
        </Text>
      </View>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <View
      style={{
        flex: 1,
        backgroundColor:
          "#0B1220",
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 28,
        }}
      >
        {/* ================================
            IMAGE
        ================================= */}

        <View
          style={{
            borderRadius: 18,
            overflow: "hidden",
            borderWidth: 1,
            borderColor:
              "rgba(234,240,255,0.10)",
            backgroundColor:
              "#0F1A2C",
          }}
        >
          <Image
            source={{
              uri: coverUri,
            }}
            style={{
              width: "100%",
              height: 280,
            }}
          />
        </View>

        {/* ================================
            TITLE
        ================================= */}

        <Text
          style={{
            color: "#EAF0FF",
            fontSize: 22,
            fontWeight: "900",
            marginTop: 14,
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            color:
              "rgba(234,240,255,0.72)",
            marginTop: 6,
          }}
        >
          Audio •{" "}
          {meditation?.audioDuration ??
            (durationSec
              ? formatSeconds(
                  durationSec,
                )
              : "—")}
        </Text>

        {/* ================================
            AUDIO PLAYER
        ================================= */}

        <View
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 22,
            backgroundColor:
              "rgba(15,26,44,0.92)",
            borderWidth: 1,
            borderColor:
              "rgba(234,240,255,0.10)",
          }}
        >
          {/* TOP ROW */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent:
                "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  backgroundColor:
                    "rgba(37,99,235,0.14)",
                  borderWidth: 1,
                  borderColor:
                    "rgba(234,240,255,0.10)",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <Ionicons
                  name="headset-outline"
                  size={18}
                  color="#EAF0FF"
                />
              </View>

              <View>
                <Text
                  style={{
                    color:
                      "#EAF0FF",
                    fontWeight:
                      "900",
                  }}
                >
                  Audio
                </Text>

                <Text
                  style={{
                    color:
                      "rgba(234,240,255,0.72)",
                    marginTop: 2,
                    fontSize: 12,
                  }}
                >
                  {audioStatus.error
                    ? "Erreur audio"
                    : audioReady
                      ? "Prêt à écouter"
                      : audioUrl
                        ? "Chargement audio..."
                        : "Aucun audio"}
                </Text>
              </View>
            </View>

            {/* SPEED */}

            <Pressable
              onPress={() => {
                const next =
                  speed === 1
                    ? 1.25
                    : speed ===
                        1.25
                      ? 1.5
                      : speed ===
                          1.5
                        ? 2
                        : 1;

                setSpeed(next);
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor:
                  "#0B1220",
                borderWidth: 1,
                borderColor:
                  "rgba(234,240,255,0.10)",
                opacity:
                  audioReady
                    ? 1
                    : 0.6,
              }}
              disabled={!audioReady}
            >
              <Text
                style={{
                  color:
                    "#60A5FA",
                  fontWeight:
                    "900",
                }}
              >
                {speed}x
              </Text>
            </Pressable>
          </View>

          {/* ================================
              PROGRESS
          ================================= */}

          <View
            style={{
              marginTop: 14,
            }}
          >
            <Pressable
              onPress={() => {
                if (!audioReady) {
                  return;
                }

                /*
                 * Même comportement que ton
                 * ancien lecteur :
                 * +12% au clic.
                 */
                seekToFraction(
                  Math.min(
                    1,
                    progress + 0.12,
                  ),
                );
              }}
              style={{
                height: 8,
                borderRadius: 999,
                backgroundColor:
                  "rgba(234,240,255,0.14)",
                overflow: "hidden",
              }}
            >
              {/* PROGRESS BAR */}

              <View
                style={{
                  width: `${Math.round(
                    progress * 100,
                  )}%`,
                  height: "100%",
                  backgroundColor:
                    "#60A5FA",
                }}
              />

              {/* THUMB */}

              <View
                style={{
                  position:
                    "absolute",
                  left: `${Math.max(
                    0,
                    Math.min(
                      96,
                      progress * 100,
                    ),
                  )}%`,
                  top: -6,
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  backgroundColor:
                    "#EAF0FF",
                  transform: [
                    {
                      translateX:
                        -10,
                    },
                  ],
                  borderWidth: 3,
                  borderColor:
                    "#2563EB",
                  opacity:
                    audioReady
                      ? 1
                      : 0.35,
                }}
              />
            </Pressable>

            {/* TIME */}

            <View
              style={{
                marginTop: 10,
                flexDirection: "row",
                justifyContent:
                  "space-between",
              }}
            >
              <Text
                style={{
                  color:
                    "rgba(234,240,255,0.72)",
                  fontWeight:
                    "800",
                  fontSize: 12,
                }}
              >
                {formatSeconds(
                  positionSec,
                )}
              </Text>

              <Text
                style={{
                  color:
                    "rgba(234,240,255,0.72)",
                  fontWeight:
                    "800",
                  fontSize: 12,
                }}
              >
                {formatSeconds(
                  durationSec || 0,
                )}
              </Text>
            </View>
          </View>

          {/* ================================
              CONTROLS
          ================================= */}

          <View
            style={{
              marginTop: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent:
                "space-between",
            }}
          >
            {/* BACK 10 */}

            <Pressable
              onPress={() =>
                seekBy(-10)
              }
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                backgroundColor:
                  "#0B1220",
                borderWidth: 1,
                borderColor:
                  "rgba(234,240,255,0.10)",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                opacity:
                  audioReady
                    ? 1
                    : 0.5,
              }}
              disabled={!audioReady}
            >
              <Ionicons
                name="play-back-outline"
                size={22}
                color="#EAF0FF"
              />
            </Pressable>

            {/* PLAY / PAUSE */}

            <Pressable
              onPress={togglePlay}
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                backgroundColor:
                  "#2563EB",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                shadowColor:
                  "#2563EB",
                shadowOpacity: 0.45,
                shadowRadius: 14,
                shadowOffset: {
                  width: 0,
                  height: 10,
                },
                opacity:
                  audioReady
                    ? 1
                    : 0.6,
              }}
              disabled={!audioReady}
            >
              <Ionicons
                name={
                  isPlaying
                    ? "pause"
                    : "play"
                }
                size={26}
                color="#EAF0FF"
              />
            </Pressable>

            {/* FORWARD 10 */}

            <Pressable
              onPress={() =>
                seekBy(10)
              }
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                backgroundColor:
                  "#0B1220",
                borderWidth: 1,
                borderColor:
                  "rgba(234,240,255,0.10)",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                opacity:
                  audioReady
                    ? 1
                    : 0.5,
              }}
              disabled={!audioReady}
            >
              <Ionicons
                name="play-forward-outline"
                size={22}
                color="#EAF0FF"
              />
            </Pressable>
          </View>

          {/* ================================
              BOTTOM ACTIONS
          ================================= */}

          <View
            style={{
              marginTop: 14,
              flexDirection: "row",
              gap: 10,
            }}
          >
            {/* FAVORITES */}

            <Pressable
              onPress={
                onToggleFavorite
              }
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 18,
                backgroundColor:
                  "rgba(37,99,235,0.12)",
                borderWidth: 1,
                borderColor:
                  "rgba(234,240,255,0.10)",
                alignItems:
                  "center",
                flexDirection:
                  "row",
                justifyContent:
                  "center",
                gap: 8,
                opacity:
                  favLoading
                    ? 0.7
                    : 1,
              }}
              disabled={favLoading}
            >
              <Ionicons
                name={
                  isFavorite
                    ? "heart"
                    : "heart-outline"
                }
                size={18}
                color="#EAF0FF"
              />

              <Text
                style={{
                  color:
                    "#EAF0FF",
                  fontWeight:
                    "900",
                }}
              >
                {isFavorite
                  ? "Favori"
                  : "Ajouter"}
              </Text>
            </Pressable>

            {/* SHARE */}

            <Pressable
              onPress={onShare}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 18,
                backgroundColor:
                  "#0B1220",
                borderWidth: 1,
                borderColor:
                  "rgba(234,240,255,0.10)",
                alignItems:
                  "center",
                flexDirection:
                  "row",
                justifyContent:
                  "center",
                gap: 8,
              }}
            >
              <Ionicons
                name="share-social-outline"
                size={18}
                color="#EAF0FF"
              />

              <Text
                style={{
                  color:
                    "#EAF0FF",
                  fontWeight:
                    "900",
                }}
              >
                Partager
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ================================
            TEXTE
        ================================= */}

        <View
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 18,
            backgroundColor:
              "#0F1A2C",
            borderWidth: 1,
            borderColor:
              "rgba(234,240,255,0.10)",
          }}
        >
          <Text
            style={{
              color: "#EAF0FF",
              fontWeight: "900",
              marginBottom: 8,
            }}
          >
            Texte
          </Text>

          <Text
            style={{
              color:
                "rgba(234,240,255,0.72)",
              lineHeight: 20,
            }}
          >
            {bodyText}
          </Text>
        </View>

        {/* ================================
            PRIÈRE / APPLICATION
        ================================= */}

        <View
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 18,
            backgroundColor:
              "#0F1A2C",
            borderWidth: 1,
            borderColor:
              "rgba(234,240,255,0.10)",
          }}
        >
          <Text
            style={{
              color: "#EAF0FF",
              fontWeight: "900",
              marginBottom: 8,
            }}
          >
            Prière / Application
          </Text>

          <Text
            style={{
              color:
                "rgba(234,240,255,0.72)",
              lineHeight: 20,
            }}
          >
            {footerText || "—"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}