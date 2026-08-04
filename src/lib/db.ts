import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  tablesEnsured: boolean | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Auto-create tables on first request in production (fresh Neon DB)
export async function ensureTables() {
  if (globalForPrisma.tablesEnsured) return;
  if (process.env.NODE_ENV === 'production') {
    try {
      await db.$executeRawUnsafe(`SELECT 1 FROM "Business" LIMIT 1`);
      globalForPrisma.tablesEnsured = true;
    } catch {
      // Tables don't exist yet — create them one by one
      const statements = [
        `CREATE TABLE IF NOT EXISTS "Business" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "phone" TEXT,
          "address" TEXT,
          "logo" TEXT,
          "plan" TEXT NOT NULL DEFAULT 'trial',
          "trialEndsAt" TIMESTAMP,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "Business_email_key" ON "Business"("email")`,
        `CREATE TABLE IF NOT EXISTS "Customer" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "businessId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "phone" TEXT NOT NULL,
          "email" TEXT,
          "address" TEXT,
          "cnic" TEXT,
          "status" TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS "Vendor" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "businessId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "phone" TEXT NOT NULL,
          "email" TEXT,
          "address" TEXT,
          "service" TEXT,
          "status" TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS "Employee" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "businessId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "phone" TEXT NOT NULL,
          "email" TEXT,
          "role" TEXT NOT NULL DEFAULT 'technician',
          "salary" DOUBLE PRECISION,
          "status" TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS "Connection" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "businessId" TEXT NOT NULL,
          "customerId" TEXT NOT NULL,
          "packageType" TEXT NOT NULL,
          "packageName" TEXT,
          "speed" TEXT,
          "monthlyFee" DOUBLE PRECISION NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'active',
          "activatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" TIMESTAMP,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
          FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS "Invoice" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "businessId" TEXT NOT NULL,
          "connectionId" TEXT NOT NULL,
          "month" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'unpaid',
          "dueDate" TIMESTAMP,
          "paidAt" TIMESTAMP,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
          FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS "Payment" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "businessId" TEXT NOT NULL,
          "customerId" TEXT NOT NULL,
          "connectionId" TEXT,
          "invoiceId" TEXT,
          "amount" DOUBLE PRECISION NOT NULL,
          "method" TEXT,
          "collectedBy" TEXT,
          "note" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
          FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE,
          FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE SET NULL,
          FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS "Expense" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "businessId" TEXT NOT NULL,
          "vendorId" TEXT,
          "employeeId" TEXT,
          "category" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "description" TEXT,
          "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
          FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL,
          FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "businessId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'info',
          "isRead" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
        )`,
      ];
      for (const stmt of statements) {
        await db.$executeRawUnsafe(stmt);
      }
      globalForPrisma.tablesEnsured = true;
    }
  }
}
