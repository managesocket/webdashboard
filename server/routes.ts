import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertGameStatSchema, insertGameTransactionSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
