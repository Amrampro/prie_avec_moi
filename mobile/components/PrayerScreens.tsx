import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useAudioPlayer } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { prayerApi, listPrograms, loadProgram, downloadProgram, saveProgress, syncPrayerProgress, removeRequestCache, prayerAudioHeaders, dayFields } from "../services/prayer.api";
import { apiAdminUploadFile } from "../services/uploads.api";
import { API_BASE_URL } from "../constants/api";
import { useAuthStore } from "../stores/auth.store";

const ink = "#EAF0FF";
const muted = "#A8B7CC";
const card = { backgroundColor: "#0F1A2C", padding: 16, borderRadius: 18, gap: 10, borderWidth: 1, borderColor: "#26364D" } as const;
const disclaimer = "Cet accompagnement spirituel ne remplace pas un médecin, un psychologue, la police ou les services d’urgence.";
const contributionInfo = "Contribution volontaire, effectuée en dehors de l’application. Aucun paiement n’est exécuté ici. Une contribution ou sa preuve ne donne aucun droit ni priorité et ne conditionne jamais ton accompagnement.";
const statuses: Record<string, string> = { ENVOYEE: "Envoyée", EN_ETUDE: "En étude", PRECISION_DEMANDEE: "Précision demandée", EN_PREPARATION: "En préparation", DISPONIBLE: "Disponible", TERMINEE: "Terminée" };
const messages: Record<string, string> = { ENVOYEE: "Ta demande a bien été reçue.", EN_ETUDE: "Notre équipe examine ta requête.", PRECISION_DEMANDEE: "Nous avons besoin d’une information complémentaire.", EN_PREPARATION: "Ton programme est en préparation.", DISPONIBLE: "Ton programme personnalisé a été envoyé.", TERMINEE: "Ton programme est terminé." };
const go = (section: string, params: Record<string, string> = {}) => router.push({ pathname: "/prayer/[section]", params: { section, ...params } } as any);
const dateLabel = (value: string, timezone?: string) => new Date(value).toLocaleString("fr-FR", { timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone });
const errorText = (e: any) => e?.message || "Impossible de terminer cette action.";
function Label({ children }: { children: React.ReactNode }) { return <Text style={{ color: ink, lineHeight: 23 }}>{children}</Text>; }
function Title({ children }: { children: React.ReactNode }) { return <Text style={{ color: ink, fontWeight: "800", fontSize: 21 }}>{children}</Text>; }
function Button({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) { return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{ backgroundColor: "#214D83", padding: 13, borderRadius: 12, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: ink, fontWeight: "700" }}>{title}</Text></Pressable>; }
function Field({ title, value, set, multiline = false, keyboardType }: { title: string; value: any; set: (s: string) => void; multiline?: boolean; keyboardType?: "decimal-pad" }) { return <View style={{ gap: 5 }}><Label>{title}</Label><TextInput accessibilityLabel={title} value={String(value ?? "")} onChangeText={set} multiline={multiline} keyboardType={keyboardType} autoCapitalize="sentences" style={{ color: ink, borderColor: "#3C4B61", borderWidth: 1, padding: 12, borderRadius: 10, minHeight: multiline ? 85 : 46, textAlignVertical: "top" }} /></View>; }
function Toggle({ title, value, set }: { title: string; value: boolean; set: (v: boolean) => void }) { return <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Switch accessibilityLabel={title} value={value} onValueChange={set} /><Text style={{ color: ink, flex: 1 }}>{title}</Text></View>; }
function Choices({ title, value, options, set }: { title: string; value: string; options: [string, string][]; set: (v: string) => void }) { return <View style={{ gap: 7 }}><Label>{title}</Label><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{options.map(([id, label]) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: value === id }} key={id} onPress={() => set(id)} style={{ padding: 10, borderRadius: 10, backgroundColor: value === id ? "#285CA0" : "#1B2C44" }}><Text style={{ color: ink }}>{label}</Text></Pressable>)}</View></View>; }
function Screen({ children }: { children: React.ReactNode }) { return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} style={{ flex: 1, backgroundColor: "#0B1220" }}>{children}</ScrollView>; }
function useAction() {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<any>) => { if (busy) return; setBusy(true); try { await fn(); } catch (e) { Alert.alert("Information", errorText(e)); } finally { setBusy(false); } };
  return { busy, run };
}
function Audio({ uri }: { uri: string }) {
  const player = useAudioPlayer({ uri, headers: prayerAudioHeaders(uri) });
  return <View style={{ flexDirection: "row", gap: 8 }}><Button title="Écouter" onPress={() => player.play()} /><Button title="Pause" onPress={() => player.pause()} /></View>;
}

export function MoreScreen() { return <Screen><Title>Plus</Title>{[["Aidez-moi à prier", "/prayer/help"], ["Séries", "/(tabs)/series"], ["Actualités", "/(tabs)/feed"], ["Favoris", "/(tabs)/favorites"], ["Événements", "/(tabs)/events"], ["Contributions", "/prayer/contributions"]].map(([title, path]) => <Button key={path} title={title} onPress={() => router.push(path as any)} />)}</Screen>; }

export function PrayerHome() {
  const token = useAuthStore(s => s.token);
  const [current, setCurrent] = useState<any>(null);
  const [next, setNext] = useState<any>(null);
  const [unread, setUnread] = useState(0);
  useFocusEffect(useCallback(() => {
    let live = true;
    setCurrent(null); setNext(null); setUnread(0);
    if (token) Promise.all([listPrograms(), prayerApi("/appointments").catch(() => ({ appointments: [] })), prayerApi("/notifications").catch(() => ({ unread: 0 }))]).then(([p, a, n]) => {
      if (!live) return;
      setCurrent(p.progress?.[0]); setNext(a.appointments.find((x: any) => !x.closedAt && new Date(x.slot.startsAt) > new Date())); setUnread(n.unread);
    }).catch(() => {});
    return () => { live = false; };
  }, [token]));
  return <View style={{ gap: 12, marginBottom: 22 }}>
    <View style={card}><Title>{current ? "Continuer mon programme" : "Mon programme de prière"}</Title><Button title={current ? "Continuer" : "Commencer"} onPress={() => current ? go("program", { id: current.programId }) : router.push("/(tabs)/programs" as any)} /></View>
    <View style={card}><Title>Demander de l’aide pour prier</Title><Button title="Aidez-moi à prier" onPress={() => go("help")} /></View>
    {next && <View style={card}><Title>Mon prochain rendez-vous</Title><Label>{dateLabel(next.slot.startsAt, next.timezone)} · {next.slot.duration} min</Label><Button title="Voir le rendez-vous" onPress={() => router.push("/(tabs)/tracking" as any)} /></View>}
    {!!unread && <Button title={`${unread} notification(s) non lue(s)`} onPress={() => router.push("/notifications")} />}
  </View>;
}

export function ProgramsScreen() {
  const token = useAuthStore(s => s.token);
  const [data, setData] = useState<any>({ programs: [], progress: [] });
  const [error, setError] = useState("");
  useFocusEffect(useCallback(() => { let live = true; if (token) listPrograms().then(d => { if (live) { setData(d); setError(""); } }).catch(e => setError(errorText(e))); return () => { live = false; }; }, [token]));
  if (!token) return <Screen><Title>Programmes de prière</Title><Button title="Se connecter pour commencer" onPress={() => router.push("/sign-in")} /></Screen>;
  return <Screen><Title>Programmes de prière</Title>{!!error && <Label>{error}</Label>}{data.progress?.[0] && <Button title="Continuer mon programme" onPress={() => go("program", { id: data.progress[0].programId })} />}{!data.programs.length && <Label>Aucun programme disponible pour le moment.</Label>}{data.programs.map((p: any) => <View key={p.id} style={card}><Title>{p.title}</Title><Label>{p.description}</Label><Label>{p.kind === "PERSONNEL" ? "Programme personnel" : "Programme public"}</Label><Button title="Ouvrir" onPress={() => go("program", { id: p.id })} /></View>)}</Screen>;
}

function ProgramReader({ id }: { id: string }) {
  const [data, setData] = useState<any>(null);
  const [dayId, setDayId] = useState("");
  const [error, setError] = useState("");
  const { busy, run } = useAction();
  useEffect(() => { let live = true; loadProgram(id).then(d => { if (live) { setData(d); setDayId(d.progress?.position || d.program.days[0]?.id); const position = d.progress?.position || d.program.days[0]?.id; if (position) void saveProgress(id, { position, positionAt: Date.now() }).then(() => syncPrayerProgress()); } }).catch(e => setError(errorText(e))); return () => { live = false; }; }, [id]);
  const update = async (change: any) => {
    const progress = await saveProgress(id, change);
    setData((d: any) => ({ ...d, progress }));
    void syncPrayerProgress();
  };
  if (!data) return <Screen><Label>{error || "Chargement…"}</Label></Screen>;
  const day = data.program.days.find((d: any) => d.id === dayId) || data.program.days[0];
  return <Screen><Title>{data.program.title}</Title><Label>{data.program.description}</Label>{data.offline && <Label>Hors connexion : progression enregistrée sur cet appareil.</Label>}<Label>Les étapes cochées sont sauvegardées automatiquement.</Label>
    <Button disabled={busy} title={data.downloaded ? "Actualiser le téléchargement" : "Télécharger pour consulter hors ligne"} onPress={() => run(async () => { setData(await downloadProgram(id)); Alert.alert("Programme téléchargé", "Les textes et les audios sont disponibles hors connexion."); })} />
    <Choices title="Journée" value={day.id} options={data.program.days.map((d: any, i: number) => [d.id, `${i + 1}. ${d.title}`])} set={value => { setDayId(value); void run(() => update({ position: value, positionAt: Date.now() })); }} />
    <Title>{day.title}</Title>{!!(data.audio?.[day.id] || day.audioUrl) && <Audio key={day.id} uri={data.audio?.[day.id] || day.audioUrl} />}
    {dayFields.map(([key, title]) => <View key={`${day.id}:${key}`} style={card}><Title>{title}</Title><Label>{key === "validation" ? "Je valide cette journée de prière." : day[key] || "Prends un temps de prière personnelle."}</Label><Toggle title="Étape terminée" value={!!data.progress?.steps?.[`${day.id}:${key}`]?.done} set={done => void run(() => update({ steps: { [`${day.id}:${key}`]: { done, at: Date.now() } }, position: day.id, positionAt: Date.now() }))} /></View>)}
  </Screen>;
}

function HelpForm() {
  const [form, setForm] = useState<any>({ category: "Vie personnelle", text: "", country: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", followUp: "ECRIT", consent: false });
  const { busy, run } = useAction();
  const set = (key: string, value: any) => setForm({ ...form, [key]: value });
  return <Screen><Title>Aidez-moi à prier</Title><Label>{disclaimer}</Label><Choices title="Sujet" value={form.category} options={["Vie personnelle", "Famille", "Santé", "Travail", "Foi", "Autre"].map(x => [x, x])} set={v => set("category", v)} /><Field title="Ta requête (obligatoire)" multiline value={form.text} set={v => set("text", v)} /><Field title="Pays" value={form.country} set={v => set("country", v)} /><Field title="Fuseau horaire (ex. Europe/Brussels)" value={form.timezone} set={v => set("timezone", v)} /><Choices title="Type de suivi" value={form.followUp} options={[["ECRIT", "Programme écrit"], ["VISIO", "Prière en visioconférence"]]} set={v => set("followUp", v)} /><Toggle title="J’accepte le traitement confidentiel de ma demande." value={form.consent} set={v => set("consent", v)} /><Label>Ton programme sera préparé avec soin. Nous ne vendons pas la prière. Tu peux envoyer ta demande sans contribution.</Label><Button title="Envoyer ma demande" disabled={busy || !form.consent || !form.text.trim() || !form.country.trim()} onPress={() => run(async () => { const { request } = await prayerApi("/requests", "POST", form); router.replace({ pathname: "/prayer/[section]", params: { section: "request", id: request.id } } as any); })} /></Screen>;
}

function RequestDetail({ id }: { id: string }) {
  const [data, setData] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const { busy, run } = useAction();
  const load = async () => { const d = await prayerApi(`/requests/${id}`); setData({ ...d.request, appointment: d.appointment }); if (d.request.followUp === "VISIO" && !d.appointment) setSlots((await prayerApi("/slots")).slots); };
  useEffect(() => { load().catch(e => setError(errorText(e))); }, [id]);
  if (!data) return <Screen><Label>{error || "Chargement…"}</Label></Screen>;
  return <Screen><Title>{data.category}</Title><Label>{statuses[data.status]} — {messages[data.status]}</Label><Label>{data.text}</Label>{!!data.clarification && <Label>Précision demandée : {data.clarification}</Label>}{!!data.reply && <Label>Ta réponse : {data.reply}</Label>}{data.status === "PRECISION_DEMANDEE" && <><Field title="Ta précision" multiline value={reply} set={setReply} /><Button title="Envoyer la précision" disabled={busy || !reply.trim()} onPress={() => run(async () => { await prayerApi(`/requests/${id}`, "PATCH", { reply }); await load(); })} /></>}
    {data.appointment && <View style={card}><Title>Ton rendez-vous</Title><Label>{dateLabel(data.appointment.slot.startsAt, data.timezone)} · {data.appointment.slot.duration} min</Label><Button title="Voir dans Mon suivi" onPress={() => router.push("/(tabs)/tracking" as any)} /></View>}{data.followUp === "VISIO" && !data.appointment && <><Title>Choisir un créneau</Title><Label>Horaires dans ton fuseau : {data.timezone}</Label><Label>{contributionInfo}</Label>{!slots.length && <Label>Aucun créneau disponible actuellement.</Label>}{slots.map(s => <View key={s.id} style={card}><Label>{dateLabel(s.startsAt, data.timezone)} · {s.duration} min</Label>{!!s.contribution && <Label>Contribution éventuelle : {s.contribution}</Label>}<Button title="Réserver ce créneau" disabled={busy} onPress={() => run(async () => { await prayerApi("/appointments", "POST", { requestId: id, slotId: s.id, timezone: data.timezone }); router.replace("/(tabs)/tracking" as any); })} /></View>)}</>}
    <Button title="Supprimer ma demande" onPress={() => Alert.alert("Supprimer cette demande ?", "Le programme personnel et le rendez-vous associés seront aussi supprimés.", [{ text: "Annuler", style: "cancel" }, { text: "Supprimer", style: "destructive", onPress: () => void run(async () => { await prayerApi(`/requests/${id}`, "DELETE"); await removeRequestCache(id); router.replace("/(tabs)/tracking" as any); }) }])} />
  </Screen>;
}

export function TrackingScreen() {
  const token = useAuthStore(s => s.token);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  useFocusEffect(useCallback(() => { if (token) Promise.all([prayerApi("/requests"), listPrograms(), prayerApi("/appointments"), prayerApi("/testimonies")]).then(([r, p, a, t]) => { setData({ ...r, ...p, ...a, ...t }); setError(""); }).catch(e => setError(errorText(e))); }, [token]));
  if (!token) return <Screen><Button title="Se connecter" onPress={() => router.push("/sign-in")} /></Screen>;
  return <Screen><Title>Mon suivi</Title>{!!error && <Label>{error}</Label>}<Button title="Nouvelle demande" onPress={() => go("help")} /><Title>Demandes</Title>{data?.requests.map((r: any) => <Button key={r.id} title={`${r.category} · ${statuses[r.status]}`} onPress={() => go("request", { id: r.id })} />)}<Title>Programmes personnels reçus</Title>{data?.programs.filter((p: any) => p.kind === "PERSONNEL").map((p: any) => <Button key={p.id} title={p.title} onPress={() => go("program", { id: p.id })} />)}<Title>Rendez-vous</Title>{data?.appointments.map((a: any) => <View key={a.id} style={card}><Label>{dateLabel(a.slot.startsAt, a.timezone)} ({a.timezone}) · {a.slot.duration} min</Label><Label>{a.closedAt ? "Rendez-vous clôturé" : "Rendez-vous confirmé"}</Label>{!!a.zoomUrl && !a.closedAt && <Button title="Rejoindre sur Zoom" onPress={() => void Linking.openURL(a.zoomUrl)} />}</View>)}<Title>Témoignages</Title><Button title="Écrire un témoignage" onPress={() => go("testimony")} /><Button title="Lire les témoignages publiés" onPress={() => go("testimonies")} />{data?.testimonies.map((t: any) => <View key={t.id} style={card}><Label>{t.text}</Label><Label>{t.consent ? "Publication autorisée" : "Témoignage privé"}</Label>{t.consent && <Button title="Retirer mon consentement" onPress={() => prayerApi(`/testimonies/${t.id}`, "PATCH", { consent: false }).then(() => setData({ ...data, testimonies: data.testimonies.map((x: any) => x.id === t.id ? { ...x, consent: false } : x) })).catch(e => Alert.alert("Erreur", errorText(e)))} />}</View>)}</Screen>;
}

function PublishedTestimonies() {
  const [items, setItems] = useState<any[]>([]); const [error, setError] = useState("");
  useEffect(() => { prayerApi("/testimonies?published=true").then(d => setItems(d.testimonies)).catch(e => setError(errorText(e))); }, []);
  return <Screen><Title>Témoignages publiés avec consentement</Title>{error ? <Label>{error}</Label> : !items.length ? <Label>Aucun témoignage publié actuellement.</Label> : items.map(t => <View style={card} key={t.id}><Label>{t.text}</Label><Label>{dateLabel(t.createdAt)}</Label></View>)}</Screen>;
}

function TestimonyForm() {
  const [text, setText] = useState(""); const [consent, setConsent] = useState(false); const { busy, run } = useAction();
  return <Screen><Title>Mon témoignage</Title><Field title="Témoignage" value={text} set={setText} multiline /><Toggle title="J’autorise explicitement la publication de ce témoignage." value={consent} set={setConsent} /><Button title="Envoyer" disabled={busy || !text.trim()} onPress={() => run(async () => { await prayerApi("/testimonies", "POST", { text, consent }); router.back(); })} /></Screen>;
}

function Preferences() {
  const [prefs, setPrefs] = useState<any>(null); const [error, setError] = useState(""); const { busy, run } = useAction();
  useEffect(() => { prayerApi("/me").then(d => setPrefs(d.preferences)).catch(e => setError(errorText(e))); }, []);
  if (!prefs) return <Screen><Label>{error || "Chargement…"}</Label></Screen>;
  return <Screen><Title>Langue et rappels</Title><Choices title="Langue préférée" value={prefs.language} options={[["fr", "Français"], ["en", "English"]]} set={language => setPrefs({ ...prefs, language })} /><Label>Le contenu des programmes est proposé dans la langue choisie par son auteur.</Label><Field title="Fuseau horaire" value={prefs.timezone} set={timezone => setPrefs({ ...prefs, timezone })} />{[["programReminders", "Rappels de programme"], ["appointmentReminders", "Rappels de rendez-vous"], ["email", "Recevoir aussi les emails"]].map(([key, label]) => <Toggle key={key} title={label} value={prefs[key]} set={v => setPrefs({ ...prefs, [key]: v })} />)}<Field title="Rappel du matin (HH:mm)" value={prefs.morning} set={morning => setPrefs({ ...prefs, morning })} /><Field title="Rappel du soir (HH:mm)" value={prefs.evening} set={evening => setPrefs({ ...prefs, evening })} /><Label>Les notifications internes essentielles restent accessibles dans ton suivi. Aucun push n’est utilisé.</Label><Button title="Enregistrer" disabled={busy} onPress={() => run(async () => { await prayerApi("/me", "PATCH", prefs); Alert.alert("Enregistré"); })} /></Screen>;
}

async function openProof(p: any) {
  const token = useAuthStore.getState().token;
  const url = `${API_BASE_URL}/admin/uploads/proof/${p.id}`;
  if (Platform.OS === "web") {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("Preuve inaccessible.");
    const blob = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a"); anchor.href = blob; anchor.download = `preuve.${p.mime === "application/pdf" ? "pdf" : p.mime === "image/png" ? "png" : "jpg"}`; anchor.click(); setTimeout(() => URL.revokeObjectURL(blob), 60000);
    return;
  }
  const file = new File(Paths.cache, `proof-${p.id}.${p.mime === "application/pdf" ? "pdf" : p.mime === "image/png" ? "png" : "jpg"}`);
  try {
    await File.downloadFileAsync(url, file, { headers: { Authorization: `Bearer ${token}` }, idempotent: true });
    await Sharing.shareAsync(file.uri, { mimeType: p.mime, dialogTitle: "Consulter la preuve" });
  } finally { if (file.exists) file.delete(); }
}

function Contributions() {
  const [methods, setMethods] = useState<any[]>([]); const [proofs, setProofs] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({}); const [asset, setAsset] = useState<any>(null);
  const { busy, run } = useAction();
  const load = async () => { const [m, p] = await Promise.all([prayerApi("/methods"), prayerApi("/proofs")]); setMethods(m.methods); setProofs(p.proofs); };
  useEffect(() => { void run(load); }, []);
  return <Screen><Title>Contributions</Title><Label>{contributionInfo}</Label>{!methods.length && <Label>Aucun moyen de contribution affiché actuellement.</Label>}{methods.map(m => <View key={m.id} style={card}><Title>{m.name}</Title><Label>{[m.type, m.holder, m.account, m.bank, m.iban, m.swift, m.currency, m.instructions].filter(Boolean).join("\n")}</Label></View>)}<Title>Envoyer une preuve</Title><Choices title="Moyen utilisé (facultatif)" value={form.methodId || ""} options={[["", "Non précisé"], ...methods.map((m): [string, string] => [m.id, m.name])]} set={methodId => setForm({ ...form, methodId })} />{[["amount", "Montant déclaré (facultatif)"], ["currency", "Devise, ex. USD (facultatif)"], ["reference", "Référence (facultative)"]].map(([key, title]) => <Field key={key} title={title} value={form[key]} set={v => setForm({ ...form, [key]: v })} />)}<Button title={asset ? asset.name : "Choisir JPG, PNG ou PDF · 10 Mo maximum"} disabled={busy} onPress={() => run(async () => { const r = await DocumentPicker.getDocumentAsync({ type: ["image/jpeg", "image/png", "application/pdf"], copyToCacheDirectory: true }); if (!r.canceled) { if ((r.assets[0].size || 0) > 10 * 1024 * 1024) throw new Error("Taille maximale : 10 Mo."); setAsset(r.assets[0]); } })} /><Button title="Envoyer la preuve" disabled={busy || !asset} onPress={() => run(async () => { const values = Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim())); await apiAdminUploadFile(asset.uri, asset.name, asset.mimeType, false, values); setAsset(null); await load(); Alert.alert("Preuve reçue", "Ton suivi et tes droits restent indépendants de ta contribution."); })} /><Title>Mes preuves</Title>{proofs.map(p => <View key={p.id} style={card}><Label>{dateLabel(p.createdAt)} · {p.status} · {p.amount || ""} {p.currency || ""}</Label><Button title="Consulter le fichier" disabled={busy} onPress={() => run(() => openProof(p))} /></View>)}</Screen>;
}

export function NotificationsScreen({ id }: { id?: string }) {
  const [data, setData] = useState<any[]>([]); const [error, setError] = useState("");
  useFocusEffect(useCallback(() => { prayerApi(id ? `/notifications/${id}` : "/notifications").then(d => { setData(id ? [d.notification] : d.notifications); if (id) void prayerApi(`/notifications/${id}`, "PATCH"); }).catch(e => setError(errorText(e))); }, [id]));
  return <Screen><Title>Notifications</Title>{!!error && <Label>{error}</Label>}{!error && !data.length && <Label>Aucune notification.</Label>}{data.map(n => <View style={card} key={n.id}><Title>{!n.readAt ? "● " : ""}{n.title}</Title><Label>{n.message}</Label><Label>{dateLabel(n.createdAt)}</Label>{!n.readAt && <Button title="Marquer comme lue" onPress={() => prayerApi(`/notifications/${n.id}`, "PATCH").then(() => setData(data.map(x => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))).catch(e => Alert.alert("Erreur", errorText(e)))} />}{n.resourceId && <Button title="Ouvrir le suivi" onPress={() => n.resourceType === "program" ? go("program", { id: n.resourceId }) : n.resourceType === "request" ? go("request", { id: n.resourceId }) : n.resourceType === "proof" ? go("contributions") : router.push("/(tabs)/tracking" as any)} />}</View>)}</Screen>;
}

const blankDay = () => ({ id: `day-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: "Nouvelle journée", orientation: "", personalRequest: "", scriptures: "", prayer: "", proclamations: "", commitment: "", actions: "", preparation: "", audioUrl: "" });
function ProgramEditor({ id, requestId }: { id?: string; requestId?: string }) {
  const [program, setProgram] = useState<any>({ title: "", description: "", kind: requestId ? "PERSONNEL" : "PUBLIC", requestId: requestId || null, published: false, days: [blankDay()] });
  const [requests, setRequests] = useState<any[]>([]); const [dayIndex, setDayIndex] = useState(0); const { busy, run } = useAction();
  useEffect(() => { void run(async () => { setRequests((await prayerApi("/requests?team=true")).requests); if (id) { const { program: p } = await prayerApi(`/programs/${id}`); setProgram({ title: p.title, description: p.description || "", kind: p.kind, requestId: p.requestId, published: p.published, days: p.days }); } }); }, [id]);
  const set = (key: string, value: any) => setProgram({ ...program, [key]: value });
  const day = program.days[dayIndex];
  const setDay = (key: string, value: any) => set("days", program.days.map((d: any, i: number) => i === dayIndex ? { ...d, [key]: value } : d));
  return <Screen><Title>{id ? "Modifier le programme" : "Créer un programme"}</Title><Field title="Titre" value={program.title} set={v => set("title", v)} /><Field title="Description" multiline value={program.description} set={v => set("description", v)} /><Choices title="Type" value={program.kind} options={[["PUBLIC", "Public"], ["PERSONNEL", "Personnel"], ["MODELE", "Modèle réutilisable"]]} set={v => set("kind", v)} />{program.kind === "PERSONNEL" && <Choices title="Demande liée" value={program.requestId || ""} options={requests.map(r => [r.id, `${r.user.fullName} · ${r.category}`])} set={v => set("requestId", v)} />}<Choices title="Journées" value={String(dayIndex)} options={program.days.map((d: any, i: number) => [String(i), `${i + 1}. ${d.title}`])} set={v => setDayIndex(Number(v))} /><Field title="Titre de la journée" value={day.title} set={v => setDay("title", v)} />{dayFields.filter(([k]) => k !== "validation").map(([key, title]) => <Field key={key} title={title} value={day[key]} multiline set={v => setDay(key, v)} />)}<Field title="Audio : URL facultative" value={day.audioUrl} set={v => setDay("audioUrl", v)} /><Button title={id ? "Importer un audio" : "Enregistrer d’abord pour importer un audio"} disabled={busy || !id} onPress={() => run(async () => { const r = await DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true }); if (!r.canceled) { const a = r.assets[0]; if (!id) throw new Error("Enregistre d’abord le programme, puis ouvre-le pour importer son audio."); const result = await apiAdminUploadFile(a.uri, a.name, a.mimeType || "audio/mpeg", false, undefined, id); setDay("audioUrl", result.file.url); } })} /><Button title="Ajouter une journée" onPress={() => { set("days", [...program.days, blankDay()]); setDayIndex(program.days.length); }} /><Button title="Dupliquer cette journée" onPress={() => { set("days", [...program.days, { ...day, id: blankDay().id, title: `${day.title} (copie)` }]); setDayIndex(program.days.length); }} />{program.kind !== "MODELE" && <Toggle title="Publié / disponible pour le membre" value={program.published} set={v => set("published", v)} />}<Button title="Enregistrer le programme" disabled={busy || !program.title.trim()} onPress={() => run(async () => { await prayerApi(id ? `/programs/${id}` : "/programs", id ? "PATCH" : "POST", program); router.back(); })} /></Screen>;
}

function TeamScreen() {
  const [role, setRole] = useState(""); const [section, setSection] = useState("requests"); const [rows, setRows] = useState<any[]>([]); const [team, setTeam] = useState<any[]>([]); const [selected, setSelected] = useState<any>(null);
  const [filters, setFilters] = useState({ status: "", category: "", date: "", companionId: "" }); const [form, setForm] = useState<any>({}); const { busy, run } = useAction();
  const sectionRef = useRef(section); sectionRef.current = section;
  const admin = role === "ADMINISTRATEUR";
  const load = async () => { const me = await prayerApi("/me"); setRole(me.role); if (me.role === "MEMBRE") return; setTeam((await prayerApi("/team")).users); const query = new URLSearchParams({ team: "true", ...(section === "requests" ? Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) : {}) }); const d = await prayerApi(`/${section}?${query}`); if (sectionRef.current === section) setRows(d[section] || []); };
  useFocusEffect(useCallback(() => { setSelected(null); void load().catch(e => Alert.alert("Information", errorText(e))); }, [section]));
  const select = (r: any) => { setSelected(r); setForm({ ...r }); if (section === "requests") void run(async () => { const detail = await prayerApi(`/requests/${r.id}`); setSelected({ ...r, advancement: detail.advancement }); }); };
  const assignOptions: [string, string][] = [["", "Non attribué"], ...team.map((u): [string, string] => [u.id, u.fullName])];
  if (role === "MEMBRE") return <Screen><Label>Accès réservé à l’équipe.</Label></Screen>;
  return <Screen><Title>Accompagnement · Administration</Title><Choices title="Gérer" value={section} options={[["requests", "Demandes"], ["appointments", "Rendez-vous"], ["programs", "Programmes"], ["slots", "Disponibilités"], ...(admin ? [["methods", "Moyens de contribution"], ["proofs", "Preuves"], ["testimonies", "Témoignages"]] : [])] as [string, string][]} set={value => { setRows([]); setSelected(null); setForm({}); setSection(value); }} />
    {section === "requests" && <View style={card}><Choices title="Statut" value={filters.status} options={[["", "Tous"], ...Object.entries(statuses)]} set={status => setFilters({ ...filters, status })} /><Field title="Sujet" value={filters.category} set={category => setFilters({ ...filters, category })} /><Field title="Date (AAAA-MM-JJ)" value={filters.date} set={date => setFilters({ ...filters, date })} />{admin && <Choices title="Accompagnateur" value={filters.companionId} options={assignOptions} set={companionId => setFilters({ ...filters, companionId })} />}<Button title="Filtrer" disabled={busy} onPress={() => run(load)} /></View>}
    {section === "programs" && <Button title="Créer un programme" onPress={() => go("edit-program")} />}
    {section === "slots" && <View style={card}><Field title="Date et heure avec décalage (ex. 2026-10-01T15:00:00+02:00)" value={form.startsAt} set={v => setForm({ ...form, startsAt: v })} /><Field title="Fuseau (ex. Europe/Brussels)" value={form.timezone} set={v => setForm({ ...form, timezone: v })} /><Field title="Durée en minutes" value={form.duration} set={v => setForm({ ...form, duration: v })} /><Field title="Contribution éventuelle (texte indicatif)" value={form.contribution} set={v => setForm({ ...form, contribution: v })} /><Button title="Ajouter le créneau" disabled={busy} onPress={() => run(async () => { await prayerApi("/slots", "POST", { startsAt: form.startsAt, timezone: form.timezone, duration: Number(form.duration), contribution: form.contribution || "" }); await load(); })} /></View>}
    {section === "methods" && <Button title="Nouveau moyen" onPress={() => { setSelected({ id: "" }); setForm({ name: "", type: "", holder: "", account: "", bank: "", iban: "", swift: "", currency: "USD", instructions: "", active: true, displayOrder: 0 }); }} />}
    {rows.map(r => <View key={r.id} style={card}><Title>{r.title || r.name || r.category || r.user?.fullName || (r.startsAt ? dateLabel(r.startsAt, r.timezone) : r.id)}</Title>{section === "requests" && <Label>{r.user.fullName} · {r.followUp} · {statuses[r.status]} · {dateLabel(r.createdAt)} · {team.find(u => u.id === r.companionId)?.fullName || "Non attribué"}</Label>}{section === "appointments" && <Label>{dateLabel(r.slot.startsAt, r.timezone)} · {r.timezone} · {r.slot.duration} min · {team.find(u => u.id === r.companionId)?.fullName || "Non attribué"} · {r.closedAt ? "Clôturé" : "Confirmé"}</Label>}{section === "programs" && <><Label>{r.kind} · {r.published ? "Publié" : "Brouillon"}</Label><Button title="Modifier les journées" onPress={() => go("edit-program", { id: r.id })} /><Button title="Dupliquer le programme" disabled={busy} onPress={() => run(async () => { const d = await prayerApi(`/programs/${r.id}/duplicate`, "POST", {}); go("edit-program", { id: d.program.id }); })} /></>}{section === "slots" ? <Button title="Retirer ce créneau disponible" disabled={busy} onPress={() => run(async () => { await prayerApi(`/slots/${r.id}`, "DELETE"); await load(); })} /> : section !== "programs" && <Button title="Ouvrir / détails" onPress={() => select(r)} />}</View>)}
    {!rows.length && <Label>Aucun élément.</Label>}
    {selected && <View style={card}><Title>Détails</Title>
      {section === "requests" && <><Label>{selected.text}</Label><Label>{selected.country} · {selected.timezone}</Label>{selected.advancement?.map((p: any) => <Label key={p.title}>{p.title} : {p.completed}/{p.days} journées validées</Label>)}{!!selected.reply && <Label>Précision du membre : {selected.reply}</Label>}<Choices title="Statut" value={form.status} options={Object.entries(statuses)} set={v => setForm({ ...form, status: v })} />{admin && <Choices title="Accompagnateur" value={form.companionId || ""} options={assignOptions} set={v => setForm({ ...form, companionId: v || null })} />}<Field title="Demander une précision" multiline value={form.clarification} set={v => setForm({ ...form, clarification: v })} /><Button title="Enregistrer le suivi" disabled={busy} onPress={() => run(async () => { await prayerApi(`/requests/${selected.id}`, "PATCH", { status: form.status, clarification: form.clarification || "", ...(admin ? { companionId: form.companionId || null } : {}) }); await load(); })} /><Button title="Préparer un programme personnel" onPress={() => go("edit-program", { requestId: selected.id })} /><Button title="Choisir un modèle dans Programmes" onPress={() => { setRows([]); setSelected(null); setSection("programs"); }} /></>}
      {section === "appointments" && <><Label>{selected.user.fullName} · {dateLabel(selected.slot.startsAt, selected.timezone)}</Label><Label>Contribution indicative : {selected.slot.contribution || "Aucune"}</Label>{admin && <><Choices title="Accompagnateur" value={form.companionId || ""} options={assignOptions} set={v => setForm({ ...form, companionId: v || null })} /><Field title="Lien Zoom HTTPS" value={form.zoomUrl} set={v => setForm({ ...form, zoomUrl: v })} /><Button title="Enregistrer" disabled={busy} onPress={() => run(async () => { await prayerApi(`/appointments/${selected.id}`, "PATCH", { companionId: form.companionId || null, ...(form.zoomUrl ? { zoomUrl: form.zoomUrl } : {}) }); await load(); })} /></>}<Button title="Clôturer le rendez-vous" disabled={busy || !!selected.closedAt} onPress={() => run(async () => { await prayerApi(`/appointments/${selected.id}`, "PATCH", { close: true }); await load(); setSelected(null); })} /><Button title="Proposer un programme écrit" onPress={() => go("edit-program", { requestId: selected.requestId })} /></>}
      {section === "methods" && <>{[["name", "Nom"], ["type", "Type"], ["holder", "Titulaire"], ["account", "Numéro / téléphone / compte"], ["bank", "Banque"], ["iban", "IBAN"], ["swift", "SWIFT"], ["currency", "Devise (3 lettres)"], ["instructions", "Instructions"], ["displayOrder", "Ordre d’affichage"]].map(([key, title]) => <Field key={key} title={title} value={form[key]} set={v => setForm({ ...form, [key]: v })} />)}<Toggle title="Actif" value={form.active} set={v => setForm({ ...form, active: v })} /><Button title="Enregistrer" disabled={busy} onPress={() => run(async () => { const { id: ignored, ...body } = form; await prayerApi(selected.id ? `/methods/${selected.id}` : "/methods", selected.id ? "PATCH" : "POST", { ...body, displayOrder: Number(body.displayOrder) }); setSelected(null); await load(); })} /></>}
      {section === "proofs" && <><Label>{selected.user.fullName} · {selected.amount || "Non précisé"} {selected.currency || ""}</Label><Label>{selected.method?.name || "Moyen non précisé"} · {selected.reference || "Sans référence"} · {dateLabel(selected.createdAt)}</Label><Label>Statut : {selected.status}. Sans effet sur les droits ou le suivi.</Label><Button title="Consulter la preuve" disabled={busy} onPress={() => run(() => openProof(selected))} />{["VERIFIEE", "REFUSEE"].map(status => <Button key={status} title={status === "VERIFIEE" ? "Vérifier" : "Refuser"} disabled={busy} onPress={() => run(async () => { await prayerApi(`/proofs/${selected.id}`, "PATCH", { status }); setSelected({ ...selected, status }); await load(); })} />)}</>}
      {section === "testimonies" && <><Label>{selected.text}</Label><Label>{selected.consent ? "Consentement donné" : "Pas de consentement"}</Label><Button title={selected.published ? "Retirer de la publication" : "Publier avec consentement"} disabled={busy || (!selected.consent && !selected.published)} onPress={() => run(async () => { await prayerApi(`/testimonies/${selected.id}`, "PATCH", { published: !selected.published }); setSelected(null); await load(); })} /></>}
    </View>}
  </Screen>;
}

export default function PrayerPage() {
  const params = useLocalSearchParams<{ section: string; id?: string; requestId?: string }>();
  const token = useAuthStore(s => s.token);
  if (!token) return <Screen><Title>Ton accompagnement</Title><Button title="Se connecter" onPress={() => router.push("/sign-in")} /></Screen>;
  switch (params.section) {
    case "help": return <HelpForm />;
    case "request": return <RequestDetail key={params.id} id={params.id!} />;
    case "program": return <ProgramReader key={params.id} id={params.id!} />;
    case "preferences": return <Preferences />;
    case "contributions": return <Contributions />;
    case "testimony": return <TestimonyForm />;
    case "testimonies": return <PublishedTestimonies />;
    case "team": return <TeamScreen />;
    case "edit-program": return <ProgramEditor key={params.id || params.requestId || "new"} id={params.id} requestId={params.requestId} />;
    case "privacy": return <Screen><Title>Confidentialité</Title><Label>Les demandes sont privées : seuls les membres concernés, l’administration et les accompagnateurs attribués peuvent les consulter. Les preuves sont réservées à leur propriétaire et à l’administration. Les coordonnées personnelles des accompagnateurs ne sont pas affichées.</Label><Label>Tu peux supprimer une demande depuis Mon suivi et ton compte depuis Modifier mon profil. Un témoignage n’est publié qu’avec ton consentement, que tu peux retirer depuis Mon suivi.</Label><Label>{disclaimer}</Label><Button title="Modifier mon profil / supprimer mon compte" onPress={() => router.push("/settings/edit")} /></Screen>;
    default: return <Screen><Label>Page introuvable.</Label></Screen>;
  }
}
