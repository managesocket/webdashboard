import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertGameStatSchema, 
  insertGameTransactionSchema,
  insertJackpotPoolSchema,
  insertMultiplierGameSchema,
  insertFreeGameSchema,
  insertRealMoneyTransactionSchema,
  GameType
} from "@shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const apiPrefix = "/api";
  
  // Error handler middleware
  const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => 
    (req: Request, res: Response) => {
      Promise.resolve(fn(req, res)).catch(err => {
        console.error("Error in route handler:", err);
        res.status(500).json({ error: err.message || "Internal server error" });
      });
    };
  
  // Test database connection
  app.get(`${apiPrefix}/db-test`, asyncHandler(async (req, res) => {
    try {
      // Test a simple query to verify database connection
      const result = await db.execute(sql`SELECT NOW() AS server_time`);
      res.json({
        success: true,
        message: "Database connection is working!",
        serverTime: result.rows?.[0]?.server_time || new Date().toISOString(),
        databaseType: "PostgreSQL"
      });
    } catch (error: any) {
      console.error("Database connection error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to connect to database",
        error: error.message || "Unknown error"
      });
    }
  }));

  // User routes
  app.get(`${apiPrefix}/users/:discordId`, asyncHandler(async (req, res) => {
    const { discordId } = req.params;
    const user = await storage.getUserByDiscordId(discordId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  }));
  
  app.post(`${apiPrefix}/users`, asyncHandler(async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));
  
  // Game stats routes
  app.get(`${apiPrefix}/stats/:userId`, asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const stats = await storage.getGameStats(userId);
    
    if (!stats) {
      return res.status(404).json({ error: "Stats not found for user" });
    }
    
    res.json(stats);
  }));
  
  // Transactions routes
  app.get(`${apiPrefix}/transactions/:userId`, asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const transactions = await storage.getTransactionsByUserId(userId, limit);
    res.json(transactions);
  }));
  
  // Leaderboard routes
  app.get(`${apiPrefix}/leaderboard/balance`, asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const topUsers = await storage.getTopBalances(limit);
    res.json(topUsers);
  }));
  
  app.get(`${apiPrefix}/leaderboard/wins`, asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const topWinners = await storage.getTopWinners(limit);
    res.json(topWinners);
  }));
  
  app.get(`${apiPrefix}/leaderboard/winrate`, asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const topWinRates = await storage.getTopWinRate(limit);
    res.json(topWinRates);
  }));
  
  // Currency generation routes
  app.post(`${apiPrefix}/daily/:userId`, asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const result = await storage.claimDaily(userId);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: "Daily already claimed", 
        cooldown: result.cooldown 
      });
    }
    
    res.json({ success: true, amount: result.amount });
  }));
  
  app.post(`${apiPrefix}/work/:userId`, asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const result = await storage.claimWork(userId);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: "Work already claimed", 
        cooldown: result.cooldown 
      });
    }
    
    res.json({ success: true, amount: result.amount });
  }));
  
  // Game routes
  
  // Coinflip
  app.post(`${apiPrefix}/games/coinflip`, asyncHandler(async (req, res) => {
    const schema = z.object({
      userId: z.number(),
      betAmount: z.number().positive(),
      choice: z.enum(['heads', 'tails'])
    });
    
    try {
      const { userId, betAmount, choice } = schema.parse(req.body);
      const result = await storage.playCoinflip(userId, betAmount, choice);
      
      if (!result.success) {
        return res.status(400).json({ error: result.result });
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));
  
  // Blackjack
  app.post(`${apiPrefix}/games/blackjack`, asyncHandler(async (req, res) => {
    const schema = z.object({
      userId: z.number(),
      betAmount: z.number().positive(),
      playerAction: z.enum(['hit', 'stand', 'double'])
    });
    
    try {
      const { userId, betAmount, playerAction } = schema.parse(req.body);
      const result = await storage.playBlackjack(userId, betAmount, playerAction);
      
      if (!result.success) {
        return res.status(400).json({ error: result.result });
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));
  
  // Slots
  app.post(`${apiPrefix}/games/slots`, asyncHandler(async (req, res) => {
    const schema = z.object({
      userId: z.number(),
      betAmount: z.number().positive()
    });
    
    try {
      const { userId, betAmount } = schema.parse(req.body);
      const result = await storage.playSlots(userId, betAmount);
      
      if (!result.success) {
        return res.status(400).json({ error: result.result });
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));
  
  // Crash
  app.post(`${apiPrefix}/games/crash`, asyncHandler(async (req, res) => {
    const schema = z.object({
      userId: z.number(),
      betAmount: z.number().positive(),
      cashoutMultiplier: z.number().positive()
    });
    
    try {
      const { userId, betAmount, cashoutMultiplier } = schema.parse(req.body);
      const result = await storage.playCrash(userId, betAmount, cashoutMultiplier);
      
      if (!result.success) {
        return res.status(400).json({ error: result.result });
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));
  
  // Roulette
  app.post(`${apiPrefix}/games/roulette`, asyncHandler(async (req, res) => {
    const schema = z.object({
      userId: z.number(),
      betAmount: z.number().positive(),
      betType: z.enum(['number', 'color', 'even_odd', 'dozen', 'high_low']),
      betValue: z.union([z.string(), z.number()])
    });
    
    try {
      const { userId, betAmount, betType, betValue } = schema.parse(req.body);
      const result = await storage.playRoulette(userId, betAmount, betType, betValue);
      
      if (!result.success) {
        return res.status(400).json({ error: "Failed to play roulette" });
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));
  
  // Dice
  app.post(`${apiPrefix}/games/dice`, asyncHandler(async (req, res) => {
    const schema = z.object({
      userId: z.number(),
      betAmount: z.number().positive(),
      prediction: z.enum(['higher', 'lower']),
      targetNumber: z.number().min(1).max(100)
    });
    
    try {
      const { userId, betAmount, prediction, targetNumber } = schema.parse(req.body);
      const result = await storage.playDice(userId, betAmount, prediction, targetNumber);
      
      if (!result.success) {
        return res.status(400).json({ error: result.result });
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));

  // ============== MULTIPLIER GAME ROUTES ================
  
  // Get all multiplier games
  app.get(`${apiPrefix}/multiplier-games`, asyncHandler(async (req, res) => {
    const activeOnly = req.query.activeOnly !== 'false';
    const games = await storage.getMultiplierGames(activeOnly);
    res.json(games);
  }));

  // Get a specific multiplier game
  app.get(`${apiPrefix}/multiplier-games/:id`, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const game = await storage.getMultiplierGame(id);
    
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    res.json(game);
  }));

  // Create a new multiplier game (admin only)
  app.post(`${apiPrefix}/multiplier-games`, asyncHandler(async (req, res) => {
    try {
      const schema = insertMultiplierGameSchema;
      const game = schema.parse(req.body);
      const newGame = await storage.createMultiplierGame(game);
      res.status(201).json(newGame);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));

  // Update a multiplier game (admin only)
  app.patch(`${apiPrefix}/multiplier-games/:id`, asyncHandler(async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedGame = await storage.updateMultiplierGame(id, updates);
      
      if (!updatedGame) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      res.json(updatedGame);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));

  // Play a multiplier game
  app.post(`${apiPrefix}/play-multiplier`, asyncHandler(async (req, res) => {
    try {
      const schema = z.object({
        userId: z.number(),
        gameId: z.number(),
        betAmount: z.number().positive(),
        targetMultiplier: z.number().positive()
      });
      
      const { userId, gameId, betAmount, targetMultiplier } = schema.parse(req.body);
      const result = await storage.playMultiplierGame(userId, gameId, betAmount, targetMultiplier);
      
      if (!result.success) {
        return res.status(400).json({ error: result.result });
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));

  // ============== JACKPOT POOL ROUTES ================
  
  // Get all jackpot pools
  app.get(`${apiPrefix}/jackpot-pools`, asyncHandler(async (req, res) => {
    const activeOnly = req.query.activeOnly !== 'false';
    const pools = await storage.getJackpotPools(activeOnly);
    res.json(pools);
  }));

  // Get a specific jackpot pool
  app.get(`${apiPrefix}/jackpot-pools/:id`, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const pool = await storage.getJackpotPool(id);
    
    if (!pool) {
      return res.status(404).json({ error: "Jackpot pool not found" });
    }
    
    res.json(pool);
  }));

  // Create a new jackpot pool (admin only)
  app.post(`${apiPrefix}/jackpot-pools`, asyncHandler(async (req, res) => {
    try {
      const schema = insertJackpotPoolSchema;
      const pool = schema.parse(req.body);
      const newPool = await storage.createJackpotPool(pool);
      res.status(201).json(newPool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));

  // Update a jackpot pool (admin only)
  app.patch(`${apiPrefix}/jackpot-pools/:id`, asyncHandler(async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedPool = await storage.updateJackpotPool(id, updates);
      
      if (!updatedPool) {
        return res.status(404).json({ error: "Jackpot pool not found" });
      }
      
      res.json(updatedPool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));

  // ============== FREE GAMES ROUTES ================
  
  // Get user's free games
  app.get(`${apiPrefix}/free-games/:userId`, asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const gameType = req.query.gameType as GameType | undefined;
    const freeGames = await storage.getUserFreeGames(userId, gameType);
    res.json(freeGames);
  }));

  // Use a free game
  app.post(`${apiPrefix}/free-games/:id/use`, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const updatedFreeGame = await storage.useUserFreeGame(id);
    
    if (!updatedFreeGame) {
      return res.status(404).json({ error: "Free game not found or expired" });
    }
    
    res.json(updatedFreeGame);
  }));

  // ============== REAL MONEY TRANSACTION ROUTES ================
  
  // Get user's real money transactions
  app.get(`${apiPrefix}/real-money-transactions/:userId`, asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const transactions = await storage.getUserRealMoneyTransactions(userId, limit);
    res.json(transactions);
  }));

  // Create a new real money transaction
  app.post(`${apiPrefix}/real-money-transactions`, asyncHandler(async (req, res) => {
    try {
      const schema = insertRealMoneyTransactionSchema;
      const transaction = schema.parse(req.body);
      const newTransaction = await storage.createRealMoneyTransaction(transaction);
      res.status(201).json(newTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));

  // Update a real money transaction status
  app.patch(`${apiPrefix}/real-money-transactions/:id/status`, asyncHandler(async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, details } = req.body;
      const updatedTransaction = await storage.updateRealMoneyTransactionStatus(id, status, details);
      
      if (!updatedTransaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  }));

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time multiplier games
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/multiplier' });
  
  // WebSocket handling for real-time games
  wss.on('connection', (ws) => {
    console.log('Client connected to multiplier game WebSocket');
    
    // Send current active jackpot pools on connection
    storage.getJackpotPools(true).then(pools => {
      ws.send(JSON.stringify({
        type: 'jackpot_pools',
        data: pools
      }));
    });
    
    // Handle incoming messages from clients
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'play_game') {
          // Play a game
          const { userId, gameId, betAmount, targetMultiplier } = data;
          const result = await storage.playMultiplierGame(
            userId, 
            gameId, 
            betAmount, 
            targetMultiplier
          );
          
          // Send result back to the client
          ws.send(JSON.stringify({
            type: 'game_result',
            data: result
          }));
          
          // If successful, broadcast jackpot updates to all clients
          if (result.success) {
            const updatedPools = await storage.getJackpotPools(true);
            
            // Broadcast to all connected clients
            wss.clients.forEach(client => {
              if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify({
                  type: 'jackpot_pools',
                  data: updatedPools
                }));
              }
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format or server error'
        }));
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('Client disconnected from multiplier game WebSocket');
    });
  });
  
  return httpServer;
}
