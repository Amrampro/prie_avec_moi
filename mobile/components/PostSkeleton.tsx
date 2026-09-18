import React, { useEffect, useRef } from "react";
import { View, Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const POST_IMAGE_HEIGHT = width * (5 / 4);

function SkeletonBlock({
  w,
  h,
  r = 10,
  style,
}: {
  w: number | string;
  h: number;
  r?: number;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius: r,
          backgroundColor: "rgba(234,240,255,0.10)",
          opacity,
        },
        style,
      ]}
    />
  );
}

export function PostSkeleton() {
  return (
    <View style={{ marginBottom: 20, backgroundColor: "#0B1220" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 12, gap: 10 }}>
        <SkeletonBlock w={38} h={38} r={19} />
        <View style={{ flex: 1 }}>
          <SkeletonBlock w={160} h={14} r={6} />
          <SkeletonBlock w={90} h={10} r={6} style={{ marginTop: 8 }} />
        </View>
      </View>

      {/* Texte */}
      <View style={{ paddingHorizontal: 12, paddingBottom: 10, gap: 8 }}>
        <SkeletonBlock w={"95%"} h={12} r={6} />
        <SkeletonBlock w={"85%"} h={12} r={6} />
        <SkeletonBlock w={"60%"} h={12} r={6} />
      </View>

      {/* Image placeholder */}
      <SkeletonBlock w={width} h={POST_IMAGE_HEIGHT} r={0} />

      {/* Actions */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 12, gap: 18 }}>
        <SkeletonBlock w={70} h={22} r={8} />
        <SkeletonBlock w={70} h={22} r={8} />
      </View>
    </View>
  );
}

export function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </View>
  );
}
