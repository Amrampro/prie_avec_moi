// api/src/server.js
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = createApp();

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // app.listen(env.port, "0.0.0.0", () => {
    //   console.log(`🚀 API running on http://0.0.0.0:${env.port}/api`);
    // });
    app.listen(env.port, () => {
      console.log(`API running on http://localhost:${env.port}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1); // stop the app
  }
}

startServer();

/*
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

// app.listen(env.port, () => {
//   console.log(`API running on http://localhost:${env.port}/api`);
// });

app.listen(env.port, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${env.port}/api`);
});

// api/src/server.js ou app.js
// app.get("/health", (req, res) => res.json({ ok: true }));
*/
