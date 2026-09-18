// mobile/app/index.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StatusBar, Image, Easing } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../stores/auth.store";

const LOGO_CARD_SIZE = 112;

export default function SplashScreen() {
  const insets = useSafeAreaInsets();

  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  const [introDone, setIntroDone] = useState(false);

  // Intro
  const fadeIn = useRef(new Animated.Value(0)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoTranslateY = useRef(new Animated.Value(18)).current;

  // Title under logo
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(10)).current;

  // Shine + bump
  const shine = useRef(new Animated.Value(0)).current; // 0..1
  const shineOpacity = useRef(new Animated.Value(0)).current; // separate to be VERY visible
  const bump = useRef(new Animated.Value(0)).current; // 0..1

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Intro sequence
  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    const logoIn = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.back(1.15)),
        useNativeDriver: true,
      }),
    ]);

    const titleIn = Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    Animated.sequence([logoIn, Animated.delay(120), titleIn]).start(() => {
      setIntroDone(true);
    });

    return () => {
      fadeIn.stopAnimation();
      logoOpacity.stopAnimation();
      logoScale.stopAnimation();
      logoTranslateY.stopAnimation();
      titleOpacity.stopAnimation();
      titleTranslateY.stopAnimation();
    };
  }, [
    fadeIn,
    logoOpacity,
    logoScale,
    logoTranslateY,
    titleOpacity,
    titleTranslateY,
  ]);

  // Shine loop (VERY visible)
  useEffect(() => {
    if (!introDone) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(280),

        // show shine + bump up
        Animated.parallel([
          Animated.timing(shineOpacity, {
            toValue: 1,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bump, {
            toValue: 1,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),

        // sweep across
        Animated.timing(shine, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),

        // hide shine + bump down
        Animated.parallel([
          Animated.timing(shineOpacity, {
            toValue: 0,
            duration: 140,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bump, {
            toValue: 0,
            duration: 180,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),

        // reset sweep instantly + pause
        Animated.timing(shine, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(650),
      ])
    );

    loop.start();

    return () => {
      shine.stopAnimation();
      shineOpacity.stopAnimation();
      bump.stopAnimation();
    };
  }, [introDone, shine, shineOpacity, bump]);

  // Navigate when hydrated
  useEffect(() => {
    if (!hydrated) return;

    const t = setTimeout(() => {
      router.replace("/(tabs)");
    }, 3000);

    return () => clearTimeout(t);
  }, [hydrated]);

  // Interpolations
  const bumpScale = bump.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  // ✅ Strong sweep position (pure numeric, always crosses the card)
  const shineTranslateX = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [-LOGO_CARD_SIZE * 2.2, LOGO_CARD_SIZE * 2.2],
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220", paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={{ flex: 1, opacity: fadeIn }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          {/* ✅ LOGO CARD (no glow, no ring, no circles) */}
          <Animated.View
            style={{
              width: LOGO_CARD_SIZE,
              height: LOGO_CARD_SIZE,
              borderRadius: 28,
              backgroundColor: "#0F1A2C",
              borderWidth: 1,
              borderColor: "rgba(234,240,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",

              opacity: logoOpacity,
              transform: [
                { translateY: logoTranslateY },
                { scale: Animated.multiply(logoScale, bumpScale) },
              ],
            }}
          >
            {/* Logo */}
            <Image
              source={require("../assets/images/icon.png")}
              style={{ width: "72%", height: "72%" }}
              resizeMode="contain"
            />

            {/* ✅ REFLET (2 bandes inclinées, super visibles) */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: -LOGO_CARD_SIZE,
                left: -LOGO_CARD_SIZE,
                width: LOGO_CARD_SIZE * 3,
                height: LOGO_CARD_SIZE * 3,
                transform: [{ translateX: shineTranslateX }, { rotate: "-18deg" }],
                opacity: shineOpacity, // on/off
                zIndex: 10,
              }}
            >
              {/* Bande large */}
              <View
                style={{
                  position: "absolute",
                  left: "42%",
                  width: LOGO_CARD_SIZE * 0.75,
                  height: "100%",
                  backgroundColor: "rgba(255,255,255,0.42)",
                  borderRadius: 999,
                }}
              />

              {/* Bande fine au centre */}
              <View
                style={{
                  position: "absolute",
                  left: "52%",
                  width: LOGO_CARD_SIZE * 0.22,
                  height: "100%",
                  backgroundColor: "rgba(255,255,255,0.78)",
                  borderRadius: 999,
                }}
              />
            </Animated.View>
          </Animated.View>

          {/* ✅ TITRE sous le logo (pas en bas de page) */}
          <Animated.View
            pointerEvents="none"
            style={{
              marginTop: 14,
              alignItems: "center",
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            }}
          >
            <Text style={{ color: "#EAF0FF", fontWeight: "900", fontSize: 22, textAlign: "center" }}>
              Prie avec moi
            </Text>
            <Text style={{ color: "rgba(234,240,255,0.72)", marginTop: 6, textAlign: "center" }}>
              Méditation biblique • paix • foi
            </Text>
          </Animated.View>

          {/* Footer */}
          <View style={{ position: "absolute", bottom: Math.max(16, insets.bottom + 10), alignItems: "center" }}>
            <Text style={{ color: "rgba(234,240,255,0.45)", fontWeight: "700" }}>
              © {new Date().getFullYear()} Prie avec moi
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
