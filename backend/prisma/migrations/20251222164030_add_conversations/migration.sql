-- AlterTable
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "profilePicUrl" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "profilePicUrl" TEXT,
    "customerId" TEXT,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessagePreview" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "closeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_chatId_sessionId_key" ON "conversations"("chatId", "sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "conversations_sessionId_lastMessageAt_idx" ON "conversations"("sessionId", "lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "conversations_assignedTo_idx" ON "conversations"("assignedTo");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "conversations_status_idx" ON "conversations"("status");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_chatId_sessionId_fkey" FOREIGN KEY ("chatId", "sessionId") REFERENCES "chats"("chatId", "sessionId") ON DELETE CASCADE ON UPDATE CASCADE;
