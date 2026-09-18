import React from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0B1220",
        paddingTop: insets.top,
      }}
    >
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <Text
          style={{
            color: "#EAF0FF",
            fontWeight: "900",
            fontSize: 24,
            marginBottom: 16,
          }}
        >
          Consentement & Protection des Données (RGPD)
        </Text>

        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 14 }}>
          Les informations personnelles collectées via l'application{" "}
          <Text style={{ fontWeight: "900", color: "#EAF0FF" }}>
            Prie avec moi
          </Text>{" "}
          sont traitées avec la plus stricte confidentialité par{" "}
          <Text style={{ fontWeight: "900", color: "#EAF0FF" }}>
            Église Terre Sacrée
          </Text>
          , conformément au Règlement (UE) 2016/679 du Parlement européen et du
          Conseil du 27 avril 2016 relatif à la protection des personnes
          physiques à l’égard du traitement des données à caractère personnel
          (RGPD).
        </Text>

        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 14 }}>
          Les données personnelles collectées (nom, adresse e-mail et toute
          information communiquée volontairement) sont nécessaires pour :
        </Text>

        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 6 }}>
          • Permettre l’accès à l’application de méditation biblique ;
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 6 }}>
          • Favoriser les interactions sociales entre membres ;
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 6 }}>
          • Informer des événements, méditations et activités organisées ;
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 14 }}>
          • Assurer la gestion interne et administrative.
        </Text>

        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 14 }}>
          Les données sont conservées uniquement pour la durée nécessaire à la
          réalisation des finalités mentionnées ci-dessus.
        </Text>

        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 14 }}>
          Conformément au RGPD, vous disposez à tout moment des droits
          suivants :
        </Text>

        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 6 }}>
          • Droit d’accès à vos données ;
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 6 }}>
          • Droit de rectification ;
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 6 }}>
          • Droit à l’effacement ;
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 14 }}>
          • Droit d’opposition ou de limitation du traitement.
        </Text>

        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 14 }}>
          Pour exercer ces droits ou obtenir davantage d’informations sur la
          protection de vos données personnelles, vous pouvez contacter :
        </Text>

        <Text
          style={{
            color: "#60A5FA",
            fontWeight: "800",
            marginBottom: 20,
          }}
        >
          contact@egliseterresacree.com
        </Text>

        <Text style={{ color: "#EAF0FF", fontWeight: "900", marginBottom: 8 }}>
          Consentements spécifiques
        </Text>

        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 6 }}>
          En utilisant l’application Prie avec moi :
        </Text>

        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 6 }}>
          • J’accepte que mes données personnelles soient utilisées pour
          l’information et l’inscription aux activités ;
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22, marginBottom: 6 }}>
          • J’autorise la publication éventuelle de photos ou extraits
          d’images me concernant sur les supports numériques liés à
          Église Terre Sacrée ;
        </Text>
        <Text style={{ color: "rgba(234,240,255,0.85)", lineHeight: 22 }}>
          • J’accepte de recevoir des communications et informations
          spirituelles via l’application.
        </Text>
      </ScrollView>
    </View>
  );
}
