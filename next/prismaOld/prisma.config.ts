import { defineConfig } from "prisma/config";

export default defineConfig({
  // the main entry for your schema
  schema: "prismaOld/schema.prisma",
  // The database URL
  datasource: {
    url: process.env.DATABASE_URL_OLD,
  },
});
