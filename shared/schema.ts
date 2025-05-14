import { pgTable, serial, text, integer, jsonb, boolean, timestamp, pgEnum, date, numeric, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const gameTypeEnum = pgEnum('game_type', [
  'blackjack',
  'coinflip',
  'crash',
  'slots',
  'roulette',
  'dice',
  'race',
  'roll',
  'sevens',
  'connectfour',
  'tictactoe',
  'higherorlower',
  'poker',
  'rockpaperscissors',
  'findthelady',
  'multiplier',  // Real-time multiplier game
  'freespin'     // Free spins bonus game
]);

export const outcomeEnum = pgEnum('outcome', [
  'win',
  'loss',
  'tie',
  'crash',
  'abort',
  'pending',
  'jackpot',      // Jackpot win
  'bonus',        // Bonus game triggered
  'freegames',    // Free games triggered
  'multiplier'    // Multiplier win
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  discordId: text("discord_id").unique(),
  avatarUrl: text("avatar_url"),
  balance: integer("balance").default(1000).notNull(),
  level: integer("level").default(0).notNull(),
  xp: integer("xp").default(0).notNull(),
  dailyLastClaimed: timestamp("daily_last_claimed"),
  workLastClaimed: timestamp("work_last_claimed"),
  weeklyLastClaimed: timestamp("weekly_last_claimed"),
  monthlyLastClaimed: timestamp("monthly_last_claimed"),
  yearlyLastClaimed: timestamp("yearly_last_claimed"),
  overtimeLastClaimed: timestamp("overtime_last_claimed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Game statistics for users
export const gameStats = pgTable("game_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gamesPlayed: integer("games_played").default(0).notNull(),
  gamesWon: integer("games_won").default(0).notNull(),
  gamesLost: integer("games_lost").default(0).notNull(),
  totalWagered: integer("total_wagered").default(0).notNull(),
  totalWon: integer("total_won").default(0).notNull(),
  totalLost: integer("total_lost").default(0).notNull(),
  highestWin: integer("highest_win").default(0).notNull(),
  highestLoss: integer("highest_loss").default(0).notNull(),
  favoriteGame: text("favorite_game"),
  lastPlayed: timestamp("last_played").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Game transaction history
export const gameTransactions = pgTable("game_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: gameTypeEnum("game_type").notNull(),
  betAmount: integer("bet_amount").notNull(),
  outcome: outcomeEnum("outcome").notNull(),
  winAmount: integer("win_amount").default(0).notNull(),
  gameDetails: jsonb("game_details"), // Store game-specific details
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Mining system
export const miningProfiles = pgTable("mining_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  mineName: text("mine_name").notNull(),
  level: integer("level").default(1).notNull(),
  prestigeLevel: integer("prestige_level").default(0).notNull(),
  lastDig: timestamp("last_dig"),
  lastProcess: timestamp("last_process"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Mining resources inventory
export const miningInventory = pgTable("mining_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  coal: integer("coal").default(0).notNull(),
  ore: integer("ore").default(0).notNull(),
  unprocessedMaterials: integer("unprocessed_materials").default(0).notNull(),
  diamonds: integer("diamonds").default(0).notNull(),
  emeralds: integer("emeralds").default(0).notNull(),
  lapis: integer("lapis").default(0).notNull(),
  redstone: integer("redstone").default(0).notNull(),
  techPacks: integer("tech_packs").default(0).notNull(),
  utilityPacks: integer("utility_packs").default(0).notNull(),
  productionPacks: integer("production_packs").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Mining units
export const miningUnits = pgTable("mining_units", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  unitType: text("unit_type").notNull(),
  level: integer("level").default(1).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  efficiency: integer("efficiency").default(100).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Items and inventory
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  type: text("type").notNull(), // boost, loot, utility, etc.
  price: integer("price").notNull(),
  sellPrice: integer("sell_price").notNull(),
  properties: jsonb("properties"), // Store item-specific properties
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User inventory of items
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  quantity: integer("quantity").default(1).notNull(),
  acquired: timestamp("acquired").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// Active boosts
export const activeBoosts = pgTable("active_boosts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  boostType: text("boost_type").notNull(),
  multiplier: integer("multiplier").notNull(),
  remainingUses: integer("remaining_uses"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lottery system
export const lotteryDraws = pgTable("lottery_draws", {
  id: serial("id").primaryKey(),
  drawDate: timestamp("draw_date").notNull(),
  jackpot: integer("jackpot").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  winningTicket: integer("winning_ticket"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lotteryTickets = pgTable("lottery_tickets", {
  id: serial("id").primaryKey(),
  drawId: integer("draw_id").notNull().references(() => lotteryDraws.id),
  userId: integer("user_id").notNull().references(() => users.id),
  ticketNumber: integer("ticket_number").notNull(),
  purchased: timestamp("purchased").defaultNow().notNull(),
});

// Daily goals/tasks
export const dailyGoals = pgTable("daily_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  goalType: text("goal_type").notNull(),
  requirement: integer("requirement").notNull(),
  progress: integer("progress").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  reward: integer("reward").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Jackpot pools
export const jackpotPools = pgTable("jackpot_pools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  currentAmount: integer("current_amount").default(0).notNull(),
  seedAmount: integer("seed_amount").default(10000).notNull(), // Starting amount after win
  incrementRate: decimal("increment_rate", { precision: 5, scale: 4 }).default("0.0025").notNull(), // % of each bet added
  lastWon: timestamp("last_won"),
  winningUserId: integer("winning_user_id").references(() => users.id),
  winningAmount: integer("winning_amount"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Multiplier game settings (for crash-like games)
export const multiplierGames = pgTable("multiplier_games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  minBet: integer("min_bet").default(10).notNull(),
  maxBet: integer("max_bet").default(10000).notNull(),
  houseEdge: decimal("house_edge", { precision: 5, scale: 4 }).default("0.0500").notNull(), // 5% house edge
  maxMultiplier: decimal("max_multiplier", { precision: 10, scale: 2 }).default("100.00").notNull(),
  crashChanceDivisor: decimal("crash_chance_divisor", { precision: 10, scale: 2 }).default("33.33").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Free games tracking
export const freeGames = pgTable("free_games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: gameTypeEnum("game_type").notNull(),
  remainingGames: integer("remaining_games").notNull(),
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).default("1.00").notNull(), // Multiplier for these free games
  betAmount: integer("bet_amount").notNull(), // Original bet that triggered free games
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Real money mode transactions (for future implementation)
export const realMoneyTransactions = pgTable("real_money_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  transactionType: text("transaction_type").notNull(), // deposit, withdrawal, conversion
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currencyCode: text("currency_code").default("USD").notNull(),
  status: text("status").notNull(), // pending, completed, failed, cancelled
  externalReference: text("external_reference"), // Reference ID from payment processor
  details: jsonb("details"), // Additional transaction details
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  gameStats: many(gameStats),
  transactions: many(gameTransactions),
  miningProfile: many(miningProfiles),
  miningInventory: many(miningInventory),
  miningUnits: many(miningUnits),
  inventory: many(inventory),
  activeBoosts: many(activeBoosts),
  lotteryTickets: many(lotteryTickets),
  dailyGoals: many(dailyGoals),
  freeGames: many(freeGames),
  realMoneyTransactions: many(realMoneyTransactions),
  wonJackpots: many(jackpotPools, { relationName: "jackpotWinner" })
}));

export const gameStatsRelations = relations(gameStats, ({ one }) => ({
  user: one(users, {
    fields: [gameStats.userId],
    references: [users.id],
  }),
}));

export const gameTransactionsRelations = relations(gameTransactions, ({ one }) => ({
  user: one(users, {
    fields: [gameTransactions.userId],
    references: [users.id],
  }),
}));

export const miningProfilesRelations = relations(miningProfiles, ({ one }) => ({
  user: one(users, {
    fields: [miningProfiles.userId],
    references: [users.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  user: one(users, {
    fields: [inventory.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [inventory.itemId],
    references: [items.id],
  }),
}));

export const lotteryTicketsRelations = relations(lotteryTickets, ({ one }) => ({
  user: one(users, {
    fields: [lotteryTickets.userId],
    references: [users.id],
  }),
  draw: one(lotteryDraws, {
    fields: [lotteryTickets.drawId],
    references: [lotteryDraws.id],
  }),
}));

export const jackpotPoolsRelations = relations(jackpotPools, ({ one }) => ({
  winner: one(users, {
    fields: [jackpotPools.winningUserId],
    references: [users.id],
    relationName: "jackpotWinner"
  }),
}));

export const freeGamesRelations = relations(freeGames, ({ one }) => ({
  user: one(users, {
    fields: [freeGames.userId],
    references: [users.id],
  }),
}));

export const realMoneyTransactionsRelations = relations(realMoneyTransactions, ({ one }) => ({
  user: one(users, {
    fields: [realMoneyTransactions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameStatSchema = createInsertSchema(gameStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameTransactionSchema = createInsertSchema(gameTransactions).omit({
  id: true,
  timestamp: true,
});

export const insertMiningProfileSchema = createInsertSchema(miningProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMiningInventorySchema = createInsertSchema(miningInventory).omit({
  id: true,
  updatedAt: true,
});

export const insertMiningUnitSchema = createInsertSchema(miningUnits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  acquired: true,
});

export const insertActiveBoostSchema = createInsertSchema(activeBoosts).omit({
  id: true,
  createdAt: true,
});

export const insertLotteryDrawSchema = createInsertSchema(lotteryDraws).omit({
  id: true,
  createdAt: true,
});

export const insertLotteryTicketSchema = createInsertSchema(lotteryTickets).omit({
  id: true,
  purchased: true,
});

export const insertDailyGoalSchema = createInsertSchema(dailyGoals).omit({
  id: true,
  createdAt: true,
});

export const insertJackpotPoolSchema = createInsertSchema(jackpotPools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMultiplierGameSchema = createInsertSchema(multiplierGames).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFreeGameSchema = createInsertSchema(freeGames).omit({
  id: true,
  createdAt: true,
});

export const insertRealMoneyTransactionSchema = createInsertSchema(realMoneyTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type GameStat = typeof gameStats.$inferSelect;
export type GameTransaction = typeof gameTransactions.$inferSelect;
export type MiningProfile = typeof miningProfiles.$inferSelect;
export type MiningInventory = typeof miningInventory.$inferSelect;
export type MiningUnit = typeof miningUnits.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type ActiveBoost = typeof activeBoosts.$inferSelect;
export type LotteryDraw = typeof lotteryDraws.$inferSelect;
export type LotteryTicket = typeof lotteryTickets.$inferSelect;
export type DailyGoal = typeof dailyGoals.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGameStat = z.infer<typeof insertGameStatSchema>;
export type InsertGameTransaction = z.infer<typeof insertGameTransactionSchema>;
export type InsertMiningProfile = z.infer<typeof insertMiningProfileSchema>;
export type InsertMiningInventory = z.infer<typeof insertMiningInventorySchema>;
export type InsertMiningUnit = z.infer<typeof insertMiningUnitSchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InsertActiveBoost = z.infer<typeof insertActiveBoostSchema>;
export type InsertLotteryDraw = z.infer<typeof insertLotteryDrawSchema>;
export type InsertLotteryTicket = z.infer<typeof insertLotteryTicketSchema>;
export type InsertDailyGoal = z.infer<typeof insertDailyGoalSchema>;

// Game Types enum
export enum GameType {
  BLACKJACK = "blackjack",
  COINFLIP = "coinflip",
  CRASH = "crash",
  SLOTS = "slots",
  ROULETTE = "roulette",
  DICE = "dice",
  RACE = "race",
  ROLL = "roll",
  SEVENS = "sevens",
  CONNECTFOUR = "connectfour",
  TICTACTOE = "tictactoe",
  HIGHERORLOWER = "higherorlower",
  POKER = "poker",
  ROCKPAPERSCISSORS = "rockpaperscissors",
  FINDTHELADY = "findthelady",
  MULTIPLIER = "multiplier",  // Real-time multiplier game
  FREESPIN = "freespin"  // Free spins bonus game
}

// Slot machine symbols with their multipliers
export interface SlotSymbol {
  name: string;
  multiplier: number;
  symbol: string;
}

export const SLOT_SYMBOLS: SlotSymbol[] = [
  { name: "Seven", multiplier: 500, symbol: "sseven" },
  { name: "Diamond", multiplier: 25, symbol: "sdiamond" },
  { name: "Bar", multiplier: 5, symbol: "sbar" },
  { name: "Bell", multiplier: 3, symbol: "sbell" },
  { name: "Shoe", multiplier: 2, symbol: "sshoe" },
  { name: "Lemon", multiplier: 1, symbol: "slemon" },
  { name: "Melon", multiplier: 0.75, symbol: "smelon" },
  { name: "Heart", multiplier: 0.5, symbol: "sheart" },
  { name: "Cherry", multiplier: 0.25, symbol: "scherry" },
];
