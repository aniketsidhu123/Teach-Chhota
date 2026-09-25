import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";

export const chaptersTable = sqliteTable("chapters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classLevel: integer("class_level").notNull(),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
});

export const chapterChunksTable = sqliteTable("chapter_chunks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chapterId: integer("chapter_id").references(() => chaptersTable.id).notNull(),
  chunkText: text("chunk_text").notNull(),
  embedding: text("embedding", { mode: 'json' }).notNull(), // We use JSON to store the array of floats
});

import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";

export const insertChapterSchema = createInsertSchema(chaptersTable).omit({ id: true });
export type InsertChapter = InferInsertModel<typeof chaptersTable>;
export type Chapter = InferSelectModel<typeof chaptersTable>;

export const insertChapterChunkSchema = createInsertSchema(chapterChunksTable).omit({ id: true });
export type InsertChapterChunk = InferInsertModel<typeof chapterChunksTable>;
export type ChapterChunk = InferSelectModel<typeof chapterChunksTable>;