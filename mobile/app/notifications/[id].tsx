import React, { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { fakeNotifications } from "../../constants/fake.data";

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const notif = useMemo(() => fakeNotifications.find((n) => n.id === id), [id]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {!notif ? (
          <>
            <Text style={{ color: "#EAF0FF", fontSize: 18, fontWeight: "900" }}>
              Notification introuvable
            </Text>
            <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 8 }}>
              Cette notification n’existe pas ou a été supprimée.
            </Text>
          </>
        ) : (
          <>
            <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>
              {notif.title}
            </Text>
            <Text style={{ color: "rgba(234,240,255,0.55)", marginTop: 8, fontWeight: "700" }}>
              {notif.createdAt}
            </Text>

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
              <Text style={{ color: "rgba(234,240,255,0.72)", lineHeight: 20 }}>
                {notif.body}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
