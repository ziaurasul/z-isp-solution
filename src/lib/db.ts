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

/**
 * Ensures all required tables and columns exist in the database.
 * Uses a simple boolean flag — no promise caching that could cache failures.
 */
export async function ensureTables() {
  if (globalForPrisma.tablesEnsured) return;

  try {
    await db.$executeRawUnsafe(`SELECT 1 FROM "Business" LIMIT 1`);
    // Tables exist — check for new columns
    try {
      await db.$executeRawUnsafe(`SELECT "invoiceTemplate" FROM "Business" LIMIT 1`);
    } catch {
      const alterStatements = [
        `ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "invoiceTemplate" TEXT NOT NULL DEFAULT 'modern'`,
        `ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "invoiceColor" TEXT NOT NULL DEFAULT '#10b981'`,
        `ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false`,
        `ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "whatsappToken" TEXT`,
      ];
      for (const stmt of alterStatements) {
        try { await db.$executeRawUnsafe(stmt); } catch {}
      }
    }
    // Check if Message table exists
    try {
      await db.$executeRawUnsafe(`SELECT 1 FROM "Message" LIMIT 1`);
    } catch {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Message" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "businessId" TEXT NOT NULL,
          "customerId" TEXT,
          "channel" TEXT NOT NULL DEFAULT 'inapp',
          "direction" TEXT NOT NULL DEFAULT 'outgoing',
          "content" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'sent',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
          FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL
        )
      `);
    }
    globalForPrisma.tablesEnsured = true;
  } catch {
    // Tables don't exist yet — create them all
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
        "invoiceTemplate" TEXT NOT NULL DEFAULT 'modern',
        "invoiceColor" TEXT NOT NULL DEFAULT '#10b981',
        "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
        "whatsappToken" TEXT,
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
      `CREATE TABLE IF NOT EXISTS "Message" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessId" TEXT NOT NULL,
        "customerId" TEXT,
        "channel" TEXT NOT NULL DEFAULT 'inapp',
        "direction" TEXT NOT NULL DEFAULT 'outgoing',
        "content" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'sent',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL
      )`,
    ];
    for (const stmt of statements) {
      try { await db.$executeRawUnsafe(stmt); } catch {}
    }
    globalForPrisma.tablesEnsured = true;
  }
}
