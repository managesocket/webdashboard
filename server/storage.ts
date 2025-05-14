import { 
  users, 
  gameStats, 
  gameTransactions,
  jackpotPools,
  multiplierGames,
  freeGames,
  realMoneyTransactions,
  type User, 
  type InsertUser,
  type GameStat,
  type InsertGameStat,
  type GameTransaction,
  type InsertGameTransaction,
  type JackpotPool,
  type InsertJackpotPool,
  type MultiplierGame,
  type InsertMultiplierGame,
  type FreeGame,
  type InsertFreeGame,
  type RealMoneyTransaction,
  type InsertRealMoneyTransaction,
  GameType,
  SLOT_SYMBOLS,
  outcomeEnum
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Storage interface for the Discord Bot
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: number): Promise<User | undefined>;
  
  // Game stats management
  getGameStats(userId: number): Promise<GameStat | undefined>;
  createGameStats(stats: InsertGameStat): Promise<GameStat>;
  updateGameStats(userId: number, updates: Partial<GameStat>): Promise<GameStat | undefined>;

  // Game transactions
  addGameTransaction(transaction: InsertGameTransaction): Promise<GameTransaction>;
  getTransactionsByUserId(userId: number, limit?: number): Promise<GameTransaction[]>;
  
  // Leaderboard functionality
  getTopBalances(limit?: number): Promise<User[]>;
  getTopWinners(limit?: number): Promise<{ user: User, stats: GameStat }[]>;
  getTopWinRate(limit?: number): Promise<{ user: User, stats: GameStat, winRate: number }[]>;
  
  // Currency generation
  claimDaily(userId: number): Promise<{ success: boolean; amount?: number; cooldown?: Date }>;
  claimWork(userId: number): Promise<{ success: boolean; amount?: number; cooldown?: Date }>;

  // Core game logic
  playCoinflip(userId: number, betAmount: number, choice: 'heads' | 'tails'): Promise<{ success: boolean; result: string; winAmount?: number }>;
  playBlackjack(userId: number, betAmount: number, playerAction: 'hit' | 'stand' | 'double'): Promise<{ success: boolean; playerHand: string[]; dealerHand: string[]; result: string; winAmount?: number }>;
  playSlots(userId: number, betAmount: number): Promise<{ success: boolean; symbols: string[]; result: string; winAmount?: number }>;
  playCrash(userId: number, betAmount: number, cashoutMultiplier: number): Promise<{ success: boolean; crashPoint: number; result: string; winAmount?: number }>;
  playRoulette(userId: number, betAmount: number, betType: string, betValue: string | number): Promise<{ success: boolean; result: number; winAmount?: number }>;
  playDice(userId: number, betAmount: number, prediction: 'higher' | 'lower', targetNumber: number): Promise<{ success: boolean; roll: number; result: string; winAmount?: number }>;
  
  // Jackpot pools management
  getJackpotPools(activeOnly?: boolean): Promise<JackpotPool[]>;
  getJackpotPool(poolId: number): Promise<JackpotPool | undefined>;
  createJackpotPool(pool: InsertJackpotPool): Promise<JackpotPool>;
  updateJackpotPool(poolId: number, updates: Partial<JackpotPool>): Promise<JackpotPool | undefined>;
  contributeToJackpot(poolId: number, amount: number): Promise<JackpotPool | undefined>;
  awardJackpot(poolId: number, userId: number, amount: number): Promise<JackpotPool | undefined>;
  
  // Multiplier game management
  getMultiplierGames(activeOnly?: boolean): Promise<MultiplierGame[]>;
  getMultiplierGame(gameId: number): Promise<MultiplierGame | undefined>;
  createMultiplierGame(game: InsertMultiplierGame): Promise<MultiplierGame>;
  updateMultiplierGame(gameId: number, updates: Partial<MultiplierGame>): Promise<MultiplierGame | undefined>;
  playMultiplierGame(userId: number, gameId: number, betAmount: number, targetMultiplier: number): Promise<{ 
    success: boolean; 
    result: string; 
    multiplier: number; 
    winAmount?: number;
    crashPoint?: number;
    jackpotWon?: boolean;
    jackpotAmount?: number;
    freeGamesWon?: number;
    freeGamesMultiplier?: number;
  }>;
  
  // Free games management
  getUserFreeGames(userId: number, gameType?: GameType): Promise<FreeGame[]>;
  addUserFreeGames(freeGame: InsertFreeGame): Promise<FreeGame>;
  useUserFreeGame(freeGameId: number): Promise<FreeGame | undefined>;
  
  // Real money transactions
  createRealMoneyTransaction(transaction: InsertRealMoneyTransaction): Promise<RealMoneyTransaction>;
  getUserRealMoneyTransactions(userId: number, limit?: number): Promise<RealMoneyTransaction[]>;
  updateRealMoneyTransactionStatus(transactionId: number, status: string, details?: any): Promise<RealMoneyTransaction | undefined>;
}

// NOTE: This MemStorage implementation has some TypeScript compatibility issues
// with the iterator usage in getTopWinners and getTopWinRate methods.
// We're keeping it as a fallback, but the DatabaseStorage implementation 
// below should be used instead.
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameStats: Map<number, GameStat>; 
  private transactions: GameTransaction[];
  private currentUserId: number;
  private currentStatId: number;
  private currentTransactionId: number;

  constructor() {
    this.users = new Map();
    this.gameStats = new Map();
    this.transactions = [];
    this.currentUserId = 1;
    this.currentStatId = 1;
    this.currentTransactionId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.discordId === discordId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      balance: 1000, // Default starting balance
      level: 0,
      xp: 0,
      discordId: insertUser.discordId || null,
      avatarUrl: insertUser.avatarUrl || null,
      dailyLastClaimed: null,
      workLastClaimed: null,
      weeklyLastClaimed: null,
      monthlyLastClaimed: null,
      yearlyLastClaimed: null,
      overtimeLastClaimed: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, balance: newBalance };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getGameStats(userId: number): Promise<GameStat | undefined> {
    return Array.from(this.gameStats.values()).find(stat => stat.userId === userId);
  }

  async createGameStats(stats: InsertGameStat): Promise<GameStat> {
    const id = this.currentStatId++;
    const newStats: GameStat = { 
      ...stats, 
      id,
      gamesPlayed: stats.gamesPlayed || 0,
      gamesWon: stats.gamesWon || 0,
      gamesLost: stats.gamesLost || 0,
      totalWagered: stats.totalWagered || 0,
      totalWon: stats.totalWon || 0,
      totalLost: stats.totalLost || 0,
      highestWin: stats.highestWin || 0,
      highestLoss: stats.highestLoss || 0,
      favoriteGame: stats.favoriteGame || null,
      lastPlayed: stats.lastPlayed || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.gameStats.set(id, newStats);
    return newStats;
  }

  async updateGameStats(userId: number, updates: Partial<GameStat>): Promise<GameStat | undefined> {
    const existingStats = await this.getGameStats(userId);
    
    if (!existingStats) {
      // Create new stats if they don't exist
      const newStats: InsertGameStat = {
        userId,
        gamesPlayed: updates.gamesPlayed || 0,
        gamesWon: updates.gamesWon || 0,
        gamesLost: updates.gamesLost || 0,
        totalWagered: updates.totalWagered || 0,
        totalWon: updates.totalWon || 0,
        totalLost: updates.totalLost || 0,
        highestWin: updates.highestWin || 0,
        highestLoss: updates.highestLoss || 0,
        favoriteGame: updates.favoriteGame,
        lastPlayed: updates.lastPlayed || new Date()
      };
      return this.createGameStats(newStats);
    } else {
      // Update existing stats
      const updatedStats: GameStat = { ...existingStats, ...updates };
      this.gameStats.set(existingStats.id, updatedStats);
      return updatedStats;
    }
  }

  async addGameTransaction(transaction: InsertGameTransaction): Promise<GameTransaction> {
    const id = this.currentTransactionId++;
    const newTransaction: GameTransaction = { 
      ...transaction, 
      id, 
      winAmount: transaction.winAmount || 0,
      gameDetails: transaction.gameDetails || null,
      timestamp: new Date() 
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  async getTransactionsByUserId(userId: number, limit = 10): Promise<GameTransaction[]> {
    return this.transactions
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getTopBalances(limit = 10): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);
  }

  async getTopWinners(limit = 10): Promise<{ user: User, stats: GameStat }[]> {
    const usersWithStats: { user: User, stats: GameStat }[] = [];
    
    for (const stat of this.gameStats.values()) {
      const user = await this.getUser(stat.userId);
      if (user) {
        usersWithStats.push({ user, stats: stat });
      }
    }
    
    return usersWithStats
      .sort((a, b) => b.stats.gamesWon - a.stats.gamesWon)
      .slice(0, limit);
  }

  async getTopWinRate(limit = 10): Promise<{ user: User, stats: GameStat, winRate: number }[]> {
    const usersWithWinRate: { user: User, stats: GameStat, winRate: number }[] = [];
    
    for (const stat of this.gameStats.values()) {
      const user = await this.getUser(stat.userId);
      if (user && stat.gamesPlayed > 0) {
        const winRate = (stat.gamesWon / stat.gamesPlayed) * 100;
        usersWithWinRate.push({ user, stats: stat, winRate });
      }
    }
    
    return usersWithWinRate
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, limit);
  }

  async claimDaily(userId: number): Promise<{ success: boolean; amount?: number; cooldown?: Date }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false };
    
    const now = new Date();
    // Check if daily was already claimed within 24 hours
    if (user.dailyLastClaimed && (now.getTime() - user.dailyLastClaimed.getTime() < 24 * 60 * 60 * 1000)) {
      const cooldown = new Date(user.dailyLastClaimed.getTime() + 24 * 60 * 60 * 1000);
      return { success: false, cooldown };
    }
    
    // Daily amount is 200 coins
    const dailyAmount = 200;
    const updatedUser = { 
      ...user, 
      balance: user.balance + dailyAmount,
      dailyLastClaimed: now
    };
    
    this.users.set(userId, updatedUser);
    return { success: true, amount: dailyAmount };
  }

  async claimWork(userId: number): Promise<{ success: boolean; amount?: number; cooldown?: Date }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false };
    
    const now = new Date();
    // Check if work was already claimed within 1 hour
    if (user.workLastClaimed && (now.getTime() - user.workLastClaimed.getTime() < 60 * 60 * 1000)) {
      const cooldown = new Date(user.workLastClaimed.getTime() + 60 * 60 * 1000);
      return { success: false, cooldown };
    }
    
    // Work amount is random between 50-150 coins
    const workAmount = Math.floor(Math.random() * 101) + 50;
    const updatedUser = { 
      ...user, 
      balance: user.balance + workAmount,
      workLastClaimed: now
    };
    
    this.users.set(userId, updatedUser);
    return { success: true, amount: workAmount };
  }

  async playCoinflip(userId: number, betAmount: number, choice: 'heads' | 'tails'): Promise<{ success: boolean; result: string; winAmount?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, result: 'User not found' };
    if (user.balance < betAmount) return { success: false, result: 'Insufficient balance' };
    
    // Deduct bet amount first
    await this.updateUserBalance(userId, user.balance - betAmount);
    
    // 50/50 chance
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === choice;
    
    // Update stats
    const stats = await this.getGameStats(userId) || { 
      id: this.currentStatId++,
      userId,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalWagered: 0,
      totalWon: 0,
      totalLost: 0,
      highestWin: 0,
      highestLoss: 0,
      favoriteGame: GameType.COINFLIP,
      lastPlayed: new Date()
    };
    
    const statUpdates: Partial<GameStat> = {
      gamesPlayed: stats.gamesPlayed + 1,
      totalWagered: stats.totalWagered + betAmount,
      lastPlayed: new Date(),
      favoriteGame: GameType.COINFLIP
    };
    
    let winAmount = 0;
    if (won) {
      // Win is 2x the bet
      winAmount = betAmount * 2;
      await this.updateUserBalance(userId, user.balance - betAmount + winAmount);
      
      statUpdates.gamesWon = stats.gamesWon + 1;
      statUpdates.totalWon = stats.totalWon + winAmount;
      statUpdates.highestWin = Math.max(stats.highestWin, winAmount);
    } else {
      statUpdates.gamesLost = stats.gamesLost + 1;
      statUpdates.totalLost = stats.totalLost + betAmount;
      statUpdates.highestLoss = Math.max(stats.highestLoss, betAmount);
    }
    
    await this.updateGameStats(userId, statUpdates);
    
    // Add transaction record
    await this.addGameTransaction({
      userId,
      gameType: GameType.COINFLIP,
      betAmount,
      outcome: won ? 'win' : 'loss',
      winAmount: won ? winAmount : 0,
      gameDetails: JSON.stringify({ playerChoice: choice, result })
    });
    
    return { 
      success: true, 
      result: `Result: ${result.toUpperCase()}. You ${won ? 'won' : 'lost'}!`, 
      winAmount: won ? winAmount : 0 
    };
  }

  async playBlackjack(userId: number, betAmount: number, playerAction: 'hit' | 'stand' | 'double'): Promise<{ success: boolean; playerHand: string[]; dealerHand: string[]; result: string; winAmount?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, playerHand: [], dealerHand: [], result: 'User not found' };
    if (user.balance < betAmount) return { success: false, playerHand: [], dealerHand: [], result: 'Insufficient balance' };
    
    // Simplified blackjack implementation
    const deck = this.createDeck();
    this.shuffleDeck(deck);
    
    // Initial deal
    const playerHand = [this.drawCard(deck), this.drawCard(deck)];
    const dealerHand = [this.drawCard(deck), this.drawCard(deck)];
    
    // Calculate initial values
    let playerValue = this.calculateHandValue(playerHand);
    let dealerValue = this.calculateHandValue(dealerHand);
    
    // Process player action
    if (playerAction === 'hit') {
      playerHand.push(this.drawCard(deck));
      playerValue = this.calculateHandValue(playerHand);
    } else if (playerAction === 'double' && user.balance >= betAmount * 2) {
      betAmount *= 2;
      playerHand.push(this.drawCard(deck));
      playerValue = this.calculateHandValue(playerHand);
    }
    
    // Check if player busted
    if (playerValue > 21) {
      // Player busts, dealer wins
      await this.updateUserBalance(userId, user.balance - betAmount);
      
      // Update stats
      await this.updateBlackjackStats(userId, betAmount, false, 0);
      
      return {
        success: true,
        playerHand,
        dealerHand,
        result: `Bust! Your hand value: ${playerValue}. You lost ${betAmount} coins.`,
        winAmount: 0
      };
    }
    
    // Dealer plays - dealer must hit until 17 or higher
    while (dealerValue < 17) {
      dealerHand.push(this.drawCard(deck));
      dealerValue = this.calculateHandValue(dealerHand);
    }
    
    // Determine winner
    let result: string;
    let won: boolean;
    let winAmount = 0;
    
    if (dealerValue > 21 || playerValue > dealerValue) {
      // Player wins
      winAmount = betAmount * 2; // Payout 2:1
      await this.updateUserBalance(userId, user.balance - betAmount + winAmount);
      result = `You win! Your hand: ${playerValue}, Dealer: ${dealerValue}. You won ${winAmount} coins.`;
      won = true;
    } else if (playerValue === dealerValue) {
      // Push - return bet
      await this.updateUserBalance(userId, user.balance);
      result = `Push! Your hand: ${playerValue}, Dealer: ${dealerValue}. Your bet has been returned.`;
      won = false;
      winAmount = betAmount; // Return original bet
    } else {
      // Dealer wins
      await this.updateUserBalance(userId, user.balance - betAmount);
      result = `Dealer wins! Your hand: ${playerValue}, Dealer: ${dealerValue}. You lost ${betAmount} coins.`;
      won = false;
    }
    
    // Update stats
    await this.updateBlackjackStats(userId, betAmount, won, winAmount);
    
    return {
      success: true,
      playerHand,
      dealerHand,
      result,
      winAmount
    };
  }
  
  async playSlots(userId: number, betAmount: number): Promise<{ success: boolean; symbols: string[]; result: string; winAmount?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, symbols: [], result: 'User not found' };
    if (user.balance < betAmount) return { success: false, symbols: [], result: 'Insufficient balance' };
    
    // Deduct bet amount first
    await this.updateUserBalance(userId, user.balance - betAmount);
    
    // Spin the slots (3 reels)
    const reels = Array(3).fill(0).map(() => 
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
    );
    
    const symbols = reels.map(reel => reel.symbol);
    
    // Check for wins
    let winAmount = 0;
    let won = false;
    
    // All 3 symbols match
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      const multiplier = SLOT_SYMBOLS.find(s => s.symbol === symbols[0])?.multiplier || 1;
      winAmount = betAmount * multiplier;
      won = true;
    }
    
    // Update user balance if won
    if (won) {
      await this.updateUserBalance(userId, user.balance - betAmount + winAmount);
    }
    
    // Update stats
    const stats = await this.getGameStats(userId) || { 
      id: this.currentStatId++,
      userId,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalWagered: 0,
      totalWon: 0,
      totalLost: 0,
      highestWin: 0,
      highestLoss: 0,
      favoriteGame: GameType.SLOTS,
      lastPlayed: new Date()
    };
    
    const statUpdates: Partial<GameStat> = {
      gamesPlayed: stats.gamesPlayed + 1,
      totalWagered: stats.totalWagered + betAmount,
      lastPlayed: new Date(),
      favoriteGame: GameType.SLOTS
    };
    
    if (won) {
      statUpdates.gamesWon = stats.gamesWon + 1;
      statUpdates.totalWon = stats.totalWon + winAmount;
      statUpdates.highestWin = Math.max(stats.highestWin, winAmount);
    } else {
      statUpdates.gamesLost = stats.gamesLost + 1;
      statUpdates.totalLost = stats.totalLost + betAmount;
      statUpdates.highestLoss = Math.max(stats.highestLoss, betAmount);
    }
    
    await this.updateGameStats(userId, statUpdates);
    
    // Add transaction record
    await this.addGameTransaction({
      userId,
      gameType: GameType.SLOTS,
      betAmount,
      outcome: won ? 'win' : 'loss',
      winAmount: won ? winAmount : 0,
      gameDetails: JSON.stringify({ symbols, matchType: won ? 'triple' : 'none' })
    });
    
    const result = won 
      ? `🎰 You won ${winAmount} coins! (${symbols.join(' - ')})`
      : `🎰 You lost ${betAmount} coins. (${symbols.join(' - ')})`;
    
    return { success: true, symbols, result, winAmount: won ? winAmount : 0 };
  }
  
  async playCrash(userId: number, betAmount: number, cashoutMultiplier: number): Promise<{ success: boolean; crashPoint: number; result: string; winAmount?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, crashPoint: 0, result: 'User not found' };
    if (user.balance < betAmount) return { success: false, crashPoint: 0, result: 'Insufficient balance' };
    
    // Deduct bet amount first
    await this.updateUserBalance(userId, user.balance - betAmount);
    
    // Generate crash point - exponential distribution for realistic crash game
    // This generates a value typically between 1 and 10, with rare higher values
    const crashPoint = Math.floor((Math.random() * 100) + 100) / 100;
    
    let won = false;
    let winAmount = 0;
    
    // If player cashed out before crash
    if (cashoutMultiplier <= crashPoint) {
      won = true;
      winAmount = Math.floor(betAmount * cashoutMultiplier);
      await this.updateUserBalance(userId, user.balance - betAmount + winAmount);
    }
    
    // Update stats
    const stats = await this.getGameStats(userId) || { 
      id: this.currentStatId++,
      userId,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalWagered: 0,
      totalWon: 0,
      totalLost: 0,
      highestWin: 0,
      highestLoss: 0,
      favoriteGame: GameType.CRASH,
      lastPlayed: new Date()
    };
    
    const statUpdates: Partial<GameStat> = {
      gamesPlayed: stats.gamesPlayed + 1,
      totalWagered: stats.totalWagered + betAmount,
      lastPlayed: new Date(),
      favoriteGame: GameType.CRASH
    };
    
    if (won) {
      statUpdates.gamesWon = stats.gamesWon + 1;
      statUpdates.totalWon = stats.totalWon + winAmount;
      statUpdates.highestWin = Math.max(stats.highestWin, winAmount);
    } else {
      statUpdates.gamesLost = stats.gamesLost + 1;
      statUpdates.totalLost = stats.totalLost + betAmount;
      statUpdates.highestLoss = Math.max(stats.highestLoss, betAmount);
    }
    
    await this.updateGameStats(userId, statUpdates);
    
    // Add transaction record
    await this.addGameTransaction({
      userId,
      gameType: GameType.CRASH,
      betAmount,
      outcome: won ? 'win' : 'loss',
      winAmount: won ? winAmount : 0,
      gameDetails: JSON.stringify({ crashPoint, cashoutMultiplier })
    });
    
    const result = won 
      ? `📈 You cashed out at ${cashoutMultiplier.toFixed(2)}x and won ${winAmount} coins!`
      : `💥 Crashed at ${crashPoint.toFixed(2)}x! You lost ${betAmount} coins.`;
    
    return { success: true, crashPoint, result, winAmount: won ? winAmount : 0 };
  }
  
  async playRoulette(userId: number, betAmount: number, betType: string, betValue: string | number): Promise<{ success: boolean; result: number; winAmount?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, result: -1 };
    if (user.balance < betAmount) return { success: false, result: -1 };
    
    // Deduct bet amount first
    await this.updateUserBalance(userId, user.balance - betAmount);
    
    // Spin the wheel (0-36)
    const spinResult = Math.floor(Math.random() * 37);
    
    // Determine if player won based on bet type
    let won = false;
    let multiplier = 0;
    
    switch (betType) {
      case 'number':
        // Straight up bet on a single number (35:1)
        won = spinResult === Number(betValue);
        multiplier = 36; // 35:1 plus the original bet
        break;
      case 'color':
        // Red or black (1:1)
        const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        const isRed = redNumbers.includes(spinResult);
        won = (betValue === 'red' && isRed) || (betValue === 'black' && !isRed && spinResult !== 0);
        multiplier = 2; // 1:1 plus the original bet
        break;
      case 'even_odd':
        // Even or odd (1:1)
        won = (betValue === 'even' && spinResult % 2 === 0 && spinResult !== 0) ||
              (betValue === 'odd' && spinResult % 2 === 1);
        multiplier = 2; // 1:1 plus the original bet
        break;
      case 'dozen':
        // Dozen bet (2:1)
        const dozen = Number(betValue);
        won = (dozen === 1 && spinResult >= 1 && spinResult <= 12) ||
              (dozen === 2 && spinResult >= 13 && spinResult <= 24) ||
              (dozen === 3 && spinResult >= 25 && spinResult <= 36);
        multiplier = 3; // 2:1 plus the original bet
        break;
      case 'high_low':
        // High (19-36) or low (1-18) numbers (1:1)
        won = (betValue === 'high' && spinResult >= 19 && spinResult <= 36) ||
              (betValue === 'low' && spinResult >= 1 && spinResult <= 18);
        multiplier = 2; // 1:1 plus the original bet
        break;
    }
    
    let winAmount = 0;
    if (won) {
      winAmount = betAmount * multiplier;
      await this.updateUserBalance(userId, user.balance - betAmount + winAmount);
    }
    
    // Update stats and record transaction
    const stats = await this.getGameStats(userId) || { 
      id: this.currentStatId++,
      userId,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalWagered: 0,
      totalWon: 0,
      totalLost: 0,
      highestWin: 0,
      highestLoss: 0,
      favoriteGame: GameType.ROULETTE,
      lastPlayed: new Date()
    };
    
    const statUpdates: Partial<GameStat> = {
      gamesPlayed: stats.gamesPlayed + 1,
      totalWagered: stats.totalWagered + betAmount,
      lastPlayed: new Date(),
      favoriteGame: GameType.ROULETTE
    };
    
    if (won) {
      statUpdates.gamesWon = stats.gamesWon + 1;
      statUpdates.totalWon = stats.totalWon + winAmount;
      statUpdates.highestWin = Math.max(stats.highestWin, winAmount);
    } else {
      statUpdates.gamesLost = stats.gamesLost + 1;
      statUpdates.totalLost = stats.totalLost + betAmount;
      statUpdates.highestLoss = Math.max(stats.highestLoss, betAmount);
    }
    
    await this.updateGameStats(userId, statUpdates);
    
    // Add transaction record
    await this.addGameTransaction({
      userId,
      gameType: GameType.ROULETTE,
      betAmount,
      outcome: won ? 'win' : 'loss',
      winAmount: won ? winAmount : 0,
      gameDetails: JSON.stringify({ spinResult, betType, betValue })
    });
    
    return { success: true, result: spinResult, winAmount: won ? winAmount : 0 };
  }
  
  async playDice(userId: number, betAmount: number, prediction: 'higher' | 'lower', targetNumber: number): Promise<{ success: boolean; roll: number; result: string; winAmount?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, roll: 0, result: 'User not found' };
    if (user.balance < betAmount) return { success: false, roll: 0, result: 'Insufficient balance' };
    
    // Validate target number (1-100)
    if (targetNumber < 1 || targetNumber > 100) {
      return { success: false, roll: 0, result: 'Target number must be between 1 and 100' };
    }
    
    // Deduct bet amount first
    await this.updateUserBalance(userId, user.balance - betAmount);
    
    // Roll the dice (1-100)
    const roll = Math.floor(Math.random() * 100) + 1;
    
    // Determine if player won
    let won = false;
    if (prediction === 'higher' && roll > targetNumber) {
      won = true;
    } else if (prediction === 'lower' && roll < targetNumber) {
      won = true;
    }
    
    // Calculate win amount based on probability
    // The more unlikely the win, the higher the multiplier
    let multiplier = 1;
    if (won) {
      if (prediction === 'higher') {
        // Higher gets harder as target number increases
        multiplier = 100 / (100 - targetNumber);
      } else {
        // Lower gets harder as target number decreases
        multiplier = 100 / targetNumber;
      }
    }
    
    let winAmount = 0;
    if (won) {
      winAmount = Math.floor(betAmount * multiplier);
      await this.updateUserBalance(userId, user.balance - betAmount + winAmount);
    }
    
    // Update stats
    const stats = await this.getGameStats(userId) || { 
      id: this.currentStatId++,
      userId,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalWagered: 0,
      totalWon: 0,
      totalLost: 0,
      highestWin: 0,
      highestLoss: 0,
      favoriteGame: GameType.DICE,
      lastPlayed: new Date()
    };
    
    const statUpdates: Partial<GameStat> = {
      gamesPlayed: stats.gamesPlayed + 1,
      totalWagered: stats.totalWagered + betAmount,
      lastPlayed: new Date(),
      favoriteGame: GameType.DICE
    };
    
    if (won) {
      statUpdates.gamesWon = stats.gamesWon + 1;
      statUpdates.totalWon = stats.totalWon + winAmount;
      statUpdates.highestWin = Math.max(stats.highestWin, winAmount);
    } else {
      statUpdates.gamesLost = stats.gamesLost + 1;
      statUpdates.totalLost = stats.totalLost + betAmount;
      statUpdates.highestLoss = Math.max(stats.highestLoss, betAmount);
    }
    
    await this.updateGameStats(userId, statUpdates);
    
    // Add transaction record
    await this.addGameTransaction({
      userId,
      gameType: GameType.DICE,
      betAmount,
      outcome: won ? 'win' : 'loss',
      winAmount: won ? winAmount : 0,
      gameDetails: JSON.stringify({ roll, prediction, targetNumber })
    });
    
    const result = won 
      ? `🎲 Rolled ${roll}! You ${prediction === 'higher' ? '>' : '<'} ${targetNumber}. You won ${winAmount} coins!`
      : `🎲 Rolled ${roll}! You ${prediction === 'higher' ? '>' : '<'} ${targetNumber}. You lost ${betAmount} coins.`;
    
    return { success: true, roll, result, winAmount: won ? winAmount : 0 };
  }

  // Helper methods
  private createDeck(): string[] {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: string[] = [];
    
    for (const suit of suits) {
      for (const value of values) {
        deck.push(`${value}${suit}`);
      }
    }
    
    return deck;
  }
  
  private shuffleDeck(deck: string[]): void {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap
    }
  }
  
  private drawCard(deck: string[]): string {
    if (deck.length === 0) throw new Error('Deck is empty');
    return deck.pop()!;
  }
  
  private calculateHandValue(hand: string[]): number {
    let value = 0;
    let aces = 0;
    
    for (const card of hand) {
      const cardValue = card.slice(0, -1); // Remove suit
      
      if (cardValue === 'A') {
        aces++;
        value += 11;
      } else if (['J', 'Q', 'K'].includes(cardValue)) {
        value += 10;
      } else {
        value += parseInt(cardValue);
      }
    }
    
    // Adjust for aces if needed
    while (value > 21 && aces > 0) {
      value -= 10; // Convert an ace from 11 to 1
      aces--;
    }
    
    return value;
  }
  
  private async updateBlackjackStats(userId: number, betAmount: number, won: boolean, winAmount: number): Promise<void> {
    const stats = await this.getGameStats(userId) || { 
      id: this.currentStatId++,
      userId,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalWagered: 0,
      totalWon: 0,
      totalLost: 0,
      highestWin: 0,
      highestLoss: 0,
      favoriteGame: GameType.BLACKJACK,
      lastPlayed: new Date()
    };
    
    const statUpdates: Partial<GameStat> = {
      gamesPlayed: stats.gamesPlayed + 1,
      totalWagered: stats.totalWagered + betAmount,
      lastPlayed: new Date(),
      favoriteGame: GameType.BLACKJACK
    };
    
    if (won) {
      statUpdates.gamesWon = stats.gamesWon + 1;
      statUpdates.totalWon = stats.totalWon + winAmount;
      statUpdates.highestWin = Math.max(stats.highestWin, winAmount);
    } else {
      statUpdates.gamesLost = stats.gamesLost + 1;
      statUpdates.totalLost = stats.totalLost + betAmount;
      statUpdates.highestLoss = Math.max(stats.highestLoss, betAmount);
    }
    
    await this.updateGameStats(userId, statUpdates);
    
    // Add transaction record
    await this.addGameTransaction({
      userId,
      gameType: GameType.BLACKJACK,
      betAmount,
      outcome: won ? 'win' : 'loss',
      winAmount: won ? winAmount : 0,
      gameDetails: JSON.stringify({ outcome: won ? 'win' : 'loss' })
    });
  }
}

export class DatabaseStorage implements IStorage {
  // USER MANAGEMENT
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  // GAME STATS MANAGEMENT
  async getGameStats(userId: number): Promise<GameStat | undefined> {
    const [stats] = await db.select().from(gameStats).where(eq(gameStats.userId, userId));
    return stats || undefined;
  }

  async createGameStats(stats: InsertGameStat): Promise<GameStat> {
    const [newStats] = await db
      .insert(gameStats)
      .values(stats)
      .returning();
    return newStats;
  }

  async updateGameStats(userId: number, updates: Partial<GameStat>): Promise<GameStat | undefined> {
    const existingStats = await this.getGameStats(userId);
    
    if (!existingStats) {
      // Create new stats if they don't exist
      const newStats: InsertGameStat = {
        userId,
        gamesPlayed: updates.gamesPlayed || 0,
        gamesWon: updates.gamesWon || 0,
        gamesLost: updates.gamesLost || 0,
        totalWagered: updates.totalWagered || 0,
        totalWon: updates.totalWon || 0,
        totalLost: updates.totalLost || 0,
        highestWin: updates.highestWin || 0,
        highestLoss: updates.highestLoss || 0,
        favoriteGame: updates.favoriteGame,
        lastPlayed: updates.lastPlayed || new Date()
      };
      return this.createGameStats(newStats);
    } else {
      // Update existing stats
      const [updatedStats] = await db
        .update(gameStats)
        .set({ 
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(gameStats.userId, userId))
        .returning();
      return updatedStats || undefined;
    }
  }

  // GAME TRANSACTIONS
  async addGameTransaction(transaction: InsertGameTransaction): Promise<GameTransaction> {
    const [newTransaction] = await db
      .insert(gameTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransactionsByUserId(userId: number, limit = 10): Promise<GameTransaction[]> {
    return await db
      .select()
      .from(gameTransactions)
      .where(eq(gameTransactions.userId, userId))
      .orderBy(desc(gameTransactions.timestamp))
      .limit(limit);
  }

  // LEADERBOARD FUNCTIONALITY
  async getTopBalances(limit = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.balance))
      .limit(limit);
  }

  async getTopWinners(limit = 10): Promise<{ user: User, stats: GameStat }[]> {
    const result = await db
      .select({
        user: users,
        stats: gameStats
      })
      .from(gameStats)
      .innerJoin(users, eq(gameStats.userId, users.id))
      .orderBy(desc(gameStats.gamesWon))
      .limit(limit);
    
    return result;
  }

  async getTopWinRate(limit = 10): Promise<{ user: User, stats: GameStat, winRate: number }[]> {
    const result = await db
      .select({
        user: users,
        stats: gameStats
      })
      .from(gameStats)
      .innerJoin(users, eq(gameStats.userId, users.id))
      .where(sql`${gameStats.gamesPlayed} > 0`);
    
    // Calculate win rate in JavaScript as it's complex in SQL
    const usersWithWinRate = result.map(({ user, stats }) => {
      const winRate = (stats.gamesWon / stats.gamesPlayed) * 100;
      return { user, stats, winRate };
    });
    
    return usersWithWinRate
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, limit);
  }

  // CURRENCY GENERATION
  async claimDaily(userId: number): Promise<{ success: boolean; amount?: number; cooldown?: Date }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false };
    
    const now = new Date();
    // Check if daily was already claimed within 24 hours
    if (user.dailyLastClaimed && (now.getTime() - user.dailyLastClaimed.getTime() < 24 * 60 * 60 * 1000)) {
      const cooldown = new Date(user.dailyLastClaimed.getTime() + 24 * 60 * 60 * 1000);
      return { success: false, cooldown };
    }
    
    // Daily amount is 200 coins
    const dailyAmount = 200;
    
    await db
      .update(users)
      .set({ 
        balance: user.balance + dailyAmount,
        dailyLastClaimed: now
      })
      .where(eq(users.id, userId));
    
    return { success: true, amount: dailyAmount };
  }

  async claimWork(userId: number): Promise<{ success: boolean; amount?: number; cooldown?: Date }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false };
    
    const now = new Date();
    // Check if work was already claimed within 1 hour
    if (user.workLastClaimed && (now.getTime() - user.workLastClaimed.getTime() < 60 * 60 * 1000)) {
      const cooldown = new Date(user.workLastClaimed.getTime() + 60 * 60 * 1000);
      return { success: false, cooldown };
    }
    
    // Work amount is random between 50-150 coins
    const workAmount = Math.floor(Math.random() * 101) + 50;
    
    await db
      .update(users)
      .set({ 
        balance: user.balance + workAmount,
        workLastClaimed: now
      })
      .where(eq(users.id, userId));
    
    return { success: true, amount: workAmount };
  }

  // CORE GAME LOGIC
  async playCoinflip(userId: number, betAmount: number, choice: 'heads' | 'tails'): Promise<{ success: boolean; result: string; winAmount?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, result: 'User not found' };
    if (user.balance < betAmount) return { success: false, result: 'Insufficient balance' };
    
    // Deduct bet amount first
    await this.updateUserBalance(userId, user.balance - betAmount);
    
    // 50/50 chance
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === choice;
    
    // Update stats
    const stats = await this.getGameStats(userId);
    const statUpdates: Partial<GameStat> = {
      gamesPlayed: (stats?.gamesPlayed || 0) + 1,
      totalWagered: (stats?.totalWagered || 0) + betAmount,
      lastPlayed: new Date(),
      favoriteGame: GameType.COINFLIP
    };
    
    let winAmount = 0;
    if (won) {
      // Win is 2x the bet
      winAmount = betAmount * 2;
      await this.updateUserBalance(userId, user.balance - betAmount + winAmount);
      
      statUpdates.gamesWon = (stats?.gamesWon || 0) + 1;
      statUpdates.totalWon = (stats?.totalWon || 0) + winAmount;
      statUpdates.highestWin = Math.max(stats?.highestWin || 0, winAmount);
    } else {
      statUpdates.gamesLost = (stats?.gamesLost || 0) + 1;
      statUpdates.totalLost = (stats?.totalLost || 0) + betAmount;
      statUpdates.highestLoss = Math.max(stats?.highestLoss || 0, betAmount);
    }
    
    await this.updateGameStats(userId, statUpdates);
    
    // Add transaction record
    await this.addGameTransaction({
      userId,
      gameType: GameType.COINFLIP,
      betAmount,
      outcome: won ? 'win' : 'loss',
      winAmount: won ? winAmount : 0,
      gameDetails: { playerChoice: choice, result }
    });
    
    return { 
      success: true, 
      result: `Result: ${result.toUpperCase()}. You ${won ? 'won' : 'lost'}!`, 
      winAmount: won ? winAmount : 0 
    };
  }

  async playBlackjack(userId: number, betAmount: number, playerAction: 'hit' | 'stand' | 'double'): Promise<{ success: boolean; playerHand: string[]; dealerHand: string[]; result: string; winAmount?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, playerHand: [], dealerHand: [], result: 'User not found' };
    if (user.balance < betAmount) return { success: false, playerHand: [], dealerHand: [], result: 'Insufficient balance' };
    
    // Simplified blackjack implementation
    const deck = this.createDeck();
    this.shuffleDeck(deck);
    
    // Initial deal
    const playerHand = [this.drawCard(deck), this.drawCard(deck)];
    const dealerHand = [this.drawCard(deck), this.drawCard(deck)];
    
    // Calculate initial values
    let playerValue = this.calculateHandValue(playerHand);
    let dealerValue = this.calculateHandValue(dealerHand);
    
    // Process player action
    if (playerAction === 'hit') {
      playerHand.push(this.drawCard(deck));
      playerValue = this.calculateHandValue(playerHand);
    } else if (playerAction === 'double' && user.balance >= betAmount * 2) {
      betAmount *= 2;
      playerHand.push(this.drawCard(deck));
      playerValue = this.calculateHandValue(playerHand);
    }
    
    // Check if player busted
    if (playerValue > 21) {
      // Player busts, dealer wins
      await this.updateUserBalance(userId, user.balance - betAmount);
      
      // Update stats
      await this.updateBlackjackStats(userId, betAmount, false, 0);
      
      return {
        success: true,
        playerHand,
        dealerHand,
        result: `Bust! Your hand value: ${playerValue}. You lost ${betAmount} coins.`,
        winAmount: 0
      };
    }
    
    // Dealer plays - dealer must hit until 17 or higher
    while (dealerValue < 17) {
      dealerHand.push(this.drawCard(deck));
      dealerValue = this.calculateHandValue(dealerHand);
    }
    
    // Determine winner
    let result: string;
    let won: boolean;
    let winAmount = 0;
    
    if (dealerValue > 21 || playerValue > dealerValue) {
      // Player wins
      winAmount = betAmount * 2; // Payout 2:1
      await this.updateUserBalance(userId, user.balance - betAmount + winAmount);
      result = `You win! Your hand: ${playerValue}, Dealer: ${dealerValue}. You won ${winAmount} coins.`;
      won = true;
    } else if (playerValue === dealerValue) {
      // Push - return bet
      await this.updateUserBalance(userId, user.balance);
      result = `Push! Your hand: ${playerValue}, Dealer: ${dealerValue}. Your bet has been returned.`;
      won = false;
      winAmount = betAmount; // Return original bet
    } else {
      // Dealer wins
      await this.updateUserBalance(userId, user.balance - betAmount);
      result = `Dealer wins! Your hand: ${playerValue}, Dealer: ${dealerValue}. You lost ${betAmount} coins.`;
      won = false;
    }
    
    // Update stats
    await this.updateBlackjackStats(userId, betAmount, won, winAmount);
    
    return {
      success: true,
      playerHand,
      dealerHand,
      result,
      winAmount
    };
  }
  
  async playSlots(userId: number, betAmount: number): Promise<{ success: boolean; symbols: string[]; result: string; winAmount?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, symbols: [], result: 'User not found' };
    if (user.balance < betAmount) return { success: false, symbols: [], result: 'Insufficient balance' };
    
    // Deduct bet amount first
    await this.updateUserBalance(userId, user.balance - betAmount);
    
    // Spin the slots (3 reels)
    const reels = Array(3).fill(0).map(() => 
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
    );
    
    const symbols = reels.map(reel => reel.symbol);
    
    // Check for wins
    let winAmount = 0;
    let won = false;
    
    // All 3 symbols match
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      const multiplier = SLOT_SYMBOLS.find(s => s.symbol === symbols[0])?.multiplier || 1;
      winAmount = betAmount * multiplier;
      won = true;
    }
    
    // Update user balance if won
    if (won) {
      await this.updateUserBalance(userId, user.balance - betAmount + winAmount);
    }
    
    // Update stats
    const stats = await this.getGameStats(userId);
    const statUpdates: Partial<GameStat> = {
      gamesPlayed: (stats?.gamesPlayed || 0) + 1,
      totalWagered: (stats?.totalWagered || 0) + betAmount,
      lastPlayed: new Date(),
      favoriteGame: GameType.SLOTS
    };
    
    if (won) {
      statUpdates.gamesWon = (stats?.gamesWon || 0) + 1;
      statUpdates.totalWon = (stats?.totalWon || 0) + winAmount;
      statUpdates.highestWin = Math.max(stats?.highestWin || 0, winAmount);
    } else {
      statUpdates.gamesLost = (stats?.gamesLost || 0) + 1;
      statUpdates.totalLost = (stats?.totalLost || 0) + betAmount;
      statUpdates.highestLoss = Math.max(stats?.highestLoss || 0, betAmount);
    }
    
    await this.updateGameStats(userId, statUpdates);
    
    // Add transaction record
    await this.addGameTransaction({
      userId,
      gameType: GameType.SLOTS,
      betAmount,
      outcome: won ? 'win' : 'loss',
      winAmount: won ? winAmount : 0,
      gameDetails: { symbols, reelNames: reels.map(r => r.name) }
    });
    
    let resultMessage: string;
    if (won) {
      resultMessage = `Jackpot! You won ${winAmount} coins!`;
    } else {
      resultMessage = `No match. Better luck next time!`;
    }
    
    return {
      success: true,
      symbols,
      result: resultMessage,
      winAmount: won ? winAmount : 0
    };
  }

  async playCrash(userId: number, betAmount: number, cashoutMultiplier: number): Promise<{ success: boolean; crashPoint: number; result: string; winAmount?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, crashPoint: 0, result: 'User not found' };
    if (user.balance < betAmount) return { success: false, crashPoint: 0, result: 'Insufficient balance' };
    
    // Deduct bet amount first
    await this.updateUserBalance(userId, user.balance - betAmount);
    
    // Generate crash point with house edge
    // Math: Random number with exponential distribution
    // Higher numbers are less likely to occur
    const crashPoint = Math.max(1.0, (Math.random() * 10) + 1);
    const won = cashoutMultiplier <= crashPoint;
    
    let winAmount = 0;
    let result: string;
    
    if (won) {
      // Calculate win amount based on multiplier
      winAmount = Math.floor(betAmount * cashoutMultiplier);
      await this.updateUserBalance(userId, user.balance - betAmount + winAmount);
      result = `You cashed out at ${cashoutMultiplier.toFixed(2)}x and won ${winAmount} coins!`;
    } else {
      result = `Crashed at ${crashPoint.toFixed(2)}x. You lost ${betAmount} coins.`;
    }
    
    // Update stats
    const stats = await this.getGameStats(userId);
    const statUpdates: Partial<GameStat> = {
      gamesPlayed: (stats?.gamesPlayed || 0) + 1,
      totalWagered: (stats?.totalWagered || 0) + betAmount,
      lastPlayed: new Date(),
      favoriteGame: GameType.CRASH
    };
    
    if (won) {
      statUpdates.gamesWon = (stats?.gamesWon || 0) + 1;
      statUpdates.totalWon = (stats?.totalWon || 0) + winAmount;
      statUpdates.highestWin = Math.max(stats?.highestWin || 0, winAmount);
    } else {
      statUpdates.gamesLost = (stats?.gamesLost || 0) + 1;
      statUpdates.totalLost = (stats?.totalLost || 0) + betAmount;
      statUpdates.highestLoss = Math.max(stats?.highestLoss || 0, betAmount);
    }
    
    await this.updateGameStats(userId, statUpdates);
    
    // Add transaction record
    await this.addGameTransaction({
      userId,
      gameType: GameType.CRASH,
      betAmount,
      outcome: won ? 'win' : 'crash',
      winAmount: won ? winAmount : 0,
      gameDetails: { cashoutMultiplier, crashPoint }
    });
    
    return {
      success: true,
      crashPoint,
      result,
      winAmount: won ? winAmount : 0
    };
  }

  async playRoulette(userId: number, betAmount: number, betType: string, betValue: string | number): Promise<{ success: boolean; result: number; winAmount?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, result: 0 };
    if (user.balance < betAmount) return { success: false, result: 0 };
    
    // Deduct bet amount
    await this.updateUserBalance(userId, user.balance - betAmount);
    
    // Generate a random number from 0-36
    const result = Math.floor(Math.random() * 37);
    let won = false;
    let winAmount = 0;
    let payout = 0;
    
    // Check if bet is a winner
    if (betType === 'number' && parseInt(betValue.toString()) === result) {
      // Straight up bet (35:1)
      payout = 35;
      won = true;
    } else if (betType === 'red' && this.isRedNumber(result)) {
      // Red bet (1:1)
      payout = 1;
      won = true;
    } else if (betType === 'black' && this.isBlackNumber(result) && result !== 0) {
      // Black bet (1:1)
      payout = 1;
      won = true;
    } else if (betType === 'even' && result % 2 === 0 && result !== 0) {
      // Even bet (1:1)
      payout = 1;
      won = true;
    } else if (betType === 'odd' && result % 2 !== 0) {
      // Odd bet (1:1)
      payout = 1;
      won = true;
    } else if (betType === 'low' && result >= 1 && result <= 18) {
      // Low bet (1:1)
      payout = 1;
      won = true;
    } else if (betType === 'high' && result >= 19 && result <= 36) {
      // High bet (1:1)
      payout = 1;
      won = true;
    }
    
    if (won) {
      winAmount = betAmount * (payout + 1); // Add original bet back
      await this.updateUserBalance(userId, user.balance - betAmount + winAmount);
    }
    
    // Update stats
    const stats = await this.getGameStats(userId);
    const statUpdates: Partial<GameStat> = {
      gamesPlayed: (stats?.gamesPlayed || 0) + 1,
      totalWagered: (stats?.totalWagered || 0) + betAmount,
      lastPlayed: new Date(),
      favoriteGame: GameType.ROULETTE
    };
    
    if (won) {
      statUpdates.gamesWon = (stats?.gamesWon || 0) + 1;
      statUpdates.totalWon = (stats?.totalWon || 0) + winAmount;
      statUpdates.highestWin = Math.max(stats?.highestWin || 0, winAmount);
    } else {
      statUpdates.gamesLost = (stats?.gamesLost || 0) + 1;
      statUpdates.totalLost = (stats?.totalLost || 0) + betAmount;
      statUpdates.highestLoss = Math.max(stats?.highestLoss || 0, betAmount);
    }
    
    await this.updateGameStats(userId, statUpdates);
    
    // Add transaction record
    await this.addGameTransaction({
      userId,
      gameType: GameType.ROULETTE,
      betAmount,
      outcome: won ? 'win' : 'loss',
      winAmount: won ? winAmount : 0,
      gameDetails: { betType, betValue, result }
    });
    
    return {
      success: true,
      result,
      winAmount: won ? winAmount : 0
    };
  }

  async playDice(userId: number, betAmount: number, prediction: 'higher' | 'lower', targetNumber: number): Promise<{ success: boolean; roll: number; result: string; winAmount?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, roll: 0, result: 'User not found' };
    if (user.balance < betAmount) return { success: false, roll: 0, result: 'Insufficient balance' };
    
    // Validate target number
    if (targetNumber < 1 || targetNumber > 100) {
      return { success: false, roll: 0, result: 'Target number must be between 1 and 100' };
    }
    
    // Deduct bet amount
    await this.updateUserBalance(userId, user.balance - betAmount);
    
    // Roll the dice (1-100)
    const roll = Math.floor(Math.random() * 100) + 1;
    
    // Determine if bet is a winner
    let won = false;
    if (prediction === 'higher' && roll > targetNumber) {
      won = true;
    } else if (prediction === 'lower' && roll < targetNumber) {
      won = true;
    }
    
    // Calculate win multiplier and amount
    // Higher risk (more unlikely predictions) should have higher rewards
    let multiplier = 0;
    if (prediction === 'higher') {
      // e.g., predicting higher than 90 is hard, so multiplier should be high
      multiplier = 100 / (100 - targetNumber);
    } else {
      // e.g., predicting lower than 10 is hard, so multiplier should be high
      multiplier = 100 / targetNumber;
    }
    
    // Cap the multiplier at a reasonable value
    multiplier = Math.min(multiplier, 10);
    
    let winAmount = 0;
    if (won) {
      winAmount = Math.floor(betAmount * multiplier);
      await this.updateUserBalance(userId, user.balance - betAmount + winAmount);
    }
    
    // Update stats
    const stats = await this.getGameStats(userId);
    const statUpdates: Partial<GameStat> = {
      gamesPlayed: (stats?.gamesPlayed || 0) + 1,
      totalWagered: (stats?.totalWagered || 0) + betAmount,
      lastPlayed: new Date(),
      favoriteGame: GameType.DICE
    };
    
    if (won) {
      statUpdates.gamesWon = (stats?.gamesWon || 0) + 1;
      statUpdates.totalWon = (stats?.totalWon || 0) + winAmount;
      statUpdates.highestWin = Math.max(stats?.highestWin || 0, winAmount);
    } else {
      statUpdates.gamesLost = (stats?.gamesLost || 0) + 1;
      statUpdates.totalLost = (stats?.totalLost || 0) + betAmount;
      statUpdates.highestLoss = Math.max(stats?.highestLoss || 0, betAmount);
    }
    
    await this.updateGameStats(userId, statUpdates);
    
    // Add transaction record
    await this.addGameTransaction({
      userId,
      gameType: GameType.DICE,
      betAmount,
      outcome: won ? 'win' : 'loss',
      winAmount: won ? winAmount : 0,
      gameDetails: { prediction, targetNumber, roll }
    });
    
    let resultText = `Rolled: ${roll}. Target: ${targetNumber}. `;
    resultText += won ? `You won ${winAmount} coins!` : `You lost ${betAmount} coins.`;
    
    return {
      success: true,
      roll,
      result: resultText,
      winAmount: won ? winAmount : 0
    };
  }

  // HELPER FUNCTIONS
  private createDeck(): string[] {
    const suits = ['H', 'D', 'C', 'S']; // Hearts, Diamonds, Clubs, Spades
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: string[] = [];
    
    for (const suit of suits) {
      for (const value of values) {
        deck.push(`${value}${suit}`);
      }
    }
    
    return deck;
  }

  private shuffleDeck(deck: string[]): void {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  private drawCard(deck: string[]): string {
    if (deck.length === 0) throw new Error('Deck is empty');
    return deck.pop()!;
  }

  private calculateHandValue(hand: string[]): number {
    let value = 0;
    let aceCount = 0;
    
    for (const card of hand) {
      const cardValue = card.slice(0, -1); // Remove the suit
      
      if (cardValue === 'A') {
        aceCount++;
        value += 11;
      } else if (['K', 'Q', 'J'].includes(cardValue)) {
        value += 10;
      } else {
        value += parseInt(cardValue);
      }
    }
    
    // Adjust for aces if needed
    while (value > 21 && aceCount > 0) {
      value -= 10; // Change an ace from 11 to 1
      aceCount--;
    }
    
    return value;
  }

  private async updateBlackjackStats(userId: number, betAmount: number, won: boolean, winAmount: number): Promise<void> {
    const stats = await this.getGameStats(userId);
    const statUpdates: Partial<GameStat> = {
      gamesPlayed: (stats?.gamesPlayed || 0) + 1,
      totalWagered: (stats?.totalWagered || 0) + betAmount,
      lastPlayed: new Date(),
      favoriteGame: GameType.BLACKJACK
    };
    
    if (won) {
      statUpdates.gamesWon = (stats?.gamesWon || 0) + 1;
      statUpdates.totalWon = (stats?.totalWon || 0) + winAmount;
      statUpdates.highestWin = Math.max(stats?.highestWin || 0, winAmount);
    } else {
      statUpdates.gamesLost = (stats?.gamesLost || 0) + 1;
      statUpdates.totalLost = (stats?.totalLost || 0) + betAmount;
      statUpdates.highestLoss = Math.max(stats?.highestLoss || 0, betAmount);
    }
    
    await this.updateGameStats(userId, statUpdates);
    
    // Add transaction record
    await this.addGameTransaction({
      userId,
      gameType: GameType.BLACKJACK,
      betAmount,
      outcome: won ? 'win' : 'loss',
      winAmount: won ? winAmount : 0,
      gameDetails: { won }
    });
  }

  private isRedNumber(num: number): boolean {
    // In roulette, these numbers are red
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num);
  }

  private isBlackNumber(num: number): boolean {
    if (num === 0) return false;
    return !this.isRedNumber(num);
  }

  // JACKPOT POOLS MANAGEMENT
  async getJackpotPools(activeOnly = true): Promise<JackpotPool[]> {
    let query = db.select().from(jackpotPools);
    
    if (activeOnly) {
      query = query.where(eq(jackpotPools.isActive, true));
    }
    
    return query.orderBy(desc(jackpotPools.currentAmount));
  }
  
  async getJackpotPool(poolId: number): Promise<JackpotPool | undefined> {
    const [pool] = await db
      .select()
      .from(jackpotPools)
      .where(eq(jackpotPools.id, poolId));
      
    return pool || undefined;
  }
  
  async createJackpotPool(pool: InsertJackpotPool): Promise<JackpotPool> {
    const [newPool] = await db
      .insert(jackpotPools)
      .values(pool)
      .returning();
      
    return newPool;
  }
  
  async updateJackpotPool(poolId: number, updates: Partial<JackpotPool>): Promise<JackpotPool | undefined> {
    const [updatedPool] = await db
      .update(jackpotPools)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(jackpotPools.id, poolId))
      .returning();
      
    return updatedPool || undefined;
  }
  
  async contributeToJackpot(poolId: number, amount: number): Promise<JackpotPool | undefined> {
    const pool = await this.getJackpotPool(poolId);
    if (!pool || !pool.isActive) {
      return undefined;
    }
    
    const [updatedPool] = await db
      .update(jackpotPools)
      .set({ 
        currentAmount: sql`${jackpotPools.currentAmount} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(jackpotPools.id, poolId))
      .returning();
      
    return updatedPool || undefined;
  }
  
  async awardJackpot(poolId: number, userId: number, amount: number): Promise<JackpotPool | undefined> {
    // Get the pool
    const pool = await this.getJackpotPool(poolId);
    if (!pool || !pool.isActive || pool.currentAmount < amount) {
      return undefined;
    }
    
    // Get the user
    const user = await this.getUser(userId);
    if (!user) {
      return undefined;
    }
    
    // Award the jackpot to the user
    await this.updateUserBalance(userId, user.balance + amount);
    
    // Add transaction
    await this.addGameTransaction({
      userId,
      gameType: 'multiplier',
      betAmount: 0, // Not applicable for jackpot win
      outcome: 'jackpot',
      winAmount: amount,
      gameDetails: { poolId, poolName: pool.name }
    });
    
    // Update pool
    const [updatedPool] = await db
      .update(jackpotPools)
      .set({ 
        currentAmount: pool.seedAmount, // Reset to seed amount
        lastWon: new Date(),
        winningUserId: userId,
        winningAmount: amount,
        updatedAt: new Date()
      })
      .where(eq(jackpotPools.id, poolId))
      .returning();
      
    return updatedPool || undefined;
  }
  
  // MULTIPLIER GAME MANAGEMENT
  async getMultiplierGames(activeOnly = true): Promise<MultiplierGame[]> {
    let query = db.select().from(multiplierGames);
    
    if (activeOnly) {
      query = query.where(eq(multiplierGames.isActive, true));
    }
    
    return query.orderBy(multiplierGames.name);
  }
  
  async getMultiplierGame(gameId: number): Promise<MultiplierGame | undefined> {
    const [game] = await db
      .select()
      .from(multiplierGames)
      .where(eq(multiplierGames.id, gameId));
      
    return game || undefined;
  }
  
  async createMultiplierGame(game: InsertMultiplierGame): Promise<MultiplierGame> {
    const [newGame] = await db
      .insert(multiplierGames)
      .values(game)
      .returning();
      
    return newGame;
  }
  
  async updateMultiplierGame(gameId: number, updates: Partial<MultiplierGame>): Promise<MultiplierGame | undefined> {
    const [updatedGame] = await db
      .update(multiplierGames)
      .set({ 
        ...updates, 
        updatedAt: new Date() 
      })
      .where(eq(multiplierGames.id, gameId))
      .returning();
      
    return updatedGame || undefined;
  }
  
  async playMultiplierGame(userId: number, gameId: number, betAmount: number, targetMultiplier: number): Promise<{ 
    success: boolean; 
    result: string; 
    multiplier: number; 
    winAmount?: number;
    crashPoint?: number;
    jackpotWon?: boolean;
    jackpotAmount?: number;
    freeGamesWon?: number;
    freeGamesMultiplier?: number;
  }> {
    // Get user
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, result: "User not found", multiplier: 0 };
    }
    
    // Get game config
    const game = await this.getMultiplierGame(gameId);
    if (!game || !game.isActive) {
      return { success: false, result: "Game not available", multiplier: 0 };
    }
    
    // Check if user has enough balance
    if (user.balance < betAmount) {
      return { success: false, result: "Insufficient balance", multiplier: 0 };
    }
    
    // Check if bet amount is within limits
    if (betAmount < game.minBet || betAmount > game.maxBet) {
      return { success: false, result: `Bet amount must be between ${game.minBet} and ${game.maxBet}`, multiplier: 0 };
    }
    
    // Check if target multiplier is valid
    if (targetMultiplier < 1.01 || targetMultiplier > Number(game.maxMultiplier)) {
      return { success: false, result: `Target multiplier must be between 1.01 and ${game.maxMultiplier}`, multiplier: 0 };
    }
    
    // Generate crash point using formula with house edge
    const houseEdgeDecimal = Number(game.houseEdge);
    const crashChanceDivisor = Number(game.crashChanceDivisor);
    const crashPointFloat = Math.max(1.0, (1 - houseEdgeDecimal) / (Math.random() / crashChanceDivisor));
    const crashPoint = parseFloat(crashPointFloat.toFixed(2));
    
    // Check if user cashed out before crash
    const won = targetMultiplier <= crashPoint;
    const multiplier = won ? targetMultiplier : crashPoint;
    const winAmount = won ? Math.floor(betAmount * targetMultiplier) : 0;
    
    // Initialize extra reward variables
    let jackpotWon = false;
    let jackpotAmount = 0;
    let freeGamesWon = 0;
    let freeGamesMultiplier = 0;
    
    // Check for jackpot (very rare random chance on win, higher with higher bets)
    if (won && Math.random() < 0.001 * (betAmount / 100)) {
      // Get active jackpot pools
      const pools = await this.getJackpotPools(true);
      if (pools.length > 0) {
        // Select a random pool
        const randomPool = pools[Math.floor(Math.random() * pools.length)];
        jackpotWon = true;
        jackpotAmount = randomPool.currentAmount;
        
        // Award jackpot
        await this.awardJackpot(randomPool.id, userId, jackpotAmount);
      }
    }
    
    // Check for free games (moderate chance on high multiplier wins)
    if (won && targetMultiplier >= 5 && Math.random() < 0.03 * (targetMultiplier / 10)) {
      freeGamesWon = Math.floor(Math.random() * 10) + 1; // 1-10 free games
      freeGamesMultiplier = parseFloat((Math.random() * 1.5 + 1).toFixed(2)); // 1.0-2.5x multiplier
      
      // Add free games to user
      await this.addUserFreeGames({
        userId,
        gameType: 'multiplier',
        remainingGames: freeGamesWon,
        multiplier: freeGamesMultiplier,
        betAmount: betAmount,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 1 week
      });
    }
    
    // Update user balance
    const newBalance = won ? user.balance + winAmount - betAmount : user.balance - betAmount;
    await this.updateUserBalance(userId, newBalance);
    
    // Update game stats
    await this.updateGameStats(userId, {
      gamesPlayed: sql`${gameStats.gamesPlayed} + 1`,
      gamesWon: won ? sql`${gameStats.gamesWon} + 1` : gameStats.gamesWon,
      gamesLost: !won ? sql`${gameStats.gamesLost} + 1` : gameStats.gamesLost,
      totalWagered: sql`${gameStats.totalWagered} + ${betAmount}`,
      totalWon: won ? sql`${gameStats.totalWon} + ${winAmount}` : gameStats.totalWon,
      totalLost: !won ? sql`${gameStats.totalLost} + ${betAmount}` : gameStats.totalLost,
      highestWin: won ? sql`GREATEST(${gameStats.highestWin}, ${winAmount})` : gameStats.highestWin,
      highestLoss: !won ? sql`GREATEST(${gameStats.highestLoss}, ${betAmount})` : gameStats.highestLoss,
      favoriteGame: 'multiplier',
      lastPlayed: new Date()
    });
    
    // Contribute to jackpot pools (small percentage of each bet)
    const activePools = await this.getJackpotPools(true);
    for (const pool of activePools) {
      const contribution = Math.floor(betAmount * Number(pool.incrementRate));
      if (contribution > 0) {
        await this.contributeToJackpot(pool.id, contribution);
      }
    }
    
    // Add transaction
    await this.addGameTransaction({
      userId,
      gameType: 'multiplier',
      betAmount,
      outcome: won ? (jackpotWon ? 'jackpot' : (freeGamesWon > 0 ? 'bonus' : 'win')) : 'crash',
      winAmount: won ? winAmount : 0,
      gameDetails: { 
        gameId,
        gameName: game.name,
        targetMultiplier,
        crashPoint,
        jackpotWon,
        jackpotAmount,
        freeGamesWon,
        freeGamesMultiplier
      }
    });
    
    // Prepare result message
    let result = '';
    if (!won) {
      result = `💥 Game crashed at ${crashPoint}x before your cashout at ${targetMultiplier}x. You lost ${betAmount} coins.`;
    } else {
      result = `📈 Cashed out at ${targetMultiplier}x before crash at ${crashPoint}x. You won ${winAmount} coins!`;
      
      if (jackpotWon) {
        result += ` 🎊 JACKPOT! You also won a jackpot of ${jackpotAmount} coins!`;
      }
      
      if (freeGamesWon > 0) {
        result += ` 🎁 You won ${freeGamesWon} free games with a ${freeGamesMultiplier}x multiplier!`;
      }
    }
    
    return { 
      success: true, 
      result,
      multiplier: Number(multiplier),
      winAmount: won ? winAmount : 0,
      crashPoint,
      jackpotWon,
      jackpotAmount,
      freeGamesWon,
      freeGamesMultiplier
    };
  }
  
  // FREE GAMES MANAGEMENT
  async getUserFreeGames(userId: number, gameType?: GameType): Promise<FreeGame[]> {
    let query = db
      .select()
      .from(freeGames)
      .where(and(
        eq(freeGames.userId, userId),
        sql`${freeGames.remainingGames} > 0`,
        sql`(${freeGames.expiresAt} IS NULL OR ${freeGames.expiresAt} > NOW())`
      ));
    
    if (gameType) {
      query = query.where(eq(freeGames.gameType, gameType));
    }
    
    return query.orderBy(freeGames.expiresAt);
  }
  
  async addUserFreeGames(freeGame: InsertFreeGame): Promise<FreeGame> {
    const [newFreeGame] = await db
      .insert(freeGames)
      .values(freeGame)
      .returning();
      
    return newFreeGame;
  }
  
  async useUserFreeGame(freeGameId: number): Promise<FreeGame | undefined> {
    // Get the free game
    const [freeGame] = await db
      .select()
      .from(freeGames)
      .where(eq(freeGames.id, freeGameId));
      
    if (!freeGame || freeGame.remainingGames <= 0) {
      return undefined;
    }
    
    // Check if expired
    if (freeGame.expiresAt && new Date(freeGame.expiresAt) < new Date()) {
      return undefined;
    }
    
    // Decrement remaining games
    const [updatedFreeGame] = await db
      .update(freeGames)
      .set({ remainingGames: freeGame.remainingGames - 1 })
      .where(eq(freeGames.id, freeGameId))
      .returning();
      
    return updatedFreeGame || undefined;
  }
  
  // REAL MONEY TRANSACTIONS
  async createRealMoneyTransaction(transaction: InsertRealMoneyTransaction): Promise<RealMoneyTransaction> {
    const [newTransaction] = await db
      .insert(realMoneyTransactions)
      .values(transaction)
      .returning();
      
    return newTransaction;
  }
  
  async getUserRealMoneyTransactions(userId: number, limit = 10): Promise<RealMoneyTransaction[]> {
    const transactions = await db
      .select()
      .from(realMoneyTransactions)
      .where(eq(realMoneyTransactions.userId, userId))
      .orderBy(desc(realMoneyTransactions.createdAt))
      .limit(limit);
      
    return transactions;
  }
  
  async updateRealMoneyTransactionStatus(transactionId: number, status: string, details?: any): Promise<RealMoneyTransaction | undefined> {
    let updateObj: any = { 
      status, 
      updatedAt: new Date()
    };
    
    if (details) {
      updateObj.details = details;
    }
    
    const [updatedTransaction] = await db
      .update(realMoneyTransactions)
      .set(updateObj)
      .where(eq(realMoneyTransactions.id, transactionId))
      .returning();
      
    return updatedTransaction || undefined;
  }
}

// Use the DatabaseStorage implementation instead of MemStorage
export const storage = new DatabaseStorage();
