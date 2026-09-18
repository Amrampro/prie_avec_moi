// mobile/app/settings/admin/users/[id].tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router/react-navigation";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import {
  apiAdminDeleteUser,
  apiAdminGetUser,
  apiAdminUpdateUserRole,
} from "../../../../services/admin.users.api";

function formatDateTimeFR(d: string) {
  try {
    return new Date(d).toLocaleString("fr-FR");
  } catch {
    return d;
  }
}

export default function AdminUserDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<any>(null);

  // ✅ avatar modal
  const [avatarOpen, setAvatarOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await apiAdminGetUser(id);
    setUser(res.user);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          setLoading(true);
          await load();
        } catch (e: any) {
          if (mounted)
            Alert.alert(
              "Erreur",
              e?.message ?? "Impossible de charger l'utilisateur.",
            );
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [load]),
  );

  const isAdmin = !!user?.isAdmin;
  const counts = useMemo(() => user?.counts ?? {}, [user]);

  const disabled = loading || busy;

  const onToggleRole = useCallback(() => {
    if (!id || !user) return;

    const next = !isAdmin;

    Alert.alert(
      "Changer de rôle",
      next ? "Passer cet utilisateur en Admin ?" : "Retirer le rôle Admin ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            setBusy(true);
            try {
              await apiAdminUpdateUserRole(id, { isAdmin: next });
              await load();
              Alert.alert("OK", "Rôle mis à jour.");
            } catch (e: any) {
              Alert.alert(
                "Erreur",
                e?.message ?? "Impossible de changer le rôle.",
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }, [id, user, isAdmin, load]);

  const onDelete = useCallback(() => {
    if (!id) return;

    Alert.alert(
      "Supprimer",
      "Supprimer cet utilisateur ? (Action irréversible)",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await apiAdminDeleteUser(id);
              Alert.alert("OK", "Utilisateur supprimé.");
              router.replace("/settings/admin/users");
            } catch (e: any) {
              Alert.alert("Erreur", e?.message ?? "Suppression impossible.");
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }, [id]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>
          Utilisateur
        </Text>
        <Text
          style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}
          numberOfLines={1}
        >
          {id ?? ""}
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
            <Text
              style={{ color: "rgba(234,240,255,0.72)", marginTop: 10 }}
            >
              Chargement...
            </Text>
          </View>
        ) : !user ? (
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
            <Text style={{ color: "rgba(234,240,255,0.72)" }}>
              Utilisateur introuvable.
            </Text>
          </View>
        ) : (
          <>
            {/* Header */}
            <View
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
              }}
            >
              {/* ✅ Click to enlarge */}
              <Pressable
                onPress={() => {
                  if (user?.avatarUrl) setAvatarOpen(true);
                }}
                disabled={!user?.avatarUrl}
              >
                {user.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={{ width: 72, height: 72, borderRadius: 22 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 22,
                      backgroundColor: "#0B1220",
                      borderWidth: 1,
                      borderColor: "rgba(234,240,255,0.10)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="person-outline"
                      size={24}
                      color="rgba(234,240,255,0.55)"
                    />
                  </View>
                )}
              </Pressable>

              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text
                    style={{
                      color: "#EAF0FF",
                      fontWeight: "900",
                      fontSize: 18,
                    }}
                    numberOfLines={1}
                  >
                    {user.fullName}
                  </Text>

                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: isAdmin
                        ? "rgba(37,99,235,0.16)"
                        : "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: "rgba(234,240,255,0.10)",
                    }}
                  >
                    <Text
                      style={{
                        color: "#EAF0FF",
                        fontWeight: "900",
                        fontSize: 12,
                      }}
                    >
                      {isAdmin ? "Admin" : "User"}
                    </Text>
                  </View>
                </View>

                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}
                  numberOfLines={1}
                >
                  {user.email}
                </Text>

                <Text
                  style={{
                    color: "rgba(234,240,255,0.55)",
                    marginTop: 6,
                    fontWeight: "800",
                  }}
                >
                  Inscrit le {formatDateTimeFR(user.createdAt)}
                </Text>
              </View>
            </View>

            {/* Infos */}
            <View style={{ marginTop: 12, gap: 10 }}>
              <View
                style={{
                  padding: 12,
                  borderRadius: 18,
                  backgroundColor: "#0F1A2C",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                }}
              >
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  Informations
                </Text>

                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 10 }}
                >
                  Nom :{" "}
                  <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                    {user.fullName}
                  </Text>
                </Text>

                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 8 }}
                >
                  Email :{" "}
                  <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                    {user.email}
                  </Text>
                </Text>

                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 8 }}
                >
                  Rôle :{" "}
                  <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                    {isAdmin ? "Administrateur" : "Utilisateur"}
                  </Text>
                </Text>

                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 8 }}
                >
                  Créé le :{" "}
                  <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                    {formatDateTimeFR(user.createdAt)}
                  </Text>
                </Text>

                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 8 }}
                >
                  Modifié le :{" "}
                  <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                    {formatDateTimeFR(user.updatedAt)}
                  </Text>
                </Text>
              </View>

              {/* Stats */}
              <View
                style={{
                  padding: 12,
                  borderRadius: 18,
                  backgroundColor: "#0F1A2C",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                }}
              >
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  Statistiques
                </Text>

                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 10 }}
                >
                  ⭐ Favoris :{" "}
                  <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                    {counts.favorites ?? 0}
                  </Text>
                </Text>

                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 8 }}
                >
                  📝 Publications :{" "}
                  <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                    {counts.posts ?? 0}
                  </Text>
                </Text>

                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 8 }}
                >
                  ❤️ Likes :{" "}
                  <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                    {counts.postLikes ?? 0}
                  </Text>
                </Text>

                <Text
                  style={{ color: "rgba(234,240,255,0.72)", marginTop: 8 }}
                >
                  💬 Commentaires :{" "}
                  <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                    {counts.postComments ?? 0}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={{ marginTop: 14, gap: 10 }}>
              <Pressable
                onPress={onDelete}
                disabled={disabled}
                style={{
                  paddingVertical: 12,
                  borderRadius: 18,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 10,
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                {busy ? (
                  <ActivityIndicator />
                ) : (
                  <Ionicons name="trash-outline" size={18} color="#EAF0FF" />
                )}
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  Supprimer
                </Text>
              </Pressable>

              <Pressable
                onPress={onToggleRole}
                disabled={disabled}
                style={{
                  paddingVertical: 12,
                  borderRadius: 18,
                  backgroundColor: "rgba(37,99,235,0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.10)",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 10,
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={18}
                  color="#EAF0FF"
                />
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  {isAdmin ? "Retirer rôle admin" : "Passer admin"}
                </Text>
              </Pressable>

              <Pressable
                disabled
                style={{
                  paddingVertical: 12,
                  borderRadius: 18,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(234,240,255,0.08)",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 10,
                  opacity: 0.55,
                }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color="#EAF0FF"
                />
                <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                  Envoyer une notification
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* ✅ Avatar modal */}
        <Modal
          visible={avatarOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setAvatarOpen(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.92)",
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
            }}
          >
            {/* Tap outside to close */}
            <Pressable
              onPress={() => setAvatarOpen(false)}
              style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
            />

            {/* Close button */}
            <Pressable
              onPress={() => setAvatarOpen(false)}
              style={{
                position: "absolute",
                top: insets.top + 12,
                right: 16,
                width: 44,
                height: 44,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.10)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.16)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={20} color="#EAF0FF" />
            </Pressable>

            {!!user?.avatarUrl && (
              <View
                style={{
                  width: "100%",
                  maxWidth: 520,
                  aspectRatio: 1,
                  borderRadius: 24,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  backgroundColor: "#0B1220",
                }}
              >
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}
