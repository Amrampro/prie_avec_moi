import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Link } from "expo-router";
import { fakeNotifications } from "../../constants/fake.data";

export default function NotificationsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 10 }}>
        <Text style={{ color: "#EAF0FF", fontSize: 22, fontWeight: "900" }}>
          Notifications
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 4 }}>
          Tes alertes et rappels.
        </Text>

        {fakeNotifications.map((n) => (
          <Link key={n.id} href={`/notifications/${n.id}`} asChild>
            <Pressable
              style={{
                padding: 14,
                borderRadius: 18,
                backgroundColor: "#0F1A2C",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.10)",
              }}
            >
              <Text style={{ color: "#EAF0FF", fontWeight: "900" }}>{n.title}</Text>
              <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6 }} numberOfLines={2}>
                {n.body}
              </Text>
              <Text style={{ color: "rgba(234,240,255,0.55)", marginTop: 10, fontWeight: "700", fontSize: 12 }}>
                {n.createdAt}
              </Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}
