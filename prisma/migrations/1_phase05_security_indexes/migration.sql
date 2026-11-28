-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "departmentId" TEXT;

-- CreateIndex
CREATE INDEX "Achievement_departmentId_status_createdAt_idx" ON "Achievement"("departmentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Incident_departmentId_status_deletedAt_idx" ON "Incident"("departmentId", "status", "deletedAt");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill Incident.departmentId from Student or Reporter User
UPDATE "Incident" i
SET "departmentId" = COALESCE(
  (SELECT s."departmentId" FROM "Student" s WHERE s."id" = i."studentId"),
  (SELECT u."departmentId" FROM "User" u WHERE u."id" = i."reporterId")
)
WHERE i."departmentId" IS NULL;
