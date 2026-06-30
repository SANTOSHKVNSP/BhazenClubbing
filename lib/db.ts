// Prisma client singleton (avoids exhausting connections in dev/HMR).
// Requires `npm install @prisma/client prisma` + `prisma generate`.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
