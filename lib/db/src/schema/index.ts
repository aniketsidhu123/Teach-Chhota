import { sqliteTable, text, integer, real, uniqueIndex, index, primaryKey } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";

// ─── Existing tables (untouched) ───────────────────────────────────────────

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

// ─── New gamification tables ───────────────────────────────────────────────

export const usersTable = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID
  username: text("username").unique().notNull(),
  displayName: text("display_name").notNull(),
  classLevel: integer("class_level").notNull(),
  friendCode: text("friend_code").unique().notNull(), // 6-char shareable code
  avatarStage: integer("avatar_stage").notNull().default(0), // 0=Beej..7=Guru
  samajhScoreTotal: real("samajh_score_total").notNull().default(0),
  samajhScoreMaths: real("samajh_score_maths").notNull().default(0),
  samajhScoreScience: real("samajh_score_science").notNull().default(0),
  gyaanCoins: integer("gyaan_coins").notNull().default(0),
  teachingStyle: text("teaching_style"), // "analogy_master", etc.
  streakCurrent: integer("streak_current").notNull().default(0),
  streakBest: integer("streak_best").notNull().default(0),
  streakFreezeAvailable: integer("streak_freeze_available").notNull().default(1),
  streakFreezeUsedThisMonth: integer("streak_freeze_used_this_month").notNull().default(0),
  weeklyRingDays: text("weekly_ring_days").notNull().default("[]"), // JSON array of date strings
  subscriptionTier: text("subscription_tier").notNull().default("free"), // 'free' | 'plus'
  subscriptionExpiresAt: text("subscription_expires_at"),
  profileTheme: text("profile_theme").notNull().default("default"),
  profileVisibility: text("profile_visibility").notNull().default("friends"), // 'friends' | 'hidden'
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const teachingSessionsTable = sqliteTable("teaching_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => usersTable.id).notNull(),
  chapterId: integer("chapter_id").references(() => chaptersTable.id),
  conceptKey: text("concept_key").notNull(),
  misconceptionId: text("misconception_id"),
  explanationText: text("explanation_text").notNull(),
  aiScore: real("ai_score").notNull().default(0),
  aiCorrectness: real("ai_correctness").notNull().default(0),
  aiClarity: real("ai_clarity").notNull().default(0),
  aiAnalogyUse: real("ai_analogy_use").notNull().default(0),
  aiMisconceptionFixed: integer("ai_misconception_fixed").notNull().default(0), // boolean
  aiStyleTrait: text("ai_style_trait"),
  samajhDelta: real("samajh_delta").notNull().default(0),
  coinsEarned: integer("coins_earned").notNull().default(0),
  attemptNumber: integer("attempt_number").notNull().default(1),
  sessionType: text("session_type").notNull().default("misconception"), // 'misconception' | 'explain_back' | 'bug_bounty' | 'revive'
  createdAt: text("created_at").notNull(),
});

export const conceptMasteryTable = sqliteTable("concept_mastery", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => usersTable.id).notNull(),
  conceptKey: text("concept_key").notNull(),
  subject: text("subject").notNull(),
  chapterId: integer("chapter_id").references(() => chaptersTable.id),
  masteryLevel: real("mastery_level").notNull().default(0), // 0-1
  samajhScore: real("samajh_score").notNull().default(0),
  sessionCount: integer("session_count").notNull().default(0),
  lastSessionAt: text("last_session_at"),
  nextReviewAt: text("next_review_at"),
  decayApplied: integer("decay_applied").notNull().default(0), // boolean
}, (table) => [
  uniqueIndex("concept_mastery_user_concept_idx").on(table.userId, table.conceptKey),
]);

export const galtiDexCardsTable = sqliteTable("galti_dex_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => usersTable.id).notNull(),
  misconceptionId: text("misconception_id").notNull(),
  conceptKey: text("concept_key").notNull(),
  wrongBelief: text("wrong_belief").notNull(),
  studentCorrection: text("student_correction").notNull(),
  rarity: text("rarity").notNull().default("common"), // 'common' | 'uncommon' | 'rare' | 'legendary'
  isPinned: integer("is_pinned").notNull().default(0),
  earnedAt: text("earned_at").notNull(),
});

export const cosmeticItemsTable = sqliteTable("cosmetic_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'avatar_skin' | 'tree_decoration' | 'profile_theme' | 'accessory'
  rarity: text("rarity").notNull().default("common"),
  coinCost: integer("coin_cost").notNull().default(0),
  requiresPlus: integer("requires_plus").notNull().default(0),
  requiresStage: integer("requires_stage").notNull().default(0), // min avatar stage
  subjectAffinity: text("subject_affinity"), // 'maths' | 'science' | null
  assetData: text("asset_data").notNull().default("{}"), // JSON: SVG paths, colors, etc.
});

export const userCosmeticsTable = sqliteTable("user_cosmetics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => usersTable.id).notNull(),
  itemId: text("item_id").references(() => cosmeticItemsTable.id).notNull(),
  isEquipped: integer("is_equipped").notNull().default(0),
  acquiredAt: text("acquired_at").notNull(),
});

export const friendshipsTable = sqliteTable("friendships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requesterId: text("requester_id").references(() => usersTable.id).notNull(),
  addresseeId: text("addressee_id").references(() => usersTable.id).notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'blocked'
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("friendships_pair_idx").on(table.requesterId, table.addresseeId),
]);

export const friendReactionsTable = sqliteTable("friend_reactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  senderId: text("sender_id").references(() => usersTable.id).notNull(),
  receiverId: text("receiver_id").references(() => usersTable.id).notNull(),
  reactionType: text("reaction_type").notNull(), // 'clap' | 'great_tree' | 'nice_avatar' | 'star' | 'fire'
  createdAt: text("created_at").notNull(),
});

export const bugBountyChallengesTable = sqliteTable("bug_bounty_challenges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => usersTable.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD, one per day
  misconceptionText: text("misconception_text").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  chapterId: integer("chapter_id").references(() => chaptersTable.id),
  isCompleted: integer("is_completed").notNull().default(0),
  rewardItemId: text("reward_item_id"),
  createdAt: text("created_at").notNull(),
});

export const subscriptionEventsTable = sqliteTable("subscription_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => usersTable.id).notNull(),
  eventType: text("event_type").notNull(), // 'created' | 'renewed' | 'cancelled' | 'expired'
  plan: text("plan").notNull(), // 'monthly' | 'yearly'
  provider: text("provider").notNull(), // 'razorpay' | 'mock'
  providerRef: text("provider_ref"),
  amountPaise: integer("amount_paise").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// ─── Existing schema exports (preserved) ───────────────────────────────────

export const insertChapterSchema = createInsertSchema(chaptersTable).omit({ id: true });
export type InsertChapter = InferInsertModel<typeof chaptersTable>;
export type Chapter = InferSelectModel<typeof chaptersTable>;

export const insertChapterChunkSchema = createInsertSchema(chapterChunksTable).omit({ id: true });
export type InsertChapterChunk = InferInsertModel<typeof chapterChunksTable>;
export type ChapterChunk = InferSelectModel<typeof chapterChunksTable>;

// ─── New schema exports ────────────────────────────────────────────────────

export type User = InferSelectModel<typeof usersTable>;
export type InsertUser = InferInsertModel<typeof usersTable>;

export type TeachingSession = InferSelectModel<typeof teachingSessionsTable>;
export type InsertTeachingSession = InferInsertModel<typeof teachingSessionsTable>;

export type ConceptMastery = InferSelectModel<typeof conceptMasteryTable>;
export type InsertConceptMastery = InferInsertModel<typeof conceptMasteryTable>;

export type GaltiDexCard = InferSelectModel<typeof galtiDexCardsTable>;
export type InsertGaltiDexCard = InferInsertModel<typeof galtiDexCardsTable>;

export type CosmeticItem = InferSelectModel<typeof cosmeticItemsTable>;
export type InsertCosmeticItem = InferInsertModel<typeof cosmeticItemsTable>;

export type UserCosmetic = InferSelectModel<typeof userCosmeticsTable>;
export type InsertUserCosmetic = InferInsertModel<typeof userCosmeticsTable>;

export type Friendship = InferSelectModel<typeof friendshipsTable>;
export type InsertFriendship = InferInsertModel<typeof friendshipsTable>;

export type FriendReaction = InferSelectModel<typeof friendReactionsTable>;
export type InsertFriendReaction = InferInsertModel<typeof friendReactionsTable>;

export type BugBountyChallenge = InferSelectModel<typeof bugBountyChallengesTable>;
export type InsertBugBountyChallenge = InferInsertModel<typeof bugBountyChallengesTable>;

export type SubscriptionEvent = InferSelectModel<typeof subscriptionEventsTable>;
export type InsertSubscriptionEvent = InferInsertModel<typeof subscriptionEventsTable>;

export const learningRoadmapsTable = sqliteTable('learning_roadmaps', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usersTable.id),
  goal: text('goal').notNull(), level: text('level').notNull(),
  dailyMinutes: integer('daily_minutes').notNull(), source: text('source').notNull(),
  stepsJson: text('steps_json').notNull(), completedCount: integer('completed_count').notNull().default(0),
  createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, table => [index('learning_roadmaps_user_idx').on(table.userId, table.createdAt)]);

export const roadmapGenerationUsageTable = sqliteTable('roadmap_generation_usage', {
  userId: text('user_id').notNull().references(() => usersTable.id),
  day: text('day').notNull(), count: integer('count').notNull().default(0),
}, table => [primaryKey({ columns: [table.userId, table.day] })]);
