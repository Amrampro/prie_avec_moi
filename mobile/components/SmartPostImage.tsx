import React, { useEffect, useMemo, useState } from "react";
import { View, Image, LayoutChangeEvent } from "react-native";

type Props = {
  uri: string;

  /** Hauteur max du container (ex: 220) */
  maxHeight: number;

  /** true si c'est une galerie/carousel (plusieurs images) */
  isGallery?: boolean;

  /** Radius */
  borderRadius?: number;

  /** Fond utilisé en mode galerie (letterbox) */
  galleryBackgroundColor?: string;
};

type ImgSize = { w: number; h: number };

export function SmartPostImage({
  uri,
  maxHeight,
  isGallery = false,
  borderRadius = 0,
  galleryBackgroundColor = "#000000",
}: Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [img, setImg] = useState<ImgSize | null>(null);
  const [imgReady, setImgReady] = useState(false);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && w !== containerWidth) setContainerWidth(w);
  };

  useEffect(() => {
    let mounted = true;
    setImg(null);
    setImgReady(false);

    Image.getSize(
      uri,
      (w, h) => {
        if (!mounted) return;
        setImg({ w, h });
        setImgReady(true);
      },
      () => {
        if (!mounted) return;
        // Si on ne peut pas lire la taille, on force un fallback "safe" (pas de crop largeur)
        setImg(null);
        setImgReady(true);
      }
    );

    return () => {
      mounted = false;
    };
  }, [uri]);

  // hauteur théorique si on force width=100%
  const computedHeight = useMemo(() => {
    if (!img || img.w <= 0 || !containerWidth) return null;
    const ratio = img.h / img.w;
    return Math.round(containerWidth * ratio);
  }, [img, containerWidth]);

  /**
   * ✅ IMPORTANT:
   * Tant qu'on ne connait pas la taille de l'image,
   * on ne doit JAMAIS utiliser "cover" (sinon ça zoom et coupe largeur).
   * -> on met contain + height=maxHeight (safe preview)
   */
  const mode = useMemo<"contain" | "cover">(() => {
    if (!imgReady) return "contain";

    // Fallback si getSize a échoué
    if (!computedHeight) return isGallery ? "contain" : "contain";

    if (isGallery) {
      // galerie: cover si trop haut, sinon contain + bandes noires
      return computedHeight >= maxHeight ? "cover" : "contain";
    }

    // single: cover si trop haut (crop vertical), sinon contain
    return computedHeight >= maxHeight ? "cover" : "contain";
  }, [imgReady, computedHeight, isGallery, maxHeight]);

  const height = useMemo(() => {
    if (!imgReady) return maxHeight;

    // si pas de taille connue -> fallback height max
    if (!computedHeight) return maxHeight;

    if (isGallery) {
      // galerie: hauteur fixe
      return maxHeight;
    }

    // single: shrink si image plus petite, sinon maxHeight
    return computedHeight >= maxHeight ? maxHeight : Math.max(1, computedHeight);
  }, [imgReady, computedHeight, isGallery, maxHeight]);

  const backgroundColor = useMemo(() => {
    if (!isGallery) return "transparent";
    // en galerie, only letterbox quand contain
    return mode === "contain" ? galleryBackgroundColor : "transparent";
  }, [isGallery, mode, galleryBackgroundColor]);

  return (
    <View
      onLayout={onLayout}
      style={{
        width: "100%",
        height,
        borderRadius,
        overflow: "hidden",
        backgroundColor,
      }}
    >
      <Image
        source={{ uri }}
        resizeMode={mode}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}