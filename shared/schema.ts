import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User data
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  discordId: text("discord_id").notNull().unique(),
  balance: integer("balance").notNull().default(1000),
  dailyLastClaimed: timestamp("daily_last_claimed"),
  workLastClaimed: timestamp("work_last_claimed"),
  joinDate: timestamp("join_date").notNull().defaultNow(),
  avatarUrl: text("avatar_url"),
});

// Game statistics for users
export const gameStats = pgTable("game_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gamesPlayed: integer("games_played").notNull().default(0),
  gamesWon: integer("games_won").notNull().default(0),
  gamesLost: integer("games_lost").notNull().default(0),
  totalWagered: integer("total_wagered").notNull().default(0),
  totalWon: integer("total_won").notNull().default(0),
  totalLost: integer("total_lost").notNull().default(0),
  highestWin: integer("highest_win").notNull().default(0),
  highestLoss: integer("highest_loss").notNull().default(0),
  favoriteGame: text("favorite_game"),
  lastPlayed: timestamp("last_played"),
});

// Game transactions history
export const gameTransactions = pgTable("game_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: text("game_type").notNull(),
  betAmount: integer("bet_amount").notNull(),
  outcome: text("outcome").notNull(), // win, loss
  winAmount: integer("win_amount"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  gameDetails: text("game_details"), // JSON stringified details
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  joinDate: true,
});

export const insertGameStatSchema = createInsertSchema(gameStats).omit({
  id: true,
});

export const insertGameTransactionSchema = createInsertSchema(gameTransactions).omit({
  id: true,
  timestamp: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type GameStat = typeof gameStats.$inferSelect;
export type GameTransaction = typeof gameTransactions.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGameStat = z.infer<typeof insertGameStatSchema>;
export type InsertGameTransaction = z.infer<typeof insertGameTransactionSchema>;

// Game specific types
export enum GameType {
  BLACKJACK = "blackjack",
  COINFLIP = "coinflip",
  CRASH = "crash",
  SLOTS = "slots",
  ROULETTE = "roulette",
  DICE = "dice",
}

export interface SlotSymbol {
  name: string;
  multiplier: number;
  symbol: string;
}

export const SLOT_SYMBOLS: SlotSymbol[] = [
  { name: "Seven", multiplier: 15, symbol: "sseven" },
  { name: "Diamond", multiplier: 12, symbol: "sdiamond" },
  { name: "Bar", multiplier: 10, symbol: "sbar" },
  { name: "Cherry", multiplier: 8, symbol: "scherry" },
  { name: "Bell", multiplier: 7, symbol: "sbell" },
  { name: "Lemon", multiplier: 5, symbol: "slemon" },
  { name: "Melon", multiplier: 4, symbol: "smelon" },
  { name: "Heart", multiplier: 3, symbol: "sheart" },
];
