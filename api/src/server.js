// api/src/server.js

import { createApp } from "./app.js";
import { startPrayerReminders } from "./modules/prayer/prayer.notifications.js";
import { env } from "./config/env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = createApp();

async function startServer() {
  try {
    await prisma.$connect();

    console.log("✅ Database connected successfully");
    startPrayerReminders();

    const PORT = process.env.PORT || env.port || 4000;

    app.listen(PORT, () => {
      console.log(`🚀 API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1);
  }
}

startServer();
