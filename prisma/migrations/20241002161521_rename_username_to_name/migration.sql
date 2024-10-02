/*
  Warnings:

  - You are about to drop the column `username` on the `DynamicTable` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DynamicTable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT DEFAULT 'null'
);
INSERT INTO "new_DynamicTable" ("id") SELECT "id" FROM "DynamicTable";
DROP TABLE "DynamicTable";
ALTER TABLE "new_DynamicTable" RENAME TO "DynamicTable";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
