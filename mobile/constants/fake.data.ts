// =============================
// Types
// =============================

export type FakeUser = {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
};

export type FakeMeditation = {
  id: string;
  slug: string;
  title: string;
  image: string;
  bodyText: string;
  footerText: string;
  audioDuration: string;
  type: "daily" | "series";
  date?: string;
  seriesId?: string;
  episodeNumber?: number;
};

export type FakeSeries = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover: string;
  meditations: FakeMeditation[];
};

// =============================
// Fake User
// =============================

export const fakeUser: FakeUser = {
  id: "u1",
  fullName: "Utilisateur Prie",
  email: "user@prieavecmoi.app",
  avatar: "https://picsum.photos/seed/user/200/200",
};

// =============================
// Fake Meditations
// =============================

export const fakeMeditations: FakeMeditation[] = [
  {
    id: "m1",
    slug: "la-paix-qui-garde-le-coeur",
    title: "La paix qui garde le cœur",
    image: "https://picsum.photos/seed/peace/900/900",
    bodyText:
      "Aujourd’hui, prends un moment pour déposer ce qui pèse. La paix de Dieu n’est pas l’absence de problèmes, mais Sa présence au milieu d’eux.",
    footerText:
      "Prière : Seigneur, je reçois Ta paix. Apprends-moi à Te faire confiance aujourd’hui.",
    audioDuration: "07:34",
    type: "daily",
    date: "2026-02-13",
  },
  {
    id: "m2",
    slug: "un-pas-de-foi",
    title: "Un pas de foi",
    image: "https://picsum.photos/seed/faith/900/900",
    bodyText:
      "La foi commence souvent petit. Un pas. Une décision. Une prière. Mais c’est suffisant pour commencer un chemin.",
    footerText:
      "Action : écris une chose que tu vas confier à Dieu aujourd’hui.",
    audioDuration: "06:12",
    type: "series",
    seriesId: "s1",
    episodeNumber: 1,
  },
  {
    id: "m3",
    slug: "quand-tu-ne-vois-rien",
    title: "Quand tu ne vois rien",
    image: "https://picsum.photos/seed/hope/900/900",
    bodyText:
      "Il y a des saisons où l’on ne voit pas encore le fruit. Pourtant, Dieu travaille dans le secret.",
    footerText:
      "Déclaration : Dieu agit, même quand je ne vois pas.",
    audioDuration: "08:01",
    type: "series",
    seriesId: "s1",
    episodeNumber: 2,
  },
];

// =============================
// Fake Series
// =============================

export const fakeSeries: FakeSeries[] = [
  {
    id: "s1",
    slug: "21-jours-de-foi",
    title: "21 jours de foi",
    description:
      "Une série courte et profonde pour bâtir une foi stable, pratique et quotidienne.",
    cover: "https://picsum.photos/seed/series-faith/900/900",
    meditations: fakeMeditations.filter((m) => m.seriesId === "s1"),
  },
  {
    id: "s2",
    slug: "paix-interieure",
    title: "Paix intérieure",
    description:
      "Des méditations pour calmer l’âme, recentrer le cœur et écouter Dieu.",
    cover: "https://picsum.photos/seed/series-peace/900/900",
    meditations: [
      {
        id: "m4",
        slug: "respire-et-reviens-a-dieu",
        title: "Respire et reviens à Dieu",
        image: "https://picsum.photos/seed/breathe/900/900",
        bodyText:
          "Respire. Ralentis. Dieu n’est pas pressé. Il t’appelle à revenir à Lui simplement.",
        footerText:
          "Prière : Seigneur, je reviens à Toi maintenant.",
        audioDuration: "05:49",
        type: "series",
        seriesId: "s2",
        episodeNumber: 1,
      },
    ],
  },
];


export type FakeNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string; // "Il y a 2h" (mock)
};

export const fakeNotifications: FakeNotification[] = [
  {
    id: "n1",
    title: "Rappel",
    body: "Ta méditation du jour t’attend 🙏",
    createdAt: "Aujourd’hui",
  },
];
