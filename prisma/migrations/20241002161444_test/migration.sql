/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `name` on the `DynamicTable` table. All the data in the column will be lost.
  - Added the required column `username` to the `DynamicTable` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DynamicTable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL
);
INSERT INTO "new_DynamicTable" ("id") SELECT "id" FROM "DynamicTable";
DROP TABLE "DynamicTable";
ALTER TABLE "new_DynamicTable" RENAME TO "DynamicTable";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
