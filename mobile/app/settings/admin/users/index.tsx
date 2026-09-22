// mobile/app/settings/admin/users/index.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router/react-navigation";
import { router } from "expo-router";

import { apiAdminListUsers, AdminUser, Cursor } from "../../../../services/admin.users.api";

function formatDateFR(d: string) {
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [nextCursor, setNextCursor] = useState<Cursor>(null);

  const [q, setQ] = useState("");

  const canLoadMore = useMemo(
    () => !!nextCursor && !loading && !loadingMore,
    [nextCursor, loading, loadingMore]
  );

  const loadFirst = useCallback(async (search?: string) => {
    const res = await apiAdminListUsers({
      limit: 20,
      q: search?.trim() ? search.trim() : undefined,
    });

    setUsers(res.users ?? []);
    setNextCursor(res.nextCursor ?? null);
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;

    setLoadingMore(true);
    try {
      const res = await apiAdminListUsers({
        limit: 20,
        cursorId: nextCursor.cursorId,
        cursorCreatedAt: nextCursor.cursorCreatedAt,
        q: q.trim() ? q.trim() : undefined,
      });

      setUsers((prev) => [...prev, ...(res.users ?? [])]);
      setNextCursor(res.nextCursor ?? null);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de charger plus d'utilisateurs.");
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, q]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          setLoading(true);
          await loadFirst(q);
        } catch (e: any) {
          if (mounted) setUsers([]);
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [loadFirst])
  );

  const onSearch = useCallback(async () => {
    setLoading(true);
    try {
      await loadFirst(q);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Recherche impossible.");
    } finally {
      setLoading(false);
    }
  }, [q, loadFirst]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220", paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
      >
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>
          Administration
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
          Utilisateurs
        </Text>

        {/* Search */}
        <View
          style={{
            marginTop: 14,
            padding: 10,
            borderRadius: 18,
            backgroundColor: "#0F1A2C",
            borderWidth: 1,
            borderColor: "rgba(234,240,255,0.10)",
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
          }}
        >
          <Ionicons name="search-outline" size={18} color="rgba(234,240,255,0.72)" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Rechercher (nom ou email)..."
            placeholderTextColor="rgba(234,240,255,0.45)"
            style={{ flex: 1, color: "#EAF0FF", fontWeight: "800" }}
            returnKeyType="search"
            onSubmitEditing={onSearch}
          />
          <Pressable
            onPress={onSearch}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: "rgba(37,99,235,0.14)",
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.10)",
            }}
          >
            <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>OK</Text>
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
              <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 10 }}>
                Chargement...
              </Text>
            </View>
          ) : users.length === 0 ? (
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
                Aucun utilisateur.
              </Text>
            </View>
          ) : (
            users.map((u) => (
              <Pressable
                key={u.id}
                onPress={() => router.push(`/settings/admin/users/${u.id}`)}
                style={{
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
                {/* Avatar */}
                {u.avatarUrl ? (
                  <Image
                    source={{ uri: u.avatarUrl }}
                    style={{ width: 52, height: 52, borderRadius: 18 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 18,
                      backgroundColor: "#0B1220",
                      borderWidth: 1,
                      borderColor: "rgba(234,240,255,0.10)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="person-outline" size={20} color="rgba(234,240,255,0.55)" />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text
                      style={{ color: "#EAF0FF", fontWeight: "900" }}
                      numberOfLines={1}
                    >
                      {u.fullName}
                    </Text>

                    {/* Badge role */}
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: u.isAdmin
                          ? "rgba(37,99,235,0.16)"
                          : "rgba(255,255,255,0.06)",
                        borderWidth: 1,
                        borderColor: "rgba(234,240,255,0.10)",
                      }}
                    >
                      <Text style={{ color: "#EAF0FF", fontWeight: "900", fontSize: 12 }}>
                        {u.isAdmin ? "Admin" : u.role === "ACCOMPAGNATEUR" ? "Accompagnateur" : "Membre"}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }}>
                    Inscrit le {formatDateFR(u.createdAt)}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="rgba(234,240,255,0.55)" />
              </Pressable>
            ))
          )}
        </View>

        {/* Charger plus */}
        {!loading && users.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Pressable
              onPress={loadMore}
              disabled={!canLoadMore}
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
                opacity: canLoadMore ? 1 : 0.55,
              }}
            >
              {loadingMore ? <ActivityIndicator /> : <Ionicons name="download-outline" size={18} color="#EAF0FF" />}
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>
                {loadingMore ? "Chargement..." : nextCursor ? "Charger plus" : "Fin de liste"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
