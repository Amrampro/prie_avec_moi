import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  jwtSecret: process.env.JWT_SECRET ?? "dev_secret",
  databaseUrl: process.env.DATABASE_URL,
};
