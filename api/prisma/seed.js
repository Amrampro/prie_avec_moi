import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Admin + user
  await prisma.user.upsert({
    where: { email: "admin@prieavecmoi.app" },
    update: {},
    create: {
      fullName: "Admin Prie",
      email: "admin@prieavecmoi.app",
      passwordHash: "$2a$10$8nYk6t2bZkM8y3J0p8Vd1O5c7Pp3g9wA0Z9rjI2Hq8P8q9rWJY1Y2", // mock hash
      isAdmin: true,
      avatarUrl: "https://picsum.photos/seed/admin/200/200",
    },
  });

  await prisma.user.upsert({
    where: { email: "user@prieavecmoi.app" },
    update: {},
    create: {
      fullName: "Utilisateur Prie",
      email: "user@prieavecmoi.app",
      passwordHash: "$2a$10$8nYk6t2bZkM8y3J0p8Vd1O5c7Pp3g9wA0Z9rjI2Hq8P8q9rWJY1Y2", // mock hash
      isAdmin: false,
      avatarUrl: "https://picsum.photos/seed/user/200/200",
    },
  });

  // Series
  const s1 = await prisma.series.upsert({
    where: { slug: "21-jours-de-foi" },
    update: {},
    create: {
      title: "21 jours de foi",
      slug: "21-jours-de-foi",
      description: "Une série courte et profonde pour bâtir une foi stable, pratique et quotidienne.",
      coverUrl: "https://picsum.photos/seed/series-faith/900/900",
      isPublished: true,
    },
  });

  const s2 = await prisma.series.upsert({
    where: { slug: "paix-interieure" },
    update: {},
    create: {
      title: "Paix intérieure",
      slug: "paix-interieure",
      description: "Des méditations pour calmer l’âme, recentrer le cœur et écouter Dieu.",
      coverUrl: "https://picsum.photos/seed/series-peace/900/900",
      isPublished: true,
    },
  });

  // Meditations
  await prisma.meditation.upsert({
    where: { slug: "la-paix-qui-garde-le-coeur" },
    update: {
      isPublished: true,
    },
    create: {
      title: "La paix qui garde le cœur",
      slug: "la-paix-qui-garde-le-coeur",
      imageUrl: "https://picsum.photos/seed/peace/900/900",
      bodyText:
        "Aujourd’hui, prends un moment pour déposer ce qui pèse. La paix de Dieu n’est pas l’absence de problèmes, mais Sa présence au milieu d’eux.",
      footerText: "Prière : Seigneur, je reçois Ta paix. Apprends-moi à Te faire confiance aujourd’hui.",
      audioUrl: "https://example.com/audio/peace.mp3",
      audioDuration: "07:34",
      isPublished: true,
    },
  });

  await prisma.meditation.upsert({
    where: { slug: "un-pas-de-foi" },
    update: {
      isPublished: true,
      seriesId: s1.id,
    },
    create: {
      title: "Un pas de foi",
      slug: "un-pas-de-foi",
      imageUrl: "https://picsum.photos/seed/faith/900/900",
      bodyText: "La foi commence souvent petit. Un pas. Une décision. Une prière.",
      footerText: "Action : écris une chose que tu vas confier à Dieu aujourd’hui.",
      audioUrl: "https://example.com/audio/faith1.mp3",
      audioDuration: "06:12",
      isPublished: true,
      seriesId: s1.id,
    },
  });

  await prisma.meditation.upsert({
    where: { slug: "quand-tu-ne-vois-rien" },
    update: {
      isPublished: true,
      seriesId: s1.id,
    },
    create: {
      title: "Quand tu ne vois rien",
      slug: "quand-tu-ne-vois-rien",
      imageUrl: "https://picsum.photos/seed/hope/900/900",
      bodyText: "Il y a des saisons où l’on ne voit pas encore le fruit. Pourtant, Dieu travaille.",
      footerText: "Déclaration : Dieu agit, même quand je ne vois pas.",
      audioUrl: "https://example.com/audio/faith2.mp3",
      audioDuration: "08:01",
      isPublished: true,
      seriesId: s1.id,
    },
  });

  await prisma.meditation.upsert({
    where: { slug: "respire-et-reviens-a-dieu" },
    update: {
      isPublished: true,
      seriesId: s2.id,
    },
    create: {
      title: "Respire et reviens à Dieu",
      slug: "respire-et-reviens-a-dieu",
      imageUrl: "https://picsum.photos/seed/breathe/900/900",
      bodyText: "Respire. Ralentis. Dieu n’est pas pressé. Il t’appelle à revenir à Lui.",
      footerText: "Prière : Seigneur, je reviens à Toi maintenant.",
      audioUrl: "https://example.com/audio/peace1.mp3",
      audioDuration: "05:49",
      isPublished: true,
      seriesId: s2.id,
    },
  });

  console.log("✅ Seed terminé !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
