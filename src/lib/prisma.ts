/* eslint-disable @typescript-eslint/no-require-imports */
// Use require() to avoid IDE false-positive on Prisma v7's type exports
const { PrismaClient } = require("@prisma/client")
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3")

const DB_URL = process.env.DATABASE_URL || "file:./hosapp.db"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientInstance = any

const prismaClientSingleton = (): PrismaClientInstance => {
  const adapter = new PrismaBetterSqlite3({ url: DB_URL })
  return new PrismaClient({ adapter })
}

// Cast globalThis to avoid 'property does not exist' TS error in dev singleton pattern
const g = globalThis as typeof globalThis & { _prisma?: PrismaClientInstance }

const prisma: PrismaClientInstance = g._prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== "production") g._prisma = prisma
